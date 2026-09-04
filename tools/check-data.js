/* Guards the verse bank. Run: node tools/check-data.js
   Fails the build if a blank phrase is not present in its verse, if a
   reference is duplicated, or if a required field is missing. */
const path = require('path');

global.window = {};
['verses-ot.js', 'verses-nt.js', 'verses-bom.js', 'verses-dc-pgp.js']
  .forEach((f) => require(path.join(__dirname, '..', 'data', f)));

const all = [].concat(
  window.VERSES_OT, window.VERSES_NT, window.VERSES_BOM, window.VERSES_DC_PGP
);

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

const byWork = {};
all.forEach((v) => { byWork[v.w] = (byWork[v.w] || 0) + 1; });

console.log(`${all.length} verses — ${JSON.stringify(byWork)}`);
console.log(`${all.filter((v) => v.s).length} attributed, ${speakers.size} distinct speakers`);
console.log(`${all.reduce((n, v) => n + (v.f || []).length, 0)} fill-in-the-blank phrases`);

if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  problems.forEach((p) => console.error('  ' + p));
  process.exit(1);
}
console.log('verse bank OK');
