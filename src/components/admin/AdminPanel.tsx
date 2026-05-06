// =====================================================
// FILE: src/components/admin/AdminPanel.tsx
// PROJECT: pitch-game
// TASK: T2 — Admin Panel + Phase Control
// VERSION: T2-v1
// CREATED: 2026-05-06
// LAST MODIFIED: 2026-05-06
// PURPOSE: Top-level gateway — show AuthGate or Dashboard based on session
//          Replaces T0-v2 placeholder
//
// CHANGE LOG:
//   T2-v1 (2026-05-06): Rewrite from placeholder to gateway pattern
//   T0-v2 (2026-05-06): Initial extraction from src/app/admin/page.tsx (placeholder)
// =====================================================
'use client';

import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminAuthGate } from './AdminAuthGate';
import { AdminDashboard } from './AdminDashboard';

export function AdminPanel() {
  const { authed, loading, loggingIn, error, login, logout } = useAdminAuth();

  // Mount loading — show nothing (เร็วมาก ไม่ flash loading)
  if (loading) {
    return (
      <main
        style={{
          minHeight: '100vh',
          background: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      />
    );
  }

  if (!authed) {
    return (
      <AdminAuthGate
        loggingIn={loggingIn}
        error={error}
        onLogin={login}
      />
    );
  }

  return <AdminDashboard onLogout={logout} />;
}
