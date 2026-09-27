import type { AbilityKey, StatField } from '../types/character';
import { ABILITY_LABELS } from '../types/character';
import type { BonusIndex } from './bonusIndex';
import { getBonusesFor } from './bonusIndex';
import { isAbilityModBonus, isDiceBonus, isFixedBonus } from './bonusGuards';

export interface ComputeContext {
  /** Уже финально посчитанные модификаторы характеристик (не сырые значения). */
  abilityScores: Record<AbilityKey, number>;
  proficiencyBonus: number;
  bonusIndex: BonusIndex;
}

export interface StatFieldBreakdownEntry {
  source: string;
  amount?: number;
  dice?: string;
}

export interface StatFieldComputeResult {
  flatTotal: number;
  /** Сырые нотации отдельных кубиковых бонусов, напр. ["1к4","2к6"] — используется для броска. */
  diceParts: string[];
  /** Строка для отображения, напр. "1к4 + 2к6". */
  diceFormula: string;
  /** "13" или "13 + 1к4". */
  display: string;
  breakdown: StatFieldBreakdownEntry[];
}

/**
 * Единая точка расчёта итогового значения StatField.
 * Используется для characteristics/combat/savingThrows/skills/attacks/spellcasting —
 * никакого дублирования формулы.
 */
export function computeStatField(field: StatField, ctx: ComputeContext): StatFieldComputeResult {
  const breakdown: StatFieldBreakdownEntry[] = [{ source: 'База', amount: field.baseValue }];
  let flatTotal = field.baseValue;

  if (field.linkedAbility) {
    const mod = ctx.abilityScores[field.linkedAbility];
    flatTotal += mod;
    breakdown.push({ source: `Мод. ${ABILITY_LABELS[field.linkedAbility]}`, amount: mod });
  }

  if (field.proficient) {
    flatTotal += ctx.proficiencyBonus;
    breakdown.push({ source: 'Бонус мастерства', amount: ctx.proficiencyBonus });
  }

  const diceParts: string[] = [];
  const bonuses = getBonusesFor(ctx.bonusIndex, field.id);
  for (const bonus of bonuses) {
    if (isFixedBonus(bonus)) {
      flatTotal += bonus.value;
      breakdown.push({ source: bonus.label, amount: bonus.value });
    } else if (isDiceBonus(bonus)) {
      diceParts.push(bonus.dice);
      breakdown.push({ source: bonus.label, dice: bonus.dice });
    } else if (isAbilityModBonus(bonus)) {
      const mod = ctx.abilityScores[bonus.abilityKey];
      flatTotal += mod;
      breakdown.push({ source: `${bonus.label} (${ABILITY_LABELS[bonus.abilityKey]})`, amount: mod });
    }
  }

  const diceFormula = diceParts.join(' + ');
  const display = diceFormula ? `${flatTotal} + ${diceFormula}` : `${flatTotal}`;

  return { flatTotal, diceParts, diceFormula, display, breakdown };
}
