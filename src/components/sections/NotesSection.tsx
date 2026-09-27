import { useCharacterStore } from '../../store/characterStore';
import type { Character } from '../../types/character';
import styles from './EditableList.module.css';

export function NotesSection({ character }: { character: Character }) {
  const updateNotes = useCharacterStore((s) => s.updateNotes);
  return (
    <textarea
      className={styles.textarea}
      style={{ minHeight: 120 }}
      value={character.notes}
      onChange={(e) => updateNotes(character.id, e.target.value)}
    />
  );
}
