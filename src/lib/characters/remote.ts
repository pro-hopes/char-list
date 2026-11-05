import type { Character } from '../../types/character';
import { createClient } from '../supabase/client';
import type { Json } from '../supabase/database.types';

/** Row as stored in `public.characters`; `data` is untrusted until migrateCharacter(). */
export interface RemoteCharacter {
  id: string;
  data: unknown;
  version: number;
}

export type WriteResult = { ok: true; version: number } | { ok: false; reason: 'conflict' };

/** Error from Supabase/PostgREST, or a network failure (no `code`). */
export interface RemoteError {
  code?: string;
  message: string;
}

const COLUMNS = 'id, data, version';

function toJson(character: Character): Json {
  return character as unknown as Json;
}

export async function fetchCharacters(): Promise<RemoteCharacter[]> {
  const { data, error } = await createClient()
    .from('characters')
    .select(COLUMNS)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function fetchCharacter(id: string): Promise<RemoteCharacter | null> {
  const { data, error } = await createClient()
    .from('characters')
    .select(COLUMNS)
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** conflict = a row with this id already exists. */
export async function insertCharacter(character: Character): Promise<WriteResult> {
  const { data, error } = await createClient()
    .from('characters')
    .insert({ id: character.id, data: toJson(character) })
    .select('version')
    .single();
  if (error) {
    if (error.code === '23505') return { ok: false, reason: 'conflict' };
    throw error;
  }
  return { ok: true, version: data.version };
}

/** Optimistic update: conflict = the row changed (or was deleted) since `baseVersion`. */
export async function updateCharacter(character: Character, baseVersion: number): Promise<WriteResult> {
  const { data, error } = await createClient()
    .from('characters')
    .update({ data: toJson(character) })
    .eq('id', character.id)
    .eq('version', baseVersion)
    .is('deleted_at', null)
    .select('version')
    .maybeSingle();
  if (error) throw error;
  return data ? { ok: true, version: data.version } : { ok: false, reason: 'conflict' };
}

export async function softDeleteCharacter(id: string): Promise<void> {
  const { error } = await createClient()
    .from('characters')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

/**
 * Data errors (bad value, constraint, permission) will fail the same way on retry.
 * Everything else — network, timeouts, expired token — is worth retrying.
 */
export function isPermanentError(error: unknown): boolean {
  const code = (error as RemoteError | null)?.code ?? '';
  return /^(22|23|42)/.test(code);
}
