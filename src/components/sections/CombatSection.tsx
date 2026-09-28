import { useStatField } from '../../hooks/useStatField';
import { useCharacterStore } from '../../store/characterStore';
import type { Character } from '../../types/character';
import { StatFieldView } from '../common/StatFieldView';

interface Props {
  character: Character;
  onAddBonus: (fieldId: string, label: string) => void;
}

export function CombatSection({ character, onAddBonus }: Props) {
  const updateFieldBaseValue = useCharacterStore((s) => s.updateFieldBaseValue);

  const hpMax = useStatField(character, character.combat.hpMax);
  const ac = useStatField(character, character.combat.ac);
  const speed = useStatField(character, character.combat.speed);
  const initiative = useStatField(character, character.combat.initiative);

  return (
    <div>
      <StatFieldView
        field={character.combat.hpMax}
        computed={hpMax}
        infoKey="combat-hp"
        onChangeBaseValue={(v) => updateFieldBaseValue(character.id, character.combat.hpMax.id, v)}
        onAddBonusClick={() => onAddBonus(character.combat.hpMax.id, character.combat.hpMax.label)}
      />
      <StatFieldView
        field={character.combat.ac}
        computed={ac}
        infoKey="combat-ac"
        onChangeBaseValue={(v) => updateFieldBaseValue(character.id, character.combat.ac.id, v)}
        onAddBonusClick={() => onAddBonus(character.combat.ac.id, character.combat.ac.label)}
      />
      <StatFieldView
        field={character.combat.speed}
        computed={speed}
        infoKey="combat-speed"
        onChangeBaseValue={(v) => updateFieldBaseValue(character.id, character.combat.speed.id, v)}
        onAddBonusClick={() => onAddBonus(character.combat.speed.id, character.combat.speed.label)}
      />
      <StatFieldView
        field={character.combat.initiative}
        computed={initiative}
        infoKey="combat-initiative"
        onChangeBaseValue={(v) => updateFieldBaseValue(character.id, character.combat.initiative.id, v)}
        onAddBonusClick={() => onAddBonus(character.combat.initiative.id, character.combat.initiative.label)}
      />
    </div>
  );
}
