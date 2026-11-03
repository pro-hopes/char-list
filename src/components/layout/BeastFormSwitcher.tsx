import { PawPrint, User } from 'lucide-react';
import { getActiveBeastForm } from '../../engine/beastForm';
import { resolveIconUrl } from '../../engine/iconPack';
import { useCharacterStore } from '../../store/characterStore';
import type { Character } from '../../types/character';
import styles from './BeastFormSwitcher.module.css';

export function BeastFormSwitcher({ character }: { character: Character }) {
  const activateBeastForm = useCharacterStore((s) => s.activateBeastForm);
  const revertBeastForm = useCharacterStore((s) => s.revertBeastForm);

  if (character.beastForms.length === 0) return null;

  const activeForm = getActiveBeastForm(character);
  const resource = character.resources.find((r) => r.id === character.beastFormResourceId);

  return (
    <div className={styles.wrapper}>
      <div className={styles.buttons} role="group" aria-label="Облик">
        <button
          type="button"
          className={`${styles.option} ${!activeForm ? styles.optionActive : ''}`}
          aria-pressed={!activeForm}
          onClick={() => revertBeastForm(character.id)}
        >
          <User size={14} /> {character.name}
        </button>
        {character.beastForms.map((form) => (
          <button
            key={form.id}
            type="button"
            className={`${styles.option} ${activeForm?.id === form.id ? styles.optionActive : ''}`}
            aria-pressed={activeForm?.id === form.id}
            onClick={() => {
              if (activeForm?.id !== form.id) activateBeastForm(character.id, form.id);
            }}
          >
            {form.icon ? <img src={resolveIconUrl(form.icon)} alt="" width={18} height={18} /> : <PawPrint size={14} />}
            {form.name}
          </button>
        ))}
      </div>

      {resource && (
        <div className={styles.resource}>
          {resource.label}: осталось {Math.max(0, resource.max - resource.used)} из {resource.max}
        </div>
      )}

      {activeForm?.notes && <p className={styles.notes}>{activeForm.notes}</p>}
    </div>
  );
}
