import { resolveIconUrl } from '../../engine/iconPack';
import { useCharacterStore } from '../../store/characterStore';
import type { Character } from '../../types/character';
import styles from './ReadOnlyList.module.css';

export function EquipmentReadView({ character }: { character: Character }) {
  const adjustEquipmentQuantity = useCharacterStore((s) => s.adjustEquipmentQuantity);

  if (character.equipment.length === 0) {
    return <p className={styles.empty}>Рюкзак пуст — откройте его, чтобы добавить предметы.</p>;
  }

  return (
    <div>
      {character.equipment.map((item) => (
        <div key={item.id} className={styles.item}>
          <div className={styles.itemHead}>
            {item.icon && <img className={styles.itemIcon} src={resolveIconUrl(item.icon)} alt="" />}
            <span>{item.name}</span>
            <div className={styles.quantity} title="Количество">
              <button
                type="button"
                className={styles.stepButton}
                onClick={() => adjustEquipmentQuantity(character.id, item.id, -1)}
              >
                −
              </button>
              <span className={styles.quantityValue}>{item.quantity}</span>
              <button
                type="button"
                className={styles.stepButton}
                onClick={() => adjustEquipmentQuantity(character.id, item.id, 1)}
              >
                +
              </button>
            </div>
          </div>
          {item.note && <p className={styles.itemNote}>{item.note}</p>}
        </div>
      ))}
    </div>
  );
}
