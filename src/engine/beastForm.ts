import { BEAST_ABILITY_KEYS, type BeastForm, type Bonus, type Character, type StatField } from '../types/character';
import { buildBonusIndex } from './bonusIndex';
import { computeAbilityScores } from './computeAbilityScores';
import { computeStatField, type ComputeContext } from './computeStatField';
import { proficiencyBonusForLevel } from './proficiencyBonus';

export interface BeastFormView {
  /** Персонаж с подставленными значениями облика — его рендерят read-view секции. */
  character: Character;
  form?: BeastForm;
  /** id полей, значения которых сейчас взяты от зверя (для подсветки). */
  overriddenFieldIds: ReadonlySet<string>;
}

const EMPTY_SET: ReadonlySet<string> = new Set();
const cache = new WeakMap<Character, BeastFormView>();

export function getActiveBeastForm(character: Character): BeastForm | undefined {
  if (!character.activeBeastFormId) return undefined;
  return character.beastForms.find((f) => f.id === character.activeBeastFormId);
}

/** Поле с фиксированным значением зверя: без модификатора характеристики и владения. */
function replaceValue(field: StatField, baseValue: number): StatField {
  return { ...field, baseValue, linkedAbility: undefined, proficient: undefined, bonusIds: [] };
}

/**
 * Строит «эффективного» персонажа в облике по правилам Дикого облика (5e, 2014):
 * - СИЛ/ЛОВ/ТЕЛ, КД, скорость, хиты и атаки берутся от зверя;
 * - ИНТ/МДР/ХАР, владения, умения остаются от персонажа;
 * - бонусы, навешанные на заменённые поля, не действуют (снаряжение сливается с формой);
 * - навык: если у зверя бонус выше, чем у персонажа (с характеристиками зверя), берётся бонус зверя.
 *
 * Кэшируется по ссылке на Character (как getComputeContext), поэтому возвращает стабильные ссылки.
 */
export function getBeastFormView(character: Character): BeastFormView {
  const cached = cache.get(character);
  if (cached) return cached;

  const form = getActiveBeastForm(character);
  const view = form ? buildView(character, form) : { character, overriddenFieldIds: EMPTY_SET };
  cache.set(character, view);
  return view;
}

function buildView(character: Character, form: BeastForm): BeastFormView {
  const { combat } = character;
  const overridden = new Set<string>([combat.hpMax.id, combat.ac.id, combat.speed.id]);

  const abilities = { ...character.abilities };
  for (const key of BEAST_ABILITY_KEYS) {
    abilities[key] = { ...abilities[key], baseValue: form.abilities[key], bonusIds: [] };
    overridden.add(abilities[key].id);
  }

  const base: Character = {
    ...character,
    abilities,
    combat: {
      ...combat,
      hpMax: replaceValue(combat.hpMax, form.hpMax),
      hpCurrent: form.hpCurrent,
      ac: replaceValue(combat.ac, form.ac),
      speed: replaceValue(combat.speed, form.speed),
    },
    attacks: form.attacks,
    bonuses: character.bonuses.filter((b) => !overridden.has(b.appliesTo)),
  };

  const ctx: ComputeContext = {
    abilityScores: computeAbilityScores(base),
    proficiencyBonus: proficiencyBonusForLevel(base.meta.level),
    bonusIndex: buildBonusIndex(base.bonuses),
  };

  const beastSkillBonuses: Bonus[] = [];
  for (const beastSkill of form.skills) {
    const skill = base.skills.find((s) => s.id === beastSkill.skillId);
    if (!skill) continue;
    const ownTotal = computeStatField(skill, ctx).flatTotal;
    if (beastSkill.value <= ownTotal) continue;
    beastSkillBonuses.push({
      id: `beast-${form.id}-${skill.id}`,
      label: `Облик «${form.name}»`,
      type: 'fixed',
      value: beastSkill.value - ownTotal,
      appliesTo: skill.id,
    });
    overridden.add(skill.id);
  }

  const effective = beastSkillBonuses.length > 0 ? { ...base, bonuses: [...base.bonuses, ...beastSkillBonuses] } : base;
  return { character: effective, form, overriddenFieldIds: overridden };
}

export interface HpPools {
  temp: number;
  formHp: number;
  ownHp: number;
}

/**
 * Урон в облике (2014): сначала временные хиты, затем хиты облика;
 * когда они кончаются, облик спадает, а остаток урона переходит на хиты персонажа.
 */
export function applyBeastFormDamage(pools: HpPools, damage: number): HpPools & { reverted: boolean; overflow: number } {
  let remaining = Math.max(0, damage);

  const absorbedByTemp = Math.min(pools.temp, remaining);
  const temp = pools.temp - absorbedByTemp;
  remaining -= absorbedByTemp;

  const formHp = Math.max(0, pools.formHp - remaining);
  const overflow = Math.max(0, remaining - pools.formHp);
  const reverted = formHp === 0;

  return { temp, formHp, ownHp: Math.max(0, pools.ownHp - overflow), reverted, overflow };
}
