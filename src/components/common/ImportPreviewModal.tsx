import { useState } from 'react';
import { useCharacterStore } from '../../store/characterStore';
import styles from './BonusModal.module.css';
import { Modal } from './Modal';

export function ImportPreviewModal() {
  const pendingImport = useCharacterStore((s) => s.ui.pendingImport);
  const confirmPendingImport = useCharacterStore((s) => s.confirmPendingImport);
  const cancelPendingImport = useCharacterStore((s) => s.cancelPendingImport);
  const [renameValue, setRenameValue] = useState('');

  if (!pendingImport) return null;

  const { character, source, conflictId } = pendingImport;
  const sourceLabel = source === 'link' ? 'ссылке' : 'буферу обмена';

  return (
    <Modal title="Импорт персонажа" onClose={cancelPendingImport}>
      <p>
        Импортировать персонажа «{character.name}» по {sourceLabel}?
      </p>

      {conflictId && (
        <>
          <p className={styles.error} style={{ color: 'var(--text-secondary)' }}>
            Персонаж с таким именем уже есть в списке. Выберите действие:
          </p>
          <div className={styles.field}>
            <label htmlFor="import-rename">Новое имя (для варианта "Переименовать")</label>
            <input
              id="import-rename"
              type="text"
              placeholder={character.name}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
            />
          </div>
        </>
      )}

      <div className={styles.actions} style={{ flexWrap: 'wrap' }}>
        <button type="button" className={styles.cancelButton} onClick={cancelPendingImport}>
          Отмена
        </button>
        {conflictId ? (
          <>
            <button type="button" className={styles.cancelButton} onClick={() => confirmPendingImport('overwrite')}>
              Перезаписать
            </button>
            <button
              type="button"
              className="accentButton"
              onClick={() => confirmPendingImport('rename', renameValue.trim() || `${character.name} (2)`)}
            >
              Переименовать и добавить
            </button>
          </>
        ) : (
          <button type="button" className="accentButton" onClick={() => confirmPendingImport('add')}>
            Импортировать
          </button>
        )}
      </div>
    </Modal>
  );
}
