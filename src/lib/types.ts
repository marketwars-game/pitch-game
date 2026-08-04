// =====================================================
// FILE: src/lib/types.ts
// PROJECT: pitch-game
// TASK: T7 — LINE หาพี่เก่ง (DIME x KTC)
// VERSION: T7-v2
// CREATED: 2026-05-05
// LAST MODIFIED: 2026-08-04
// PURPOSE: Database & domain types — share กันระหว่าง client + server
//
// CHANGE LOG:
//   T7-v2 (2026-08-04): คอมเมนต์ JudgeScore.reply — persona creative คือ "พี่เก่ง"
//                       (ไม่มีการเปลี่ยน type ใดๆ)
//   T7-v1 (2026-08-04): T7 — เปลี่ยนโจทย์จาก "หุ้น" เป็น "เคสพี่เก่ง"
//                       + CaseData (โจทย์รูปแบบใหม่ — เก็บใน games.stock jsonb เดิม)
//                       + ToolItem (เครื่องมือการเงิน 7 ชิ้นจากคลาส)
//                       + JudgeScore.reply (ข้อความพี่เก่งตอบกลับ — เฉพาะ creative)
//                       ~ GameRow.stock: StockData | null → CaseData | null
//                         (คอลัมน์เดิม ไม่มี migration — เปลี่ยนแค่รูปร่าง jsonb)
//                       ~ DEFAULT_GAME_CONFIG: writingTime 240→300, minLength 50→80
//                       ~ SubmissionScores.finalScore: 1 → 2 ทศนิยม (ใช้ตัดสินอันดับ)
//                       StockData คงไว้ ไม่ลบ (ตาม Shared-file Overwrite Protocol §8.5)
//   T6-v1 (2026-05-09): + SoloSubmissionRow row type (judging_status reuses
//                         existing JudgingStatus union; SoloJudgingStatus is
//                         a re-export alias for ergonomic imports)
//                       + solo_submissions in Database['public']['Tables']
//                       + LS_KEY_SOLO_NICKNAME constant
//                       Existing types unchanged (truly additive).
//   T2-v1 (2026-05-06): เพิ่ม fields สำหรับ T2:
//                       - round_number ใน GameRow, PlayerRow, SubmissionRow
//                       - judging_status, auto_defaulted ใน SubmissionRow
//                       - JudgingStatus type
//                       - PlayerStatus + PlayerStatusEnriched สำหรับ admin
//                       - Default config: AUTO_DEFAULT_SCORE constants
//                       - localStorage key สำหรับ admin auth
//   T1-v4 (2026-05-06): เปลี่ยน interface → type alias ทุกตัว
//   T1-v3 (2026-05-06): เพิ่ม __InternalSupabase field ใน Database
//   T1-v2 (2026-05-06): เพิ่ม Views/Functions/Enums/CompositeTypes
//   T1-v1 (2026-05-06): เพิ่ม pitchMinLength + pitchMaxLength ใน GameConfig
//   T0-v1 (2026-05-05): Initial — types สำหรับ games, players, submissions
// =====================================================

// =====================================================
// Game Phase
// =====================================================
export type GamePhase = 'LOBBY' | 'WRITING' | 'JUDGING' | 'RESULTS';

// =====================================================
// Stock Data — โจทย์หุ้น
// =====================================================
export type StockData = {
  name: string;           // "NVIDIA Corporation"
  ticker: string;         // "NVDA"
  exchange: string;       // "NASDAQ"
  price: string;          // "$131.29"
  ytdChange: string;      // "-2.3%"
  description: string;    // คำอธิบายบริษัท 1-2 ประโยค
  marketCap: string;      // "$3.21T"
  peRatio: string;        // "39.3x"
  revenueGrowth: string;  // "+114%"
  news: string[];         // ข่าวล่าสุด 1-2 bullets
};

// =====================================================
// Case Data (T7) — โจทย์รูปแบบใหม่ "พี่เก่ง"
// =====================================================
// เก็บในคอลัมน์ games.stock (jsonb) เดิม — ไม่มี migration
export type CaseData = {
  id: string;         // 'keng'
  name: string;       // 'พี่เก่ง'
  age: number;        // 42
  headline: string;   // ประโยคติดปาก (โชว์บนจอใหญ่)
  facts: string[];    // ข้อมูลประกอบ (โชว์บนจอใหญ่)
  chat: string[];     // บับเบิลแชทของพี่เก่ง (หน้าเขียนบนมือถือ)
  rules: string[];    // กติกาการตอบ
};

