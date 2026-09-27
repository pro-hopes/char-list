import { ABILITY_KEYS, type AbilityKey, type Character } from '../types/character';
import { abilityModifier } from './abilityModifier';
import { buildBonusIndex } from './bonusIndex';
import { computeStatField, type ComputeContext } from './computeStatField';
import { proficiencyBonusForLevel } from './proficiencyBonus';

/**
 * Считает финальные модификаторы всех 6 характеристик.
 *
 * ВАЖНО (осознанное упрощение против циклов): бонус типа `ability_mod`,
 * прикреплённый к самой характеристике (в т.ч. к ней же), резолвится через
 * БАЗОВЫЙ модификатор `floor((baseValue-10)/2)` референсной характеристики,
 * а не через полностью пересчитанный. Без этого расчёт шести характеристик
 * зависел бы от порядка их обхода или мог зациклиться (А ссылается на Б,
 * Б ссылается на А). Итоговый результат этой функции (полностью резолвленные
 * модификаторы) — то, что используется ВСЕМИ остальными полями персонажа
 * (навыки, спасброски, КД, атаки, DC заклинаний) через ComputeContext.abilityScores.
 */
export function computeAbilityScores(character: Character): Record<AbilityKey, number> {
  const bonusIndex = buildBonusIndex(character.bonuses);
  const proficiencyBonus = proficiencyBonusForLevel(character.meta.level);

  const baseModifiers = {} as Record<AbilityKey, number>;
  for (const key of ABILITY_KEYS) {
    baseModifiers[key] = abilityModifier(character.abilities[key].baseValue);
  }

  const baseCtx: ComputeContext = { abilityScores: baseModifiers, proficiencyBonus, bonusIndex };

  const resolved = {} as Record<AbilityKey, number>;
  for (const key of ABILITY_KEYS) {
    const field = character.abilities[key];
    const result = computeStatField(field, baseCtx);
    resolved[key] = abilityModifier(result.flatTotal);
  }
  return resolved;
}
