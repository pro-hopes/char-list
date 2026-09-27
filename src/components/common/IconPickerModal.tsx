import { EQUIPMENT_ICON_FILES, resolveIconUrl } from '../../engine/iconPack';
import styles from './IconPickerModal.module.css';
import { Modal } from './Modal';

interface IconPickerModalProps {
  currentIcon?: string;
  onSelect: (icon: string | undefined) => void;
  onClose: () => void;
}

export function IconPickerModal({ currentIcon, onSelect, onClose }: IconPickerModalProps) {
  return (
    <Modal title="Выбор иконки" onClose={onClose}>
      <div className={styles.clearRow}>
        <button
          type="button"
          className={styles.clearButton}
          onClick={() => {
            onSelect(undefined);
            onClose();
          }}
        >
          Без иконки
        </button>
      </div>
      <div className={styles.grid}>
        {EQUIPMENT_ICON_FILES.map((icon) => (
          <button
            key={icon}
            type="button"
            className={`${styles.iconButton} ${icon === currentIcon ? styles.iconButtonActive : ''}`}
            onClick={() => {
              onSelect(icon);
              onClose();
            }}
            title={icon}
          >
            <img src={resolveIconUrl(icon)} alt="" loading="lazy" />
          </button>
        ))}
      </div>
    </Modal>
  );
}
