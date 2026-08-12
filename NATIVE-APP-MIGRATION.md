# Native App Migration — Decision Record

Status: **decided, not yet built.** One prerequisite spike (Tauri/WKWebView UI test)
must happen before any real porting work starts. This doc exists so the reasoning
behind the pivot doesn't have to be re-derived later — treat it like AGENTS.md:
evidence-anchored, update it if a fact here turns out wrong.

## Next steps

1. **Immediate — Tauri/WKWebView UI spike.** Stand up a bare Tauri shell on Mac
   and load the existing dashboard UI into it as-is. No porting, no new
   features — just confirm the visual layer renders correctly in WKWebView
   (Safari's engine) instead of Chromium. ~1 day. This gates everything below:
   don't start real porting work until this has a result. See "Open risk"
   below for exactly what to check.
2. If the spike passes (clean, or fixable with CSS fallbacks): begin the real
   Tauri port — wrap the existing Vite/React app properly, get the normal dev
   workflow (`npm run dev` equivalent) working inside Tauri.
3. If the spike fails in a way that can't be patched: fall back to Electron
   and re-open that decision. Don't silently keep pushing on Tauri past a
   failed spike.
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

## Open risk — must be resolved before full commitment

Tauri on macOS renders through **WKWebView (Safari's engine), not Chromium.**
This app's entire visual layer was built and tuned this session in a
Chromium-based dev workflow — `oklab()` gradients, `mask-image` fades
(`.detection-fade`, `.transcript-fade`), `backdrop-filter`, the BorderBeam glow
effects. Modern Safari supports all of these; "supports" is not the same claim
as "renders identically," and none of it has been tested in WebKit.

This is step 1 in "Next steps" above — do not start real porting work before
it has a result.

## Loose end noted along the way (non-blocking)

Projector fullscreen is currently **manual only** — the operator presses F11
after opening the projector window (documented in a `revealStore.ts:66`
comment). Not automated. A one-click "Go fullscreen" button via the browser's
`element.requestFullscreen()` API is a small, separate future addition — not
part of this migration, just flagged here so it isn't lost.
