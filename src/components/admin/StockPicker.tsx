// =====================================================
// FILE: src/components/admin/StockPicker.tsx
// PROJECT: pitch-game
// TASK: T2 — Admin Panel + Phase Control
// VERSION: T2-v1
// CREATED: 2026-05-06
// LAST MODIFIED: 2026-05-06
// PURPOSE: Stock dropdown + Apply button — used in LOBBY phase only
//          Pulls from STOCK_PRESETS (T2: NVDA only, more added in T5)
//          Shows current stock preview
//
// CHANGE LOG:
//   T2-v1 (2026-05-06): Initial
// =====================================================
'use client';

import { useState } from 'react';
import { STOCK_PRESETS } from '@/lib/stock-data';
import type { StockData } from '@/lib/types';

export interface StockPickerProps {
  currentStock: StockData | null;
  onApply: (stock: StockData) => void | Promise<void>;
  disabled?: boolean;
}

export function StockPicker({
  currentStock,
  onApply,
  disabled,
}: StockPickerProps) {
  const tickers = Object.keys(STOCK_PRESETS);
  const [selected, setSelected] = useState<string>(
    currentStock?.ticker ?? tickers[0] ?? ''
  );

  const handleApply = () => {
    const stock = STOCK_PRESETS[selected];
    if (!stock) return;
    onApply(stock);
  };

  return (
    <>
      <label style={labelStyle}>Stock Challenge</label>
      <div
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'stretch',
          marginBottom: 12,
        }}
      >
        <div style={{ flex: 1, position: 'relative' }}>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            disabled={disabled}
            style={{
              width: '100%',
              padding: '12px 36px 12px 14px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.08)',
              background: '#1c1c1e',
              color: '#fff',
              fontSize: 14,
              outline: 'none',
              fontFamily: 'inherit',
              appearance: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
          >
            {tickers.map((t) => {
              const s = STOCK_PRESETS[t];
              return (
                <option key={t} value={t}>
                  {t} — {s.name}
                </option>
              );
            })}
          </select>
          <div
            aria-hidden
            style={{
              position: 'absolute',
              right: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: '#71717A',
              fontSize: 12,
            }}
          >
            ▾
          </div>
        </div>
        <button
          type="button"
          onClick={handleApply}
          disabled={disabled || !selected}
          style={{
            padding: '12px 16px',
            borderRadius: 10,
            background: '#1c1c1e',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.16)',
            fontSize: 14,
            fontWeight: 700,
            cursor: disabled || !selected ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Apply
        </button>
      </div>

      {/* Preview */}
      {currentStock ? (
        <div
          style={{
            background: '#1c1c1e',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
            padding: '12px 14px',
            marginBottom: 14,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 11,
                  color: '#A1A1AA',
                  marginBottom: 4,
                  fontWeight: 500,
                }}
              >
                {currentStock.name}
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: '#8B5CF6',
                  letterSpacing: -0.3,
                }}
              >
                {currentStock.ticker} · {currentStock.exchange}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: '#fff',
                  letterSpacing: -0.3,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {currentStock.price}
              </div>
              <div
                style={{
                  color: currentStock.ytdChange.startsWith('-')
                    ? '#FF5C8A'
                    : '#5DF591',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {currentStock.ytdChange} YTD
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            background: 'rgba(255,217,61,0.08)',
            borderLeft: '3px solid #FFD93D',
            padding: '10px 12px',
            borderRadius: 6,
            marginBottom: 14,
            fontSize: 12,
            color: '#FFD93D',
            fontWeight: 600,
            lineHeight: 1.5,
          }}
        >
          ⚠️ ยังไม่ได้เลือก stock — กด Apply ก่อนเริ่มเกม
        </div>
      )}
    </>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#A1A1AA',
  marginBottom: 6,
  fontWeight: 500,
  display: 'block',
};
