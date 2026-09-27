import { Trash2 } from 'lucide-react';
import { findStatField } from '../../engine/statFieldRegistry';
import { useCharacterStore } from '../../store/characterStore';
import { ABILITY_LABELS, type Character } from '../../types/character';
import styles from './BonusListContent.module.css';

function bonusValueText(bonus: Character['bonuses'][number]): string {
  if (bonus.type === 'fixed') return `${bonus.value! >= 0 ? '+' : ''}${bonus.value}`;
  if (bonus.type === 'dice') return bonus.dice!;
  return `мод. ${ABILITY_LABELS[bonus.abilityKey!]}`;
}

export function BonusListContent({ character }: { character: Character }) {
  const removeBonus = useCharacterStore((s) => s.removeBonus);

  if (character.bonuses.length === 0) {
    return <p className={styles.empty}>Бонусов пока нет — добавьте их через кнопку "+" у любого поля.</p>;
  }

  return (
    <div>
      {character.bonuses.map((bonus) => {
        const ref = findStatField(character, bonus.appliesTo);
        return (
          <div key={bonus.id} className={styles.item}>
            <div className={styles.itemInfo}>
              <span className={styles.itemLabel}>{bonus.label}</span>
              <span className={styles.itemTarget}>{ref?.label ?? bonus.appliesTo}</span>
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
      })}
    </div>
  );
}
