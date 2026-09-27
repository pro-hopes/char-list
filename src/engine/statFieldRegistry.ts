import { ABILITY_KEYS, ABILITY_LABELS, type Character, type StatField } from '../types/character';

export interface StatFieldRef {
  field: StatField;
  label: string;
}

/**
 * Единая точка резолва id → поле + человекочитаемый label.
 * Используется aside-панелью бонусов и универсальными действиями
 * (toggleProficient/addBonus), которым нужен резолв произвольного StatField.id
 * без строковых путей.
 */
export function listAllStatFields(character: Character): StatFieldRef[] {
  const refs: StatFieldRef[] = [];

  for (const key of ABILITY_KEYS) {
    const field = character.abilities[key];
    refs.push({ field, label: `Характеристика: ${ABILITY_LABELS[key]}` });
  }

  refs.push({ field: character.combat.hpMax, label: 'Хиты (макс.)' });
  refs.push({ field: character.combat.ac, label: 'КД' });
  refs.push({ field: character.combat.speed, label: 'Скорость' });
  refs.push({ field: character.combat.initiative, label: 'Инициатива' });

  for (const key of ABILITY_KEYS) {
    const field = character.savingThrows[key];
    refs.push({ field, label: `Спасбросок: ${ABILITY_LABELS[key]}` });
  }

  for (const skill of character.skills) {
    refs.push({ field: skill, label: `Навык: ${skill.label}` });
  }

  for (const attack of character.attacks) {
    refs.push({ field: attack.attackBonus, label: `Атака (${attack.name}): бонус атаки` });
    refs.push({ field: attack.damageBonus, label: `Атака (${attack.name}): урон` });
  }

  if (character.spellcasting?.enabled) {
    refs.push({ field: character.spellcasting.spellSaveDC, label: 'DC заклинаний' });
    refs.push({ field: character.spellcasting.spellAttackBonus, label: 'Бонус атаки заклинанием' });
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
