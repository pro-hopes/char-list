import { ArrowLeft, Backpack, ClipboardCopy, Link as LinkIcon } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useCharacterStore } from '../../store/characterStore';
import type { Character } from '../../types/character';
import { BonusModal } from '../common/BonusModal';
import { GearButton } from '../common/GearButton';
import { Modal } from '../common/Modal';
import { SectionInfoButton } from '../common/SectionInfoButton';
import { AbilitiesReadView } from '../sections/AbilitiesReadView';
import { AbilitiesSection } from '../sections/AbilitiesSection';
import { AttacksReadView } from '../sections/AttacksReadView';
import { AttacksSection } from '../sections/AttacksSection';
import { CombatReadView } from '../sections/CombatReadView';
import { CombatSection } from '../sections/CombatSection';
import { EquipmentReadView } from '../sections/EquipmentReadView';
import { EquipmentSection } from '../sections/EquipmentSection';
import { FeaturesReadView } from '../sections/FeaturesReadView';
import { FeaturesSection } from '../sections/FeaturesSection';
import { HeaderReadView } from '../sections/HeaderReadView';
import { HeaderSection } from '../sections/HeaderSection';
import { NotesReadView } from '../sections/NotesReadView';
import { NotesSection } from '../sections/NotesSection';
import { ProficienciesLanguagesReadView } from '../sections/ProficienciesLanguagesReadView';
import { ProficienciesLanguagesSection } from '../sections/ProficienciesLanguagesSection';
import { ResourcesReadView } from '../sections/ResourcesReadView';
import { ResourcesSection } from '../sections/ResourcesSection';
import { SavingThrowsReadView } from '../sections/SavingThrowsReadView';
import { SavingThrowsSection } from '../sections/SavingThrowsSection';
import { SkillsReadView } from '../sections/SkillsReadView';
import { SkillsSection } from '../sections/SkillsSection';
import { SpellcastingReadView } from '../sections/SpellcastingReadView';
import { SpellcastingSection } from '../sections/SpellcastingSection';
import { AccordionSection } from './AccordionSection';
import { AsideBonusPanel } from './AsideBonusPanel';
import { BonusDrawer } from './BonusDrawer';
import styles from './CharacterSheetScreen.module.css';

interface BonusTarget {
  fieldId: string;
  label: string;
}

const SECTION_TITLES: Record<string, string> = {
  header: 'Персонаж',
  abilities: 'Характеристики',
  combat: 'Боевые параметры',
  saves: 'Спасброски',
  skills: 'Навыки',
  attacks: 'Атаки / оружие',
  spellcasting: 'Заклинания',
  resources: 'Ресурсы',
  features: 'Способности',
  equipment: 'Снаряжение',
  proficiencies: 'Владения и языки',
  notes: 'Заметки',
};

export function CharacterSheetScreen({ character }: { character: Character }) {
  const setActiveCharacter = useCharacterStore((s) => s.setActiveCharacter);
  const addBonus = useCharacterStore((s) => s.addBonus);
  const copyCharacterJson = useCharacterStore((s) => s.copyCharacterJson);
  const shareCharacterLink = useCharacterStore((s) => s.shareCharacterLink);
  const isDesktop = useMediaQuery('(min-width: 900px)');

  const [bonusTarget, setBonusTarget] = useState<BonusTarget | null>(null);
  const onAddBonus = (fieldId: string, label: string) => setBonusTarget({ fieldId, label });
  const [editingSection, setEditingSection] = useState<string | null>(null);

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

        <AccordionSection id="header" title="Персонаж" actions={<GearButton onClick={() => setEditingSection('header')} />}>
          <HeaderReadView character={character} />
        </AccordionSection>

        <AccordionSection
          id="abilities"
          title="Характеристики"
          actions={
            <>
              <SectionInfoButton infoKey="section-abilities" />
              <GearButton onClick={() => setEditingSection('abilities')} />
            </>
          }
        >
          <AbilitiesReadView character={character} />
        </AccordionSection>

        <AccordionSection id="combat" title="Боевые параметры" actions={<GearButton onClick={() => setEditingSection('combat')} />}>
          <CombatReadView character={character} />
        </AccordionSection>

        <AccordionSection
          id="saves"
          title="Спасброски"
          actions={
            <>
              <SectionInfoButton infoKey="section-saves" />
              <GearButton onClick={() => setEditingSection('saves')} />
            </>
          }
        >
          <SavingThrowsReadView character={character} />
        </AccordionSection>

        <AccordionSection
          id="skills"
          title="Навыки"
          actions={
            <>
              <SectionInfoButton infoKey="section-skills" />
              <GearButton onClick={() => setEditingSection('skills')} />
            </>
          }
        >
          <SkillsReadView character={character} />
        </AccordionSection>

        <AccordionSection id="attacks" title="Атаки / оружие" actions={<GearButton onClick={() => setEditingSection('attacks')} />}>
          <AttacksReadView character={character} />
        </AccordionSection>

        <AccordionSection id="spellcasting" title="Заклинания" actions={<GearButton onClick={() => setEditingSection('spellcasting')} />}>
          <SpellcastingReadView character={character} />
        </AccordionSection>

        <AccordionSection
          id="resources"
          title="Ресурсы"
          actions={
            <>
              <SectionInfoButton infoKey="section-resources" />
              <GearButton onClick={() => setEditingSection('resources')} />
            </>
          }
        >
          <ResourcesReadView character={character} />
        </AccordionSection>

        <AccordionSection id="features" title="Способности" actions={<GearButton onClick={() => setEditingSection('features')} />}>
          <FeaturesReadView character={character} />
        </AccordionSection>

        <AccordionSection
          id="equipment"
          title="Снаряжение"
          actions={<GearButton icon={Backpack} label="Открыть рюкзак" onClick={() => setEditingSection('equipment')} />}
        >
          <EquipmentReadView character={character} />
        </AccordionSection>

        <AccordionSection
          id="proficiencies"
          title="Владения и языки"
          actions={<GearButton onClick={() => setEditingSection('proficiencies')} />}
        >
          <ProficienciesLanguagesReadView character={character} />
        </AccordionSection>

        <AccordionSection id="notes" title="Заметки" actions={<GearButton onClick={() => setEditingSection('notes')} />}>
          <NotesReadView character={character} />
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

      {editingSection && (
        <Modal size="large" title={SECTION_TITLES[editingSection] ?? ''} onClose={() => setEditingSection(null)}>
          {editingSection === 'header' && <HeaderSection character={character} />}
          {editingSection === 'abilities' && <AbilitiesSection character={character} onAddBonus={onAddBonus} />}
          {editingSection === 'combat' && <CombatSection character={character} onAddBonus={onAddBonus} />}
          {editingSection === 'saves' && <SavingThrowsSection character={character} onAddBonus={onAddBonus} />}
          {editingSection === 'skills' && <SkillsSection character={character} onAddBonus={onAddBonus} />}
          {editingSection === 'attacks' && <AttacksSection character={character} onAddBonus={onAddBonus} />}
          {editingSection === 'spellcasting' && <SpellcastingSection character={character} onAddBonus={onAddBonus} />}
          {editingSection === 'resources' && <ResourcesSection character={character} />}
          {editingSection === 'features' && <FeaturesSection character={character} />}
          {editingSection === 'equipment' && <EquipmentSection character={character} />}
          {editingSection === 'proficiencies' && <ProficienciesLanguagesSection character={character} />}
          {editingSection === 'notes' && <NotesSection character={character} />}
        </Modal>
      )}
    </div>
  );
}
