// =====================================================
// FILE: src/hooks/useAdminAuth.ts
// PROJECT: pitch-game
// TASK: T2 — Admin Panel + Phase Control
// VERSION: T2-v1
// CREATED: 2026-05-06
// LAST MODIFIED: 2026-05-06
// PURPOSE: Admin session management
//          - Mount: check localStorage flag
//          - login(password): POST /api/admin/auth → set localStorage
//          - logout(): clear localStorage
//
// CHANGE LOG:
//   T2-v1 (2026-05-06): Initial
// =====================================================
'use client';

import { useEffect, useState, useCallback } from 'react';
import { LS_KEY_ADMIN_OK } from '@/lib/types';

export interface UseAdminAuthResult {
  authed: boolean;
  loading: boolean;       // true ระหว่างอ่าน localStorage บน mount
  loggingIn: boolean;     // true ระหว่างยิง POST /api/admin/auth
  error: string | null;
  login: (password: string) => Promise<void>;
  logout: () => void;
}

/**
 * จัดการ admin session
 *
 * - Mount: อ่าน localStorage[LS_KEY_ADMIN_OK] === 'true' → authed = true
 * - login(password): POST /api/admin/auth, ถ้า ok → save localStorage + set authed
 * - logout(): clear localStorage + set authed = false
 *
 * หมายเหตุ: localStorage ปิด tab แล้วยังอยู่ — สะดวกตอนงาน
 * Password เทียบฝั่ง server เท่านั้น — ไม่อยู่ใน browser
 */
export function useAdminAuth(): UseAdminAuthResult {
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mount: check localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const flag = localStorage.getItem(LS_KEY_ADMIN_OK);
      setAuthed(flag === 'true');
    } catch {
      // localStorage ใช้ไม่ได้ — ignore
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (password: string) => {
    if (!password) {
      setError('กรุณาใส่ password');
      return;
    }

    setLoggingIn(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };

      if (res.ok && data.ok) {
        try {
          localStorage.setItem(LS_KEY_ADMIN_OK, 'true');
        } catch {
          // ignore — session ยังใช้ได้แต่จะหายตอน refresh
        }
        setAuthed(true);
      } else {
        setError(data.error ?? 'รหัสผ่านไม่ถูกต้อง');
        setAuthed(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เชื่อมต่อ server ไม่สำเร็จ');
      setAuthed(false);
    } finally {
      setLoggingIn(false);
    }
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(LS_KEY_ADMIN_OK);
    } catch {
      // ignore
    }
    setAuthed(false);
    setError(null);
  }, []);

  return { authed, loading, loggingIn, error, login, logout };
}
