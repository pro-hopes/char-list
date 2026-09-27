import { Dices, Plus } from 'lucide-react';
import { useDiceRoll } from '../../hooks/useDiceRoll';
import type { StatFieldComputeResult } from '../../engine/computeStatField';
import type { StatField } from '../../types/character';
import styles from './StatFieldView.module.css';

interface StatFieldViewProps {
  field: StatField;
  computed: StatFieldComputeResult;
  label?: string;
  onChangeBaseValue: (value: number) => void;
  onToggleProficient?: () => void;
  onAddBonusClick: () => void;
}

export function StatFieldView({
  field,
  computed,
  label,
  onChangeBaseValue,
  onToggleProficient,
  onAddBonusClick,
}: StatFieldViewProps) {
  const { lastRoll, roll } = useDiceRoll();
  const canRoll = computed.diceParts.length > 0;

  return (
    <div className={styles.row}>
      <span className={styles.label}>{label ?? field.label}</span>

      {onToggleProficient && (
        <input
          type="checkbox"
          className={styles.proficientCheckbox}
          checked={!!field.proficient}
          onChange={onToggleProficient}
          title="Владение"
        />
      )}

      <input
        type="number"
        className={styles.baseInput}
        value={field.baseValue}
        onChange={(e) => onChangeBaseValue(Number(e.target.value))}
      />

      <span className={styles.display} title={computed.breakdown.map((b) => b.source).join(', ')}>
        {computed.display}
      </span>

      <button type="button" className={styles.iconButton} onClick={onAddBonusClick} title="Добавить бонус">
        <Plus size={14} />
      </button>

      {canRoll && (
        <button
          type="button"
          className={styles.rollButton}
          onClick={() => roll(computed.flatTotal, computed.diceParts)}
        >
          <Dices size={14} /> Бросить
        </button>
      )}

      {lastRoll && <span className={styles.rollResult}>{lastRoll}</span>}
    </div>
  );
}
