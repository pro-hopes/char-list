import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useCharacterStore } from '../../store/characterStore';
import type { Character, RestType } from '../../types/character';
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
  const toggleResourceUsed = useCharacterStore((s) => s.toggleResourceUsed);
  const removeResource = useCharacterStore((s) => s.removeResource);
  const addResource = useCharacterStore((s) => s.addResource);
  const applyRest = useCharacterStore((s) => s.applyRest);

  const [newLabel, setNewLabel] = useState('');
  const [newMax, setNewMax] = useState(1);
  const [newResetOn, setNewResetOn] = useState<RestType>('long_rest');

  return (
    <div>
      <div className={styles.restRow}>
        <button type="button" className="accentButton" onClick={() => applyRest(character.id, 'short')}>
          Короткий отдых
        </button>
        <button type="button" className="accentButton" onClick={() => applyRest(character.id, 'long')}>
          Длинный отдых
        </button>
      </div>

      {character.resources.map((resource) => (
        <div key={resource.id} className={styles.tracker}>
          <div className={styles.trackerHead}>
            <span className={styles.trackerName}>{resource.label}</span>
            <span className={styles.resetLabel}>{RESET_LABELS[resource.resetOn]}</span>
            <button
              type="button"
              className={styles.removeButton}
              onClick={() => removeResource(character.id, resource.id)}
              title="Удалить трекер"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <div className={styles.checkboxes}>
            {Array.from({ length: resource.max }).map((_, index) => (
              <input
                key={index}
                type="checkbox"
                checked={index < resource.used}
                onChange={() => toggleResourceUsed(character.id, resource.id, index)}
              />
            ))}
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
          onChange={(e) => setNewMax(Math.max(1, Number(e.target.value)))}
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
    </div>
  );
}
