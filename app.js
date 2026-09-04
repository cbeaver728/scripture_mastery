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

var TYPE_LABEL = {
  who: 'Who said it?',
  text2ref: 'Which reference is this?',
  ref2text: 'Which verse is this?',
  blank: 'Fill in the blank'
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
  v.f.forEach(function (p) { PHRASES.push({ p: p, w: v.w, b: v.b, r: v.r }); });
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
  type: 'mixed', len: 10, focus: 'all', diff: 2, sound: true, haptic: true
};
var stats = { answered: 0, correct: 0, best: 0 };

var game = null;   // active quiz
var q = null;      // active question
var locked = false;

/* --------------------------- persistence --------------------------- */
function load() {
  try {
    var p = JSON.parse(localStorage.getItem('sm.prefs') || 'null');
    if (p) for (var k in p) if (k in prefs) prefs[k] = p[k];
    var s = JSON.parse(localStorage.getItem('sm.stats') || 'null');
    if (s) for (var j in s) if (j in stats) stats[j] = s[j];
  } catch (e) { /* private mode, fresh start */ }
}
function savePrefs() { try { localStorage.setItem('sm.prefs', JSON.stringify(prefs)); } catch (e) {} }
function saveStats() { try { localStorage.setItem('sm.stats', JSON.stringify(stats)); } catch (e) {} }

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

/* Distractors get closer to the answer as difficulty rises. */
function nearness(diff) { return diff >= 3 ? 'tight' : diff === 2 ? 'mid' : 'wide'; }

