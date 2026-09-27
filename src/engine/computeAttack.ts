import type { Attack } from '../types/character';
import { computeStatField, type ComputeContext, type StatFieldComputeResult } from './computeStatField';

export interface AttackComputeResult {
  attackBonusResult: StatFieldComputeResult;
  damageBonusResult: StatFieldComputeResult;
  /** Все кубиковые части урона (damageDice + кубиковые бонусы damageBonus), для кнопки "Бросить". */
  damageDiceParts: string[];
  damageDisplay: string;
}

export function computeAttackDamage(attack: Attack, ctx: ComputeContext): AttackComputeResult {
  const attackBonusResult = computeStatField(attack.attackBonus, ctx);
  const damageBonusResult = computeStatField(attack.damageBonus, ctx);

  const damageDiceParts = [attack.damageDice, ...damageBonusResult.diceParts].filter(
    (notation) => notation.trim().length > 0,
  );
  const diceFormula = damageDiceParts.join(' + ');
  const damageDisplay =
    damageBonusResult.flatTotal !== 0 ? `${diceFormula} + ${damageBonusResult.flatTotal}` : diceFormula;

  return { attackBonusResult, damageBonusResult, damageDiceParts, damageDisplay };
}
