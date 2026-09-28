import { Info } from 'lucide-react';
import styles from './InfoButton.module.css';

interface InfoButtonProps {
  onClick: () => void;
  title?: string;
}

/** Маленькая кнопка "i" — открывает InfoModal с описанием поля/раздела. */
export function InfoButton({ onClick, title = 'Что это значит' }: InfoButtonProps) {
  return (
    <button type="button" className={styles.button} onClick={onClick} title={title}>
      <Info size={12} />
    </button>
  );
}