// เครื่องมือการเงินจากคลาส — ใช้ร่วมกันระหว่าง UI กับ judge prompt
export type ToolItem = {
  id: string;
  name: string;      // ชื่อบนชิป
  short: string;     // นิยามสั้นที่ผู้เล่นเห็น
  judgeDef: string;  // นิยามที่ฝังใน system prompt ของ The Professor
};

// =====================================================
// Game Config
// =====================================================
export type GameConfig = {
  writingTimeSeconds: number;  // T7: 300 = 5 นาที
  pitchMinLength: number;      // ขั้นต่ำ — ปุ่ม submit disabled ถ้าน้อยกว่านี้
  pitchMaxLength: number;      // สูงสุด — hard block keystroke ที่ความยาวนี้
  primaryColor?: string;
  logoUrl?: string | null;
};

// =====================================================
// AI Judge Score
// =====================================================
export type JudgeScore = {
  score: number;     // 0.0-10.0 ทศนิยม 1 ตำแหน่ง (0 = auto-default)
                     // T7: AI ให้ 0-100 แล้ว /api/judge หารสิบก่อนเก็บ
  comment: string;   // 1-2 ประโยค ภาษาไทย
  reply?: string;    // T7 — ข้อความพี่เก่งตอบกลับ (เฉพาะ persona creative = พี่เก่ง)
};

export type SubmissionScores = {
  analyst?: JudgeScore;
  creative?: JudgeScore;
  communicator?: JudgeScore;
  finalScore?: number;  // T7: ค่าเฉลี่ย ทศนิยม 2 ตำแหน่ง (แสดง 1 ตำแหน่งบนมือถือ / 2 บน podium)
  rank?: number;
};

// =====================================================
// Judging Status (T2)
// =====================================================
// streaming judging lifecycle:
//   pending     → submission created, ยังไม่ trigger judge
//   in_progress → API กำลังยิง 3 personas
//   done        → ได้ scores ครบ
//   failed      → ลอง retry แล้ว fail (admin manual re-judge ได้)
export type JudgingStatus = 'pending' | 'in_progress' | 'done' | 'failed';

// T6 — alias for solo flow (same set of states, semantic name).
// Imports `SoloJudgingStatus` work; existing `JudgingStatus` consumers untouched.
export type SoloJudgingStatus = JudgingStatus;

// =====================================================
// Database Rows (T2)
// =====================================================
export type GameRow = {
  id: string;
  phase: GamePhase;
  stock: CaseData | null;        // T7 — คอลัมน์เดิม รูปร่างใหม่
  config: GameConfig | null;
  writing_started_at: string | null;
  writing_ends_at: string | null;
  created_at: string;
  round_number: number;       // T2 — multi-round support
};

export type PlayerRow = {
  id: string;
  game_id: string;
  nickname: string;
  joined_at: string;
  round_number: number;       // T2
};

export type SubmissionRow = {
  id: string;
  game_id: string;
  player_id: string;
  pitch: string;
  submitted_at: string;
  auto_submitted: boolean;
  scores: SubmissionScores | null;
  round_number: number;       // T2
  judging_status: JudgingStatus;  // T2 — streaming judging
  auto_defaulted: boolean;        // T2 — admin-only flag
};

// =====================================================
// T6 — Solo Submission Row (NEW)
// =====================================================
// Independent of games/players — no FK. Used by /try and /board.
export type SoloSubmissionRow = {
  id: string;
  nickname: string;
  pitch: string;
  stock_ticker: string;
  scores: SubmissionScores | null;
  judging_status: JudgingStatus;
  auto_submitted: boolean;
  created_at: string;
};

// =====================================================
// Player Status Enriched (T2 — UI domain)
// =====================================================
// สำหรับ Admin Panel — แต่ละ player มี status ต่างกันตาม submission state
export type PlayerStatus =
  | 'writing'    // joined แต่ยังไม่ submit
  | 'submitted'  // submission row created, judging_status = pending
  | 'scoring'    // judging_status = in_progress
  | 'scored'     // judging_status = done
  | 'failed';    // judging_status = failed

export type PlayerStatusEnriched = {
  player: PlayerRow;
  submission: SubmissionRow | null;
  status: PlayerStatus;
};

