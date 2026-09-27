import { ClipboardPaste, Copy, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useCharacterStore } from '../../store/characterStore';
import { ConfirmDialog } from '../common/ConfirmDialog';
import styles from './CharacterListScreen.module.css';

export function CharacterListScreen() {
  const characterIndex = useCharacterStore((s) => s.characterIndex);
  const createCharacter = useCharacterStore((s) => s.createCharacter);
  const duplicateCharacter = useCharacterStore((s) => s.duplicateCharacter);
  const renameCharacter = useCharacterStore((s) => s.renameCharacter);
  const deleteCharacter = useCharacterStore((s) => s.deleteCharacter);
  const setActiveCharacter = useCharacterStore((s) => s.setActiveCharacter);
  const importFromClipboard = useCharacterStore((s) => s.importFromClipboard);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Персонажи</h1>

      <div className={styles.toolbar}>
        <button type="button" className="accentButton" onClick={() => createCharacter()}>
          <Plus size={14} /> Новый персонаж
        </button>
        <button type="button" className="accentButton" onClick={() => importFromClipboard()}>
          <ClipboardPaste size={14} /> Вставить из буфера
        </button>
      </div>

      {characterIndex.length === 0 && <p className={styles.empty}>Пока нет ни одного персонажа — создайте первого.</p>}

      <div className={styles.list}>
        {characterIndex.map((summary) => (
          <div
            key={summary.id}
            className={styles.card}
            style={{ borderLeftColor: summary.themeColor }}
            onClick={() => setActiveCharacter(summary.id)}
          >
            <div className={styles.cardInfo}>
              {renamingId === summary.id ? (
                <input
                  autoFocus
                  value={renameValue}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => {
                    if (renameValue.trim()) renameCharacter(summary.id, renameValue.trim());
                    setRenamingId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.currentTarget.blur();
                  }}
                />
              ) : (
                <div className={styles.cardName}>{summary.name}</div>
              )}
              <div className={styles.cardSub}>
                {summary.race || 'Раса не указана'} · {summary.className || 'Класс не указан'}
              </div>
            </div>
            <div className={styles.cardActions}>
              <button
                type="button"
                title="Переименовать"
                onClick={(e) => {
                  e.stopPropagation();
                  setRenamingId(summary.id);
                  setRenameValue(summary.name);
                }}
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                title="Дублировать"
                onClick={(e) => {
                  e.stopPropagation();
                  duplicateCharacter(summary.id);
                }}
              >
                <Copy size={14} />
              </button>
              <button
                type="button"
                title="Удалить"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeletingId(summary.id);
                }}
              >
                <Trash2 size={14} color="var(--danger)" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {deletingId && (
        <ConfirmDialog
          title="Удалить персонажа?"
          message="Это действие нельзя отменить. Персонаж будет удалён без возможности восстановления."
          confirmLabel="Удалить"
          danger
          onCancel={() => setDeletingId(null)}
          onConfirm={() => {
            deleteCharacter(deletingId);
            setDeletingId(null);
          }}
        />
      )}
    </div>
  );
}
