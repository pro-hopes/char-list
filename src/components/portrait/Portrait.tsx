'use client';

import { UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getPortraitUrl } from '../../lib/characters/portraits';
import styles from './Portrait.module.css';

/** Character portrait from Storage, or a placeholder. `size` in px. */
export function Portrait({ path, size, alt = '' }: { path?: string; size: number; alt?: string }) {
  const [loaded, setLoaded] = useState<{ path: string; url: string | null } | null>(null);

  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    void getPortraitUrl(path).then((url) => {
      if (!cancelled) setLoaded({ path, url });
    });
    return () => {
      cancelled = true;
    };
  }, [path]);

  const url = path && loaded?.path === path ? loaded.url : null;

  return (
    <div className={styles.frame} style={{ width: size, height: size }}>
      {url ? (
        <img src={url} alt={alt} className={styles.image} />
      ) : (
        <UserRound size={Math.round(size * 0.55)} className={styles.placeholder} aria-hidden />
      )}
    </div>
  );
}
