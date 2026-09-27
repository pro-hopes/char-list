import { useStatField } from '../../hooks/useStatField';
import { useCharacterStore } from '../../store/characterStore';
import { ABILITY_KEYS, type AbilityKey, type Character } from '../../types/character';
import { StatFieldView } from '../common/StatFieldView';

interface Props {
  character: Character;
  onAddBonus: (fieldId: string, label: string) => void;
}

function SavingThrowRow({ character, ability, onAddBonus }: { character: Character; ability: AbilityKey; onAddBonus: Props['onAddBonus'] }) {
  const field = character.savingThrows[ability];
  const computed = useStatField(character, field);
  const updateFieldBaseValue = useCharacterStore((s) => s.updateFieldBaseValue);
  const toggleProficient = useCharacterStore((s) => s.toggleProficient);
  return (
    <StatFieldView
      field={field}
      computed={computed}
      onChangeBaseValue={(value) => updateFieldBaseValue(character.id, field.id, value)}
      onToggleProficient={() => toggleProficient(character.id, field.id)}
      onAddBonusClick={() => onAddBonus(field.id, field.label)}
    />
  );
}

export function SavingThrowsSection({ character, onAddBonus }: Props) {
  return (
    <div>
      {ABILITY_KEYS.map((ability) => (
        <SavingThrowRow key={ability} character={character} ability={ability} onAddBonus={onAddBonus} />
      ))}
    </div>
  );
}
