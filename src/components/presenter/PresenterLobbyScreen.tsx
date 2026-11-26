// =====================================================
// FILE: src/components/presenter/PresenterLobbyScreen.tsx
// PROJECT: pitch-game
// TASK: T7 — LINE หาพี่เก่ง (DIME x KTC)
// VERSION: T11-v2
// CREATED: 2026-05-07
// LAST MODIFIED: 2026-11-26
// PURPOSE: จอ LOBBY — QR + รายชื่อผู้เล่นทุกคน
//          - แสดงชื่อ "ครบทุกคน" ไม่ตัดทิ้ง โดยย่อทั้งก้อนอัตโนมัติเมื่อเริ่มล้น
//            (scale-to-fit ชั้นใน — วัด scrollHeight เทียบ clientHeight)
//          - คลิก QR เพื่อขยายเต็มจอ สำหรับคนหลังห้องที่สแกนไม่ติด
//          - ไม่แสดงเพดานจำนวนคน (ไม่มี "/80")
//
// CHANGE LOG:
//   T11-v2 (2026-11-26): แก้ชื่อตกขอบเมื่อคนเยอะ — scale-to-fit วัดซ้ำจนพอดี (binary search) + MIN_SCALE 0.45
//   T11-v1 (2026-11-26): ขั้นตอนบนจอ "ใส่ชื่อ เช่น Oan.C" ตามกติกาชื่อของงาน (ข้อความล้วน)
//   T9-v1 (2026-11-26): BU FinTech Workshop — คำโปรยให้ตรงกับ landing/มือถือ + "รอวิทยากรกดเริ่ม" (ข้อความล้วน)
//   T7-v1 (2026-08-04): เขียนใหม่ — layout ใหม่, ชื่อครบทุกคน, QR popup,
//                       เลิกใช้ PILL_GRID_MAX (ไม่ตัดชื่อทิ้งแล้ว)
//   T4-v1 (2026-05-07): Initial
// =====================================================
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { PlayerRow } from '@/lib/types';
import {
  URL_BAR_TEXT,
  URL_BAR_CAPTION,
  QR_TARGET_URL,
} from '@/lib/presenter-config';
import { DEFAULT_CASE } from '@/lib/stock-data';
import { T7Ambient, T7TopBar } from './PresenterChrome';

/** ย่อได้ต่ำสุด — ถ้าชนเพดานนี้แปลว่าต้องเปลี่ยน layout ไม่ใช่ย่อต่อ */
const MIN_SCALE = 0.45; // T11: 0.55 → 0.45 รองรับ ~300 ชื่อบนจอ 1080p

type Props = {
  players: PlayerRow[]; // sorted DESC by joined_at (newest first)
  newPlayerIds: Set<string>;
};

