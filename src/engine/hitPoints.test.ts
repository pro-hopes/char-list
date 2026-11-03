import { describe, expect, it } from 'vitest';
import helgaJson from '../../examples/helga.json';
import { clampHp, computeHpMax } from './hitPoints';
import { migrateCharacter } from './migrations';

describe('clampHp', () => {
  it('не даёт подняться выше максимума', () => {
    expect(clampHp(25, 20)).toBe(20);
  });

  it('не даёт опуститься ниже 0', () => {
    expect(clampHp(-3, 20)).toBe(0);
  });

  it('значение в пределах не меняется', () => {
    expect(clampHp(12, 20)).toBe(12);
  });

  it('если максимум не задан (0), верхней границы нет', () => {
    expect(clampHp(15, 0)).toBe(15);
  });
});

describe('computeHpMax', () => {
  it('максимум Хельги = 45 (база, без бонусов)', () => {
    expect(computeHpMax(migrateCharacter(helgaJson))).toBe(45);
  });

  it('бонус к максимуму хитов учитывается', () => {
    const helga = migrateCharacter(helgaJson);
    const withBonus = {
      ...helga,
      bonuses: [...helga.bonuses, { id: 'b-hp', label: 'Крепкий', type: 'fixed' as const, value: 8, appliesTo: 'hpmax' }],
    };
    expect(computeHpMax(withBonus)).toBe(53);
  });
});
