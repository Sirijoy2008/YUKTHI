import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'YUKTHI — Smarter Payments. Safer Money.',
  description:
    'A simple, trustworthy Indian FinTech platform connecting scam checking, payment help, and money planning.',
  icons: {
    icon: '/yukthi-icon.png',
    apple: '/yukthi-icon.png',
  },
};

import { LanguageProvider } from '@/context/LanguageContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F8FAFC] text-[#0F172A]">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
