import { Dices, Plus } from 'lucide-react';
import { useState } from 'react';
import { useDiceRoll } from '../../hooks/useDiceRoll';
import type { StatFieldComputeResult } from '../../engine/computeStatField';
import { FIELD_INFO } from '../../engine/fieldInfo';
import type { StatField } from '../../types/character';
import { sanitizeNumberInputEvent } from '../../utils/numberInput';
import { BonusBadge } from './BonusBadge';
import { InfoButton } from './InfoButton';
import { InfoModal } from './InfoModal';
import styles from './StatFieldView.module.css';

interface StatFieldViewProps {
  field: StatField;
  computed: StatFieldComputeResult;
  label?: string;
  /** Ключ в FIELD_INFO — если передан, у поля появляется кнопка "i". */
  infoKey?: string;
  /** Только чтение: скрывает инпут базового значения, чекбокс владения и кнопку "+бонус". */
  readOnly?: boolean;
  onChangeBaseValue?: (value: number) => void;
  onToggleProficient?: () => void;
  onAddBonusClick?: () => void;
}

export function StatFieldView({
  field,
  computed,
  label,
  infoKey,
  readOnly,
  onChangeBaseValue,
  onToggleProficient,
  onAddBonusClick,
}: StatFieldViewProps) {
  const { lastRoll, roll } = useDiceRoll();
  const [infoOpen, setInfoOpen] = useState(false);
  const canRoll = computed.diceParts.length > 0;
  const bonusCount = field.bonusIds.length;
  const info = infoKey ? FIELD_INFO[infoKey] : undefined;
  const showProficiencyDot = readOnly && field.proficient !== undefined;

  return (
    <div className={styles.row}>
      <span className={styles.label}>{label ?? field.label}</span>
      {info && <InfoButton onClick={() => setInfoOpen(true)} title={`Что такое «${info.title}»`} />}

      {showProficiencyDot && (
        <span
          className={`${styles.proficiencyDot} ${field.proficient ? styles.proficiencyDotActive : ''}`}
          title={field.proficient ? 'Есть владение' : 'Без владения'}
        />
      )}

      {!readOnly && onToggleProficient && (
        <input
          type="checkbox"
          className={styles.proficientCheckbox}
          checked={!!field.proficient}
          onChange={onToggleProficient}
          title="Владение"
        />
      )}

      {!readOnly && (
        <input
          type="number"
          className={styles.baseInput}
          value={field.baseValue}
          onChange={(e) => onChangeBaseValue?.(Number(sanitizeNumberInputEvent(e)))}
        />
      )}

      <span
        className={`${styles.display} ${readOnly ? styles.displayReadOnly : ''}`}
        title={computed.breakdown.map((b) => b.source).join(', ')}
      >
        {computed.display}
      </span>

      {!readOnly && onAddBonusClick && (
        <button
          type="button"
          className={`${styles.iconButton} ${bonusCount > 0 ? styles.iconButtonHasBonus : ''}`}
          onClick={onAddBonusClick}
          title="Добавить бонус"
        >
          <Plus size={14} />
          <BonusBadge count={bonusCount} />
        </button>
      )}

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

      {info && infoOpen && (
        <InfoModal
          title={info.title}
          description={info.description}
          affects={info.affects}
          breakdown={computed.breakdown}
          onClose={() => setInfoOpen(false)}
        />
      )}
    </div>
  );
}
