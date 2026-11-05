import type { Character } from '../../types/character';
import {
  fetchCharacter,
  insertCharacter,
  isPermanentError,
  softDeleteCharacter,
  updateCharacter,
  type RemoteCharacter,
  type WriteResult,
} from './remote';

const SAVE_DEBOUNCE_MS = 1500;
const RETRY_MS = 5000;
const OUTBOX_PREFIX = 'dnd-sheets:outbox:';

type Entry = { op: 'save'; character: Character } | { op: 'delete' };

/** Persisted unsaved change: survives the app being killed while offline. */
interface OutboxItem {
  entry: Entry;
  /** Server version the change was made on; absent = character not in the database yet. */
  baseVersion?: number;
}

export interface SyncCallbacks {
  /** The row changed or disappeared on another device; local unsaved edits for it were dropped. */
  onConflict(id: string, fresh: RemoteCharacter | null): void;
  /** The database rejected a change for good (e.g. invalid or too large data). */
  onRejected(id: string, message: string): void;
  /** Saving started failing (offline) or recovered. */
  onConnectionChange(offline: boolean): void;
}

export interface StartResult {
  /** Database rows with unsaved local edits applied, then local-only (not yet inserted) characters. */
  rows: { id: string; data: unknown }[];
}

/**
 * Saves characters to Supabase: debounced whole-document writes, one request per character at a time,
 * optimistic concurrency via `version`, and an outbox in localStorage for changes not yet confirmed.
 */
export class CharacterSync {
  /** Last server version we know for each character; absent = not inserted yet. */
  private versions = new Map<string, number>();
  private pending = new Map<string, Entry>();
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  private inFlight = new Set<string>();
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private outboxKey: string | null = null;
  private offline = false;
  private readonly callbacks: SyncCallbacks;

  constructor(callbacks: SyncCallbacks) {
    this.callbacks = callbacks;
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.flushAll());
    }
  }

  /** Call once after loading rows from the database. Restores and replays the outbox. */
  start(userId: string, remote: RemoteCharacter[]): StartResult {
    this.outboxKey = `${OUTBOX_PREFIX}${userId}`;
    this.versions = new Map(remote.map((r) => [r.id, r.version]));

    const outbox = this.readOutbox();
    const rows: StartResult['rows'] = [];
    for (const r of remote) {
      const item = outbox[r.id];
      if (item?.entry.op === 'delete') continue;
      rows.push({ id: r.id, data: item?.entry.op === 'save' ? item.entry.character : r.data });
    }

    for (const [id, item] of Object.entries(outbox)) {
      this.pending.set(id, item.entry);
      // Write against the version the edit was based on, so edits made elsewhere meanwhile are detected.
      if (item.baseVersion === undefined) this.versions.delete(id);
      else this.versions.set(id, item.baseVersion);
      if (item.entry.op === 'save' && !remote.some((r) => r.id === id) && item.baseVersion === undefined) {
        rows.push({ id, data: item.entry.character });
      }
    }

    this.flushAll();
    return { rows };
  }

  /** Debounced save of the whole character. */
  save(character: Character) {
    this.pending.set(character.id, { op: 'save', character });
    this.writeOutbox();
    this.schedule(character.id, SAVE_DEBOUNCE_MS);
  }

  /** Save right away (new or imported character). */
  saveNow(character: Character) {
    this.pending.set(character.id, { op: 'save', character });
    this.writeOutbox();
    void this.flush(character.id);
  }

  remove(id: string) {
    this.pending.set(id, { op: 'delete' });
    this.writeOutbox();
    void this.flush(id);
  }

  flushAll() {
    for (const id of Array.from(this.pending.keys())) void this.flush(id);
  }

  private schedule(id: string, delay: number) {
    const existing = this.timers.get(id);
    if (existing) clearTimeout(existing);
    this.timers.set(
      id,
      setTimeout(() => void this.flush(id), delay),
    );
  }

  private async flush(id: string) {
    const timer = this.timers.get(id);
    if (timer) clearTimeout(timer);
    this.timers.delete(id);
    // One request per character at a time; the finally below picks up newer edits.
    if (this.inFlight.has(id)) return;
    const entry = this.pending.get(id);
    if (!entry) return;

    this.inFlight.add(id);
    try {
      await this.write(id, entry);
      this.settle(id, entry);
      this.setOffline(false);
    } catch (error) {
      if (isPermanentError(error)) {
        this.settle(id, entry);
        this.callbacks.onRejected(id, (error as Error).message);
      } else {
        this.setOffline(true);
        this.scheduleRetry();
      }
    } finally {
      this.inFlight.delete(id);
      const next = this.pending.get(id);
      if (next && next !== entry && !this.timers.has(id) && !this.offline) void this.flush(id);
    }
  }

  private async write(id: string, entry: Entry) {
    if (entry.op === 'delete') {
      await softDeleteCharacter(id);
      this.versions.delete(id);
      return;
    }

    const { character } = entry;
    const base = this.versions.get(id);
    let result: WriteResult = base === undefined ? await insertCharacter(character) : await updateCharacter(character, base);

    if (!result.ok && base === undefined) {
      // Id already exists: an earlier insert went through but its response was lost.
      const existing = await fetchCharacter(id);
      if (existing) result = await updateCharacter(character, existing.version);
    }

    if (result.ok) {
      this.versions.set(id, result.version);
      return;
    }

    // Changed on another device: drop local edits for this character and take the server copy.
    const fresh = await fetchCharacter(id);
    this.dropPending(id);
    if (fresh) this.versions.set(id, fresh.version);
    else this.versions.delete(id);
    this.callbacks.onConflict(id, fresh);
  }

  /** Remove `entry` from pending if nothing newer replaced it meanwhile. */
  private settle(id: string, entry: Entry) {
    if (this.pending.get(id) === entry) this.pending.delete(id);
    this.writeOutbox();
  }

  private dropPending(id: string) {
    this.pending.delete(id);
    const timer = this.timers.get(id);
    if (timer) clearTimeout(timer);
    this.timers.delete(id);
    this.writeOutbox();
  }

  private setOffline(offline: boolean) {
    if (this.offline === offline) return;
    this.offline = offline;
    this.callbacks.onConnectionChange(offline);
  }

  private scheduleRetry() {
    if (this.retryTimer) return;
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      this.flushAll();
    }, RETRY_MS);
  }

  private readOutbox(): Record<string, OutboxItem> {
    if (!this.outboxKey) return {};
    try {
      const raw = localStorage.getItem(this.outboxKey);
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, OutboxItem>) : {};
    } catch {
      return {};
    }
  }

  private writeOutbox() {
    if (!this.outboxKey) return;
    const outbox: Record<string, OutboxItem> = {};
    for (const [id, entry] of this.pending) {
      outbox[id] = { entry, baseVersion: this.versions.get(id) };
    }
    try {
      if (this.pending.size === 0) localStorage.removeItem(this.outboxKey);
      else localStorage.setItem(this.outboxKey, JSON.stringify(outbox));
    } catch {
      // Storage unavailable: changes still go to the database, just not crash-safe offline.
    }
  }
}
