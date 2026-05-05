// FILE: src/lib/stock-data.ts — Hardcoded Stock Challenges
// VERSION: T0-v1 — Placeholder NVDA stock for T0/T1 testing
// LAST MODIFIED: 2026-05-05
// HISTORY:
//   T0-v1: Initial — NVDA placeholder; หุ้นจริงจะเลือกใน T5

import type { StockData } from './types';

// =====================================================
// Stock Presets — เตรียมไว้หลายตัว เลือกตอนเล่นจริง
// =====================================================
export const STOCK_PRESETS: Record<string, StockData> = {
  NVDA: {
    name: 'NVIDIA Corporation',
    ticker: 'NVDA',
    exchange: 'NASDAQ',
    price: '$131.29',
    ytdChange: '-2.3%',
    description: 'ผู้นำด้านชิปประมวลผล GPU สำหรับ AI, gaming, data center',
    marketCap: '$3.21T',
    peRatio: '39.3x',
    revenueGrowth: '+114%',
    news: [
      'เปิดตัว Blackwell Ultra สำหรับ AI Training',
    ],
  },
  // เพิ่มหุ้นอื่นๆ ภายหลัง (AAPL, TSLA, AMZN, MSFT)
};

export const DEFAULT_STOCK: StockData = STOCK_PRESETS.NVDA;
