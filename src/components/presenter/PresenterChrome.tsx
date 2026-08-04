// =====================================================
// FILE: src/components/presenter/PresenterChrome.tsx
// PROJECT: pitch-game
// TASK: T7 — LINE หาพี่เก่ง (DIME x KTC)
// VERSION: T7-v1
// CREATED: 2026-08-04
// LAST MODIFIED: 2026-08-04
// PURPOSE: ชิ้นส่วนที่ทุกจอใช้ร่วมกัน — พื้นหลัง ambient + แถบแบรนด์มุมบน
//          แทน PresenterHeader เดิม (ซึ่งใช้โลโก้ dime-d.png + ชื่อเกมเก่า)
//          T7 ใช้ตัวอักษรล้วน ไม่ใช้โลโก้ เพราะไม่มีไฟล์โลโก้ KTC ที่อนุมัติแล้ว
//
// CHANGE LOG:
//   T7-v1 (2026-08-04): Initial
// =====================================================
'use client';

import { BRAND_LEFT, BRAND_RIGHT } from '@/lib/presenter-config';

/** พื้นหลัง ambient (ออร์บ + กริด + vignette) — ใส่เป็นชั้นล่างสุดของทุกจอ */
export function T7Ambient({ thirdOrb = false }: { thirdOrb?: boolean }) {
  return (
    <>
      <div className="t7-orb t7-orb--1" />
      <div className="t7-orb t7-orb--2" />
      {thirdOrb && <div className="t7-orb t7-orb--3" />}
      <div className="t7-grid" />
      <div className="t7-vignette" />
    </>
  );
}

export type T7StatusVariant = 'default' | 'warn' | 'danger';

/** แถบบน: DIME × KTC ซ้าย + สถานะขวา */
export function T7TopBar({
  status,
  variant = 'default',
  dot = false,
}: {
  status: string;
  variant?: T7StatusVariant;
  dot?: boolean;
}) {
  const cls =
    variant === 'warn'
      ? ' t7-session--warn'
      : variant === 'danger'
        ? ' t7-session--danger'
        : '';
  return (
    <div className="t7-topbar">
      <div className="t7-brand">
        <span className="t7-brand-dime">{BRAND_LEFT}</span>
        <span className="t7-brand-x">×</span>
        {BRAND_RIGHT}
      </div>
      <div className={`t7-session${cls}`}>
        {dot && <span className="t7-livedot" />}
        {status}
      </div>
    </div>
  );
}
