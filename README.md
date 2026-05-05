# Pitch Game — AI Stock Pitch Battle

> Web app สำหรับเกม AI Stock Pitch Battle ใน MONEY EXPO 2026
> ผู้เล่นใช้ AI เขียน pitch หุ้น → AI Judge 3 ท่านตัดสิน → Leaderboard real-time

**Event:** 7 พ.ค. 2569 เวลา 15:30 — Impact Muang Thong Thani
**Owner:** OANIE (CTO & COO, KKP Dime)

---

## Architecture

- **Framework:** Next.js 14+ (App Router) + TypeScript + Tailwind CSS
- **Database:** Supabase (PostgreSQL + Realtime)
- **Hosting:** Vercel (auto-deploy from GitHub main branch)
- **AI Judge:** Claude API (Anthropic) — 1 API, 3 personas

```
┌─────────────────────────────────────────┐
│         Next.js App (Vercel)            │
│                                          │
│  /play       — Player View (mobile)     │
│  /presenter  — Presenter View (จอใหญ่)  │
│  /admin      — Admin Panel              │
│  /api/judge  — AI Judge endpoint (T3)   │
│                                          │
│         ↕ Realtime ↕                    │
│                                          │
│         Supabase (Singapore)            │
│  Tables: games, players, submissions    │
└─────────────────────────────────────────┘
```

---

## Setup Guide — From Zero to Deployed (Mac)

ทำตามลำดับนี้ — แต่ละ step ใช้เวลาประมาณ 5-10 นาที รวมทั้งหมด ~45 นาที

### Prerequisites — เช็คก่อนเริ่ม

```bash
node --version    # ต้องเป็น v18.18.x ขึ้นไป (แนะนำ v20 LTS)
git --version     # ต้องมี
npm --version     # มาพร้อม Node.js
```

ถ้าไม่มี Node.js → ดาวน์โหลด LTS จาก https://nodejs.org

ถ้าไม่มี Git → ติดตั้งจาก https://git-scm.com หรือ Xcode Command Line Tools:
```bash
xcode-select --install
```

---

### Step 1 — สร้าง GitHub Repository

1. Login GitHub ในเบราว์เซอร์
2. มุมขวาบน → กด **+** → **New repository**
3. ตั้งค่า:
   - **Owner:** account ของคุณ
   - **Repository name:** `pitch-game`
   - **Public** ✅ (แนะนำ — ไม่ต้องจัดการ auth + Vercel deploy ราบรื่น)
   - **อย่าติ๊ก** README / .gitignore / license — Next.js scaffold จะ generate ให้
4. กด **Create repository**

> 💡 **Public ปลอดภัยมั้ย?** ปลอดภัย — `.env.local` (ที่มี API keys) ถูก ignore ใน `.gitignore` default ของ Next.js แล้ว ไม่ขึ้น Git

---

### Step 2 — Clone Repo + Scaffold Next.js

⚠️ **ระวัง:** อย่ารัน `git clone` ซ้ำใน folder เดิม จะเกิด folder ซ้อน 2-3 ชั้น (เคยพลาดมา)

```bash
# 1. ไปที่ folder ที่จะวาง project
cd ~/Documents

# 2. ตรวจว่ายังไม่มี folder pitch-game (กันซ้อน)
ls -la pitch-game 2>/dev/null && echo "⚠️ มี folder อยู่แล้ว — ลบก่อน: rm -rf pitch-game" || echo "✅ พร้อม clone"

# 3. Clone repo เปล่าๆ จาก GitHub
git clone https://github.com/[your-username]/pitch-game.git

# 4. เข้า folder
cd pitch-game

# 5. Verify ว่าอยู่ใน folder ที่ถูกต้อง
pwd    # ควรเห็น /Users/[you]/Documents/pitch-game

# 6. Scaffold Next.js (ใช้เวลา 1-2 นาที)
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

ระหว่าง scaffold ถ้ามันถาม:
- `Need to install create-next-app...?` → **y**
- `Would you like to use Turbopack?` → **No**

**ตรวจว่าสำเร็จ:**
```bash
ls -la
# ควรเห็น: .git/, src/, package.json, node_modules/, tailwind.config.ts, etc.

pwd
# ควรเห็น path เดียว ไม่มี pitch-game/pitch-game ซ้อนกัน
```

> 🆘 **ถ้า folder ซ้อน 2-3 ชั้น (เช่น `Documents/pitch-game/pitch-game/pitch-game/`):**
> ```bash
> cd ~/Documents
> mv pitch-game/pitch-game/pitch-game pitch-game-temp
> rm -rf pitch-game
> mv pitch-game-temp pitch-game
> cd pitch-game
> ```

> 💡 **เกี่ยวกับ npm audit warning:** ตอน scaffold เสร็จจะเห็น
> `To address all issues, run: npm audit fix --force`
> → **ข้ามไปก่อน** ไม่กระทบ — ใช้ `--force` ตอนนี้อาจ break Next.js

---

### Step 3 — วางไฟล์ Project (12 ไฟล์)

ดาวน์โหลดไฟล์ทั้ง 12 ไฟล์จาก chat (Claude T0 deliverables) ลงใน `~/Downloads`

**สร้าง folders ที่ต้องการ:**

```bash
cd ~/Documents/pitch-game
mkdir -p supabase
mkdir -p src/app/play
mkdir -p src/app/presenter
mkdir -p src/app/admin
mkdir -p src/lib
```

**Move ไฟล์เข้า path ที่ถูกต้อง (รัน block เดียวจบ):**

```bash
cd ~/Documents/pitch-game

