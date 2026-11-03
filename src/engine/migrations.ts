import {
  ABILITY_KEYS,
  ABILITY_LABELS,
  BEAST_ABILITY_KEYS,
  CURRENT_SCHEMA_VERSION,
  type Attack,
  type BeastForm,
  type BeastSkill,
  type Cantrip,
  type Character,
  type EquipmentItem,
  type SpellbookEntry,
  SPELL_DETAIL_TEXT_KEYS,
  type SpellDetails,
  type SpellcastingBlock,
  type SpellSlotLevel,
  type StatField,
} from '../types/character';
import { newId } from '../utils/id';
import { createDefaultSkills, createEmptySpellSlots } from './defaultTemplates';
import { syncBonusIds } from './statFieldRegistry';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function ensureEquipmentItem(value: unknown): EquipmentItem {
  const obj = asRecord(value);
  return {
    id: typeof obj.id === 'string' ? obj.id : newId(),
    name: typeof obj.name === 'string' ? obj.name : '',
    note: typeof obj.note === 'string' ? obj.note : '',
    quantity: typeof obj.quantity === 'number' && obj.quantity >= 0 ? obj.quantity : 1,
    icon: typeof obj.icon === 'string' ? obj.icon : undefined,
  };
}

/** Необязательные параметры заклинания: в результат попадают только реально заданные значения. */
function ensureSpellDetails(obj: Record<string, unknown>): SpellDetails {
  const details: SpellDetails = {};
  for (const key of SPELL_DETAIL_TEXT_KEYS) {
    const value = obj[key];
    if (typeof value === 'string' && value.trim()) details[key] = value;
  }
  if (obj.concentration === true) details.concentration = true;
  if (obj.ritual === true) details.ritual = true;
  return details;
}

function ensureCantrip(value: unknown): Cantrip {
  // старая схема хранила заговоры как простые строки
  if (typeof value === 'string') {
    return { id: newId(), name: value, description: '' };
  }
  const obj = asRecord(value);
  return {
    id: typeof obj.id === 'string' ? obj.id : newId(),
    name: typeof obj.name === 'string' ? obj.name : '',
    description: typeof obj.description === 'string' ? obj.description : '',
    icon: typeof obj.icon === 'string' ? obj.icon : undefined,
    ...ensureSpellDetails(obj),
  };
}

function ensureSpellbookEntry(value: unknown): SpellbookEntry {
  const obj = asRecord(value);
  return {
    id: typeof obj.id === 'string' ? obj.id : newId(),
    name: typeof obj.name === 'string' ? obj.name : '',
    level: typeof obj.level === 'number' ? obj.level : 0,
    prepared: typeof obj.prepared === 'boolean' ? obj.prepared : false,
    description: typeof obj.description === 'string' ? obj.description : '',
    icon: typeof obj.icon === 'string' ? obj.icon : undefined,
    ...ensureSpellDetails(obj),
  };
}

function ensureSpellcasting(value: unknown): SpellcastingBlock | undefined {
  if (!value) return undefined;
  const obj = asRecord(value);
  return {
    enabled: typeof obj.enabled === 'boolean' ? obj.enabled : false,
    spellSaveDC: ensureStatField(obj.spellSaveDC, 'DC заклинаний'),
    spellAttackBonus: ensureStatField(obj.spellAttackBonus, 'Бонус атаки заклинанием'),
    cantrips: Array.isArray(obj.cantrips) ? obj.cantrips.map(ensureCantrip) : [],
    spellbook: Array.isArray(obj.spellbook) ? obj.spellbook.map(ensureSpellbookEntry) : [],
    slots: ensureSpellSlots(obj.slots),
    preparedOnly: typeof obj.preparedOnly === 'boolean' ? obj.preparedOnly : false,
  };
}

function ensureSpellSlots(value: unknown): SpellSlotLevel[] {
  const src = Array.isArray(value) ? value : [];
  return createEmptySpellSlots().map((empty, index) => {
    const obj = asRecord(src[index]);
    const max = typeof obj.max === 'number' && obj.max > 0 ? Math.floor(obj.max) : empty.max;
    const used = typeof obj.used === 'number' && obj.used > 0 ? Math.min(max, Math.floor(obj.used)) : empty.used;
    return { max, used };
  });
}

