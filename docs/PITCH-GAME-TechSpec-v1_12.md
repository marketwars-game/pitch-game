# pitch-game — Technical Spec v1.12

**อัปเดต:** หลังงาน KTC (5 ส.ค. 2026)
**เวอร์ชันก่อนหน้า:** v1.11 (หลัง T5)
**การเปลี่ยนแปลง v1.12:** เพิ่มส่วน T7 (LINE หาพี่เก่ง) — เกมโหมดใหม่บน engine เดิม

---

## §T7. LINE หาพี่เก่ง (DIME × KTC)

### T7.1 ภาพรวมสถาปัตยกรรม

T7 คือ **content + judging + UI reskin บน engine เดิมทั้งหมด** — ไม่แตะ
state machine, realtime layer, phase control, หรือ Supabase schema
(ยกเว้นค่าใน `games.config` และ `games.stock` ซึ่งเป็น data ไม่ใช่ structure)

```
เดิม (MEXPO):  ผู้เล่น pitch หุ้น → กรรมการ 3 คนให้คะแนน (analyst/creative/communicator)
T7 (KTC):      ผู้เล่นเขียน LINE ชวนพี่เก่งลงทุน → กรรมการ 3 คนเดิม (key ใน DB ไม่เปลี่ยน)
               แต่ persona = The Professor / พี่เก่ง / The Communicator
```

**หลักการที่ยึด:** DB key ของกรรมการ (`analyst`/`creative`/`communicator`)
ไม่เปลี่ยน เพื่อไม่ต้อง migrate — เปลี่ยนแค่ persona ที่ map ไปแต่ละ key

### T7.2 กลไกคะแนน

```
AI (Haiku) ให้ 0-100 integer
  → toScore10() หาร 10 = 0.0-10.0 (เก็บลง submissions.scores jsonb)
  → finalScore = เฉลี่ย 3 กรรมการ, 2 ทศนิยม
```

- คะแนนรายกรรมการแสดง 1 ทศนิยม · finalScore แสดง 2 ทศนิยม (จอที่เทียบอันดับ)
- โครงสร้าง `scores` jsonb:
  ```
  {
    "analyst":      { "score": 8.7, "comment": "..." },
    "creative":     { "score": 7.6, "comment": "...", "reply": "..." },
    "communicator": { "score": 7.8, "comment": "..." },
    "finalScore":   8.03
  }
  ```
  → `reply` มีเฉพาะ `creative` (พี่เก่ง) = ข้อความที่พี่เก่งพิมพ์ตอบในแชท

### T7.3 Tool Use — per-persona schema (สำคัญ)

**ปัญหาที่เจอ:** ใช้ tool schema ตัวเดียวร่วมทุก persona แล้วมีช่อง `reply`
โผล่ให้กรรมการที่ไม่ใช้เห็น → Haiku เอา comment ไปใส่ reply แล้วไม่ส่ง comment
→ validation fail → กรรมการ 2/3 fail 100%

**วิธีแก้ (anthropic.ts T7-v4):**
- `SUBMIT_JUDGMENT_TOOL` — ไม่มีช่อง reply (analyst, communicator)
- `SUBMIT_JUDGMENT_TOOL_WITH_REPLY` — มี reply บังคับ (creative)
- `callJudge({ allowReply })` เลือก tool ตาม persona
- fallback: ถ้า comment หายแต่มี reply → ใช้ reply เป็น comment

**พิสูจน์ที่สเกลจริง:** 63/63 submission กรรมการครบ 3 คน (100%)

> **Lesson:** Tool Use หลาย persona ที่ต้องการ output ต่างกัน = ต้องแยก schema
> จริง optional field + คำอธิบายไม่พอกัน Haiku เลือกช่องผิด

### T7.4 เกณฑ์กรรมการ + GENERIC_CAP (judge-prompts.ts T7-v7)

3 persona:
- **The Professor** (analyst) — อาจารย์การเงิน วัดความถูกต้องของเครื่องมือ/บริบท
- **พี่เก่ง** (creative) — ตัวจริงที่ได้รับข้อความ วัด "อ่านแล้วกล้าขึ้นไหม" + เขียน reply
- **The Communicator** (communicator) — เพื่อนที่อ่านแชท วัดความเป็นภาษาคน

**GENERIC_CAP (เพิ่ม v5, จูนถึง v7):** เพดานคะแนนตามจำนวนรายละเอียดพี่เก่งที่อ้างถึง
```
รายละเอียด 5 ข้อ: เงิน 200,000 / เดือนละ 3,000 / กลัวเงินหาย /
                  คิดว่าต้องรู้เยอะ / ไม่เคยลงทุน
อ้าง 0 ข้อ → เพดาน 55   (กันคำตอบ generic สวยๆ ที่ไม่รู้จักพี่เก่ง)
อ้าง 1 ข้อ → เพดาน 78
อ้าง 2+ ข้อ → เต็มได้
```

> **Lesson:** เกณฑ์ AI ที่วัดความรู้สึกล้วน ต้องมีเพดานตัวเลขที่นับได้กำกับ
> ไม่งั้นคำตอบให้กำลังใจลอยๆ ผ่านเกณฑ์ "กล้าขึ้นไหม" ได้ทั้งที่ไม่ตรงเคส

