import { useState } from 'react';
import { useStatField } from '../../hooks/useStatField';
import { useCharacterStore } from '../../store/characterStore';
import type { BeastForm, Character } from '../../types/character';
import { sanitizeNumberInputEvent } from '../../utils/numberInput';
import styles from './CombatSection.module.css';

/**
 * Хиты в облике: урон сначала снимает временные хиты, затем хиты облика,
 * остаток при падении до 0 переходит на хиты персонажа (логика в damageBeastForm).
 */
export function BeastFormHpCounter({ character, form }: { character: Character; form: BeastForm }) {
  const damageBeastForm = useCharacterStore((s) => s.damageBeastForm);
  const healBeastForm = useCharacterStore((s) => s.healBeastForm);
  // собственные хиты персонажа — из исходного персонажа, а не из облика
  const ownCharacter = useCharacterStore((s) => s.characters[character.id]) ?? character;
  const ownHpMax = useStatField(ownCharacter, ownCharacter.combat.hpMax);
  const [amount, setAmount] = useState(0);

  return (
    <div className={styles.formHp}>
      <div className={styles.hpBlock}>
        <span className={styles.hpLabel}>Хиты облика</span>
        <div className={styles.hpControls}>
          <button type="button" className={styles.stepButton} onClick={() => damageBeastForm(character.id, 1)}>
            −
          </button>
          <span className={styles.formHpValue}>
            {form.hpCurrent} / {form.hpMax}
          </span>
          <button type="button" className={styles.stepButton} onClick={() => healBeastForm(character.id, 1)}>
            +
          </button>
        </div>
      </div>

      <div className={styles.formHpActions}>
        <input
          type="number"
          min={0}
          className={styles.hpValue}
          value={amount}
          onChange={(e) => setAmount(Math.max(0, Number(sanitizeNumberInputEvent(e))))}
          aria-label="Количество хитов"
        />
        <button
          type="button"
          className="accentButton"
          disabled={amount <= 0}
          onClick={() => {
            damageBeastForm(character.id, amount);
            setAmount(0);
          }}
        >
          Урон
        </button>
        <button
          type="button"
          className={styles.stepButtonWide}
          disabled={amount <= 0}
          onClick={() => {
            healBeastForm(character.id, amount);
            setAmount(0);
          }}
        >
          Лечение
        </button>
      </div>

      <div className={styles.ownHp}>
        Хиты персонажа: {ownCharacter.combat.hpCurrent} / {ownHpMax.flatTotal}
      </div>
    </div>
  );
}
