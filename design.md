# Reveal — Design System & Anti-AI Guidelines

**Owner:** Mikey Itua  
**Category:** Church Live-Service Technology (Real-Time Scripture Presentation)  
**Paper Canvas:** [Reveal Design & Tokens on Paper](https://app.paper.design/file/01KZK8JYH7TFYZHE85J6MD1KP4/1-0)

---

## 🏛️ Design Vision & Philosophy

Reveal is a live-service presentation app that captures sermon audio, transcribes it on-device, detects Bible references, and projects scriptures full-screen without a network connection.

The UI is divided into two operational spaces:
1. **Full-Screen Projector View (Stage / Sanctuary Output):** High contrast, sacred minimal, zero glare background, ultra-legible typography for congregation viewing from 100+ feet away.
2. **Operator Control Dashboard (Stage Laptop / Sound Booth):** Pro-AV media console for audio feed monitoring, live streaming transcript logs, and 1-tap verse confirmation.

---

## 🚫 The 8 Strict Anti-AI Design Rules (Mandatory)

Any agent or developer working on Reveal MUST strictly follow these 8 design rules:

| Rule | Requirement |
|---|---|
| **1. No Bold Font Weights** | Maximum font weight is **SemiBold (600)** or Medium (500)/Regular (400). Never use 700 Bold, 800 ExtraBold, or 900 Heavy. |
| **2. Reduced Letter Spacing (-3%)** | All headings, section titles, and reference badges MUST use `letter-spacing: -0.03em`. |
| **3. No Blurs, Glows, or Shadows** | Zero `backdrop-filter: blur()`, zero glowing box-shadows, zero drop shadows. Pure spatial clarity. |
| **4. Distinct Typefaces** | Use **`Figtree`** for headings and **`Geist`** for body/scripture/data. Never use generic fonts like Inter, Playfair Display, Cinzel, or Roboto. |
| **5. No Random Italics or Sentence Highlights** | No italicized sentence words. No colored background text marker highlights inside paragraphs. |
| **6. No Em-Dashes (`—`)** | Use simple hyphens (`-`) or spaced dots (`•`). Never use em-dashes. |
| **7. Restrained Border Radiuses** | Max `8px` corner radius for panels and cards. No overly curved bubble cards. |
| **8. No Colored Border Lines / Stripes** | Zero colored side-stripes (e.g. `border-left: 3px solid #19A7CE`), zero colored border outlines around cards. |

---

## 🎨 Color Palette Tokens (Oceanic Midnight)

```css
:root {
  --color-bg-page: #000B14;        /* Deepest Midnight Oceanic Page Base */
  --color-surface-card: #051929;   /* Clean Panel Surface (No colored borders) */
  --color-surface-fill: #0A273D;   /* Subtle Neutral Container Fill */
  --color-border-divider: rgba(255, 255, 255, 0.04); /* Ultra-subtle neutral grid lines */
  --color-text-primary: #FCF7F0;   /* Soft Warm Ivory Scripture Text */
  --color-text-muted: #8D9AA6;     /* Refined Slate Sand for metadata & logs */
  --color-accent-primary: #19A7CE; /* Electric Cyan Primary Accent */
  --color-accent-dark: #0F637A;    /* Dark Cyan for active/hover states */
  --color-status-success: #12D453; /* Vibrant Pulse Green for active audio feed */
  --color-neutral-fill: #D6D6D6;   /* Placeholder fill and neutral icons */
}
```

---

## 🔤 Typography & Font Weight Rules

```css
:root {
  --font-heading: 'Figtree', sans-serif;
  --font-body: 'Geist', sans-serif;
  --letter-spacing-heading: -0.03em;
  --font-weight-max: 600; /* SemiBold MAX */
}
```

* **Headings & Display Badges:** `font-family: var(--font-heading); font-weight: 600; letter-spacing: -0.03em;`
* **Scripture Verse Body:** `font-family: var(--font-body); font-weight: 400; line-height: 1.65; color: var(--color-text-primary);`
* **Numerical Readouts & Timestamps:** `font-family: var(--font-body); font-variant-numeric: tabular-nums;`

---

## 📐 Border Radius Scale

```css
:root {
  --radius-sm: 6px;    /* Small inputs & metadata tags */
  --radius-md: 8px;    /* Action buttons & cards */
  --radius-lg: 12px;   /* Main panel containers */
  --radius-pill: 9999px; /* Stage reference badges & status pills */
  --gap-container: 12px;  /* Tightened container grid gaps for AV console density */
  --padding-page-inline: 24px; /* Outer dashboard horizontal margin */
  --padding-card-inner: 18px; /* Internal panel container padding */
}
```

### 🎛️ Button Component Sizing & Styling Specifications

| Component | Background | Text Color | Font & Weight | Size / Line-Height | Padding | Border & Shadow |
|---|---|---|---|---|---|---|
| **`PrimaryButton`** | Electric Cyan (`#19A7CE`) | Soft Ivory (`#FCF7F0`) | `Figtree`, SemiBold 600 (`-0.03em`) | `15px` / `18px` | `14px 28px` (`paddingBlock: 14px`, `paddingInline: 28px`) | Radius `8px`, `box-shadow: inset 0 -2px 0 rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.25)` |
| **`SecondaryButton`** | Subtle Dark Fill (`#0A273D`) | Refined Slate (`#8D9AA6`) | `Geist`, Medium 500 | `14px` / `18px` | `14px 22px` (`paddingBlock: 14px`, `paddingInline: 22px`) | Radius `8px`, `border: 1px solid rgba(255, 255, 255, 0.06)` |

* **Animated Border Beam:** Primary buttons reveal a bottom traveling `<BorderBeam size="line" colorVariant="sunset">` on hover (`opacity: 0` -> `opacity: 1` transition).
* **DialKit Live Controls Integration:** Configured with new defaults (`size: "line"`, `colorVariant: "sunset"`, `color.beamColor: "#0011ff"`, `duration: 2`, `tuning.strength: 1`, `tuning.brightness: 2.5`, `tuning.saturation: 3`, `tuning.hueRange: 45`, `tuning.borderRadius: 9999`). All parameters dynamically update the border beam on hover in real time.



---

## 🖥️ Screen Layout Specifications

### **1. Full-Screen Projector Output (`1920 × 1080 px`)**
* **Background:** Solid `#000B14` pitch dark.
* **Header Tag:** `#051929` pill background with `#19A7CE` `Figtree` 600 text (`JOHN 3:16-17`) and `-0.03em` tracking.
* **Scripture Text:** `Geist` 44px, Regular 400 weight, `#FCF7F0` text, line-height `1.65`. Verse numbers in `Figtree` 600 `#19A7CE` superscript.
* **Footer Status:** 7px `#12D453` green dot with `#8D9AA6` `Geist` 500 text (`REVEAL LIVE • SALFORD YOUNG ADULTS`).

### **2. Operator Control Dashboard (`1440 × 900 px`)**
* **Top Navbar:** `#051929` background with 1px `rgba(255,255,255,0.04)` bottom divider. `#19A7CE` brand logo, `#12D453` mic feed badge, and `MANUAL CONFIRM` vs `AUTO-PUSH` mode toggle.
* **Left Column:** Live audio decibel VU meters + real-time sermon transcript stream with inline `#19A7CE` detection tags.
* **Right Column:** **16:9 Aspect Ratio Live Stage Output Preview Monitor** (`aspect-ratio: 16 / 9;` — e.g. 320×180px or 400×225px) showing 1:1 true-to-scale live slide output currently visible on congregation TV/Projector + 1-tap `PUSH TO SCREEN` Electric Cyan action card.


---

## 🏠 Homepage / Landing & Main Screen Spec

Reveal has **two operator-facing surfaces**, plus the congregation Projector View (already specified above). This separation is deliberate and is the key difference from PewBeam, which crams transcript + program + output + bible browser into one dense studio.

- **Landing Screen (pre-service homepage)** — what the operator sees on first open, or whenever no session is active.
- **Operator Control Dashboard (live main screen)** — what replaces the Landing the moment `START SESSION` is pressed. This is the §2 layout above; the homepage simply transitions into it. There is no persistent "home tab" while live — keep the operator inside the console.

### Landing Screen layout (1440 × 900, desktop-first)

*Top bar* — `#051929` bar, 1px `rgba(255,255,255,0.04)` bottom divider:
- `REVEAL` wordmark — `#19A7CE`, Figtree 600, -0.03em
- `OPERATOR CONTROL` pill (muted until a session starts)
- Right: `WEB Offline Cached` status pill with `#12D453` dot

*Hero / primary action* — centered:
- `START SESSION` — primary button, `#19A7CE` bg, `#FCF7F0` text, radius-md (8px), Figtree 600. The single highest-emphasis action on the page.

*Setup cluster* — three equal cards (`#051929` surface, radius-lg 12px, **no colored borders** — Rule 8):
1. **Audio input** — device selector (Room Mic default; Desk/USB feed in V1.1 per PRD §12) + a live level meter (green `#12D453` when signal present, neutral `#D6D6D6` when silent).
2. **Theme preset** — three swatches: Sacred Obsidian (default), Minimalist Monolith, Warm Sanctuary. Mirrors the Theme Presets artboard.
3. **Service label** — text input, placeholder `Salford Young Adults`; value drives the Projector View footer.

*Status row* — small muted (`#8D9AA6`, Geist 500) line: `WEB cached ✓` · `Whisper model cached ✓` · `Offline-ready`.

*(V1.1)* Recent sessions / post-service recap list below the status row.

### Anti-AI compliance for the homepage
All 8 rules apply: max weight 600 (Figtree 600 headings, Geist ≤500 body); -0.03em on every heading/badge; zero blur/glow/shadow; Figtree + Geist only (no Inter/Cinzel/Roboto); no em-dashes — hyphens or `•` only; max 8px radius on buttons (12px cards permitted by Rule 7); zero colored side-stripes or outlined cards (Rule 8).

### Deliberately NOT on the V1 homepage
Songs / Slides tabs, lexicon, full bible browser, and search — PewBeam ships these. They are deferred to V1.1 (congregation companion + recap) so the V1 surface stays calm and single-purpose.

### Token reconciliation note
The documented system uses `--color-bg-page: #000B14` (Oceanic Midnight). The Projector View artboard currently renders `#001523` in Paper. Align all artboards to the documented `#000B14` set so the spec and the canvas match before build.

---

## 🎛️ Audio Setup Screen (in-session setup, Step 1 of 3)

Pattern references: Fireflies / Riverside / Loom / ElevenLabs audio-capture panels (Mobbin).

Layout (1440 × 900, desktop-first):

*Top bar* — `#051929`, 1px `rgba(255,255,255,0.04)` divider:
- `REVEAL` wordmark (`#19A7CE`, Figtree 600, -0.03em) + `AUDIO SETUP` pill
- Right: `Step 1 of 3` (`#8D9AA6`, Geist 400)

*Live meter block* — the focal element (Riverside-style prominent monitor):
- Heading `Check your audio` (Figtree 600, `#FCF7F0`) + `Signal detected` (`#12D453`) status right-aligned
- 16-segment horizontal level meter (each ~`4px` radius): lit segments `#12D453`, unlit `#0A273D`. Target steady green, not clipping into grey.
- Helper line: `Speak now. Aim for a steady green level, not clipping into the grey.` (`#8D9AA6`, Geist 400)

*Input source list* — three selectable rows (`#0A273D`, radius-md 8px):
1. **Room Mic (MacBook Pro Microphone)** — selected: cyan ring (`#19A7CE` 1px) + filled cyan dot + `SELECTED` (`#19A7CE`). Subtext: `Built-in - picks up the room`.
2. **Desk / USB Feed** — subtext `Direct mixer feed - best quality (V1.1)`. V1 dimmed/disabled (per PRD §12).
3. **System Audio** — subtext `Captures app/output audio`.

*Footer nav* — `BACK` (`#0A273D` muted) left; right: `18ms • WebGPU Whisper ready` (`#8D9AA6`) + `CONTINUE` (`#19A7CE` bg, `#FCF7F0` text, radius-md 8px, Figtree 600).

---

## 🎨 Theme Studio Screen (in-session setup, Step 3 of 3)

Pattern references: Squarespace Blueprint AI colors step (swatch-row palettes, selected = outline ring, live preview tie-in); Gamma canvas framing.

Layout (1440 × 900, desktop-first):

*Top bar* — same structure as Audio Setup, pill `THEME STUDIO`, right `Step 3 of 3`.

*Body* — two columns, 16px gap:
- **Left: Live Preview** (`flex:1.4`, `#000B14`, radius-lg 12px, verse centered): reference pill `JOHN 3:16` (`#19A7CE`, Figtree 600) + `WEB` tag; verse body (Geist 400, 30px, `#FCF7F0`, line-height 1.6); footer `• REVEAL LIVE • SALFORD YOUNG ADULTS` (`#12D453`). Updates live to the selected theme.
- **Right: Swatch Panel** (`flex:1`, `#051929`, radius-lg 12px): header `Projection theme` (Figtree 600). Three theme cards, each = name + 4 swatch bars (bg / surface / text / accent):
  1. **Sacred Obsidian** (default) — selected: cyan ring `#19A7CE` + `DEFAULT` tag. Swatches: `#000B14` / `#051929` / `#FCF7F0` / `#C9A227` (gold).
  2. **Minimalist Monolith** — `#000000` / `#0A0A0A` / `#FCF7F0` / `#19A7CE`.
  3. **Warm Sanctuary** — `#1A1410` / `#2A2018` / `#F3E9DC` / `#B87333` (copper).

*Footer nav* — `BACK` (`#0A273D` muted) left; `START SESSION` (`#19A7CE` bg) right. Completes setup flow into the live Operator Control dashboard.

### Full V1 screen map
1. **Landing** (pre-service homepage) — `START SESSION` + 3 setup cards (audio / theme / service label) + offline status.
2. **Audio Setup** (Step 1 of 3) — above.
3. **Theme Studio** (Step 3 of 3) — above. (Service label lives on Landing; the 3-step flow is Audio → Service → Theme, but ordering is flexible.)
4. **Operator Control Dashboard** (live main screen) — below (v2, fused from Mixpanel / Riverside / Whop / Mistral AI).
5. **Projector View** (congregation output, 1920×1080) — full-screen verse (existing artboard; reconcile to `#000B14`).

---

## 🎛️ Operator Control Dashboard v2 — pattern sources

Fused from Mikey's Mobbin shortlist:
- **Mixpanel** — top metrics strip: stat cards with big number (Figtree 600) + tiny colored segment dot + muted label. Reveal uses: Verses detected / Avg confidence / Display latency / On screen now.
- **Riverside** — studio layout: top bar context, big left stage, right utility rail, bottom control bar with one prominent primary action + a row of circular media-toggle icons (M / V / S).
- **Whop** — red `LIVE` badge + red reserved-for-critical `END SESSION` pill (red `#EF4444` used ONLY for the one destructive control); viewer/verse count readout in the top bar.
- **Mistral AI** — transcript as a *message stream*: `PREACHER` speech bubbles (left-aligned, `#0A273D` radius 12px) and a `DETECTED` bubble (cyan `#19A7CE` 1px border) carrying the verse + confidence; airy spacing.

Layout (1440 × 900):

* **Right Side Shell View (100 Viewport Height — 100dvh Zero Cutoff):**
  - **Height Locking:** Pinned to `height: 100dvh`, `maxHeight: 100dvh`, `overflow: hidden` so the right content area fills the viewport without page scrolling or footer clipping.
  - **Top Bar (Header):** Compact header (`flexShrink: 0`, `height: 52px`, `paddingInline: 24px`).
  - **Metrics Strip:** Compact metric cards (`flexShrink: 0`, `paddingBlock: 12px`, stat size `22px`).
  - **Middle Main Content Grid:** Flex-grow (`flex: 1`, `minHeight: 0`, `overflow: hidden`) holding the speech transcript container (`overflowY: auto`) and scripture detection cards.
  - **Bottom Control Bar (Footer):** Fixed footer (`flexShrink: 0`, `height: 72px`, `paddingInline: 24px`) pinned cleanly to the bottom edge.

*Top bar* — `#051929`, 1px `rgba(255,255,255,0.04)`:
- Left: `REVEAL` (`#19A7CE`, Figtree 600) + `LIVE` pill (green dot `#12D453` + `LIVE`).
- Right: service name (`#8D9AA6`) `•` `N verses on screen` (`#FCF7F0`).

*Metrics strip* — 4 cards (`#051929`, radius-lg 12px): label (Geist 400, `#8D9AA6`) + 7px segment dot (`#19A7CE`/`#12D453`) + big value (Figtree 600, 28px, `#FCF7F0`).

*Body* — two columns, 16px gap:
- **Left Column — Split Dual Containers (`flex:1.3`):**
  1. **Top Container — Live Speech Transcription Stream (`#051929`, radius-lg 12px):** Continuous real-time sermon audio speech-to-text log (`PREACHER` speech bubbles in `#0A273D`, `18ms` WebGPU Whisper latency indicator).
  2. **Bottom Container — Bible Verse Detection & Matching (`#051929`, radius-lg 12px):** Dedicated regex & semantic scripture detection log showing active matched reference (`JOHN 3:16-17`), translation (`WEB`), confidence score (`98.4% Match`), 1-tap `Confirm & Push` 3D primary button, AND a **Recently Detected History List** displaying past detected scriptures (e.g. *Romans 8:28-30*, *Psalm 23:1-3*) with 1-tap `Re-Project ↵` secondary buttons so operators can instantly re-project missed verses back onto the stage screen.
- **Right Column (`flex:1`):** **Now on projector 16:9 TV Monitor** card (ref pill `JOHN 3:16` `#19A7CE` + `WEB`, verse text, `LIVE` tag, `CLEAR SCREEN` muted). **Strict 16:9 Geometry Rule:** Stage preview monitors MUST enforce pure `aspect-ratio: 16 / 9;` with no hardcoded `max-height` height overrides so the live display preview is never squished or distorted.
+ **Detection queue** card (pending count + confidence, `PUSH TO SCREEN` `#19A7CE` 3D primary button / `DISMISS` muted).


*Control bar* — `border-top` divider: left = 3 circular media toggles (M/V/S, `#0A273D` circles); right = `Mode: Manual confirm` label + `AUTO-PUSH` (muted, 8px radius) + `END SESSION` (red `#EF4444` pill, 9999px). Red reserved for the single destructive action only.

---

## 📄 Reference Files & Artifacts

* [PRD.md](file:///Users/mikeyitua/Desktop/playground%20projects/reveal/PRD.md) — Product Requirements Document
* [mobbin_references.html](file:///Users/mikeyitua/Desktop/playground%20projects/reveal/mobbin_references.html) — Interactive Mobbin UI reference gallery
* [implementation_plan.md](file:///Users/mikeyitua/.gemini/antigravity-ide/brain/4a561608-1a9f-4b51-9df3-76a5ee86dd7f/implementation_plan.md) — Implementation Plan & System Specs
