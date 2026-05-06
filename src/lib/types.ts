// =====================================================
// FILE: src/lib/types.ts
// PROJECT: pitch-game
// TASK: T1 — Player View + Realtime
// VERSION: T1-v4
// CREATED: 2026-05-05
// LAST MODIFIED: 2026-05-06
// PURPOSE: Database & domain types — share กันระหว่าง client + server
//
// CHANGE LOG:
//   T1-v4 (2026-05-06): เปลี่ยน interface → type alias ทุกตัว
//                        Supabase v2.105 ใช้ Schema extends GenericSchema check
//                        และ GenericTable.Row = Record<string, unknown>
//                        TypeScript 5.9 strict mode: interface ไม่ implicitly
//                        match Record<string, unknown> index signature → schema fall to never
//                        type alias match ได้ → schema resolve ถูก
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
  description: string;    // คำอธิบายบริษัท 1-2 ประโยค (เก็บไว้ใช้ใน Presenter View ภายหลัง)
  marketCap: string;      // "$3.21T"
  peRatio: string;        // "39.3x"
  revenueGrowth: string;  // "+114%"
  news: string[];         // ข่าวล่าสุด 1-2 bullets
};

// =====================================================
// Game Config
// =====================================================
export type GameConfig = {
  writingTimeSeconds: number;  // 240 = 4 นาที
  pitchMinLength: number;      // ขั้นต่ำ — ปุ่ม submit disabled ถ้าน้อยกว่านี้
  pitchMaxLength: number;      // สูงสุด — hard block keystroke ที่ความยาวนี้
  primaryColor?: string;
  logoUrl?: string | null;
};

// =====================================================
// AI Judge Score
// =====================================================
export type JudgeScore = {
  score: number;     // 1-10
  comment: string;   // 1-2 ประโยค ภาษาไทย
};

export type SubmissionScores = {
  analyst?: JudgeScore;
  creative?: JudgeScore;
  communicator?: JudgeScore;
  finalScore?: number;  // ค่าเฉลี่ย ทศนิยม 1 ตำแหน่ง
  rank?: number;
};

// =====================================================
// Database Rows
// =====================================================
export type GameRow = {
  id: string;
  phase: GamePhase;
  stock: StockData | null;
  config: GameConfig | null;
  writing_started_at: string | null;
  writing_ends_at: string | null;
  created_at: string;
};

export type PlayerRow = {
  id: string;
  game_id: string;
  nickname: string;
  joined_at: string;
};

export type SubmissionRow = {
  id: string;
  game_id: string;
  player_id: string;
  pitch: string;
  submitted_at: string;
  auto_submitted: boolean;
  scores: SubmissionScores | null;
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

// Nickname constraints (UI-level)
export const NICKNAME_MAX_LENGTH = 20;

// Default config fallback (ใช้ตอน game.config เป็น null ใน DB)
export const DEFAULT_GAME_CONFIG: GameConfig = {
  writingTimeSeconds: 240,
  pitchMinLength: 50,
  pitchMaxLength: 1500,
};

// =====================================================
// Supabase Database Type (สำหรับ typed client)
// Supabase v2.105 ต้องการ:
//   - __InternalSupabase field (PostgrestVersion metadata)
//   - public schema มี Tables + Views + Functions เป็นอย่างน้อย
//   - ทุก Table มี Relationships array
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
        Insert: Omit<PlayerRow, 'id' | 'joined_at'> & {
          id?: string;
          joined_at?: string;
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
        Insert: Omit<SubmissionRow, 'id' | 'submitted_at' | 'auto_submitted' | 'scores'> & {
          id?: string;
          submitted_at?: string;
          auto_submitted?: boolean;
          scores?: SubmissionScores | null;
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
