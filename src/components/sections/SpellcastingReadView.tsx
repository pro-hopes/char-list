import { useStatField } from '../../hooks/useStatField';
import { resolveIconUrl } from '../../engine/iconPack';
import { useCharacterStore } from '../../store/characterStore';
import type { Character } from '../../types/character';
import { StatFieldView } from '../common/StatFieldView';
import styles from './SpellcastingReadView.module.css';

export function SpellcastingReadView({ character }: { character: Character }) {
  const toggleSpellPrepared = useCharacterStore((s) => s.toggleSpellPrepared);
  const sc = character.spellcasting;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const dcComputed = useStatField(character, sc?.spellSaveDC ?? { id: '__none', label: '', baseValue: 0, bonusIds: [] });
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const atkComputed = useStatField(character, sc?.spellAttackBonus ?? { id: '__none2', label: '', baseValue: 0, bonusIds: [] });

  if (!sc?.enabled) {
    return <p className={styles.empty}>Персонаж не владеет заклинаниями — включить можно через шестерёнку.</p>;
  }

  return (
    <div>
      <StatFieldView field={sc.spellSaveDC} computed={dcComputed} label="DC заклинаний" infoKey="spell-dc" readOnly />
      <StatFieldView
        field={sc.spellAttackBonus}
        computed={atkComputed}
        label="Бонус атаки заклинанием"
        infoKey="spell-attack"
        readOnly
      />

      <h4 className={styles.subtitle}>Заговоры</h4>
      {sc.cantrips.length === 0 && <p className={styles.empty}>Заговоров пока нет.</p>}
      {sc.cantrips.map((cantrip) => (
        <div key={cantrip.id} className={styles.item}>
          {cantrip.icon && <img className={styles.itemIcon} src={resolveIconUrl(cantrip.icon)} alt="" />}
          <div className={styles.itemBody}>
            <div className={styles.itemName}>{cantrip.name}</div>
            {cantrip.description && <div className={styles.itemDescription}>{cantrip.description}</div>}
          </div>
        </div>
      ))}

      <h4 className={styles.subtitle}>Книга заклинаний</h4>
      {sc.spellbook.length === 0 && <p className={styles.empty}>Книга заклинаний пуста.</p>}
      {sc.spellbook.map((spell) => (
        <div key={spell.id} className={styles.item}>
          <input
            type="checkbox"
            className={styles.preparedCheckbox}
            checked={spell.prepared}
            onChange={() => toggleSpellPrepared(character.id, spell.id)}
            title="Подготовлено"
          />
          {spell.icon && <img className={styles.itemIcon} src={resolveIconUrl(spell.icon)} alt="" />}
          <div className={styles.itemBody}>
            <div className={styles.itemName}>
              {spell.name} <span className={styles.itemLevel}>круг {spell.level}</span>
            </div>
            {spell.description && <div className={styles.itemDescription}>{spell.description}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
