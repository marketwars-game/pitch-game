# T3 Guide — AI Judge API

| Field | Value |
|---|---|
| Task ID | T3 |
| Task Name | AI Judge API |
| Estimated Time | 1.5 ชั่วโมง |
| Tech Spec | v1.6 |
| Model Locked | `claude-haiku-4-5-20251001` |
| Created | 2026-05-06 |

---

## 🎯 What this task delivers

หลังเสร็จ task นี้:
- Player ส่ง pitch → server judge อัตโนมัติด้วย Haiku 4.5 × 3 personas
- Admin Panel เห็น judging_status ของแต่ละ player real-time
- Admin reveal phase RESULTS → player เห็น scores จริงทันที
- Failed submissions → admin มีปุ่ม "ลองตัดสินใหม่" ก่อน auto-default

---

## 📦 File List (7 files: 4 new, 2 overwrite, 1 patch)

| # | File | In Project | Action | Notes |
|---|---|---|---|---|
| 1 | `judge-prompts.ts` | `src/lib/judge-prompts.ts` | ✨ NEW | 3 persona system prompts + parser |
| 2 | `anthropic.ts` | `src/lib/anthropic.ts` | ✨ NEW | SDK client + retry/jitter |
| 3 | `wrapper-judge-route.ts` | `src/app/api/judge/route.ts` | ✨ NEW | POST endpoint |
| 4 | `useSubmission.ts` | `src/hooks/useSubmission.ts` | 🔄 OVERWRITE | T3-v1: trigger /api/judge |
| 5 | `PlayerDetailModal.tsx` | `src/components/admin/PlayerDetailModal.tsx` | 🔄 OVERWRITE | T3-v1: + Re-judge button |
| 6 | `package.json` | `package.json` | 🔧 PATCH | เพิ่ม `@anthropic-ai/sdk` |
| 7 | `T3-guide.md` | `docs/T3-guide.md` | ✨ NEW | (this file) |

---

## ⚙️ Step 0 — Pre-flight (5 นาที)

### 0.1 ตั้งค่า ANTHROPIC_API_KEY ใน Vercel

1. เปิด **https://vercel.com/dashboard** → Project `pitch-game`
2. **Settings** → **Environment Variables**
3. กด **"Add New"**:
   - **Key:** `ANTHROPIC_API_KEY`
   - **Value:** `sk-ant-api03-...` (key จาก Console ที่เพิ่งสร้าง)
   - **Environments:** ☑ Production ☑ Preview ☑ Development
4. กด **Save**

### 0.2 ยืนยัน Tier 2

ใน Anthropic Console → **Limits** → ดู `claude-haiku-4-5`:
- ✅ RPM ≥ 1,000 = Tier 2 OK
- ⚠️ RPM = 50 = Tier 1 → เติม credits ให้ครบ $40

### 0.3 ยืนยัน balance

Anthropic Console → **Billing** → balance ≥ $5 (สำหรับ test + 100 ผู้เล่น)

---

## 📁 Step 1 — File Overlay (3 นาที)

ดาวน์โหลด attached files แล้ววางตาม **File List** ตาราง:

```bash
# ใน local repo
cd /path/to/pitch-game

# ไฟล์ใหม่ (ต้องสร้าง dir ก่อน ถ้ายังไม่มี)
mkdir -p src/app/api/judge
mv ~/Downloads/judge-prompts.ts                  src/lib/judge-prompts.ts
mv ~/Downloads/anthropic.ts                      src/lib/anthropic.ts
mv ~/Downloads/wrapper-judge-route.ts            src/app/api/judge/route.ts

# ไฟล์ overwrite
mv ~/Downloads/useSubmission.ts                  src/hooks/useSubmission.ts
mv ~/Downloads/PlayerDetailModal.tsx             src/components/admin/PlayerDetailModal.tsx

# guide
mkdir -p docs
mv ~/Downloads/T3-guide.md                       docs/T3-guide.md
```

> ⚠️ **ห้าม rename ผิด** — ดู Section 9 Naming Mapping ใน Tech Spec
> ไฟล์ที่ส่งให้ใช้ชื่อ `wrapper-judge-route.ts` แต่ใน project ต้องเป็น `route.ts` ใน `src/app/api/judge/`

---

## 📦 Step 2 — Install SDK (1 นาที)

```bash
npm install @anthropic-ai/sdk
```

ตรวจ `package.json` หลัง install — `dependencies` ควรเพิ่ม:

```json
"@anthropic-ai/sdk": "^0.x.x"
```

---

## ✅ Step 3 — TypeScript Validation (1 นาที)

```bash
npx tsc --noEmit
```

**Expected output:** ไม่มี errors (exit code 0)

> 💡 ถ้าเจอ error ที่ไม่เกี่ยวกับ T3 (เช่น import path warning ใน T1/T2 ไฟล์เดิม) — แจ้งผมพร้อม error message

---

## 🏗️ Step 4 — Build (2 นาที)

```bash
npm run build
```

**Expected:**
- ✅ Compiled successfully
- ✅ Route `/api/judge` ขึ้นใน build output
- ❌ ไม่มี ESLint errors

---

## 🚀 Step 5 — Deploy (3 นาที)

```bash
git add -A
git commit -m "T3: AI Judge API (Haiku 4.5 × 3 personas)"
git push origin main
```

ดู Vercel deployment log จนกว่าจะ "Ready"

---

## 🧪 Step 6 — Smoke Test (10 นาที)

> 💡 ทดสอบบน **Chrome** เท่านั้น (T2 Lesson 7: Safari realtime quirk)

### 6.1 Setup baseline

1. เปิด **Admin Panel** (`/admin`) → login
2. ตอนนี้ phase ควรเป็น `LOBBY` (ถ้าไม่ใช่ → กด "เริ่มรอบใหม่")
3. เลือก stock = NVDA → กด "Apply"

