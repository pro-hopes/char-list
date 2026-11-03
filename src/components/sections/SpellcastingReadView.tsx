import { ChevronDown, ChevronRight, Dices } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useDiceRoll } from '../../hooks/useDiceRoll';
import { useStatField } from '../../hooks/useStatField';
import { parseRollFormula } from '../../engine/dice';
import { resolveIconUrl } from '../../engine/iconPack';
import { useCharacterStore } from '../../store/characterStore';
import type { Cantrip, Character, SpellbookEntry, SpellDetails, SpellSlotLevel } from '../../types/character';
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

function SpellMeta({ spell }: { spell: SpellDetails }) {
  const { lastRoll, roll } = useDiceRoll();
  const params = [spell.castingTime, spell.range, spell.duration].filter((p) => p?.trim());
  const damageRoll = spell.damage ? parseRollFormula(spell.damage) : null;

  if (!spell.concentration && !spell.ritual && params.length === 0 && !spell.damage) return null;

  return (
    <>
      <div className={styles.meta}>
        {spell.concentration && (
          <span className={styles.tag} title="Концентрация: одновременно можно поддерживать только одно такое заклинание">
            Концентрация
          </span>
        )}
        {spell.ritual && (
          <span className={styles.tag} title="Ритуал: можно наложить за +10 минут, не тратя ячейку">
            Ритуал
          </span>
        )}
        {params.length > 0 && <span>{params.join(' · ')}</span>}
        {spell.damage && (
          <span className={styles.damage}>
            {spell.damage}
            {spell.damageType && ` ${spell.damageType}`}
            {damageRoll && (
              <button
                type="button"
                className={styles.rollButton}
                onClick={() => roll(damageRoll.flat, damageRoll.diceParts)}
                title="Бросить"
              >
                <Dices size={14} />
              </button>
            )}
          </span>
        )}
      </div>
      {lastRoll && <div className={styles.rollResult}>{lastRoll}</div>}
    </>
  );
}

function SpellRow({
  spell,
  expanded,
  onToggleExpanded,
  onTogglePrepared,
}: {
  spell: Cantrip | SpellbookEntry;
  expanded: boolean;
  onToggleExpanded: () => void;
  /** Только для заклинаний из книги — у заговоров нет подготовки. */
  onTogglePrepared?: () => void;
}) {
  return (
    <div className={styles.item}>
      {'prepared' in spell && onTogglePrepared && (
        <input
          type="checkbox"
          className={styles.preparedCheckbox}
          checked={spell.prepared}
          onChange={onTogglePrepared}
          title="Подготовлено"
        />
      )}
      {spell.icon && <img className={styles.itemIcon} src={resolveIconUrl(spell.icon)} alt="" />}
      <div className={styles.itemBody}>
        <div className={styles.itemName}>
          <span className={styles.itemTitle}>{spell.name}</span>
          {spell.description && <ExpandToggle expanded={expanded} onToggle={onToggleExpanded} />}
        </div>
        <SpellMeta spell={spell} />
        {expanded && spell.description && <div className={styles.itemDescription}>{spell.description}</div>}
      </div>
    </div>
  );
}

function LevelGroup({
  collapseKey,
  title,
  count,
  slot,
  onToggleSlot,
  children,
}: {
  collapseKey: string;
  title: string;
  count: number;
  slot?: SpellSlotLevel;
  onToggleSlot?: (index: number) => void;
  children: ReactNode;
}) {
  const collapsed = useCharacterStore((s) => !!s.ui.collapsedSections[collapseKey]);
  const toggleCollapsed = useCharacterStore((s) => s.toggleSectionCollapsed);

  return (
    <div className={styles.group}>
      <div className={styles.groupHead}>
        <button
          type="button"
          className={styles.groupToggle}
          onClick={() => toggleCollapsed(collapseKey)}
          aria-expanded={!collapsed}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
          <span className={styles.groupTitle}>{title}</span>
          <span className={styles.groupCount}>{count}</span>
        </button>
        {slot && slot.max > 0 && onToggleSlot && (
          <div className={styles.slots} title="Ячейки заклинаний">
            {Array.from({ length: slot.max }).map((_, index) => (
              <input
                key={index}
                type="checkbox"
                checked={index < slot.used}
                onChange={() => onToggleSlot(index)}
                aria-label={`Ячейка ${index + 1} из ${slot.max}`}
              />
            ))}
          </div>
        )}
      </div>
      {!collapsed && <div className={styles.groupBody}>{children}</div>}
    </div>
  );
}

