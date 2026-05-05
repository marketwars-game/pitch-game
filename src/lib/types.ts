// FILE: src/lib/types.ts — Database & Domain Types
// VERSION: T0-v1 — Initial types for T0 setup
// LAST MODIFIED: 2026-05-05
// HISTORY:
//   T0-v1: Initial — types สำหรับ games, players, submissions

// =====================================================
// Game Phase
// =====================================================
export type GamePhase = 'LOBBY' | 'WRITING' | 'JUDGING' | 'RESULTS';

// =====================================================
// Stock Data — โจทย์หุ้น
// =====================================================
export interface StockData {
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
}

// =====================================================
// Game Config
// =====================================================
export interface GameConfig {
  writingTimeSeconds: number;  // 240 = 4 minutes
  primaryColor?: string;
  logoUrl?: string | null;
}

// =====================================================
// AI Judge Score
// =====================================================
export interface JudgeScore {
  score: number;     // 1-10
  comment: string;   // 1-2 ประโยค ภาษาไทย
}

export interface SubmissionScores {
  analyst?: JudgeScore;
  creative?: JudgeScore;
  communicator?: JudgeScore;
  finalScore?: number;  // ค่าเฉลี่ย, ทศนิยม 1 ตำแหน่ง
  rank?: number;
}

// =====================================================
// Database Rows
// =====================================================
export interface GameRow {
  id: string;
  phase: GamePhase;
  stock: StockData | null;
  config: GameConfig | null;
  writing_started_at: string | null;
  writing_ends_at: string | null;
  created_at: string;
}

export interface PlayerRow {
  id: string;
  game_id: string;
  nickname: string;
  joined_at: string;
}

export interface SubmissionRow {
  id: string;
  game_id: string;
  player_id: string;
  pitch: string;
  submitted_at: string;
  auto_submitted: boolean;
  scores: SubmissionScores | null;
}

// =====================================================
// Constants
// =====================================================
// Game ID ที่ seed ไว้ใน migration.sql — ใช้เป็น default game
export const DEFAULT_GAME_ID = '00000000-0000-0000-0000-000000000001';

// =====================================================
// Supabase Database Type (สำหรับ typed client)
// =====================================================
export interface Database {
  public: {
    Tables: {
      games: {
        Row: GameRow;
        Insert: Partial<GameRow> & { id?: string };
        Update: Partial<GameRow>;
      };
      players: {
        Row: PlayerRow;
        Insert: Omit<PlayerRow, 'id' | 'joined_at'> & {
          id?: string;
          joined_at?: string;
        };
        Update: Partial<PlayerRow>;
      };
      submissions: {
        Row: SubmissionRow;
        Insert: Omit<SubmissionRow, 'id' | 'submitted_at' | 'auto_submitted' | 'scores'> & {
          id?: string;
          submitted_at?: string;
          auto_submitted?: boolean;
          scores?: SubmissionScores | null;
        };
        Update: Partial<SubmissionRow>;
      };
    };
  };
}
