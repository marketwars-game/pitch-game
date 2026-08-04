// =====================================================
// FILE: src/components/presenter/PresenterStage.tsx
// PROJECT: pitch-game
// TASK: T7 — LINE หาพี่เก่ง (DIME x KTC)
// VERSION: T7-v1
// CREATED: 2026-08-04
// LAST MODIFIED: 2026-08-04
// PURPOSE: Fit-to-screen สำหรับจอโปรเจกเตอร์ — "ผืนผ้าใบคงที่ + letterbox"
//
//   ปัญหาเดิม: ทุกขนาดใน presenter.css เป็น px ที่ออกแบบบนพิกัด 1920×1080
//   แต่ตัวจอใช้ 100vw/100vh ตรงๆ พอโปรเจกเตอร์เป็น 1280×720 หรือ 4:3
//   เนื้อหาจะล้นและโดนตัด (จอกลางห้อง scroll ไม่ได้)
//
//   วิธีแก้: วางทุกอย่างบนผืนผ้าใบ 1920×1080 คงที่ แล้ว scale ทั้งผืน
//   ด้วย min(w/1920, h/1080) → พอดีจอเสมอทุกอัตราส่วน เหลือแค่แถบดำ
//
//   ⚠️ ห้ามใช้ 100vh / 100vw กับอะไรที่อยู่ "ข้างใน" ผืนผ้าใบ
//      ต้องใช้ % หรือ px เท่านั้น มิฉะนั้นจะอ้างอิงจอจริงแทนผืนผ้าใบ
//
//   ⚠️ ยึดกลางด้วย absolute + translate(-50%,-50%) ไม่ใช่ grid place-items-center
//      เพราะ grid จะไม่จัดกลางเมื่อกล่องลูก (1920) ใหญ่กว่ากล่องแม่ (จอจริง)
//      — เจอปัญหานี้จริงตอนทำ mockup รอบแรก ภาพเลื่อนไปมุมขวาล่าง
//
// CHANGE LOG:
//   T7-v1 (2026-08-04): Initial
// =====================================================
'use client';

import { useEffect, useState, type ReactNode } from 'react';

export const STAGE_W = 1920;
export const STAGE_H = 1080;

export function PresenterStage({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () =>
      setScale(
        Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H)
      );
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  return (
    <div className="t7-viewport">
      <div
        className="t7-canvas"
        style={{
          width: STAGE_W,
          height: STAGE_H,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
