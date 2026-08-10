# AGENTS.md — Operating rules for the Reveal codebase

These rules exist because we have repeatedly regressed the same UI/motion bugs
while making unrelated changes. An agent touching this repo MUST follow them.
They are not suggestions.

## 0. Before you change anything — read what owns the thing you're touching
- This is a **Vite + React + TypeScript** PWA. Routes: `OperatorDashboard`
  (`/dashboard`), `ProjectorView` (`/projector`), `Landing`, `AudioSetup`,
  `ThemeStudio`.
- Shared pieces and where they live:
  - Layout shell + `Card` / `CardLabel` / `TopBar` → `src/components/ConsoleLayout.tsx`
  - `Sidebar` → `src/components/Sidebar.tsx` (rail, `SIDEBAR_WIDTH_*`, open-in-new-window on Projector)
  - Verse reference scanning → `src/lib/referenceScanner.ts` (**the spoken-form parser**)
  - Bible lookup + batching → `src/lib/verseLookup.ts`
  - Cross-window state → `src/lib/revealStore.ts` (`openProjectorWindow` lives here)
  - Session/latency → `src/session/RevealSessionProvider.tsx`
  - Projector output → `src/components/ProjectorArtboard.tsx` + `src/pages/ProjectorView.tsx`
  - Design tokens: page `#001523`, night `#000B14`, card `#051929`, text `#FCF7F0`,
    accent `#19A7CE`, success `#12D453`. Radii 6/8/12/pill. Fonts Figtree (display) + Geist (UI).
- If you are about to edit a file you have NOT just read in full (or only read a
  paginated slice of), **read it fully first**. Patching from a partial memory of
  the file is how we reintroduce old bugs.

## 1. NEVER regress the detection-queue / transcription fade
This has broken 3+ times. The rule:
- The **bottom fade** (`detection-fade.is-overflowing`) must always paint against
  the **bottom of the actual scroll/overflow surface**, never the bottom of the
  outer Card. It must only appear when content genuinely overflows.
- The **top fade** (`transcript-fade.is-overflowing`) is for the live transcription
  stream, which pins newest-at-bottom — so it fades the TOP edge, not the bottom.
- Implementation invariant (do not break it):
  - The element that fades carries `ref={...ScrollRef}` + the `*-fade is-overflowing`
    class driven by a `ResizeObserver` measuring `scrollHeight > clientHeight + 1`.
  - That faded element must be **height-bound** (`flex: 1 1 0%` inside a `flex: 1 1 0%`
    Card, `minHeight: 0`) so it is the real overflow surface.
  - It must **NOT** set `overflow-x: auto/hidden` on the same node that holds the
    mask. `overflow-y: auto` forces `overflow-x` to `auto` (CSS spec), which **clips
    the BorderBeam's left/right glow**. Therefore: put the fade mask on an
    `overflow: visible` wrapper, and do the scrolling on an inner element with
    horizontal padding so the beam glow renders inside the clip.
- If you change anything in `OperatorDashboard.tsx` around the queue or transcript
  scroll regions, **re-verify the fade still triggers on overflow and the BorderBeam
  is not clipped on the sides** before declaring done.

## 2. NEVER change button styling the user has frozen
- The **primary button** (cyan pill) is frozen. Do not alter its radius, color,
  border, shadow, or hover BorderBeam. Height changes to it require explicit ask.
- Secondary buttons may be resized for consistency, but keep them visually
  subordinate to primary.
- When making buttons uniform in height, normalize **all** of them (base component
  + every inline `style={{ paddingBlock/paddingInline/height }}` override), or you
  get rows where primary and secondary still differ. Search for `<PrimaryButton`
  and `<SecondaryButton` and check every override.

## 3. The reference scanner is the product's core — protect spoken-form parsing
`referenceScanner.ts` resolves what the preacher actually says. Existing behavior
that MUST keep working (verify with a quick node `--experimental-strip-types` test
against `scanText`):
- Spoken: `"Romans seven fifteen"` → `Romans 7:15`; `"Romans 7-15"` → `Romans 7:15`
  (dash = chapter→verse, NOT a range); `"Romans 715"` → `Romans 7:15` (bare run).
- Number words: compounds like `"twenty three"` → 23 and `"one hundred nineteen"`
  → 119 collapse to ONE token; but two separate small numbers (`"seven fifteen"`)
  stay TWO tokens — do NOT sum them.
- Written still works: `"John 3:16"`, `"Romans 8:28-30"` (dash-after-colon IS a range).
- Whole-chapter: `"Psalm 119"` should read as the chapter, not `1:19` (known edge:
  bare `119` may split — flagged, not yet fixed; don't make it worse).
- After ANY scanner change, run the parser on these inputs and confirm the outputs.
  Never "improve" the regex without re-testing the spoken cases above.

## 4. Don't drift from the codebase / invent structure
- Make the **smallest change that fixes the reported issue**. Do not refactor
  nearby code, rename things, or "tidy" while fixing something else.
- Do not introduce new files, components, or abstractions unless the task needs
  them. Favor editing the existing owner of the behavior.
- If a fix requires touching a second system (e.g. the projector route, the
  session provider), call it out and keep each change isolated and revertable.
- Do not preserve or hardcode credentials. If you see any, redact as `[REDACTED]`.

## 5. Verify before you say it's done
- `npm run build` AND `npx tsc --noEmit` must both exit 0.
- For UI/motion changes, the dev server is `localhost:5173` (HMR). Prefer a
  screenshot or a targeted logic test over asserting "it should work."
- For parser/logic changes, write a tiny throwaway script (node
  `--experimental-strip-types script.mjs` works on Node 22) that exercises the
  real inputs, confirm outputs, then DELETE the script.
- If you cannot verify in-browser, say so explicitly — do not claim a fix you
  didn't observe.

## 6. Scope discipline
- The user reviews UI iteratively and expects continuous progress, not silence
  mid-task and not unrequested rewrites.
- If the requested change is ambiguous or risks touching a frozen area (buttons,
  design tokens, the projector visual), propose the specific change and confirm
  before acting.
- Second-device network sync is DEFERRED. Don't start building it unless asked.
  The "wedge" vs PewBeam is: zero-install PWA, congregant follow-along, liturgical
  mode. Do NOT position design/prettiness as the differentiator.

## 7. When you fix a recurring bug, add a guard here
If the same class of bug happens again, append a concrete check to the relevant
section above so the next agent can't miss it. The doc is a living contract, not
decorative.