export type PlayerCounts = {
  total: number;
  joined: number;     // total - submitted (ยังไม่ submit)
  submitted: number;  // submission row exists
  scoring: number;    // in_progress
  scored: number;     // done
  failed: number;     // failed
};

// =====================================================
// Constants
// =====================================================
// Game ID ที่ seed ไว้ใน migration.sql — ใช้เป็น default game
export const DEFAULT_GAME_ID = '00000000-0000-0000-0000-000000000001';

// localStorage keys (player session)
export const LS_KEY_PLAYER_ID = 'pitchgame:player_id';
export const LS_KEY_PLAYER_NICKNAME = 'pitchgame:nickname';
export const LS_KEY_GAME_ID = 'pitchgame:game_id';

// localStorage key (admin session — T2)
export const LS_KEY_ADMIN_OK = 'pitchgame:admin_ok';

// localStorage key (solo session — T6)
export const LS_KEY_SOLO_NICKNAME = 'pitchgame:solo:nickname';

// Nickname constraints (UI-level)
export const NICKNAME_MAX_LENGTH = 20;

// Default config fallback (ใช้ตอน game.config เป็น null ใน DB)
export const DEFAULT_GAME_CONFIG: GameConfig = {
  writingTimeSeconds: 300,  // T7: 5 นาที (เดิม 240)
  pitchMinLength: 80,       // T7: กันข้อความสั้นจนกรรมการให้คะแนนไม่ได้ (เดิม 50)
  pitchMaxLength: 1500,
};

// Auto-default constants (T2)
// เมื่อ admin กด "ดำเนินต่อ" ใน Confirm Reveal Modal สำหรับ failed players
export const AUTO_DEFAULT_SCORE: SubmissionScores = {
  analyst: { score: 0, comment: 'AI ตัดสินไม่สำเร็จ — ใส่ default' },
  creative: { score: 0, comment: 'AI ตัดสินไม่สำเร็จ — ใส่ default' },
  communicator: { score: 0, comment: 'AI ตัดสินไม่สำเร็จ — ใส่ default' },
  finalScore: 0,
};

// =====================================================
// Supabase Database Type (สำหรับ typed client)
// =====================================================
export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '12';
  };
  public: {
    Tables: {
      games: {
        Row: GameRow;
        Insert: Partial<GameRow> & { id?: string };
        Update: Partial<GameRow>;
        Relationships: [];
      };
      players: {
        Row: PlayerRow;
        Insert: Omit<PlayerRow, 'id' | 'joined_at' | 'round_number'> & {
          id?: string;
          joined_at?: string;
          round_number?: number;
        };
        Update: Partial<PlayerRow>;
        Relationships: [
          {
            foreignKeyName: 'players_game_id_fkey';
            columns: ['game_id'];
            isOneToOne: false;
            referencedRelation: 'games';
            referencedColumns: ['id'];
          }
        ];
      };
      submissions: {
        Row: SubmissionRow;
        Insert: Omit<
          SubmissionRow,
          | 'id'
          | 'submitted_at'
          | 'auto_submitted'
          | 'scores'
          | 'round_number'
          | 'judging_status'
          | 'auto_defaulted'
        > & {
          id?: string;
          submitted_at?: string;
          auto_submitted?: boolean;
          scores?: SubmissionScores | null;
          round_number?: number;
          judging_status?: JudgingStatus;
          auto_defaulted?: boolean;
        };
        Update: Partial<SubmissionRow>;
        Relationships: [
          {
            foreignKeyName: 'submissions_game_id_fkey';
            columns: ['game_id'];
            isOneToOne: false;
            referencedRelation: 'games';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'submissions_player_id_fkey';
            columns: ['player_id'];
            isOneToOne: false;
            referencedRelation: 'players';
            referencedColumns: ['id'];
          }
        ];
      };
      // T6 — solo_submissions (NEW, no FK, fully isolated)
      solo_submissions: {
        Row: SoloSubmissionRow;
        Insert: Omit<
          SoloSubmissionRow,
          'id' | 'created_at' | 'auto_submitted' | 'scores' | 'judging_status' | 'stock_ticker'
        > & {
          id?: string;
          created_at?: string;
          auto_submitted?: boolean;
          scores?: SubmissionScores | null;
          judging_status?: JudgingStatus;
          stock_ticker?: string;
        };
        Update: Partial<SoloSubmissionRow>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
