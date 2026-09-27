import type { Character } from '../../types/character';
import { BonusListContent } from './BonusListContent';
import styles from './AsideBonusPanel.module.css';

export function AsideBonusPanel({ character }: { character: Character }) {
  return (
    <aside className={styles.aside}>
      <h3 className={styles.title}>Бонусы персонажа</h3>
      <BonusListContent character={character} />
    </aside>
  );
}
