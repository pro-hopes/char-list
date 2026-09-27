import { useState } from 'react';
import { isValidDiceNotation } from '../../engine/dice';
import { ABILITY_KEYS, ABILITY_LABELS, type AbilityKey, type Bonus, type BonusType } from '../../types/character';
import styles from './BonusModal.module.css';
import { Modal } from './Modal';

interface BonusModalProps {
  fieldLabel: string;
  onClose: () => void;
  onSubmit: (data: Omit<Bonus, 'id' | 'appliesTo'>) => void;
}

const DICE_PRESETS = ['1к4', '1к6', '1к8', '1к10', '1к12', '2к6'];

const TYPE_LABELS: Record<BonusType, string> = {
  fixed: 'Фиксированное',
  dice: 'Кубик',
  ability_mod: 'Мод. характеристики',
};

export function BonusModal({ fieldLabel, onClose, onSubmit }: BonusModalProps) {
  const [label, setLabel] = useState('');
  const [type, setType] = useState<BonusType>('fixed');
  const [value, setValue] = useState('1');
  const [dice, setDice] = useState('1к4');
  const [abilityKey, setAbilityKey] = useState<AbilityKey>('STR');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    if (!label.trim()) {
      setError('Укажите название источника бонуса');
      return;
    }
    if (type === 'fixed') {
      const num = Number(value);
      if (Number.isNaN(num)) {
        setError('Значение должно быть числом');
        return;
      }
      onSubmit({ label: label.trim(), type, value: num });
    } else if (type === 'dice') {
      if (!isValidDiceNotation(dice)) {
        setError('Нотация кубика должна быть вида "1к4"');
        return;
      }
      onSubmit({ label: label.trim(), type, dice: dice.trim() });
    } else {
      onSubmit({ label: label.trim(), type, abilityKey });
    }
    onClose();
  }

  return (
    <Modal title={`Бонус: ${fieldLabel}`} onClose={onClose}>
      <div className={styles.field}>
        <label htmlFor="bonus-label">Название/источник</label>
        <input
          id="bonus-label"
          type="text"
          placeholder='напр. "Кольцо защиты +1"'
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
      </div>

      <div className={styles.typeTabs}>
        {(Object.keys(TYPE_LABELS) as BonusType[]).map((t) => (
          <button
            key={t}
            type="button"
            className={`${styles.typeTab} ${type === t ? styles.typeTabActive : ''}`}
            onClick={() => setType(t)}
          >
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {type === 'fixed' && (
        <div className={styles.field}>
          <label htmlFor="bonus-value">Значение</label>
          <input id="bonus-value" type="number" value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
      )}

      {type === 'dice' && (
        <div className={styles.field}>
          <label htmlFor="bonus-dice">Нотация (напр. "1к4")</label>
          <input id="bonus-dice" type="text" value={dice} onChange={(e) => setDice(e.target.value)} />
          <div className={styles.presets}>
            {DICE_PRESETS.map((preset) => (
              <button key={preset} type="button" className={styles.presetButton} onClick={() => setDice(preset)}>
                {preset}
              </button>
            ))}
          </div>
        </div>
      )}

      {type === 'ability_mod' && (
        <div className={styles.field}>
          <label htmlFor="bonus-ability">Характеристика</label>
          <select id="bonus-ability" value={abilityKey} onChange={(e) => setAbilityKey(e.target.value as AbilityKey)}>
            {ABILITY_KEYS.map((key) => (
              <option key={key} value={key}>
                {ABILITY_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.actions}>
        <button type="button" className={styles.cancelButton} onClick={onClose}>
          Отмена
        </button>
        <button type="button" className="accentButton" onClick={handleSubmit}>
          Добавить
        </button>
      </div>
    </Modal>
  );
}
