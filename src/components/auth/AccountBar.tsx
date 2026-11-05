'use client';

import type { User } from '@supabase/supabase-js';
import { LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import styles from './auth.module.css';

function displayName(user: User): string {
  const meta = user.user_metadata as Record<string, unknown>;
  const claims = meta.custom_claims as Record<string, unknown> | undefined;
  const name = claims?.global_name ?? meta.full_name ?? meta.name ?? user.email;
  return typeof name === 'string' && name ? name : 'Игрок';
}

/**
 * Signed-in Discord user with a sign-out button.
 * Login is enforced by proxy.ts; here we only react to sign-out (also from another tab).
 * Reads the session from local cookies via onAuthStateChange, so it works offline in the PWA.
 */
export function AccountBar() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const { data } = createClient().auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        window.location.assign('/login');
        return;
      }
      setUser(session?.user ?? null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (!user) return <div className={styles.bar} />;

  const avatar = (user.user_metadata as Record<string, unknown>).avatar_url;

  return (
    <div className={styles.bar}>
      <div className={styles.user}>
        {typeof avatar === 'string' && <img src={avatar} alt="" className={styles.avatar} />}
        <span className={styles.userName}>{displayName(user)}</span>
      </div>
      <button
        type="button"
        className={styles.barButton}
        // 'local' signs out only this device, other devices stay logged in.
        onClick={() => createClient().auth.signOut({ scope: 'local' })}
      >
        <LogOut size={14} /> Выйти
      </button>
    </div>
  );
}
