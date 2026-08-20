// =====================================================
// FILE: src/lib/presenter-config.ts
// PROJECT: pitch-game
// TASK: T8 — LINE หาพี่มั่น (DIME x SCG)
// VERSION: T8-v1
// CREATED: 2026-05-07
// LAST MODIFIED: 2026-08-20
// PURPOSE: Static config สำหรับ Presenter View เท่านั้น —
//          - URL bar text (LOBBY)
//          - Judge persona rotating messages (JUDGING)
//          - Animation tunables (particle counts, durations)
//          - Pill grid limits
//
// CHANGE LOG:
//   T8-v1 (2026-08-20): แบรนด์ SCG + SESSION_NAME + ข้อความกรรมการ 3 ชุด + stream snippets เวอร์ชันพี่มั่น
//   T7-v2 (2026-08-04): QR encode URL ตรง (ไม่ผ่าน bit.ly) เพื่อลดขั้นตอน
//                       redirect ตอนสแกน — ข้อความใต้ QR ยังโชว์ bit.ly ให้คนพิมพ์ตามได้
//   T7-v1 (2026-08-04): เปลี่ยนเนื้อหาให้เป็นงาน KTC
//                       - QR ชี้ bit.ly/linepitch (ต้องสร้างลิงก์จริงก่อนงาน)
//                       - ข้อความกรรมการ 3 ชุดใหม่ตามคาแรกเตอร์ T7
//                       - เพิ่ม JUDGING_STREAM_SNIPPETS (ข้อความลอยพื้นหลัง)
//                       - เพิ่ม BRAND_* สำหรับ lock-up DIME × KTC
//   T4-v1 (2026-05-07): Initial — extracted from mockup v4
// =====================================================

// =====================================================
// LOBBY — URL Bar
// =====================================================
// Short URL ที่แสดงใต้ QR (จริง redirect ไป Vercel URL)
export const URL_BAR_TEXT = 'bit.ly/linepitch';

// Caption ใต้ URL bar (Thai)
export const URL_BAR_CAPTION = 'สแกน QR ด้วยมือถือ — ใส่ชื่อเล่น — รอสัญญาณ';

// QR target URL (ของจริงที่ bit.ly redirect ไป) — ใช้ generate QR
// T7-v2: QR encode URL ตรง — สแกนแล้วเข้าเกมทันที ไม่ต้องรอ redirect ของ bit.ly
// (bit.ly/linepitch มีไว้ให้คนที่พิมพ์เอง หรือให้ MC บอกปากเปล่า)
export const QR_TARGET_URL = 'https://pitch-game-two.vercel.app/play';

// =====================================================
// PILL GRID (LOBBY)
// =====================================================
// จำนวน pills สูงสุดที่แสดง — เกินกว่านี้ตัด overflow + แสดง badge "+N more"
export const PILL_GRID_MAX = 80;

// ระยะเวลาที่ player ใหม่ ได้ glow effect ทอง (ms)
export const PILL_NEW_GLOW_MS = 2000;

// =====================================================
// WRITING — Countdown warn threshold
// =====================================================
// เมื่อ remaining ≤ ค่านี้ countdown จะเปลี่ยนเป็น warn (red + heartbeat)
export const COUNTDOWN_WARN_SECONDS = 30;

// =====================================================
// JUDGING — Rotating persona messages
// =====================================================
// แสดงทีละข้อความ เปลี่ยนทุก JUDGE_MSG_INTERVAL_MS
// ไม่ผูกกับ judging_status จริง — เป็นแค่ visual flair บน Presenter

export const JUDGE_MSG_INTERVAL_MS = 2400;

export const ANALYST_MESSAGES: readonly string[] = [
  'ใช้หลักถูกข้อ… แต่ถูกจังหวะไหม',
  'อันนี้แปะชื่อหลักเฉยๆ หรือใช้จริง',
  'ใครเห็นความเจ็บ 2 รอบของแกบ้าง',
  'หยิบมา 3 ข้อ แถมร้อยกันได้ด้วย',
  'สั่งมาแบบนี้ไม่ได้นะ',
];

export const CREATIVE_MESSAGES: readonly string[] = [
  'อ่านแล้วพี่อยากลองจริงไหมนะ…',
  'อันนี้พูดเหมือนเห็นค่าพี่จริงๆ',
  'ยังไม่ได้ตอบเรื่องงานล้นของพี่เลยนี่',
  'เออ… ถ้าแค่ชิ้นเดียวพี่ก็พอไหว',
  'พี่ไม่ชอบให้ใครมาสั่งนะ',
];

export const COMMUNICATOR_MESSAGES: readonly string[] = [
  'อันนี้เหมือนหัวหน้าพิมพ์จริง',
  'อันนี้อ่านเหมือนประกาศบริษัทเลย',
  'ยาวไปนิดนึง อ่านไม่จบแน่',
  'เปิดด้วยการรับความรู้สึกก่อน ดีมาก',
  'เขียนเป็นข้อๆ ในไลน์เหรอ…',
];

// =====================================================
// AMBIENT BACKGROUND — particle counts (70% intensity)
// =====================================================
export const BG_PARTICLE_COUNT = 12;     // in-game phases
export const LANDING_PARTICLE_COUNT = 18; // LANDING (full intensity)

// =====================================================
// LANDING — color cycle for particles
// =====================================================
export const LANDING_PARTICLE_COLORS = ['#5DEFA3', '#00d4ff', '#f5c518'] as const;

// =====================================================
// RESULTS — leaderboard cutoffs
// =====================================================
export const PODIUM_TOP_N = 3;     // Top 3 ในส่วน podium
export const RUNNERS_TOP_N = 7;    // 4-10 ในส่วน runners (max 7 cards)

// =====================================================
// LANDING transition
// =====================================================
// keys ที่ trigger LANDING → real phase
export const LANDING_DISMISS_KEYS = ['Space', 'Enter'] as const;

// =====================================================
// T8 — Brand lock-up (ตัวอักษรล้วน ไม่ใช้โลโก้ SCG)
// =====================================================
export const BRAND_LEFT = 'DIME';
export const BRAND_RIGHT = 'SCG';
export const SESSION_NAME = 'DRIVING EXECUTION & CHANGE MANAGEMENT';

// =====================================================
// T7 — ข้อความลอยพื้นหลังตอน JUDGING
// ตัดจากแนวคำตอบจริงของผู้เล่น (ไม่มีชื่อ) ให้จอมีชีวิตระหว่างรอ
// =====================================================
export const JUDGING_STREAM_SNIPPETS: readonly string[] = [
  'พี่มั่นครับ ผมรู้ว่าพี่เจ็บมาจริง…',
  'ลองแค่งานเดียว 15 นาทีก่อนไหมพี่',
  'ผมจัดคนนั่งประกบให้เลย',
  'ประสบการณ์ 28 ปีของพี่นี่แหละที่ทีมต้องการ',
  'ผมเองก็กำลังหัดอยู่เหมือนกันครับ',
  'ไม่ต้องทิ้งของเดิมนะพี่',
  'พรุ่งนี้บ่ายผมนั่งลองกับพี่เอง',
  'ถ้าพี่ลองแล้วไม่เวิร์ค เลิกได้เลย',
];
