# CODE-FILE-MAP v1.3 — pitch-game

**Repo:** github.com/marketwars-game/pitch-game
**Production:** pitch-game-two.vercel.app (deploy จาก branch `main`)
**อัปเดตล่าสุด:** หลังงาน KTC (5 ส.ค. 2026) · production tag `t7-v7`
**เวอร์ชันก่อนหน้า:** v1.2 (หลัง T5)

> การเปลี่ยนแปลงใน v1.3: บันทึกไฟล์ทั้งหมดที่ขยับใน T7 (LINE หาพี่เก่ง)
> รวม 36 ไฟล์ที่แก้/สร้าง · ลบ 4 ไฟล์ · เพิ่มโฟลเดอร์ solo (ยังไม่ใช้ รอ Batch 5)

---

## ไฟล์ทั้งหมด 68 ไฟล์ (src/)

### lib/ (9)
| ไฟล์ | เวอร์ชัน T7 | หมายเหตุ |
|---|---|---|
| lib/types.ts | T7-v2 | + CaseData, ToolItem, JudgeScore.reply, config 300/80/1500 |
| lib/stock-data.ts | T7-v1 | CASE_KENG + TOOLBOX 7 ชิ้น + buildToolboxPromptBlock |
| lib/judge-prompts.ts | **T7-v7** | persona พี่เก่ง + GENERIC_CAP + score floors (จูน v5→v7) |
| lib/anthropic.ts | T7-v4 | แยก tool 2 ตัว (per-persona) + fallback comment←reply |
| lib/ranking.ts | T7-v2 | compareRank / resolveFinalScore / formatScoreCompare |
| lib/presenter-config.ts | T7-v2 | QR ชี้ URL ตรง + ข้อความกรรมการ + stream snippets + BRAND |
| lib/supabase.ts | (ไม่แตะ) | client |
| lib/solo-utils.ts | (ไม่แตะ) | ใช้โดย solo mode / /try |

### app/ (12)
| ไฟล์ | เวอร์ชัน T7 | หมายเหตุ |
|---|---|---|
| app/layout.tsx | T7-v1 | metadata "LINE หาพี่เก่ง — DIME × KTC" (ทุกหน้า) |
| app/page.tsx | (ไม่แตะ) | landing redirect |
| app/play/page.tsx | (ไม่แตะ) | player entry |
| app/presenter/page.tsx | T7-v1 | metadata |
| app/presenter/presenter.css | T7-v2 | + T7 SECTION (~200 คลาส .t7-*) + RESULTS + confetti vh→px |
| app/admin/page.tsx | (ไม่แตะ) | admin entry |
| app/board/page.tsx | (ไม่แตะ) | board view |
| app/try/page.tsx | T7-v1 | redirect → /play (ชั่วคราว, รอ Batch 5) |
| app/globals.css | (ไม่แตะ) | |
| app/api/judge/route.ts | T7-v3 | toScore10 + allowReply (creative เท่านั้น) |
| app/api/judge-solo/route.ts | T7-v2 | สเกลคะแนน + DEFAULT_CASE |
| app/api/admin/auth/route.ts | (ไม่แตะ) | |

### components/player/ (8)
| ไฟล์ | เวอร์ชัน T7 | หมายเหตุ |
|---|---|---|
| KengChat.tsx | T7-v1 | **ใหม่** — ชิ้นส่วนแชท LINE ใช้ร่วม 3 จอ |
| ToolTray.tsx | T7-v1 | **ใหม่** — กล่องเครื่องมือ 7 ชิ้น |
| WritingScreen.tsx | T7-v1 | เขียนใหม่ — LINE layout |
| JudgingScreen.tsx | T7-v1 | เขียนใหม่ — หน้าแชทรอตัดสิน |
| ResultsScreen.tsx | T7-v2 | องก์ 1 + ranking.ts + 2 ทศนิยม |
| LobbyScreen.tsx | T7-v1 | hero + คำโปรย + DIME × KTC |
| PlayerView.tsx | T7-v1 | JUDGING ไม่ห่อ ScrollBody |
| (StockCard.tsx) | **ลบแล้ว** | เลิกใช้ตั้งแต่ Batch 2 |

