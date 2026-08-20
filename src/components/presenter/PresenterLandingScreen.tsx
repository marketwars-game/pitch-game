// =====================================================
// FILE: src/components/presenter/PresenterLandingScreen.tsx
// PROJECT: pitch-game
// TASK: T8 — LINE หาพี่มั่น (DIME x SCG)
// VERSION: T8-v1
// CREATED: 2026-05-07
// LAST MODIFIED: 2026-08-20
// PURPOSE: จอ idle ก่อน MC กด SPACE — คนเดินเข้าห้องเห็นจอนี้ก่อนใคร
//          ตัวเอกของหน้า: บับเบิลแชทที่พิมพ์ข้อความพี่มั่นวนไปเรื่อยๆ
//          ทำให้คนเข้าใจโจทย์ตั้งแต่ยังไม่มีใครพูด
//
// CHANGE LOG:
//   T8-v1 (2026-08-20): tagline เคสพี่มั่น — บับเบิล/ชื่อดึงจาก DEFAULT_CASE อยู่แล้ว
//   T7-v1 (2026-08-04): เขียนใหม่ทั้งไฟล์ (เดิม: AI Stock Pitch Battle + โลโก้ Dime)
//                       ตัดโลโก้ออก ใช้ตัวอักษรล้วน · ตัดแถบ footer ออก
//   T4-v1 (2026-05-07): Initial — cinematic idle loop
// =====================================================
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  LANDING_PARTICLE_COUNT,
  LANDING_PARTICLE_COLORS,
  SESSION_NAME,
} from '@/lib/presenter-config';
import { DEFAULT_CASE } from '@/lib/stock-data';
import { T7Ambient, T7TopBar } from './PresenterChrome';

/** สุ่มแบบ seed คงที่ — ได้ค่าเดิมทั้งฝั่ง server และ client (กัน hydration mismatch)
 *  และไม่ทำให้ useMemo กลายเป็น impure */
function seeded(i: number, salt = 1): number {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const TYPE_MS = 45;
const ERASE_MS = 15;
const HOLD_MS = 3400;

export function PresenterLandingScreen() {
  const particles = useMemo(
    () =>
      Array.from({ length: LANDING_PARTICLE_COUNT }, (_, i) => {
        const color =
          LANDING_PARTICLE_COLORS[i % LANDING_PARTICLE_COLORS.length];
        const size = 3 + seeded(i, 1) * 5;
        return {
          left: `${seeded(i, 2) * 100}%`,
          size,
          color,
          duration: `${15 + seeded(i, 3) * 12}s`,
          delay: `${-seeded(i, 4) * 24}s`,
        };
      }),
    []
  );

  const typed = useTypingLoop(DEFAULT_CASE.chat);

  return (
    <div className="t7-landing">
      <T7Ambient thirdOrb />

      {particles.map((p, i) => (
        <span
          key={i}
          className="t7-particle"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
            animationDuration: p.duration,
            animationDelay: p.delay,
          }}
        />
      ))}

      <div className="t7-ghost t7-ghost--sub">
        <div className="t7-ghost-bubble">พี่ไม่เคยลงทุนอะไรเลยสักอย่าง</div>
      </div>

      <div className="t7-ghost t7-ghost--main">
        <div className="t7-ghost-bubble">
          <div className="t7-ghost-name">{DEFAULT_CASE.name}</div>
          {typed}
          <span className="t7-ghost-cursor" />
        </div>
      </div>

      <div className="t7-stage">
        <T7TopBar status={SESSION_NAME} />

        <div className="t7-landing-center">
          <div className="t7-eyebrow">ด่านสุดท้ายของคลาสวันนี้</div>

          <h1 className="t7-landing-title">
            <span className="t7-word t7-word--1">LINE&nbsp;หา</span>
            <span
              className="t7-word t7-word--2 t7-keng"
              data-text={DEFAULT_CASE.name}
            >
              {DEFAULT_CASE.name}
            </span>
          </h1>

          <div className="t7-lead">
            {DEFAULT_CASE.name}ไม่อยากเปลี่ยน แต่หัวหน้ามีข้อความเดียวที่จะเปิดใจแก
            <br />
            คุณมี<b>ข้อความเดียว</b>ที่จะเปลี่ยนใจแก
          </div>

          <div className="t7-rule" />

          <div className="t7-hint">
            กด <span className="t7-kbd">SPACE</span> เพื่อเริ่ม
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * พิมพ์ข้อความทีละตัว → หยุดค้าง → ลบ → บรรทัดถัดไป วนไม่รู้จบ
 * ใช้ timeout ต่อกันแทน interval เพื่อให้จังหวะพิมพ์/ลบไม่เท่ากันได้
 */
function useTypingLoop(lines: string[]): string {
  const [text, setText] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (lines.length === 0) return;
    // ถ้าผู้ใช้ตั้งค่าลดอนิเมชัน — แสดงบรรทัดแรกค้างไว้ (ตั้งแบบ async กัน cascading render)
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      const t = setTimeout(() => setText(lines[0]), 0);
      return () => clearTimeout(t);
    }

    let line = 0;
    let pos = 0;
    let erasing = false;
    let cancelled = false;

    const step = () => {
      if (cancelled) return;
      const full = lines[line % lines.length];

      if (!erasing) {
        pos++;
        setText(full.slice(0, pos));
        if (pos >= full.length) {
          erasing = true;
          timer.current = setTimeout(step, HOLD_MS);
          return;
        }
        timer.current = setTimeout(step, TYPE_MS);
      } else {
        pos--;
        setText(full.slice(0, Math.max(0, pos)));
        if (pos <= 0) {
          erasing = false;
          line++;
          timer.current = setTimeout(step, 800);
          return;
        }
        timer.current = setTimeout(step, ERASE_MS);
      }
    };

    timer.current = setTimeout(step, 600);
    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [lines]);

  return text;
}
