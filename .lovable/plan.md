## Goal

Create two cold-outreach marketing artifacts for **CollabAI Control Tower**, targeting decision-makers at legal, accounting, and financial services firms:

1. A hybrid "clickbait" cold email
2. A short 10-slide pitch deck (PPTX + PDF)

Both drive to **https://collabai.software/book-demo**.

---

## Deliverables

All files written to `/mnt/documents/` and delivered as downloadable artifacts.

| File | Format | Purpose |
|---|---|---|
| `collabai-cold-email.md` | Markdown | Copy/paste into Gmail, Outlook, HubSpot |
| `collabai-cold-email.html` | HTML | Drop into SendGrid, Mailchimp, Apollo |
| `collabai-pitch-deck.pptx` | PowerPoint | Attach or present live |
| `collabai-pitch-deck.pdf` | PDF | Email-friendly leave-behind |

---

## 1. Cold Email (hybrid clickbait)

**Subject line A/B options (3 variants):**
- "Your competitors already have private AI agents — do you?"
- "ChatGPT is costing your firm $108K/year. There's a better way."
- "The AI your partners *wish* you'd give them"

**Preview text:** "Private AI agents. Behind your firewall. Built for legal, accounting, and financial firms."

**Body (~150 words):**
1. Hook — "Your associates are pasting client data into ChatGPT right now."
2. Stakes — privilege, compliance, audit-trail risk
3. Reframe — CollabAI Control Tower as the private alternative
4. 3 proof bullets:
   - Pre-built agents (Legal Research, Tax Advisor, Contract Analyzer)
   - 100% behind your firewall (SOC 2, HIPAA-ready)
   - Starts at $4K/yr vs $108K for ChatGPT Enterprise
5. Soft CTA — "Worth 15 minutes to see what your team could do with it?"
6. Button → `https://collabai.software/book-demo`
7. PS — deck attached + live sandbox URL

Industry-swap tokens (`{{INDUSTRY}}`, `{{PAIN_POINT}}`) included so the same email works for legal, accounting, and financial prospects with one find-and-replace.

---

## 2. Pitch Deck (10 slides, 1920×1080)

Brand-matched to the live product: deep navy `#0F172A`, electric cyan `#06B6D4`, white text, subtle grid, pulsing AI-indicator motif. Dark/light "sandwich" rhythm.

| # | Slide | Visual |
|---|---|---|
| 1 | "Your AI Agents. One Control Center." | Full-bleed dark, glowing badge |
| 2 | The Problem — scattered AI, leaking client data | 4-icon grid |
| 3 | The Risk — privilege/HIPAA/SOC 2 stat callouts | Large amber-accented numbers |
| 4 | The Solution — Control Tower diagram | Hub-and-spoke: agents → firewall → data |
| 5 | Pre-Built AI Agents | 6-card grid (Legal Research, Tax Advisor, Contract Analyzer, Meeting Intel, Knowledge Search, Client CRM) |
| 6 | Private by Design | Firewall boundary + SOC2/HIPAA badges |
| 7 | vs ChatGPT Enterprise vs Copilot | Comparison table (from `PricingPreview.tsx`) |
| 8 | Outcomes — 10x faster, 70% response-time drop, $104K saved | 3 big stats |
| 9 | Pricing — "Starting at $4K/yr" vs competitor anchors | Big number + 3 bullets |
| 10 | CTA — "See it live in 15 minutes" | `collabai.software/book-demo` + QR code |

**Design tokens:** Outfit Bold headers, Inter body, palette `#0F172A` / `#06B6D4` / `#FFFFFF` / `#F59E0B`. Pulsing-dot motif in every footer.

---

## Technical Plan

1. Write `.md` + `.html` email files directly.
2. Read `tailwind.config.ts` and `src/index.css` to lock exact product hex values.
3. Generate `.pptx` via `pptxgenjs` (install globally), embed images as base64.
4. Convert to PDF via LibreOffice (`run_libreoffice.py`).
5. **Mandatory visual QA** (per PPTX skill): render every slide to JPG with `pdftoppm`, inspect each for overflow / contrast / alignment / leftover placeholder text, fix and re-verify.
6. Deliver all 4 files as `<presentation-artifact>` tags.

No app code is modified — pure marketing artifact task.

---

Approve and I'll build all four files in one pass.