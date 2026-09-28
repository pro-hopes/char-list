import type { Character } from '../../types/character';
import styles from './HeaderReadView.module.css';

export function HeaderReadView({ character }: { character: Character }) {
  const subtitle = [character.meta.race || 'Раса не указана', character.meta.className || 'Класс не указан']
    .filter(Boolean)
    .join(' · ');
  const meta = [character.meta.alignment, character.meta.faction].filter(Boolean).join(' · ');

  return (
    <div className={styles.wrapper}>
      <div className={styles.colorBar} style={{ background: character.themeColor }} />
      <div className={styles.body}>
        <h2 className={styles.name}>{character.name}</h2>
        <p className={styles.subtitle}>
          {subtitle} · Уровень {character.meta.level}
        </p>
        {meta && <p className={styles.meta}>{meta}</p>}
        {character.meta.background && <p className={styles.background}>{character.meta.background}</p>}
      </div>
    </div>
  );
}
