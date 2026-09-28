import { Dices } from 'lucide-react';
import { useState } from 'react';
import { useAttackDamage } from '../../hooks/useAttackDamage';
import { useDiceRoll } from '../../hooks/useDiceRoll';
import { useStatField } from '../../hooks/useStatField';
import { FIELD_INFO } from '../../engine/fieldInfo';
import { resolveIconUrl } from '../../engine/iconPack';
import type { Attack, Character } from '../../types/character';
import { InfoButton } from '../common/InfoButton';
import { InfoModal } from '../common/InfoModal';
import { StatFieldView } from '../common/StatFieldView';
import styles from './AttacksReadView.module.css';

const damageInfo = FIELD_INFO['attack-damage'];

function AttackReadRow({ character, attack }: { character: Character; attack: Attack }) {
  const attackBonusComputed = useStatField(character, attack.attackBonus);
  const attackResult = useAttackDamage(character, attack);
  const { lastRoll, roll } = useDiceRoll();
  const [damageInfoOpen, setDamageInfoOpen] = useState(false);

  return (
    <div className={styles.attack}>
      <div className={styles.headRow}>
        {attack.icon && <img src={resolveIconUrl(attack.icon)} alt="" width={24} height={24} />}
        {attack.name}
      </div>

      <StatFieldView field={attack.attackBonus} computed={attackBonusComputed} label="Бонус атаки" infoKey="attack-bonus" readOnly />

      <div className={styles.damageRow}>
        <span>Урон:</span>
        {damageInfo && <InfoButton onClick={() => setDamageInfoOpen(true)} title={`Что такое «${damageInfo.title}»`} />}
        <span className={styles.damageDisplay}>{attackResult.damageDisplay}</span>
        {attack.damageType && <span className={styles.damageType}>{attack.damageType}</span>}
        {attackResult.damageDiceParts.length > 0 && (
          <button
            type="button"
            className={styles.rollButton}
            onClick={() => roll(attackResult.damageBonusResult.flatTotal, attackResult.damageDiceParts)}
          >
            <Dices size={14} /> Бросить
          </button>
        )}
      </div>
      {lastRoll && <div className={styles.rollResult}>{lastRoll}</div>}

      {attack.notes && <div className={styles.notes}>{attack.notes}</div>}

      {damageInfo && damageInfoOpen && (
        <InfoModal
          title={damageInfo.title}
          description={damageInfo.description}
          affects={damageInfo.affects}
          breakdown={[{ source: 'Кубик оружия', dice: attack.damageDice }, ...attackResult.damageBonusResult.breakdown]}
          onClose={() => setDamageInfoOpen(false)}
        />
      )}
    </div>
  );
}

export function AttacksReadView({ character }: { character: Character }) {
  if (character.attacks.length === 0) {
    return <p className={styles.empty}>Атак пока нет — добавьте через шестерёнку.</p>;
  }
  return (
    <div>
      {character.attacks.map((attack) => (
        <AttackReadRow key={attack.id} character={character} attack={attack} />
      ))}
    </div>
  );
}
