import { ImagePlus } from 'lucide-react';
import { resolveIconUrl } from '../../engine/iconPack';
import styles from './IconButton.module.css';

interface IconButtonProps {
  icon?: string;
  onClick: () => void;
  title?: string;
}

/** Кнопка-аватар: показывает выбранную иконку предмета/способности/etc или заглушку, открывает IconPickerModal. */
export function IconButton({ icon, onClick, title = 'Выбрать иконку' }: IconButtonProps) {
  return (
    <button type="button" className={styles.iconButton} onClick={onClick} title={title}>
      {icon ? <img src={resolveIconUrl(icon)} alt="" /> : <ImagePlus size={16} />}
    </button>
  );
}
