# Service Queue — Scope (proposal)

Status: **built.** `serviceQueue` state + `stageVerse` / `dismissQueuedVerse` /
`displayQueuedVerse` / `reorderQueuedVerse` live in `RevealSessionProvider.tsx`,
rendered by `ServiceQueue.tsx`, with drag-reorder wired via native `draggable`.
The scope constraints below (no cross-device sync, no liturgy import, no
auto-advance, not persisted across End Session) remain binding — this doc now
describes the shipped feature's boundaries, not a future one. Part 1 of 3.

## Why it exists
Live preaching flow today: preacher speaks → Whisper detects → verse card →
operator Confirm & Display. Two gaps that a *planned* list solves:

1. **Liturgical order.** Anglican/Catholic services have a fixed reading sequence
   (collect → epistle → gospel). The operator wants those staged one-tap-away,
   not rebuilt from speech each time.
2. **Operator override.** When Whisper mis-hears, the operator needs to push a
   verse that *isn't* currently spoken without disturbing the live detection flow.

PewBeam shows an "everything-in-one queue." **We are explicitly NOT copying that.**
Ours stays **subordinate to live detection** — it augments, it does not replace.

## What it is
An **optional, operator-curated** list of planned verses, staged ahead of / during
the service. Each item:
- `ref` — a resolved `DetectedReference` (reuse existing type).
- `label?` — e.g. "Epistle", "Gospel" (human annotation).
- `addedFrom` — `'manual' | 'detection' | 'liturgy'` (liturgy is a future hook).
- `addedAt` — number, for stable sort.

Behaviors: **drag to reorder**, **one-tap → projector** (same `displayItem` path,
so real latency is still measured), **dismiss** per item.

## What it is NOT
- Not a replacement for the center **live detection queue**. Detection stays primary.
- Not a duplicate of **Recently detected** (that's history; this is intention).
- Not auto-populated from speech. Operator-curated only.
- Not cross-device synced (deferred, same as second-device sync).
- Not a timed/scheduled setlist with auto-advance.

## Placement (decision needed)
Right column, stacked with the existing cards:
`Now on projector` (preview) → **Service Queue** (new) → `Recently detected`.
Risk: at 1536px the right column can get cramped. Mitigation: make the Service
Queue a **collapsible** card (header + count badge, body collapses) so it never
starves "Recently detected" of height. Must respect the existing 3-column layout
and draggable dividers — no layout rework.

## Data model & state
```ts
interface QueuedVerse {
  id: string;
  ref: DetectedReference;
  label?: string;
  addedFrom: 'manual' | 'detection' | 'liturgy';
  addedAt: number;
}
```
Host `serviceQueue: QueuedVerse[]` in **RevealSessionProvider** (session-scoped,
reset on End Session — consistent with `pendingVerse` et al.). NOT persisted
across sessions this pass.

## Integration (reuse, don't duplicate)
- **`displayItem()`** — already writes `revealStore` projector + measures latency.
  Reuse verbatim for the one-tap Display action.
- **`referenceScanner.scanText` / `verseLookup.buildVerseDetection`** — resolve a
  typed/manual ref when adding. Reuse.
- **Manual lookup input** — add an "Add to queue" secondary action beside "Search".
- **Detection card** — add a "Stage" secondary action that pushes the resolved ref.
- **Session provider** — own the state + reset on End Session.

## Interactions (Emil-bar compliant)
- **Reorder:** pointer-drag with a grip handle; animate with `transform`/`opacity`
  only, <300ms, custom cubic-bezier, `prefers-reduced-motion` honored. No layout
  shift of the column beside it (scrollbar-gutter already reserved on `.scroll-region`).
- **Add:** from manual lookup ("Add to queue") and from any detection card ("Stage").
- **One-tap Display:** secondary "Display" per item → `displayItem`.
- **Dismiss:** per item.
- **Empty state:** "Stage verses ahead of the service" placeholder (no fake data).

## Out of scope (this pass)
- Cross-device queue sync.
- Liturgy-pack / lectionary import (leave the `addedFrom: 'liturgy'` hook only).
- Timed auto-advance.
- Persisting the queue across End Session.

## Acceptance / verification
- `npm run build` + `npx tsc --noEmit` green.
- Add from manual lookup AND from a detection card both populate the queue.
- Drag-reorder changes order and holds for the session.
- One-tap Display projects the verse via the existing path (latency still measured).
- Empty state renders; removing the last item returns to it.
- **Live detection flow unchanged.** Frozen primary button untouched.
- **Fade/scroll regions unaffected** (AGENTS.md rule 1 — no `overflow-x` clip regression).

## Risks / watch-outs
- Right-column height at 1536px → collapsible mitigates; confirm before building.
- "Add to queue" / "Stage" must be **secondary** buttons, never primary-styled.
- Drag must honor the Emil motion bar (transform/opacity, <300ms, reduced-motion).
- Don't let this quietly become the primary navigation — it's a subordinate aid.
