interface BookDef {
  canonical: string;
  aliases: string[];
}

function ordinalPrefixes(n: 1 | 2 | 3): string[] {
  return { 1: ['1', 'I', 'First', '1st'], 2: ['2', 'II', 'Second', '2nd'], 3: ['3', 'III', 'Third', '3rd'] }[n];
}

function numbered(base: string, ns: Array<1 | 2 | 3>): BookDef[] {
  return ns.map((n) => ({
    canonical: `${n} ${base}`,
    aliases: ordinalPrefixes(n).map((prefix) => `${prefix} ${base}`),
  }));
}

/** The 66 Protestant books, in canonical order, with common spoken aliases. */
export const BOOKS: BookDef[] = [
  { canonical: 'Genesis', aliases: ['Genesis'] },
  { canonical: 'Exodus', aliases: ['Exodus'] },
  { canonical: 'Leviticus', aliases: ['Leviticus'] },
  { canonical: 'Numbers', aliases: ['Numbers'] },
  { canonical: 'Deuteronomy', aliases: ['Deuteronomy'] },
  { canonical: 'Joshua', aliases: ['Joshua'] },
  { canonical: 'Judges', aliases: ['Judges'] },
  { canonical: 'Ruth', aliases: ['Ruth'] },
  ...numbered('Samuel', [1, 2]),
  ...numbered('Kings', [1, 2]),
  ...numbered('Chronicles', [1, 2]),
  { canonical: 'Ezra', aliases: ['Ezra'] },
  { canonical: 'Nehemiah', aliases: ['Nehemiah'] },
  { canonical: 'Esther', aliases: ['Esther'] },
  { canonical: 'Job', aliases: ['Job'] },
  { canonical: 'Psalm', aliases: ['Psalm', 'Psalms'] },
  { canonical: 'Proverbs', aliases: ['Proverbs'] },
  { canonical: 'Ecclesiastes', aliases: ['Ecclesiastes'] },
  { canonical: 'Song of Solomon', aliases: ['Song of Solomon', 'Song of Songs', 'Canticles'] },
  { canonical: 'Isaiah', aliases: ['Isaiah'] },
  { canonical: 'Jeremiah', aliases: ['Jeremiah'] },
  { canonical: 'Lamentations', aliases: ['Lamentations'] },
  { canonical: 'Ezekiel', aliases: ['Ezekiel'] },
  { canonical: 'Daniel', aliases: ['Daniel'] },
  { canonical: 'Hosea', aliases: ['Hosea'] },
  { canonical: 'Joel', aliases: ['Joel'] },
  { canonical: 'Amos', aliases: ['Amos'] },
  { canonical: 'Obadiah', aliases: ['Obadiah'] },
  { canonical: 'Jonah', aliases: ['Jonah'] },
  { canonical: 'Micah', aliases: ['Micah'] },
  { canonical: 'Nahum', aliases: ['Nahum'] },
  { canonical: 'Habakkuk', aliases: ['Habakkuk'] },
  { canonical: 'Zephaniah', aliases: ['Zephaniah'] },
  { canonical: 'Haggai', aliases: ['Haggai'] },
  { canonical: 'Zechariah', aliases: ['Zechariah'] },
  { canonical: 'Malachi', aliases: ['Malachi'] },
  { canonical: 'Matthew', aliases: ['Matthew'] },
  { canonical: 'Mark', aliases: ['Mark'] },
  { canonical: 'Luke', aliases: ['Luke'] },
  { canonical: 'John', aliases: ['John'] },
  { canonical: 'Acts', aliases: ['Acts'] },
  { canonical: 'Romans', aliases: ['Romans'] },
  ...numbered('Corinthians', [1, 2]),
  { canonical: 'Galatians', aliases: ['Galatians'] },
  { canonical: 'Ephesians', aliases: ['Ephesians'] },
  { canonical: 'Philippians', aliases: ['Philippians'] },
  { canonical: 'Colossians', aliases: ['Colossians'] },
  ...numbered('Thessalonians', [1, 2]),
  ...numbered('Timothy', [1, 2]),
  { canonical: 'Titus', aliases: ['Titus'] },
  { canonical: 'Philemon', aliases: ['Philemon'] },
  { canonical: 'Hebrews', aliases: ['Hebrews'] },
  { canonical: 'James', aliases: ['James'] },
  ...numbered('Peter', [1, 2]),
  ...numbered('John', [1, 2, 3]),
  { canonical: 'Jude', aliases: ['Jude'] },
  { canonical: 'Revelation', aliases: ['Revelation', 'Revelations', 'Apocalypse'] },
];

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const aliasToCanonical = new Map<string, string>();
for (const book of BOOKS) {
  for (const alias of book.aliases) {
    aliasToCanonical.set(alias.toLowerCase(), book.canonical);
  }
}

