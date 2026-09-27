import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useCharacterStore } from '../../store/characterStore';
import type { Character } from '../../types/character';
import { IconButton } from '../common/IconButton';
import { IconPickerModal } from '../common/IconPickerModal';
import styles from './EditableList.module.css';

export function EquipmentSection({ character }: { character: Character }) {
  const addEquipment = useCharacterStore((s) => s.addEquipment);
  const updateEquipment = useCharacterStore((s) => s.updateEquipment);
  const adjustEquipmentQuantity = useCharacterStore((s) => s.adjustEquipmentQuantity);
  const removeEquipment = useCharacterStore((s) => s.removeEquipment);
  const [iconPickerFor, setIconPickerFor] = useState<string | null>(null);

  return (
    <div>
      {character.equipment.map((item) => (
        <div key={item.id} className={styles.item}>
          <div className={styles.itemBody}>
            <IconButton icon={item.icon} onClick={() => setIconPickerFor(item.id)} />
            <input
              type="text"
              value={item.name}
              onChange={(e) => updateEquipment(character.id, item.id, { name: e.target.value })}
            />
            <div className={styles.quantityControls} title="Количество">
              <button
                type="button"
                className={styles.stepButton}
                onClick={() => adjustEquipmentQuantity(character.id, item.id, -1)}
              >
                −
              </button>
              <input
                type="number"
                min={0}
                className={styles.quantityValue}
                value={item.quantity}
                onChange={(e) => updateEquipment(character.id, item.id, { quantity: Math.max(0, Number(e.target.value)) })}
              />
              <button
                type="button"
                className={styles.stepButton}
                onClick={() => adjustEquipmentQuantity(character.id, item.id, 1)}
              >
                +
              </button>
            </div>
            <button
              type="button"
              className={styles.removeButton}
              onClick={() => removeEquipment(character.id, item.id)}
            >
              <Trash2 size={14} />
            </button>
          </div>
          <input
            type="text"
            style={{ width: '100%', marginTop: 6 }}
            placeholder="Заметка"
            value={item.note}
            onChange={(e) => updateEquipment(character.id, item.id, { note: e.target.value })}
          />
        </div>
      ))}
      <button type="button" className="accentButton" onClick={() => addEquipment(character.id)}>
        Добавить предмет
      </button>

      {iconPickerFor &&
        (() => {
          const item = character.equipment.find((e) => e.id === iconPickerFor);
          if (!item) return null;
          return (
            <IconPickerModal
              currentIcon={item.icon}
              onClose={() => setIconPickerFor(null)}
              onSelect={(icon) => updateEquipment(character.id, item.id, { icon })}
            />
          );
        })()}
    </div>
  );
}
