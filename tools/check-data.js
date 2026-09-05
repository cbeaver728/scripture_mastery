/* Guards the verse bank. Run: node tools/check-data.js
   Fails the build if a blank phrase is not present in its verse, if a
   reference is duplicated, or if a required field is missing. */
const path = require('path');

global.window = {};
['verses-ot.js', 'verses-nt.js', 'verses-bom.js', 'verses-dc-pgp.js',
 'people.js', 'doctrine.js', 'prophets.js']
  .forEach((f) => require(path.join(__dirname, '..', 'data', f)));

const all = [].concat(
  window.VERSES_OT, window.VERSES_NT, window.VERSES_BOM, window.VERSES_DC_PGP
);
const people = window.PEOPLE;
const doctrine = window.DOCTRINE;

const problems = [];
const refs = new Set();
const speakers = new Set();

all.forEach((v) => {
  ['r', 'w', 'b', 't'].forEach((k) => {
    if (!v[k]) problems.push(`${v.r || '(no ref)'}: missing "${k}"`);
  });
  if (refs.has(v.r)) problems.push(`${v.r}: duplicate reference`);
  refs.add(v.r);
  if (![1, 2, 3].includes(v.d)) problems.push(`${v.r}: difficulty must be 1-3`);
  if (v.s) speakers.add(v.s);
  (v.f || []).forEach((p) => {
    if (!v.t.includes(p)) problems.push(`${v.r}: blank "${p}" is not in the verse`);
  });
});

/* Two verses with identical text would give a "which reference is this?"
   question two right answers, so they must never both be in the bank. */
const norm = (s) => s.toLowerCase().replace(/[^a-z ]+/g, '').replace(/\s+/g, ' ').trim();
const byText = new Map();
all.forEach((v) => {
  const k = norm(v.t);
  if (byText.has(k)) problems.push(`${v.r}: identical text to ${byText.get(k)}`);
  else byText.set(k, v.r);
});

/* ---- "Who is it?" bank ---- */
const names = new Set();
people.forEach((p) => {
  if (!p.n || !p.w || !p.b) problems.push(`${p.n || '(unnamed)'}: missing a field`);
  if (names.has(p.n)) problems.push(`${p.n}: duplicate person`);
  names.add(p.n);
  if (![1, 2, 3].includes(p.d)) problems.push(`${p.n}: difficulty must be 1-3`);
  if (!p.c || !p.c.length) problems.push(`${p.n}: no clues`);
  /* A clue that names its own subject gives the answer away. */
  (p.c || []).forEach((clue) => {
    const bare = p.n.replace(/^(The|King|Captain) /, '').split(/ (of|the) /)[0];
    if (bare.length > 3 && new RegExp(`\\b${bare}\\b`, 'i').test(clue)) {
      problems.push(`${p.n}: clue names the person — "${clue.slice(0, 50)}…"`);
    }
  });
});

/* ---- doctrinal bank ---- */
const byRef = new Map(all.map((v) => [v.r, v]));
const asked = new Set();
doctrine.forEach((q) => {
  if (!q.q || !q.r) { problems.push('doctrine entry missing q or r'); return; }
  if (asked.has(q.q)) problems.push(`duplicate doctrinal question: ${q.q}`);
  asked.add(q.q);
  if (![1, 2, 3].includes(q.d)) problems.push(`${q.q}: difficulty must be 1-3`);
  if (!byRef.has(q.r)) problems.push(`${q.q}: answer ${q.r} is not in the verse bank`);
  (q.x || []).forEach((r) => {
    if (!byRef.has(r)) problems.push(`${q.q}: excluded ${r} is not in the verse bank`);
    if (r === q.r) problems.push(`${q.q}: excludes its own answer`);
  });
});

/* ---- modern prophets ---- */
const succession = new Set(window.PROPHETS.map((p) => p.n));
const orders = new Set();
window.PROPHETS.forEach((p) => {
  if (!p.n || !p.y) problems.push(`${p.n || '(unnamed)'}: missing a field`);
  if (orders.has(p.o)) problems.push(`${p.n}: duplicate order ${p.o}`);
  orders.add(p.o);
});
const saidAlready = new Set();
window.PROPHET_QUOTES.forEach((q) => {
  if (!succession.has(q.p)) problems.push(`quote attributed to "${q.p}", who is not in the succession`);
  if (![1, 2, 3].includes(q.d)) problems.push(`${q.p}: difficulty must be 1-3`);
  if (!q.q || !q.src) problems.push(`${q.p}: quote or source missing`);
  /* No citation means no way to check it, and an unverifiable quote does not ship. */
  if (!q.u) problems.push(`${q.p}: quote has no source url — see tools/verify-quotes.js`);
  if (saidAlready.has(q.q)) problems.push(`duplicate quote: ${q.q.slice(0, 40)}…`);
  saidAlready.add(q.q);
});

const byWork = {};
all.forEach((v) => { byWork[v.w] = (byWork[v.w] || 0) + 1; });

console.log(`${all.length} verses — ${JSON.stringify(byWork)}`);
console.log(`${all.filter((v) => v.s).length} attributed, ${speakers.size} distinct speakers`);
console.log(`${all.reduce((n, v) => n + (v.f || []).length, 0)} fill-in-the-blank phrases`);
console.log(`${people.length} people, ${people.reduce((n, p) => n + p.c.length, 0)} clues`);
console.log(`${doctrine.length} doctrinal questions`);
console.log(`${window.PROPHETS.length} prophets, ${window.PROPHET_QUOTES.length} verified quotes`);

if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  problems.forEach((p) => console.error('  ' + p));
  process.exit(1);
}
console.log('verse bank OK');