function ensureStatField(value: unknown, fallbackLabel: string): StatField {
  const obj = asRecord(value);
  return {
    id: typeof obj.id === 'string' ? obj.id : newId(),
    label: typeof obj.label === 'string' ? obj.label : fallbackLabel,
    baseValue: typeof obj.baseValue === 'number' ? obj.baseValue : 0,
    linkedAbility: obj.linkedAbility as StatField['linkedAbility'],
    proficient: typeof obj.proficient === 'boolean' ? obj.proficient : undefined,
    bonusIds: Array.isArray(obj.bonusIds) ? (obj.bonusIds as string[]) : [],
  };
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function ensureBeastAttack(value: unknown): Attack {
  const obj = asRecord(value);
  return {
    id: typeof obj.id === 'string' ? obj.id : newId(),
    name: typeof obj.name === 'string' ? obj.name : '',
    attackBonus: ensureStatField(obj.attackBonus, 'Бонус атаки'),
    damageDice: typeof obj.damageDice === 'string' ? obj.damageDice : '',
    damageBonus: ensureStatField(obj.damageBonus, 'Урон'),
    damageType: typeof obj.damageType === 'string' ? obj.damageType : '',
    notes: typeof obj.notes === 'string' ? obj.notes : undefined,
    icon: typeof obj.icon === 'string' ? obj.icon : undefined,
  };
}

function ensureBeastSkill(value: unknown): BeastSkill | undefined {
  const obj = asRecord(value);
  if (typeof obj.skillId !== 'string') return undefined;
  return { skillId: obj.skillId, value: asNumber(obj.value, 0) };
}

function ensureBeastForm(value: unknown): BeastForm {
  const obj = asRecord(value);
  const abilitiesSrc = asRecord(obj.abilities);
  const abilities = {} as BeastForm['abilities'];
  for (const key of BEAST_ABILITY_KEYS) {
    abilities[key] = asNumber(abilitiesSrc[key], 10);
  }
  const hpMax = Math.max(1, asNumber(obj.hpMax, 1));
  return {
    id: typeof obj.id === 'string' ? obj.id : newId(),
    name: typeof obj.name === 'string' ? obj.name : 'Облик',
    icon: typeof obj.icon === 'string' ? obj.icon : undefined,
    abilities,
    ac: asNumber(obj.ac, 10),
    speed: asNumber(obj.speed, 30),
    hpMax,
    hpCurrent: Math.min(hpMax, Math.max(0, asNumber(obj.hpCurrent, hpMax))),
    skills: Array.isArray(obj.skills)
      ? obj.skills.map(ensureBeastSkill).filter((s): s is BeastSkill => s !== undefined)
      : [],
    attacks: Array.isArray(obj.attacks) ? obj.attacks.map(ensureBeastAttack) : [],
    notes: typeof obj.notes === 'string' ? obj.notes : '',
  };
}

/**
 * Приводит произвольный JSON (из буфера обмена, share-ссылки, старой версии схемы)
 * к валидному Character — дозаполняя отсутствующие секции значениями по умолчанию.
 * Нужно, т.к. даже пример из ТЗ §10 сам по себе неполный (нет skills/attacks/...).
 */
export function migrateCharacter(raw: unknown): Character {
  const src = asRecord(raw);

  const abilitiesSrc = asRecord(src.abilities);
  const savingThrowsSrc = asRecord(src.savingThrows);
  const abilities = {} as Character['abilities'];
  const savingThrows = {} as Character['savingThrows'];
  for (const key of ABILITY_KEYS) {
    abilities[key] = ensureStatField(abilitiesSrc[key], ABILITY_LABELS[key]);
    savingThrows[key] = {
      ...ensureStatField(savingThrowsSrc[key], `Спасбросок ${ABILITY_LABELS[key]}`),
      linkedAbility: key,
    };
  }

  const combatSrc = asRecord(src.combat);
  const metaSrc = asRecord(src.meta);

  const character: Character = {
    id: typeof src.id === 'string' ? src.id : newId(),
    schemaVersion: CURRENT_SCHEMA_VERSION,
    name: typeof src.name === 'string' && src.name.trim() ? src.name : 'Без имени',
    meta: {
      race: typeof metaSrc.race === 'string' ? metaSrc.race : '',
      className: typeof metaSrc.className === 'string' ? metaSrc.className : '',
      level: typeof metaSrc.level === 'number' && metaSrc.level > 0 ? metaSrc.level : 1,
      alignment: typeof metaSrc.alignment === 'string' ? metaSrc.alignment : '',
      faction: typeof metaSrc.faction === 'string' ? metaSrc.faction : '',
      background: typeof metaSrc.background === 'string' ? metaSrc.background : '',
    },
    themeColor: typeof src.themeColor === 'string' ? src.themeColor : '#7A1F1F',
    abilities,
    combat: {
      hpMax: ensureStatField(combatSrc.hpMax, 'Хиты (макс.)'),
      hpCurrent: typeof combatSrc.hpCurrent === 'number' ? combatSrc.hpCurrent : 0,
      hpTemp: typeof combatSrc.hpTemp === 'number' ? combatSrc.hpTemp : 0,
      ac: ensureStatField(combatSrc.ac, 'КД'),
      speed: ensureStatField(combatSrc.speed, 'Скорость'),
      initiative: ensureStatField(combatSrc.initiative, 'Инициатива'),
    },
    savingThrows,
    skills: Array.isArray(src.skills) ? (src.skills as Character['skills']) : createDefaultSkills(),
    attacks: Array.isArray(src.attacks) ? (src.attacks as Character['attacks']) : [],
    spellcasting: ensureSpellcasting(src.spellcasting),
    resources: Array.isArray(src.resources) ? (src.resources as Character['resources']) : [],
    features: Array.isArray(src.features) ? (src.features as Character['features']) : [],
    equipment: Array.isArray(src.equipment) ? src.equipment.map(ensureEquipmentItem) : [],
    proficienciesAndLanguages:
      typeof src.proficienciesAndLanguages === 'string' ? src.proficienciesAndLanguages : '',
    notes: typeof src.notes === 'string' ? src.notes : '',
    bonuses: Array.isArray(src.bonuses) ? (src.bonuses as Character['bonuses']) : [],
    beastForms: Array.isArray(src.beastForms) ? src.beastForms.map(ensureBeastForm) : [],
  };

  // ссылки на облик/ресурс сохраняем, только если они указывают на существующие объекты
  if (typeof src.activeBeastFormId === 'string' && character.beastForms.some((f) => f.id === src.activeBeastFormId)) {
    character.activeBeastFormId = src.activeBeastFormId;
  }
  if (typeof src.beastFormResourceId === 'string' && character.resources.some((r) => r.id === src.beastFormResourceId)) {
    character.beastFormResourceId = src.beastFormResourceId;
  }

  syncBonusIds(character);
  return character;
}
