import type { Character } from '../types/character';
import { migrateCharacter } from './migrations';

export type ParseCharacterResult = { ok: true; character: Character } | { ok: false; error: string };

/**
 * Единая точка входа для untrusted-данных (буфер обмена, share-ссылка).
 * Никогда не даёт невалидному JSON долететь до рендера секций.
 */
export function parseCharacterJson(raw: unknown): ParseCharacterResult {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'Ожидался JSON-объект персонажа' };
  }
  const obj = raw as Record<string, unknown>;
  if (typeof obj.name !== 'string' || !obj.abilities || typeof obj.abilities !== 'object') {
    return { ok: false, error: 'В JSON отсутствуют обязательные поля персонажа (name/abilities)' };
  }
  try {
    return { ok: true, character: migrateCharacter(raw) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Не удалось разобрать персонажа' };
  }
}

export function parseCharacterFromText(text: string): ParseCharacterResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Буфер обмена не содержит корректный JSON' };
  }
  return parseCharacterJson(raw);
}
