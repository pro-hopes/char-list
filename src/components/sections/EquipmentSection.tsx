import { Trash2 } from 'lucide-react';
import { useCharacterStore } from '../../store/characterStore';
import type { Character } from '../../types/character';
import styles from './EditableList.module.css';

export function EquipmentSection({ character }: { character: Character }) {
  const addEquipment = useCharacterStore((s) => s.addEquipment);
  const updateEquipment = useCharacterStore((s) => s.updateEquipment);
  const removeEquipment = useCharacterStore((s) => s.removeEquipment);

  return (
    <div>
      {character.equipment.map((item) => (
        <div key={item.id} className={styles.item}>
          <div className={styles.itemHead}>
            <input
              value={item.name}
              onChange={(e) => updateEquipment(character.id, item.id, { name: e.target.value })}
            />
            <button
              type="button"
              className={styles.removeButton}
              onClick={() => removeEquipment(character.id, item.id)}
            >
              <Trash2 size={14} />
            </button>
          </div>
          <input
            style={{ width: '100%' }}
            placeholder="Заметка"
            value={item.note}
            onChange={(e) => updateEquipment(character.id, item.id, { note: e.target.value })}
          />
        </div>
      ))}
      <button type="button" className="accentButton" onClick={() => addEquipment(character.id)}>
        Добавить предмет
      </button>
    </div>
  );
}
