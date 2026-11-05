import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Character } from '../../types/character';
import type { RemoteCharacter, WriteResult } from './remote';

// In-memory stand-in for the `characters` table.
const db = new Map<string, { data: Character; version: number; deleted: boolean }>();
let networkDown = false;
const calls: string[] = [];

function offlineGuard() {
  if (networkDown) throw { message: 'TypeError: Failed to fetch' };
}

vi.mock('./remote', () => ({
  fetchCharacter: vi.fn(async (id: string): Promise<RemoteCharacter | null> => {
    offlineGuard();
    const row = db.get(id);
    return row && !row.deleted ? { id, data: row.data, version: row.version } : null;
  }),
  insertCharacter: vi.fn(async (c: Character): Promise<WriteResult> => {
    offlineGuard();
    calls.push(`insert ${c.id}`);
    if (db.has(c.id)) return { ok: false, reason: 'conflict' };
    if ((c as unknown as { bad?: boolean }).bad) throw { code: '23514', message: 'check constraint' };
    db.set(c.id, { data: c, version: 1, deleted: false });
    return { ok: true, version: 1 };
  }),
  updateCharacter: vi.fn(async (c: Character, base: number): Promise<WriteResult> => {
    offlineGuard();
    calls.push(`update ${c.id}@${base}`);
    const row = db.get(c.id);
    if (!row || row.deleted || row.version !== base) return { ok: false, reason: 'conflict' };
    row.data = c;
    row.version += 1;
    return { ok: true, version: row.version };
  }),
  softDeleteCharacter: vi.fn(async (id: string) => {
    offlineGuard();
    calls.push(`delete ${id}`);
    const row = db.get(id);
    if (row) row.deleted = true;
  }),
  isPermanentError: (e: { code?: string }) => /^(22|23|42)/.test(e?.code ?? ''),
}));

const { CharacterSync } = await import('./sync');

const storage = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (k: string) => storage.get(k) ?? null,
  setItem: (k: string, v: string) => void storage.set(k, v),
  removeItem: (k: string) => void storage.delete(k),
});

function char(id: string, name: string, extra: object = {}): Character {
  return { id, name, ...extra } as unknown as Character;
}

function makeSync() {
  const events = { conflicts: [] as [string, RemoteCharacter | null][], rejected: [] as string[], connection: [] as boolean[] };
  const sync = new CharacterSync({
    onConflict: (id, fresh) => events.conflicts.push([id, fresh]),
    onRejected: (id) => events.rejected.push(id),
    onConnectionChange: (offline) => events.connection.push(offline),
  });
  return { sync, events };
}

const remoteRows = (): RemoteCharacter[] =>
  [...db.entries()].filter(([, r]) => !r.deleted).map(([id, r]) => ({ id, data: r.data, version: r.version }));

beforeEach(() => {
  vi.useFakeTimers();
  db.clear();
  storage.clear();
  calls.length = 0;
  networkDown = false;
});
afterEach(() => vi.useRealTimers());

