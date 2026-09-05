/* ========================================================================
   Scripture Mastery — swipe-to-answer scripture drills.
   ===================================================================== */
(function () {
'use strict';

/* ------------------------------ bank ------------------------------ */
var VERSES = [].concat(
  window.VERSES_OT || [], window.VERSES_NT || [],
  window.VERSES_BOM || [], window.VERSES_DC_PGP || []
);

var WORK_NAME = {
  ot: 'Old Testament', nt: 'New Testament', bom: 'Book of Mormon',
  dc: 'Doctrine and Covenants', pgp: 'Pearl of Great Price'
};

var PEOPLE = window.PEOPLE || [];
var DOCTRINE = window.DOCTRINE || [];
var PROPHETS = window.PROPHETS || [];
var PROPHET_QUOTES = window.PROPHET_QUOTES || [];

var ALL_TYPES = ['who', 'whois', 'text2ref', 'ref2text', 'blank', 'doctrine', 'prophet'];

/* Speakers that are genuinely easy to mix up. At Master these are preferred as
   wrong answers, because "Alma the Elder or the Younger?" is the real question. */
var CONFUSABLE = {
  'Alma the Younger': ['Alma the Elder', 'Amulek', 'Ammon', 'Helaman'],
  'Alma the Elder': ['Alma the Younger', 'Abinadi', 'King Benjamin'],
  'Amulek': ['Alma the Younger', 'Ammon', 'Aaron'],
  'Ammon': ['Aaron', 'Amulek', 'Alma the Younger'],
  'Mormon': ['Moroni', 'Helaman', 'Nephi'],
  'Moroni': ['Mormon', 'Captain Moroni', 'Ether'],
  'Captain Moroni': ['Moroni', 'Helaman', 'Teancum'],
  'Helaman': ['Captain Moroni', 'Mormon', 'Alma the Younger'],
  'Nephi': ['Lehi', 'Jacob', 'Mormon'],
  'Lehi': ['Nephi', 'Jacob'],
  'Jacob': ['Nephi', 'Lehi', 'Enos'],
  'Enos': ['Jacob', 'Amaleki', 'Nephi'],
  'Peter': ['Paul', 'James', 'John the Beloved'],
  'Paul': ['Peter', 'James', 'John the Beloved'],
  'James': ['Paul', 'Peter', 'John the Beloved'],
  'John the Beloved': ['Peter', 'Paul', 'James'],
  'Jehovah': ['Jesus Christ', 'God the Father'],
  'Jesus Christ': ['Jehovah', 'God the Father'],
  'Moses': ['Joshua', 'Jehovah', 'Aaron of old'],
  'Isaiah': ['Jeremiah', 'Micah', 'Malachi'],
  'Joseph Smith': ['John Taylor', 'Joseph F. Smith', 'Jesus Christ'],
  'Samuel': ['David', 'Samuel the Lamanite'],
  'Samuel the Lamanite': ['Samuel', 'Abinadi', 'Nephi']
};

/* ------------------------- indexes / helpers ------------------------- */
var REF_RE = /^(.*?)\s+(\d+):(\d+)$/;
VERSES.forEach(function (v) {
  var m = REF_RE.exec(v.r);
  v._ch = m ? +m[2] : 0;
  v._vs = m ? +m[3] : 0;
  v.f = v.f || [];
});

var PHRASES = [];
VERSES.forEach(function (v) {
  v.f.forEach(function (p) {
    PHRASES.push({ p: p, w: v.w, b: v.b, r: v.r, ch: v._ch });
  });
});

function words(s) { return s.trim().split(/\s+/).length; }
function shuffle(a) {
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}
function sample(a) { return a[Math.floor(Math.random() * a.length)]; }
function esc(s) {
  return String(s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}

/* Take a short, memorable segment of a verse for the answer chips. */
function snippet(v) {
  var best = null;
  v.f.forEach(function (p) {
    if (p.length >= 18 && p.length <= 74 && (!best || p.length > best.length)) best = p;
  });
  if (best) return best;
  var t = v.t;
  if (t.length <= 74) return t;
  var cut = t.slice(0, 74);
  var sp = cut.lastIndexOf(' ');
  return (sp > 40 ? cut.slice(0, sp) : cut) + '…';
}

/* --------------------------- focus options --------------------------- */
function bookCount(b) {
  var n = 0;
  for (var i = 0; i < VERSES.length; i++) if (VERSES[i].b === b) n++;
  return n;
}

var COLLECTIONS = [
  { id: 'all', label: 'All standard works', test: function () { return true; } },
  { id: 'c:gospels', label: 'The Four Gospels', test: function (v) {
      return v.b === 'Matthew' || v.b === 'Mark' || v.b === 'Luke' || v.b === 'John'; } },
  { id: 'c:christ', label: 'Words of the Savior', test: function (v) {
      return v.s === 'Jesus Christ' || v.s === 'Jehovah'; } },
  { id: 'c:paul', label: 'Epistles of Paul', test: function (v) { return v.s === 'Paul'; } },
  { id: 'c:wisdom', label: 'Psalms, Proverbs & Wisdom', test: function (v) {
      return v.b === 'Psalms' || v.b === 'Proverbs' || v.b === 'Ecclesiastes' || v.b === 'Job'; } },
  { id: 'c:nephi', label: 'The Writings of Nephi', test: function (v) {
      return v.b === '1 Nephi' || v.b === '2 Nephi'; } },
  { id: 'c:restoration', label: 'The Restoration (D&C + PGP)', test: function (v) {
      return v.w === 'dc' || v.w === 'pgp'; } }
];

function focusTest(id) {
  for (var i = 0; i < COLLECTIONS.length; i++) if (COLLECTIONS[i].id === id) return COLLECTIONS[i].test;
  if (id.indexOf('w:') === 0) { var w = id.slice(2); return function (v) { return v.w === w; }; }
  if (id.indexOf('b:') === 0) { var b = id.slice(2); return function (v) { return v.b === b; }; }
  return function () { return true; };
}
function focusLabel(id) {
  for (var i = 0; i < COLLECTIONS.length; i++) if (COLLECTIONS[i].id === id) return COLLECTIONS[i].label;
  if (id.indexOf('w:') === 0) return WORK_NAME[id.slice(2)];
  if (id.indexOf('b:') === 0) return id.slice(2);
  return 'All standard works';
}

function buildFocusMenu() {
  var sel = $('#opt-focus');
  var html = '<optgroup label="Collections">';
  COLLECTIONS.forEach(function (c) {
    var n = VERSES.filter(c.test).length;
    html += '<option value="' + c.id + '">' + esc(c.label) + ' (' + n + ')</option>';
  });
  html += '</optgroup>';

  ['ot', 'nt', 'bom', 'dc', 'pgp'].forEach(function (w) {
    var inWork = VERSES.filter(function (v) { return v.w === w; });
    if (!inWork.length) return;
    html += '<optgroup label="' + esc(WORK_NAME[w]) + '">';
    html += '<option value="w:' + w + '">All of ' + esc(WORK_NAME[w]) + ' (' + inWork.length + ')</option>';
    var seen = [];
    inWork.forEach(function (v) { if (seen.indexOf(v.b) < 0) seen.push(v.b); });
    seen.forEach(function (b) {
      var n = bookCount(b);
      if (n >= 4 && b !== WORK_NAME[w]) {
        html += '<option value="b:' + esc(b) + '">' + esc(b) + ' (' + n + ')</option>';
      }
    });
    html += '</optgroup>';
  });
  sel.innerHTML = html;
}

/* ============================== state ============================== */
var prefs = {
  types: ALL_TYPES.slice(), len: 10, focus: 'all', diff: 2, sound: true, haptic: true
};
var stats = { answered: 0, correct: 0, best: 0 };

/* Question stems already served, kept across sessions so the bank rotates
   instead of re-rolling from scratch every quiz. Cleared once it is spent. */
var seen = {};
var seenDirty = 0;

var game = null;   // active quiz
var q = null;      // active question
var locked = false;

/* --------------------------- persistence --------------------------- */
function load() {
  try {
    var p = JSON.parse(localStorage.getItem('sm.prefs') || 'null');
    if (p) for (var k in p) if (k in prefs) prefs[k] = p[k];
    /* Older builds stored a single type; carry it forward. */
    if (p && typeof p.type === 'string') {
      prefs.types = p.type === 'mixed' ? ALL_TYPES.slice() : [p.type];
    }
    prefs.types = (prefs.types || []).filter(function (t) { return ALL_TYPES.indexOf(t) >= 0; });
    if (!prefs.types.length) prefs.types = ALL_TYPES.slice();
    var s = JSON.parse(localStorage.getItem('sm.stats') || 'null');
    if (s) for (var j in s) if (j in stats) stats[j] = s[j];
    var k = localStorage.getItem('sm.seen');
    if (k) k.split('\n').forEach(function (key) { if (key) seen[key] = 1; });
  } catch (e) { /* private mode, fresh start */ }
}
function savePrefs() { try { localStorage.setItem('sm.prefs', JSON.stringify(prefs)); } catch (e) {} }
function saveStats() { try { localStorage.setItem('sm.stats', JSON.stringify(stats)); } catch (e) {} }
function saveSeen() {
  seenDirty = 0;
  try { localStorage.setItem('sm.seen', Object.keys(seen).join('\n')); } catch (e) {}
}

/* ============================== audio ============================== */
var actx = null;
function audio() {
  if (!prefs.sound) return null;
  try {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    return actx;
  } catch (e) { return null; }
}
function tone(ctx, freq, start, dur, peak, type) {
  var o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type || 'sine';
  o.frequency.setValueAtTime(freq, ctx.currentTime + start);
  g.gain.setValueAtTime(0.0001, ctx.currentTime + start);
  g.gain.exponentialRampToValueAtTime(peak, ctx.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
  o.connect(g); g.connect(ctx._bus);
  o.start(ctx.currentTime + start);
  o.stop(ctx.currentTime + start + dur + 0.05);
}
function bus(ctx) {
  if (!ctx._bus) {
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 5200;
    var out = ctx.createGain(); out.gain.value = 0.9;
    lp.connect(out); out.connect(ctx.destination);
    ctx._bus = lp;
  }
  return ctx;
}
/* A soft, affirming two-note bell. */
function soundGood(streak) {
  var ctx = audio(); if (!ctx) return; bus(ctx);
  tone(ctx, 783.99, 0, 0.55, 0.16);            // G5
  tone(ctx, 1046.50, 0.085, 0.75, 0.13);       // C6
  tone(ctx, 1567.98, 0.085, 0.55, 0.045);      // G6 shimmer
  if (streak && streak % 5 === 0) tone(ctx, 2093.00, 0.2, 0.7, 0.05);
}
/* A gentle, non-punishing low note. */
function soundBad() {
  var ctx = audio(); if (!ctx) return; bus(ctx);
  var o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(220, ctx.currentTime);
  o.frequency.exponentialRampToValueAtTime(146.83, ctx.currentTime + 0.28);
  g.gain.setValueAtTime(0.0001, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.11, ctx.currentTime + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.42);
  o.connect(g); g.connect(ctx._bus);
  o.start(); o.stop(ctx.currentTime + 0.5);
}
function buzz(pattern) {
  if (!prefs.haptic) return;
  try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) {}
}

/* ========================= question building ========================= */
function poolFor(focus, diff) {
  var test = focusTest(focus);
  var base = VERSES.filter(test);
  for (var d = diff; d <= 3; d++) {
    var p = base.filter(function (v) { return v.d <= d; });
    if (p.length >= 3) return p;
  }
  return base.length ? base : VERSES.slice();
}

/* People and doctrinal questions are filtered by the same focus and difficulty.
   A person matches a focus by their volume and home book; a doctrinal question
   matches by the verse that answers it. */
var BY_REF = {};
VERSES.forEach(function (v) { BY_REF[v.r] = v; });

function contextFor(focus, diff) {
  var test = focusTest(focus);
  var people = PEOPLE.filter(function (p) { return p.d <= diff && test(p); });
  if (people.length < 3) people = PEOPLE.filter(function (p) { return p.d <= diff; });
  if (people.length < 3) people = PEOPLE.slice();

  var doctrine = DOCTRINE.filter(function (q) {
    var v = BY_REF[q.r];
    return v && q.d <= diff && test(v);
  });
  if (!doctrine.length) {
    doctrine = DOCTRINE.filter(function (q) { return BY_REF[q.r] && q.d <= diff; });
  }
  if (!doctrine.length) doctrine = DOCTRINE.filter(function (q) { return BY_REF[q.r]; });

  /* Prophet quotes are not scripture, so a book-level focus does not describe
     them. They come along with the whole bank and the Restoration focuses. */
  var wide = focus === 'all' || focus === 'c:restoration'
             || focus === 'w:dc' || focus === 'w:pgp';
  var quotes = wide ? PROPHET_QUOTES.filter(function (q) { return q.d <= diff; }) : [];

  return { people: people, doctrine: doctrine, quotes: quotes, byRef: BY_REF };
}
function widestContext() {
  return {
    people: PEOPLE,
    doctrine: DOCTRINE.filter(function (q) { return BY_REF[q.r]; }),
    quotes: PROPHET_QUOTES,
    byRef: BY_REF
  };
}

/* How many distinct questions the current settings can produce. */
function availableStems(types, focus, diff) {
  var pool = poolFor(focus, diff);
  var ctx = contextFor(focus, diff);
  var n = 0;
  types.forEach(function (t) {
    if (t === 'who') n += pool.filter(function (v) { return v.s; }).length;
    else if (t === 'text2ref' || t === 'ref2text') n += pool.length;
    else if (t === 'blank') n += pool.reduce(function (a, v) { return a + v.f.length; }, 0);
    else if (t === 'whois') n += ctx.people.reduce(function (a, p) { return a + p.c.length; }, 0);
    else if (t === 'doctrine') n += ctx.doctrine.length;
    else if (t === 'prophet') n += ctx.quotes.length;
  });
  return n;
}

/* Distractors get closer to the answer as difficulty rises. */
function nearness(diff) { return diff >= 3 ? 'tight' : diff === 2 ? 'mid' : 'wide'; }

/* How far apart two references sit. Same chapter beats same book by a mile:
   telling Alma 32:21 from Alma 32:27 is a different skill from telling Alma
   from Isaiah, and it is the one worth drilling. */
function refDistance(a, b) {
  if (a.b !== b.b) return 100000;
  return Math.abs(a._ch - b._ch) * 1000 + Math.abs(a._vs - b._vs);
}
function nearest(list, v, n) {
  return list.slice()
    .sort(function (x, y) { return refDistance(x, v) - refDistance(y, v); })
    .slice(0, n);
}

function pickDistractors(candidates, n, near) {
  var list = candidates.slice();
  if (near === 'tight') list = list.slice(0, Math.max(n, 4));   // only the closest few
  shuffle(list);
  return list.slice(0, n);
}

function qWho(pool, diff, all) {
  var cands = pool.filter(function (v) { return v.s; });
  if (cands.length < 1) return null;
  var v = sample(cands);
  var near = nearness(diff);

  var others = all.filter(function (x) { return x.s && x.s !== v.s; });
  var sameBook = others.filter(function (x) { return x.b === v.b; });
  var sameWork = others.filter(function (x) { return x.w === v.w; });
  var otherWork = others.filter(function (x) { return x.w !== v.w; });

  /* Widen on the count of distinct *names* — a book can hold many verses
     but only one other speaker, which is not enough to build a question. */
  /* At Master, reach first for the names that are actually easy to confuse. */
  var confusing = [];
  if (near === 'tight' && CONFUSABLE[v.s]) {
    confusing = others.filter(function (x) { return CONFUSABLE[v.s].indexOf(x.s) >= 0; });
  }
  var ladder = near === 'tight' ? [confusing, sameBook, sameWork, others]
             : near === 'mid' ? [sameWork, others]
             : [otherWork, others];
  var names = [];
  for (var i = 0; i < ladder.length; i++) {
    var found = [];
    shuffle(ladder[i].slice()).forEach(function (x) {
      if (found.indexOf(x.s) < 0) found.push(x.s);
    });
    if (found.length >= 2) { names = found; break; }
  }
  if (names.length < 2) return null;

  return {
    key: 'who|' + v.r,
    type: 'who',
    verse: v,
    prompt: 'Who said it?',
    kicker: '',
    main: esc(v.t),
    size: sizeFor(v.t),
    correct: v.s,
    options: [v.s, names[0], names[1]],
    reveal: '<span class="ref">' + esc(v.r) + '</span>'
  };
}

function qText2Ref(pool, diff, all) {
  var v = sample(pool);
  var near = nearness(diff);
  var others = all.filter(function (x) { return x.r !== v.r; });
  var tier;
  if (near === 'tight') {
    /* Nearest references in the same book — same chapter first. */
    var book = others.filter(function (x) { return x.b === v.b; });
    tier = book.length >= 2 ? nearest(book, v, 6)
         : others.filter(function (x) { return x.w === v.w; });
  } else if (near === 'mid') {
    tier = others.filter(function (x) { return x.w === v.w; });
  } else {
    tier = others.filter(function (x) { return x.w !== v.w; });
  }
  if (tier.length < 2) tier = others;
  var picks = pickDistractors(tier, 2, near);
  if (picks.length < 2) return null;

  return {
    key: 't2r|' + v.r,
    type: 'text2ref',
    verse: v,
    prompt: 'Which reference is this?',
    kicker: '',
    main: esc(v.t),
    size: sizeFor(v.t),
    correct: v.r,
    options: [v.r, picks[0].r, picks[1].r],
    reveal: ''
  };
}

function qRef2Text(pool, diff, all) {
  var v = sample(pool);
  var near = nearness(diff);
  var mine = snippet(v);
  var others = all.filter(function (x) { return x.r !== v.r && snippet(x) !== mine; });
  var tier;
  if (near === 'tight') {
    var book = others.filter(function (x) { return x.b === v.b; });
    tier = book.length >= 2 ? nearest(book, v, 6)
         : others.filter(function (x) { return x.w === v.w; });
  } else if (near === 'mid') {
    tier = others.filter(function (x) { return x.w === v.w; });
  } else {
    tier = others.filter(function (x) { return x.w !== v.w; });
  }
  if (tier.length < 2) tier = others;

  var picks = [], texts = [mine];
  shuffle(tier.slice()).forEach(function (x) {
    var s = snippet(x);
    if (picks.length < 2 && texts.indexOf(s) < 0) { texts.push(s); picks.push(x); }
  });
  if (picks.length < 2) return null;

  return {
    key: 'r2t|' + v.r,
    type: 'ref2text',
    verse: v,
    prompt: 'Which verse is this?',
    /* Naming the volume is a hint, so Master does without it. */
    kicker: near === 'tight' ? '' : WORK_NAME[v.w],
    main: esc(v.r),
    size: 'size-xl',
    correct: mine,
    options: [mine, snippet(picks[0]), snippet(picks[1])],
    reveal: ''
  };
}

function qBlank(pool, diff, all) {
  var cands = pool.filter(function (v) { return v.f.length; });
  if (!cands.length) return null;
  var v = sample(cands);
  var phrase = sample(v.f);
  var near = nearness(diff);
  var n = words(phrase);

  /* Never offer a phrase that is already printed on the card. */
  var usable = PHRASES.filter(function (x) { return v.t.indexOf(x.p) < 0 && x.p !== phrase; });
  function band(list, span) {
    return list.filter(function (x) { return Math.abs(words(x.p) - n) <= span; });
  }
  var ladder = near === 'tight'
    ? [band(usable.filter(function (x) { return x.b === v.b && x.ch === v._ch; }), 1),
       band(usable.filter(function (x) { return x.b === v.b; }), 1),
       band(usable.filter(function (x) { return x.w === v.w; }), 1),
       band(usable, 1), usable]
    : near === 'mid'
      ? [band(usable.filter(function (x) { return x.w === v.w; }), 1), band(usable, 1), usable]
      : [band(usable.filter(function (x) { return x.w !== v.w; }), 1), band(usable, 1), usable];

  var tier = usable;
  for (var i = 0; i < ladder.length; i++) {
    if (ladder[i].length >= 2) { tier = ladder[i]; break; }
  }

  var picks = [];
  shuffle(tier.slice()).forEach(function (x) {
    if (picks.length < 2 && picks.indexOf(x.p) < 0) picks.push(x.p);
  });
  if (picks.length < 2) return null;

  /* Size the blank to the average of the three choices, so its width tells nothing. */
  var avg = (n + words(picks[0]) + words(picks[1])) / 3;
  var em = Math.min(13, Math.max(3.6, avg * 1.9)).toFixed(1);
  /* Split/join blanks *every* occurrence — a few phrases appear twice in their
     verse, and leaving the second one visible would print the answer. */
  var slot = '<i class="blankslot" style="width:' + em + 'em"></i>';
  var shown = esc(v.t).split(esc(phrase)).join(slot);
  return {
    key: 'blk|' + v.r + '|' + phrase,
    type: 'blank',
    verse: v,
    prompt: 'Fill in the blank',
    kicker: '',
    main: shown + '<span class="ref">' + esc(v.r) + '</span>',
    size: sizeFor(v.t),
    correct: phrase,
    options: [phrase, picks[0], picks[1]],
    reveal: ''
  };
}

/* ---- Who is it? A description of a person; three names. ---- */
function qWhoIs(pool, diff, all, ctx) {
  var cands = ctx.people;
  if (!cands || cands.length < 1) return null;
  var p = sample(cands);
  var clueIndex = Math.floor(Math.random() * p.c.length);
  var clue = p.c[clueIndex];
  var near = nearness(diff);

  /* Clues say "he" or "she", so a mismatched name is a free elimination. And a
     clue that mentions someone else by name ("to whom Abraham paid tithes")
     must not then offer that name as a choice. */
  var others = PEOPLE.filter(function (x) {
    return x.n !== p.n && (x.g || 'm') === (p.g || 'm') && clue.indexOf(x.n) < 0;
  });
  if (others.length < 2) {
    others = PEOPLE.filter(function (x) {
      return x.n !== p.n && clue.indexOf(x.n) < 0;
    });
  }

  var sameBook = others.filter(function (x) { return x.b === p.b; });
  var sameWork = others.filter(function (x) { return x.w === p.w; });
  var otherWork = others.filter(function (x) { return x.w !== p.w; });
  var ladder = near === 'tight' ? [sameBook, sameWork, others]
             : near === 'mid' ? [sameWork, others]
             : [otherWork, others];

  var picks = [];
  for (var i = 0; i < ladder.length; i++) {
    if (ladder[i].length >= 2) { picks = shuffle(ladder[i].slice()).slice(0, 2); break; }
  }
  if (picks.length < 2) return null;

  return {
    key: 'who?|' + p.n + '|' + clueIndex,
    type: 'whois',
    verse: { r: p.n, t: clue, b: p.b, w: p.w },   // stands in for a verse in the miss list
    prompt: 'Who is it?',
    /* The volume is a leg-up, so only the easiest level gets it. */
    kicker: near === 'wide' ? WORK_NAME[p.w] : '',
    main: esc(clue),
    size: sizeFor(clue),
    correct: p.n,
    options: [p.n, picks[0].n, picks[1].n],
    reveal: ''
  };
}

/* ---- Doctrine Q&A: a question; three verses, one of which answers it. ---- */
function qDoctrine(pool, diff, all, ctx) {
  var cands = ctx.doctrine;
  if (!cands || cands.length < 1) return null;
  var q = sample(cands);
  var v = ctx.byRef[q.r];
  if (!v) return null;
  var near = nearness(diff);

  var mine = snippet(v);
  var banned = {};
  (q.x || []).forEach(function (r) { banned[r] = 1; });
  banned[q.r] = 1;

  var others = all.filter(function (x) {
    return !banned[x.r] && snippet(x) !== mine;
  });
  var tier;
  if (near === 'tight') {
    /* Wrong answers from the same book as the right one, so the volume and the
       subject matter cannot be used to shortcut the doctrine. */
    var book = others.filter(function (x) { return x.b === v.b; });
    tier = book.length >= 2 ? book : others.filter(function (x) { return x.w === v.w; });
  } else if (near === 'mid') {
    tier = others.filter(function (x) { return x.w === v.w; });
  } else {
    tier = others.filter(function (x) { return x.w !== v.w; });
  }
  if (tier.length < 2) tier = others;

  var picks = [], texts = [mine];
  shuffle(tier.slice()).forEach(function (x) {
    var s = snippet(x);
    if (picks.length < 2 && texts.indexOf(s) < 0) { texts.push(s); picks.push(x); }
  });
  if (picks.length < 2) return null;

  return {
    key: 'doct|' + q.q,
    type: 'doctrine',
    verse: v,
    prompt: 'Which verse answers this?',
    kicker: '',
    main: esc(q.q),
    size: q.q.length < 46 ? 'size-xl' : 'size-lg',
    correct: mine,
    options: [mine, snippet(picks[0]), snippet(picks[1])],
    reveal: ''
  };
}

/* ---- Modern prophets: a quote; three Presidents of the Church. ---- */
function qProphet(pool, diff, all, ctx) {
  var cands = ctx.quotes;
  if (!cands || cands.length < 1) return null;
  var q = sample(cands);
  var me = null;
  for (var i = 0; i < PROPHETS.length; i++) if (PROPHETS[i].n === q.p) me = PROPHETS[i];
  if (!me) return null;
  var near = nearness(diff);

  /* Adjacent Presidents are the hard confusion; a century apart is the easy one.
     A prophet the quote names ("…that I ever knew Joseph Smith") is excluded —
     the quote itself rules him out, so offering him is a free elimination. */
  var others = PROPHETS.filter(function (x) {
    return x.n !== me.n && q.q.indexOf(x.n) < 0;
  });
  var tier;
  if (near === 'tight') {
    tier = others.slice().sort(function (a, b) {
      return Math.abs(a.o - me.o) - Math.abs(b.o - me.o);
    }).slice(0, 4);
  } else if (near === 'mid') {
    tier = others.filter(function (x) { return Math.abs(x.o - me.o) <= 6; });
    if (tier.length < 2) tier = others;
  } else {
    tier = others.filter(function (x) { return Math.abs(x.o - me.o) >= 5; });
    if (tier.length < 2) tier = others;
  }
  var picks = shuffle(tier.slice()).slice(0, 2);
  if (picks.length < 2) return null;

  return {
    key: 'proph|' + q.p + '|' + q.q.slice(0, 40),
    type: 'prophet',
    verse: { r: q.p + ' · ' + me.y, s: q.src, t: q.q, b: 'Latter-day prophets', w: 'dc' },
    prompt: 'Which latter-day prophet said it?',
    kicker: '',
    main: esc(q.q),
    size: sizeFor(q.q),
    correct: q.p,
    options: [q.p, picks[0].n, picks[1].n],
    reveal: ''
  };
}

function sizeFor(t) {
  var n = t.length;
  if (n < 62) return 'size-xl';
  if (n < 140) return 'size-lg';
  if (n < 250) return 'size-md';
  if (n < 400) return 'size-sm';
  return 'size-xs';
}

var BUILDERS = {
  who: qWho, whois: qWhoIs, text2ref: qText2Ref,
  ref2text: qRef2Text, blank: qBlank, doctrine: qDoctrine, prophet: qProphet
};

function nextQuestion() {
  var pool = game.pool, all = game.all, diff = prefs.diff, ctx = game.ctx;
  var types = game.types.slice();
  for (var attempt = 0; attempt < 40; attempt++) {
    var type = sample(types);
    var built = BUILDERS[type](pool, diff, all, ctx);
    if (!built) continue;
    if (built.verse.r === game.lastRef && attempt < 12) continue;
    if (seen[built.key]) continue;
    seen[built.key] = 1;
    if (++seenDirty >= 8) saveSeen();
    game.lastRef = built.verse.r;
    return built;
  }
  seen = {}; saveSeen();                           // bank spent — start a new pass
  for (var pass = 0; pass < 6; pass++) {
    for (var i = 0; i < types.length; i++) {
      var b = BUILDERS[types[i]](pool, diff, all, ctx);
      if (b) return b;
    }
  }
  /* Still nothing: keep the question types the player chose and widen the pool. */
  var wide = widestContext();
  for (var j = 0; j < types.length; j++) {
    for (var k = 0; k < 8; k++) {
      var w = BUILDERS[types[j]](VERSES, diff, VERSES, wide);
      if (w) return w;
    }
  }
  return qText2Ref(VERSES, diff, VERSES, wide);
}

/* ============================== DOM ============================== */
function $(s) { return document.querySelector(s); }
function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }

var card, cardMain, cardKicker, promptEl, stampEl, ansEls;

function show(id) {
  $$('.screen').forEach(function (s) { s.classList.toggle('is-active', s.id === id); });
}

/* --------------------------- start screen --------------------------- */
function paintChips() {
  paintTypes();
  setChips('#opt-len', String(prefs.len));
  setChips('#opt-diff', String(prefs.diff));
  $('#opt-focus').value = prefs.focus;
  $('#opt-sound').checked = prefs.sound;
  $('#opt-haptic').checked = prefs.haptic;
  paintNotes();
}
function setChips(sel, val) {
  $$(sel + ' .chip').forEach(function (c) {
    c.setAttribute('aria-checked', String(c.dataset.v === val));
  });
}
function paintTypes() {
  $$('#opt-type .chip').forEach(function (c) {
    if (c.dataset.v === 'all') return;
    c.setAttribute('aria-checked', String(prefs.types.indexOf(c.dataset.v) >= 0));
  });
  $('#chip-all').setAttribute('aria-checked',
    String(prefs.types.length === ALL_TYPES.length));
}
function paintNotes() {
  var pool = poolFor(prefs.focus, prefs.diff);
  var label = focusLabel(prefs.focus);
  $('#focus-note').textContent = pool.length + ' verses in play from ' + label + '.';
  $('#diff-note').textContent = prefs.diff === 1
    ? 'Best-known verses, and the wrong answers come from a different volume.'
    : prefs.diff === 2
      ? 'A wider range; wrong answers come from the same volume.'
      : 'Everything in the bank. Wrong answers come from the same chapter where '
        + 'one exists, speakers who are easy to confuse, and no volume is named.';

  var n = availableStems(prefs.types, prefs.focus, prefs.diff);
  var count = prefs.types.length;
  $('#type-note').textContent = count === 0
    ? 'Pick at least one type.'
    : count + (count === 1 ? ' type · ' : ' types · ')
      + n.toLocaleString() + ' question' + (n === 1 ? '' : 's') + ' available.';
}
function paintLifetime() {
  if (!stats.answered) return;
  $('#lifetime').hidden = false;
  $('#lt-answered').textContent = stats.answered;
  $('#lt-accuracy').textContent = Math.round(stats.correct / stats.answered * 100) + '%';
  $('#lt-streak').textContent = stats.best;
}

/* ============================== quiz ============================== */
function canSupply(t, pool, ctx) {
  if (t === 'who') return pool.some(function (v) { return !!v.s; });
  if (t === 'blank') return pool.some(function (v) { return v.f.length > 0; });
  if (t === 'whois') return ctx.people.length >= 3;
  if (t === 'doctrine') return ctx.doctrine.length >= 1;
  if (t === 'prophet') return ctx.quotes.length >= 1;
  return pool.length >= 1;
}

function startQuiz() {
  var all = VERSES;
  var pool = poolFor(prefs.focus, prefs.diff);
  var ctx = contextFor(prefs.focus, prefs.diff);
  var types = prefs.types.slice();
  if (!types.length) types = ALL_TYPES.slice();

  /* Drop the chosen types this focus cannot actually produce — a "who said it"
     run over Psalms has nothing to ask. If that empties the list, widen instead
     of serving nothing. */
  var usable = types.filter(function (t) { return canSupply(t, pool, ctx); });
  if (usable.length) {
    types = usable;
  } else {
    pool = VERSES.slice();
    ctx = widestContext();
  }

  game = {
    pool: pool, all: all, types: types, ctx: ctx,
    total: prefs.len, n: 0, correct: 0, streak: 0, best: 0,
    lastRef: null, missed: []
  };
  show('screen-quiz');
  $('#score-of').textContent = prefs.len ? '/ ' + prefs.len : '';
  audio(); // unlock on the tap that started the quiz
  serve();
}

function serve() {
  q = nextQuestion();
  locked = false;

  promptEl.textContent = q.prompt;
  cardKicker.textContent = q.kicker || '';
  cardKicker.style.display = q.kicker ? '' : 'none';
  cardMain.className = 'card-main ' + q.size;
  cardMain.innerHTML = q.main;
  cardMain.scrollTop = 0;

  var opts = shuffle(q.options.slice());
  ['left', 'right', 'down'].forEach(function (dir, i) {
    var el = ansEls[dir];
    el.className = 'answer' + (dir === 'down' ? ' answer-down' : '');
    el.querySelector('span').textContent = opts[i];
    el.dataset.val = opts[i];
  });

  stampEl.className = 'stamp';
  stampEl.innerHTML = '';
  $('#hint').textContent = 'Swipe the card toward your answer · or tap it';
  paintHud();
  bringIn();
}

function paintHud() {
  $('#score').textContent = game.correct;
  $('#streak').hidden = game.streak < 2;
  $('#streak').textContent = game.streak;
  var pct = game.total ? (game.n / game.total) * 100 : (game.n % 10) * 10;
  $('#progress-fill').style.width = Math.min(100, pct) + '%';
}

function answer(dir, speed) {
  if (locked || !q) return;
  locked = true;
  var el = ansEls[dir];
  var chosen = el.dataset.val;
  var right = chosen === q.correct;

  game.n++;
  stats.answered++;
  if (right) {
    game.correct++; stats.correct++;
    game.streak++;
    if (game.streak > game.best) game.best = game.streak;
    if (game.streak > stats.best) stats.best = game.streak;
    el.classList.add('is-right');
    /* No pause: the card keeps going the way it was thrown, and the check
       pops in the arena behind it rather than riding away on the card. */
    stamp('good', '✓');
    soundGood(game.streak);
    buzz(14);
    paintHud();
    saveStats();
    tossOut(dir, speed, false, advance);
  } else {
    game.streak = 0;
    game.missed.push(q);
    el.classList.add('is-wrong');
    ['left', 'right', 'down'].forEach(function (d) {
      if (ansEls[d].dataset.val === q.correct) ansEls[d].classList.add('is-right');
      else if (d !== dir) ansEls[d].classList.add('is-mute');
    });
    if (q.reveal) cardMain.insertAdjacentHTML('beforeend', q.reveal);
    stamp('bad', '✕');
    soundBad();
    buzz([16, 70, 16]);
    settle();
    $('#hint').textContent = q.verse.r + (q.verse.s ? ' · ' + q.verse.s : '');
    paintHud();
    saveStats();
    setTimeout(function () { stampEl.className = 'stamp fade'; }, 900);  // let them read the answer
    setTimeout(function () { tossOut('down', 0, true, advance); }, 2200);
  }
}

function advance() {
  if (game.total && game.n >= game.total) return finish();
  serve();
}

function stamp(kind, glyph) {
  stampEl.className = 'stamp show ' + kind;
  stampEl.innerHTML = '<i>' + glyph + '</i>';
}

/* --------------------------- card motion ---------------------------
   The card's position is tracked so an exit can continue from wherever the
   finger let go, at the speed it was moving. Anything else reads as a stall. */
var pos = { x: 0, y: 0, rot: 0 };
var rafId = 0;

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

function setT(x, y, rot, op) {
  pos.x = x; pos.y = y; pos.rot = rot;
  card.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) rotate(' + rot + 'deg)';
  if (op !== undefined) card.style.opacity = op;
}
/* Coalesce pointermove into one paint per frame. */
function setTFrame(x, y, rot) {
  if (rafId) return;
  rafId = requestAnimationFrame(function () { rafId = 0; setT(x, y, rot); });
}
function settle() {
  if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
  card.classList.remove('is-dragging');
  card.classList.add('is-settling');
  card.style.transition = '';
  setT(0, 0, 0, 1);
}

/* speed is px/ms at release; `soft` is the gentle drop used after a miss. */
function tossOut(dir, speed, soft, cb) {
  if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
  card.classList.remove('is-dragging', 'is-settling');

  var w = window.innerWidth, h = window.innerHeight;
  var tx, ty, rot;
  if (dir === 'left') { tx = -w * 1.25; ty = pos.y + w * 0.12; rot = pos.rot - 16; }
  else if (dir === 'right') { tx = w * 1.25; ty = pos.y + w * 0.12; rot = pos.rot + 16; }
  else { tx = pos.x; ty = h * 1.25; rot = pos.rot; }

  /* Taps and arrow keys have no throw velocity. A gentler default keeps them
     from snapping away faster than a real flick would. */
  var sp = clamp(speed > 0 ? speed : 1.25, 0.9, 4.5);
  var dist = Math.hypot(tx - pos.x, ty - pos.y);
  var dur = soft ? 380 : clamp(dist / (sp * 2), 150, 400);

  /* Ease-out: the throw leaves at speed and only decelerates on the way out.
     Opacity holds until the card is most of the way gone. */
  card.style.transition =
    'transform ' + dur + 'ms ' + (soft ? 'cubic-bezier(.4,0,.7,.4)' : 'cubic-bezier(.22,.61,.36,1)') +
    ',opacity ' + Math.round(dur * 0.45) + 'ms linear ' + Math.round(dur * 0.5) + 'ms';
  setT(tx, ty, rot, 0);
  setTimeout(cb, dur + 20);
}

function bringIn() {
  if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
  card.classList.remove('is-settling', 'is-dragging');
  card.style.transition = 'none';
  setT(0, 16, 0, 0);
  card.style.transform = 'translate3d(0,16px,0) scale(.94)';
  void card.offsetHeight;
  card.style.transition = 'transform .34s cubic-bezier(.2,.95,.35,1),opacity .22s ease-out';
  card.style.transform = 'translate3d(0,0,0) rotate(0deg)';
  card.style.opacity = '1';
  pos.x = 0; pos.y = 0; pos.rot = 0;
}

/* ----------------------------- swiping ----------------------------- */
var drag = null;

function aimOf(dx, dy) {
  var ax = Math.abs(dx), ay = Math.abs(dy);
  if (Math.max(ax, ay) < 20) return null;
  if (ax >= ay) return dx < 0 ? 'left' : 'right';
  return dy > 0 ? 'down' : null;
}
function highlight(aim) {
  ['left', 'right', 'down'].forEach(function (d) {
    ansEls[d].classList.toggle('is-aimed', d === aim);
  });
}

function onDown(e) {
  if (locked) return;
  if (e.target.closest('.answer')) return;      // taps handled by the buttons
  var now = (window.performance || Date).now();
  drag = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, lt: now,
           vx: 0, vy: 0, id: e.pointerId };
  try { card.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointers */ }
  card.classList.add('is-dragging');
  card.classList.remove('is-settling');
  card.style.transition = 'none';
}
function onMove(e) {
  if (!drag || e.pointerId !== drag.id) return;

  /* Instantaneous velocity, smoothed — the average over the whole drag would
     report a slow flick when the player pauses before flicking. */
  var now = (window.performance || Date).now();
  var dt = Math.max(1, now - drag.lt);
  drag.vx = 0.7 * ((e.clientX - drag.lx) / dt) + 0.3 * drag.vx;
  drag.vy = 0.7 * ((e.clientY - drag.ly) / dt) + 0.3 * drag.vy;
  drag.lx = e.clientX; drag.ly = e.clientY; drag.lt = now;

  var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (dy < 0) dy *= 0.32;                        // upward drags resist
  setTFrame(dx, dy, dx / 22);
  highlight(aimOf(dx, dy));
}
function onUp(e) {
  if (!drag || e.pointerId !== drag.id) return;
  var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  var speed = Math.hypot(drag.vx, drag.vy);      // px per ms at release
  drag = null;
  card.classList.remove('is-dragging');
  highlight(null);

  if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
  setT(dx, dy < 0 ? dy * 0.32 : dy, dx / 22);    // land on the true finger position

  var aim = aimOf(dx, dy);
  var far = Math.max(Math.abs(dx), Math.abs(dy)) > 72 || speed > 0.45;
  if (aim && far) answer(aim, speed);
  else settle();
}

