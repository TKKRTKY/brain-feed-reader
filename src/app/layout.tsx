import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Brain Feed Reader',
  description: '電子書籍を脳に直接流し込むWebアプリケーション',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
