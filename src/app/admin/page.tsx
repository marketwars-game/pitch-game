// =====================================================
// FILE: src/app/admin/page.tsx
// PROJECT: pitch-game
// TASK: T0 — Infra Setup (refactored T0-v2)
// VERSION: T11-v1
// CREATED: 2026-05-05
// LAST MODIFIED: 2026-11-26
// PURPOSE: Next.js route wrapper for /admin — delegates to <AdminPanel />
//          Wrapper stays thin; all logic lives in AdminPanel component.
//
// CHANGE LOG:
//   T11-v1 (2026-11-26): ชื่อแท็บ "🛠 Admin · LINE หาพี่ชัวร์" (แยกจากหน้าผู้เล่น/จอใหญ่)
//   T0-v2 (2026-05-06): Refactor to Page Wrapper Pattern (Tech Spec v1.2 §1.9)
//   T0-v1 (2026-05-05): Initial inline placeholder
// =====================================================
import type { Metadata } from 'next';
import { AdminPanel } from '@/components/admin/AdminPanel';

export const metadata: Metadata = {
  title: '🛠 Admin · LINE หาพี่ชัวร์',
};

export default function AdminPage() {
  return <AdminPanel />;
}
