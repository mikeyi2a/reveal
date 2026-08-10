import { scanText, formatReference } from './src/lib/referenceScanner.ts';
const cases = [
  "Let's turn to Romans 715.",
  "Romans 7-15",
  "Romans seven fifteen",
  "Romans chapter seven verse fifteen",
  "Romans 7 verse 15",
  "Romans 8:28-30",
  "John 3:16",
  "Psalm 119",
  "Romans 7:1-8 should also work",
  "turn to first Corinthians 13 4",
  "Romans 7 15",
  "turn to Matthew twenty three one",
];
for (const c of cases) {
  const r = scanText(c);
  console.log(JSON.stringify(c), '=>', r.map(x => formatReference(x)).join(' | ') || '(none)');
}
