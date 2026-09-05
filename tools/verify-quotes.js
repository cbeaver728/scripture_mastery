/* Checks every quote in data/prophets.js against churchofjesuschrist.org.
 *
 *   node tools/verify-quotes.js            # verify
 *   node tools/verify-quotes.js --refresh  # ignore the cache and re-download
 *
 * A quote is accepted only if it appears, as a contiguous run of words, on the
 * page it cites. If it does not, the tool searches that prophet's "Teachings of
 * Presidents" manual chapter by chapter and reports where the quote really is,
 * so the citation can be corrected rather than guessed at.
 *
 * Pages are cached under .source/quotes/ (gitignored). This is deliberately not
 * a CI step — it depends on a third-party site — but it must pass before any
 * change to the quote bank ships.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SITE = 'https://www.churchofjesuschrist.org';
const CACHE = path.join(__dirname, '..', '.source', 'quotes');
fs.mkdirSync(CACHE, { recursive: true });
const refresh = process.argv.includes('--refresh');

/* "Teachings of Presidents of the Church" volumes, for the search fallback. */
const MANUALS = {
  'Joseph Smith': 'teachings-joseph-smith',
  'Brigham Young': 'teachings-brigham-young',
  'John Taylor': 'teachings-john-taylor',
  'Wilford Woodruff': 'teachings-wilford-woodruff',
  'Lorenzo Snow': 'teachings-lorenzo-snow',
  'Joseph F. Smith': 'teachings-joseph-f-smith',
  'Heber J. Grant': 'teachings-heber-j-grant',
  'George Albert Smith': 'teachings-george-albert-smith',
  'David O. McKay': 'teachings-david-o-mckay',
  'Joseph Fielding Smith': 'teachings-joseph-fielding-smith',
  'Harold B. Lee': 'teachings-harold-b-lee',
  'Spencer W. Kimball': 'teachings-spencer-w-kimball',
  'Ezra Taft Benson': 'teachings-ezra-taft-benson',
  'Howard W. Hunter': 'teachings-howard-w-hunter',
  'Gordon B. Hinckley': 'teachings-gordon-b-hinckley'
};

global.window = {};
require(path.join(__dirname, '..', 'data', 'prophets.js'));
const quotes = window.PROPHET_QUOTES;
const prophets = window.PROPHETS;

const norm = (s) => s
  .replace(/[‘’ʼ]/g, "'").replace(/[“”]/g, '"').replace(/[—–‒]/g, ' ')
  .toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

function strip(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&rsquo;|&lsquo;/g, "'").replace(/&rdquo;|&ldquo;/g, '"')
    .replace(/&mdash;|&ndash;/g, ' ');
}

const rawCache = {};
async function raw(url) {
  if (rawCache[url] !== undefined) return rawCache[url];
  const key = crypto.createHash('sha1').update(url).digest('hex').slice(0, 16);
  const file = path.join(CACHE, key + '.html');
  let html;
  if (!refresh && fs.existsSync(file)) {
    html = fs.readFileSync(file, 'utf8');
  } else {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      html = res.ok ? await res.text() : '';
    } catch (e) { html = ''; }
    fs.writeFileSync(file, html);
  }
  rawCache[url] = html;
  return html;
}
async function pageText(url) { return norm(strip(await raw(url))); }

async function manualChapters(slug) {
  const html = await raw(`${SITE}/study/manual/${slug}?lang=eng`);
  const found = html.match(new RegExp('/study/manual/' + slug + '/[a-z0-9-]+', 'g')) || [];
  return [...new Set(found)].map((p) => `${SITE}${p}?lang=eng`);
}

(async () => {
  const names = new Set(prophets.map((p) => p.n));
  const verified = [], relocated = [], failed = [], bad = [];

  for (const q of quotes) {
    if (!names.has(q.p)) bad.push(`${q.p}: not in the succession list`);
    if (![1, 2, 3].includes(q.d)) bad.push(`${q.p}: difficulty must be 1-3`);
    const needle = norm(q.q);

    if (q.u && (await pageText(q.u)).includes(needle)) { verified.push(q); continue; }

    /* Not where it was filed — go looking through that prophet's manual. */
    let where = null;
    const slug = MANUALS[q.p];
    if (slug) {
      for (const url of await manualChapters(slug)) {
        if ((await pageText(url)).includes(needle)) { where = url; break; }
      }
    }
    if (where) relocated.push({ q, where });
    else failed.push(q);
  }

  console.log(`quotes: ${quotes.length}`);
  console.log(`  verified where cited: ${verified.length}`);
  console.log(`  found elsewhere:      ${relocated.length}`);
  console.log(`  NOT FOUND:            ${failed.length}`);

  if (relocated.length) {
    console.log('\n--- CITATION SHOULD BE ---');
    relocated.forEach((r) => console.log(`${r.q.p} | "${r.q.q.slice(0, 55)}…"\n  ${r.where}`));
  }
  if (failed.length) {
    console.log('\n--- NOT FOUND (fix the wording or drop the quote) ---');
    failed.forEach((f) => console.log(`${f.p}\n  "${f.q}"\n  cited: ${f.u || '(none)'}`));
  }
  if (bad.length) { console.log('\n--- DATA PROBLEMS ---'); bad.forEach((b) => console.log('  ' + b)); }

  process.exit(failed.length || relocated.length || bad.length ? 1 : 0);
})();
