// =====================================================
// FILE: src/app/try/page.tsx
// PROJECT: pitch-game
// TASK: T7 — LINE หาพี่เก่ง (DIME x KTC)
// VERSION: T7-v1
// CREATED: 2026-05-09
// LAST MODIFIED: 2026-08-04
// PURPOSE: /try — Solo Mode
//
//   T7: redirect ไป /play ชั่วคราวระหว่างงาน KTC
//   เหตุผล: จอ Solo (components/solo/*) ยังเป็นเนื้อหา MEXPO (pitch หุ้น)
//   แต่ judge prompt กลายเป็นเคสพี่เก่งไปแล้ว ถ้าปล่อยไว้คนที่หลงเข้ามา
//   จะเจอโจทย์หุ้นแต่กรรมการตัดสินเรื่องพี่เก่ง
//
//   หลังงาน: เอา redirect ออก แล้วแปลงจอ Solo ให้ใช้เคสพี่เก่ง (Batch 5)
//
// CHANGE LOG:
//   T7-v1 (2026-08-04): redirect → /play (ชั่วคราว)
//   T6-v1 (2026-05-09): Initial — renders <SoloView />
// =====================================================

import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function TryPage() {
  redirect('/play');
}
