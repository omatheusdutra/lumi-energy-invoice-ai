import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { Manrope, Space_Grotesk } from 'next/font/google';
import { Providers } from '@/app/providers';
import '@/app/globals.css';

const textFont = Manrope({
  subsets: ['latin'],
  variable: '--font-text',
});

const headingFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-heading',
});

export const metadata: Metadata = {
  title: 'Energy Analytics Hub',
  description: 'Portal de análise de faturas de energia com dashboards e alertas.',
  icons: {
    icon: '/icon.svg?v=4',
    shortcut: '/icon.svg?v=4',
    apple: '/icon.svg?v=4',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const nonce = headers().get('x-nonce') ?? undefined;

  return (
    <html lang="pt-BR" className={`${textFont.variable} ${headingFont.variable}`}>
      <body className="app-gradient min-h-screen font-[var(--font-text)]" data-nonce={nonce}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
