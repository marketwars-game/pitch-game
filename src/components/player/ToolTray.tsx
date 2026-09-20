// =====================================================
// FILE: src/components/player/ToolTray.tsx
// PROJECT: pitch-game
// TASK: T9 — LINE หาพี่ชัวร์ (DIME x AXA Data & AI Week 2026)
// VERSION: T9-v1
// CREATED: 2026-08-04
// LAST MODIFIED: 2026-09-20
// PURPOSE: กล่องเครื่องมือ 7 ชิ้น — แถบชิปเลื่อนแนวนอนเหนือช่องพิมพ์
//          ตำแหน่งเดียวกับแถบคำแนะนำของคีย์บอร์ด ไม่กินพื้นที่แชท
//
// พฤติกรรม (เคาะแล้ว Q1 = ก):
//   - ปกติ: กางอยู่ ผู้เล่นแตะชิปเพื่อดูนิยาม
//   - ตอนโฟกัสช่องพิมพ์ (คีย์บอร์ดเด้ง): หดหมด เหลือปุ่ม 🧰 ในแถวช่องพิมพ์
//   - ปุ่ม 🧰 มีจุดเขียวบอกว่ากล่องยังอยู่ กดแล้วกางกลับได้
//
// ตั้งใจไม่ทำ: ไม่ตรวจจับว่าผู้เล่นใช้เครื่องมือชิ้นไหนไปแล้ว
//   เพราะต้องเดาจากคำ ถ้าติ๊กผิดผู้เล่นจะเชื่อว่าใช้ครบทั้งที่ยังไม่ได้ใช้
//
// CHANGE LOG:
//   T9-v1 (2026-09-20): WHY 3 ชิป ขยายเต็มแถว (flex:1) แทนแถบเลื่อน 7 ชิป + ข้อความเวอร์ชัน T9
//   T7-v1 (2026-08-04): Initial
// =====================================================
'use client';

import { useState } from 'react';
import { TOOLBOX } from '@/lib/stock-data';
import { CHAT_BORDER, CHAT_SEND } from './KengChat';

// =====================================================
// ปุ่ม 🧰 (อยู่ในแถวช่องพิมพ์)
// =====================================================
export function ToolButton({
  active,
  showDot,
  onClick,
  disabled,
}: {
  active: boolean;
  showDot: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="WHY framework"
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: active ? '#E7F9EE' : '#fff',
        border: `1px solid ${active ? CHAT_SEND : CHAT_BORDER}`,
        fontSize: 16,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        cursor: disabled ? 'not-allowed' : 'pointer',
        padding: 0,
        boxSizing: 'border-box',
      }}
    >
      🧰
      {showDot && (
        <span
          style={{
            position: 'absolute',
            top: -2,
            right: -2,
            width: 9,
            height: 9,
            borderRadius: '50%',
            background: CHAT_SEND,
            border: '1.5px solid #F2F3F5',
          }}
        />
      )}
    </button>
  );
}

// =====================================================
// แถบชิป + นิยาม
// =====================================================
export function ToolChips() {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = TOOLBOX.find((t) => t.id === openId) ?? null;

  return (
    <div style={{ boxSizing: 'border-box' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 10.5,
          color: '#6b7078',
          fontWeight: 700,
          padding: '0 2px 5px',
        }}
      >
        🧰 WHY จาก session วันนี้ · แตะเพื่อดูนิยาม
      </div>

      <div
        style={{
          display: 'flex',
          gap: 5,
          overflowX: 'auto',
          paddingBottom: 6,
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
      >
        {TOOLBOX.map((t) => {
          const on = t.id === openId;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setOpenId(on ? null : t.id)}
              style={{
                flex: 1,
                minWidth: 0,
                fontSize: 11.5,
                padding: '6px 8px',
                borderRadius: 999,
                background: on ? '#E7F9EE' : '#fff',
                color: on ? '#046B3A' : '#3d434b',
                border: `1px solid ${on ? CHAT_SEND : '#d7dade'}`,
                whiteSpace: 'nowrap',
                fontWeight: on ? 800 : 600,
                fontFamily: 'inherit',
                cursor: 'pointer',
                boxSizing: 'border-box',
              }}
            >
              {t.name}
            </button>
          );
        })}
      </div>

      <div
        style={{
          fontSize: 11,
          color: '#3d434b',
          background: '#fff',
          border: '1px solid #e2e4e7',
          borderRadius: 9,
          padding: '8px 10px',
          marginBottom: 6,
          lineHeight: 1.5,
          boxSizing: 'border-box',
        }}
      >
        {open ? (
          <>
            <b style={{ color: '#046B3A' }}>{open.name}</b> — {open.short}
          </>
        ) : (
          'ตอบให้ครบทั้ง 3 ตัว — กรรมการดูว่าครบและข้อมูลถูกไหม'
        )}
      </div>
    </div>
  );
}
