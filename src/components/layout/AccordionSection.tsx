import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { useCharacterStore } from '../../store/characterStore';
import styles from './AccordionSection.module.css';

interface AccordionSectionProps {
  id: string;
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function AccordionSection({ id, title, actions, children }: AccordionSectionProps) {
  const collapsed = useCharacterStore((s) => !!s.ui.collapsedSections[id]);
  const toggle = useCharacterStore((s) => s.toggleSectionCollapsed);

  return (
    <section className={styles.section}>
      <div className={`${styles.header} sectionPlaque`}>
        <button
          type="button"
          className={styles.headerLeft}
          onClick={() => toggle(id)}
          aria-expanded={!collapsed}
          style={{ background: 'none', border: 'none', color: 'inherit', font: 'inherit', padding: 0 }}
        >
          <ChevronDown size={16} className={`${styles.chevron} ${collapsed ? styles.chevronCollapsed : ''}`} />
          {title}
        </button>
        {actions && (
          <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
            {actions}
          </div>
        )}
      </div>
      {!collapsed && <div className={styles.body}>{children}</div>}
    </section>
  );
}
