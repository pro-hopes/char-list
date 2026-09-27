import { ABILITY_KEYS, CURRENT_SCHEMA_VERSION, type AbilityKey, type Character, type SkillField, type StatField } from '../types/character';
import { newId } from '../utils/id';

const DEFAULT_THEME_COLORS = ['#7A1F1F', '#1F4E7A', '#1F7A3D', '#6A1F7A', '#7A5A1F', '#1F7A72'];

export function pickRandomThemeColor(): string {
  return DEFAULT_THEME_COLORS[Math.floor(Math.random() * DEFAULT_THEME_COLORS.length)] ?? '#7A1F1F';
}

function emptyStatField(label: string): StatField {
  return { id: newId(), label, baseValue: 0, bonusIds: [] };
}

export interface DefaultSkillDef {
  label: string;
  ability: AbilityKey;
}

export const DEFAULT_SKILLS: DefaultSkillDef[] = [
  { label: 'Акробатика', ability: 'DEX' },
  { label: 'Атлетика', ability: 'STR' },
  { label: 'Восприятие', ability: 'WIS' },
  { label: 'Выживание', ability: 'WIS' },
  { label: 'Выступление', ability: 'CHA' },
  { label: 'Запугивание', ability: 'CHA' },
  { label: 'История', ability: 'INT' },
  { label: 'Ловкость рук', ability: 'DEX' },
  { label: 'Магия', ability: 'INT' },
  { label: 'Медицина', ability: 'WIS' },
  { label: 'Обман', ability: 'CHA' },
  { label: 'Природа', ability: 'INT' },
  { label: 'Проницательность', ability: 'WIS' },
  { label: 'Расследование', ability: 'INT' },
  { label: 'Религия', ability: 'INT' },
  { label: 'Скрытность', ability: 'DEX' },
  { label: 'Убеждение', ability: 'CHA' },
  { label: 'Уход за животными', ability: 'WIS' },
];

export function createDefaultSkills(): SkillField[] {
  return DEFAULT_SKILLS.map((def) => ({
    id: newId(),
    label: def.label,
    baseValue: 0,
    linkedAbility: def.ability,
    proficient: false,
    bonusIds: [],
    custom: false,
  }));
}

export function createDefaultCharacter(name = 'Новый персонаж'): Character {
  const abilities = {} as Character['abilities'];
  const savingThrows = {} as Character['savingThrows'];
  for (const key of ABILITY_KEYS) {
    abilities[key] = { id: newId(), label: key, baseValue: 10, bonusIds: [] };
    savingThrows[key] = {
      id: newId(),
      label: `Спасбросок ${key}`,
      baseValue: 0,
      linkedAbility: key,
      proficient: false,
      bonusIds: [],
    };
  }

  return {
    id: newId(),
    schemaVersion: CURRENT_SCHEMA_VERSION,
    name,
    meta: {
      race: '',
      className: '',
      level: 1,
      alignment: '',
      faction: '',
      background: '',
    },
    themeColor: pickRandomThemeColor(),
    abilities,
    combat: {
      hpMax: emptyStatField('Хиты (макс.)'),
      hpCurrent: 0,
      hpTemp: 0,
      ac: { ...emptyStatField('КД'), baseValue: 10, linkedAbility: 'DEX' },
      speed: { ...emptyStatField('Скорость'), baseValue: 30 },
      initiative: { ...emptyStatField('Инициатива'), linkedAbility: 'DEX' },
    },
    savingThrows,
    skills: createDefaultSkills(),
    attacks: [],
    spellcasting: undefined,
    resources: [],
    features: [],
    equipment: [],
    proficienciesAndLanguages: '',
    notes: '',
    bonuses: [],
  };
}
