# Projector Fit-to-Screen — ปัญหา แนวคิด และโค้ด (FitStage)

**ที่มา:** Market Wars / YoungGen Portfolio Challenge · Task `B21` (Kids Camp) · port มาจาก `YG-V2` (YoungGen)
**ขอบเขต:** เป็น **layout fix ล้วน** — ไม่แตะ DB / API / realtime / sound / game logic

---

## 1. ปัญหาที่เจอจริง

จอโปรเจกเตอร์ในเกมเป็น "จอกลางของห้อง" ที่ทุกคนดูพร้อมกัน ข้อกำหนดคือ **ห้าม scroll เด็ดขาด** — ไม่มีใครไปเลื่อนจอกลางงานได้ ทุกอย่างต้องพอดีในหน้าจอเดียวเสมอ

อาการที่เจอ:
- ออกแบบ/ทดสอบบน 1920×1080 → สวยพอดี
- พอเอาไปต่อโปรเจกเตอร์จริง → **เนื้อหาล้น / โดนตัดขอบล่าง / ต้อง scroll**
- เปิดในหน้าต่างเบราว์เซอร์ที่ไม่เต็มจอ → เพี้ยนอีกแบบ
- โปรเจกเตอร์บางตัวมีแถบดำ อัตราส่วนไม่ใช่ 16:9 เป๊ะ → เพี้ยนอีกแบบ

### สาเหตุ (วิธีเดิมที่ผิด)
เดิมใช้ CSS `zoom` คำนวณจาก **ความกว้างอย่างเดียว**:

```js
// ❌ วิธีเดิม (B15) — ผิด
const zoom = Math.min(window.innerWidth / 1280, 1.5);
```

ปัญหาเชิงตรรกะคือ **มันไม่รู้จักความสูงเลย** พอจอเตี้ยกว่าอัตราส่วนที่ออกแบบไว้ ความกว้างพอดีแต่ความสูงล้น → เกิด scroll
ซ้ำร้ายคือ `zoom` ไปครอบ container ที่เป็น `h-screen` ซึ่งความสูงยังอ้างอิงหน้าจอจริง ไม่ได้อ้างอิง canvas ที่ออกแบบ → สองระบบพิกัดตีกัน

---

## 2. แนวคิดที่ใช้แก้ — "Fixed Canvas + Letterbox"

หลักคิดยืมมาจากวงการเกม/วิดีโอ:

> **หยุดออกแบบให้ responsive กับจอ — ออกแบบบนผืนผ้าใบขนาดคงที่ แล้วย่อ/ขยายทั้งผืนให้พอดีจอ**

```
         viewport จริง (เท่าไหร่ก็ได้)
   ┌──────────────────────────────────────┐
   │        แถบดำ (letterbox)             │
   │  ┌────────────────────────────────┐  │
   │  │                                │  │
   │  │   canvas 1280 × 720 คงที่       │  │  ← เนื้อหาทั้งหมดอยู่ในนี้
   │  │   transform: scale(s)          │  │     ออกแบบด้วยพิกัดนี้ตัวเดียว
   │  │                                │  │
   │  └────────────────────────────────┘  │
   │        แถบดำ (letterbox)             │
   └──────────────────────────────────────┘

   s = min(viewportW / 1280, viewportH / 720)
```

**ผลที่ได้:**
- เนื้อหาพอดีจอเสมอ ทุกความละเอียด ทุกอัตราส่วน ไม่มี scroll ตลอดกาล
- ออกแบบครั้งเดียวบนพิกัด 1280×720 — ไม่ต้องทำ breakpoint ไม่ต้องเทส 5 ความละเอียด
- อัตราส่วนไม่บิดเบี้ยว (scale เท่ากันทั้งแกน X และ Y) เหลือแค่แถบดำบน-ล่างหรือซ้าย-ขวา
- ทดสอบบนหน้าต่างเล็กในเครื่องตัวเอง = เห็นภาพเดียวกับโปรเจกเตอร์เป๊ะ (แค่เล็กลง)

