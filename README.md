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

578 verses, chosen for being doctrinally significant, famous, or worth carrying
around: 130 Old Testament, 185 New Testament, 157 Book of Mormon, 75 Doctrine and
Covenants, 31 Pearl of Great Price. 527 are attributed to one of 65 speakers, and
1,058 phrases are marked as blankable.

That yields **2,741 distinct question stems** — 527 "who said it", 578 each way
between verse and reference, and 1,058 blanks — before the randomized decoys
multiply them further.

Text is from the King James Bible and the Restoration scriptures, all public domain.

### How often questions repeat

Every stem you have been served is remembered in `localStorage` and is not shown
again until the bank is spent, so the app works through it rather than re-rolling
each session. At 20 questions a day that is roughly **four and a half months**
before the first repeat on the default setting. Narrowing the focus or difficulty
narrows the pool — a Master-difficulty run over all the standard works draws from
2,741 stems, an all-Alma run from 208.

### Adding verses

Append to the right file in `data/`:

```js
{r:"Alma 32:21", w:"bom", b:"Alma", s:"Alma the Younger", d:1,
 t:"And now as I said concerning faith…",
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

Then run the guard, which is also a build step:

```bash
node tools/check-data.js
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
