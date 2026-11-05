import { newId } from '../../utils/id';
import { createClient } from '../supabase/client';

const BUCKET = 'portraits';
const MAX_SIDE = 768;
const QUALITY = 0.85;
const MAX_SOURCE_BYTES = 30 * 1024 * 1024;
const SIGNED_URL_TTL_S = 24 * 60 * 60;

function storage() {
  return createClient().storage.from(BUCKET);
}

async function currentUserId(): Promise<string> {
  const {
    data: { session },
  } = await createClient().auth.getSession();
  if (!session) throw new Error('Нужно войти в аккаунт');
  return session.user.id;
}

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Не удалось открыть изображение'));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, QUALITY));
}

/** Downscale to MAX_SIDE and re-encode: WebP, or JPEG where the browser can't encode WebP (older Safari). */
export async function prepareImage(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new Error('Это не изображение');
  if (file.size > MAX_SOURCE_BYTES) throw new Error('Файл слишком большой (больше 30 МБ)');

  const img = await loadImage(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Не удалось обработать изображение');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const webp = await canvasToBlob(canvas, 'image/webp');
  if (webp?.type === 'image/webp') return webp;
  const jpeg = await canvasToBlob(canvas, 'image/jpeg');
  if (!jpeg) throw new Error('Не удалось обработать изображение');
  return jpeg;
}

function newPath(userId: string, characterId: string, contentType: string) {
  const ext = contentType === 'image/webp' ? 'webp' : contentType === 'image/png' ? 'png' : 'jpg';
  return `${userId}/${characterId}/${newId()}.${ext}`;
}

/** Resize and upload; returns the storage path to keep in `character.portraitPath`. */
export async function uploadPortrait(characterId: string, file: File): Promise<string> {
  const [userId, blob] = await Promise.all([currentUserId(), prepareImage(file)]);
  const path = newPath(userId, characterId, blob.type);
  // Every upload gets a new name, so the file never changes and can be cached forever.
  const { error } = await storage().upload(path, blob, {
    contentType: blob.type,
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) throw new Error(`Не удалось загрузить портрет: ${error.message}`);
  return path;
}

export async function deletePortrait(path: string): Promise<void> {
  urlCache.delete(path);
  const { error } = await storage().remove([path]);
  if (error) console.error('failed to delete portrait', path, error.message);
}

/**
 * Copy a portrait for a duplicated/imported character. Only files in the current user's
 * folder can be copied; a portrait from someone else's export is dropped (undefined).
 */
export async function copyPortrait(path: string, toCharacterId: string): Promise<string | undefined> {
  const userId = await currentUserId();
  if (!path.startsWith(`${userId}/`)) return undefined;
  const ext = path.slice(path.lastIndexOf('.') + 1);
  const target = `${userId}/${toCharacterId}/${newId()}.${ext}`;
  const { error } = await storage().copy(path, target);
  if (error) {
    console.error('failed to copy portrait', path, error.message);
    return undefined;
  }
  return target;
}

// Signed URLs are cached per path; paths are immutable, so a URL stays valid for its whole TTL.
const urlCache = new Map<string, { promise: Promise<string | null>; expiresAt: number }>();

export function getPortraitUrl(path: string): Promise<string | null> {
  const cached = urlCache.get(path);
  if (cached && cached.expiresAt > Date.now()) return cached.promise;

  const promise = storage()
    .createSignedUrl(path, SIGNED_URL_TTL_S)
    .then(({ data, error }) => {
      if (error) {
        urlCache.delete(path);
        return null;
      }
      return data.signedUrl;
    });
  // Refresh a bit before the URL actually expires.
  urlCache.set(path, { promise, expiresAt: Date.now() + (SIGNED_URL_TTL_S - 60 * 60) * 1000 });
  return promise;
}
