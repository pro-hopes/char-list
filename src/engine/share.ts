import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import type { Character } from '../types/character';
import { parseCharacterJson, type ParseCharacterResult } from './schema';

const HASH_PREFIX = '#char=';

export function encodeCharacterForShare(character: Character): string {
  return compressToEncodedURIComponent(JSON.stringify(character));
}

export function buildShareUrl(character: Character): string {
  const encoded = encodeCharacterForShare(character);
  const url = new URL(window.location.href);
  url.hash = `char=${encoded}`;
  return url.toString();
}

export function decodeCharacterFromShare(encoded: string): ParseCharacterResult {
  const json = decompressFromEncodedURIComponent(encoded);
  if (!json) {
    return { ok: false, error: 'Не удалось распаковать данные из ссылки' };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { ok: false, error: 'Ссылка содержит повреждённые данные' };
  }
  return parseCharacterJson(raw);
}

export function readShareHashFromLocation(): string | null {
  const hash = window.location.hash;
  if (!hash.startsWith(HASH_PREFIX)) return null;
  return hash.slice(HASH_PREFIX.length);
}

export function clearShareHash(): void {
  const url = new URL(window.location.href);
  url.hash = '';
  window.history.replaceState(null, '', url.toString());
}
