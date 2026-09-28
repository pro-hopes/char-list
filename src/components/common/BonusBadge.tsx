import styles from './BonusBadge.module.css';

/** Маленький зелёный значок с количеством бонусов у кнопки "+" — точка, если бонусов больше 9. */
export function BonusBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  const isDot = count > 9;
  return <span className={`${styles.badge} ${isDot ? styles.dot : ''}`}>{isDot ? '' : count}</span>;
}