const allAliases = BOOKS.flatMap((b) => b.aliases).sort((a, b) => b.length - a.length);
const BOOK_GROUP = allAliases.map(escapeRegExp).join('|');

// --- Spoken-number support -------------------------------------------------
// Preachers say "Romans seven fifteen", not "Romans 7:15". Whisper returns the
// words, so we normalise number words to digits before pattern-matching. This
// turns "Romans seven fifteen" into "Romans 7 15" so the same digit logic
// downstream can resolve it.
const NUM_WORDS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
  nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30,
  forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  hundred: 100, thousand: 1000,
};
const NUM_WORD_RE = new RegExp(
  `\\b(?:${Object.keys(NUM_WORDS).join('|')})(?:[\\s-]+(?:${Object.keys(NUM_WORDS).join('|')}))*\\b`,
  'gi',
);

/** Converts a run of spoken number words to digits. Compounds that form a
 *  single number ("twenty three" → 23, "one hundred nineteen" → 119) collapse
 *  to one token; but two separate small numbers that are chapter + verse
 *  ("seven fifteen") stay as TWO tokens ("7 15") so the pattern matcher can
 *  resolve them as chapter 7 verse 15 rather than summing them. */
function wordsToDigits(input: string): string {
  return input.replace(NUM_WORD_RE, (phrase) => {
    const parts = phrase.toLowerCase().split(/[\s-]+/).filter(Boolean);
    const out: number[] = [];
    let cur = 0;
    let hasTens = false;
    let hasOnes = false;
    let hasScale = false;
    const flush = () => {
      if (cur > 0) {
        out.push(cur);
        cur = 0;
        hasTens = hasOnes = hasScale = false;
      }
    };
    for (const p of parts) {
      const v = NUM_WORDS[p];
      if (v == null) return phrase; // bail — leave original words in place
      if (v === 100 || v === 1000) {
        if (hasTens && hasOnes && !hasScale) flush(); // closed compound, restart scale
        cur = (cur || 1) * v;
        hasScale = true;
      } else if (v >= 20) {
        // tens word ("twenty".."ninety"): start a new compound unless we're
        // already building one that can accept a tens part.
        if (cur > 0 && !(hasScale || (hasTens && !hasOnes))) flush();
        cur += v;
        hasTens = true;
      } else {
        // ones / teen (1-19): append only if current is open for more (has a
        // tens or scaling part); otherwise it's a separate number → flush first.
        if (cur > 0 && !(hasScale || (hasTens && !hasOnes))) flush();
        cur += v;
        hasOnes = true;
      }
    }
    flush();
    return out.join(' ');
  });
}

// Three patterns, run in order. Each returns chapter/verse via capture groups;
// we keep the most specific (verse-bearing) match and drop whole-chapter
// matches that are just a prefix of a verse match (e.g. "Romans 7" inside
// "Romans 7:15").

