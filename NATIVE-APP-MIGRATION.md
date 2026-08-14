# Native App Migration — Decision Record

Status: **real Tauri port done (identity, launch flow, projector window).**
Step 4 (native speech bridge) is next — the actual point of this migration.
This doc exists so the reasoning behind the pivot doesn't have to be
re-derived later — treat it like AGENTS.md: evidence-anchored, update it if a
fact here turns out wrong.

## Next steps

1. ~~Tauri/WKWebView UI spike.~~ **Done — passed.** See "Spike result" below.
2. ~~Real Tauri port (identity, launch flow, projector window).~~ **Done.**
   See "Step 2 result" below.
3. ~~Fall back to Electron if the spike fails.~~ N/A — spike passed.
4. Build the native speech bridge — the actual point of going native. Rust
   code calling **Apple SpeechAnalyzer** on macOS and the **Windows Speech
   Recognition API** on Windows, replacing the browser Whisper hook
   (`useWhisperTranscription.ts`) for the native build. This is bespoke either
   way (see "Framework" below) — budget real time for it, not a weekend.
5. Test with a real microphone on real hardware, both platforms, before
   declaring victory. Compare latency and pickup against the current browser
   baseline directly — not a vibe check.
6. Congregant follow-along backend (Supabase realtime) — separate track from
   the native migration, can happen in parallel, doesn't block it.
7. Distribution groundwork once the app is otherwise working: code signing +
   notarization on Mac, code signing on Windows, Tauri's built-in updater for
   both. Not urgent, but don't leave it until the week of a pitch.

Smaller, non-blocking loose end: projector fullscreen automation (see bottom
of this doc) — pick up whenever, doesn't gate any of the above.

## Why we're moving the operator console off the browser

- Whisper (what the browser build uses) pads **every** input to a fixed 30-second
  window regardless of actual clip length — it's a batch model, it cannot emit
  anything until a full chunk is handed to it. This is not a tuning problem; it's
  how the model works. No threshold, hold-time, or partial-interval change can
  remove it.
- The "instant, phrase-by-phrase" feel of real dictation tools (Spokenly,
  WisprFlow) and of PewBeam's demo comes from a different model family entirely:
  **streaming/causal ASR**, which emits words continuously as audio arrives.
  That's an architecture difference, not a speed difference.
- Streaming ASR at that quality lives at the OS level: **Apple SpeechAnalyzer**
  (macOS, on-device, free, no per-call cost) and **Microsoft's Windows AI Speech
  Recognition API** (2026, on-device, free, no special hardware required) — both
  confirmed to exist and both free. A browser tab has no path to either; only a
  native app can call them.
- PewBeam is a native desktop app (confirmed: ships for Windows + macOS), which
  is the actual reason it can do what our browser build structurally cannot.

## What's splitting, and what isn't

- **Operator Console (Live Console) → native app.** This is the only piece that
  needs OS-level streaming speech.
- **Projector output → unchanged.** Same-device, same-browser, `localStorage` +
  `storage`-event sync (`revealStore.ts`). Already zero-network today; nothing
  about this decision touches it.
- **A limited browser version stays** as the marketing/trial funnel — "try it
  now, no install." Keeps "zero-install" as an honest pitch line without it
  being the thing the accuracy/delay complaints trace back to. Native is the
  tool actually run on a Sunday.

## Congregant follow-along (not yet built)

- Needs real cross-device networking — unavoidable once you're syncing to a
  phone that isn't the operator's machine.
- **Decision: cloud relay (Supabase realtime), not local-network-only.** Already
  named in `PRD.md`; this doc doesn't change that, it confirms it.
- Why not local-only: most venue guest WiFi enables **client isolation** by
  default, which blocks phone-to-phone / laptop-to-phone discovery on the same
  network. A pure local design would silently fail at a real church. Supabase's
  free tier is cheap enough at church scale that this isn't a real cost trade.

## Framework: Tauri, not Electron

- Electron's usual advantage — mature ecosystem, turnkey native integration —
  doesn't actually cover the hard part of this build. Neither Electron nor
  Tauri has a ready-made bridge to SpeechAnalyzer or the Windows Speech API;
  that bridge gets hand-written either way. The advantage is neutralized.
- Resource footprint is the deciding factor. This app competes for CPU against
  a live audio pipeline, on hardware we don't control, during something that
  can't glitch mid-service. Electron bundles Chromium + Node (~100–150MB
  baseline just to exist); Tauri uses the OS's own webview (WebView2 on
  Windows, WKWebView on Mac) and has no such tax.
- Supporting evidence, not proof: **PewBeam went from 2.7GB (v1) to 73MB (v2).**
  That gap is almost certainly dropped model weights — moving off a bundled
  multi-gigabyte offline ASR model onto an OS-native engine that costs zero
  bundled bytes. That's independent validation of "don't bundle the model, call
  the OS," regardless of which shell they used. 73MB alone doesn't prove Tauri
  (it sits near Electron's *bare* floor, comfortably above Tauri's) — it just
  doesn't contradict it either.
- **PewBeam's actual framework is unconfirmed.** No public repo, engineering
  post, or blog from Dára Sobaloju was found. Do not treat any specific claim
  about their stack as fact — only the shipped size numbers are real.

## Spike result — WKWebView rendering: PASS

