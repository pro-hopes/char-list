import { useStatField } from '../../hooks/useStatField';
import type { Character } from '../../types/character';
import { StatFieldView } from '../common/StatFieldView';
import styles from './CombatSection.module.css';
import { HpCounter } from './HpCounter';

export function CombatReadView({ character }: { character: Character }) {
  const hpMax = useStatField(character, character.combat.hpMax);
  const ac = useStatField(character, character.combat.ac);
  const speed = useStatField(character, character.combat.speed);
  const initiative = useStatField(character, character.combat.initiative);

  return (
    <div>
      <div className={styles.hpRow}>
        <HpCounter character={character} kind="current" label="Хиты (тек.)" />
        <HpCounter character={character} kind="temp" label="Временные" />
      </div>

      <StatFieldView field={character.combat.hpMax} computed={hpMax} infoKey="combat-hp" readOnly />
      <StatFieldView field={character.combat.ac} computed={ac} infoKey="combat-ac" readOnly />
      <StatFieldView field={character.combat.speed} computed={speed} infoKey="combat-speed" readOnly />
      <StatFieldView field={character.combat.initiative} computed={initiative} infoKey="combat-initiative" readOnly />
    </div>
  );
}
