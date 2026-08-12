# Reveal — Whisper Transcription: Deep Diagnosis & Fix Plan

**Audience:** the Claude Code agent that builds the Reveal app.
**Goal:** explain why live Bible-verse detection is inaccurate, lags, and crops/trims speech at normal speaking pace — and what to change.
**Status of this doc:** diagnosis is from reading the source (`app/src/hooks/useWhisperTranscription.ts`, `app/src/lib/referenceScanner.ts`, `app/src/lib/verseLookup.ts`, `app/src/session/RevealSessionProvider.tsx`, `app/src/hooks/useAudioLevel.ts`). Symptom→code mapping is code-evident; the *magnitude* of each on Mikey's real machine needs live confirmation (no mic in the agent's headless env).

---

## 1. What already works (verified, do not regress)

- **Scanner** (`referenceScanner.ts`): spoken-form parsing is solid. `scanText` correctly resolves `Romans 7 15`→`Romans 7:15`, `Romans 7-15`→`7:15` (dash = chapter→verse), `Romans 715`→`7:15`, `John 3:16`, `Romans 8:28-30` (range), `Psalm 119` (chapter). Regression-guarded by AGENTS rule 3.
- **Book-name bias + fuzzy corrector** (added this session, verified): `correctBookNames()` Levenshtein-corrects misspelled book names before scanning; `BIBLE_BOOK_BIAS_PROMPT` (the 66-book list) is passed as Whisper `initial_prompt`. Proven: `romens 7`→Romans 7, `romance 7 fifteen`→Romans 7:15, `1 corinth 3`→1 Corinthians 3, `rom 7`→Romans 7, `rev 21`→Revelation 21, `genisis 1`→Genesis 1, `philipians 4`→Philippians 4. Live injection test rendered correct cards.
- **Crash fixed:** `buildVerseDetection` previously *threw* before the Bible chunk loaded, killing all detection. Now returns `null`. `runManualSearch` gated on `bibleReady`.
- **Delay tuning (partial):** `SILENCE_HOLD_MS` 900→450, `PARTIAL_INTERVAL_MS` 900→400.

## 2. The audio/transcription pipeline (as built)

`useWhisperTranscription` (enabled when session active + mic on):
1. `getUserMedia({audio:true})` → `AudioContext` → `createScriptProcessor(4096,1,1)` (line 254). **4096 samples @16kHz = 256 ms of audio per `onaudioprocess` callback.**
2. Each callback → `downsampleTo16kHz` → `handleChunk(chunk)` (line 259-263, 181-206).
3. `handleChunk`: computes RMS; if `> SILENCE_RMS_THRESHOLD` (0.012, line 9) marks speaking and appends chunk to `bufferRef`; on silence > `SILENCE_HOLD_MS` (450) calls `finalizeUtterance`.
4. `finalizeUtterance` (144-178): transcribes the **entire accumulated `bufferRef`** via Whisper, sets the segment `final: true`.
5. `runPartialTranscription` (121-142): every `PARTIAL_INTERVAL_MS` (400) re-transcribes the current buffer and shows it live (the "Speaking now" text).
6. `RevealSessionProvider` scan effect: scans `final` segments with `scanText` → enqueues detection cards.

**Separate concern:** `useAudioLevel` (useAudioLevel.ts) opens its **own** `getUserMedia` + `AudioContext` purely for the mic-level meter. That is a *second* mic capture running alongside the whisper one.

## 3. Symptom → root-cause map

### Symptom A — "struggles to pick anything up at normal pace"
- **`SILENCE_RMS_THRESHOLD = 0.012` is too high.** Normal-paced speech, and especially the *onset* of each word, dips below 0.012 between louder peaks. When RMS < threshold, `handleChunk` does **not** buffer the chunk (line 195 only appends when `isSpeech`). So the start of what Mikey says is silently dropped, and `speakingRef` may never flip true → the whole utterance is missed.
- **Chunk granularity + threshold interact badly.** Audio only arrives in 256 ms blobs. A word's first blob often has low RMS → dropped. By the time RMS crosses 0.012 the first syllable is gone.
- **Duplicate mic capture** (`useAudioLevel`) doubles CPU/thread load. On a machine already getting hot, audio callbacks can be starved/dropped → more missed audio. This is the most likely "struggles to pick up" amplifier on Mikey's hardware.

### Symptom B — "crops / trims the last part off"
- **Reference fragmentation from too-short silence hold.** `SILENCE_HOLD_MS = 450`. Normal speech rhythm between clauses/words often exceeds 450 ms of quiet ("Romans … seven … fifteen" said with natural pauses). Each pause finalizes a *separate* utterance: "Romans", then "seven", then "fifteen" — transcribed and scanned **individually**. "seven" alone has no book → scanner finds nothing; the full "Romans 7:15" reference is never formed. To Mikey this reads as "it picked up part and cropped the rest."
- **Tail trimming at finalize.** `finalizeUtterance` transcribes `bufferRef` captured at the 450 ms-silence mark. The final syllable's last 256 ms chunk may arrive *after* the silence threshold but the buffer was already snapshotted/reset — so the tail is cut. Whisper-base also truncates buffers longer than its trained window when fed very long accumulated audio.
- **Partial-vs-final mismatch.** The live "Speaking now" text shows the *partial* (every 400 ms). The *final* that actually gets scanned can differ/crop vs what Mikey saw live → "it trimmed the last part."

