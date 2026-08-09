# Reveal — V1 Product Requirements Document

**Status:** V1 / MVP draft
**Owner:** Mikey Itua
**Last updated:** 2026-08-09
**Category:** Church live-service technology (AI-assisted presentation)

---

## 1. Overview

**One-liner:** Reveal listens to a talk, homily, or sermon and puts the exact Bible verse, passage, or (later) Catechism reference the speaker is citing on screen — live, in real time, with no manual media-team work.

**Denomination-agnostic by design:** Reveal is built for *any* Christian service — Protestant, Catholic, liturgical, non-denominational, youth groups. Not one tradition. The engine is reference-type agnostic (Bible + lectionary + Catechism), so it serves every stream.

**Problem:** In most churches, when a preacher says "turn to…" or quotes a passage, a volunteer has to scramble to find and project it. The congregation waits through dead screen time, or the wrong verse flashes up. It pulls the preacher out of flow and the media team out of the moment.

**Solution:** A Progressive Web App (PWA) that captures the room/preacher audio, transcribes it on-device, detects Bible references in the transcript, looks up the passage from a locally cached Bible, and renders it full-screen for projection — all without a network connection mid-service.

---

## 2. The wedge (why build when PewBeam exists)

PewBeam (founded by Dára Sobaloju, a top product designer) already ships an offline desktop app with real-time verse detection — **including paraphrased references** — plus OBS/livestream support, multi-campus, and post-service sermon→social-post reformatting. Reveal's V1 core feature (verse appears as preached) is a **strict subset** of PewBeam's. We do **not** claim to beat them on the big screen.

**Verified differentiators (checked against PewBeam docs/features, Aug 2026):**

1. **Web-first / zero-install (true now).** PewBeam is a desktop download across 3 OS installers. Reveal is one URL that installs to phone *and* desktop as a PWA. Lower barrier for small/youth churches that dread "another app." This is a genuine distribution advantage, not a parity claim.
2. **Congregant phone follow-along (true, unaddressed by PewBeam).** PewBeam projects to the *big screen only* (their docs mention "phone" only as a mobile-hotspot internet backup — no second-screen/congregant feature). Reveal's post-MVP path opens the *same* session to every phone in the room: follow along in your own translation, tap-to-highlight. Different buyer (the congregation engages), different product. **This is Reveal's strongest wedge.**
3. **Liturgical + Catechism mode (true, unaddressed by PewBeam).** PewBeam's engine is Bible-verse-only. Reveal extends the reference engine beyond the Bible to serve Catholic and liturgical streams: (a) **Lectionary mode** — auto-load the day's fixed readings (1st reading, psalm, 2nd reading, gospel; 3-year Sunday cycle A/B/C + weekday cycle) so the sacristan cues them as proclaimed — more reliable than speech detection for the Liturgy of the Word; (b) **Catechism detection** — "Catechism 1213" → shows the CCC paragraph; Catholics cite the Catechism constantly and no verse-tool does this; (c) **homily detection** — speech detection still runs during the free-speech homily for verses cited; (d) **devotions** — Rosary, Novenas, Liturgy of the Hours for prayer groups/adoration. This makes Reveal denomination-agnostic (Protestant + Catholic), a market a Bible-only engine can't serve. (Name TBD — "Liturgical mode" / "Catholic mode" / other.)

**NOT differentiators (do not claim these):**
- **Design / theming** — PewBeam's founder is a top designer; this is a tie at best, and they may out-execute. Do not position Reveal as "better-designed."
- **Post-service content / social reformatting** — PewBeam already does sermon→social-post reformatting. Not a differentiator.

**Accessibility (a cross-cutting pillar, esp. Catholic / liturgical):** A live, large, clear screen is an access tool, not just a convenience:
- **Fixed, text-heavy liturgy** (Mass, Liturgy of the Hours) — the lectionary auto-load puts the day's readings, responsorial psalm, and sung responses (Gloria, Agnus Dei, Alleluia) on screen so the standing/sitting congregation isn't fumbling with a missal mid-stand.
- **Hearing-assisted worshippers** — compensates when the PA is muddy in older buildings; the screen carries what the ears miss.
- **Readers / non-native speakers / catechumens** — the day's readings and any cited Catechism paragraph appear without hunting a missalette, helping kids, visitors, language learners, and inquirers actually *see* what's referenced.
- **Congregant follow-along (phones)** extends this to personal accessibility — adjustable font size / high-contrast for low-vision users, in their own translation.
Accessibility is denomination-agnostic (youth groups, non-denom, Catholic alike) and reinforces the Catholic/liturgical case, since that liturgy is the most fixed and text-dense.

**Honest V1 framing:** the MVP's only confirmed edge over PewBeam is distribution (PWA / zero-install). The real leap — congregant follow-along — is a post-V1 feature. So V1's pitch is: *"Zero-install, and we're building toward congregant follow-along, which nobody does."*

