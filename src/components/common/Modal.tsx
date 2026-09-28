import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { pushModalHistory } from './modalHistoryStack';
import styles from './Modal.module.css';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  size?: 'default' | 'large';
}

export function Modal({ title, onClose, children, size = 'default' }: ModalProps) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Кнопка "назад" (в т.ч. системная на мобильном) закрывает верхнюю открытую модалку
  // вместо ухода со страницы/из приложения — см. modalHistoryStack.ts.
  useEffect(() => {
    let closedByPopState = false;
    const cleanup = pushModalHistory(() => {
      closedByPopState = true;
      onCloseRef.current();
    });
    return () => cleanup(closedByPopState);
  }, []);

  return createPortal(
    <div
      className={styles.overlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`${styles.panel} ${size === 'large' ? styles.panelLarge : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          <button type="button" className={styles.closeButton} onClick={onClose} title="Закрыть" aria-label="Закрыть">
            <X size={18} />
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}