/* ============================== results ============================== */
function finish() {
  saveSeen();
  var pct = game.n ? Math.round(game.correct / game.n * 100) : 0;
  $('#result-ring').style.setProperty('--pct', pct + '%');
  $('#result-pct').textContent = pct + '%';
  $('#r-correct').textContent = game.correct;
  $('#r-total').textContent = game.n;
  $('#r-streak').textContent = game.best;

  $('#result-title').textContent =
    pct === 100 && game.n >= 5 ? 'Perfect.' :
    pct >= 85 ? 'Beautifully done.' :
    pct >= 60 ? 'Well done.' :
    game.n === 0 ? 'Come back soon.' : 'Keep at it.';
  $('#result-sub').textContent =
    game.n === 0 ? 'No questions answered yet.'
    : game.best >= 5 ? 'Your best run was ' + game.best + ' in a row.'
    : 'Every pass through makes the next one easier.';

  var seen = {}, list = [];
  game.missed.forEach(function (m) {
    if (!seen[m.verse.r]) { seen[m.verse.r] = 1; list.push(m.verse); }
  });
  var wrap = $('#review-wrap');
  if (list.length) {
    wrap.hidden = false;
    $('#review').innerHTML = list.map(function (v) {
      return '<li><b>' + esc(v.r) + (v.s ? ' · ' + esc(v.s) : '') + '</b><p>' + esc(v.t) + '</p></li>';
    }).join('');
  } else {
    wrap.hidden = true;
  }
  paintLifetime();
  show('screen-done');
}

