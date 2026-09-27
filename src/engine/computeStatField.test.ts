import { describe, expect, it } from 'vitest';
import helgaJson from '../../examples/helga.json';
import type { Character } from '../types/character';
import { buildBonusIndex } from './bonusIndex';
import { computeAbilityScores } from './computeAbilityScores';
import { computeAttackDamage } from './computeAttack';
import { computeStatField, type ComputeContext } from './computeStatField';
import { proficiencyBonusForLevel } from './proficiencyBonus';

const helga = helgaJson as unknown as Character;

function makeCtx(character: Character): ComputeContext {
  return {
    abilityScores: computeAbilityScores(character),
    proficiencyBonus: proficiencyBonusForLevel(character.meta.level),
    bonusIndex: buildBonusIndex(character.bonuses),
  };
}

describe('computeAbilityScores', () => {
  it('считает базовые модификаторы характеристик Хельги', () => {
    const scores = computeAbilityScores(helga);
    expect(scores.STR).toBe(3); // 17 -> +3
    expect(scores.DEX).toBe(1); // 13 -> +1
    expect(scores.CON).toBe(3); // 16 -> +3
  });
});

describe('computeStatField', () => {
  it('КД Хельги = 10 (база) + мод.ЛОВ(+1) + ability_mod-бонус от ТЕЛ(+3) = 14', () => {
    const ctx = makeCtx(helga);
    const result = computeStatField(helga.combat.ac, ctx);
    expect(result.flatTotal).toBe(14);
    expect(result.display).toBe('14');
  });

  it('спасбросок СИЛ с владением на 4 уровне = мод.СИЛ(+3) + бонус мастерства(+2) = 5', () => {
    const ctx = makeCtx(helga);
    const result = computeStatField(helga.savingThrows.STR, ctx);
    expect(result.flatTotal).toBe(5);
  });

  it('навык Атлетика с владением = мод.СИЛ(+3) + бонус мастерства(+2) = 5', () => {
    const ctx = makeCtx(helga);
    const skill = helga.skills.find((s) => s.label === 'Атлетика')!;
    const result = computeStatField(skill, ctx);
    expect(result.flatTotal).toBe(5);
  });
});

describe('computeAttackDamage', () => {
  it('урон секиры = 1к12 + мод.СИЛ(+3) + бонус ярости(+2) = "1к12 + 5"', () => {
    const ctx = makeCtx(helga);
    const attack = helga.attacks[0]!;
    const result = computeAttackDamage(attack, ctx);
    expect(result.damageBonusResult.flatTotal).toBe(5);
    expect(result.damageDisplay).toBe('1к12 + 5');
  });

  it('бонус атаки секирой = мод.СИЛ(+3) + бонус мастерства(+2) = 5', () => {
    const ctx = makeCtx(helga);
    const attack = helga.attacks[0]!;
    const result = computeAttackDamage(attack, ctx);
    expect(result.attackBonusResult.flatTotal).toBe(5);
  });
});
