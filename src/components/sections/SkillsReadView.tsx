import { useStatField } from '../../hooks/useStatField';
import { ABILITY_LABELS, type Character, type SkillField } from '../../types/character';
import { StatFieldView } from '../common/StatFieldView';

function SkillReadRow({ character, skill }: { character: Character; skill: SkillField }) {
  const computed = useStatField(character, skill);
  return (
    <StatFieldView
      field={skill}
      computed={computed}
      label={`${skill.label} (${ABILITY_LABELS[skill.linkedAbility]})`}
      readOnly
    />
  );
}

export function SkillsReadView({ character }: { character: Character }) {
  return (
    <div>
      {character.skills.map((skill) => (
        <SkillReadRow key={skill.id} character={character} skill={skill} />
      ))}
    </div>
  );
}
