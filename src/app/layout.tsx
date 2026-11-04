import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import '../styles/global.css';
import '../styles/theme.css';

export const metadata: Metadata = {
  title: 'D&D Персонаж',
  description: 'Интерактивный лист персонажа D&D 5e',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/icon_192x192.png', sizes: '192x192', type: 'image/png' }],
    apple: '/icon_192x192.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#14100f',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>
        {/* #root сохранён: global.css задаёт ему height: 100% */}
        <div id="root">{children}</div>
      </body>
    </html>
  );
}