### Symptom C — "still a little delay"
- Residual fixed latency = `SILENCE_HOLD_MS` (450) + Whisper inference time. 450 is better than 900 but still a hard wait after each pause. The inference cost itself is model-bound (see D).

### Symptom D — "quite inaccurate"
- **`Xenova/whisper-base` is the weakest practical model.** Accuracy on rare, domain-specific vocabulary (Bible book names) is inherently poor. The bias prompt + fuzzy corrector help *after* the fact, but the model still mis-hears "Romans" as "romance"/"romens" frequently. The accuracy ceiling is the model.
- No streaming/context: each utterance is transcribed in isolation with no surrounding context, so ambiguous sounds resolve poorly.

## 4. Ranked fix plan (smallest/highest-leverage first)

**F1 — Lower the speech threshold.** `SILENCE_RMS_THRESHOLD` 0.012 → ~0.004–0.005. Picks up quiet onsets. Risk: more false positives from room noise; mitigate by keeping the 0.3 s `MIN_UTTERANCE_SAMPLES` floor so tiny noises don't finalize. *Code: line 9.*

**F2 — Merge the two mic captures.** Kill `useAudioLevel`'s separate `getUserMedia`+`AudioContext`; feed the mic-level meter from the *same* stream the whisper hook already has (pass the stream/analyser, or compute RMS inside `handleChunk` and expose it). Removes a whole second audio pipeline → less CPU, fewer dropped callbacks on hot machines. *Files: useAudioLevel.ts, useWhisperTranscription.ts.*

**F3 — Adaptive / longer endpointing (fixes fragmentation + crop).** The 450 ms hold fragments normal speech. Options, pick one:
   - (a) Raise `SILENCE_HOLD_MS` to ~700–900 ms AND add a max-utterance soft cap; simplest, but adds delay (conflicts with C).
   - (b) **Preferred:** switch endpointing to Whisper's own timestamp/VAD output instead of a fixed RMS silence timer — only finalize when the model reports the segment ended. This stops fragmenting mid-reference and stops cropping tails. Larger change but correct.
   - (c) Interim: keep partials streaming and only *commit* a detection after the partial has been stable ~1 s (the existing `ReferenceStabilizer` already does this for non-final segments — extend it to the final path).

**F4 — `ScriptProcessorNode` → `AudioWorklet`.** `createScriptProcessor` is deprecated and runs on the main thread (jank/drops under load). An AudioWorklet runs off-main-thread and is the stable, performant capture path. *File: useWhisperTranscription.ts.* This is the "proper" version of F2's perf goal.

**F5 — Upgrade the model (accuracy ceiling).** `whisper-base` → `whisper-small` via WebGPU (much better book-name accuracy, heavier/faster-GPU-dependent), or **Moonshine Base** (purpose-built for low-latency in-browser ASR, ~whisper-small quality at base speed, drops into the same transformers.js call). Moonshine is the recommended upgrade — keeps the offline/PWA promise, directly attacks Symptom D. *File: useWhisperTranscription.ts `MODEL_ID` + `loadTranscriber`.*

**F6 — Streaming partials as the displayed text.** Already partially there (partials every 400 ms). Make the *detection* also consider the latest stable partial, not only `final` segments, so Mikey sees words as they're said (reduces perceived delay + crop surprise).

## 5. Recommended sequence for Claude
1. F2 + F4 together (one audio refactor: single worklet-driven stream, level meter derived from it). Biggest reliability win, removes the hot-machine drops.
2. F1 (threshold) — cheap, immediately helps pickups.
3. F3b (model-based endpointing) — kills fragmentation/crop.
4. F5 (Moonshine or whisper-small) — accuracy, once the pipeline is stable.
5. Keep the bias prompt + `correctBookNames` (already in, working).

Do **not** touch `referenceScanner.ts` parsing logic beyond what's there (regression-guarded). Do **not** alter the frozen primary button or design tokens.

## 6. Open questions needing Mikey's live confirmation
- Which backend is actually loading on his machine — `webgpu` or `wasm`? (Check console: `[useWhisperTranscription] Xenova/whisper-base loaded on <backend>`). WASM = the accuracy/latency ceiling is much lower; Moonshine/whisper-small on WASM may be unusable, WebGPU required.
- Mic sample rate / gain (affects F1 threshold tuning).
- Is overheating causing callback drops? (F2/F4 confirm.)

## 7. Key file:line reference
- `useWhisperTranscription.ts:4` `MODEL_ID = 'Xenova/whisper-base'`
- `:9` `SILENCE_RMS_THRESHOLD = 0.012`
- `:10` `SILENCE_HOLD_MS = 450`
- `:12` `MAX_UTTERANCE_SECONDS = 30`
- `:13` `PARTIAL_INTERVAL_MS = 400`
- `:6` `SCRIPT_PROCESSOR_BUFFER_SIZE = 4096` (256 ms/chunk @16kHz)
- `:144-178` `finalizeUtterance` (transcribes whole buffer)
- `:181-206` `handleChunk` (RMS gate, buffering)
- `:249-267` audio graph (ScriptProcessor + silentGain)
- `useAudioLevel.ts:32-46` duplicate `getUserMedia` + `AudioContext`
- `referenceScanner.ts` `correctBookNames`, `BIBLE_BOOK_BIAS_PROMPT`, `scanText` (already wired)
- `RevealSessionProvider.tsx:204-265` scan effect (processes `final` segments)
