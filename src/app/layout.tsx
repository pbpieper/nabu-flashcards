import type { Metadata } from 'next';
import Script from 'next/script';
import ThemeProvider from '@/components/ThemeProvider';
import ThemeToggle from '@/components/ThemeToggle';
import { UpdateBanner } from '@/components/UpdateBanner';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nabu — Flashcard System',
  description: 'Multi-layer progressive reveal flashcards for language learning',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <Script id="nabu-theme-init" strategy="beforeInteractive">{`
          (function() {
            var t = localStorage.getItem('nabu-theme');
            var dark = t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches) || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
            if (dark) document.documentElement.classList.add('dark');
          })();
        `}</Script>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&family=Amiri:wght@400;700&family=Noto+Sans+Arabic:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-nabu-bg text-nabu-text">
        <ThemeProvider>
          <ThemeToggle />
          {children}
          <UpdateBanner />
        </ThemeProvider>
      </body>
    </html>
  );
}
