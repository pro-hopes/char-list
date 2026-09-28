import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useCharacterStore } from '../../store/characterStore';
import type { Character, RestType } from '../../types/character';
import { sanitizeNumberInputEvent } from '../../utils/numberInput';
import { IconButton } from '../common/IconButton';
import { IconPickerModal } from '../common/IconPickerModal';
import styles from './ResourcesSection.module.css';

interface Props {
  character: Character;
}

const RESET_LABELS: Record<RestType, string> = {
  short_rest: 'Короткий отдых',
  long_rest: 'Длинный отдых',
  both: 'Короткий и длинный отдых',
  manual: 'Только вручную',
};

export function ResourcesSection({ character }: Props) {
  const updateResource = useCharacterStore((s) => s.updateResource);
  const removeResource = useCharacterStore((s) => s.removeResource);
  const addResource = useCharacterStore((s) => s.addResource);

  const [newLabel, setNewLabel] = useState('');
  const [newMax, setNewMax] = useState(1);
  const [newResetOn, setNewResetOn] = useState<RestType>('long_rest');
  const [iconPickerFor, setIconPickerFor] = useState<string | null>(null);

  return (
    <div>
      {character.resources.map((resource) => (
        <div key={resource.id} className={styles.tracker}>
          <div className={styles.editRow}>
            <IconButton icon={resource.icon} onClick={() => setIconPickerFor(resource.id)} />
            <input
              type="text"
              value={resource.label}
              onChange={(e) => updateResource(character.id, resource.id, { label: e.target.value })}
            />
            <input
              type="number"
              className={styles.maxInput}
              min={1}
              value={resource.max}
              onChange={(e) =>
                updateResource(character.id, resource.id, { max: Math.max(1, Number(sanitizeNumberInputEvent(e))) })
              }
            />
            <select
              value={resource.resetOn}
              onChange={(e) => updateResource(character.id, resource.id, { resetOn: e.target.value as RestType })}
            >
              {(Object.keys(RESET_LABELS) as RestType[]).map((key) => (
                <option key={key} value={key}>
                  {RESET_LABELS[key]}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={styles.removeButton}
              onClick={() => removeResource(character.id, resource.id)}
              title="Удалить трекер"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}

      <div className={styles.addRow}>
        <input placeholder="Название (напр. Ярость)" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
        <input
          type="number"
          className={styles.maxInput}
          min={1}
          value={newMax}
          onChange={(e) => setNewMax(Math.max(1, Number(sanitizeNumberInputEvent(e))))}
        />
        <select value={newResetOn} onChange={(e) => setNewResetOn(e.target.value as RestType)}>
          {(Object.keys(RESET_LABELS) as RestType[]).map((key) => (
            <option key={key} value={key}>
              {RESET_LABELS[key]}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="accentButton"
          onClick={() => {
            if (!newLabel.trim()) return;
            addResource(character.id, { label: newLabel.trim(), max: newMax, resetOn: newResetOn });
            setNewLabel('');
            setNewMax(1);
          }}
        >
          Добавить
        </button>
      </div>

      {iconPickerFor &&
        (() => {
          const resource = character.resources.find((r) => r.id === iconPickerFor);
          if (!resource) return null;
          return (
            <IconPickerModal
              currentIcon={resource.icon}
              onClose={() => setIconPickerFor(null)}
              onSelect={(icon) => updateResource(character.id, resource.id, { icon })}
            />
          );
        })()}
    </div>
  );
}