mv ~/Downloads/migration.sql supabase/migration.sql
mv ~/Downloads/types.ts src/lib/types.ts
mv ~/Downloads/supabase.ts src/lib/supabase.ts
mv ~/Downloads/stock-data.ts src/lib/stock-data.ts
mv ~/Downloads/layout.tsx src/app/layout.tsx
mv ~/Downloads/globals.css src/app/globals.css
mv ~/Downloads/page.tsx src/app/page.tsx
mv ~/Downloads/play-page.tsx src/app/play/page.tsx
mv ~/Downloads/presenter-page.tsx src/app/presenter/page.tsx
mv ~/Downloads/admin-page.tsx src/app/admin/page.tsx
mv ~/Downloads/.env.local.example .env.local.example
mv ~/Downloads/README.md README.md
```

> 💡 ถ้าเบราว์เซอร์ดาวน์โหลดเป็น `migration (1).sql` ให้ rename ก่อน mv

**Verify ว่าครบ:**

```bash
ls supabase/                 # ควรเห็น: migration.sql
ls src/lib/                  # ควรเห็น: stock-data.ts, supabase.ts, types.ts
ls src/app/                  # ควรเห็น: admin/, globals.css, layout.tsx, page.tsx, play/, presenter/
ls src/app/play/             # ควรเห็น: page.tsx
ls src/app/presenter/        # ควรเห็น: page.tsx
ls src/app/admin/            # ควรเห็น: page.tsx
ls -la | grep -E "README|env" # ควรเห็น: README.md, .env.local.example
```

---

### Step 4 — Install Dependencies

```bash
npm install @supabase/supabase-js
```

---

### Step 5 — สร้าง Supabase Project + รัน Migration

1. ไป https://supabase.com/dashboard → กด **New Project**
2. ตั้งชื่อ: `pitch-game`
3. **Database Password:** ตั้งให้แข็งแรง (save ไว้ใน password manager)
4. **Region:** **Singapore (Southeast Asia)** ← สำคัญ เพื่อ latency
5. กด **Create new project** → รอ ~2 นาที

**รัน Migration:**

1. เมนูซ้าย → **SQL Editor** (icon รูปฐานข้อมูล)
2. กด **+ New query**
3. เปิดไฟล์ `supabase/migration.sql` ใน VS Code/text editor → copy ทั้งหมด
4. paste ใน SQL Editor → กดปุ่ม **Run** (มุมขวาล่าง) หรือ `Cmd+Enter`
5. ควรเห็น `Success. No rows returned` หรือผลลัพธ์ใกล้เคียง

**Verify:**

- เมนูซ้าย → **Table Editor** → ควรเห็น 3 tables: `games`, `players`, `submissions`
- เปิด table `games` → ควรเห็น 1 row (id ขึ้นต้น `00000000-...-001`)
- เมนูซ้าย → **Database** → **Replication** → ควรเห็น 3 tables มี realtime เปิด

---

### Step 6 — ตั้งค่า Environment Variables

```bash
cd ~/Documents/pitch-game
cp .env.local.example .env.local
```

เปิดไฟล์ `.env.local` ด้วย VS Code/text editor:

```bash
open -a "Visual Studio Code" .env.local
# หรือ
open -a TextEdit .env.local
```

**กรอกค่า — หาจากที่ไหน:**

| Variable | ที่หา |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API → **Project URL** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → **Project API keys → anon public** |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → **Project API keys → service_role** ⚠️ secret! |
| `ANTHROPIC_API_KEY` | https://console.anthropic.com → API Keys → Create Key (ใส่ตอน T3 ก็ได้) |
| `ADMIN_PASSWORD` | ตั้งเองตามใจ (เช่น `dime2026`) |

> ⚠️ `service_role` key มีสิทธิ์ bypass RLS — **ห้าม** commit เข้า Git เด็ดขาด (Next.js จะ ignore `.env.local` อัตโนมัติ)

---

### Step 7 — ทดสอบ Local

```bash
npm run dev
```

ควรเห็น:
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
✓ Ready in X.Xs
```

เปิดเบราว์เซอร์ → ทดสอบ 3 paths:

- http://localhost:3000 → redirect ไป `/play`
- http://localhost:3000/play → "🚧 Player View — Placeholder"
- http://localhost:3000/presenter → "🚧 Presenter View — Placeholder"
- http://localhost:3000/admin → "🚧 Admin Panel — Placeholder"

ทุก page ต้องเห็น placeholder + ไม่มี error ใน terminal/console

กด **Ctrl+C** ใน terminal เพื่อหยุด dev server

---

