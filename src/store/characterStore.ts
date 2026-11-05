import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { applyBeastFormDamage, getActiveBeastForm } from '../engine/beastForm';
import {
  createDefaultBeastForm,
  createDefaultCharacter,
  createEmptyAttack,
  createEmptySpellSlots,
} from '../engine/defaultTemplates';
import { clampHp, computeHpMax } from '../engine/hitPoints';
import { migrateCharacter } from '../engine/migrations';
import { parseCharacterFromText } from '../engine/schema';
import { buildShareUrl, clearShareHash, decodeCharacterFromShare, readShareHashFromLocation } from '../engine/share';
import { findStatField, syncBonusIds } from '../engine/statFieldRegistry';
import type {
  AbilityKey,
  Attack,
  BeastAbilityKey,
  BeastForm,
  Bonus,
  Cantrip,
  Character,
  CharacterSummary,
  EquipmentItem,
  Feature,
  ResourceTracker,
  SkillField,
  SpellbookEntry,
  SpellDetails,
} from '../types/character';
import type { PendingImportSource, UiState } from '../types/store';
import { copyToClipboard, readFromClipboard } from '../utils/clipboard';
import { newId } from '../utils/id';
import { fetchCharacters, type RemoteCharacter } from '../lib/characters/remote';
import { CharacterSync } from '../lib/characters/sync';
import { createClient } from '../lib/supabase/client';

let toastCounter = 0;
let hydrating: Promise<void> | null = null;

// Callbacks run after the store exists (only on network results), so referencing it here is safe.
const sync = new CharacterSync({
  onConflict(id, fresh) {
    useCharacterStore.getState().applyRemoteCharacter(id, fresh);
  },
  onRejected(id, message) {
    const name = useCharacterStore.getState().characters[id]?.name;
    console.error('character save rejected', id, message);
    useCharacterStore
      .getState()
      .showToast(`Не удалось сохранить${name ? ` «${name}»` : ''}: данные отклонены сервером`, 'error');
  },
  onConnectionChange(offline) {
    useCharacterStore
      .getState()
      .showToast(
        offline ? 'Нет связи с сервером — изменения сохранятся, когда связь появится' : 'Связь восстановлена, изменения сохранены',
        offline ? 'error' : 'info',
      );
  },
});

function toSummary(character: Character): CharacterSummary {
  return {
    id: character.id,
    name: character.name,
    race: character.meta.race,
    className: character.meta.className,
    themeColor: character.themeColor,
  };
}

interface AppState {
  hydrated: boolean;
  /** Loading from the database failed; the UI shows it with a retry button. */
  loadError: string | null;
  characterIndex: CharacterSummary[];
  characters: Record<string, Character>;
  activeCharacterId: string | null;
  ui: UiState;
}

interface AppActions {
  hydrate(): Promise<void>;
  /** Replace a character with the server copy after a conflict (null = deleted elsewhere). */
  applyRemoteCharacter(id: string, remote: RemoteCharacter | null): void;

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
  updateAttack(id: string, attackId: string, patch: Partial<Pick<Attack, 'name' | 'damageDice' | 'damageType' | 'notes' | 'icon'>>): void;
  removeAttack(id: string, attackId: string): void;

  setSpellcastingEnabled(id: string, enabled: boolean): void;
  addCantrip(id: string, name: string): void;
  updateCantrip(id: string, cantripId: string, patch: Partial<Pick<Cantrip, 'name' | 'description' | 'icon' | keyof SpellDetails>>): void;
  removeCantrip(id: string, cantripId: string): void;
  addSpellbookEntry(id: string, name: string, level: number): void;
  updateSpellbookEntry(id: string, spellId: string, patch: Partial<Pick<SpellbookEntry, 'name' | 'level' | 'description' | 'icon' | keyof SpellDetails>>): void;
  removeSpellbookEntry(id: string, spellId: string): void;
  toggleSpellPrepared(id: string, spellId: string): void;
  setSpellSlotMax(id: string, level: number, max: number): void;
  toggleSpellSlotUsed(id: string, level: number, index: number): void;
  setSpellsPreparedOnly(id: string, preparedOnly: boolean): void;

  addResource(id: string, data: Omit<ResourceTracker, 'id' | 'used'>): void;
  updateResource(id: string, resourceId: string, patch: Partial<Pick<ResourceTracker, 'label' | 'max' | 'resetOn' | 'icon'>>): void;
  removeResource(id: string, resourceId: string): void;
  toggleResourceUsed(id: string, resourceId: string, index: number): void;
  applyRest(id: string, kind: 'short' | 'long'): void;

  addFeature(id: string): void;
  updateFeature(id: string, featureId: string, patch: Partial<Pick<Feature, 'title' | 'description' | 'icon'>>): void;
  removeFeature(id: string, featureId: string): void;