describe('CharacterSync', () => {
  it('inserts a new character immediately and debounces later edits into one update', async () => {
    const { sync } = makeSync();
    sync.start('u1', []);
    sync.saveNow(char('a', 'Торин'));
    await vi.advanceTimersByTimeAsync(0);
    expect(calls).toEqual(['insert a']);

    for (let hp = 10; hp > 5; hp--) sync.save(char('a', `Торин ${hp}`));
    await vi.advanceTimersByTimeAsync(1000);
    expect(calls).toEqual(['insert a']);
    await vi.advanceTimersByTimeAsync(600);
    expect(calls).toEqual(['insert a', 'update a@1']);
    expect(db.get('a')).toMatchObject({ version: 2, data: { name: 'Торин 6' } });
    expect(storage.size).toBe(0);
  });

  it('sends edits made during an in-flight request afterwards, never in parallel', async () => {
    const { sync } = makeSync();
    sync.start('u1', []);
    sync.saveNow(char('a', 'v1'));
    sync.saveNow(char('a', 'v2')); // insert still in flight
    await vi.advanceTimersByTimeAsync(0);
    expect(calls).toEqual(['insert a', 'update a@1']);
    expect(db.get('a')?.data.name).toBe('v2');
  });

  it('detects an edit from another device and hands over the server copy', async () => {
    db.set('a', { data: char('a', 'old'), version: 1, deleted: false });
    const { sync, events } = makeSync();
    sync.start('u1', remoteRows());

    db.get('a')!.version = 2; // another device saved
    db.get('a')!.data = char('a', 'from laptop');

    sync.save(char('a', 'from phone'));
    await vi.advanceTimersByTimeAsync(2000);
    expect(events.conflicts).toEqual([['a', { id: 'a', data: char('a', 'from laptop'), version: 2 }]]);
    expect(db.get('a')?.data.name).toBe('from laptop');

    // Next edit is based on the fresh version and goes through.
    sync.save(char('a', 'phone again'));
    await vi.advanceTimersByTimeAsync(2000);
    expect(db.get('a')).toMatchObject({ version: 3, data: { name: 'phone again' } });
  });

  it('keeps changes while offline, notifies once, and retries', async () => {
    const { sync, events } = makeSync();
    sync.start('u1', []);
    networkDown = true;
    sync.saveNow(char('a', 'offline'));
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(5000 * 3);
    expect(events.connection).toEqual([true]);
    expect(storage.get('dnd-sheets:outbox:u1')).toContain('offline');

    networkDown = false;
    await vi.advanceTimersByTimeAsync(5000);
    expect(events.connection).toEqual([true, false]);
    expect(db.get('a')?.data.name).toBe('offline');
    expect(storage.size).toBe(0);
  });

  it('replays the outbox after the app was killed offline', async () => {
    db.set('a', { data: char('a', 'server'), version: 1, deleted: false });
    const first = makeSync().sync;
    first.start('u1', remoteRows());
    networkDown = true;
    first.save(char('a', 'edited offline'));
    first.saveNow(char('b', 'created offline'));
    await vi.advanceTimersByTimeAsync(2000);

    // App restarts with network back.
    networkDown = false;
    vi.clearAllTimers();
    const { sync } = makeSync();
    const { rows } = sync.start('u1', remoteRows());
    expect(rows.map((r) => [r.id, (r.data as Character).name])).toEqual([
      ['a', 'edited offline'],
      ['b', 'created offline'],
    ]);
    await vi.advanceTimersByTimeAsync(0);
    expect(db.get('a')?.data.name).toBe('edited offline');
    expect(db.get('b')?.data.name).toBe('created offline');
  });

  it('turns a duplicate insert (lost response) into an update', async () => {
    db.set('a', { data: char('a', 'landed'), version: 1, deleted: false });
    storage.set('dnd-sheets:outbox:u1', JSON.stringify({ a: { entry: { op: 'save', character: char('a', 'retry') } } }));
    const { sync, events } = makeSync();
    sync.start('u1', remoteRows());
    await vi.advanceTimersByTimeAsync(0);
    expect(calls).toEqual(['insert a', 'update a@1']);
    expect(db.get('a')?.data.name).toBe('retry');
    expect(events.conflicts).toEqual([]);
  });

  it('soft-deletes and hides pending deletes from the list on restart', async () => {
    db.set('a', { data: char('a', 'x'), version: 1, deleted: false });
    const first = makeSync().sync;
    first.start('u1', remoteRows());
    networkDown = true;
    first.remove('a');
    await vi.advanceTimersByTimeAsync(0);

    networkDown = false;
    vi.clearAllTimers();
    const { sync } = makeSync();
    expect(sync.start('u1', remoteRows()).rows).toEqual([]);
    await vi.advanceTimersByTimeAsync(0);
    expect(db.get('a')?.deleted).toBe(true);
  });

  it('drops a change the database rejects instead of retrying forever', async () => {
    const { sync, events } = makeSync();
    sync.start('u1', []);
    sync.saveNow(char('a', 'huge import', { bad: true }));
    await vi.advanceTimersByTimeAsync(20000);
    expect(events.rejected).toEqual(['a']);
    expect(calls).toEqual(['insert a']);
    expect(storage.size).toBe(0);
  });
});