function pickDistractors(candidates, n, near) {
  var list = candidates.slice();
  if (near === 'tight') list = list.slice(0, Math.max(n, Math.ceil(list.length * 0.5)));
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
  var ladder = near === 'tight' ? [sameBook, sameWork, others]
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
    tier = others.filter(function (x) { return x.b === v.b; });
    tier.sort(function (a, b) { return Math.abs(a._ch - v._ch) - Math.abs(b._ch - v._ch); });
    if (tier.length < 2) tier = others.filter(function (x) { return x.w === v.w; });
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
    tier = others.filter(function (x) { return x.b === v.b; });
    if (tier.length < 2) tier = others.filter(function (x) { return x.w === v.w; });
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
    kicker: WORK_NAME[v.w],
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
    ? [band(usable.filter(function (x) { return x.b === v.b; }), 2),
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

function sizeFor(t) {
  var n = t.length;
  if (n < 62) return 'size-xl';
  if (n < 140) return 'size-lg';
  if (n < 250) return 'size-md';
  if (n < 400) return 'size-sm';
  return 'size-xs';
}

var BUILDERS = { who: qWho, text2ref: qText2Ref, ref2text: qRef2Text, blank: qBlank };

function nextQuestion() {
  var pool = game.pool, all = game.all, diff = prefs.diff;
  var types = game.types.slice();
  for (var attempt = 0; attempt < 40; attempt++) {
    var type = sample(types);
    var built = BUILDERS[type](pool, diff, all);
    if (!built) continue;
    if (built.verse.r === game.lastRef && attempt < 12) continue;
    if (game.seen[built.key] && attempt < 30) continue;
    game.seen[built.key] = 1;
    game.lastRef = built.verse.r;
    return built;
  }
  game.seen = {};                                  // bank exhausted — start it over
  for (var pass = 0; pass < 6; pass++) {
    for (var i = 0; i < types.length; i++) {
      var b = BUILDERS[types[i]](pool, diff, all);
      if (b) return b;
    }
  }
  /* Still nothing: keep the question type the player chose and widen the pool. */
  for (var j = 0; j < types.length; j++) {
    for (var k = 0; k < 8; k++) {
      var w = BUILDERS[types[j]](VERSES, diff, VERSES);
      if (w) return w;
    }
  }
  return qText2Ref(VERSES, diff, VERSES);
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
  setChips('#opt-type', prefs.type);
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
function paintNotes() {
  var pool = poolFor(prefs.focus, prefs.diff);
  var label = focusLabel(prefs.focus);
  $('#focus-note').textContent = pool.length + ' verses in play from ' + label + '.';
  $('#diff-note').textContent = prefs.diff === 1
    ? 'Best-known verses, with clearly different choices.'
    : prefs.diff === 2
      ? 'A wider range of verses; wrong answers come from the same volume.'
      : 'Every verse in the bank, and the wrong answers come from the same book.';
}
function paintLifetime() {
  if (!stats.answered) return;
  $('#lifetime').hidden = false;
  $('#lt-answered').textContent = stats.answered;
  $('#lt-accuracy').textContent = Math.round(stats.correct / stats.answered * 100) + '%';
  $('#lt-streak').textContent = stats.best;
}

/* ============================== quiz ============================== */
function startQuiz() {
  var all = VERSES;
  var pool = poolFor(prefs.focus, prefs.diff);
  var types = prefs.type === 'mixed'
    ? ['who', 'text2ref', 'ref2text', 'blank']
    : [prefs.type];

  /* A single-type quiz needs verses that support that type. */
  if (types.length === 1) {
    var supports = types[0] === 'who' ? function (v) { return !!v.s; }
                 : types[0] === 'blank' ? function (v) { return v.f.length > 0; }
                 : function () { return true; };
    var ok = pool.filter(supports);
    pool = ok.length ? ok : VERSES.filter(supports);
  }

  game = {
    pool: pool, all: all, types: types,
    total: prefs.len, n: 0, correct: 0, streak: 0, best: 0,
    seen: {}, lastRef: null, missed: []
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

function answer(dir) {
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
    stamp('good', '✓');
    soundGood(game.streak);
    buzz(14);
    paintHud();
    saveStats();
    setTimeout(function () { tossOut(dir, advance); }, 430);
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
    setTimeout(function () { stampEl.className = 'stamp'; }, 950);   // let them read the answer
    setTimeout(function () { tossOut('down', advance); }, 2200);
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

/* --------------------------- card motion --------------------------- */
function setT(x, y, rot, op) {
  card.style.transform = 'translate(' + x + 'px,' + y + 'px) rotate(' + rot + 'deg)';
  if (op !== undefined) card.style.opacity = op;
}
function settle() {
  card.classList.remove('is-dragging', 'is-leaving');
  card.classList.add('is-settling');
  card.style.transition = '';
  setT(0, 0, 0, 1);
}
function tossOut(dir, cb) {
  card.classList.remove('is-dragging', 'is-settling');
  card.classList.add('is-leaving');
  card.style.transition = '';
  var w = window.innerWidth, h = window.innerHeight;
  if (dir === 'left') setT(-w * 1.1, 70, -20, 0);
  else if (dir === 'right') setT(w * 1.1, 70, 20, 0);
  else setT(0, h * 1.05, 0, 0);
  setTimeout(cb, 330);
}
function bringIn() {
  card.classList.remove('is-leaving', 'is-settling', 'is-dragging');
  card.style.transition = 'none';
  card.style.transform = 'translateY(30px) scale(.965)';
  card.style.opacity = '0';
  void card.offsetHeight;
  card.style.transition = 'transform .3s cubic-bezier(.2,.9,.3,1),opacity .26s ease-out';
  card.style.transform = '';
  card.style.opacity = '1';
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
  drag = { x: e.clientX, y: e.clientY, id: e.pointerId, t: Date.now() };
  try { card.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointers */ }
  card.classList.add('is-dragging');
  card.classList.remove('is-settling');
  card.style.transition = 'none';
}
function onMove(e) {
  if (!drag || e.pointerId !== drag.id) return;
  var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (dy < 0) dy *= 0.32;                        // upward drags resist
  setT(dx, dy, dx / 22);
  highlight(aimOf(dx, dy));
}
function onUp(e) {
  if (!drag || e.pointerId !== drag.id) return;
  var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  var dt = Math.max(1, Date.now() - drag.t);
  var speed = Math.max(Math.abs(dx), Math.abs(dy)) / dt;   // px per ms
  drag = null;
  card.classList.remove('is-dragging');
  highlight(null);

  var aim = aimOf(dx, dy);
  var far = Math.max(Math.abs(dx), Math.abs(dy)) > 80 || speed > 0.55;
  if (aim && far) answer(aim);
  else settle();
}

/* ============================== results ============================== */
function finish() {
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
  $('#bank-count').textContent = VERSES.length + ' verses in the bank.';

  $('#opt-type').addEventListener('click', function (e) {
    var c = e.target.closest('.chip'); if (!c) return;
    prefs.type = c.dataset.v; setChips('#opt-type', prefs.type); savePrefs();
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
