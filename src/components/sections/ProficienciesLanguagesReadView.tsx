import type { Character } from '../../types/character';
import styles from './ReadOnlyList.module.css';

export function ProficienciesLanguagesReadView({ character }: { character: Character }) {
  if (!character.proficienciesAndLanguages.trim()) {
    return <p className={styles.empty}>Не указано — добавьте через шестерёнку.</p>;
  }
  return <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{character.proficienciesAndLanguages}</p>;
}
