import { resolveIconUrl } from '../../engine/iconPack';
import { useCharacterStore } from '../../store/characterStore';
import type { Character } from '../../types/character';
import styles from './ResourcesSection.module.css';

export function ResourcesReadView({ character }: { character: Character }) {
  const toggleResourceUsed = useCharacterStore((s) => s.toggleResourceUsed);
  const applyRest = useCharacterStore((s) => s.applyRest);

  return (
    <div>
      <div className={styles.restRow}>
        <button type="button" className="accentButton" onClick={() => applyRest(character.id, 'short')}>
          Короткий отдых
        </button>
        <button type="button" className="accentButton" onClick={() => applyRest(character.id, 'long')}>
          Длинный отдых
        </button>
      </div>

      {character.resources.length === 0 && <p className={styles.empty}>Ресурсов пока нет — добавьте через шестерёнку.</p>}

      {character.resources.map((resource) => (
        <div key={resource.id} className={styles.tracker}>
          <div className={styles.trackerHead}>
            {resource.icon && <img src={resolveIconUrl(resource.icon)} alt="" width={22} height={22} />}
            <span className={styles.trackerName}>{resource.label}</span>
          </div>
          <div className={styles.checkboxes}>
            {Array.from({ length: resource.max }).map((_, index) => (
              <input
                key={index}
                type="checkbox"
                checked={index < resource.used}
                onChange={() => toggleResourceUsed(character.id, resource.id, index)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
