# Scripture Mastery

A swipe-to-answer scripture quiz for the phone — the same thumb motion as endless
scrolling, pointed at something worth remembering. Every card is a question drawn
from the standard works: swipe the card **left**, **right**, or **down** toward the
answer you believe is right.

**Play it:** https://cbeaver728.github.io/scripture_mastery/

## The seven question types

| Type | The card shows | The three targets are |
| --- | --- | --- |
| **Who said it?** | A verse, with no reference | Three speakers |
| **Who is it?** | A description of a scripture person | Three names |
| **Verse → Reference** | A verse | Three references |
| **Reference → Verse** | A reference | Three verse segments |
| **Fill in the blank** | A verse with a word or phrase blanked out | Three phrases |
| **Doctrine Q&A** | A doctrinal question | Three references, one of which answers it |
| **Modern prophets** | A quote from a President of the Church | Three Presidents |

Pick any combination — all seven, one on its own, or everything except the one you
are tired of. The start screen shows how many distinct questions your current
selection can produce.

## Options

- **Length** — 5, 10, 20, or infinite.
- **Focus** — everything, one volume, a single book (Psalms, Isaiah, Alma, John…),
  or a curated collection: the Four Gospels, Words of the Savior, Epistles of Paul,
  Psalms & Wisdom, the Writings of Nephi, the Restoration.
- **Difficulty** — this changes *the wrong answers*, which is what actually makes a
  question hard:
  - **Familiar** — best-known verses; decoys come from a different volume.
  - **Steady** — a wider range of verses; decoys come from the same volume.
  - **Master** — the whole bank, and the decoys crowd in as close as they can get:
    - references from the **same chapter** where one exists — across a sample of
      150 Master questions, 95% of the three choices sat in one book and 27% in a
      single chapter (one drew Matthew 5:5, 5:6 and 5:7);
    - speakers that are genuinely easy to confuse — Alma the Elder against Alma
      the Younger, Mormon against Moroni, Peter against Paul;
    - blanks taken from the same chapter, matched on word count;
    - and the volume is never named on the card, so it cannot narrow anything.

A running score and streak sit at the top. Right answers get a green check and a
soft two-note bell; wrong ones hold the card still, mark the right answer in green,
and name the reference so the miss teaches you something. Every verse you miss is
listed in full on the results screen.

## The verse bank

765 verses, chosen for being doctrinally significant, famous, or worth carrying
around: 191 Old Testament, 259 New Testament, 190 Book of Mormon, 89 Doctrine and
Covenants, 36 Pearl of Great Price. 682 are attributed to one of 66 speakers, and
1,353 phrases are marked as blankable.

Three banks sit alongside the verses: **89 people** with 120 descriptive clues in
`data/people.js`; **108 doctrinal questions** in `data/doctrine.js`, each pointing
at the verse that answers it plus the other verses that would also fairly answer it
(so they are never offered as wrong choices); and **31 quotes** from Presidents of
the Church in `data/prophets.js`, spanning Joseph Smith to Dallin H. Oaks.

Altogether that is **3,824 distinct question stems** — 682 "who said it", 120
"who is it", 765 each way between verse and reference, 1,353 blanks, 108 doctrinal
questions, and 31 prophet quotes — before the randomized decoys multiply them.

Scripture text is from the King James Bible and the Restoration scriptures, all
public domain. Prophet quotations are short excerpts cited to the page they appear
on at churchofjesuschrist.org.

### Accuracy

Every verse is checked against the published text, and the check runs in CI on
every deploy, so a wrong quotation cannot ship:

```bash
node tools/fetch-source.js          # once — downloads the standard works to .source/
node tools/verify-against-source.js
```

A bank entry may be the whole verse or a shorter excerpt, but it must be a
**contiguous** run of words from the real verse. An excerpt that skips words in
the middle silently rewrites scripture, so the verifier treats it as an error —
which is how the first audit caught six entries filed under the wrong reference
and eleven that had been quietly condensed.

Excerpts exist mostly to keep a card honest: `Ruth 1:16` opens "And Ruth said,"
in the text, which would give away a "who said it" question, so the bank starts
that verse at "Entreat me not to leave thee."

