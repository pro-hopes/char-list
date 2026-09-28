import { Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { listAllStatFields, type StatFieldCategory, type StatFieldRef } from '../../engine/statFieldRegistry';
import { useCharacterStore } from '../../store/characterStore';
import { ABILITY_LABELS, type Bonus, type Character } from '../../types/character';
import styles from './BonusListContent.module.css';

function bonusValueText(bonus: Bonus): string {
  if (bonus.type === 'fixed') return `${bonus.value! >= 0 ? '+' : ''}${bonus.value}`;
  if (bonus.type === 'dice') return bonus.dice!;
  return `мод. ${ABILITY_LABELS[bonus.abilityKey!]}`;
}

const CATEGORY_TITLES: Record<StatFieldCategory, string> = {
  ability: 'Характеристики',
  combat: 'Боевые параметры',
  saving_throw: 'Спасброски',
  skill: 'Навыки',
  attack: 'Атаки / оружие',
  spellcasting: 'Заклинания',
  other: 'Остальное',
};

// Порядок соответствует порядку разделов на самом листе персонажа
const CATEGORY_ORDER: StatFieldCategory[] = [
  'ability',
  'combat',
  'saving_throw',
  'skill',
  'attack',
  'spellcasting',
  'other',
];

function BonusRow({ character, bonus, targetLabel }: { character: Character; bonus: Bonus; targetLabel: string }) {
  const removeBonus = useCharacterStore((s) => s.removeBonus);
  return (
    <div className={styles.item}>
      <div className={styles.itemInfo}>
        <span className={styles.itemLabel}>{bonus.label}</span>
        <span className={styles.itemTarget}>{targetLabel}</span>
        <span className={styles.itemValue}>{bonusValueText(bonus)}</span>
      </div>
      <button
        type="button"
        className={styles.removeButton}
        onClick={() => removeBonus(character.id, bonus.id)}
        title="Удалить бонус"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

export function BonusListContent({ character }: { character: Character }) {
  const fieldById = useMemo(() => {
    const map = new Map<string, StatFieldRef>();
    for (const ref of listAllStatFields(character)) map.set(ref.field.id, ref);
    return map;
  }, [character]);

  if (character.bonuses.length === 0) {
    return <p className={styles.empty}>Бонусов пока нет — добавьте их через кнопку "+" у любого поля.</p>;
  }

  const groups: Record<StatFieldCategory, Bonus[]> = {
    ability: [],
    combat: [],
    saving_throw: [],
    skill: [],
    attack: [],
    spellcasting: [],
    other: [],
  };
  for (const bonus of character.bonuses) {
    const category = fieldById.get(bonus.appliesTo)?.category ?? 'other';
    groups[category].push(bonus);
  }

  return (
    <div>
      {CATEGORY_ORDER.filter((category) => groups[category].length > 0).map((category) => (
        <div key={category} className={styles.group}>
          <h4 className={styles.groupTitle}>{CATEGORY_TITLES[category]}</h4>
          {groups[category].map((bonus) => (
            <BonusRow
              key={bonus.id}
              character={character}
              bonus={bonus}
              targetLabel={fieldById.get(bonus.appliesTo)?.label ?? bonus.appliesTo}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
