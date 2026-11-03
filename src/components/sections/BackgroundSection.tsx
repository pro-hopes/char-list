import { useCharacterStore } from '../../store/characterStore';
import type { Character } from '../../types/character';
import styles from './EditableList.module.css';

export function BackgroundSection({ character }: { character: Character }) {
  const updateMeta = useCharacterStore((s) => s.updateMeta);
  return (
    <textarea
      className={styles.textarea}
      style={{ minHeight: 240 }}
      placeholder="Откуда родом персонаж, что с ним случилось до начала приключений…"
      value={character.meta.background}
      onChange={(e) => updateMeta(character.id, { background: e.target.value })}
    />
  );
}
