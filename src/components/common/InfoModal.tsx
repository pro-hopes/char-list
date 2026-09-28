import type { StatFieldBreakdownEntry } from '../../engine/computeStatField';
import styles from './InfoModal.module.css';
import { Modal } from './Modal';

interface InfoModalProps {
  title: string;
  description: string;
  affects?: string;
  /** Разложение текущего значения на составляющие (computed.breakdown) — если применимо к этому полю. */
  breakdown?: StatFieldBreakdownEntry[];
  onClose: () => void;
}

export function InfoModal({ title, description, affects, breakdown, onClose }: InfoModalProps) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className={styles.description}>{description}</p>

      {affects && (
        <>
          <p className={styles.affectsLabel}>На что влияет</p>
          <p className={styles.affects}>{affects}</p>
        </>
      )}

      {breakdown && breakdown.length > 0 && (
        <>
          <p className={styles.breakdownLabel}>Из чего складывается сейчас</p>
          <div className={styles.breakdownList}>
            {breakdown.map((entry, index) => (
              <div key={index} className={styles.breakdownRow}>
                <span>{entry.source}</span>
                <span className={styles.breakdownValue}>
                  {entry.dice ?? (entry.amount !== undefined && entry.amount >= 0 ? `+${entry.amount}` : entry.amount)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <button type="button" className={styles.closeButton} onClick={onClose}>
        Закрыть
      </button>
    </Modal>
  );
}
