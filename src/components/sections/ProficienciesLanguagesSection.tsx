import { useCharacterStore } from '../../store/characterStore';
import type { Character } from '../../types/character';
import styles from './EditableList.module.css';

export function ProficienciesLanguagesSection({ character }: { character: Character }) {
  const updateProficienciesAndLanguages = useCharacterStore((s) => s.updateProficienciesAndLanguages);
  return (
    <textarea
      className={styles.textarea}
      style={{ minHeight: 80 }}
      value={character.proficienciesAndLanguages}
      onChange={(e) => updateProficienciesAndLanguages(character.id, e.target.value)}
    />
  );
}