### 6.2 Test happy path (1 player)

| Step | Action | Expected |
|---|---|---|
| 1 | เปิด `/play` ใน tab ใหม่ → ใส่ชื่อ "Test1" → join | Admin Panel เห็น Test1 |
| 2 | Admin กด "เริ่มเขียน" → phase = WRITING | Player เห็นหน้า writing + countdown |
| 3 | Player พิมพ์ pitch ≥ 50 ตัวอักษร → กด "ส่ง Pitch" | Player เห็น "✓ submitted" |
| 4 | **รอ 5-10 วินาที** | Admin Panel เห็น Test1 → status `scored` (จาก `submitted`) |
| 5 | Admin คลิกแถว Test1 → เปิด PlayerDetailModal | เห็น 3 judges + scores + comments |
| 6 | Admin กด "ปิดรับ + ตัดสิน" → phase = JUDGING | Player เห็นหน้า JUDGING animation |
| 7 | Admin กด "โชว์ Leaderboard" → phase = RESULTS | Player เห็น scores + leaderboard |

### 6.3 Test failed handling (manual force)

จำลอง failed = ปิด API key ชั่วคราว:

| Step | Action | Expected |
|---|---|---|
| 1 | Admin "เริ่มรอบใหม่" → reset | Player กลับหน้า join |
| 2 | Vercel → Settings → Environment Variables → ลบ ANTHROPIC_API_KEY ชั่วคราว | (key หายไป) |
| 3 | Trigger redeploy (commit dummy หรือ "Redeploy" ใน Vercel UI) | Deploy เสร็จ |
| 4 | Player ส่ง pitch ใหม่ | Admin Panel เห็น status `failed` (5-10 วินาที) |
| 5 | Admin คลิก player → เห็น banner ⚠️ "AI ตัดสินไม่สำเร็จ" + ปุ่ม "ลองตัดสินใหม่" | (ตอนนี้ key ยังหาย — กดแล้วต้อง fail อีก) |
| 6 | **เพิ่ม ANTHROPIC_API_KEY กลับเข้าไป** ใน Vercel + redeploy | Deploy เสร็จ |
| 7 | Admin กด "ลองตัดสินใหม่" | ปุ่มเป็น "✓ ตัดสินสำเร็จ" + scores ปรากฏ |

> ⚠️ **อย่าลืมเพิ่ม API key กลับ** ก่อนงานพรุ่งนี้!

### 6.4 Test 3 players concurrent

| Step | Action | Expected |
|---|---|---|
| 1 | Reset เกม → 3 tabs join: Test1, Test2, Test3 | Admin เห็น 3 ชื่อ |
| 2 | เริ่มเขียน → ทุก tab ส่ง pitch ห่างกัน 2-3 วินาที | ไม่มี FK violation |
| 3 | รอ 10-15 วินาที | ทุกคน status = `scored` |
| 4 | เปิด PlayerDetailModal ของแต่ละคน | เห็น scores 3 personas (ต่างกันต่อคน) |
| 5 | Admin reveal | ทุกคนเห็น scores |

---

## 🏷️ Step 7 — Tag Stable (1 นาที)

```bash
git tag T3-stable
git push origin T3-stable
```

---

## 🐛 Troubleshooting

### "ANTHROPIC_API_KEY is not set"
- เช็ค Vercel env vars → ✅ key ติ๊กทั้ง 3 environments
- หลังเพิ่ม env ต้อง **redeploy** (commit ใหม่ หรือ "Redeploy" UI)

### Player status ค้างที่ `submitted` ไม่เป็น `scored`
- เปิด **Vercel → Deployments → Functions → /api/judge** → ดู logs
- ถ้าเห็น 401 → API key ผิด/หมดอายุ
- ถ้าเห็น 429 → rate limit ชน → upgrade tier
- ถ้าเห็น 529 → Anthropic overloaded → retry logic จะลองให้แล้ว แต่ถ้านานเกิน → fall to failed

### `/api/judge` timeout
- Vercel hobby plan มี limit 10s — เราตั้ง `maxDuration = 60` แล้ว
- ถ้ายังไม่พอ (Haiku 4.5 retry หลายรอบ) → upgrade Vercel หรือลด retries

### TypeScript error หลัง install SDK
- ลอง `rm -rf node_modules package-lock.json && npm install`

### Score ไม่ขึ้นใน Player view หลัง admin reveal
- เปิด DevTools console บน Player tab → ดู Supabase realtime subscription
- ถ้า subscribe drop → refresh tab

---

## 📋 Definition of Done

- [ ] Step 0-7 ผ่านครบ
- [ ] 6.2 Happy path ผ่าน
- [ ] 6.3 Failed handling + Re-judge ผ่าน
- [ ] 6.4 Concurrent 3 players ผ่าน
- [ ] git tag `T3-stable` push แล้ว

---

## 📊 Cost Tracking (สำหรับวันงาน)

หลังงานเสร็จ → ดู Anthropic Console → **Usage** → กรองวันที่ 7 พ.ค.:
- **Expected:** ~$1-2 (100 players × 3 personas × Haiku 4.5)
- ถ้าสูงกว่า ~$5 → มีอะไรผิดปกติ (retry storm หรือ token bloat)

---

## 🎬 Next Step (หลัง T3 ผ่าน)

**T4 — Presenter View** (1 ชั่วโมง)
- หน้าจอใหญ่ 16:9 สำหรับ projector
- 4 phases: LOBBY (QR + count), WRITING (countdown ใหญ่), JUDGING (animation), RESULTS (leaderboard)

หลัง T3 + T4 = MVP ครบ → พร้อมงาน 7 พ.ค.

---

*End of T3 Guide — 2026-05-06*
