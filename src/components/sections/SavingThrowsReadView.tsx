import { useStatField } from '../../hooks/useStatField';
import { ABILITY_KEYS, type AbilityKey, type Character } from '../../types/character';
import { StatFieldView } from '../common/StatFieldView';

function SavingThrowReadRow({ character, ability }: { character: Character; ability: AbilityKey }) {
  const field = character.savingThrows[ability];
  const computed = useStatField(character, field);
  return <StatFieldView field={field} computed={computed} readOnly />;
}

export function SavingThrowsReadView({ character }: { character: Character }) {
  return (
    <div>
      {ABILITY_KEYS.map((ability) => (
        <SavingThrowReadRow key={ability} character={character} ability={ability} />
      ))}
    </div>
  );
}
