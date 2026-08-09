import { formatReference, type DetectedReference } from './referenceScanner';

type ChapterData = Record<string, string>;
type BookData = Record<string, ChapterData>;
type BibleData = Record<string, BookData>;

/**
 * The full WEB Bible is ~4MB, so it is code-split into its own chunk and
 * loaded on demand rather than inlined into the main bundle — otherwise every
 * route (including the landing page) would block on parsing it at startup.
 * It still ships with the app: this is a local chunk, not a network call at
 * detect time, and it is a natural unit for a service worker to precache.
 */
let bible: BibleData | null = null;
let loadPromise: Promise<void> | null = null;

/** Loads the bundled Bible chunk once; safe to call repeatedly. */
export function ensureBibleLoaded(): Promise<void> {
  loadPromise ??= import('../data/web-bible.json').then((mod) => {
    bible = mod.default as BibleData;
  });
  return loadPromise;
}

// --- Batched detection -----------------------------------------------------
// Product rule: a reading is split into batches of 8 verses (the legibility
// ceiling for text viewed from the back of a sanctuary) and capped at 24
// verses total (3 batches). Beyond that we simply stop — no whole-chapter
// theater, and the operator is never expected to click through dozens of parts.
export const MAX_VERSES_PER_BATCH = 8;
export const MAX_TOTAL_VERSES = 24;

export interface VerseBatch {
  ref: string; // e.g. "Proverbs 23:9-16"
  text: string; // joined verse text for this batch
  verses: string[]; // per-verse text, for numbered projector lines
  verseStart: number;
  verseEnd: number;
  isPrimary: boolean; // first batch
}

export interface VerseDetection {
  fullRef: string; // original detected range label, e.g. "Proverbs 23:1-20"
  book: string;
  chapter: number;
  verseStart: number | null;
  verseEnd: number | null;
  batches: VerseBatch[]; // up to 3; first is primary
  truncated: boolean; // true when the spoken range exceeded MAX_TOTAL_VERSES
}

/**
 * Builds a batched detection for a reference. Returns null when the chapter or
 * verse range doesn't exist (a mis-transcription for a complete Bible).
 */
export function buildVerseDetection(ref: DetectedReference): VerseDetection | null {
  if (!bible) throw new Error('buildVerseDetection called before ensureBibleLoaded() resolved');
  const chapterData = bible[ref.book]?.[String(ref.chapter)];
  if (!chapterData) return null;

  const availableVerses = Object.keys(chapterData)
    .map(Number)
    .sort((a, b) => a - b);
  if (availableVerses.length === 0) return null;

  let verseNumbers: number[];
  if (ref.verseStart == null) {
    verseNumbers = availableVerses; // whole-chapter read
  } else {
    const end = ref.verseEnd ?? ref.verseStart;
    verseNumbers = availableVerses.filter((v) => v >= ref.verseStart! && v <= end);
  }
  if (verseNumbers.length === 0) return null;

  const truncated = verseNumbers.length > MAX_TOTAL_VERSES;
  const capped = truncated ? verseNumbers.slice(0, MAX_TOTAL_VERSES) : verseNumbers;

  const batches: VerseBatch[] = [];
  for (let i = 0; i < capped.length; i += MAX_VERSES_PER_BATCH) {
    const slice = capped.slice(i, i + MAX_VERSES_PER_BATCH);
    const start = slice[0];
    const end = slice[slice.length - 1];
    const verses = slice.map((v) => chapterData[String(v)]);
    batches.push({
      ref: formatReference({ ...ref, verseStart: start, verseEnd: end }),
      text: verses.join(' '),
      verses,
      verseStart: start,
      verseEnd: end,
      isPrimary: i === 0,
    });
  }

  const fullRef = truncated
    ? `${formatReference(ref)} (first ${MAX_TOTAL_VERSES})`
    : formatReference(ref);

  return {
    fullRef,
    book: ref.book,
    chapter: ref.chapter,
    verseStart: ref.verseStart ?? null,
    verseEnd: ref.verseEnd ?? null,
    batches,
    truncated,
  };
}