### components/presenter/ (8 + ลบ 3)
| ไฟล์ | เวอร์ชัน T7 | หมายเหตุ |
|---|---|---|
| PresenterStage.tsx | T7-v1 | **ใหม่** — FitStage (fit-to-screen) |
| PresenterChrome.tsx | T7-v1 | **ใหม่** — T7Ambient + T7TopBar (แทน Header เดิม) |
| PresenterLandingScreen.tsx | T7-v1 | เขียนใหม่ — บับเบิลพี่เก่งพิมพ์วน |
| PresenterLobbyScreen.tsx | T7-v1 | เขียนใหม่ — ชื่อครบทุกคน + QR popup |
| PresenterWritingScreen.tsx | T7-v1 | เขียนใหม่ — วงแหวน + เครื่องมือ + urgent mode |
| PresenterJudgingScreen.tsx | T7-v1 | เขียนใหม่ — stream พื้นหลัง + 3 กรรมการ |
| PresenterResultsScreen.tsx | T7-v1 | เขียนใหม่ — podium เปิดทีละขั้น (SPACE) |
| PresenterView.tsx | T7-v1 | ห่อทุก phase ด้วย PresenterStage |
| (PresenterHeader.tsx) | **ลบแล้ว** | แทนด้วย PresenterChrome |
| (PresenterAmbientBg.tsx) | **ลบแล้ว** | แทนด้วย T7Ambient |
| (PresenterCountdown.tsx) | **ลบแล้ว** | WritingScreen ใช้ useCountdown ตรง |

### components/admin/ (14)
| ไฟล์ | เวอร์ชัน T7 | หมายเหตุ |
|---|---|---|
| AdminTopBar.tsx | T7-v1 | DIME × KTC |
| AdminAuthGate.tsx | T7-v1 | DIME × KTC |
| PrimaryActionButton.tsx | T7-v1 | ตัดคำว่า Pitch → ข้อความ, เวลา 5:00 |
| Top3Leaderboard.tsx | T7-v1 | compareRank + 2 ทศนิยม |
| PlayerStatusList.tsx | T7-v1 | compareRank |
| PlayerDetailModal.tsx | T7-v1 | ชื่อกรรมการใหม่ + ข้อความพี่เก่งตอบ |
| PlayerRow.tsx | T7-v1 | 2 ทศนิยม |
| StockPicker.tsx | T7-v1 | เคสพี่เก่ง |
| AdminDashboard.tsx | T7-v1 | |
| AdminPanel.tsx / ConfirmResetModal / ConfirmRevealModal / CountdownDisplay / GameControlPanel / JudgingProgress / PhaseIndicator | (ไม่แตะ) | |

### components/board/ (1) · components/solo/ (5)
| ไฟล์ | หมายเหตุ |
|---|---|
| board/BoardView.tsx | (ไม่แตะ) — จอ board แยกจาก presenter |
| solo/*.tsx (5 ไฟล์) | (ไม่แตะ) — /try redirect ทิ้งชั่วคราว รอ Batch 5 แปลงเป็นเคสพี่เก่ง |

### hooks/ (11)
| ไฟล์ | เวอร์ชัน T7 | หมายเหตุ |
|---|---|---|
| usePhaseControl.ts | T7-v1 | applyStock รับ CaseData |
| useCountdown / useGameState / usePlayer / usePlayerStatus / usePresenterState / useSubmission / useAdminAuth | (ไม่แตะ) | engine/state/realtime |
| useSoloBoard / useSoloFlow | (ไม่แตะ) | solo mode |

---

## สรุปการเปลี่ยนแปลง v1.2 → v1.3

- **แก้/สร้าง:** 36 ไฟล์ (ดูตารางเวอร์ชัน T7-v* ข้างบน)
- **สร้างใหม่ 4:** KengChat, ToolTray, PresenterStage, PresenterChrome
- **ลบ 4:** StockCard, PresenterHeader, PresenterAmbientBg, PresenterCountdown
- **ไม่แตะ:** engine, state machine, realtime, solo mode, board
- **จำนวนไฟล์รวม:** 68 (จาก 72 ก่อน T7 − ลบ 4 + สร้าง 4 = ยอดสุทธิเท่าเดิม... 
  หมายเหตุ: การนับจริงจาก `find src` = 68 ไฟล์ .ts/.tsx/.css)
