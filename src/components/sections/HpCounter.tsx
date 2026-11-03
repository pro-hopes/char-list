import { useStatField } from '../../hooks/useStatField';
import { useCharacterStore } from '../../store/characterStore';
import type { Character } from '../../types/character';
import { sanitizeNumberInputEvent } from '../../utils/numberInput';
import styles from './CombatSection.module.css';

export function HpCounter({ character, kind, label }: { character: Character; kind: 'current' | 'temp'; label: string }) {
  const adjustHp = useCharacterStore((s) => s.adjustHp);
  const setHpValue = useCharacterStore((s) => s.setHpValue);
  const hpMax = useStatField(character, character.combat.hpMax).flatTotal;
  const value = kind === 'current' ? character.combat.hpCurrent : character.combat.hpTemp;
  // текущие хиты упираются в максимум (если он задан), временные — нет
  const atMax = kind === 'current' && hpMax > 0 && value >= hpMax;

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
          min={0}
          max={kind === 'current' && hpMax > 0 ? hpMax : undefined}
          value={value}
          onChange={(e) => setHpValue(character.id, kind, Number(sanitizeNumberInputEvent(e)))}
        />
        <button
          type="button"
          className={styles.stepButton}
          disabled={atMax}
          title={atMax ? 'Хиты уже на максимуме' : undefined}
          onClick={() => adjustHp(character.id, kind, 1)}
        >
          +
        </button>
      </div>
    </div>
  );
}