export function SpellcastingReadView({ character }: { character: Character }) {
  const toggleSpellPrepared = useCharacterStore((s) => s.toggleSpellPrepared);
  const toggleSpellSlotUsed = useCharacterStore((s) => s.toggleSpellSlotUsed);
  const setSpellsPreparedOnly = useCharacterStore((s) => s.setSpellsPreparedOnly);
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

  const renderSpell = (spell: SpellbookEntry) => (
    <SpellRow
      key={spell.id}
      spell={spell}
      expanded={isExpanded(spell.id, spell.prepared)}
      onToggleExpanded={() => toggleExpanded(spell.id, spell.prepared)}
      onTogglePrepared={() => {
        toggleSpellPrepared(character.id, spell.id);
        setExpandedOverrides((prev) => {
          const next = { ...prev };
          delete next[spell.id];
          return next;
        });
      }}
    />
  );

  const preparedCount = sc.spellbook.filter((s) => s.prepared).length;
  const visibleSpells = sc.spellbook
    .filter((s) => !sc.preparedOnly || s.prepared)
    .sort((a, b) => Number(b.prepared) - Number(a.prepared));

  // заклинания книги с кругом 0 показываем вместе с заговорами
  const spellsByLevel = new Map<number, SpellbookEntry[]>();
  for (const spell of visibleSpells) {
    spellsByLevel.set(spell.level, [...(spellsByLevel.get(spell.level) ?? []), spell]);
  }
  const zeroLevelSpells = spellsByLevel.get(0) ?? [];
  // группа круга видна, если в ней есть заклинания или настроены ячейки
  const levels = [
    ...new Set([...spellsByLevel.keys(), ...sc.slots.flatMap((slot, i) => (slot.max > 0 ? [i + 1] : []))]),
  ]
    .filter((level) => level > 0)
    .sort((a, b) => a - b);

  const hasAnySpells = sc.cantrips.length > 0 || sc.spellbook.length > 0;
  const cantripCount = sc.cantrips.length + zeroLevelSpells.length;

  return (
    <div>
      {character.activeBeastFormId && <p className={styles.formWarning}>В облике нельзя накладывать заклинания.</p>}
      <StatFieldView field={sc.spellSaveDC} computed={dcComputed} label="DC заклинаний" infoKey="spell-dc" readOnly />
      <StatFieldView
        field={sc.spellAttackBonus}
        computed={atkComputed}
        label="Бонус атаки заклинанием"
        infoKey="spell-attack"
        readOnly
      />

      {sc.spellbook.length > 0 && (
        <div className={styles.filter} role="group" aria-label="Какие заклинания показывать">
          <button
            type="button"
            className={`${styles.filterOption} ${!sc.preparedOnly ? styles.filterOptionActive : ''}`}
            aria-pressed={!sc.preparedOnly}
            onClick={() => setSpellsPreparedOnly(character.id, false)}
          >
            Все ({sc.spellbook.length})
          </button>
          <button
            type="button"
            className={`${styles.filterOption} ${sc.preparedOnly ? styles.filterOptionActive : ''}`}
            aria-pressed={sc.preparedOnly}
            onClick={() => setSpellsPreparedOnly(character.id, true)}
          >
            Подготовленные ({preparedCount})
          </button>
        </div>
      )}

      {!hasAnySpells && <p className={styles.empty}>Заклинаний пока нет — добавьте через шестерёнку.</p>}

      {cantripCount > 0 && (
        <LevelGroup collapseKey={`spells-${character.id}-0`} title="Заговоры" count={cantripCount}>
          {sc.cantrips.map((cantrip) => (
            <SpellRow
              key={cantrip.id}
              spell={cantrip}
              expanded={isExpanded(cantrip.id, false)}
              onToggleExpanded={() => toggleExpanded(cantrip.id, false)}
            />
          ))}
          {zeroLevelSpells.map(renderSpell)}
        </LevelGroup>
      )}

      {levels.map((level) => {
        const spells = spellsByLevel.get(level) ?? [];
        return (
          <LevelGroup
            key={level}
            collapseKey={`spells-${character.id}-${level}`}
            title={`${level} круг`}
            count={spells.length}
            slot={sc.slots[level - 1]}
            onToggleSlot={(index) => toggleSpellSlotUsed(character.id, level, index)}
          >
            {spells.length > 0 ? (
              spells.map(renderSpell)
            ) : (
              <p className={styles.empty}>{sc.preparedOnly ? 'Нет подготовленных заклинаний.' : 'Заклинаний нет.'}</p>
            )}
          </LevelGroup>
        );
      })}
    </div>
  );
}
