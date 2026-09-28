import type { Character } from '../../types/character';
import styles from './ReadOnlyList.module.css';

export function NotesReadView({ character }: { character: Character }) {
  if (!character.notes.trim()) {
    return <p className={styles.empty}>Заметок пока нет — добавьте через шестерёнку.</p>;
  }
  return <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{character.notes}</p>;
}