Prophet quotes get the same treatment against a different source. Each one cites
the page it appears on, and `tools/verify-quotes.js` fetches that page and checks
the quote is really there:

```bash
node tools/verify-quotes.js            # all 31 must pass
node tools/verify-quotes.js --refresh  # ignore the cache and re-download
```

If a quote is not on the page it cites, the tool searches that prophet's
*Teachings of Presidents of the Church* volume and reports where it actually is,
so the citation gets corrected instead of guessed at. That check is how the
first draft of this bank lost nine quotes it could not substantiate and had four
more corrected — President Oaks says "forego", not "forgo", and President Kimball
asked "Are we prepared to lengthen our stride?", not "Lengthen your stride."

This one is not a CI step, because it depends on a third-party site being up.
`check-data.js` enforces the half that can be checked offline: **a quote without
a source URL does not ship.**

### How often questions repeat

Every stem you have been served is remembered in `localStorage` and is not shown
again until the bank is spent, so the app works through it rather than re-rolling
each session. At 20 questions a day that is roughly **six months** before the
first repeat on the default setting. Narrowing the focus, the difficulty, or the
set of question types narrows the pool — all seven types at Master over the whole
bank draws from 3,824 stems; an all-Alma run from 245.

### Adding verses

Don't type scripture — curate references and let the text come from the source.
List what you want in `tools/pending.json`:

```json
{ "r": "Alma 32:21", "s": "Alma the Younger", "d": 1,
  "from": "faith is not",
  "f": ["a perfect knowledge of things"] }
```

`from` and `to` are optional anchors that trim the entry to a contiguous excerpt
— use them to drop an opening like "And Ammon said that" which would give away a
"who said it" answer. `w` and `b` are filled in from the reference, and the blanks
are matched on words alone and rewritten to the source's exact punctuation, so a
slightly-off phrase self-corrects rather than failing.

```bash
node tools/add-verses.js tools/pending.json    # prints entries; paste into data/
```

Each entry ends up in the right file in `data/` looking like this:

```js
{r:"Alma 32:21", w:"bom", b:"Alma", s:"Alma the Younger", d:1,
 t:"Faith is not to have a perfect knowledge of things…",
 f:["a perfect knowledge of things"]}
```

| Field | Meaning |
| --- | --- |
| `r` | Reference, formatted `Book Chapter:Verse` |
| `w` | Volume — `ot`, `nt`, `bom`, `dc`, `pgp` |
| `b` | Book name (drives the focus menu; 4+ verses earns its own entry) |
| `s` | Speaker — omit for narration, since it feeds "Who said it?" |
| `d` | Difficulty 1–3 (1 = famous) |
| `t` | Verse text |
| `f` | Phrases that can be blanked — each **must** appear verbatim in `t` |

### Adding people and doctrinal questions

`data/people.js` takes `{n, w, b, d, c}` — name, volume, home book, difficulty,
and an array of clues. Each clue becomes its own question, so give the well-known
figures two or three. A clue must never name its own subject (the guard checks),
and `g:"f"` marks a woman so the choices stay consistent with the clue's pronouns.

`data/doctrine.js` takes `{q, r, d, x}` — the question, the reference of the verse
that answers it, difficulty, and `x`, the other references that would also fairly
answer it. Everything in `x` is barred from appearing as a wrong choice, which is
what keeps a question from having two right answers. Both `r` and every `x` must
exist in the verse bank.

`data/prophets.js` takes `{p, d, q, src, u}` — prophet, difficulty, the quote,
a human-readable source, and the URL that proves it. Add the quote, then run
`node tools/verify-quotes.js` and fix whatever it reports before committing.

Then run both guards, which are also build steps:

```bash
node tools/check-data.js
node tools/verify-against-source.js
```

## Running it locally

```bash
node tools/serve.js 5173
```

No build step, no dependencies, no network calls — plain HTML, CSS, and JavaScript.

## On a phone

It is a PWA: open the link in Chrome on Android and use **Add to home screen**. It
then launches full-screen with its own icon and works offline, since the service
worker caches the whole app and verse bank. Scores and settings are kept in
`localStorage` on the device.

Regenerate the launcher icons after editing `tools/make-icons.js`:

```bash
node tools/make-icons.js
```