export function PresenterLobbyScreen({ players, newPlayerIds }: Props) {
  const [zoomed, setZoomed] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const namesRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  // ---------- scale-to-fit ชั้นใน ----------
  const refit = useCallback(() => {
    const box = boxRef.current;
    const names = namesRef.current;
    if (!box || !names) return;
    const avail = box.clientHeight;
    if (avail <= 0) return;

    // T11: วัดซ้ำจนพอดี (เดิมคำนวณรอบเดียว → ที่ 180 คน ชื่อ 54 ชื่อตกขอบล่าง)
    // ย่อ = แถวกว้างขึ้น (width = 100/s %) → จำนวนแถวลด → ความสูงธรรมชาติเปลี่ยน
    // จึงต้องลองค่า s แล้ววัด scrollHeight จริงที่ความกว้างนั้น (scrollHeight ไม่ได้รับผลจาก transform)
    const fits = (s: number): boolean => {
      names.style.width = `${100 / s}%`;
      return names.scrollHeight * s <= avail;
    };

    let next = 1;
    if (!fits(1)) {
      // binary search หา scale ที่ใหญ่ที่สุดที่ยังพอดี ในช่วง [MIN_SCALE, 1]
      let lo = MIN_SCALE;
      let hi = 1;
      if (fits(lo)) {
        for (let i = 0; i < 8; i++) {
          const mid = (lo + hi) / 2;
          if (fits(mid)) lo = mid;
          else hi = mid;
        }
      }
      next = lo;
    }
    // คืนค่า width ให้ตรงกับ scale ที่เลือก (React จะ set ซ้ำค่าเดียวกันตอน render)
    names.style.width = next < 1 ? `${100 / next}%` : '100%';
    setScale(next);
  }, []);

  useEffect(() => {
    const raf = requestAnimationFrame(refit);
    // วัดซ้ำหลังฟอนต์/emoji โหลดเสร็จ (ความสูงขยับหลัง first paint)
    const t = setTimeout(refit, 150);
    window.addEventListener('resize', refit);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
      window.removeEventListener('resize', refit);
    };
  }, [players.length, refit]);

  // ปิด popup ด้วย Escape
  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomed(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoomed]);

  return (
    <div className="t7-lobby">
      <T7Ambient />

      <div className="t7-stage">
        <T7TopBar status="เปิดห้องแล้ว" dot />

        <div className="t7-lobby-body">
          {/* ---------- ซ้าย: QR ---------- */}
          <div className="t7-lobby-left">
            <div className="t7-lobby-eyebrow">ห้องของรอบนี้</div>
            <div className="t7-lobby-title">
              LINE หา<span className="t7-hl">{DEFAULT_CASE.name}</span>
            </div>
            <div className="t7-lobby-sub">
              {DEFAULT_CASE.name}กลัวเสี่ยง แต่อยากรู้เรื่องหุ้น SpaceX
            </div>

            <button
              type="button"
              className="t7-qrcard"
              onClick={() => setZoomed(true)}
              aria-label="ขยาย QR"
            >
              <QRCodeSVG
                value={QR_TARGET_URL}
                size={270}
                bgColor="#ffffff"
                fgColor="#0a0a18"
                level="M"
                marginSize={0}
              />
              <span className="t7-scanline" />
              <span className="t7-zoomhint">คลิกเพื่อขยาย</span>
            </button>

            <div className="t7-url">{URL_BAR_TEXT}</div>
            <div className="t7-steps">
              <b>สแกน</b>
              <i>→</i>
              <b>ใส่ชื่อ เช่น Oan.C</b>
              <i>→</i>
              <b>รอสัญญาณ</b>
            </div>
          </div>

          {/* ---------- ขวา: ชื่อทุกคน ---------- */}
          <div className="t7-lobby-right">
            <div className="t7-counter">
              <span className="t7-cnum">{players.length}</span>
              <span className="t7-clabel">คนเข้ามาแล้ว</span>
              <span className="t7-waitcue">รอวิทยากรกดเริ่ม</span>
            </div>

            <div className="t7-namebox" ref={boxRef}>
              <div
                className="t7-names"
                ref={namesRef}
                style={{
                  transform: `scale(${scale})`,
                  width: scale < 1 ? `${100 / scale}%` : '100%',
                }}
              >
                {players.map((p) => (
                  <div
                    key={p.id}
                    className={`t7-pill${newPlayerIds.has(p.id) ? ' t7-pill--new' : ''}`}
                  >
                    {p.nickname}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- QR popup ---------- */}
      {zoomed && (
        <div
          className="t7-modal"
          onClick={() => setZoomed(false)}
          role="presentation"
        >
          <div className="t7-modal-inner">
            <div className="t7-qrbig">
              <QRCodeSVG
                value={QR_TARGET_URL}
                size={560}
                bgColor="#ffffff"
                fgColor="#0a0a18"
                level="M"
                marginSize={0}
              />
            </div>
            <div className="t7-modal-url">{URL_BAR_TEXT}</div>
            <div className="t7-modal-cap">{URL_BAR_CAPTION}</div>
          </div>
        </div>
      )}
    </div>
  );
}