// Spoken chapter+verse: "Romans 7 15", "Romans 7-15", "Romans chapter 7 verse 15".
// A hyphen/dash here is chapter→verse, NOT a range — the preacher means 7:15.
// A bare 3-digit run ("Romans 715") is split as chapter=first digits, verse=last two.
const SPOKEN_CV_RE = new RegExp(
  String.raw`\b(${BOOK_GROUP})\.?\s+(?:chapter\s+)?(\d{1,3})(?:\s+(?:verse\s+)?(\d{1,3})|\s*[-–—]\s*(\d{1,3}))?`,
  'gi',
);

// Spoken range: "Romans 7 verse 1 through 8", "Romans 7 1 to 8". The range
// connector must be a WORD (through/to/and) — never a dash, which stays
// chapter→verse in SPOKEN_CV_RE above.
const SPOKEN_RANGE_RE = new RegExp(
  String.raw`\b(${BOOK_GROUP})\.?\s+(?:chapter\s+)?(\d{1,3})\s+(?:verse\s+)?(\d{1,3})\s+(?:through|thru|to|and)\s+(?:verse\s+)?(\d{1,3})`,
  'gi',
);

// Written form: "John 3:16", "Romans 8:28-30". A dash is only a range when it
// follows an explicit colon — "Romans 7-15" is NOT a range here (it falls to
// SPOKEN_CV_RE as chapter→verse instead).
const WRITTEN_RE = new RegExp(
  String.raw`\b(${BOOK_GROUP})\.?\s+(\d{1,3})(?::(\d{1,3})(?:[-–—](\d{1,3}))?)?`,
  'gi',
);

interface RawMatch {
  book: string;
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
  raw: string;
  bareSplit?: boolean;
}

function parseSpokenCv(m: RegExpExecArray): RawMatch | null {
  const canonical = aliasToCanonical.get(m[1].toLowerCase());
  if (!canonical) return null;
  let chapter = Number(m[2]);
  let verseStart: number | undefined;
  const verseToken = m[3] !== undefined ? m[3] : m[4]; // space form or dash form
  let bareSplit = false;
  if (verseToken !== undefined) {
    verseStart = Number(verseToken);
  } else if (chapter >= 100 && chapter <= 899) {
    // Bare run like "Romans 715" → chapter 7, verse 15. Cap chapter at 89 so we
    // never misread a valid whole-chapter reference as 1:19.
    const verse = chapter % 100;
    chapter = Math.floor(chapter / 100);
    if (verse > 0) {
      verseStart = verse;
      bareSplit = true;
    }
  }
  return { book: canonical, chapter, verseStart, raw: m[0], bareSplit };
}

function parseRange(m: RegExpExecArray): RawMatch | null {
  const canonical = aliasToCanonical.get(m[1].toLowerCase());
  if (!canonical) return null;
  const chapter = Number(m[2]);
  const verseStart = Number(m[3]);
  const verseEnd = Number(m[4]);
  return { book: canonical, chapter, verseStart, verseEnd, raw: m[0] };
}

function parseWritten(m: RegExpExecArray): RawMatch | null {
  const canonical = aliasToCanonical.get(m[1].toLowerCase());
  if (!canonical) return null;
  const chapter = Number(m[2]);
  const verseStart = m[3] !== undefined ? Number(m[3]) : undefined;
  const verseEnd = m[4] !== undefined ? Number(m[4]) : undefined;
  return { book: canonical, chapter, verseStart, verseEnd, raw: m[0] };
}

function collect(re: RegExp, text: string, parser: (m: RegExpExecArray) => RawMatch | null): RawMatch[] {
  const out: RawMatch[] = [];
  re.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const parsed = parser(m);
    if (parsed) out.push(parsed);
  }
  return out;
}

export type Confidence = 'high' | 'medium' | 'manual';

export interface DetectedReference {
  book: string;
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
  confidence: Confidence;
  raw: string;
}

