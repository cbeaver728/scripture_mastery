# Scripture Mastery

A swipe-to-answer scripture quiz for the phone — the same thumb motion as endless
scrolling, pointed at something worth remembering. Every card is a question drawn
from the standard works: swipe the card **left**, **right**, or **down** toward the
answer you believe is right.

**Play it:** https://cbeaver728.github.io/scripture_mastery/

## The four question types

| Type | The card shows | The three targets are |
| --- | --- | --- |
| **Who said it?** | A verse, with no reference | Three speakers |
| **Verse → Reference** | A verse | Three references |
| **Reference → Verse** | A reference | Three verse segments |
| **Fill in the blank** | A verse with a word or phrase blanked out | Three phrases |

Any of them can be drilled on its own, or shuffled together in a mixed run.

## Options

- **Length** — 5, 10, 20, or infinite.
- **Focus** — everything, one volume, a single book (Psalms, Isaiah, Alma, John…),
  or a curated collection: the Four Gospels, Words of the Savior, Epistles of Paul,
  Psalms & Wisdom, the Writings of Nephi, the Restoration.
- **Difficulty** — this changes *the wrong answers*, which is what actually makes a
  question hard:
  - **Familiar** — best-known verses; decoys come from a different volume.
  - **Steady** — a wider range of verses; decoys come from the same volume.
  - **Master** — the whole bank; decoys come from the same book, and often the
    neighboring chapter. Telling Alma 37:6 from Alma 37:35 is the point.

A running score and streak sit at the top. Right answers get a green check and a
soft two-note bell; wrong ones hold the card still, mark the right answer in green,
and name the reference so the miss teaches you something. Every verse you miss is
listed in full on the results screen.

## The verse bank

763 verses, chosen for being doctrinally significant, famous, or worth carrying
around: 191 Old Testament, 258 New Testament, 190 Book of Mormon, 88 Doctrine and
Covenants, 36 Pearl of Great Price. 680 are attributed to one of 66 speakers, and
1,350 phrases are marked as blankable.

That yields **3,556 distinct question stems** — 680 "who said it", 763 each way
between verse and reference, and 1,350 blanks — before the randomized decoys
multiply them further.

Text is from the King James Bible and the Restoration scriptures, all public domain.

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

### How often questions repeat

Every stem you have been served is remembered in `localStorage` and is not shown
again until the bank is spent, so the app works through it rather than re-rolling
each session. At 20 questions a day that is roughly **six months** before the
first repeat on the default setting. Narrowing the focus or difficulty narrows the
pool — a Master-difficulty run over all the standard works draws from 3,556 stems,
an all-Alma run from 245.

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
