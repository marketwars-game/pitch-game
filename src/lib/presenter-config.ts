// =====================================================
// FILE: src/lib/presenter-config.ts
// PROJECT: pitch-game
// TASK: T4 — Presenter View
// VERSION: T4-v1
// CREATED: 2026-05-07
// LAST MODIFIED: 2026-05-07
// PURPOSE: Static config สำหรับ Presenter View เท่านั้น —
//          - URL bar text (LOBBY)
//          - Judge persona rotating messages (JUDGING)
//          - Animation tunables (particle counts, durations)
//          - Pill grid limits
//
// CHANGE LOG:
//   T4-v1 (2026-05-07): Initial — extracted from mockup v4
// =====================================================

// =====================================================
// LOBBY — URL Bar
// =====================================================
// Short URL ที่แสดงใต้ QR (จริง redirect ไป Vercel URL)
export const URL_BAR_TEXT = 'bit.ly/stockpitchbattle';

// Caption ใต้ URL bar (Thai)
export const URL_BAR_CAPTION = 'สแกน QR ด้วยมือถือ — ใส่ชื่อเล่น — เริ่มเลย';

// QR target URL (ของจริงที่ bit.ly redirect ไป) — ใช้ generate QR
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
  'กำลังตรวจตัวเลขในงบ',
  'อ่าน thesis ลงทุน',
  'หาเหตุผลรองรับ',
  'เช็คว่ามีข้อมูลพอมั้ย',
  'compare กับ peer',
];

export const CREATIVE_MESSAGES: readonly string[] = [
  'กำลังหาคำเปรียบเทียบเด็ดๆ',
  'ลองอ่านเสียงในหัวดู',
  'มี story arc มั้ยนะ',
  'นึกถึงตอนเด็กๆ ฟังพ่อแม่เล่า',
  'ตรวจดู hook เปิดเรื่อง',
];

export const COMMUNICATOR_MESSAGES: readonly string[] = [
  'ตรวจว่าบอกความเสี่ยงครบมั้ย',
  'ใช้ศัพท์การเงินเยอะไปมั้ย',
  'เด็ก 10 ขวบเข้าใจมั้ย',
  'Disclaimer ตรงไหน',
  'น้ำหนัก upside vs downside',
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
