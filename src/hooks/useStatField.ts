import { useMemo } from 'react';
import { computeStatField, type StatFieldComputeResult } from '../engine/computeStatField';
import { getComputeContext } from '../store/selectors';
import type { Character, StatField } from '../types/character';

export function useStatField(character: Character, field: StatField): StatFieldComputeResult {
  return useMemo(() => {
    const ctx = getComputeContext(character);
    return computeStatField(field, ctx);
  }, [character, field]);
}
