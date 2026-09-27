import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useCharacterStore } from '../../store/characterStore';
import type { Character } from '../../types/character';
import { IconButton } from '../common/IconButton';
import { IconPickerModal } from '../common/IconPickerModal';
import styles from './EditableList.module.css';

export function FeaturesSection({ character }: { character: Character }) {
  const addFeature = useCharacterStore((s) => s.addFeature);
  const updateFeature = useCharacterStore((s) => s.updateFeature);
  const removeFeature = useCharacterStore((s) => s.removeFeature);
  const [iconPickerFor, setIconPickerFor] = useState<string | null>(null);

  return (
    <div>
      {character.features.map((feature) => (
        <div key={feature.id} className={styles.item}>
          <div className={styles.itemHead}>
            <IconButton icon={feature.icon} onClick={() => setIconPickerFor(feature.id)} />
            <input
              className={styles.nameField}
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

      {iconPickerFor &&
        (() => {
          const feature = character.features.find((f) => f.id === iconPickerFor);
          if (!feature) return null;
          return (
            <IconPickerModal
              currentIcon={feature.icon}
              onClose={() => setIconPickerFor(null)}
              onSelect={(icon) => updateFeature(character.id, feature.id, { icon })}
            />
          );
        })()}
    </div>
  );
}
