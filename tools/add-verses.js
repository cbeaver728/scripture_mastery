/* Turns a curation list into bank entries, with verse text taken from the
 * published source rather than typed by hand.
 *
 *   node tools/add-verses.js tools/pending.json > out.txt
 *
 * Each curation entry is:
 *   { "r": "Alma 32:21", "s": "Alma the Younger", "d": 1,
 *     "from": "faith is not",        // optional: start the excerpt here
 *     "to":   "which are true",      // optional: end the excerpt here
 *     "f": ["a perfect knowledge"] } // blanks, snapped to the real wording
 *
 * `w` and `b` are derived from the reference. Blanks are matched on words
 * alone and rewritten to the source's exact punctuation and capitalisation,
 * so a slightly-off phrase self-corrects instead of failing the build.
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', '.source');
const FILES = {
  'old-testament.json': 'ot', 'new-testament.json': 'nt',
  'book-of-mormon.json': 'bom', 'doctrine-and-covenants.json': 'dc',
  'pearl-of-great-price.json': 'pgp'
};

const source = new Map();   // reference -> { text, work, book }
for (const [f, work] of Object.entries(FILES)) {
  const j = JSON.parse(fs.readFileSync(path.join(SRC, f), 'utf8'));
  if (j.books) {
    for (const b of j.books) {
      for (const c of b.chapters || []) {
        for (const v of c.verses || []) {
          source.set(v.reference, { text: v.text, work, book: b.book });
        }
      }
    }
  } else {
    for (const s of j.sections || []) {
      for (const v of s.verses || []) {
        source.set(v.reference, { text: v.text, work, book: 'Doctrine and Covenants' });
      }
    }
  }
}
function lookup(ref) {
  return source.get(ref) || source.get(ref.replace(/^Psalm /, 'Psalms '));
}

/* ---- word-level matching so anchors and blanks can be approximate ---- */
const normWord = (w) => w
  .replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
  .toLowerCase().replace(/[^a-z0-9']/g, '');

function words(text) {
  const out = [];
  const re = /\S+/g;
  let m;
  while ((m = re.exec(text))) {
    const n = normWord(m[0]);
    if (n) out.push({ raw: m[0], n, start: m.index, end: m.index + m[0].length });
  }
  return out;
}
/* Index of the word-run matching `phrase`, or -1. */
function findRun(ws, phrase) {
  const target = phrase.split(/\s+/).map(normWord).filter(Boolean);
  if (!target.length) return -1;
  for (let i = 0; i + target.length <= ws.length; i++) {
    let ok = true;
    for (let j = 0; j < target.length; j++) {
      if (ws[i + j].n !== target[j]) { ok = false; break; }
    }
    if (ok) return i;
  }
  return -1;
}

const problems = [];
const out = [];
const list = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

for (const e of list) {
  const hit = lookup(e.r);
  if (!hit) { problems.push(`${e.r}: reference not found in source`); continue; }

  let text = hit.text;
  let ws = words(text);

  if (e.from) {
    const i = findRun(ws, e.from);
    if (i < 0) { problems.push(`${e.r}: from-anchor not found: "${e.from}"`); continue; }
    text = text.slice(ws[i].start);
    ws = words(text);
  }
  if (e.to) {
    const i = findRun(ws, e.to);
    if (i < 0) { problems.push(`${e.r}: to-anchor not found: "${e.to}"`); continue; }
    const last = ws[i + e.to.split(/\s+/).filter(Boolean).length - 1];
    text = text.slice(0, last.end);
    ws = words(text);
  }

  /* Tidy the seams an excerpt leaves behind. */
  text = text.trim().replace(/^[,;:—–-]\s*/, '').replace(/[,;:—–]$/, '.');
  text = text.charAt(0).toUpperCase() + text.slice(1);
  if (!/[.!?]$/.test(text)) text += '.';
  ws = words(text);

  /* Snap each blank onto the real wording. */
  const blanks = [];
  for (const want of e.f || []) {
    const i = findRun(ws, want);
    if (i < 0) { problems.push(`${e.r}: blank not in verse: "${want}"`); continue; }
    const n = want.split(/\s+/).filter(Boolean).length;
    const exact = text.slice(ws[i].start, ws[i + n - 1].end).replace(/[,;:.!?—–]+$/, '');
    if (exact && !blanks.includes(exact)) blanks.push(exact);
  }
  if (!blanks.length) { problems.push(`${e.r}: no usable blanks`); continue; }

  if (e.s && text.includes(e.s) && e.s !== 'Jesus Christ') {
    console.error(`  note: ${e.r} names its speaker (${e.s}) in the text`);
  }

  const j = JSON.stringify;
  out.push(`{r:${j(e.r)},w:${j(hit.work)},b:${j(hit.book)},` +
    (e.s ? `s:${j(e.s)},` : '') +
    `d:${e.d},t:${j(text)},f:[${blanks.map(j).join(',')}]}`);
}

if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  problems.forEach((p) => console.error('  ' + p));
}
console.error(`\ngenerated ${out.length} of ${list.length}`);
console.log(out.join(',\n'));
