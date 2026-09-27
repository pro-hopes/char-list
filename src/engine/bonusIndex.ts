import type { Bonus } from '../types/character';

export type BonusIndex = Map<string, Bonus[]>;

const EMPTY: Bonus[] = [];

export function buildBonusIndex(bonuses: Bonus[]): BonusIndex {
  const index: BonusIndex = new Map();
  for (const bonus of bonuses) {
    const list = index.get(bonus.appliesTo);
    if (list) {
      list.push(bonus);
    } else {
      index.set(bonus.appliesTo, [bonus]);
    }
  }
  return index;
}

export function getBonusesFor(index: BonusIndex, fieldId: string): Bonus[] {
  return index.get(fieldId) ?? EMPTY;
}
