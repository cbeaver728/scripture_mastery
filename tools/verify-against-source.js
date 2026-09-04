/* Checks every verse in data/ against the published scripture text.
 *
 *   node tools/fetch-source.js          # once, downloads to .source/ (gitignored)
 *   node tools/verify-against-source.js
 *
 * A verse in the bank may be the whole verse or a shorter excerpt of it, but it
 * must be a CONTIGUOUS run of words from the real verse. An excerpt that skips
 * over words in the middle silently rewrites scripture, so it is an error here.
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', '.source');
const FILES = ['old-testament.json', 'new-testament.json', 'book-of-mormon.json',
               'doctrine-and-covenants.json', 'pearl-of-great-price.json'];

if (!fs.existsSync(SRC)) {
  console.error('No .source/ directory. Run: node tools/fetch-source.js');
  process.exit(2);
}

/* ---- index every published verse by its reference ---- */
const source = new Map();
for (const f of FILES) {
  const p = path.join(SRC, f);
  if (!fs.existsSync(p)) { console.error('missing ' + f); process.exit(2); }
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  const containers = j.books
    ? j.books.flatMap((b) => b.chapters || [])
    : (j.sections || []);
  for (const c of containers) {
    for (const v of c.verses || []) source.set(v.reference, v.text);
  }
}

/* ---- load the bank ---- */
global.window = {};
['verses-ot.js', 'verses-nt.js', 'verses-bom.js', 'verses-dc-pgp.js']
  .forEach((f) => require(path.join(__dirname, '..', 'data', f)));
const bank = [].concat(window.VERSES_OT, window.VERSES_NT,
                       window.VERSES_BOM, window.VERSES_DC_PGP);

/* Compare on words alone: punctuation and capitalisation are ours to set,
   wording is not. */
const norm = (s) => s
  .replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
  .replace(/[—–]/g, ' ')
  .toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();

/* The bank cites a single psalm as "Psalm 23:1", which is the usual convention;
   the source file keys the whole book as "Psalms". Same verse either way. */
function lookup(ref) {
  if (source.has(ref)) return source.get(ref);
  const alias = ref.replace(/^Psalm /, 'Psalms ');
  return source.get(alias);
}

const missing = [], mismatched = [];
let exact = 0, excerpt = 0;

for (const v of bank) {
  const src = lookup(v.r);
  if (src === undefined) { missing.push(v.r); continue; }
  const a = norm(v.t), b = norm(src);
  if (a === b) exact++;
  else if (b.includes(a)) excerpt++;
  else mismatched.push({ ref: v.r, ours: v.t, source: src });
}

console.log(`source verses indexed: ${source.size}`);
console.log(`bank verses checked:   ${bank.length}`);
console.log(`  exact full verse:    ${exact}`);
console.log(`  contiguous excerpt:  ${excerpt}`);
console.log(`  reference not found: ${missing.length}`);
console.log(`  text mismatch:       ${mismatched.length}`);

if (missing.length) {
  console.log('\n--- REFERENCES NOT FOUND ---');
  missing.forEach((r) => console.log('  ' + r));
}
if (mismatched.length) {
  console.log('\n--- TEXT MISMATCHES ---');
  mismatched.forEach((m) => {
    console.log('\n' + m.ref);
    console.log('  ours  : ' + m.ours);
    console.log('  source: ' + m.source);
  });
}

process.exit(missing.length || mismatched.length ? 1 : 0);