### Step 8 — Build Check (Pre-deploy Rule)

```bash
npm run build
```

ต้องเห็น `✓ Compiled successfully` + exit code 0 → ถ้า error ห้าม push

---

### Step 9 — Commit + Push ขึ้น GitHub

```bash
git add .
git commit -m "T0: infra setup complete"
git push origin main
```

> 💡 ถ้า push ติด auth → ใช้ GitHub CLI:
> ```bash
> brew install gh
> gh auth login    # เลือก GitHub.com → HTTPS → Login with web browser
> ```
> หรือ Personal Access Token: https://github.com/settings/tokens

---

### Step 10 — Deploy Vercel

1. ไป https://vercel.com/new
2. **Import Git Repository** → เลือก `pitch-game`
3. Framework Preset: **Next.js** (ตรวจอัตโนมัติ)
4. **Environment Variables** — copy ทุกตัวจาก `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ANTHROPIC_API_KEY`
   - `ADMIN_PASSWORD`
5. กด **Deploy** → รอ ~2 นาที
6. เปิด URL ที่ Vercel ให้ → ทดสอบ 3 paths เหมือน local

---

### Step 11 — Tag Stable

```bash
git tag T0-stable
git push origin T0-stable
```

✅ **T0 Done!** พร้อมเริ่ม T1

---

## Build Tasks — Roadmap

| Task | สถานะ | รายละเอียด | เวลา |
|---|---|---|---|
| **T0** | 🟡 In Progress | Infra Setup | 45 นาที |
| T1 | ⚪ Pending | Player View + Realtime | 2 ชม. |
| T2 | ⚪ Pending | Admin Panel + Phase Control | 1.5 ชม. |
| T3 | ⚪ Pending | AI Judge API | 1.5 ชม. |
| T4 | ⚪ Pending | Presenter View | 1 ชม. |
| T5 | ⚪ Pending | E2E Test + Polish | 1 ชม. |

---

## File Structure (after T0)

```
pitch-game/
├── src/
│   ├── app/
│   │   ├── play/page.tsx          # Player View placeholder
│   │   ├── presenter/page.tsx     # Presenter View placeholder
│   │   ├── admin/page.tsx         # Admin Panel placeholder
│   │   ├── globals.css            # Global styles + CSS vars
│   │   ├── layout.tsx             # Root layout
│   │   └── page.tsx               # Redirect → /play
│   └── lib/
│       ├── supabase.ts            # Supabase clients (browser + server)
│       ├── types.ts               # Database + domain types
│       └── stock-data.ts          # Hardcoded stock presets (NVDA)
├── supabase/
│   └── migration.sql              # DB schema + RLS + seed
├── .env.local                     # ⚠️ NOT in Git
├── .env.local.example             # Template
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md                      # ไฟล์นี้
```

---

## Key Constants

- `DEFAULT_GAME_ID = '00000000-0000-0000-0000-000000000001'` — fixed game ID ที่ seed ไว้ใน migration
- ใช้ใน T1+ เพื่อ join เกมโดยไม่ต้องสร้าง game record ก่อน

---

## Common Issues & Fixes

### Folder ซ้อน 2-3 ชั้นจากการ clone หลายรอบ

```bash
cd ~/Documents
mv pitch-game/pitch-game/pitch-game pitch-game-temp
rm -rf pitch-game
mv pitch-game-temp pitch-game
```

### `git push` ติด authentication

```bash
brew install gh
gh auth login
```
เลือก: GitHub.com → HTTPS → Y → Login with web browser

### `npm run build` error เรื่อง types

```bash
rm -rf .next node_modules
npm install
npm run build
```

### Supabase realtime ไม่ทำงาน

ตรวจที่ Database → Replication → ต้องเห็น `games`, `players`, `submissions` มี toggle เปิด
ถ้าไม่เห็น → รัน migration ใหม่ (มีคำสั่ง `alter publication supabase_realtime add table` อยู่)

### Environment variables ใน Vercel ไม่ทำงาน

หลังเปลี่ยน env vars บน Vercel → ต้อง **Redeploy** ใหม่ ไม่ pick up อัตโนมัติ
ไปที่ Deployments → ... → Redeploy

---

## Related Docs (ใน Project Knowledge)

- `MEXPO26-AI-INVEST.md` — Master Context ของ session
- `MEXPO26-PITCH-GAME-v2.md` — Context Doc ของเกม
- `PITCH-GAME-TechSpec-v1.md` — Tech Spec
- `MEXPO26-PITCH-GAME-mockup.html` — UI Mockup

---

## Workflow Rules (สรุปจาก Tech Spec Section 1)

1. **Pre-task Design Session** — chat ใหม่ต่อ task, design ก่อน implement, รอ confirm
2. **แก้ Code = สร้างไฟล์เต็มเสมอ** — ไม่แก้เป็นจุดๆ
3. **Version Header ทุกไฟล์** — `// FILE: ... // VERSION: T[n]-v[n]`
4. **Pre-deploy: `npm run build` ก่อน push เสมอ**
5. **Tag stable เมื่อ task เสร็จ** — `git tag T[n]-stable`
