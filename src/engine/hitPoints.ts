import type { Character } from '../types/character';
import { buildBonusIndex } from './bonusIndex';
import { computeAbilityScores } from './computeAbilityScores';
import { computeStatField } from './computeStatField';
import { proficiencyBonusForLevel } from './proficiencyBonus';

/** Итоговый максимум хитов персонажа (с модификаторами и бонусами). */
export function computeHpMax(character: Character): number {
  return computeStatField(character.combat.hpMax, {
    abilityScores: computeAbilityScores(character),
    proficiencyBonus: proficiencyBonusForLevel(character.meta.level),
    bonusIndex: buildBonusIndex(character.bonuses),
  }).flatTotal;
}

/**
 * Текущие хиты не бывают меньше 0 и больше максимума.
 * Если максимум ещё не задан (0 у нового персонажа), верхнюю границу не применяем,
 * иначе хиты нельзя было бы ввести до заполнения максимума.
 */
export function clampHp(value: number, hpMax: number): number {
  const upper = hpMax > 0 ? Math.min(value, hpMax) : value;
  return Math.max(0, upper);
}