**ทำไมเลือก `min()` ไม่ใช่ `max()`:** `min` = ให้พอดีด้านที่คับที่สุด → เนื้อหาอยู่ครบ มีแถบดำ · `max` = เต็มจอแต่เนื้อหาโดนตัด (แบบ `object-fit: cover`) ซึ่งรับไม่ได้สำหรับจอที่ต้องอ่านข้อมูล

---

## 3. โค้ด

### 3.1 คอมโพเนนต์ `FitStage`

```tsx
// FILE: components/display/FitStage.tsx
// Fixed 1280×720 canvas scaled to fit any viewport (letterbox)
'use client';

import type { ReactNode } from 'react';

export const STAGE_W = 1280;
export const STAGE_H = 720;

export default function FitStage({ scale, children }: { scale: number; children: ReactNode }) {
  return (
    <div className="fixed inset-0 bg-[#0D1117] overflow-hidden grid place-items-center">
      <div
        style={{
          width: STAGE_W,
          height: STAGE_H,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          flex: '0 0 auto',
        }}
      >
        {children}
      </div>
    </div>
  );
}
```

จุดสำคัญของ 12 บรรทัดนี้:
| ส่วน | ทำไมต้องมี |
|---|---|
| `fixed inset-0` | ยึดเต็ม viewport ไม่สนใจ document flow |
| `overflow-hidden` | ตัดส่วนเกินตอนคำนวณคลาดเคลื่อน 1px — กัน scrollbar โผล่เด็ดขาด |
| `grid place-items-center` | จัดผืนผ้าใบไว้กลางจอ → แถบดำแบ่งเท่ากันทั้งสองข้าง |
| `width/height` เป็นตัวเลขคงที่ | นี่คือหัวใจ — ลูกทุกตัวเห็น "จอ" ขนาด 1280×720 เสมอ |
| `transformOrigin: center center` | ย่อ/ขยายออกจากจุดกลาง (ถ้าเป็น `top left` ผืนผ้าใบจะเบียดไปมุม) |
| `flex: '0 0 auto'` | กัน parent layout ไปยืด/หดผืนผ้าใบ |
| สีพื้นระบุตรงๆ `#0D1117` | ไม่พึ่ง Tailwind token — Tailwind arbitrary class เคยโดน purge ใน production |

> **`transform: scale()` ไม่กระทบ layout metric** — เป็น visual transform ล้วน ลูกทุกตัวยัง `getBoundingClientRect` / `clientHeight` ได้ค่าตามพิกัด 1280×720 จริง (ข้อนี้สำคัญมาก ดูข้อ 4)

### 3.2 การคำนวณ scale (ในหน้า display)

```tsx
const [zoom, setZoom] = useState(1);

useEffect(() => {
  const updateZoom = () =>
    setZoom(Math.min(window.innerWidth / 1280, window.innerHeight / 720));
  updateZoom();
  window.addEventListener('resize', updateZoom);
  return () => window.removeEventListener('resize', updateZoom);
}, []);
```

⚠️ ต้องอยู่ใน `useEffect` เพราะ `window` ไม่มีตอน SSR (Next.js) — ค่าเริ่มต้น `1` แล้วค่อยแก้ฝั่ง client

### 3.3 การนำไปห่อ

ห่อ **ทุก phase block** ไม่ใช่ห่อครั้งเดียวรอบทั้งแอป (เพราะแต่ละ phase เป็น layout คนละแบบ):

```tsx
let content;
if (phase === 'lobby') {
  content = <FitStage scale={zoom}><LobbyDisplay … /></FitStage>;
} else if (phase.startsWith('final')) {
  content = (
    <FitStage scale={zoom}>
      <div className="w-full h-full bg-[#0D1117] text-white">
        <FinalDisplay … />
      </div>
    </FitStage>
  );
} else {
  content = (
    <FitStage scale={zoom}>
      <div className="w-full h-full flex flex-col overflow-hidden">
        <DisplayHeader … />
        <div className="flex-1 flex flex-col items-center justify-center overflow-hidden px-6 py-3">
          {/* เนื้อหาแต่ละ phase */}
        </div>
      </div>
    </FitStage>
  );
}
```

