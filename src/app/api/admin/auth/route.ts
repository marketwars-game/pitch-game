// =====================================================
// FILE: src/app/api/admin/auth/route.ts
// PROJECT: pitch-game
// TASK: T2 — Admin Panel + Phase Control
// VERSION: T2-v1
// CREATED: 2026-05-06
// LAST MODIFIED: 2026-05-06
// PURPOSE: Server-side password verification for admin panel
//          Receives { password } → compare with process.env.ADMIN_PASSWORD
//          Returns { ok: true/false }
//          Password ไม่อยู่ฝั่ง browser — secure ผ่าน API route
//
// CHANGE LOG:
//   T2-v1 (2026-05-06): Initial — POST handler with timing-safe compare
// =====================================================

import { NextRequest, NextResponse } from 'next/server';

// Force dynamic — ห้าม cache route นี้
export const dynamic = 'force-dynamic';

/**
 * Timing-safe string compare เพื่อกัน timing attack
 * (สำหรับ password ที่ไม่ยาว — overkill นิดหน่อย แต่ปลอดภัยกว่า)
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function POST(request: NextRequest) {
  let body: { password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON' },
      { status: 400 }
    );
  }

  const password = body?.password;
  if (typeof password !== 'string') {
    return NextResponse.json(
      { ok: false, error: 'Password required' },
      { status: 400 }
    );
  }

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    // Server misconfiguration — log แต่ไม่ leak detail
    console.error('[admin/auth] ADMIN_PASSWORD env not set');
    return NextResponse.json(
      { ok: false, error: 'Server not configured' },
      { status: 500 }
    );
  }

  if (timingSafeEqual(password, expected)) {
    return NextResponse.json({ ok: true });
  }

  // Generic error message — ไม่ leak ว่า password format ผิดหรือถูก
  return NextResponse.json(
    { ok: false, error: 'รหัสผ่านไม่ถูกต้อง' },
    { status: 401 }
  );
}
