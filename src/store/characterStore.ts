import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createDefaultCharacter } from '../engine/defaultTemplates';
import { migrateCharacter } from '../engine/migrations';
import { parseCharacterFromText } from '../engine/schema';
import { buildShareUrl, clearShareHash, decodeCharacterFromShare, readShareHashFromLocation } from '../engine/share';
import { findStatField, syncBonusIds } from '../engine/statFieldRegistry';
import type {
  AbilityKey,
  Attack,
  Bonus,
  Character,
  CharacterSummary,
  EquipmentItem,
  Feature,
  ResourceTracker,
  SkillField,
} from '../types/character';
import type { PendingImportSource, UiState } from '../types/store';
import { copyToClipboard, readFromClipboard } from '../utils/clipboard';
import { newId } from '../utils/id';
import {
  deleteCharacterStorage,
  flushIndexPersist,
  flushPersist,
  loadCharacter,
  loadIndex,
  schedulePersist,
  scheduleIndexPersist,
} from './persistence';

let toastCounter = 0;

interface AppState {
  hydrated: boolean;
  characterIndex: CharacterSummary[];
  characters: Record<string, Character>;
  activeCharacterId: string | null;
  ui: UiState;
}

interface AppActions {
  hydrate(): void;

  createCharacter(): string;
  duplicateCharacter(id: string): string;
  renameCharacter(id: string, name: string): void;
  deleteCharacter(id: string): void;
  setActiveCharacter(id: string | null): void;

  updateMeta(id: string, patch: Partial<Character['meta']>): void;
  updateThemeColor(id: string, color: string): void;

  updateFieldBaseValue(id: string, fieldId: string, baseValue: number): void;
  toggleProficient(id: string, fieldId: string): void;
  adjustHp(id: string, kind: 'current' | 'temp', delta: number): void;
  setHpValue(id: string, kind: 'current' | 'temp', value: number): void;

  addBonus(id: string, appliesTo: string, data: Omit<Bonus, 'id' | 'appliesTo'>): void;
  removeBonus(id: string, bonusId: string): void;

  addSkill(id: string, label: string, ability: AbilityKey): void;
  removeSkill(id: string, skillId: string): void;

  addAttack(id: string): void;
  updateAttack(id: string, attackId: string, patch: Partial<Pick<Attack, 'name' | 'damageDice' | 'damageType' | 'notes'>>): void;
  removeAttack(id: string, attackId: string): void;

  setSpellcastingEnabled(id: string, enabled: boolean): void;
  addCantrip(id: string, text: string): void;
  removeCantrip(id: string, index: number): void;
  addSpellbookEntry(id: string, name: string, level: number): void;
  removeSpellbookEntry(id: string, spellId: string): void;
  toggleSpellPrepared(id: string, spellId: string): void;

  addResource(id: string, data: Omit<ResourceTracker, 'id' | 'used'>): void;
  removeResource(id: string, resourceId: string): void;
  toggleResourceUsed(id: string, resourceId: string, index: number): void;
  applyRest(id: string, kind: 'short' | 'long'): void;

  addFeature(id: string): void;
  updateFeature(id: string, featureId: string, patch: Partial<Pick<Feature, 'title' | 'description'>>): void;
  removeFeature(id: string, featureId: string): void;

  addEquipment(id: string): void;
  updateEquipment(id: string, itemId: string, patch: Partial<Pick<EquipmentItem, 'name' | 'note'>>): void;
  removeEquipment(id: string, itemId: string): void;

  updateProficienciesAndLanguages(id: string, text: string): void;
  updateNotes(id: string, text: string): void;

  copyCharacterJson(id: string): Promise<void>;
  importFromClipboard(): Promise<void>;
  shareCharacterLink(id: string): Promise<void>;
  checkShareHashOnLoad(): void;
  confirmPendingImport(mode: 'add' | 'overwrite' | 'rename', newName?: string): void;
  cancelPendingImport(): void;

  toggleAside(): void;
  toggleSectionCollapsed(sectionKey: string): void;
  showToast(message: string, tone?: 'info' | 'error'): void;
  clearToast(): void;
}

type Store = AppState & AppActions;

function findConflictId(index: CharacterSummary[], name: string, excludeId?: string): string | undefined {
  const normalized = name.trim().toLowerCase();
  return index.find((c) => c.id !== excludeId && c.name.trim().toLowerCase() === normalized)?.id;
}

