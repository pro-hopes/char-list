import type { Character } from '../../types/character';
import styles from './ReadOnlyList.module.css';

export function BackgroundReadView({ character }: { character: Character }) {
  if (!character.meta.background.trim()) {
    return <p className={styles.empty}>Предыстория пока не написана — добавьте через шестерёнку.</p>;
  }
  return <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{character.meta.background}</p>;
}
