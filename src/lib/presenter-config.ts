// =====================================================
// FILE: src/lib/presenter-config.ts
// PROJECT: pitch-game
// TASK: T7 — LINE หาพี่เก่ง (DIME x KTC)
// VERSION: T7-v2
// CREATED: 2026-05-07
// LAST MODIFIED: 2026-05-07
// PURPOSE: Static config สำหรับ Presenter View เท่านั้น —
//          - URL bar text (LOBBY)
//          - Judge persona rotating messages (JUDGING)
//          - Animation tunables (particle counts, durations)
//          - Pill grid limits
//
// CHANGE LOG:
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
  'ใช้เครื่องมือถูกชิ้น… แต่ถูกจังหวะไหม',
  'อันนี้แปะชื่อเครื่องมือเฉยๆ หรือใช้จริง',
  'เงินสำรอง 6 เดือนหายไปไหน',
  'หยิบมา 3 ชิ้น แถมร้อยกันได้ด้วย',
  'สั่งลงทั้งก้อนแบบนี้ไม่ได้นะ',
];

export const CREATIVE_MESSAGES: readonly string[] = [
  'อ่านแล้วพี่กล้าขึ้นจริงไหมนะ…',
  'อันนี้พูดเหมือนเข้าใจพี่จริงๆ',
  'ยังไม่ได้ตอบที่พี่กลัวเลยนี่',
  'เออ… เดี๋ยวพี่ลองดูก็ได้',
  'พี่ไม่ชอบให้ใครมาเร่งนะ',
];

export const COMMUNICATOR_MESSAGES: readonly string[] = [
  'อันนี้เหมือนคนพิมพ์จริง',
  'อันนี้อ่านเหมือนโบรชัวร์เลย',
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
// T7 — Brand lock-up (ตัวอักษรล้วน ไม่ใช้โลโก้ KTC)
// =====================================================
export const BRAND_LEFT = 'DIME';
export const BRAND_RIGHT = 'KTC';
export const SESSION_NAME = 'INVESTMENT MADE SIMPLE';

// =====================================================
// T7 — ข้อความลอยพื้นหลังตอน JUDGING
// ตัดจากแนวคำตอบจริงของผู้เล่น (ไม่มีชื่อ) ให้จอมีชีวิตระหว่างรอ
// =====================================================
export const JUDGING_STREAM_SNIPPETS: readonly string[] = [
  'พี่เก่งครับ ผมเข้าใจที่พี่กลัวเลย…',
  'ลองเริ่มเดือนละ 500 ก่อนไหมพี่',
  'ไม่ต้องรู้เยอะก็เริ่มได้นะ',
  'กันเงินสำรองไว้ก่อน เหลือค่อยลง',
  'พี่ไม่ต้องเอาสองแสนไปเสี่ยงหมด',
  'ลดหย่อนภาษีได้ด้วยนะพี่',
  'เริ่มจาก 50 บาทก็ได้ครับ',
  'พี่เคยบอกว่าอยากเกษียณสบายใช่ไหม',
];