---

## 4. ชั้นที่สอง — เมื่อ "เนื้อหาเองก็ไม่แน่นอน"

FitStage แก้ปัญหา *จอไม่แน่นอน* ได้ แต่ยังมีอีกปัญหาคนละเรื่อง: **เนื้อหาไม่แน่นอน**

ตัวอย่างจริง: จอ Final Ranking ต้องแสดงผู้เล่น **ทุกคน** — บางรอบ 20 คน บางรอบ 74 คน ต่อให้ผืนผ้าใบคงที่ 720px เนื้อหาก็ยังล้นอยู่ดี

วิธีแก้คือ **scale-to-fit ชั้นในอีกที** — วัดความสูงจริงแล้วย่อเฉพาะก้อนนั้น:

```tsx
const boxRef = useRef<HTMLDivElement>(null);   // กล่องที่มีพื้นที่จำกัด
const gridRef = useRef<HTMLDivElement>(null);  // เนื้อหาที่อาจล้น
const [scale, setScale] = useState(1);

useEffect(() => {
  const fit = () => {
    const box = boxRef.current, g = gridRef.current;
    if (!box || !g) return;
    const avail = box.clientHeight;
    const natural = g.scrollHeight;  // ไม่ได้รับผลจาก transform → เป็นความสูงเต็มเสมอ
    const s = natural > avail && natural > 0 ? Math.max(0.5, avail / natural) : 1;
    setScale(s);
  };
  const raf = requestAnimationFrame(fit);
  const t = setTimeout(fit, 150);   // เผื่อ emoji/ฟอนต์โหลดเสร็จค่อยวัดซ้ำ
  window.addEventListener('resize', fit);
  return () => { cancelAnimationFrame(raf); clearTimeout(t); window.removeEventListener('resize', fit); };
}, [content, cols]);

// …
<div ref={gridRef} style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}>
```

**สองชั้นนี้ทำงานร่วมกันได้โดยไม่ตีกัน** เพราะชั้นในวัดเป็น px จริงในกล่อง 720 (transform ของ FitStage ไม่กระทบ layout metric):
```
เนื้อหา N คน  ──[scale-to-fit]──▶  พอดีกล่อง 720  ──[FitStage]──▶  พอดีจอจริง
```

รายละเอียดที่ต้องระวังในชั้นนี้:
- ใช้ `scrollHeight` ไม่ใช่ `clientHeight` (ต้องการความสูง "ธรรมชาติ" ก่อนถูกตัด)
- `Math.max(0.5, …)` — กันย่อจนอ่านไม่ออก ถ้าชนเพดานแปลว่า design ต้องเปลี่ยน layout ไม่ใช่ย่อต่อ
- วัดซ้ำหลัง 150ms เพราะ emoji/webfont โหลดช้ากว่า first paint แล้วทำความสูงขยับ
- `transformOrigin: 'top center'` (ไม่ใช่ center center) เพราะอยากให้ยึดหัวตารางไว้

---

## 5. กับดักที่เจอตอนทำจริง (สำคัญที่สุดถ้าจะเอาไปใช้ต่อ)

### 5.1 🔴 `h-screen` เป็นศัตรูของ FitStage
นี่คือบั๊กที่กินเวลามากที่สุด และเจอซ้ำ **สองครั้ง** ทั้งสองโปรเจกต์

ทุก component ที่อยู่ **ข้างใน** FitStage ต้องใช้ `h-full` ไม่ใช่ `h-screen`:

```
❌ h-screen  → 100vh = ความสูงจอจริง (1080px) แต่กล่องแม่สูง 720 → ล้น
✅ h-full    → 100% ของกล่องแม่ = 720 → พอดี
```

