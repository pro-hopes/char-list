import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useStatField } from '../../hooks/useStatField';
import { useCharacterStore } from '../../store/characterStore';
import type { Character } from '../../types/character';
import { StatFieldView } from '../common/StatFieldView';
import styles from './SpellcastingSection.module.css';

interface Props {
  character: Character;
  onAddBonus: (fieldId: string, label: string) => void;
}

export function SpellcastingSection({ character, onAddBonus }: Props) {
  const setSpellcastingEnabled = useCharacterStore((s) => s.setSpellcastingEnabled);
  const updateFieldBaseValue = useCharacterStore((s) => s.updateFieldBaseValue);
  const toggleProficient = useCharacterStore((s) => s.toggleProficient);
  const addCantrip = useCharacterStore((s) => s.addCantrip);
  const removeCantrip = useCharacterStore((s) => s.removeCantrip);
  const addSpellbookEntry = useCharacterStore((s) => s.addSpellbookEntry);
  const removeSpellbookEntry = useCharacterStore((s) => s.removeSpellbookEntry);
  const toggleSpellPrepared = useCharacterStore((s) => s.toggleSpellPrepared);

  const [newCantrip, setNewCantrip] = useState('');
  const [newSpellName, setNewSpellName] = useState('');
  const [newSpellLevel, setNewSpellLevel] = useState(1);

  const sc = character.spellcasting;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const dcComputed = useStatField(character, sc?.spellSaveDC ?? { id: '__none', label: '', baseValue: 0, bonusIds: [] });
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const atkComputed = useStatField(character, sc?.spellAttackBonus ?? { id: '__none2', label: '', baseValue: 0, bonusIds: [] });

  return (
    <div>
      <div className={styles.enableRow}>
        <input
          type="checkbox"
          checked={!!sc?.enabled}
          onChange={(e) => setSpellcastingEnabled(character.id, e.target.checked)}
        />
        <span>Персонаж владеет заклинаниями</span>
      </div>

      {sc?.enabled && (
        <>
          <StatFieldView
            field={sc.spellSaveDC}
            computed={dcComputed}
            label="DC заклинаний"
            onChangeBaseValue={(v) => updateFieldBaseValue(character.id, sc.spellSaveDC.id, v)}
            onToggleProficient={() => toggleProficient(character.id, sc.spellSaveDC.id)}
            onAddBonusClick={() => onAddBonus(sc.spellSaveDC.id, 'DC заклинаний')}
          />
          <StatFieldView
            field={sc.spellAttackBonus}
            computed={atkComputed}
            label="Бонус атаки заклинанием"
            onChangeBaseValue={(v) => updateFieldBaseValue(character.id, sc.spellAttackBonus.id, v)}
            onToggleProficient={() => toggleProficient(character.id, sc.spellAttackBonus.id)}
            onAddBonusClick={() => onAddBonus(sc.spellAttackBonus.id, 'Бонус атаки заклинанием')}
          />

          <h4 className={styles.subtitle}>Заговоры</h4>
          {sc.cantrips.map((cantrip, index) => (
            <div key={index} className={styles.listItem}>
              <span>{cantrip}</span>
              <button type="button" className={styles.removeButton} onClick={() => removeCantrip(character.id, index)}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <div className={styles.addRow}>
            <input type="text" placeholder="Название заговора" value={newCantrip} onChange={(e) => setNewCantrip(e.target.value)} />
            <button
              type="button"
              className="accentButton"
              onClick={() => {
                if (!newCantrip.trim()) return;
                addCantrip(character.id, newCantrip.trim());
                setNewCantrip('');
              }}
            >
              Добавить
            </button>
          </div>

          <h4 className={styles.subtitle}>Книга заклинаний</h4>
          {sc.spellbook.map((spell) => (
            <div key={spell.id} className={styles.listItem}>
              <input
                type="checkbox"
                checked={spell.prepared}
                onChange={() => toggleSpellPrepared(character.id, spell.id)}
                title="Подготовлено"
              />
              <span>
                {spell.name} (круг {spell.level})
              </span>
              <button type="button" className={styles.removeButton} onClick={() => removeSpellbookEntry(character.id, spell.id)}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <div className={styles.addRow}>
            <input type="text" placeholder="Название заклинания" value={newSpellName} onChange={(e) => setNewSpellName(e.target.value)} />
            <input
              type="number"
              className={styles.levelInput}
              min={0}
              max={9}
              value={newSpellLevel}
              onChange={(e) => setNewSpellLevel(Number(e.target.value))}
            />
            <button
              type="button"
              className="accentButton"
              onClick={() => {
                if (!newSpellName.trim()) return;
                addSpellbookEntry(character.id, newSpellName.trim(), newSpellLevel);
                setNewSpellName('');
              }}
            >
              Добавить
            </button>
          </div>
        </>
      )}
    </div>
  );
}
