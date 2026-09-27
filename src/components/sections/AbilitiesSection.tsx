import { useStatField } from '../../hooks/useStatField';
import { useCharacterStore } from '../../store/characterStore';
import { ABILITY_KEYS, ABILITY_LABELS, type AbilityKey, type Character } from '../../types/character';
import { StatFieldView } from '../common/StatFieldView';

interface Props {
  character: Character;
  onAddBonus: (fieldId: string, label: string) => void;
}

function AbilityRow({ character, ability, onAddBonus }: { character: Character; ability: AbilityKey; onAddBonus: Props['onAddBonus'] }) {
  const field = character.abilities[ability];
  const computed = useStatField(character, field);
  const updateFieldBaseValue = useCharacterStore((s) => s.updateFieldBaseValue);
  const label = `${ability} (${ABILITY_LABELS[ability]})`;
  return (
    <StatFieldView
      field={field}
      computed={computed}
      label={label}
      onChangeBaseValue={(value) => updateFieldBaseValue(character.id, field.id, value)}
      onAddBonusClick={() => onAddBonus(field.id, label)}
    />
  );
}

export function AbilitiesSection({ character, onAddBonus }: Props) {
  return (
    <div>
      {ABILITY_KEYS.map((ability) => (
        <AbilityRow key={ability} character={character} ability={ability} onAddBonus={onAddBonus} />
      ))}
    </div>
  );
}
