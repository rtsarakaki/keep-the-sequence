import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Keep the Sequence - Cooperative Card Game',
  description: 'Play Keep the Sequence online with friends',
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

