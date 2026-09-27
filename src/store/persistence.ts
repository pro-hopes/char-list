import type { Character, CharacterSummary } from '../types/character';

const INDEX_KEY = 'dnd-sheets:index';
const CHAR_KEY_PREFIX = 'dnd-sheets:char:';
const DEBOUNCE_MS = 300;

const timers = new Map<string, ReturnType<typeof setTimeout>>();
const pendingCharacters = new Map<string, Character>();

function charKey(id: string): string {
  return `${CHAR_KEY_PREFIX}${id}`;
}

export function loadIndex(): CharacterSummary[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CharacterSummary[]) : [];
  } catch {
    return [];
  }
}

export function saveIndex(index: CharacterSummary[]): void {
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(index));
  } catch {
    // localStorage недоступен (приватный режим/квота) — тихо игнорируем, данные останутся только в памяти
  }
}

export function loadCharacter(id: string): Character | null {
  try {
    const raw = localStorage.getItem(charKey(id));
    if (!raw) return null;
    return JSON.parse(raw) as Character;
  } catch {
    return null;
  }
}

function writeCharacterNow(id: string, character: Character): void {
  try {
    localStorage.setItem(charKey(id), JSON.stringify(character));
  } catch {
    // см. saveIndex
  }
  pendingCharacters.delete(id);
  timers.delete(id);
}

export function schedulePersist(id: string, character: Character): void {
  pendingCharacters.set(id, character);
  const existing = timers.get(id);
  if (existing) clearTimeout(existing);
  const timer = setTimeout(() => {
    const pending = pendingCharacters.get(id);
    if (pending) writeCharacterNow(id, pending);
  }, DEBOUNCE_MS);
  timers.set(id, timer);
}

export function flushPersist(id: string): void {
  const timer = timers.get(id);
  if (timer) clearTimeout(timer);
  timers.delete(id);
  const pending = pendingCharacters.get(id);
  if (pending) writeCharacterNow(id, pending);
}

let indexTimer: ReturnType<typeof setTimeout> | null = null;
let pendingIndex: CharacterSummary[] | null = null;

export function scheduleIndexPersist(index: CharacterSummary[]): void {
  pendingIndex = index;
  if (indexTimer) clearTimeout(indexTimer);
  indexTimer = setTimeout(() => {
    if (pendingIndex) saveIndex(pendingIndex);
    pendingIndex = null;
    indexTimer = null;
  }, DEBOUNCE_MS);
}

export function flushIndexPersist(): void {
  if (indexTimer) clearTimeout(indexTimer);
  indexTimer = null;
  if (pendingIndex) {
    saveIndex(pendingIndex);
    pendingIndex = null;
  }
}

export function flushAllPersist(): void {
  for (const id of Array.from(pendingCharacters.keys())) {
    flushPersist(id);
  }
  flushIndexPersist();
}

export function deleteCharacterStorage(id: string): void {
  const timer = timers.get(id);
  if (timer) clearTimeout(timer);
  timers.delete(id);
  pendingCharacters.delete(id);
  try {
    localStorage.removeItem(charKey(id));
  } catch {
    // см. saveIndex
  }
}
