import { useMemo } from 'react';
import { computeAttackDamage, type AttackComputeResult } from '../engine/computeAttack';
import { getComputeContext } from '../store/selectors';
import type { Attack, Character } from '../types/character';

export function useAttackDamage(character: Character, attack: Attack): AttackComputeResult {
  return useMemo(() => {
    const ctx = getComputeContext(character);
    return computeAttackDamage(attack, ctx);
  }, [character, attack]);
}
