import {
  ABILITY_KEYS,
  ABILITY_LABELS,
  CURRENT_SCHEMA_VERSION,
  type Cantrip,
  type Character,
  type EquipmentItem,
  type SpellbookEntry,
  type SpellcastingBlock,
  type StatField,
} from '../types/character';
import { newId } from '../utils/id';
import { createDefaultSkills } from './defaultTemplates';
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
  };
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
  };

  syncBonusIds(character);
  return character;
}
