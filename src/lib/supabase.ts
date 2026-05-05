// FILE: src/lib/supabase.ts — Supabase Client
// VERSION: T0-v1 — Initial client for T0 setup
// LAST MODIFIED: 2026-05-05
// HISTORY:
//   T0-v1: Initial — browser + server clients

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL หรือ NEXT_PUBLIC_SUPABASE_ANON_KEY ไม่ได้ตั้ง'
  );
}

// =====================================================
// Browser Client (Singleton)
// ใช้ใน Client Components — anon key
// =====================================================
let browserClient: SupabaseClient<Database> | null = null;

export function getSupabaseBrowserClient(): SupabaseClient<Database> {
  if (browserClient) return browserClient;

  browserClient = createClient<Database>(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });

  return browserClient;
}

// =====================================================
// Server Client
// ใช้ใน API Routes / Server Components — service role key
// service role bypasses RLS
// =====================================================
export function getSupabaseServerClient(): SupabaseClient<Database> {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY env var');
  }

  return createClient<Database>(SUPABASE_URL!, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
