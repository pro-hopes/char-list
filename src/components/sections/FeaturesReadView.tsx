import { resolveIconUrl } from '../../engine/iconPack';
import type { Character } from '../../types/character';
import styles from './ReadOnlyList.module.css';

export function FeaturesReadView({ character }: { character: Character }) {
  if (character.features.length === 0) {
    return <p className={styles.empty}>Способностей пока нет — добавьте через шестерёнку.</p>;
  }
  return (
    <div>
      {character.features.map((feature) => (
        <div key={feature.id} className={styles.item}>
          <div className={styles.itemHead}>
            {feature.icon && <img className={styles.itemIcon} src={resolveIconUrl(feature.icon)} alt="" />}
            <span>{feature.title}</span>
          </div>
          {feature.description && <p className={styles.itemNote}>{feature.description}</p>}
        </div>
      ))}
    </div>
  );
}
