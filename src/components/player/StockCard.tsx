// =====================================================
// FILE: src/components/player/StockCard.tsx
// PROJECT: pitch-game
// TASK: T1 — Player View + Realtime
// VERSION: T1-v1
// CREATED: 2026-05-06
// LAST MODIFIED: 2026-05-06
// PURPOSE: Stock info card แบบ compact — header only (T1 ยังไม่มี expandable body)
//          Decision M10/M10b: ตัดเหลือแค่ name/ticker/exchange/price/% YTD
//
// CHANGE LOG:
//   T1-v1 (2026-05-06): Initial — header-only layout จาก mockup-v5
// =====================================================
'use client';

import type { StockData } from '@/lib/types';

interface StockCardProps {
  stock: StockData;
}

/**
 * Stripped stock card ตาม mockup v5 State 4 layout
 * Detect up/down direction จาก leading sign ใน ytdChange
 */
export function StockCard({ stock }: StockCardProps) {
  const isDown = stock.ytdChange.trim().startsWith('-');
  const arrow = isDown ? '↘' : '↗';
  const cleanChange = stock.ytdChange.replace(/^[-+]/, '');

  return (
    <div
      style={{
        background: '#1c1c1e',
        borderRadius: 14,
        padding: 14,
        marginBottom: 14,
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 8,
        }}
      >
        {/* ซ้าย: name + ticker + exchange pill */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 11,
              color: '#A1A1AA',
              marginBottom: 4,
              fontWeight: 500,
            }}
          >
            {stock.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: '#8B5CF6',
                letterSpacing: '-0.3px',
              }}
            >
              {stock.ticker}
            </div>
            <span
              style={{
                fontSize: 9,
                padding: '2px 8px',
                borderRadius: 999,
                background: '#2a2a2c',
                color: '#A1A1AA',
                fontWeight: 600,
                letterSpacing: '0.3px',
              }}
            >
              {stock.exchange}
            </span>
          </div>
        </div>

        {/* ขวา: price + YTD change */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: '#FFFFFF',
              letterSpacing: '-0.5px',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {stock.price}
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: isDown ? '#FF5C8A' : '#5DF591',
              marginTop: 2,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            {arrow} {cleanChange} YTD
          </div>
        </div>
      </div>
    </div>
  );
}
