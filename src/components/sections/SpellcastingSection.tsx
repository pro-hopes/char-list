import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useStatField } from '../../hooks/useStatField';
import { useCharacterStore } from '../../store/characterStore';
import type { Cantrip, Character, SpellbookEntry } from '../../types/character';
import { sanitizeNumberInputEvent } from '../../utils/numberInput';
import { IconButton } from '../common/IconButton';
import { IconPickerModal } from '../common/IconPickerModal';
import { StatFieldView } from '../common/StatFieldView';
import listStyles from './EditableList.module.css';
import styles from './SpellcastingSection.module.css';

interface Props {
  character: Character;
  onAddBonus: (fieldId: string, label: string) => void;
}

type IconPickerTarget = { kind: 'cantrip' | 'spell'; id: string } | null;

function CantripCard({
  character,
  cantrip,
  onOpenIconPicker,
}: {
  character: Character;
  cantrip: Cantrip;
  onOpenIconPicker: () => void;
}) {
  const updateCantrip = useCharacterStore((s) => s.updateCantrip);
  const removeCantrip = useCharacterStore((s) => s.removeCantrip);

  return (
    <div className={listStyles.item}>
      <div className={listStyles.itemHead}>
        <IconButton icon={cantrip.icon} onClick={onOpenIconPicker} />
        <input
          className={listStyles.nameField}
          value={cantrip.name}
          onChange={(e) => updateCantrip(character.id, cantrip.id, { name: e.target.value })}
        />
        <button
          type="button"
          className={listStyles.removeButton}
          onClick={() => removeCantrip(character.id, cantrip.id)}
        >
          <Trash2 size={14} />
        </button>
      </div>
      <textarea
        className={listStyles.textarea}
        placeholder="Описание"
        value={cantrip.description}
        onChange={(e) => updateCantrip(character.id, cantrip.id, { description: e.target.value })}
      />
    </div>
  );
}

function SpellCard({
  character,
  spell,
  onOpenIconPicker,
}: {
  character: Character;
  spell: SpellbookEntry;
  onOpenIconPicker: () => void;
}) {
  const updateSpellbookEntry = useCharacterStore((s) => s.updateSpellbookEntry);
  const removeSpellbookEntry = useCharacterStore((s) => s.removeSpellbookEntry);
  const toggleSpellPrepared = useCharacterStore((s) => s.toggleSpellPrepared);

  return (
    <div className={listStyles.item}>
      <div className={listStyles.itemHead}>
        <IconButton icon={spell.icon} onClick={onOpenIconPicker} />
        <input
          className={listStyles.nameField}
          value={spell.name}
          onChange={(e) => updateSpellbookEntry(character.id, spell.id, { name: e.target.value })}
        />
        <input
          type="number"
          className={styles.levelInput}
          min={0}
          max={9}
          title="Круг"
          value={spell.level}
          onChange={(e) => updateSpellbookEntry(character.id, spell.id, { level: Number(sanitizeNumberInputEvent(e)) })}
        />
        <input
          type="checkbox"
          checked={spell.prepared}
          onChange={() => toggleSpellPrepared(character.id, spell.id)}
          title="Подготовлено"
        />
        <button
          type="button"
          className={listStyles.removeButton}
          onClick={() => removeSpellbookEntry(character.id, spell.id)}
        >
          <Trash2 size={14} />
        </button>
      </div>
      <textarea
        className={listStyles.textarea}
        placeholder="Описание"
        value={spell.description}
        onChange={(e) => updateSpellbookEntry(character.id, spell.id, { description: e.target.value })}
      />
    </div>
  );
}

export function SpellcastingSection({ character, onAddBonus }: Props) {
  const setSpellcastingEnabled = useCharacterStore((s) => s.setSpellcastingEnabled);
  const updateFieldBaseValue = useCharacterStore((s) => s.updateFieldBaseValue);
  const toggleProficient = useCharacterStore((s) => s.toggleProficient);
  const addCantrip = useCharacterStore((s) => s.addCantrip);
  const updateCantrip = useCharacterStore((s) => s.updateCantrip);
  const addSpellbookEntry = useCharacterStore((s) => s.addSpellbookEntry);
  const updateSpellbookEntry = useCharacterStore((s) => s.updateSpellbookEntry);

  const [newCantrip, setNewCantrip] = useState('');
  const [newSpellName, setNewSpellName] = useState('');
  const [newSpellLevel, setNewSpellLevel] = useState(1);
  const [iconPickerTarget, setIconPickerTarget] = useState<IconPickerTarget>(null);

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
          {sc.cantrips.map((cantrip) => (
            <CantripCard
              key={cantrip.id}
              character={character}
              cantrip={cantrip}
              onOpenIconPicker={() => setIconPickerTarget({ kind: 'cantrip', id: cantrip.id })}
            />
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
            <SpellCard
              key={spell.id}
              character={character}
              spell={spell}
              onOpenIconPicker={() => setIconPickerTarget({ kind: 'spell', id: spell.id })}
            />
          ))}
          <div className={styles.addRow}>
            <input type="text" placeholder="Название заклинания" value={newSpellName} onChange={(e) => setNewSpellName(e.target.value)} />
            <input
              type="number"
              className={styles.levelInput}
              min={0}
              max={9}
              value={newSpellLevel}
              onChange={(e) => setNewSpellLevel(Number(sanitizeNumberInputEvent(e)))}
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

          {iconPickerTarget &&
            (() => {
              if (iconPickerTarget.kind === 'cantrip') {
                const cantrip = sc.cantrips.find((c) => c.id === iconPickerTarget.id);
                if (!cantrip) return null;
                return (
                  <IconPickerModal
                    currentIcon={cantrip.icon}
                    onClose={() => setIconPickerTarget(null)}
                    onSelect={(icon) => updateCantrip(character.id, cantrip.id, { icon })}
                  />
                );
              }
              const spell = sc.spellbook.find((s) => s.id === iconPickerTarget.id);
              if (!spell) return null;
              return (
                <IconPickerModal
                  currentIcon={spell.icon}
                  onClose={() => setIconPickerTarget(null)}
                  onSelect={(icon) => updateSpellbookEntry(character.id, spell.id, { icon })}
                />
              );
            })()}
        </>
      )}
    </div>
  );
}