/** Formats a detected reference back into a human-readable "Book C:V-V" label. */
export function formatReference(ref: DetectedReference): string {
  if (ref.verseStart == null) return `${ref.book} ${ref.chapter}`;
  if (ref.verseEnd != null && ref.verseEnd !== ref.verseStart) {
    return `${ref.book} ${ref.chapter}:${ref.verseStart}-${ref.verseEnd}`;
  }
  return `${ref.book} ${ref.chapter}:${ref.verseStart}`;
}

/** Stable key for equality comparisons between detected references. */
export function referenceKey(ref: DetectedReference): string {
  return `${ref.book}|${ref.chapter}|${ref.verseStart ?? ''}|${ref.verseEnd ?? ''}`;
}

/**
 * Scans free text for Bible references. Handles the way references are
 * actually spoken from a pulpit — word numbers ("seven fifteen"), a missing
 * colon ("Romans 7-15" = chapter 7 verse 15, not a range), and bare digit runs
 * ("Romans 715"). Written shorthand ("John 3:16", "Romans 8:28-30") still works,
 * where a dash genuinely is a range.
 */
export function scanText(text: string): DetectedReference[] {
  const normalized = wordsToDigits((text || '').toLowerCase());
  const raws = [
    ...collect(SPOKEN_RANGE_RE, normalized, parseRange),
    ...collect(SPOKEN_CV_RE, normalized, parseSpokenCv),
    ...collect(WRITTEN_RE, normalized, parseWritten),
  ];

  // Resolve overlaps:
  // 1. Drop a whole-chapter match when a verse match exists for the same
  //    book+chapter (e.g. "Romans 7" is just the prefix of "Romans 7:15").
  // 2. Drop a WRITTEN whole-chapter reading of a bare 3-digit run when the
  //    SPOKEN pattern has already split it into chapter+verse (e.g. "Romans 715"
  //    → 7:15; the WRITTEN "chapter 715" interpretation is impossible).
  const results: DetectedReference[] = [];
  for (const r of raws) {
    const supplanted =
      raws.some(
        (other) =>
          other !== r &&
          other.book === r.book &&
          other.chapter === r.chapter &&
          other.verseStart != null &&
          r.verseStart == null,
      ) ||
      (r.verseStart == null &&
        raws.some(
          (other) => other !== r && other.bareSplit === true && other.raw === r.raw,
        ));
    if (supplanted) continue;
    results.push({
      book: r.book,
      chapter: r.chapter,
      verseStart: r.verseStart,
      verseEnd: r.verseEnd,
      confidence: r.verseStart !== undefined ? 'high' : 'medium',
      raw: r.raw,
    });
  }
  return results;
}

/** Returns the right-most (most recently spoken) reference in the text, if any. */
export function scanLatestReference(text: string): DetectedReference | null {
  const matches = scanText(text);
  return matches.length > 0 ? matches[matches.length - 1] : null;
}

const STABILIZE_MS = 1000;

/**
 * Feed it live/growing transcript text over time; it only emits a reference
 * once the same detected ref has held steady for ~1s of stream, and emits
 * each stabilized ref at most once.
 */
export class ReferenceStabilizer {
  private candidate: DetectedReference | null = null;
  private candidateSince = 0;
  private lastEmittedKey: string | null = null;

  update(text: string, now: number = Date.now()): DetectedReference | null {
    const detected = scanLatestReference(text);
    if (!detected) {
      this.candidate = null;
      return null;
    }

    const key = referenceKey(detected);
    if (!this.candidate || referenceKey(this.candidate) !== key) {
      this.candidate = detected;
      this.candidateSince = now;
      return null;
    }

    if (now - this.candidateSince < STABILIZE_MS) return null;
    if (this.lastEmittedKey === key) return null;

    this.lastEmittedKey = key;
    return this.candidate;
  }

  reset(): void {
    this.candidate = null;
    this.candidateSince = 0;
  }
}
