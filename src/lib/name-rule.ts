// =====================================================
// FILE: src/lib/name-rule.ts
// PROJECT: pitch-game
// TASK: T11 — LINE หาพี่ชัวร์ (DIME x BU · FinTech & Digital Investment)
// VERSION: T11-v1
// CREATED: 2026-11-26
// LAST MODIFIED: 2026-11-26
// PURPOSE: กติกาชื่อผู้เล่นของงาน — "ชื่อเล่น.อักษรแรกของชื่อจริง" (Oan.C)
//          ยกมาจาก market-wars lib/name-rule.ts (B26-v2) ต่างกันจุดเดียว:
//          งานนี้รับ "ภาษาอังกฤษเท่านั้น" (market-wars รับไทยด้วย)
//          ตรวจฝั่ง client อย่างเดียว — ไม่มี server/DB constraint
//
// CHANGE LOG:
//   T11-v1 (2026-11-26): Initial — port จาก market-wars B26-v2 + English only
// =====================================================

export const NAME_EXAMPLE = 'Oan.C';
export const NAME_HINT =
  'ชื่อเล่น + จุด + อักษรแรกของชื่อจริง · Nickname.Initial';
export const NAME_WARN = `ต้องลงท้ายด้วย จุด + อักษรแรกของชื่อจริง เช่น ${NAME_EXAMPLE}`;
export const NAME_WARN_ENGLISH = `ใช้ตัวอักษรภาษาอังกฤษเท่านั้น เช่น ${NAME_EXAMPLE}`;

// true = ฟอร์ม join ไม่ให้ส่งถ้าชื่อยังไม่ผ่านกติกา · false = เตือนอย่างเดียว
export const NAME_SUFFIX_REQUIRED = true;

// ชื่อเล่น: A–Z เท่านั้น คั่นด้วยเว้นวรรคหรือขีดกลางได้ · ลงท้ายด้วย . + ตัวอักษรอังกฤษ 1–2 ตัว
export function looksLikeEventName(name: string): boolean {
  return /^[A-Za-z]+(?:[ -][A-Za-z]+)*\.[A-Za-z]{1,2}$/.test(
    (name || '').trim()
  );
}

// มีตัวอักษรที่ไม่ใช่อังกฤษ (ไทย ตัวเลข อีโมจิ สัญลักษณ์อื่น) — ใช้เลือกข้อความเตือน
export function hasNonEnglish(name: string): boolean {
  return /[^A-Za-z .-]/.test(name || '');
}

// จัดรูปแบบให้ตรงกติกาอัตโนมัติ — ตัวแรกของชื่อเล่นตัวใหญ่ ที่เหลือตัวเล็ก · หลังจุดตัวใหญ่
//   "oan.c" → "Oan.C" · "OAN.C" → "Oan.C"
//   final = true (ตอนกดส่ง): ตัดช่องว่างหัวท้าย · "Oan . c" → "Oan.C" · "Oan C" → "Oan.C"
export function formatEventName(raw: string, final = false): string {
  let s = (raw || '').replace(/\s+/g, ' ');
  if (final) {
    s = s
      .trim()
      .replace(/\s*\.\s*/g, '.')
      .replace(/^(.*\S) ([A-Za-z])$/, '$1.$2');
  } else {
    s = s.replace(/^ /, '');
  }
  const i = s.lastIndexOf('.');
  const hasSuffix = i > 0 && s.length - i <= 3; // ".", ".c", ".ch"
  const base = hasSuffix ? s.slice(0, i) : s;
  const suffix = hasSuffix ? s.slice(i) : '';
  const titled = base.replace(
    /(^|[ -])([^ -])([^ -]*)/g,
    (_m, sep: string, first: string, rest: string) =>
      sep + first.toUpperCase() + rest.toLowerCase()
  );
  return titled + suffix.toUpperCase();
}

export function nameBlocked(name: string): boolean {
  return NAME_SUFFIX_REQUIRED && !looksLikeEventName(formatEventName(name, true));
}

// ข้อความเตือนใต้ช่องกรอก — null = ไม่ต้องเตือน (ช่องว่าง หรือชื่อผ่านแล้ว)
export function nameWarning(name: string): string | null {
  if (!name.trim()) return null;
  if (looksLikeEventName(formatEventName(name, true))) return null;
  return hasNonEnglish(name) ? NAME_WARN_ENGLISH : NAME_WARN;
}
