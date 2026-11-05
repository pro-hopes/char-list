import { describe, expect, it } from 'vitest';
import helgaJson from '../../examples/helga.json';
import { migrateCharacter } from './migrations';

// Блок заклинаний в формате до появления ячеек и фильтра — так он лежит у игроков в localStorage.
const oldSpellcasting = {
  enabled: true,
  spellSaveDC: { id: 'dc', label: 'DC заклинаний', baseValue: 8, proficient: true, bonusIds: [] },
  spellAttackBonus: { id: 'atk', label: 'Бонус атаки заклинанием', baseValue: 0, proficient: true, bonusIds: [] },
  cantrips: [
    { id: 'c1', name: 'Искусство друидов', description: 'Мелкие природные эффекты', icon: 'icons_atlas_1.webp' },
  ],
  spellbook: [
    { id: 's1', name: 'Лечащее слово', level: 1, prepared: true, description: 'Лечит 1к4 + мод.', icon: 'icons_atlas_2.webp' },
    { id: 's2', name: 'Опутывание', level: 1, prepared: false, description: 'Квадрат 6 м' },
    { id: 's3', name: 'Лунный луч', level: 2, prepared: true, description: '' },
  ],
};

describe('migrateCharacter: заклинания', () => {
  it('старое сохранение сохраняет все заговоры и заклинания без изменений', () => {
    const migrated = migrateCharacter({ ...helgaJson, spellcasting: oldSpellcasting });
    expect(migrated.spellcasting?.cantrips).toEqual(oldSpellcasting.cantrips);
    expect(migrated.spellcasting?.spellbook).toEqual(oldSpellcasting.spellbook);
    expect(migrated.spellcasting?.spellSaveDC.baseValue).toBe(8);
    expect(migrated.spellcasting?.enabled).toBe(true);
  });

  it('старое сохранение получает 9 пустых кругов ячеек и выключенный фильтр', () => {
    const migrated = migrateCharacter({ ...helgaJson, spellcasting: oldSpellcasting });
    expect(migrated.spellcasting?.slots).toHaveLength(9);
    expect(migrated.spellcasting?.slots.every((s) => s.max === 0 && s.used === 0)).toBe(true);
    expect(migrated.spellcasting?.preparedOnly).toBe(false);
  });

  it('ячейки и фильтр переживают сохранение и загрузку', () => {
    const slots = [{ max: 4, used: 1 }, { max: 3, used: 0 }];
    const migrated = migrateCharacter({ ...helgaJson, spellcasting: { ...oldSpellcasting, slots, preparedOnly: true } });
    expect(migrated.spellcasting?.slots.slice(0, 3)).toEqual([{ max: 4, used: 1 }, { max: 3, used: 0 }, { max: 0, used: 0 }]);
    expect(migrated.spellcasting?.preparedOnly).toBe(true);
  });

  it('параметры заклинания (концентрация, дистанция, урон) переживают сохранение и загрузку', () => {
    const detailed = {
      ...oldSpellcasting.spellbook[1],
      castingTime: '1 действие',
      range: '27 м',
      duration: '1 мин',
      damage: '2к8',
      damageType: 'громом',
      concentration: true,
      ritual: false,
    };
    const migrated = migrateCharacter({ ...helgaJson, spellcasting: { ...oldSpellcasting, spellbook: [detailed] } });
    const { ritual: _ritual, ...expected } = detailed;
    expect(migrated.spellcasting?.spellbook[0]).toEqual(expected);
  });

  it('потраченных ячеек не может быть больше, чем всего', () => {
    const migrated = migrateCharacter({ ...helgaJson, spellcasting: { ...oldSpellcasting, slots: [{ max: 2, used: 5 }] } });
    expect(migrated.spellcasting?.slots[0]).toEqual({ max: 2, used: 2 });
  });
});

describe('migrateCharacter: портрет', () => {
  it('путь к портрету переживает сохранение и загрузку', () => {
    const path = 'user-1/char-1/abc.webp';
    expect(migrateCharacter({ ...helgaJson, portraitPath: path }).portraitPath).toBe(path);
  });

  it('без портрета или с мусором вместо пути поля нет', () => {
    expect(migrateCharacter(helgaJson).portraitPath).toBeUndefined();
    expect(migrateCharacter({ ...helgaJson, portraitPath: 42 }).portraitPath).toBeUndefined();
    expect(migrateCharacter({ ...helgaJson, portraitPath: '' }).portraitPath).toBeUndefined();
  });
});