อาการหลอกคือ **บนจอ 720p จะดูปกติ** (เพราะ 100vh บังเอิญ = 720) แต่พอเสียบโปรเจกเตอร์ 1080p ถึงจะล้น
วิธีตรวจ: `grep -rn "h-screen" components/display/` แล้วไล่ทีละไฟล์ — อย่าเชื่อเอกสาร port ให้เชื่อ grep

**ยกเว้น:** จอที่อยู่ *นอก* FitStage (loading, room-not-found) ใช้ `h-screen` ได้ตามปกติ

### 5.2 Grid `1fr` + จำนวนน้อย = ช่องยืดเต็มจอ
Grid ที่ออกแบบมา fit-all จะพังตอนคนน้อย:
```
เดิม: 3 คน → cols 6, rows = ceil(3/6) = 1 → gridTemplateRows: repeat(1, 1fr)
     → 3 ช่อง กว้าง 1/6 แต่ สูงเต็มจอ (ดูเหมือนบั๊กซ้อนกัน)

แก้: cols = Math.max(1, Math.min(tier.cols, N))
     + เพดาน px ต่อช่อง (เช่น 230×150) + margin: auto
```
บั๊กแบบนี้ **ซ่อนตัวได้ในงานจริง** (คนเยอะไม่เจอ) แล้วโผล่ตอน dry-run ห้องเล็ก 3 คน — ต้องเทสทั้งสองปลาย

### 5.3 อย่าตัดสินขนาดฟอนต์จาก mock ในจอคอม
mock บนหน้าจอโน้ตบุ๊ก ≈ **1/3** ของโปรเจกเตอร์จริง สิ่งที่ดู "ใหญ่ไป" ในคอม มักจะ "พอดี" บนผนัง — ต้องไปยืนดูท้ายห้องจริงเท่านั้น

### 5.4 ข้อจำกัดอื่นของจอโปรเจกเตอร์ (นอกเรื่อง fit แต่มาคู่กันเสมอ)
- ข้อความห้ามจางกว่า `rgba(255,255,255,0.65)` — โปรเจกเตอร์ทำให้สีจางลงอีก
- สีที่ต้องแยกจากกันต้องต่างทั้ง **hue และความสว่าง** (โปรเจกเตอร์ desaturate + brighten สีที่ hue ใกล้กันจะกลืนหมด)
- Tailwind arbitrary color (`text-[#hex]`) โดน purge ใน production → ใช้ inline style
- ความสูงที่ต้อง responsive ให้วัดด้วย `ResizeObserver` อย่า hardcode px

---

## 6. สรุปสำหรับอธิบายอีกโปรเจกต์ (3 บรรทัด)

1. **ปัญหา:** จอกลางห้องห้าม scroll แต่โปรเจกเตอร์/หน้าต่าง/อัตราส่วน ไม่เคยตรงกับที่ออกแบบไว้ — การ scale จากความกว้างอย่างเดียวแก้ไม่ได้
2. **วิธีแก้:** ออกแบบบน canvas ขนาดคงที่ 1280×720 แล้ว `transform: scale(min(w/1280, h/720))` แบบ letterbox — ออกแบบครั้งเดียว พอดีทุกจอ (โค้ดหลักคือคอมโพเนนต์ ~12 บรรทัด)
3. **ถ้าเนื้อหาเองก็ไม่คงที่** (เช่น N คน) ให้ซ้อน scale-to-fit อีกชั้นที่วัด `scrollHeight` เทียบ `clientHeight` — สองชั้นทำงานร่วมกันได้เพราะ transform ไม่กระทบ layout metric
4. **กับดักอันดับหนึ่ง:** ทุกอย่างข้างใน canvas ต้องเป็น `h-full` ไม่ใช่ `h-screen` — พลาดข้อนี้จะดูปกติบนจอ dev แล้วพังบนโปรเจกเตอร์จริง

**อ้างอิงโค้ดจริง:**
`components/display/FitStage.tsx` · `app/display/[roomId]/page.tsx` (การคำนวณ scale + การห่อ) · `components/display/FinalRanking.tsx` (scale-to-fit ชั้นใน) — repo: `github.com/marketwars-game/market-wars`
