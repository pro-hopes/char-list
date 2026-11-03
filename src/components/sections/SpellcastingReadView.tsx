import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useStatField } from '../../hooks/useStatField';
import { resolveIconUrl } from '../../engine/iconPack';
import { useCharacterStore } from '../../store/characterStore';
import type { Character } from '../../types/character';
import { StatFieldView } from '../common/StatFieldView';
import styles from './SpellcastingReadView.module.css';

function ExpandToggle({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className={styles.expandButton}
      onClick={onToggle}
      title={expanded ? 'Свернуть описание' : 'Показать описание'}
      aria-expanded={expanded}
    >
      {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
    </button>
  );
}

export function SpellcastingReadView({ character }: { character: Character }) {
  const toggleSpellPrepared = useCharacterStore((s) => s.toggleSpellPrepared);
  // Explicit open/closed choices; items without an entry fall back to their default
  const [expandedOverrides, setExpandedOverrides] = useState<Record<string, boolean>>({});
  const sc = character.spellcasting;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const dcComputed = useStatField(character, sc?.spellSaveDC ?? { id: '__none', label: '', baseValue: 0, bonusIds: [] });
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const atkComputed = useStatField(character, sc?.spellAttackBonus ?? { id: '__none2', label: '', baseValue: 0, bonusIds: [] });

  if (!sc?.enabled) {
    return <p className={styles.empty}>Персонаж не владеет заклинаниями — включить можно через шестерёнку.</p>;
  }

  const isExpanded = (id: string, defaultExpanded: boolean) => expandedOverrides[id] ?? defaultExpanded;
  const toggleExpanded = (id: string, defaultExpanded: boolean) =>
    setExpandedOverrides((prev) => ({ ...prev, [id]: !isExpanded(id, defaultExpanded) }));

  return (
    <div>
      {character.activeBeastFormId && (
        <p className={styles.formWarning}>В облике нельзя накладывать заклинания.</p>
      )}
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
      {sc.cantrips.map((cantrip) => {
        const expanded = isExpanded(cantrip.id, false);
        return (
          <div key={cantrip.id} className={styles.item}>
            {cantrip.icon && <img className={styles.itemIcon} src={resolveIconUrl(cantrip.icon)} alt="" />}
            <div className={styles.itemBody}>
              <div className={styles.itemName}>
                <span className={styles.itemTitle}>{cantrip.name}</span>
                {cantrip.description && <ExpandToggle expanded={expanded} onToggle={() => toggleExpanded(cantrip.id, false)} />}
              </div>
              {expanded && cantrip.description && <div className={styles.itemDescription}>{cantrip.description}</div>}
            </div>
          </div>
        );
      })}

      <h4 className={styles.subtitle}>Книга заклинаний</h4>
      {sc.spellbook.length === 0 && <p className={styles.empty}>Книга заклинаний пуста.</p>}
      {[...sc.spellbook].sort((a, b) => Number(b.prepared) - Number(a.prepared)).map((spell) => {
        const expanded = isExpanded(spell.id, spell.prepared);
        return (
          <div key={spell.id} className={styles.item}>
            <input
              type="checkbox"
              className={styles.preparedCheckbox}
              checked={spell.prepared}
              onChange={() => {
                toggleSpellPrepared(character.id, spell.id);
                setExpandedOverrides((prev) => {
                  const next = { ...prev };
                  delete next[spell.id];
                  return next;
                });
              }}
              title="Подготовлено"
            />
            {spell.icon && <img className={styles.itemIcon} src={resolveIconUrl(spell.icon)} alt="" />}
            <div className={styles.itemBody}>
              <div className={styles.itemName}>
                <span className={styles.itemTitle}>{spell.name}</span>
                <span className={styles.itemLevel}>круг {spell.level}</span>
                {spell.description && <ExpandToggle expanded={expanded} onToggle={() => toggleExpanded(spell.id, spell.prepared)} />}
              </div>
              {expanded && spell.description && <div className={styles.itemDescription}>{spell.description}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
