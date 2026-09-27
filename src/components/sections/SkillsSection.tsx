import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useStatField } from '../../hooks/useStatField';
import { useCharacterStore } from '../../store/characterStore';
import { ABILITY_KEYS, ABILITY_LABELS, type AbilityKey, type Character, type SkillField } from '../../types/character';
import { StatFieldView } from '../common/StatFieldView';
import styles from './SkillsSection.module.css';

interface Props {
  character: Character;
  onAddBonus: (fieldId: string, label: string) => void;
}

function SkillRow({ character, skill, onAddBonus }: { character: Character; skill: SkillField; onAddBonus: Props['onAddBonus'] }) {
  const computed = useStatField(character, skill);
  const updateFieldBaseValue = useCharacterStore((s) => s.updateFieldBaseValue);
  const toggleProficient = useCharacterStore((s) => s.toggleProficient);
  const removeSkill = useCharacterStore((s) => s.removeSkill);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1 }}>
        <StatFieldView
          field={skill}
          computed={computed}
          label={`${skill.label} (${ABILITY_LABELS[skill.linkedAbility]})`}
          onChangeBaseValue={(value) => updateFieldBaseValue(character.id, skill.id, value)}
          onToggleProficient={() => toggleProficient(character.id, skill.id)}
          onAddBonusClick={() => onAddBonus(skill.id, skill.label)}
        />
      </div>
      {skill.custom && (
        <button
          type="button"
          className={styles.removeButton}
          onClick={() => removeSkill(character.id, skill.id)}
          title="Удалить навык"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}

export function SkillsSection({ character, onAddBonus }: Props) {
  const addSkill = useCharacterStore((s) => s.addSkill);
  const [newLabel, setNewLabel] = useState('');
  const [newAbility, setNewAbility] = useState<AbilityKey>('STR');

  return (
    <div>
      {character.skills.map((skill) => (
        <SkillRow key={skill.id} character={character} skill={skill} onAddBonus={onAddBonus} />
      ))}

      <div className={styles.addRow}>
        <input
          placeholder="Название нового навыка"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
        />
        <select value={newAbility} onChange={(e) => setNewAbility(e.target.value as AbilityKey)}>
          {ABILITY_KEYS.map((key) => (
            <option key={key} value={key}>
              {ABILITY_LABELS[key]}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="accentButton"
          onClick={() => {
            if (!newLabel.trim()) return;
            addSkill(character.id, newLabel.trim(), newAbility);
            setNewLabel('');
          }}
        >
          Добавить
        </button>
      </div>
    </div>
  );
}
