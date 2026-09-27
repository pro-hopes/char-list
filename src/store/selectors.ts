import { buildBonusIndex } from '../engine/bonusIndex';
import { computeAbilityScores } from '../engine/computeAbilityScores';
import type { ComputeContext } from '../engine/computeStatField';
import { proficiencyBonusForLevel } from '../engine/proficiencyBonus';
import type { Character } from '../types/character';

const cache = new WeakMap<Character, ComputeContext>();

/**
 * abilityScores/bonusIndex кэшируются по ссылке на Character (WeakMap).
 * Работает корректно только если ВСЕ мутации персонажа идут через immer-draft
 * в сторе (mutateCharacter) — тогда новая ссылка появляется исключительно
 * при реальном изменении, и кэш не отдаёт устаревшие данные.
 */
export function getComputeContext(character: Character): ComputeContext {
  const cached = cache.get(character);
  if (cached) return cached;

  const ctx: ComputeContext = {
    abilityScores: computeAbilityScores(character),
    proficiencyBonus: proficiencyBonusForLevel(character.meta.level),
    bonusIndex: buildBonusIndex(character.bonuses),
  };
  cache.set(character, ctx);
  return ctx;
}
