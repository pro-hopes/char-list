import { useEffect } from 'react';
import { useCharacterStore } from '../../store/characterStore';
import styles from './ToastHost.module.css';

export function ToastHost() {
  const toast = useCharacterStore((s) => s.ui.toast);
  const clearToast = useCharacterStore((s) => s.clearToast);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(clearToast, 3000);
    return () => clearTimeout(timer);
  }, [toast, clearToast]);

  if (!toast) return null;

  return (
    <div className={`${styles.toast} ${toast.tone === 'error' ? styles.error : ''}`} role="status">
      {toast.message}
    </div>
  );
}
