import { ArrowLeft, ClipboardCopy, Link as LinkIcon } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useCharacterStore } from '../../store/characterStore';
import type { Character } from '../../types/character';
import { BonusModal } from '../common/BonusModal';
import { SectionInfoButton } from '../common/SectionInfoButton';
import { AbilitiesSection } from '../sections/AbilitiesSection';
import { AttacksSection } from '../sections/AttacksSection';
import { CombatSection } from '../sections/CombatSection';
import { EquipmentSection } from '../sections/EquipmentSection';
import { FeaturesSection } from '../sections/FeaturesSection';
import { HeaderSection } from '../sections/HeaderSection';
import { NotesSection } from '../sections/NotesSection';
import { ProficienciesLanguagesSection } from '../sections/ProficienciesLanguagesSection';
import { ResourcesSection } from '../sections/ResourcesSection';
import { SavingThrowsSection } from '../sections/SavingThrowsSection';
import { SkillsSection } from '../sections/SkillsSection';
import { SpellcastingSection } from '../sections/SpellcastingSection';
import { AccordionSection } from './AccordionSection';
import { AsideBonusPanel } from './AsideBonusPanel';
import { BonusDrawer } from './BonusDrawer';
import styles from './CharacterSheetScreen.module.css';

interface BonusTarget {
  fieldId: string;
  label: string;
}

export function CharacterSheetScreen({ character }: { character: Character }) {
  const setActiveCharacter = useCharacterStore((s) => s.setActiveCharacter);
  const addBonus = useCharacterStore((s) => s.addBonus);
  const copyCharacterJson = useCharacterStore((s) => s.copyCharacterJson);
  const shareCharacterLink = useCharacterStore((s) => s.shareCharacterLink);
  const isDesktop = useMediaQuery('(min-width: 900px)');

  const [bonusTarget, setBonusTarget] = useState<BonusTarget | null>(null);
  const onAddBonus = (fieldId: string, label: string) => setBonusTarget({ fieldId, label });

  return (
    <div className={styles.wrapper} style={{ '--accent': character.themeColor } as CSSProperties}>
      <div className={styles.main}>
        <div className={styles.topBar}>
          <button type="button" className={styles.backButton} onClick={() => setActiveCharacter(null)}>
            <ArrowLeft size={16} /> К списку
          </button>
          <div className={styles.spacer} />
          <button type="button" className={styles.iconTextButton} onClick={() => copyCharacterJson(character.id)}>
            <ClipboardCopy size={14} /> Скопировать JSON
          </button>
          <button type="button" className={styles.iconTextButton} onClick={() => shareCharacterLink(character.id)}>
            <LinkIcon size={14} /> Поделиться ссылкой
          </button>
        </div>

        <AccordionSection id="header" title="Персонаж">
          <HeaderSection character={character} />
        </AccordionSection>

        <AccordionSection id="abilities" title="Характеристики" actions={<SectionInfoButton infoKey="section-abilities" />}>
          <AbilitiesSection character={character} onAddBonus={onAddBonus} />
        </AccordionSection>

        <AccordionSection id="combat" title="Боевые параметры">
          <CombatSection character={character} onAddBonus={onAddBonus} />
        </AccordionSection>

        <AccordionSection id="saves" title="Спасброски" actions={<SectionInfoButton infoKey="section-saves" />}>
          <SavingThrowsSection character={character} onAddBonus={onAddBonus} />
        </AccordionSection>

        <AccordionSection id="skills" title="Навыки" actions={<SectionInfoButton infoKey="section-skills" />}>
          <SkillsSection character={character} onAddBonus={onAddBonus} />
        </AccordionSection>

        <AccordionSection id="attacks" title="Атаки / оружие">
          <AttacksSection character={character} onAddBonus={onAddBonus} />
        </AccordionSection>

        <AccordionSection id="spellcasting" title="Заклинания">
          <SpellcastingSection character={character} onAddBonus={onAddBonus} />
        </AccordionSection>

        <AccordionSection id="resources" title="Ресурсы" actions={<SectionInfoButton infoKey="section-resources" />}>
          <ResourcesSection character={character} />
        </AccordionSection>

        <AccordionSection id="features" title="Способности">
          <FeaturesSection character={character} />
        </AccordionSection>

        <AccordionSection id="equipment" title="Снаряжение">
          <EquipmentSection character={character} />
        </AccordionSection>

        <AccordionSection id="proficiencies" title="Владения и языки">
          <ProficienciesLanguagesSection character={character} />
        </AccordionSection>

        <AccordionSection id="notes" title="Заметки">
          <NotesSection character={character} />
        </AccordionSection>
      </div>

      {isDesktop ? <AsideBonusPanel character={character} /> : <BonusDrawer character={character} />}

      {bonusTarget && (
        <BonusModal
          fieldLabel={bonusTarget.label}
          onClose={() => setBonusTarget(null)}
          onSubmit={(data) => addBonus(character.id, bonusTarget.fieldId, data)}
        />
      )}
    </div>
  );
}
