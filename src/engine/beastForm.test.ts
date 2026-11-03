import { describe, expect, it } from 'vitest';
import helgaJson from '../../examples/helga.json';
import type { BeastForm, Character } from '../types/character';
import { applyBeastFormDamage, getBeastFormView } from './beastForm';
import { buildBonusIndex } from './bonusIndex';
import { computeAbilityScores } from './computeAbilityScores';
import { computeStatField, type ComputeContext } from './computeStatField';
import { migrateCharacter } from './migrations';
import { proficiencyBonusForLevel } from './proficiencyBonus';

const wolf: BeastForm = {
  id: 'wolf',
  name: 'Волк',
  abilities: { STR: 12, DEX: 15, CON: 12 },
  ac: 13,
  speed: 40,
  hpMax: 11,
  hpCurrent: 11,
  skills: [
    { skillId: 'sk-vospriyatie', value: 3 },
    { skillId: 'sk-skrytnost', value: 4 },
  ],
  attacks: [
    {
      id: 'bite',
      name: 'Укус',
      attackBonus: { id: 'bite-atk', label: 'Бонус атаки', baseValue: 4, bonusIds: [] },
      damageDice: '2к4',
      damageBonus: { id: 'bite-dmg', label: 'Урон', baseValue: 2, bonusIds: [] },
      damageType: 'колющий',
    },
  ],
  notes: '',
};

function helgaInForm(): Character {
  const helga = migrateCharacter(helgaJson);
  return { ...helga, beastForms: [wolf], activeBeastFormId: 'wolf' };
}

function total(character: Character, fieldId: string): number {
  const ctx: ComputeContext = {
    abilityScores: computeAbilityScores(character),
    proficiencyBonus: proficiencyBonusForLevel(character.meta.level),
    bonusIndex: buildBonusIndex(character.bonuses),
  };
  const field = [
    ...Object.values(character.abilities),
    ...Object.values(character.combat).filter((v) => typeof v === 'object'),
    ...character.skills,
  ].find((f) => typeof f === 'object' && f.id === fieldId);
  if (!field || typeof field !== 'object') throw new Error(`no field ${fieldId}`);
  return computeStatField(field, ctx).flatTotal;
}

describe('getBeastFormView', () => {
  it('без активного облика возвращает того же персонажа', () => {
    const helga = migrateCharacter(helgaJson);
    expect(getBeastFormView(helga).character).toBe(helga);
  });

  it('СИЛ/ЛОВ/ТЕЛ берутся от зверя, ИНТ остаётся своей', () => {
    const { character } = getBeastFormView(helgaInForm());
    expect(character.abilities.STR.baseValue).toBe(12);
    expect(character.abilities.DEX.baseValue).toBe(15);
    expect(character.abilities.INT.baseValue).toBe(8);
  });

  it('КД = КД зверя: бонус «Защита без доспехов» в облике не действует', () => {
    const { character, overriddenFieldIds } = getBeastFormView(helgaInForm());
    expect(total(character, 'ac')).toBe(13);
    expect(overriddenFieldIds.has('ac')).toBe(true);
  });

  it('инициатива считается от ЛОВ зверя (15 -> +2)', () => {
    const { character } = getBeastFormView(helgaInForm());
    expect(total(character, 'init')).toBe(2);
  });

  it('навык зверя выше своего — берётся бонус зверя (Скрытность 2 -> 4)', () => {
    const { character, overriddenFieldIds } = getBeastFormView(helgaInForm());
    expect(total(character, 'sk-skrytnost')).toBe(4);
    expect(overriddenFieldIds.has('sk-skrytnost')).toBe(true);
  });

  it('свой навык не ниже — остаётся свой (Восприятие 3 = 3)', () => {
    const { character, overriddenFieldIds } = getBeastFormView(helgaInForm());
    expect(total(character, 'sk-vospriyatie')).toBe(3);
    expect(overriddenFieldIds.has('sk-vospriyatie')).toBe(false);
  });

  it('владение навыком сохраняется: Атлетика = СИЛ волка(+1) + мастерство(+2)', () => {
    const { character } = getBeastFormView(helgaInForm());
    expect(total(character, 'sk-atletika')).toBe(3);
  });

  it('атаки и хиты заменяются звериными', () => {
    const { character } = getBeastFormView(helgaInForm());
    expect(character.attacks.map((a) => a.name)).toEqual(['Укус']);
    expect(total(character, character.combat.hpMax.id)).toBe(11);
    expect(character.combat.hpCurrent).toBe(11);
  });
});

describe('applyBeastFormDamage', () => {
  it('урон сначала снимает временные хиты, затем хиты облика', () => {
    const result = applyBeastFormDamage({ temp: 3, formHp: 11, ownHp: 20 }, 5);
    expect(result).toMatchObject({ temp: 0, formHp: 9, ownHp: 20, reverted: false, overflow: 0 });
  });

  it('при падении до 0 облик спадает, остаток переходит на хиты персонажа', () => {
    const result = applyBeastFormDamage({ temp: 0, formHp: 5, ownHp: 20 }, 12);
    expect(result).toMatchObject({ formHp: 0, ownHp: 13, reverted: true, overflow: 7 });
  });

  it('перенесённый урон не опускает хиты персонажа ниже 0', () => {
    const result = applyBeastFormDamage({ temp: 0, formHp: 5, ownHp: 4 }, 20);
    expect(result).toMatchObject({ formHp: 0, ownHp: 0, reverted: true, overflow: 15 });
  });

  it('ровно до 0 — облик спадает без переноса урона', () => {
    const result = applyBeastFormDamage({ temp: 0, formHp: 5, ownHp: 20 }, 5);
    expect(result).toMatchObject({ formHp: 0, ownHp: 20, reverted: true, overflow: 0 });
  });
});

describe('migrateCharacter: облики', () => {
  it('старое сохранение без обликов получает пустой список', () => {
    expect(migrateCharacter(helgaJson).beastForms).toEqual([]);
  });

  it('ссылка на несуществующий облик сбрасывается', () => {
    const migrated = migrateCharacter({ ...helgaJson, beastForms: [wolf], activeBeastFormId: 'bear' });
    expect(migrated.activeBeastFormId).toBeUndefined();
    expect(migrated.beastForms[0]?.name).toBe('Волк');
  });
});
