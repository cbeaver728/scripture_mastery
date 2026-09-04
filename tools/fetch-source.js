/* Downloads the published scripture text used to verify the bank.
 * Writes to .source/ (gitignored — it is reference data, not part of the app).
 *
 *   node tools/fetch-source.js
 *
 * Source: github.com/bcbooks/scriptures-json — the standard works as JSON,
 * one entry per verse, keyed by the same reference format the bank uses.
 */
const fs = require('fs');
const path = require('path');

const BASE = 'https://raw.githubusercontent.com/bcbooks/scriptures-json/master';
const FILES = ['old-testament.json', 'new-testament.json', 'book-of-mormon.json',
               'doctrine-and-covenants.json', 'pearl-of-great-price.json'];

const out = path.join(__dirname, '..', '.source');
fs.mkdirSync(out, { recursive: true });

(async () => {
  for (const f of FILES) {
    const res = await fetch(`${BASE}/${f}`);
    if (!res.ok) { console.error(`${f}: HTTP ${res.status}`); process.exit(1); }
    const body = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(path.join(out, f), body);
    console.log(`${f}  ${(body.length / 1024).toFixed(0)} KB`);
  }
  console.log('\nNow run: node tools/verify-against-source.js');
})();
