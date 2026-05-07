// =====================================================
// FILE: src/lib/stock-data.ts — Hardcoded Stock Challenges
// PROJECT: pitch-game
// TASK: T5 — Stock Data Refresh (PLTR real-time accuracy)
// VERSION: T5-v2
// CREATED: 2026-05-05
// LAST MODIFIED: 2026-05-07
// PURPOSE: Stock presets ที่ใช้ใน admin StockPicker + game challenge
//
// CHANGE LOG:
//   T5-v2 (2026-05-07): Refresh PLTR data ตาม real-time (May 6-7, 2026)
//                        - ytdChange: "-18%" → "-23%" (จริงคือ -23.5%)
//                        - peRatio: "233x" → "200x" (mid-range; จริง 192-217x แล้วแต่ source)
//                        - news[] update: เพิ่ม analyst upgrades + Citi PT cut
//                        Reason: ข้อมูลเดิม out-of-date ทำให้ judge comment อ้าง P/E 233x
//                                ที่ผิดจากจริง + missing balanced analyst views
//   T5-v1 (2026-05-07): เปลี่ยน DEFAULT_STOCK เป็น PLTR (Palantir) สำหรับงาน MONEY EXPO 2026
//                        - PLTR preset ใหม่
//                        - DEFAULT_STOCK = PLTR (เปลี่ยนจาก NVDA)
//                        - เก็บ NVDA preset ไว้เป็น backup
//   T0-v1 (2026-05-05): Initial — NVDA placeholder
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
  // - Polarizing: bull case ชัด (โต 85% Q1, FY guidance +71%, analyst upgrades)
  //   bear case ชัด (ราคาตก -23% YTD, P/E สูง, Citi ลด PT)
  // - Dime ลูกค้า trade เยอะ
  // - คน Thai รู้จัก The Big Short → relatable
  // - Recent + verifiable (Q1 2026 earnings 4 พ.ค.)
  //
  // Data sources (May 6-7, 2026):
  // - Price: Yahoo Finance ($133-135)
  // - YTD: 24/7 Wall St (-23.5%), Yahoo, FinanceCharts
  // - P/E: Investing.com (200.5x), MacroTrends (217x), Public.com (152x)
  //   → ใช้ค่า 200x เป็น mid-range neutral
  // - Q1 rev growth: TipRanks, Yahoo (+85% YoY confirmed)
  // - Analyst PT: Citi $210 (cut from $260), Argus Buy $190
  PLTR: {
    name: 'Palantir Technologies',
    ticker: 'PLTR',
    exchange: 'NASDAQ',
    price: '$135.91',
    ytdChange: '-23%',
    description: 'ผู้พัฒนาแพลตฟอร์ม AI & Data Analytics ใช้โดยกองทัพสหรัฐฯ + องค์กรขนาดใหญ่ (Foundry, Gotham, AIP)',
    marketCap: '$325B',
    peRatio: '200x',
    revenueGrowth: '+85%',
    news: [
      'Q1 2026 รายได้โต 85% YoY ($1.63B) — เร็วที่สุดในประวัติศาสตร์บริษัท + ปรับ guidance ทั้งปีขึ้นเป็น +71%',
      'นักวิเคราะห์ Argus upgrade เป็น Buy (เป้าหมาย $190) หลัง Q1 ดีเกินคาด',
      'แม้ผลประกอบการดี แต่ราคาหุ้นตก -23% ตั้งแต่ต้นปี — Citi ลดเป้าหมายราคาจาก $260 เหลือ $210 เพราะ valuation ยังสูงเทียบกับกำไร',
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
