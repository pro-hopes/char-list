import { Dices, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useDiceRoll } from '../../hooks/useDiceRoll';
import { useAttackDamage } from '../../hooks/useAttackDamage';
import { useStatField } from '../../hooks/useStatField';
import { useCharacterStore } from '../../store/characterStore';
import { FIELD_INFO } from '../../engine/fieldInfo';
import type { Attack, Character } from '../../types/character';
import { BonusBadge } from '../common/BonusBadge';
import { IconButton } from '../common/IconButton';
import { IconPickerModal } from '../common/IconPickerModal';
import { InfoButton } from '../common/InfoButton';
import { InfoModal } from '../common/InfoModal';
import { StatFieldView } from '../common/StatFieldView';
import styles from './AttacksSection.module.css';

const damageInfo = FIELD_INFO['attack-damage'];

interface Props {
  character: Character;
  onAddBonus: (fieldId: string, label: string) => void;
}

function AttackRow({ character, attack, onAddBonus }: { character: Character; attack: Attack; onAddBonus: Props['onAddBonus'] }) {
  const attackBonusComputed = useStatField(character, attack.attackBonus);
  const attackResult = useAttackDamage(character, attack);
  const updateFieldBaseValue = useCharacterStore((s) => s.updateFieldBaseValue);
  const toggleProficient = useCharacterStore((s) => s.toggleProficient);
  const updateAttack = useCharacterStore((s) => s.updateAttack);
  const removeAttack = useCharacterStore((s) => s.removeAttack);
  const { lastRoll, roll } = useDiceRoll();
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [damageInfoOpen, setDamageInfoOpen] = useState(false);

  return (
    <div className={styles.attack}>
      <div className={styles.headRow}>
        <IconButton icon={attack.icon} onClick={() => setIconPickerOpen(true)} />
        <input
          className={styles.nameInput}
          value={attack.name}
          onChange={(e) => updateAttack(character.id, attack.id, { name: e.target.value })}
        />
        <button
          type="button"
          className={styles.removeButton}
          onClick={() => removeAttack(character.id, attack.id)}
          title="Удалить атаку"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {iconPickerOpen && (
        <IconPickerModal
          currentIcon={attack.icon}
          onClose={() => setIconPickerOpen(false)}
          onSelect={(icon) => updateAttack(character.id, attack.id, { icon })}
        />
      )}

      <StatFieldView
        field={attack.attackBonus}
        computed={attackBonusComputed}
        label="Бонус атаки"
        infoKey="attack-bonus"
        onChangeBaseValue={(v) => updateFieldBaseValue(character.id, attack.attackBonus.id, v)}
        onToggleProficient={() => toggleProficient(character.id, attack.attackBonus.id)}
        onAddBonusClick={() => onAddBonus(attack.attackBonus.id, `${attack.name}: бонус атаки`)}
      />

      <div className={styles.damageRow}>
        <span>Урон:</span>
        {damageInfo && <InfoButton onClick={() => setDamageInfoOpen(true)} title={`Что такое «${damageInfo.title}»`} />}
        <input
          className={styles.diceInput}
          value={attack.damageDice}
          onChange={(e) => updateAttack(character.id, attack.id, { damageDice: e.target.value })}
        />
        <button
          type="button"
          className={`accentButton ${styles.damageBonusButton} ${attack.damageBonus.bonusIds.length > 0 ? styles.damageBonusButtonHasBonus : ''}`}
          onClick={() => onAddBonus(attack.damageBonus.id, `${attack.name}: урон`)}
          title="Добавить бонус к урону"
        >
          +
          <BonusBadge count={attack.damageBonus.bonusIds.length} />
        </button>
        <span className={styles.damageDisplay}>{attackResult.damageDisplay}</span>
        <input
          className={styles.damageTypeInput}
          placeholder="тип урона"
          value={attack.damageType}
          onChange={(e) => updateAttack(character.id, attack.id, { damageType: e.target.value })}
        />
        {attackResult.damageDiceParts.length > 0 && (
          <button
            type="button"
            className={styles.removeButton}
            style={{ color: 'var(--text-primary)' }}
            onClick={() => roll(attackResult.damageBonusResult.flatTotal, attackResult.damageDiceParts)}
          >
            <Dices size={14} /> Бросить
          </button>
        )}
      </div>
      {lastRoll && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{lastRoll}</div>}

      {damageInfo && damageInfoOpen && (
        <InfoModal
          title={damageInfo.title}
          description={damageInfo.description}
          affects={damageInfo.affects}
          breakdown={[{ source: 'Кубик оружия', dice: attack.damageDice }, ...attackResult.damageBonusResult.breakdown]}
          onClose={() => setDamageInfoOpen(false)}
        />
      )}

      <input
        className={styles.notesInput}
        placeholder="Заметки"
        value={attack.notes ?? ''}
        onChange={(e) => updateAttack(character.id, attack.id, { notes: e.target.value })}
      />
    </div>
  );
}

export function AttacksSection({ character, onAddBonus }: Props) {
  const addAttack = useCharacterStore((s) => s.addAttack);
  return (
    <div>
      {character.attacks.map((attack) => (
        <AttackRow key={attack.id} character={character} attack={attack} onAddBonus={onAddBonus} />
      ))}
      <button type="button" className={`accentButton ${styles.addButton}`} onClick={() => addAttack(character.id)}>
        Добавить атаку
      </button>
    </div>
  );
}
