// =====================================================
// FILE: src/lib/presenter-config.ts
// PROJECT: pitch-game
// TASK: T9 — LINE หาพี่ชัวร์ (DIME x AXA Data & AI Week 2026)
// VERSION: T9-v1
// CREATED: 2026-05-07
// LAST MODIFIED: 2026-09-20
// PURPOSE: Static config สำหรับ Presenter View เท่านั้น —
//          - URL bar text (LOBBY)
//          - Judge persona rotating messages (JUDGING)
//          - Animation tunables (particle counts, durations)
//          - Pill grid limits
//
// CHANGE LOG:
//   T9-v1 (2026-09-20): brand AXA + ข้อความกรรมการ/ข้อความลอยเวอร์ชันพี่ชัวร์
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
  'W H Y ครบไหมนะ…',
  'อันนี้ H มีตัวเลขจริงด้วย',
  'ความเสี่ยงบอกแค่ลอยๆ หรือเจาะจง',
  'ข้อมูลนี้ยังใหม่อยู่ไหม ขอเช็กก่อน',
  'การันตีแบบนี้ไม่ได้นะ',
];

export const CREATIVE_MESSAGES: readonly string[] = [
  'อ่านแล้วพี่เข้าใจขึ้นไหมนะ…',
  'อันนี้รู้ด้วยว่าพี่ถือแต่ฝากประจำ',
  'ตกลงมันเสี่ยงตรงไหนอะ ยังไม่บอกเลย',
  'เออ… บอกตรงๆ แบบนี้พี่ค่อยเชื่อหน่อย',
  'พี่ไม่ชอบให้ใครมาเชียร์นะ',
];

export const COMMUNICATOR_MESSAGES: readonly string[] = [
  'อันนี้เหมือนน้องพิมพ์หาพี่จริง',
  'อันนี้อ่านเหมือนบทวิเคราะห์หุ้นเลย',
  'ยาวไปนิดนึง อ่านไม่จบแน่',
  'เปิดด้วยการรับคำถามพี่ก่อน ดีมาก',
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
// T9 — Brand lock-up (ตัวอักษรล้วน ไม่ใช้โลโก้ AXA)
// =====================================================
export const BRAND_LEFT = 'DIME';
export const BRAND_RIGHT = 'AXA';
export const SESSION_NAME = 'DATA & AI WEEK 2026';

// =====================================================
// T7 — ข้อความลอยพื้นหลังตอน JUDGING
// ตัดจากแนวคำตอบจริงของผู้เล่น (ไม่มีชื่อ) ให้จอมีชีวิตระหว่างรอ
// =====================================================
export const JUDGING_STREAM_SNIPPETS: readonly string[] = [
  'พี่ชัวร์ SpaceX คือบริษัทจรวดที่…',
  'Starlink คือเน็ตผ่านดาวเทียมนะพี่',
  'แต่บอกตรงๆ นะ บริษัทยังขาดทุนอยู่',
  'ไม่เหมือนฝากประจำของพี่นะ เงินต้นหายได้จริง',
  'ราคาเหวี่ยงแรงมากตั้งแต่เข้าตลาด',
  'รู้ไว้ให้เข้าใจก่อนก็พอพี่ ไม่ต้องรีบ',
  'ประกันของพี่ก็ยังดีอยู่ อันนี้ของคนละแบบ',
  'อยากรู้ตรงไหนเพิ่มถามได้เลยพี่',
];
