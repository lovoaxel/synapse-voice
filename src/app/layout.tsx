import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import './globals.css';

const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'STARK AI — Voice Interface',
  description: 'Voice-activated AI assistant system',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={mono.variable}>
      <body className="font-mono bg-[#050510] text-slate-200 antialiased">{children}</body>
    </html>
  );
}
