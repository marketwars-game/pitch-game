// FILE: src/app/layout.tsx — Root Layout
// TASK: T9 — LINE หาพี่ชัวร์ (DIME x AXA Data & AI Week 2026)
// VERSION: T9-v1
// LAST MODIFIED: 2026-09-20
// CHANGE LOG:
//   T9-v1 (2026-09-20): metadata title/description เวอร์ชัน AXA Data & AI Week 2026
//   T8 (2026-08-20): metadata เวอร์ชัน SCG
//   T0-v1: Initial — minimal root layout

import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LINE หาพี่ชัวร์ — DIME × AXA',
  description: 'AXA Data & AI Week 2026 — เกมโดย KKP Dime',
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
