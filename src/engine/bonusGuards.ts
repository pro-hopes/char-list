import type { Bonus } from '../types/character';

export interface FixedBonus extends Bonus {
  type: 'fixed';
  value: number;
}

export interface DiceBonus extends Bonus {
  type: 'dice';
  dice: string;
}

export interface AbilityModBonus extends Bonus {
  type: 'ability_mod';
  abilityKey: NonNullable<Bonus['abilityKey']>;
}

export function isFixedBonus(bonus: Bonus): bonus is FixedBonus {
  return bonus.type === 'fixed';
}

export function isDiceBonus(bonus: Bonus): bonus is DiceBonus {
  return bonus.type === 'dice';
}

export function isAbilityModBonus(bonus: Bonus): bonus is AbilityModBonus {
  return bonus.type === 'ability_mod';
}

/** Exhaustive dispatch — если появится новый BonusType, здесь будет ошибка компиляции. */
export function assertNeverBonusType(type: never): never {
  throw new Error(`Unhandled bonus type: ${String(type)}`);
}
