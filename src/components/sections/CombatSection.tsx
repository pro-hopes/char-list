import { useStatField } from '../../hooks/useStatField';
import { useCharacterStore } from '../../store/characterStore';
import type { Character } from '../../types/character';
import { StatFieldView } from '../common/StatFieldView';
import styles from './CombatSection.module.css';

interface Props {
  character: Character;
  onAddBonus: (fieldId: string, label: string) => void;
}

function HpCounter({ character, kind, label }: { character: Character; kind: 'current' | 'temp'; label: string }) {
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
          onChange={(e) => setHpValue(character.id, kind, Number(e.target.value))}
        />
        <button type="button" className={styles.stepButton} onClick={() => adjustHp(character.id, kind, 1)}>
          +
        </button>
      </div>
    </div>
  );
}

export function CombatSection({ character, onAddBonus }: Props) {
  const updateFieldBaseValue = useCharacterStore((s) => s.updateFieldBaseValue);

  const hpMax = useStatField(character, character.combat.hpMax);
  const ac = useStatField(character, character.combat.ac);
  const speed = useStatField(character, character.combat.speed);
  const initiative = useStatField(character, character.combat.initiative);

  return (
    <div>
      <div className={styles.hpRow}>
        <HpCounter character={character} kind="current" label="Хиты (тек.)" />
        <HpCounter character={character} kind="temp" label="Временные" />
      </div>

      <StatFieldView
        field={character.combat.hpMax}
        computed={hpMax}
        onChangeBaseValue={(v) => updateFieldBaseValue(character.id, character.combat.hpMax.id, v)}
        onAddBonusClick={() => onAddBonus(character.combat.hpMax.id, character.combat.hpMax.label)}
      />
      <StatFieldView
        field={character.combat.ac}
        computed={ac}
        onChangeBaseValue={(v) => updateFieldBaseValue(character.id, character.combat.ac.id, v)}
        onAddBonusClick={() => onAddBonus(character.combat.ac.id, character.combat.ac.label)}
      />
      <StatFieldView
        field={character.combat.speed}
        computed={speed}
        onChangeBaseValue={(v) => updateFieldBaseValue(character.id, character.combat.speed.id, v)}
        onAddBonusClick={() => onAddBonus(character.combat.speed.id, character.combat.speed.label)}
      />
      <StatFieldView
        field={character.combat.initiative}
        computed={initiative}
        onChangeBaseValue={(v) => updateFieldBaseValue(character.id, character.combat.initiative.id, v)}
        onAddBonusClick={() => onAddBonus(character.combat.initiative.id, character.combat.initiative.label)}
      />
    </div>
  );
}
