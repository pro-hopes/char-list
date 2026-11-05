'use client';

import { ImageUp, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { useCharacterStore } from '../../store/characterStore';
import type { Character } from '../../types/character';
import { Portrait } from './Portrait';
import styles from './Portrait.module.css';

export function PortraitPicker({ character }: { character: Character }) {
  const uploadPortrait = useCharacterStore((s) => s.uploadPortrait);
  const removePortrait = useCharacterStore((s) => s.removePortrait);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    await uploadPortrait(character.id, file);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className={styles.picker}>
      <Portrait path={character.portraitPath} size={88} alt={character.name} />
      <div className={styles.pickerActions}>
        <div className={styles.pickerButtons}>
          <button
            type="button"
            className={styles.secondaryButton}
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <ImageUp size={14} />
            {uploading ? 'Загрузка…' : character.portraitPath ? 'Заменить портрет' : 'Загрузить портрет'}
          </button>
          {character.portraitPath && !uploading && (
            <button
              type="button"
              className={styles.secondaryButton}
              title="Удалить портрет"
              onClick={() => removePortrait(character.id)}
            >
              <Trash2 size={14} color="var(--danger)" />
            </button>
          )}
        </div>
        <span className={styles.hint}>JPG, PNG, WebP, HEIC — уменьшится автоматически</span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className={styles.fileInput}
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
    </div>
  );
}