**V1 explicitly does NOT compete on:** paraphrase detection, livestream OBS routing, multi-campus, design polish, content reformatting. Those are PewBeam's strengths; we earn the right to add them later (or never, if follow-along is the moat).

---

## 3. V1 Scope (MVP)

### In scope
- Capture audio from a selected microphone / system audio input in-browser.
- On-device streaming transcription (Whisper via `transformers.js`, WebGPU/WASM).
- **Explicit reference detection** only: "John 3:16", "Romans 8:28-30", "Psalm 23", "1 Corinthians 13".
- Verse lookup from a **bundled public-domain translation** (WEB or KJV) cached locally as JSON.
- Full-screen, projector-ready display with at least one clean default theme.
- PWA installable on desktop + mobile; **works fully offline** once loaded (model + Bible cached via service worker).
- Manual override: tap a detected reference to confirm/correct before it displays (safety net for false positives).

### Out of scope (V1)
- Paraphrased / quoted-without-reference detection (needs embedding similarity over the whole Bible).
- Livestream / OBS integration.
- Multi-campus, accounts, cloud sync.
- Phone follow-along / congregation companion.
- Post-service recap / content generation.
- Paid tiers, auth, back-end.

---

## 4. Core user flow

```
[Preacher speaks]
      │
      ▼
[Browser captures audio]  ← mic or system audio feed selected at setup
      │
      ▼
[Whisper transcribes]      ← on-device, streaming chunks
      │
      ▼
[Reference scanner]        ← regex + book-name map finds "Book ch:vv"
      │
      ▼
[Verse lookup]             ← local cached Bible JSON
      │
      ▼
[Display]                  ← full-screen, styled, projector mode
      │
      ▼
[Optional: operator taps to confirm]  ← overrides false positive
```

Single-operator model: a volunteer (or the preacher) opens Reveal on the projection machine, picks the audio source, and preaches. Optionally one person watches the detected refs and confirms.

---

