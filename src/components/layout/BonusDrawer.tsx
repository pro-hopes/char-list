import { ScrollText, X } from 'lucide-react';
import { useCharacterStore } from '../../store/characterStore';
import type { Character } from '../../types/character';
import { BonusListContent } from './BonusListContent';
import styles from './BonusDrawer.module.css';

export function BonusDrawer({ character }: { character: Character }) {
  const open = useCharacterStore((s) => s.ui.asideOpen);
  const toggleAside = useCharacterStore((s) => s.toggleAside);

  if (!open) {
    return (
      <button type="button" className={styles.fab} onClick={toggleAside} title="Бонусы персонажа">
        <ScrollText size={22} />
      </button>
    );
  }

  return (
    <>
      <div className={styles.overlay} onClick={toggleAside} />
      <div className={styles.drawer}>
        <div className={styles.header}>
          <h3 className={styles.title}>Бонусы персонажа</h3>
          <button type="button" className={styles.closeButton} onClick={toggleAside}>
            <X size={16} />
          </button>
        </div>
        <BonusListContent character={character} />
      </div>
    </>
  );
}
