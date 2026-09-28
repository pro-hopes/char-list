import { ABILITY_KEYS, ABILITY_LABELS, type Character, type StatField } from '../types/character';

export type StatFieldCategory = 'ability' | 'combat' | 'saving_throw' | 'skill' | 'attack' | 'spellcasting' | 'other';

export interface StatFieldRef {
  field: StatField;
  label: string;
  category: StatFieldCategory;
}

/**
 * Единая точка резолва id → поле + человекочитаемый label + категория.
 * Используется aside-панелью бонусов (в т.ч. для группировки по блокам) и
 * универсальными действиями (toggleProficient/addBonus), которым нужен резолв
 * произвольного StatField.id без строковых путей.
 */
export function listAllStatFields(character: Character): StatFieldRef[] {
  const refs: StatFieldRef[] = [];

  for (const key of ABILITY_KEYS) {
    const field = character.abilities[key];
    refs.push({ field, label: `Характеристика: ${ABILITY_LABELS[key]}`, category: 'ability' });
  }

  refs.push({ field: character.combat.hpMax, label: 'Хиты (макс.)', category: 'combat' });
  refs.push({ field: character.combat.ac, label: 'КД', category: 'combat' });
  refs.push({ field: character.combat.speed, label: 'Скорость', category: 'combat' });
  refs.push({ field: character.combat.initiative, label: 'Инициатива', category: 'combat' });

  for (const key of ABILITY_KEYS) {
    const field = character.savingThrows[key];
    refs.push({ field, label: `Спасбросок: ${ABILITY_LABELS[key]}`, category: 'saving_throw' });
  }

  for (const skill of character.skills) {
    refs.push({ field: skill, label: `Навык: ${skill.label}`, category: 'skill' });
  }

  for (const attack of character.attacks) {
    refs.push({ field: attack.attackBonus, label: `Атака (${attack.name}): бонус атаки`, category: 'attack' });
    refs.push({ field: attack.damageBonus, label: `Атака (${attack.name}): урон`, category: 'attack' });
  }

  if (character.spellcasting?.enabled) {
    refs.push({ field: character.spellcasting.spellSaveDC, label: 'DC заклинаний', category: 'spellcasting' });
    refs.push({
      field: character.spellcasting.spellAttackBonus,
      label: 'Бонус атаки заклинанием',
      category: 'spellcasting',
    });
  }

  return refs;
}

export function findStatField(character: Character, fieldId: string): StatFieldRef | undefined {
  return listAllStatFields(character).find((ref) => ref.field.id === fieldId);
}

/**
 * Пересчитывает StatField.bonusIds из character.bonuses (appliesTo — источник истины).
 * Вызывается после любой мутации character.bonuses, чтобы производное поле bonusIds
 * (нужное только для сериализации/совместимости со схемой ТЗ) не разошлось с реальностью.
 * Расчётный движок и aside-панель bonusIds не читают — только bonusIndex по appliesTo.
 */
export function syncBonusIds(character: Character): void {
  for (const { field } of listAllStatFields(character)) {
    field.bonusIds = character.bonuses.filter((bonus) => bonus.appliesTo === field.id).map((bonus) => bonus.id);
  }
}
