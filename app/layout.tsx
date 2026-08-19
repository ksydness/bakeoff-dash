import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Fantasy Bake Off',
  description: 'Friends-league Fantasy Great British Bake Off dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
