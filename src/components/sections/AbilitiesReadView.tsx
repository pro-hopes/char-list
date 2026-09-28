import { useStatField } from '../../hooks/useStatField';
import { ABILITY_KEYS, ABILITY_LABELS, type AbilityKey, type Character } from '../../types/character';
import { StatFieldView } from '../common/StatFieldView';

function AbilityReadRow({ character, ability }: { character: Character; ability: AbilityKey }) {
  const field = character.abilities[ability];
  const computed = useStatField(character, field);
  return (
    <StatFieldView
      field={field}
      computed={computed}
      label={`${ability} (${ABILITY_LABELS[ability]})`}
      infoKey={`ability-${ability}`}
      readOnly
    />
  );
}

export function AbilitiesReadView({ character }: { character: Character }) {
  return (
    <div>
      {ABILITY_KEYS.map((ability) => (
        <AbilityReadRow key={ability} character={character} ability={ability} />
      ))}
    </div>
  );
}
