// FILE: src/app/layout.tsx — Root Layout
// VERSION: T0-v1 — Initial layout for T0 setup
// LAST MODIFIED: 2026-08-20
// HISTORY:
//   T0-v1: Initial — minimal root layout

import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LINE หาพี่มั่น — DIME × SCG',
  description: 'Driving Execution & Change Management · SCG — เกมโดย KKP Dime',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className="antialiased">{children}</body>
    </html>
  );
}
