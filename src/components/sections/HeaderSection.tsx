import { ColorPicker } from '../common/ColorPicker';
import { useCharacterStore } from '../../store/characterStore';
import type { Character } from '../../types/character';
import { sanitizeNumberInputEvent } from '../../utils/numberInput';
import styles from './HeaderSection.module.css';

export function HeaderSection({ character }: { character: Character }) {
  const renameCharacter = useCharacterStore((s) => s.renameCharacter);
  const updateMeta = useCharacterStore((s) => s.updateMeta);
  const updateThemeColor = useCharacterStore((s) => s.updateThemeColor);

  return (
    <div>
      <div className={styles.nameRow}>
        <input
          className={styles.nameInput}
          value={character.name}
          onChange={(e) => renameCharacter(character.id, e.target.value)}
        />
        <ColorPicker value={character.themeColor} onChange={(color) => updateThemeColor(character.id, color)} />
      </div>
      <div className={styles.grid}>
        <div className={styles.field}>
          <label htmlFor="meta-race">Раса</label>
          <input
            id="meta-race"
            value={character.meta.race}
            onChange={(e) => updateMeta(character.id, { race: e.target.value })}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="meta-class">Класс</label>
          <input
            id="meta-class"
            value={character.meta.className}
            onChange={(e) => updateMeta(character.id, { className: e.target.value })}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="meta-level">Уровень</label>
          <input
            id="meta-level"
            type="number"
            min={1}
            max={20}
            value={character.meta.level}
            onChange={(e) => updateMeta(character.id, { level: Math.max(1, Number(sanitizeNumberInputEvent(e))) })}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="meta-alignment">Мировоззрение</label>
          <input
            id="meta-alignment"
            value={character.meta.alignment}
            onChange={(e) => updateMeta(character.id, { alignment: e.target.value })}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="meta-faction">Фракция</label>
          <input
            id="meta-faction"
            value={character.meta.faction}
            onChange={(e) => updateMeta(character.id, { faction: e.target.value })}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="meta-background">Предыстория</label>
          <input
            id="meta-background"
            value={character.meta.background}
            onChange={(e) => updateMeta(character.id, { background: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
