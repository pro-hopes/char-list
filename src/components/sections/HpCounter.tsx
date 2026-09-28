import { useCharacterStore } from '../../store/characterStore';
import type { Character } from '../../types/character';
import { sanitizeNumberInputEvent } from '../../utils/numberInput';
import styles from './CombatSection.module.css';

export function HpCounter({ character, kind, label }: { character: Character; kind: 'current' | 'temp'; label: string }) {
  const adjustHp = useCharacterStore((s) => s.adjustHp);
  const setHpValue = useCharacterStore((s) => s.setHpValue);
  const value = kind === 'current' ? character.combat.hpCurrent : character.combat.hpTemp;

  return (
    <div className={styles.hpBlock}>
      <span className={styles.hpLabel}>{label}</span>
      <div className={styles.hpControls}>
        <button type="button" className={styles.stepButton} onClick={() => adjustHp(character.id, kind, -1)}>
          −
        </button>
        <input
          type="number"
          className={styles.hpValue}
          value={value}
          onChange={(e) => setHpValue(character.id, kind, Number(sanitizeNumberInputEvent(e)))}
        />
        <button type="button" className={styles.stepButton} onClick={() => adjustHp(character.id, kind, 1)}>
          +
        </button>
      </div>
    </div>
  );
}
