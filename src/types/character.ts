export type AbilityKey = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';

export const ABILITY_KEYS: AbilityKey[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

export const ABILITY_LABELS: Record<AbilityKey, string> = {
  STR: 'СИЛ',
  DEX: 'ЛОВ',
  CON: 'ТЕЛ',
  INT: 'ИНТ',
  WIS: 'МДР',
  CHA: 'ХАР',
};

export type BonusType = 'fixed' | 'dice' | 'ability_mod';

export interface Bonus {
  id: string;
  label: string;
  type: BonusType;
  value?: number;
  dice?: string;
  abilityKey?: AbilityKey;
  appliesTo: string;
}

export interface StatField {
  id: string;
  label: string;
  baseValue: number;
  linkedAbility?: AbilityKey;
  proficient?: boolean;
  bonusIds: string[];
}

export interface SkillField extends StatField {
  linkedAbility: AbilityKey;
  custom?: boolean;
}

export interface Attack {
  id: string;
  name: string;
  attackBonus: StatField;
  damageDice: string;
  damageBonus: StatField;
  damageType: string;
  notes?: string;
}

export interface SpellcastingBlock {
  enabled: boolean;
  spellSaveDC: StatField;
  spellAttackBonus: StatField;
  cantrips: string[];
  spellbook: { id: string; name: string; level: number; prepared: boolean }[];
}

export type RestType = 'short_rest' | 'long_rest' | 'both' | 'manual';

export interface ResourceTracker {
  id: string;
  label: string;
  max: number;
  used: number;
  resetOn: RestType;
}

export interface Feature {
  id: string;
  title: string;
  description: string;
}

export interface EquipmentItem {
  id: string;
  name: string;
  note: string;
}

export interface CharacterMeta {
  race: string;
  className: string;
  level: number;
  alignment: string;
  faction: string;
  background: string;
}

export interface CombatBlock {
  hpMax: StatField;
  hpCurrent: number;
  hpTemp: number;
  ac: StatField;
  speed: StatField;
  initiative: StatField;
}

export const CURRENT_SCHEMA_VERSION = 1;

export interface Character {
  id: string;
  schemaVersion: number;
  name: string;
  meta: CharacterMeta;
  themeColor: string;

  abilities: Record<AbilityKey, StatField>;
  combat: CombatBlock;
  savingThrows: Record<AbilityKey, StatField>;
  skills: SkillField[];
  attacks: Attack[];
  spellcasting?: SpellcastingBlock;
  resources: ResourceTracker[];

  features: Feature[];
  equipment: EquipmentItem[];
  proficienciesAndLanguages: string;
  notes: string;

  bonuses: Bonus[];
}

export interface CharacterSummary {
  id: string;
  name: string;
  race: string;
  className: string;
  themeColor: string;
}
