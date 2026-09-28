import { Settings } from 'lucide-react';
import type { ComponentType } from 'react';
import styles from './GearButton.module.css';

interface GearButtonProps {
  onClick: () => void;
  /** Иконка lucide-react; по умолчанию — шестерёнка. */
  icon?: ComponentType<{ size?: number }>;
  /** Если передан — кнопка становится текстовой (напр. "Открыть рюкзак"), иначе — компактный кружок. */
  label?: string;
  title?: string;
}

/** Кнопка "редактировать раздел" — открывает модалку с полным редактированием. */
export function GearButton({ onClick, icon: Icon = Settings, label, title = 'Редактировать раздел' }: GearButtonProps) {
  return (
    <button
      type="button"
      className={`${styles.button} ${label ? styles.buttonLabeled : ''}`}
      onClick={onClick}
      title={label ?? title}
    >
      <Icon size={label ? 14 : 12} />
      {label}
    </button>
  );
}
