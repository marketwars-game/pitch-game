// =====================================================
// FILE: src/lib/stock-data.ts — Hardcoded Stock Challenges
// PROJECT: pitch-game
// TASK: T5 — End-to-End Test + Polish
// VERSION: T5-v1
// CREATED: 2026-05-05
// LAST MODIFIED: 2026-05-07
// PURPOSE: Stock presets ที่ใช้ใน admin StockPicker + game challenge
//
// CHANGE LOG:
//   T5-v1 (2026-05-07): เปลี่ยน DEFAULT_STOCK เป็น PLTR (Palantir) สำหรับงาน MONEY EXPO 2026
//                        - PLTR preset ใหม่ (data จาก Q1 2026 earnings + Burry short news)
//                        - DEFAULT_STOCK = PLTR (เปลี่ยนจาก NVDA)
//                        - เก็บ NVDA preset ไว้เป็น backup
//                        เหตุผล: PLTR polarizing — มีทั้ง bull (โต 85%, Rule of 40 = 145%)
//                                และ bear (Burry short, P/E 233x) → pitch หลากหลาย AI judge สนุก
//   T0-v1 (2026-05-05): Initial — NVDA placeholder; หุ้นจริงจะเลือกใน T5
// =====================================================

import type { StockData } from './types';

// =====================================================
// Stock Presets — เตรียมไว้หลายตัว เลือกตอนเล่นจริง
// =====================================================
export const STOCK_PRESETS: Record<string, StockData> = {
  // ============================================================
  // PLTR — Palantir Technologies (LOCKED for MONEY EXPO 2026)
  // ============================================================
  // Why PLTR:
  // - Polarizing: bull case ชัด (โต 85% Q1, Rule of 40 = 145%, FY guidance +71%)
  //   bear case ชัด (Burry short, fair value $46, P/E 233x, Anthropic threat)
  // - Dime ลูกค้า trade เยอะ (ใน top volume)
  // - คน Thai รู้จัก The Big Short → relatable
  // - Recent + verifiable (Q1 2026 earnings 4 พ.ค.)
  PLTR: {
    name: 'Palantir Technologies',
    ticker: 'PLTR',
    exchange: 'NASDAQ',
    price: '$135.91',
    ytdChange: '-18%',
    description: 'ผู้พัฒนาแพลตฟอร์ม AI & Data Analytics ใช้โดยกองทัพสหรัฐฯ + องค์กรขนาดใหญ่ (Foundry, Gotham, AIP)',
    marketCap: '$325B',
    peRatio: '233x',
    revenueGrowth: '+85%',
    news: [
      'Q1 2026 รายได้โต 85% YoY ($1.63B) — เร็วที่สุดในประวัติศาสตร์บริษัท + ปรับ guidance ทั้งปีขึ้นเป็น +71%',
      'Michael Burry (จาก The Big Short) short PLTR ต่อเนื่อง — บอก fair value แค่ $46 เพราะ valuation สูงเกินไป (P/E 233x)',
    ],
  },

  // ============================================================
  // NVDA — backup (kept for flexibility)
  // ============================================================
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
};

// =====================================================
// DEFAULT — ใช้ตอน admin reset / new game
// T5: เปลี่ยนจาก NVDA → PLTR สำหรับ MONEY EXPO 2026
// =====================================================
export const DEFAULT_STOCK: StockData = STOCK_PRESETS.PLTR;