export const useCharacterStore = create<Store>()(
  immer((set, get) => {
    function mutateCharacter(id: string, updater: (character: Character) => void) {
      set((state) => {
        const character = state.characters[id];
        if (!character) return;
        updater(character);
        const idx = state.characterIndex.findIndex((c) => c.id === id);
        const summary: CharacterSummary = {
          id: character.id,
          name: character.name,
          race: character.meta.race,
          className: character.meta.className,
          themeColor: character.themeColor,
        };
        if (idx >= 0) state.characterIndex[idx] = summary;
      });
      const character = get().characters[id];
      if (character) schedulePersist(id, character);
      scheduleIndexPersist(get().characterIndex);
    }

    function mutateBonus(id: string, updater: (character: Character) => void) {
      mutateCharacter(id, (character) => {
        updater(character);
        syncBonusIds(character);
      });
    }

    function addCharacterToState(character: Character) {
      set((state) => {
        state.characters[character.id] = character;
        state.characterIndex.push({
          id: character.id,
          name: character.name,
          race: character.meta.race,
          className: character.meta.className,
          themeColor: character.themeColor,
        });
        state.activeCharacterId = character.id;
      });
      schedulePersist(character.id, character);
      scheduleIndexPersist(get().characterIndex);
    }

    return {
      hydrated: false,
      characterIndex: [],
      characters: {},
      activeCharacterId: null,
      ui: { asideOpen: false, collapsedSections: {}, pendingImport: null, toast: null },

      hydrate() {
        const index = loadIndex();
        const characters: Record<string, Character> = {};
        for (const summary of index) {
          const loaded = loadCharacter(summary.id);
          if (loaded) characters[summary.id] = migrateCharacter(loaded);
        }
        set((state) => {
          state.characterIndex = index;
          state.characters = characters;
          state.activeCharacterId = index[0]?.id ?? null;
          state.hydrated = true;
        });
        get().checkShareHashOnLoad();
      },

      createCharacter() {
        const character = createDefaultCharacter();
        addCharacterToState(character);
        return character.id;
      },

      duplicateCharacter(id) {
        const source = get().characters[id];
        if (!source) return id;
        const clone = structuredClone(source);
        clone.id = newId();
        clone.name = `${source.name} (копия)`;
        addCharacterToState(clone);
        return clone.id;
      },

      renameCharacter(id, name) {
        mutateCharacter(id, (character) => {
          character.name = name;
        });
      },

      deleteCharacter(id) {
        set((state) => {
          delete state.characters[id];
          state.characterIndex = state.characterIndex.filter((c) => c.id !== id);
          if (state.activeCharacterId === id) {
            state.activeCharacterId = state.characterIndex[0]?.id ?? null;
          }
        });
        deleteCharacterStorage(id);
        scheduleIndexPersist(get().characterIndex);
      },

      setActiveCharacter(id) {
        set((state) => {
          state.activeCharacterId = id;
        });
      },

      updateMeta(id, patch) {
        mutateCharacter(id, (character) => {
          Object.assign(character.meta, patch);
        });
      },

      updateThemeColor(id, color) {
        mutateCharacter(id, (character) => {
          character.themeColor = color;
        });
      },

      updateFieldBaseValue(id, fieldId, baseValue) {
        mutateCharacter(id, (character) => {
          const ref = findStatField(character, fieldId);
          if (ref) ref.field.baseValue = baseValue;
        });
      },

      toggleProficient(id, fieldId) {
        mutateCharacter(id, (character) => {
          const ref = findStatField(character, fieldId);
          if (ref) ref.field.proficient = !ref.field.proficient;
        });
      },

      adjustHp(id, kind, delta) {
        mutateCharacter(id, (character) => {
          if (kind === 'current') character.combat.hpCurrent += delta;
          else character.combat.hpTemp = Math.max(0, character.combat.hpTemp + delta);
        });
      },

      setHpValue(id, kind, value) {
        mutateCharacter(id, (character) => {
          if (kind === 'current') character.combat.hpCurrent = value;
          else character.combat.hpTemp = Math.max(0, value);
        });
      },

      addBonus(id, appliesTo, data) {
        mutateBonus(id, (character) => {
          character.bonuses.push({ id: newId(), appliesTo, ...data });
        });
      },

      removeBonus(id, bonusId) {
        mutateBonus(id, (character) => {
          character.bonuses = character.bonuses.filter((b) => b.id !== bonusId);
        });
      },

      addSkill(id, label, ability) {
        mutateCharacter(id, (character) => {
          const skill: SkillField = {
            id: newId(),
            label,
            baseValue: 0,
            linkedAbility: ability,
            proficient: false,
            bonusIds: [],
            custom: true,
          };
          character.skills.push(skill);
        });
      },

      removeSkill(id, skillId) {
        mutateCharacter(id, (character) => {
          // стандартные навыки (custom !== true) удалять нельзя — только пользовательские
          character.skills = character.skills.filter((s) => s.id !== skillId || !s.custom);
        });
      },

      addAttack(id) {
        mutateCharacter(id, (character) => {
          const attack: Attack = {
            id: newId(),
            name: 'Новая атака',
            attackBonus: { id: newId(), label: 'Бонус атаки', baseValue: 0, bonusIds: [] },
            damageDice: '1к6',
            damageBonus: { id: newId(), label: 'Урон', baseValue: 0, bonusIds: [] },
            damageType: '',
          };
          character.attacks.push(attack);
        });
      },

      updateAttack(id, attackId, patch) {
        mutateCharacter(id, (character) => {
          const attack = character.attacks.find((a) => a.id === attackId);
          if (attack) Object.assign(attack, patch);
        });
      },

      removeAttack(id, attackId) {
        mutateBonus(id, (character) => {
          const attack = character.attacks.find((a) => a.id === attackId);
          if (attack) {
            character.bonuses = character.bonuses.filter(
              (b) => b.appliesTo !== attack.attackBonus.id && b.appliesTo !== attack.damageBonus.id,
            );
          }
          character.attacks = character.attacks.filter((a) => a.id !== attackId);
        });
      },

      setSpellcastingEnabled(id, enabled) {
        mutateCharacter(id, (character) => {
          if (enabled && !character.spellcasting) {
            character.spellcasting = {
              enabled: true,
              spellSaveDC: { id: newId(), label: 'DC заклинаний', baseValue: 8, proficient: true, bonusIds: [] },
              spellAttackBonus: {
                id: newId(),
                label: 'Бонус атаки заклинанием',
                baseValue: 0,
                proficient: true,
                bonusIds: [],
              },
              cantrips: [],
              spellbook: [],
            };
          } else if (character.spellcasting) {
            character.spellcasting.enabled = enabled;
          }
        });
      },

      addCantrip(id, text) {
        mutateCharacter(id, (character) => {
          character.spellcasting?.cantrips.push(text);
        });
      },

      removeCantrip(id, index) {
        mutateCharacter(id, (character) => {
          character.spellcasting?.cantrips.splice(index, 1);
        });
      },

      addSpellbookEntry(id, name, level) {
        mutateCharacter(id, (character) => {
          character.spellcasting?.spellbook.push({ id: newId(), name, level, prepared: false });
        });
      },

      removeSpellbookEntry(id, spellId) {
        mutateCharacter(id, (character) => {
          if (character.spellcasting) {
            character.spellcasting.spellbook = character.spellcasting.spellbook.filter((s) => s.id !== spellId);
          }
        });
      },

      toggleSpellPrepared(id, spellId) {
        mutateCharacter(id, (character) => {
          const spell = character.spellcasting?.spellbook.find((s) => s.id === spellId);
          if (spell) spell.prepared = !spell.prepared;
        });
      },

      addResource(id, data) {
        mutateCharacter(id, (character) => {
          character.resources.push({ id: newId(), used: 0, ...data });
        });
      },

      removeResource(id, resourceId) {
        mutateCharacter(id, (character) => {
          character.resources = character.resources.filter((r) => r.id !== resourceId);
        });
      },

      toggleResourceUsed(id, resourceId, index) {
        mutateCharacter(id, (character) => {
          const resource = character.resources.find((r) => r.id === resourceId);
          if (!resource) return;
          resource.used = index < resource.used ? index : index + 1;
        });
      },

      applyRest(id, kind) {
        mutateCharacter(id, (character) => {
          for (const resource of character.resources) {
            if (kind === 'short' && (resource.resetOn === 'short_rest' || resource.resetOn === 'both')) {
              resource.used = 0;
            }
            if (
              kind === 'long' &&
              (resource.resetOn === 'short_rest' || resource.resetOn === 'long_rest' || resource.resetOn === 'both')
            ) {
              resource.used = 0;
            }
          }
        });
      },

      addFeature(id) {
        mutateCharacter(id, (character) => {
          character.features.push({ id: newId(), title: 'Новая способность', description: '' });
        });
      },

      updateFeature(id, featureId, patch) {
        mutateCharacter(id, (character) => {
          const feature = character.features.find((f) => f.id === featureId);
          if (feature) Object.assign(feature, patch);
        });
      },

      removeFeature(id, featureId) {
        mutateCharacter(id, (character) => {
          character.features = character.features.filter((f) => f.id !== featureId);
        });
      },

      addEquipment(id) {
        mutateCharacter(id, (character) => {
          character.equipment.push({ id: newId(), name: 'Новый предмет', note: '' });
        });
      },

      updateEquipment(id, itemId, patch) {
        mutateCharacter(id, (character) => {
          const item = character.equipment.find((e) => e.id === itemId);
          if (item) Object.assign(item, patch);
        });
      },

      removeEquipment(id, itemId) {
        mutateCharacter(id, (character) => {
          character.equipment = character.equipment.filter((e) => e.id !== itemId);
        });
      },

      updateProficienciesAndLanguages(id, text) {
        mutateCharacter(id, (character) => {
          character.proficienciesAndLanguages = text;
        });
      },

      updateNotes(id, text) {
        mutateCharacter(id, (character) => {
          character.notes = text;
        });
      },

      async copyCharacterJson(id) {
        const character = get().characters[id];
        if (!character) return;
        flushPersist(id);
        const ok = await copyToClipboard(JSON.stringify(character, null, 2));
        get().showToast(ok ? 'JSON персонажа скопирован в буфер' : 'Не удалось скопировать в буфер', ok ? 'info' : 'error');
      },

      async importFromClipboard() {
        const text = await readFromClipboard();
        if (!text) {
          get().showToast('Буфер обмена пуст или недоступен', 'error');
          return;
        }
        const result = parseCharacterFromText(text);
        if (!result.ok) {
          get().showToast(result.error, 'error');
          return;
        }
        const conflictId = findConflictId(get().characterIndex, result.character.name);
        set((state) => {
          state.ui.pendingImport = { source: 'clipboard', character: result.character, conflictId };
        });
      },

      async shareCharacterLink(id) {
        const character = get().characters[id];
        if (!character) return;
        flushPersist(id);
        const url = buildShareUrl(character);
        const ok = await copyToClipboard(url);
        get().showToast(ok ? 'Ссылка скопирована в буфер' : 'Не удалось скопировать ссылку', ok ? 'info' : 'error');
      },

      checkShareHashOnLoad() {
        const encoded = readShareHashFromLocation();
        if (!encoded) return;
        const result = decodeCharacterFromShare(encoded);
        if (!result.ok) {
          get().showToast(result.error, 'error');
          clearShareHash();
          return;
        }
        const conflictId = findConflictId(get().characterIndex, result.character.name);
        set((state) => {
          state.ui.pendingImport = { source: 'link', character: result.character, conflictId };
        });
      },

      confirmPendingImport(mode, newName) {
        const pending = get().ui.pendingImport;
        if (!pending) return;
        const source: PendingImportSource = pending.source;
        const character = structuredClone(pending.character);
        character.id = newId();
        if (mode === 'rename' && newName) character.name = newName;

        if (mode === 'overwrite' && pending.conflictId) {
          const conflictId = pending.conflictId;
          set((state) => {
            delete state.characters[conflictId];
            state.characterIndex = state.characterIndex.filter((c) => c.id !== conflictId);
          });
          deleteCharacterStorage(conflictId);
        }

        addCharacterToState(character);
        set((state) => {
          state.ui.pendingImport = null;
        });
        if (source === 'link') clearShareHash();
        get().showToast(`Персонаж «${character.name}» импортирован`);
      },

      cancelPendingImport() {
        const pending = get().ui.pendingImport;
        set((state) => {
          state.ui.pendingImport = null;
        });
        if (pending?.source === 'link') clearShareHash();
      },

      toggleAside() {
        set((state) => {
          state.ui.asideOpen = !state.ui.asideOpen;
        });
      },

      toggleSectionCollapsed(sectionKey) {
        set((state) => {
          state.ui.collapsedSections[sectionKey] = !state.ui.collapsedSections[sectionKey];
        });
      },

      showToast(message, tone = 'info') {
        toastCounter += 1;
        set((state) => {
          state.ui.toast = { id: toastCounter, message, tone };
        });
      },

      clearToast() {
        set((state) => {
          state.ui.toast = null;
        });
      },
    };
  }),
);

function flushAll() {
  for (const id of Object.keys(useCharacterStore.getState().characters)) {
    flushPersist(id);
  }
  flushIndexPersist();
}

if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushAll();
  });
  window.addEventListener('beforeunload', flushAll);
}