/* ============================== wiring ============================== */
function init() {
  card = $('#card');
  cardMain = $('#card-main');
  cardKicker = $('#card-kicker');
  promptEl = $('#prompt');
  stampEl = $('#stamp');
  ansEls = { left: $('#ans-left'), right: $('#ans-right'), down: $('#ans-down') };

  load();
  buildFocusMenu();
  if (!$('#opt-focus').querySelector('option[value="' + prefs.focus + '"]')) prefs.focus = 'all';
  paintChips();
  paintLifetime();

  $('#opt-type').addEventListener('click', function (e) {
    var c = e.target.closest('.chip'); if (!c) return;
    var v = c.dataset.v;
    if (v === 'all') {
      prefs.types = prefs.types.length === ALL_TYPES.length ? ALL_TYPES.slice(0, 1)
                                                            : ALL_TYPES.slice();
    } else {
      var i = prefs.types.indexOf(v);
      if (i < 0) prefs.types.push(v);
      else if (prefs.types.length > 1) prefs.types.splice(i, 1);   // keep at least one
    }
    prefs.types = ALL_TYPES.filter(function (t) { return prefs.types.indexOf(t) >= 0; });
    paintTypes(); paintNotes(); savePrefs();
  });
  $('#opt-len').addEventListener('click', function (e) {
    var c = e.target.closest('.chip'); if (!c) return;
    prefs.len = +c.dataset.v; setChips('#opt-len', String(prefs.len)); savePrefs();
  });
  $('#opt-diff').addEventListener('click', function (e) {
    var c = e.target.closest('.chip'); if (!c) return;
    prefs.diff = +c.dataset.v; setChips('#opt-diff', String(prefs.diff)); paintNotes(); savePrefs();
  });
  $('#opt-focus').addEventListener('change', function (e) {
    prefs.focus = e.target.value; paintNotes(); savePrefs();
  });
  $('#bank-count').textContent =
    VERSES.length + ' verses, ' + PEOPLE.length + ' people, '
    + DOCTRINE.length + ' doctrinal questions, '
    + PROPHET_QUOTES.length + ' prophet quotes.';
  $('#opt-sound').addEventListener('change', function (e) { prefs.sound = e.target.checked; savePrefs(); });
  $('#opt-haptic').addEventListener('change', function (e) { prefs.haptic = e.target.checked; savePrefs(); });

  $('#btn-start').addEventListener('click', startQuiz);
  $('#btn-again').addEventListener('click', startQuiz);
  $('#btn-home').addEventListener('click', function () { paintChips(); show('screen-start'); });
  $('#btn-quit').addEventListener('click', function () { finish(); });

  card.addEventListener('pointerdown', onDown);
  card.addEventListener('pointermove', onMove);
  card.addEventListener('pointerup', onUp);
  card.addEventListener('pointercancel', onUp);

  ['left', 'right', 'down'].forEach(function (d) {
    ansEls[d].addEventListener('click', function () { answer(d); });
  });

  document.addEventListener('keydown', function (e) {
    if (!$('#screen-quiz').classList.contains('is-active')) return;
    if (e.key === 'ArrowLeft') answer('left');
    else if (e.key === 'ArrowRight') answer('right');
    else if (e.key === 'ArrowDown') answer('down');
    else if (e.key === 'Escape') finish();
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }
}

document.addEventListener('DOMContentLoaded', init);
})();
