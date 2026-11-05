import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { DiscordLoginButton } from '../../components/auth/DiscordLoginButton';
import { createClient } from '../../lib/supabase/server';
import styles from './login.module.css';

export const metadata: Metadata = {
  title: 'Вход — D&D Персонаж',
};

const ERRORS: Record<string, string> = {
  denied: 'Вход отменён в Discord.',
  failed: 'Не удалось войти. Попробуйте ещё раз.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims) redirect('/');

  const { error } = await searchParams;
  const errorText = typeof error === 'string' ? (ERRORS[error] ?? ERRORS.failed) : null;

  return (
    <main className={styles.wrapper}>
      <div className={styles.card}>
        <h1 className={styles.title}>Вход</h1>
        <p className={styles.text}>
          Войдите через Discord — персонажи хранятся в аккаунте и доступны с любого устройства.
        </p>

        {errorText && <p className={styles.error}>{errorText}</p>}

        <DiscordLoginButton />
      </div>
    </main>
  );
}