  addEquipment(id: string): void;
  updateEquipment(id: string, itemId: string, patch: Partial<Pick<EquipmentItem, 'name' | 'note' | 'quantity' | 'icon'>>): void;
  adjustEquipmentQuantity(id: string, itemId: string, delta: number): void;
  removeEquipment(id: string, itemId: string): void;

  addBeastForm(id: string): void;
  updateBeastForm(id: string, formId: string, patch: Partial<Pick<BeastForm, 'name' | 'icon' | 'ac' | 'speed' | 'hpMax' | 'notes'>>): void;
  updateBeastFormAbility(id: string, formId: string, ability: BeastAbilityKey, value: number): void;
  removeBeastForm(id: string, formId: string): void;
  addBeastFormSkill(id: string, formId: string, skillId: string): void;
  updateBeastFormSkill(id: string, formId: string, skillId: string, patch: { skillId?: string; value?: number }): void;
  removeBeastFormSkill(id: string, formId: string, skillId: string): void;
  addBeastFormAttack(id: string, formId: string): void;
  updateBeastFormAttack(id: string, formId: string, attackId: string, patch: BeastAttackPatch): void;
  removeBeastFormAttack(id: string, formId: string, attackId: string): void;
  setBeastFormResource(id: string, resourceId: string | undefined): void;
  activateBeastForm(id: string, formId: string): void;
  revertBeastForm(id: string): void;
  damageBeastForm(id: string, amount: number): void;
  healBeastForm(id: string, amount: number): void;

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

export type BeastAttackPatch = Partial<Pick<Attack, 'name' | 'damageDice' | 'damageType' | 'notes' | 'icon'>> & {
  attackBonus?: number;
  damageBonus?: number;
};

function findBeastForm(character: Character, formId: string): BeastForm | undefined {
  return character.beastForms.find((f) => f.id === formId);
}

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
        if (idx >= 0) state.characterIndex[idx] = toSummary(character);
      });
      const character = get().characters[id];
      if (character) sync.save(character);
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
        state.characterIndex.push(toSummary(character));
        state.activeCharacterId = character.id;
      });
      const added = get().characters[character.id];
      if (added) sync.saveNow(added);
    }

    function removeCharacterFromState(id: string) {
      set((state) => {
        delete state.characters[id];
        state.characterIndex = state.characterIndex.filter((c) => c.id !== id);
        if (state.activeCharacterId === id) {
          state.activeCharacterId = state.characterIndex[0]?.id ?? null;
        }
      });
    }

    async function loadFromDatabase() {
      set((state) => {
        state.loadError = null;
      });
      try {
        const {
          data: { session },
        } = await createClient().auth.getSession();
        if (!session) {
          window.location.assign('/login');
          return;
        }
        const remote = await fetchCharacters();
        const { rows } = sync.start(session.user.id, remote);

        const characters: Record<string, Character> = {};
        const index: CharacterSummary[] = [];
        for (const row of rows) {
          const character = migrateCharacter(row.data);
          character.id = row.id;
          characters[row.id] = character;
          index.push(toSummary(character));
        }
        set((state) => {
          state.characterIndex = index;
          state.characters = characters;
          state.activeCharacterId = index[0]?.id ?? null;
          state.hydrated = true;
        });
        get().checkShareHashOnLoad();
      } catch (error) {
        console.error('failed to load characters', error);
        set((state) => {
          state.loadError = 'Не удалось загрузить персонажей. Проверьте соединение и попробуйте ещё раз.';
        });
      }
    }

    return {
      hydrated: false,
      loadError: null,
      characterIndex: [],
      characters: {},
      activeCharacterId: null,
      ui: { asideOpen: false, collapsedSections: {}, pendingImport: null, toast: null },

      hydrate() {
        // Guard against double calls (React Strict Mode runs effects twice in dev).
        if (get().hydrated) return Promise.resolve();
        hydrating ??= loadFromDatabase().finally(() => {
          hydrating = null;
        });
        return hydrating;
      },

      applyRemoteCharacter(id, remote) {
        const localName = get().characters[id]?.name;
        if (!remote) {
          removeCharacterFromState(id);
          if (localName) get().showToast(`Персонаж «${localName}» удалён на другом устройстве`, 'error');
          return;
        }
        const character = migrateCharacter(remote.data);
        character.id = id;
        set((state) => {
          state.characters[id] = character;
          const idx = state.characterIndex.findIndex((c) => c.id === id);
          if (idx >= 0) state.characterIndex[idx] = toSummary(character);
          else state.characterIndex.push(toSummary(character));
        });
        get().showToast(`«${character.name}» изменён на другом устройстве — загружена актуальная версия`, 'error');
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
        removeCharacterFromState(id);
        sync.remove(id);
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
        const current = get().characters[id];
        if (!current) return;
        get().setHpValue(id, kind, (kind === 'current' ? current.combat.hpCurrent : current.combat.hpTemp) + delta);
      },

      setHpValue(id, kind, value) {
        const current = get().characters[id];
        if (!current) return;
        // максимум считаем по неизменённому персонажу, а не по immer-черновику
        const hpMax = kind === 'current' ? computeHpMax(current) : 0;
        mutateCharacter(id, (character) => {
          if (kind === 'current') character.combat.hpCurrent = clampHp(value, hpMax);
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
          character.attacks.push(createEmptyAttack());
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
              slots: createEmptySpellSlots(),
              preparedOnly: false,
            };
          } else if (character.spellcasting) {
            character.spellcasting.enabled = enabled;
          }
        });
      },

      addCantrip(id, name) {
        mutateCharacter(id, (character) => {
          character.spellcasting?.cantrips.push({ id: newId(), name, description: '' });
        });
      },

      updateCantrip(id, cantripId, patch) {
        mutateCharacter(id, (character) => {
          const cantrip = character.spellcasting?.cantrips.find((c) => c.id === cantripId);
          if (cantrip) Object.assign(cantrip, patch);
        });
      },

      removeCantrip(id, cantripId) {
        mutateCharacter(id, (character) => {
          if (character.spellcasting) {
            character.spellcasting.cantrips = character.spellcasting.cantrips.filter((c) => c.id !== cantripId);
          }
        });
      },

      addSpellbookEntry(id, name, level) {
        mutateCharacter(id, (character) => {
          character.spellcasting?.spellbook.push({ id: newId(), name, level, prepared: false, description: '' });
        });
      },

      updateSpellbookEntry(id, spellId, patch) {
        mutateCharacter(id, (character) => {
          const spell = character.spellcasting?.spellbook.find((s) => s.id === spellId);
          if (spell) Object.assign(spell, patch);
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

      setSpellSlotMax(id, level, max) {
        mutateCharacter(id, (character) => {
          const slot = character.spellcasting?.slots[level - 1];
          if (!slot) return;
          slot.max = Math.max(0, max);
          slot.used = Math.min(slot.used, slot.max);
        });
      },

      toggleSpellSlotUsed(id, level, index) {
        mutateCharacter(id, (character) => {
          const slot = character.spellcasting?.slots[level - 1];
          if (slot) slot.used = index < slot.used ? index : index + 1;
        });
      },

      setSpellsPreparedOnly(id, preparedOnly) {
        mutateCharacter(id, (character) => {
          if (character.spellcasting) character.spellcasting.preparedOnly = preparedOnly;
        });
      },

      addResource(id, data) {
        mutateCharacter(id, (character) => {
          character.resources.push({ id: newId(), used: 0, ...data });
        });
      },

      updateResource(id, resourceId, patch) {
        mutateCharacter(id, (character) => {
          const resource = character.resources.find((r) => r.id === resourceId);
          if (resource) Object.assign(resource, patch);
        });
      },

      removeResource(id, resourceId) {
        mutateCharacter(id, (character) => {
          character.resources = character.resources.filter((r) => r.id !== resourceId);
          if (character.beastFormResourceId === resourceId) character.beastFormResourceId = undefined;
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
          if (kind === 'long') {
            for (const slot of character.spellcasting?.slots ?? []) slot.used = 0;
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
          character.equipment.push({ id: newId(), name: 'Новый предмет', note: '', quantity: 1 });
        });
      },

      updateEquipment(id, itemId, patch) {
        mutateCharacter(id, (character) => {
          const item = character.equipment.find((e) => e.id === itemId);
          if (item) Object.assign(item, patch);
        });
      },

      adjustEquipmentQuantity(id, itemId, delta) {
        mutateCharacter(id, (character) => {
          const item = character.equipment.find((e) => e.id === itemId);
          if (item) item.quantity = Math.max(0, item.quantity + delta);
        });
      },

      removeEquipment(id, itemId) {
        mutateCharacter(id, (character) => {
          character.equipment = character.equipment.filter((e) => e.id !== itemId);
        });
      },

      addBeastForm(id) {
        mutateCharacter(id, (character) => {
          character.beastForms.push(createDefaultBeastForm());
        });
      },

      updateBeastForm(id, formId, patch) {
        mutateCharacter(id, (character) => {
          const form = findBeastForm(character, formId);
          if (!form) return;
          Object.assign(form, patch);
          if (patch.hpMax !== undefined) {
            form.hpMax = Math.max(1, patch.hpMax);
            form.hpCurrent = Math.min(form.hpCurrent, form.hpMax);
          }
        });
      },

      updateBeastFormAbility(id, formId, ability, value) {
        mutateCharacter(id, (character) => {
          const form = findBeastForm(character, formId);
          if (form) form.abilities[ability] = value;
        });
      },

      removeBeastForm(id, formId) {
        mutateCharacter(id, (character) => {
          character.beastForms = character.beastForms.filter((f) => f.id !== formId);
          if (character.activeBeastFormId === formId) character.activeBeastFormId = undefined;
        });
      },

      addBeastFormSkill(id, formId, skillId) {
        mutateCharacter(id, (character) => {
          const form = findBeastForm(character, formId);
          if (form && !form.skills.some((s) => s.skillId === skillId)) form.skills.push({ skillId, value: 0 });
        });
      },

      updateBeastFormSkill(id, formId, skillId, patch) {
        mutateCharacter(id, (character) => {
          const form = findBeastForm(character, formId);
          const skill = form?.skills.find((s) => s.skillId === skillId);
          if (!form || !skill) return;
          // один навык — одна строка: не даём выбрать навык, который уже есть в облике
          if (patch.skillId && patch.skillId !== skillId && form.skills.some((s) => s.skillId === patch.skillId)) return;
          Object.assign(skill, patch);
        });
      },

      removeBeastFormSkill(id, formId, skillId) {
        mutateCharacter(id, (character) => {
          const form = findBeastForm(character, formId);
          if (form) form.skills = form.skills.filter((s) => s.skillId !== skillId);
        });
      },

      addBeastFormAttack(id, formId) {
        mutateCharacter(id, (character) => {
          findBeastForm(character, formId)?.attacks.push(createEmptyAttack());
        });
      },

      updateBeastFormAttack(id, formId, attackId, patch) {
        mutateCharacter(id, (character) => {
          const attack = findBeastForm(character, formId)?.attacks.find((a) => a.id === attackId);
          if (!attack) return;
          const { attackBonus, damageBonus, ...rest } = patch;
          Object.assign(attack, rest);
          if (attackBonus !== undefined) attack.attackBonus.baseValue = attackBonus;
          if (damageBonus !== undefined) attack.damageBonus.baseValue = damageBonus;
        });
      },

      removeBeastFormAttack(id, formId, attackId) {
        mutateCharacter(id, (character) => {
          const form = findBeastForm(character, formId);
          if (form) form.attacks = form.attacks.filter((a) => a.id !== attackId);
        });
      },

      setBeastFormResource(id, resourceId) {
        mutateCharacter(id, (character) => {
          character.beastFormResourceId = resourceId;
        });
      },

      activateBeastForm(id, formId) {
        let exhaustedResource: string | undefined;
        mutateCharacter(id, (character) => {
          const form = findBeastForm(character, formId);
          if (!form) return;
          form.hpCurrent = form.hpMax;
          character.activeBeastFormId = formId;
          const resource = character.resources.find((r) => r.id === character.beastFormResourceId);
          if (!resource) return;
          if (resource.used < resource.max) resource.used += 1;
          else exhaustedResource = resource.label;
        });
        if (exhaustedResource) {
          get().showToast(`Использований «${exhaustedResource}» не осталось — облик принят без списания`, 'error');
        }
      },

      revertBeastForm(id) {
        mutateCharacter(id, (character) => {
          character.activeBeastFormId = undefined;
        });
      },

      damageBeastForm(id, amount) {
        let revertMessage: string | undefined;
        mutateCharacter(id, (character) => {
          const form = getActiveBeastForm(character);
          if (!form || amount <= 0) return;
          const result = applyBeastFormDamage(
            { temp: character.combat.hpTemp, formHp: form.hpCurrent, ownHp: character.combat.hpCurrent },
            amount,
          );
          character.combat.hpTemp = result.temp;
          form.hpCurrent = result.formHp;
          character.combat.hpCurrent = result.ownHp;
          if (result.reverted) {
            character.activeBeastFormId = undefined;
            revertMessage =
              result.overflow > 0
                ? `Облик «${form.name}» спал, остаток урона ${result.overflow} перешёл на хиты персонажа`
                : `Облик «${form.name}» спал`;
          }
        });
        if (revertMessage) get().showToast(revertMessage);
      },

      healBeastForm(id, amount) {
        mutateCharacter(id, (character) => {
          const form = getActiveBeastForm(character);
          if (form && amount > 0) form.hpCurrent = Math.min(form.hpMax, form.hpCurrent + amount);
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
          // Soft delete: the overwritten character can still be recovered from the database.
          removeCharacterFromState(pending.conflictId);
          sync.remove(pending.conflictId);
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

// Save immediately when the app goes to the background: mobile OSes kill hidden PWAs without warning.
// Anything that doesn't make it stays in the outbox and is sent on the next launch.
if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') sync.flushAll();
  });
  window.addEventListener('pagehide', () => sync.flushAll());
}
