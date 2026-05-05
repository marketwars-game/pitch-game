// FILE: src/app/page.tsx — Home Page
// VERSION: T0-v1 — Redirect → /play
// LAST MODIFIED: 2026-05-05
// HISTORY:
//   T0-v1: Initial — root redirect ไปยัง /play

import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/play');
}