**Known limitation:** Communicator floor 70 ไม่ทำงานเต็มที่ — คำตอบเนื้อหาครบ
บางอันได้ Communicator 5.2-6.2 (ผลจริง อันดับ 2-3) แต่อันดับรวมยังถูกต้อง

### T7.5 กติกาตัดสินเสมอ (ranking.ts T7-v2)

`compareRank()` ลำดับ tie-break:
```
1. finalScore (มาก→น้อย)
2. คะแนนพี่เก่ง (creative) — เพราะเกมวัดที่พี่เก่งกล้าเริ่มไหม
3. คะแนน Professor (analyst)
4. submitted_at (ส่งก่อนชนะ)
```

ใช้ร่วมกัน 3 จุด: จอใหญ่ (PresenterResultsScreen), admin (Top3/PlayerStatusList),
หน้าผลผู้เล่น (ResultsScreen) — comparator เดียว ผลตรงกันทุกจอ

**ผลจริง:** 10 อันดับแรกไม่มีคะแนนซ้ำเลย (กติกามีไว้เผื่อ ไม่ต้องพึ่งในโซนสำคัญ)

### T7.6 Presenter fit-to-screen (PresenterStage.tsx T7-v1)

**ปัญหา:** จอ presenter เดิมใช้ 100vw/100vh + ขนาด px ตายตัวบนพิกัด 1920×1080
→ โปรเจกเตอร์ที่ไม่ใช่ 1080p เนื้อหาล้น/โดนตัด (จอกลางห้อง scroll ไม่ได้)

**วิธีแก้ — ผืนผ้าใบคงที่ + letterbox:**
```
ผืนผ้าใบ 1920×1080 (คงที่)
scale = min(window.w/1920, window.h/1080)
ยึดกลาง: position:absolute; left:50%; top:50%;
         transform: translate(-50%,-50%) scale(s)
```

**กับดัก 2 ข้อ:**
1. ห้าม `grid place-items-center` — ไม่จัดกลางเมื่อกล่องลูก > กล่องแม่
   (ภาพเลื่อนมุมขวาล่าง) ต้อง absolute + translate
2. ห้าม vh/vw ข้างในผืนผ้าใบ — อ้างจอจริงไม่ใช่ผืน (แก้ confetti 110vh→px)

**พิสูจน์:** fit-to-screen บนโปรเจกเตอร์จริงในงานผ่าน

### T7.7 การพิมพ์ไทยบนจอใหญ่

- ตัวอักษรไทย >60px: `line-height ≥ 1.25` (ไม่งั้นวรรณยุกต์ล้นกรอบหาย)
- **ห้าม `background-clip:text` กับคำไทย** — กินวรรณยุกต์หาย
  แสงกวาด (sheen) ใช้เลเยอร์ตัวอักษรซ้อน + mask เลื่อนผ่านแทน

### T7.8 RESULTS — staged reveal

Podium เปิดทีละขั้นด้วย SPACE/click 5 จังหวะ:
`อันดับ 3 → 2 → แชมป์(confetti) → ข้อความแชมป์ → อันดับ 4-10`
- state ฝั่ง client ล้วน (ไม่แตะ DB/phase)
- กันกดรัว 600ms · กดย้อนไม่ได้
- เปิด presenter ใหม่กลาง RESULTS = state กลับ 0 (trade-off ที่ยอมรับ)

### T7.9 config (games.config jsonb)

```
writingTimeSeconds: 300   (5 นาที)
pitchMinLength:      80
pitchMaxLength:     1500
```
> **สำคัญ:** ค่าใน DB ชนะ DEFAULT ในโค้ดเสมอ — เปลี่ยนเวลาต้องรัน SQL

### T7.10 /try (Solo mode)

ปัจจุบัน redirect → /play (app/try/page.tsx T7-v1)
เหตุผล: จอ solo (components/solo/*) ยังเป็นเนื้อหา MEXPO แต่ judge prompt
เป็นเคสพี่เก่งแล้ว — ปล่อยไว้จะเจอโจทย์หุ้นแต่กรรมการตัดสินเรื่องพี่เก่ง
**Batch 5 (หลังงาน):** แปลง solo เป็นเคสพี่เก่ง เอา redirect ออก

---

## §T7.11 ผลการใช้งานจริง (5 ส.ค. 2026)

| | |
|---|---|
| คนเข้าห้อง / ส่ง | 67 / 63 (94%) |
| ตัดสินสำเร็จ | 63/63 · กรรมการครบ 3 คน 100% |
| การกระจายคะแนน | 43 distinct / 63 · avg 5.37 · max 8.03 |
| คะแนนซ้ำ 10 อันดับแรก | 0 คู่ |
| แนวคำตอบที่ชนะ | ตรงเคสทั้ง Top 5 (GENERIC_CAP ทำงาน) |
| fit-to-screen โปรเจกเตอร์ | ผ่าน |
| ปัญหาหน้างาน | ไม่มี (2 submission ได้ 0 = auto-submit ข้อความว่าง ถูกต้อง) |

Production tag: `t7-v7` (annotated, verified) · Model: claude-haiku-4-5
