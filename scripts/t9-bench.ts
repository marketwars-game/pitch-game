// =====================================================
// FILE: scripts/t9-bench.ts
// PROJECT: pitch-game
// TASK: T9 — LINE หาพี่ชัวร์ (DIME x AXA Data & AI Week 2026)
// VERSION: T9-v2
// CREATED: 2026-09-20
// PURPOSE: ชุดทดสอบ A/B/C/D/E ของกรรมการ — ยิงผ่าน callJudge + SYSTEM_PROMPTS ตัวจริง
//          (model / temperature / tool schema / retry เดียวกับ production ทุกอย่าง)
//          ไม่แตะ Supabase · ไม่ต้อง deploy · อ่าน ANTHROPIC_API_KEY จาก .env.local
//
// วิธีรัน (จาก root ของ repo):
//   npx tsx scripts/t9-bench.ts
//   npx tsx scripts/t9-bench.ts 3
// (เลขท้าย = จำนวนรอบต่อข้อความ ค่าเริ่มต้น 2)
//
// CHANGE LOG:
//   T9-v2 (2026-09-20): เกณฑ์ที่ไม่มีข้อมูลขึ้น N/A แทน PASS · เพิ่มเกณฑ์ 13–15 (ตรวจหักข้ามเลน + ความยาวคอมเมนต์)
//   T9-v1 (2026-09-20): สร้างครั้งแรก — 6 ข้อความ (A B C1 C2 D E) + เกณฑ์ผ่านอัตโนมัติ
// =====================================================

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// ---- โหลด .env.local ก่อน import anthropic (อ่าน key ตอนเรียกใช้ครั้งแรก) ----
function loadEnvLocal(): void {
  const p = resolve(process.cwd(), '.env.local');
  if (!existsSync(p)) return;
  for (const raw of readFileSync(p, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const k = line.slice(0, eq).trim();
    let v = line.slice(eq + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!(k in process.env)) process.env[k] = v;
  }
}
loadEnvLocal();

import { callJudge, JUDGE_MODEL } from '../src/lib/anthropic';
import {
  SYSTEM_PROMPTS,
  PERSONA_KEYS,
  buildUserMessage,
  type PersonaKey,
} from '../src/lib/judge-prompts';
import { DEFAULT_CASE } from '../src/lib/stock-data';

// =====================================================
// ชุดข้อความทดสอบ
// =====================================================
type TestMsg = { id: string; label: string; text: string };

const TESTS: TestMsg[] = [
  {
    id: 'A',
    label: 'มือใหม่ ตรงเคส (สั้น ไม่มีตัวเลข)',
    text:
      'พี่ชัวร์ SpaceX คือบริษัทของ Elon Musk ที่ทำจรวดส่งของขึ้นอวกาศ แล้วก็ทำ Starlink เน็ตผ่านดาวเทียมด้วยนะพี่ ' +
      'ที่คนสนใจกันเพราะ Starlink มีคนใช้ทั่วโลกเยอะมากแล้วก็ยังโตอยู่ ' +
      'แต่บอกพี่ตรงๆ เลยว่าบริษัทยังขาดทุนอยู่นะ แล้วหุ้นก็ไม่เหมือนฝากประจำของพี่ เงินต้นหายได้จริง ' +
      'ถ้าพี่กลัวเรื่องนี้ก็ศึกษาไว้เฉยๆ ก่อนได้พี่ ไม่ต้องรีบ',
  },
  {
    id: 'B',
    label: 'เก่ง ตรงเคส (ตัวเลข + ความเสี่ยง 2 ข้อ + ข้อมูลนอก reference)',
    text:
      'พี่ชัวร์ หนูเล่าให้ฟังแบบง่ายๆ นะ SpaceX คือบริษัทที่ทำจรวดแบบเอากลับมาใช้ซ้ำได้ ปีที่แล้วปล่อยไป 165 ครั้ง มากกว่าทั้งโลกรวมกันอีก ' +
      'NASA ก็จ้างเขาส่งนักบินอวกาศขึ้นสถานีอวกาศด้วย แล้วเขายังเป็นเจ้าของ Starlink เน็ตผ่านดาวเทียมที่มีคนใช้เกินสิบล้านรายแล้ว ' +
      'ที่คนว่าน่าลงทุนเพราะรายได้ปีที่แล้วราว 18.7 พันล้านดอลลาร์ โตสามสิบกว่าเปอร์เซ็นต์ และ Starlink ตัวเดียวทำเงินเกือบ 70% ของบริษัทแถมมีกำไร ' +
      'แต่... สิ่งที่คนกลัวเสี่ยงแบบพี่ควรรู้ก่อนคือ ทั้งบริษัทยังขาดทุนอยู่เกือบ 5 พันล้านดอลลาร์เพราะทุ่มเงินกับ AI หนักมาก ' +
      'แล้วหุ้นเพิ่งเข้าตลาดเมื่อมิถุนา ราคาเหวี่ยงแรงมากในสามเดือนแรก อีกอย่างคือ Elon Musk คนเดียวคุมเสียงโหวตเกิน 80% ' +
      'มันเป็นของคนละประเภทกับฝากประจำและประกันสะสมทรัพย์ที่พี่ถืออยู่เลยนะ สองอย่างนั้นเงินต้นอยู่ครบ แต่ตัวนี้เงินต้นหายได้จริง ' +
      'พี่ที่ไม่เคยแตะหุ้นมาก่อน รู้ไว้ให้เข้าใจก่อนก็พอ อยากรู้ตรงไหนเพิ่มถามหนูได้เลย',
  },
  {
    id: 'C1',
    label: 'แพ้ชัด — เชียร์ + การันตี',
    text:
      'พี่ชัวร์ SpaceX นี่ของดีที่สุดในรอบสิบปีเลยนะพี่ บริษัทจรวดกับ Starlink ของ Elon Musk ยังไงก็ขึ้น ไม่มีทางขาดทุนแน่นอน ' +
      'พี่รีบซื้อเลยก่อนตกรถ จัดหนักๆ ไปเลยพี่ เดี๋ยวปีหน้ารวยแน่ ความเสี่ยงแทบไม่มีหรอก บริษัทใหญ่ขนาดนี้',
  },
  {
    id: 'C2',
    label: 'แพ้ชัด — ด้อยค่าเงินฝาก/ประกัน + ชวนเวนคืน',
    text:
      'พี่ชัวร์ พูดตรงๆ นะ ฝากประจำกับประกันสะสมทรัพย์ของพี่มันล้าหลังมากแล้ว ดอกเบี้ยแพ้เงินเฟ้อ เงินพี่จมอยู่เฉยๆ ไม่คุ้มเลย ' +
      'SpaceX ทำจรวดกับเน็ตดาวเทียม Starlink รายได้โตแรงมาก พี่ควรเวนคืนประกันสักฉบับแล้วถอนเงินฝากมาซื้อหุ้นตัวนี้ดีกว่า ' +
      'ความเสี่ยงก็มีบ้างที่บริษัทยังขาดทุน แต่ดีกว่าปล่อยเงินนอนเฉยๆ แบบที่พี่ทำอยู่แน่นอน',
  },
  {
    id: 'D',
    label: 'Generic — AI pitch สวย ข้อมูลถูก มีป้ายหัวข้อ ไม่พูดถึงพี่ชัวร์',
    text:
      '**W – What:** SpaceX (SPCX) เป็นบริษัทเทคโนโลยีอวกาศที่พัฒนาจรวดนำกลับมาใช้ซ้ำ ให้บริการอินเทอร์เน็ตผ่านดาวเทียม Starlink และมีธุรกิจ AI ผ่าน xAI\n' +
      '**H – How:** รายได้ปี 2025 อยู่ที่ 18.7 พันล้านดอลลาร์ เติบโต 33% โดย Starlink คิดเป็นเกือบ 70% ของรายได้และมีผู้ใช้กว่า 10 ล้านราย บริษัทครองตลาดการปล่อยจรวดแทบไร้คู่แข่ง\n' +
      '**Y – Yet:** บริษัทยังขาดทุนสุทธิ 4.9 พันล้านดอลลาร์จากการลงทุน AI มี valuation สูงมาก ราคาหุ้นผันผวน และ Elon Musk ควบคุมสิทธิ์โหวตกว่า 80% นักลงทุนควรพิจารณาความเสี่ยงอย่างรอบคอบ',
  },
  {
    id: 'E',
    label: 'AI ข้อมูลเก่า — ตรงเคส น้ำเสียงดี แต่บอกว่ายังไม่เข้าตลาด',
    text:
      'พี่ชัวร์ SpaceX คือบริษัทจรวดของ Elon Musk ที่ทำจรวดใช้ซ้ำได้ กับ Starlink เน็ตผ่านดาวเทียมนะพี่ ' +
      'ที่คนสนใจเพราะธุรกิจโตเร็วและแทบไม่มีคู่แข่ง แต่จริงๆ แล้วตอนนี้ SpaceX ยังเป็นบริษัทนอกตลาดอยู่นะพี่ ยังไม่ได้ IPO คนทั่วไปยังซื้อหุ้นไม่ได้ ต้องรอเขาเข้าตลาดก่อน ' +
      'ความเสี่ยงคือธุรกิจอวกาศใช้เงินลงทุนสูงมากและจรวดระเบิดได้ ซึ่งสำหรับพี่ที่ถือแต่ฝากประจำกับประกันสะสมทรัพย์และกลัวเงินต้นหาย ' +
      'ของแบบนี้ผันผวนกว่าที่พี่คุ้นเยอะเลย รู้จักไว้ก่อนก็พอพี่',
  },
];

// =====================================================
// Run
// =====================================================
type Cell = { score: number; comment: string; reply?: string } | null;
type Row = { id: string; run: number; cells: Record<PersonaKey, Cell>; avg: number };

async function judgeOnce(t: TestMsg, run: number): Promise<Row> {
  const userMessage = buildUserMessage(DEFAULT_CASE, t.text);
  const results = await Promise.all(
    PERSONA_KEYS.map(async (k): Promise<[PersonaKey, Cell]> => {
      try {
        const r = await callJudge({
          systemPrompt: SYSTEM_PROMPTS[k],
          userMessage,
          allowReply: k === 'creative',
        });
        return [k, { score: r.score, comment: r.comment, reply: r.reply }];
      } catch (e) {
        console.error(`[${t.id}#${run}] ${k} failed:`, e instanceof Error ? e.message : e);
        return [k, null];
      }
    })
  );
  const cells = Object.fromEntries(results) as Record<PersonaKey, Cell>;
  const ok = results.map(([, c]) => c).filter((c): c is NonNullable<Cell> => c !== null);
  const avg = ok.length ? ok.reduce((s, c) => s + c.score, 0) / ok.length / 10 : 0;
  return { id: t.id, run, cells, avg: Math.round(avg * 100) / 100 };
}

function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

async function main(): Promise<void> {
  const runs = Math.max(1, Number(process.argv[2] ?? 2) || 2);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ไม่พบ ANTHROPIC_API_KEY (ตรวจ .env.local ที่ root ของ repo)');
    process.exit(1);
  }
  console.log(`# T9 bench · model=${JUDGE_MODEL} · case=${DEFAULT_CASE.id} · runs=${runs}\n`);

  const rows: Row[] = [];
  for (const t of TESTS) {
    const batch = await Promise.all(
      Array.from({ length: runs }, (_, i) => judgeOnce(t, i + 1))
    );
    rows.push(...batch);
  }

  // ---- ตารางดิบ ----
  console.log('| id | run | analyst | creative | communicator | avg/10 |');
  console.log('|---|---|---|---|---|---|');
  for (const r of rows) {
    const c = r.cells;
    console.log(
      `| ${r.id} | ${r.run} | ${c.analyst?.score ?? 'FAIL'} | ${c.creative?.score ?? 'FAIL'} | ${c.communicator?.score ?? 'FAIL'} | ${r.avg.toFixed(2)} |`
    );
  }

  // ---- ค่าเฉลี่ยต่อข้อความ ----
  const by = (id: string) => rows.filter((r) => r.id === id);
  const avgOf = (id: string) => mean(by(id).map((r) => r.avg));
  const pOf = (id: string, k: PersonaKey) =>
    by(id).map((r) => r.cells[k]?.score).filter((x): x is number => typeof x === 'number');

  console.log('\n| id | avg/10 (mean) | label |');
  console.log('|---|---|---|');
  for (const t of TESTS) console.log(`| ${t.id} | ${avgOf(t.id).toFixed(2)} | ${t.label} |`);

  // ---- เกณฑ์ผ่าน ----
  const replies = rows.map((r) => r.cells.creative?.reply ?? '').filter(Boolean);
  const roleLeak = replies.filter((x) => /พี่ชัวร์|ผม|ครับ|ค่ะ|ดิฉัน/.test(x));
  const fails = rows.flatMap((r) => PERSONA_KEYS.filter((k) => r.cells[k] === null));
  const allComments = rows.flatMap((r) =>
    PERSONA_KEYS.map((k) => r.cells[k]?.comment ?? '').filter(Boolean)
  );
  const longOrLeak = allComments.filter(
    (c) => c.length > 260 || /กฎเหล็ก|โทษหนัก|เพดาน|พื้นคะแนน|ไม่เกิน \d\d|reference|ข้อมูลอ้างอิง/.test(c)
  );
  const noData = rows.every((r) => PERSONA_KEYS.every((k) => r.cells[k] === null));

  const checks: [string, boolean, string][] = [
    ['1. B ชนะทุกข้อความ', ['A', 'C1', 'C2', 'D', 'E'].every((x) => avgOf('B') > avgOf(x)), `B=${avgOf('B').toFixed(2)}`],
    ['2. A > D (ตรงเคสชนะ generic)', avgOf('A') > avgOf('D'), `A=${avgOf('A').toFixed(2)} D=${avgOf('D').toFixed(2)}`],
    ['3. B ≥ 8.30', avgOf('B') >= 8.3, avgOf('B').toFixed(2)],
    ['4. B ทุกกรรมการ ≥ 80 ทุกรอบ', PERSONA_KEYS.every((k) => pOf('B', k).every((s) => s >= 80)), PERSONA_KEYS.map((k) => `${k}:${pOf('B', k).join('/')}`).join(' ')],
    ['5. A อยู่ช่วง 7.00–8.60', avgOf('A') >= 7 && avgOf('A') <= 8.6, avgOf('A').toFixed(2)],
    ['6. C1 ≤ 4.50 (เชียร์/การันตี)', avgOf('C1') <= 4.5, avgOf('C1').toFixed(2)],
    ['7. C2 ≤ 3.80 (ด้อยค่าเงินฝาก-ประกัน)', avgOf('C2') <= 3.8, avgOf('C2').toFixed(2)],
    ['8. D: creative ≤ 55 และ communicator ≤ 68 ทุกรอบ', pOf('D', 'creative').every((s) => s <= 55) && pOf('D', 'communicator').every((s) => s <= 68), `cre:${pOf('D', 'creative').join('/')} com:${pOf('D', 'communicator').join('/')}`],
    ['9. D: analyst ≥ 80 (ข้อมูลครบถูก ไม่โดนหักเรื่อง generic)', pOf('D', 'analyst').every((s) => s >= 80), pOf('D', 'analyst').join('/')],
    ['10. E: analyst ≤ 50 ทุกรอบ (จับข้อมูลเก่า)', pOf('E', 'analyst').every((s) => s <= 50), pOf('E', 'analyst').join('/')],
    ['13. E: communicator ≥ 70 ทุกรอบ (ไม่หักข้ามเลนเรื่องข้อมูล)', pOf('E', 'communicator').every((s) => s >= 70), pOf('E', 'communicator').join('/')],
    ['14. E < A (ข้อมูลเก่าไม่ชนะมือใหม่ที่ข้อมูลถูก)', avgOf('E') < avgOf('A'), `E=${avgOf('E').toFixed(2)} A=${avgOf('A').toFixed(2)}`],
    ['15. คอมเมนต์ยาวเกิน 260 ตัวอักษร ≤ 10% และไม่มีคำหลุดกลไก', longOrLeak.length <= Math.ceil(allComments.length * 0.1), `${longOrLeak.length}/${allComments.length}`],
    ['11. reply ไม่หลุดบทบาท (ไม่มี พี่ชัวร์/ผม/ครับ/ค่ะ)', roleLeak.length === 0, `${roleLeak.length}/${replies.length}`],
    ['12. ไม่มี persona fail', fails.length === 0, `${fails.length}`],
  ];

  console.log('\n| เกณฑ์ | ผล | ค่า |');
  console.log('|---|---|---|');
  for (const [name, ok, val] of checks) {
    const verdict = noData ? 'N/A' : ok ? 'PASS' : '**FAIL**';
    console.log(`| ${name} | ${verdict} | ${val} |`);
  }
  const passed = noData ? 0 : checks.filter(([, ok]) => ok).length;
  console.log(`\n**รวม: ${passed}/${checks.length}**`);

  // ---- คอมเมนต์ทั้งหมด (ใช้จูน) ----
  console.log('\n## comments');
  for (const r of rows) {
    for (const k of PERSONA_KEYS) {
      const c = r.cells[k];
      if (!c) continue;
      console.log(`- ${r.id}#${r.run} ${k} ${c.score}: ${c.comment}`);
      if (c.reply) console.log(`  - reply: ${c.reply}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