Tauri on macOS renders through **WKWebView (Safari's engine), not Chromium.**
This app's visual layer was built and tuned in a Chromium-based dev workflow —
`oklab()` gradients, `mask-image` fades, `backdrop-filter`, the BorderBeam
glow. Step 1 from "Next steps" was executed: a throwaway `src-tauri/` was
scaffolded in `app/` (productName `reveal-wkwebview-spike`, identifier
`com.reveal.wkwebviewspike` — disposable naming, not the real app identity),
pointed at the existing dashboard with no application changes, and compared
side-by-side against an equivalently-populated Chromium session on the same
dev server.

**Verified via matched screenshots (search a reference, arm auto-push, open
the translation switcher, open the End Session modal):**
- `groove.ts` oklab gradients + multi-layer box-shadow — secondary buttons,
  switcher, faders, screen housing bezel, auto-push armed glow all rendered
  correctly, no banding, no dropped shadow layers.
- Translation switcher dropdown — pixel-close match: squared pill corners,
  cast shadow, WEB/NIV/KJV panel styling all identical to Chromium.
- BorderBeam glow — renders and animates, unclipped, in both engines. One
  open question: the WKWebView capture showed more pink/magenta saturation
  than Chromium's bluer tone at the moment each was captured. Since it's an
  animated, hue-rotating effect and the two captures came from independently-
  running animation loops, this is more likely different animation phase than
  a true engine difference — not fully ruled out, not blocking.
- `backdrop-filter: blur(3px)` (End Session modal) — works in both; WKWebView
  renders very slightly lighter than Chromium at the same value. Cosmetic.
- Google Fonts (Figtree/Geist/Geist Mono) — loaded and rendering correctly,
  no fallback to system fonts.
- Whisper failed to load on both WebGPU and WASM inside WKWebView — expected
  and irrelevant to this spike (rendering, not audio), and it's a live
  demonstration of exactly why this migration calls the OS's native speech
  engine instead of carrying the browser ASR pipeline over.

**Not exercised:** `.detection-fade`/`.transcript-fade` mask-image overflow —
only one detection card was present in the captured states, so the fade never
triggered in either engine. Worth a quick follow-up capture with an
overflowing queue before fully closing this out, but nothing observed so far
suggests risk here.

**Verdict: proceed with Tauri.** No hard WebKit limitation found. Step 2 in
"Next steps" (the real Tauri port) is unblocked.

## Step 2 result — real Tauri port: DONE

Identity, launch flow, and the projector second-window architecture are all
built and verified against the running app, not just the code.

**Identity:** `productName`/`identifier`/window title reconciled to `Reveal`
/ `com.reveal.console` / "Reveal — Operator Console". Icons regenerated from
the real `public/favicon.svg` — the generator hit two real problems, both
fixed: the source's 48×46 viewBox isn't square (`tauri icon` hard-requires
square input — padded to 48×48 in a scratch copy, never touched the real
file), and the SVG's `color(display-p3 ...)` fill values aren't understood by
the generator's rasterizer, which silently fell back to solid black for every
shape — stripped those, kept the plain hex fallback already present in the
same style attributes. Verified by opening the generated PNG directly: full
purple-to-blue gradient mark, correctly proportioned.

**Launch flow:** native cold start goes straight to `/dashboard`, confirmed
by screenshot of the running window. `App.tsx`'s route table and the
End-Session→`/` navigation are untouched, exactly as scoped.

**Projector window — the real architectural work:** `revealStore.ts` now
branches on `isTauri()`. Native path creates/reuses a labeled `WebviewWindow`
instead of `window.open()`, and syncs state via `emit`/`listen` instead of
localStorage + the `storage` event (never verified to fire reliably across
separate native webview instances — see "Framework" above for why that risk
wasn't worth taking). Verified directly, not assumed:
- `osascript` window-list query confirmed a real second OS window
  (`"Reveal — Projector"`) after clicking "Open window" — not a popup inside
  the same webview.
- Pushed "Romans 8:28" from the console and confirmed it rendered in the
  Projector window's screenshot — the `emit`/`listen` transport works
  end-to-end, not just in isolation.
- Clicking "Open window" twice produced exactly one window, not a duplicate —
  the create-or-focus reuse logic (replicating `window.open()`'s named-target
  behavior) works.

**Two real bugs found by the plan's own verification steps, both fixed:**
Tauri v2's `core:default` permission set is much thinner than it looks —
`.setFocus()` and `.close()` each need their own explicit capability
(`core:window:allow-set-focus`, `core:window:allow-close`), neither included
in `core:default` alongside `core:webview:allow-create-webview-window`
(which was already known to be needed). Both surfaced as live
`[Unhandled rejection]` errors during manual testing — reopening an
already-open projector window silently failed to focus it, and "Exit" did
nothing at all — and both are now in `src-tauri/capabilities/default.json`.
Neither was predicted by the plan; both were caught because the plan's
verification steps actually exercised reopen-while-open and Exit, not just
first-creation.

**Not yet exercised:** closing the projector window via the OS's own
close button (red traffic-light) rather than the in-app "Exit" control —
should be equivalent (both ultimately close the WebviewWindow) but wasn't
separately clicked through.

## Loose end noted along the way (non-blocking)

Projector fullscreen is currently **manual only** — the operator presses F11
after opening the projector window (documented in a `revealStore.ts:66`
comment). Not automated. A one-click "Go fullscreen" button via the browser's
`element.requestFullscreen()` API is a small, separate future addition — not
part of this migration, just flagged here so it isn't lost.