## 5. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Vite + React** | 100% client-side; no SSR needed; smallest friction for browser-only APIs |
| Speech | **`transformers.js` + Whisper** (WebGPU preferred, WASM fallback) | In-browser, offline, no cloud cost |
| Bible text | **WEB or KJV** bundled as JSON, loaded once + cached | Public domain, zero API/network dependency |
| PWA | **`vite-plugin-pwa`** (manifest + service worker) | Offline caching of model + Bible + app shell |
| Styling | CSS / Tailwind (designer's call) | Fast theming for projection |
| Hosting | Static (Vercel/Netlify/Cloudflare Pages) or local file | No back-end required for V1 |

**No back-end in V1.** Everything runs on-device.

---

## 6. Architecture / pipeline detail

1. **Audio capture** — `getUserMedia` / Web Audio `MediaRecorder`; prefer a direct audio feed (mixer/USB) over room mic to beat echo + PA bleed.
2. **Transcription** — stream audio chunks to Whisper; emit incremental transcript text. Streaming (not batch) is essential for low latency.
3. **Reference detection** — maintain a canonical book list (66 + deuterocanon optional). Match patterns:
   - `Book N:N` (e.g. "John 3:16")
   - `Book N:N-N` and `Book N:N-NN` (ranges)
   - `Book N` (whole chapter)
   - Handle "1/2/3 John", "Song of Solomon", etc.
4. **Lookup** — index the bundled Bible by book/chapter/verse for O(1) fetch.
5. **Display** — render verse text large, with reference label, themeable; debounce rapid detections; show "pending" state until operator confirms (optional).

---

## 7. Build order

- **Phase 0 — Skeleton:** Vite+React app, PWA config, one empty full-screen view.
- **Phase 1 — Mic → transcript:** capture audio, run Whisper, show live transcript on screen. *Prove speech works.*
- **Phase 2 — Detect → display:** scan transcript for explicit refs, look up verse, render full-screen. *Core loop complete.*
- **Phase 3 — Offline:** cache model + Bible via service worker; verify it runs with WiFi off.
- **Phase 4 — Projection polish:** big-type default theme, operator confirm tap, reference label, debounce.
- **Phase 5 — Dogfood:** run at Salford Young Adults; log failures (false positives, lag, missed refs, audio issues).

---

## 8. Known hard problems (plan for, don't block on)

- **Room audio quality** — echo, PA bleed, distance. Likely mitigate by feeding a direct mixer/USB audio source, not the room mic. *This is the #1 real-world failure mode.*
- **Latency** — transcription + detection must keep pace with the preacher. Streaming Whisper + small model (e.g. `whisper-base`) trades accuracy for speed; tune.
- **False positives** — "John" the person vs "John" the gospel; "James" the name. Mitigate with context window + operator confirm tap.
- **Model size / load time** — Whisper models are tens of MB; preload + cache, show a loading state.
- **Browser support** — WebGPU is Chromium-first; Safari/iOS needs WASM fallback. Test matrix.

---

## 9. Success metrics (V1)

- Detects **explicit** references accurately in a quiet, direct-feed test (target: >90% with <2s display latency).
- Runs a full Salford Young Adults session **offline** with zero network.
- Operator can confirm/correct a false positive in <1 tap.
- Preacher reports they "didn't have to think about the screen."

---

## 10. Post-MVP roadmap (not V1)

1. **Paraphrase detection** — embed transcript segments, similarity-match against Bible text.
2. **Congregation companion** — phones follow along; requires a *tiny* back-end (Supabase: realtime sync). First feature that needs a server.
3. **Post-service recap** — auto outline + cited verses + shareable card (Mikey's content wedge).
4. **Livestream / OBS** — virtual camera or browser-source output.
5. **Theming studio** — per-church branded projection visuals.
6. **Accounts / multi-campus** — when distribution justifies it.

---

## 11. Locked decisions (V1)

- **Translation:** Ship **WEB** (World English Bible — modern English, public domain) as the V1 default. Fully offline, zero license cost.
- **Audio input:** V1 uses a **room mic** (Salford Young Adults has no sound desk to tap). Architecture supports selecting *any* input device, so a direct desk feed is a config option later.
- **Operator model:** **Toggle** between *Fully automatic* and *Operator-confirmed*, **defaulting to operator-confirmed** (a volunteer taps once to send a detected verse to the big screen — safety net for early false positives).
- **Platform:** **Desktop-first** for V1 (projection laptop). Phone/iOS Safari WASM fallback deferred to V1.1+.

### On adding NIV (and other copyrighted translations) offline

NIV/ESV/NLT/CSB are **copyrighted** — they cannot be legally bundled and stored locally for offline use without a license that explicitly permits local redistribution (paid, and most do not). Options:
- **V1:** WEB/KJV only (free, offline-safe).
- **Later:** offer NIV/ESV via an API (API.Bible / YouVersion) — but that requires a network at load time, breaking pure offline. Caching *fetched* verses per session is possible but storing the full text offline violates the license.
- **Conclusion:** full offline NIV is **not feasible legally without a paid local-storage license**. WEB remains the safe offline default; copyrighted versions stay network-assisted.

## 12. Mini V1.1 / V1.2 roadmap (next increments)

Small, high-leverage follow-ups immediately after the V1 dogfood at Salford Young Adults, plus the items blocked by **copyright** (see rule below).

**V1.1 (right after dogfood):**
1. **Both audio inputs** — UI to select room mic *or* direct desk/USB feed (browser already exposes device selection; just surface it).
2. **Theming presets** — 2–3 projection themes out of the box.
3. **Latency/accuracy tuning** — tune Whisper model size vs speed from real dogfood data; refine false-positive filtering.
4. **iOS Safari WASM fallback** — verify offline works on iPhone (the eventual congregation-companion path).

**V1.2 / later (copyright-gated — network-assisted only, NOT offline-bundled):**
Any text that is **copyrighted** cannot be bundled and stored locally for offline use without a paid license that explicitly permits local redistribution (most do not). These stay **network-assisted via API** (API.Bible / YouVersion / Vatican/USCCB feeds) — loaded at session start, never stored offline as the full text:
5. **NIV / ESV / other popular Bible translations** (network-assisted; WEB/KJV remain the offline defaults).
6. **Liturgical + Catechism mode** (a Reveal differentiator vs PewBeam):
   - **Lectionary mode** — auto-load the day's fixed readings (1st reading, psalm, 2nd reading, gospel; 3-year Sunday cycle A/B/C + weekday cycle). Public-domain lectionary sources (Douay-Rheims / Vulgate / pre-1970 texts) can be offline; modern lectionary text network-assisted.
   - **Catechism detection** — "Catechism 1213" → show the CCC paragraph (Vatican copyright → network-assisted).
   - **Homily detection** — speech detection still runs during the free-speech homily for cited verses.
   - **Devotions** — Rosary, Novenas, Liturgy of the Hours for prayer groups / adoration (public-domain texts offline where available).
   - *Design the V1 reference engine to be reference-type agnostic (Bible + lectionary + Catechism) so this is a data + parsing job, not a rewrite.*
7. **Congregant phone follow-along** — the strongest wedge; requires a *tiny* back-end (Supabase: realtime sync). First feature that needs a server.

**Copyright rule (applies to all content):** public-domain texts (WEB, KJV, Douay-Rheims, Vulgate, pre-1970 liturgical) = offline-bundled. Copyrighted texts (NIV, ESV, modern lectionary, CCC) = network-assisted API only, never stored offline as full text. If a paid local-storage license is ever obtained, a text may move to offline.
