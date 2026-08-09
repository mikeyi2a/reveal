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
// Matches both written shorthand ("John 3:16", "Romans 8:28-30") and the way
// references are actually spoken from a pulpit ("John chapter 3 verse 16",
// "Romans chapter 8, verse 28 through 30").
const REFERENCE_RE = new RegExp(
  String.raw`\b(${BOOK_GROUP})\.?\s+(?:chapter\s+)?(\d{1,3})(?:\s*,?\s*(?:verses?\s+|:\s*)(\d{1,3})(?:\s*(?:[-–—]|through|to)\s*(\d{1,3}))?)?\b`,
  'gi',
);

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
 * Scans free text for Bible references. Requires a digit (chapter number)
 * immediately after the book name, so bare mentions of a name that is also
 * a book ("John", "James", "Mark") never match on their own.
 */
export function scanText(text: string): DetectedReference[] {
  const results: DetectedReference[] = [];
  REFERENCE_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = REFERENCE_RE.exec(text)) !== null) {
    const canonical = aliasToCanonical.get(match[1].toLowerCase());
    if (!canonical) continue;
    const chapter = Number(match[2]);
    const verseStart = match[3] !== undefined ? Number(match[3]) : undefined;
    const verseEnd = match[4] !== undefined ? Number(match[4]) : undefined;
    results.push({
      book: canonical,
      chapter,
      verseStart,
      verseEnd,
      confidence: verseStart !== undefined ? 'high' : 'medium',
      raw: match[0],
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
