import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'The Game - Cooperative Card Game',
  description: 'Play The Game online with friends',
  viewport: 'width=device-width, initial-scale=1',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

