import { Trash2 } from 'lucide-react';
import { useCharacterStore } from '../../store/characterStore';
import type { Character } from '../../types/character';
import styles from './EditableList.module.css';

export function FeaturesSection({ character }: { character: Character }) {
  const addFeature = useCharacterStore((s) => s.addFeature);
  const updateFeature = useCharacterStore((s) => s.updateFeature);
  const removeFeature = useCharacterStore((s) => s.removeFeature);

  return (
    <div>
      {character.features.map((feature) => (
        <div key={feature.id} className={styles.item}>
          <div className={styles.itemHead}>
            <input
              value={feature.title}
              onChange={(e) => updateFeature(character.id, feature.id, { title: e.target.value })}
            />
            <button
              type="button"
              className={styles.removeButton}
              onClick={() => removeFeature(character.id, feature.id)}
            >
              <Trash2 size={14} />
            </button>
          </div>
          <textarea
            className={styles.textarea}
            value={feature.description}
            onChange={(e) => updateFeature(character.id, feature.id, { description: e.target.value })}
          />
        </div>
      ))}
      <button type="button" className="accentButton" onClick={() => addFeature(character.id)}>
        Добавить способность
      </button>
    </div>
  );
}
