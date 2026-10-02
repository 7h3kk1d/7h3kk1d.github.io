/* deck.js — navigation, fragments, timer, presenter notes and view, rehearsal log, syntax highlighting */

const stage  = document.getElementById('stage');
const slides   = [...document.querySelectorAll('.slide')];
const nMain    = slides.filter(s => !s.dataset.backup).length;   // backups sit after the summary
const barI   = document.querySelector('#bar i');
const hud    = document.getElementById('hud');
const slidenum = document.getElementById('slidenum');   // the number on the slide itself
const notes  = document.getElementById('notes');
const help   = document.getElementById('help');

let i = 0;         // slide index
let f = 0;         // fragment index within the slide
let t0 = null;     // talk start (ms)
let paused = 0;

/* localStorage, which can throw or come back empty (private window, blocked
   site data); nothing here depends on it surviving. */
const store = {
  get(k){ try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

/* ?presenter: the stage pinned to the top-left corner and the presenter panel
   filling the rest of the window, so OBS can crop the stage out of one window
   and project it (production.md §5, "Presenting"). The stage is the real deck,
   embeds and all -- there is no second copy to keep in step. */
const PRESENTER = new URLSearchParams(location.search).has('presenter');
const PANEL_KEY = 'deck.panel';        // the panel's minimum width, set with [ and ]
let panelW = Math.max(240, +store.get(PANEL_KEY) || 380);
let stageW = 1920, stageH = 1080;      // the stage as laid out, in CSS px

/* ---------- fit the 1920x1080 stage to the viewport ---------- */
function fit(){
  if (!PRESENTER){
    const s = Math.min(innerWidth/1920, innerHeight/1080);
    stage.style.transform = `translate(-50%,-50%) scale(${s})`;
    return;
  }
  // Whole pixels, so the OBS crop is exact
  const w = Math.floor(Math.min(innerWidth - panelW, innerHeight*16/9));
  const h = Math.round(w*9/16);
  stageW = w; stageH = h;
  stage.style.transform = `scale(${w/1920})`;
  document.body.style.setProperty('--sw', w + 'px');
  document.body.style.setProperty('--sh', h + 'px');
  // a MacBook leaves a wide strip under the stage: the notes go there; a
  // narrower strip takes the clock and timing, leaving the panel to the notes
  const strip = innerHeight - h;
  document.body.classList.toggle('notes-below', strip >= 220);
  placeStats(strip >= 110 && strip < 220);
  document.getElementById('p-crop')?.replaceChildren(cropText());
}
/* The clock row and the timing lines live in the panel, or in #pbottom, the
   strip under the stage that OBS crops away (the recording never shows it). */
function placeStats(below){
  const pb = document.getElementById('pbottom'), top = document.getElementById('p-topbar'),
        tm = document.getElementById('ptime'), st = document.getElementById('pstat');
  if (!pb || !top || !tm) return;
  document.body.classList.toggle('stats-below', below);
  if (below){ if (top.parentNode !== pb) pb.append(top, tm); }
  else if (top.parentNode === pb){ document.getElementById('panel').prepend(top); st.after(tm); }
}
/* OBS measures its crop in the capture's pixels: device pixels, 2 per CSS px on Retina */
function cropText(){
  const r = devicePixelRatio;
  return 'stage ' + stageW + '×' + stageH + ' · OBS crop right ' + Math.round((innerWidth - stageW)*r) +
         ', bottom ' + Math.round((innerHeight - stageH)*r) + ' px (' + r + 'x)';
}
if (PRESENTER) document.body.classList.add('presenter');
addEventListener('resize', fit); fit();

/* ---------- syntax highlighting for Hazel snippets ----------
 * Single pass, longest-rule-first. An earlier version stashed tokens as
 * placeholders and ran successive regexes, which then matched the digits inside
 * its own placeholders and emitted things like the literal text U+2401 15 U+2401.
 * One pass over raw text, escaping only on output, avoids that entirely. */
const ESC = {'&':'&amp;','<':'&lt;','>':'&gt;'};
const esc = t => t.replace(/[&<>]/g, c => ESC[c]);

const RULES = [
  ['t-com',  /^#[^\n]*/],
  ['t-str',  /^"[^"\n]*"/],
  ['t-bind', /^`[^`\n]+`/],
  ['t-op',   /^(\.\.\.|=>|\|>|->|⇒|⤳|⊓|≡)/],
  ['t-unk',  /^\?/],
  ['t-typ',  /^(Int|String|Float|Bool|Unit|List)\b/],
  ['t-kw',   /^(let|in|fun|case|end|type|of|if|then|else|rec|test)\b/],
  ['t-num',  /^\d+\.?\d*/],
];

function hl(src){
  let out = '', s = src;
  while (s.length){
    let hit = null, cls = null;
    for (const [c, re] of RULES){
      const m = re.exec(s);
      if (m){ hit = m[0]; cls = c; break; }
    }
    if (hit){ out += '<span class="' + cls + '">' + esc(hit) + '</span>'; s = s.slice(hit.length); }
    else { out += esc(s[0]); s = s.slice(1); }
  }
  return out;
}

document.querySelectorAll('pre.hz, code.hz-in').forEach(el=>{
  if (el.dataset.raw === 'true') return;
  el.innerHTML = hl(el.textContent.replace(/^\n/,''));
});


/* ---------- auto-fit: never let a slide overflow the stage ----------
 * The stage is a fixed 1920x1080 box. If a slide's content is taller than
 * that, it used to overlap whatever sat below it. Now we measure the live
 * slide and shrink it with `zoom` until it fits (Chromium-only, which this
 * deck already requires). Shrinking is a safety net, not a design: anything
 * that needs less than ~0.9 should be trimmed instead. Press `d` for a
 * report of every slide's fit. */
const FIT_FLOOR = 0.72;

function fitSlide(el){
  if (!el) return 1;
  el.style.zoom = '';
  let z = 1;
  for (let pass = 0; pass < 3; pass++){
    const over = el.scrollHeight - el.clientHeight;
    if (over <= 1) break;
    z = Math.max(FIT_FLOOR, z * (el.clientHeight / el.scrollHeight));
    el.style.zoom = z;
  }
  if (z < 1) el.dataset.fit = z.toFixed(3); else delete el.dataset.fit;
  return z;
}

function fitReport(){
  const rows = slides.map((s, n) => {
    const wasOn = s.classList.contains('on');
    if (!wasOn) s.classList.add('on');
    const all = [...s.querySelectorAll('.fr')].map(e => [e, e.classList.contains('in')]);
    all.forEach(([e]) => e.classList.add('in'));          // worst case: every fragment shown
    const z = fitSlide(s);
    const over = Math.max(0, s.scrollHeight - s.clientHeight);
    all.forEach(([e, had]) => e.classList.toggle('in', had));
    if (!wasOn) s.classList.remove('on');
    return {n: n + 1, title: s.dataset.title || '', zoom: z, overflowPx: over};
  });
  const bad = rows.filter(r => r.zoom < 0.999);
  console.table(bad.length ? bad : rows.map(r => ({...r, zoom: 1})));
  console.log(bad.length
    ? bad.length + ' slide(s) overflow at full fragment reveal — trim the ones below 0.90'
    : 'all slides fit at 1920x1080 with every fragment shown');
  return bad;
}
window.fitReport = fitReport;

/* ---------- fragments ---------- */
const fragsOf = s => [...s.querySelectorAll('.fr')];
const maxFrOf = n => fragsOf(slides[n]).reduce((m,el)=>Math.max(m, +el.dataset.fr||0), 0);

let painted = -1;  // slide index paint() last showed
let loggedF = -1;  // fragment index the rehearsal log last recorded

/* ---------- arrows ----------
   svg.arrows overlays (see deck.css): each path[data-from][data-to] is redrawn
   from the two elements' current boxes, in the svg's own coordinates. The scale
   divides out the stage transform and any fitSlide shrink. */
function drawArrows(slide){
  slide.querySelectorAll('svg.arrows').forEach(svg => {
    const box = svg.getBoundingClientRect(), host = svg.parentElement;
    const scale = box.width / (host.offsetWidth || 1);
    if (!scale) return;
    svg.setAttribute('viewBox', `0 0 ${box.width/scale} ${box.height/scale}`);
    const rel = el => { const r = el.getBoundingClientRect();
      return { x:(r.left-box.left)/scale, y:(r.top-box.top)/scale, w:r.width/scale, h:r.height/scale }; };
    svg.querySelectorAll('path[data-from]').forEach(p => {
      const a = slide.querySelector(p.dataset.from), b = slide.querySelector(p.dataset.to);
      if (!a || !b) return;
      const A = rel(a), B = rel(b), bow = +p.dataset.bow || 140;
      // leave from the right edge of the cell's row, level with the cell, so
      // the line never strikes through the cells beside it
      const row = a.closest('tr'), R = row ? rel(row) : A;
      const x1 = R.x + R.w + 8, y1 = A.y + A.h/2;
      // ...and come into the header diagonally from the upper right (data-in
      // sets how far out that approach starts), so two arrows nest instead of
      // crossing where one turns down
      const x2 = B.x + B.w/2,   y2 = B.y - 8, inn = +p.dataset.in || 90;
      p.setAttribute('d', `M${x1},${y1} C${x1+bow},${y1} ${x2+inn},${y2-inn} ${x2},${y2}`);
      p.setAttribute('marker-end', 'url(#arrowhead)');
    });
  });
}

function paint(){
  slides.forEach((s,n)=>s.classList.toggle('on', n===i));
  fragsOf(slides[i]).forEach(el=>el.classList.toggle('in', (+el.dataset.fr||0) <= f));
  // spotlights track the fragment index, so the highlight moves with the question
  slides[i].querySelectorAll('[data-spot]').forEach(el =>
    el.classList.toggle('lit', +el.dataset.spot === f));
  // [data-until="n"] is shown until fragment n arrives, then swapped out; pair it
  // with an overlaid [data-fr="n"] to replace content in place rather than stack it
  slides[i].querySelectorAll('[data-until]').forEach(el =>
    el.classList.toggle('gone', f >= +el.dataset.until));
  if (i !== painted){ painted = i; loggedF = -1; reclaimFocus(); }   // a new slide starts with the deck in charge
  if (f !== loggedF){ loggedF = f; logEntry(); }
  syncEmbeds();                             // boot the next Hazel, retire the last
  fitSlide(slides[i]);                      // measure before the HUD reads dataset.fit
  drawArrows(slides[i]);                    // after fit, so the boxes are final
  barI.style.width = Math.min(100, 100*i/(nMain-1)) + '%';
  const mf = maxFrOf(i);
  const isB = !!slides[i].dataset.backup;
  slidenum.textContent = isB ? 'B' + (i+1-nMain) : String(i+1);
  hud.innerHTML = (isB ? 'B'+(i+1-nMain)+'  ' : (i+1)+'/'+nMain) + (mf ? '·'+f+'/'+mf : '') +
    '  <span id="clk">' + clock() + '</span>' +
    (slides[i].dataset.fit ? ' <span class="off">fit ' + slides[i].dataset.fit + '</span>' : '');
  paintNotes();
  paintPanel();
  history.replaceState(null, '', '#' + (i+1) + (f ? '.'+f : ''));
}

function next(){ if (f < maxFrOf(i)) f++; else if (i < slides.length-1){ i++; f = 0; } paint(); }
function prev(){ if (f > 0) f--; else if (i > 0){ i--; f = maxFrOf(i); } paint(); }
function go(n){ i = Math.max(0, Math.min(slides.length-1, n)); f = 0; paint(); }
/* A control inside a slide can set its fragment (data-fr-to), so a view switch
   and the bullets it explains change in one click. */
function setFr(slide, n){ if (slides[i] === slide && n <= maxFrOf(i)){ f = n; paint(); } }

/* ---------- timer ----------
 * The clock survives a reload (t0 and paused are kept in localStorage), so
 * reloading to fix an embed mid-talk does not restart it. */
const CLOCK_KEY = 'deck.clock';
({t0 = null, paused = 0} = store.get(CLOCK_KEY) || {});
const saveClock = () => store.set(CLOCK_KEY, {t0, paused, run: run?.start || null});
const elapsed = () => t0 ? (paused || Date.now()) - t0 : null;   // ms, pause-aware

function mmss(sec, sign = false){
  const r = Math.round(sec), a = Math.abs(r);
  const str = Math.floor(a/60) + ':' + String(a%60).padStart(2, '0');
  return (r < 0 ? '−' : sign && r > 0 ? '+' : '') + str;
}
function clock(){
  if (!t0) return '--:--';
  const s = Math.floor(elapsed()/1000);
  const str = String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
  return s > 900 ? '<span class="off">'+str+'</span>' : str;   // 15:00 budget
}

/* ---------- rehearsal log ----------
 * Every run of the clock is recorded as the slides and fragments it entered
 * and when -- entries are [slide id, ms, fragment] -- and
 * `?timing` compares the runs against the targets in data-title. A run starts
 * with `t` and ends with `r`, which drops it if it stayed under 30 s on one slide. */
const RUNS_KEY = 'deck.runs';
const runs = () => store.get(RUNS_KEY) || [];
let run = null;
{ const c = store.get(CLOCK_KEY);
  if (c?.run) run = runs().find(r => r.start === c.run) || null; }

function saveRun(keep = true){
  if (!run) return;
  run.last = elapsed();
  const rs = runs().filter(r => r.start !== run.start);
  if (keep) rs.push(run);
  store.set(RUNS_KEY, rs.slice(-100));
}
function logEntry(){
  if (!run || !t0) return;
  const id = slides[i].dataset.id, last = run.entries.at(-1);
  if (last?.[0] !== id || (last[2] ?? 0) !== f) run.entries.push([id, elapsed(), f]);
  saveRun();
}

/* Per-slide time and the moment each slide was last left, from a run's entries.
   Revisits add up; `end` is the time of the entry after a slide's last visit. */
function splits(r){
  const dur = {}, end = {};
  r.entries.forEach(([id, t], k) => {
    const out = k + 1 < r.entries.length ? r.entries[k + 1][1] : r.last;
    dur[id] = (dur[id] || 0) + out - t;
    end[id] = out;
  });
  return {dur, end};
}
/* Time per fragment of one slide over a run, revisits added up: [ms at f=0, f=1, ...] */
function fragSplits(r, id){
  const out = [];
  r.entries.forEach(([eid, t, fr = 0], k) => {
    if (eid !== id) return;
    const nxt = k + 1 < r.entries.length ? r.entries[k + 1][1] : r.last;
    out[fr] = (out[fr] || 0) + nxt - t;
  });
  return out;
}
/* When the current visit to this slide began: the first of the trailing entries
   for it, since each fragment adds one */
function visitStart(r, id){
  const e = r?.entries;
  if (!e?.length || e.at(-1)[0] !== id) return null;
  let k = e.length - 1;
  while (k > 0 && e[k - 1][0] === id) k--;
  return e[k][1];
}

function toggleClock(){
  if (!t0){
    t0 = Date.now();
    run = {start: new Date().toISOString(), entries: [[slides[i].dataset.id, 0, f]], last: 0};
  }
  else if (paused){ t0 += Date.now()-paused; paused = 0; }
  else paused = Date.now();
  saveRun(); saveClock();
}
/* Reset asks twice: the first press (r or the button) arms it for a few
   seconds, and only a second press inside that window resets. No confirm()
   dialog -- it would open over the stage, in front of the audience. */
const ARM_MS = 3000;
let armed = 0;   // when reset was armed, or 0
function askReset(){
  if (!t0) return;
  if (armed && Date.now() - armed < ARM_MS){ armed = 0; resetClock(); }
  else { armed = Date.now(); setTimeout(() => { if (armed && Date.now() - armed >= ARM_MS){ armed = 0; paint(); } }, ARM_MS + 50); }
}
function resetClock(){ saveRun(run && (run.entries.length > 1 || elapsed() > 30000)); run = null; t0 = null; paused = 0; saveClock(); }

setInterval(()=>{
  const c = document.getElementById('clk');
  if (c) c.outerHTML = '<span id="clk">' + clock() + '</span>';
  if (PRESENTER) paintPanel();
  if (run && !paused && Date.now() % 5000 < 1000) saveRun();
}, 1000);

/* ---------- presenter notes ----------
 * The notes ARE the speaker script: each slide carries its own, as markdown in
 * <script type="text/markdown" class="notes">, and there is no separate file to
 * keep in step. `?script` renders every slide's notes in order as one document
 * for rehearsal or printing (below).
 *
 * The dialect is deliberately small — it is exactly what the script uses:
 *   > spoken lines          a blockquote; a bare ">" splits paragraphs
 *   > 📎 ⚠️ 📌 🔑 🛡️ ...     a blockquote paragraph opening with one of these
 *                           is a note to the presenter, not something to say
 *   *[CLICK — ...]*         a stage direction, as its own paragraph
 *   - item                  a list
 *   ## heading              only used in the talk-wide blocks
 *   **b** *i* `code`        inline
 *   @id                     another slide, by its data-id — rendered as its
 *                           current number, so inserting a slide renumbers
 *                           every reference. Never write a number by hand.
 */
const labelOf = n => slides[n].dataset.backup ? 'B' + (n + 1 - nMain) : 'S' + (n + 1);
const byId = new Map(slides.map((s, n) => [s.dataset.id, n]).filter(([id]) => id));
// "Live typing — the idea — 7:20": the time is a trailing m:ss, and a title may hold a dash of its own
const TITLE = /^(.*?)(?: — (\d+:\d\d))?$/;
const titleOf = n => TITLE.exec(slides[n].dataset.title || '')[1];
const timeOf  = n => TITLE.exec(slides[n].dataset.title || '')[2] || '';
const unresolved = new Set();

const NOTE_KIND = { '📎': 'cue', '⚠️': 'warn', '📌': 'fact', '🔑': 'key', '🛡️': 'defend' };

function inline(t, link){
  const code = [];
  t = t.replace(/`([^`]+)`/g, (_, c) => { code.push(c); return '\u0000' + (code.length - 1) + '\u0000'; });
  t = esc(t)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?![*\w])/g, '$1<em>$2</em>')
    .replace(/@([a-z][a-z0-9-]*)/g, (m, id) => {
      if (!byId.has(id)){ unresolved.add(id); return '<span class="bad-ref">' + m + '</span>'; }
      const n = byId.get(id), lab = labelOf(n);
      return link ? '<a href="#s-' + id + '">' + lab + '</a>' : '<span class="ref">' + lab + '</span>';
    });
  return t.replace(/\u0000(\d+)\u0000/g, (_, k) => '<code>' + esc(code[+k]) + '</code>');
}

function md(src, link = false){
  const raw = src.replace(/^\s*\n/, '').replace(/\s+$/, '').split('\n');
  const ind = Math.min(...raw.filter(l => l.trim()).map(l => l.match(/^ */)[0].length));
  const lines = raw.map(l => l.slice(ind));
  const out = [];
  let k = 0;
  const para = (text, cls) => {
    const bare = t => t.replace(/\uFE0F/g, '');
    const kind = Object.keys(NOTE_KIND).find(e => bare(text).startsWith(bare(e)));
    if (cls === 'say' && kind) cls = 'note ' + NOTE_KIND[kind];
    out.push('<p class="' + cls + '">' + inline(text, link) + '</p>');
  };
  while (k < lines.length){
    const l = lines[k];
    if (!l.trim()){ k++; continue; }
    if (/^## /.test(l)){ out.push('<h3>' + inline(l.slice(3), link) + '</h3>'); k++; continue; }
    if (/^- /.test(l)){
      const items = [];
      while (k < lines.length && /^(- |  )/.test(lines[k]) && lines[k].trim()){
        if (/^- /.test(lines[k])) items.push(lines[k].slice(2)); else items[items.length - 1] += ' ' + lines[k].trim();
        k++;
      }
      out.push('<ul>' + items.map(t => '<li>' + inline(t, link) + '</li>').join('') + '</ul>');
      continue;
    }
    if (/^>/.test(l)){
      let buf = [];
      const flush = () => { if (buf.length) para(buf.join(' '), 'say'); buf = []; };
      while (k < lines.length && /^>/.test(lines[k])){
        const t = lines[k].replace(/^> ?/, '');
        if (!t.trim()) flush(); else buf.push(t.trim());
        k++;
      }
      flush();
      continue;
    }
    const buf = [];
    while (k < lines.length && lines[k].trim() && !/^(>|- |## )/.test(lines[k])){ buf.push(lines[k].trim()); k++; }
    const text = buf.join(' ');
    para(text, /^\*\[.*\]\*$/.test(text) ? 'dir' : 'bg');
  }
  return out.join('');
}

const notesSrc = s => s.querySelector('script.notes[type="text/markdown"]')?.textContent || '';

/* Split rendered notes at their CLICK stage directions, so the presenter view
   can light the part of the script that belongs to the current fragment. A cue
   covers one fragment, or n written `CLICK ×n`. Returns each cue's element and
   the fragment it starts at; everything is tagged with its segment in
   data-seg (0 before the first cue). */
const CLICK = /\bCLICK\b(?:\s*[×x](\d+))?/;
function tagCues(root){
  const cues = [];
  let at = 1;
  for (const el of root.children){
    const m = el.matches('p.dir') && CLICK.exec(el.textContent);
    if (m){ cues.push({el, at}); at += +(m[1] || 1); }
    el.dataset.seg = cues.length;
  }
  return {cues, frags: at - 1};
}

let notesFor = -1, segShown = -1;
function paintNotes(){
  const src = notesSrc(slides[i]);
  if (notesFor !== i){
    notesFor = i; segShown = -1;
    notes.innerHTML = '<h4>' + labelOf(i) + ' · ' + (slides[i].dataset.title || '') + '</h4>' +
                      (src ? md(src) : '<p class="dim">&mdash;</p>');
  }
  if (!PRESENTER) return;
  const {cues} = tagCues(notes);
  const seg = cues.filter(c => c.at <= f).length;
  const nextCue = cues.find(c => c.at > f);
  for (const el of notes.children){
    const k = +el.dataset.seg;
    el.classList.toggle('seg-past', k < seg);
    el.classList.toggle('seg-now',  k === seg);
    el.classList.toggle('next-click', nextCue?.el === el);
  }
  if (seg !== segShown){
    segShown = seg;
    const first = [...notes.children].find(el => +el.dataset.seg === seg && el.tagName !== 'H4');
    notes.scrollTop = seg && first ? first.offsetTop - 28 : 0;   // not smooth: the panel's once-a-second repaint cancels it
  }
}

/* ---------- presenter panel ----------
 * The clock, where this slide should end (the `— m:ss` in data-title is the
 * elapsed time at the end of the slide), how long it has had against its
 * share, how late or early it was reached, and what comes next. */
const secOf = t => { const m = /^(\d+):(\d\d)$/.exec(t || ''); return m ? +m[1]*60 + +m[2] : null; };
const targetEnd = n => secOf(timeOf(n));
const targetStart = n => { for (let k = n - 1; k >= 0; k--){ const t = targetEnd(k); if (t != null) return t; } return 0; };
const pace = d => Math.abs(d) < 10 ? 'ok' : d > 0 ? 'late' : 'early';

function paintPanel(){
  const el = document.getElementById('pstat'), tm = document.getElementById('ptime');
  if (!el) return;
  const pick = document.getElementById('p-pick');
  if (pick && document.activeElement !== pick) pick.value = i;
  const runB = document.getElementById('p-run'), rstB = document.getElementById('p-reset');
  if (runB){
    runB.textContent = !t0 || paused ? '▶' : '❚❚';
    runB.title = (!t0 ? 'start' : paused ? 'resume' : 'pause') + ' the clock (t)';
    const hot = armed && Date.now() - armed < ARM_MS;
    rstB.title = hot ? 'press again to reset' : 'reset the clock and end the run (r, twice)';
    rstB.classList.toggle('armed', !!hot);
    rstB.disabled = !t0;
  }
  const now = elapsed(), sec = now == null ? null : now/1000;
  const s = slides[i], mf = maxFrOf(i), isB = !!s.dataset.backup;
  const end = targetEnd(i), start = targetStart(i);
  const v = visitStart(run, s.dataset.id), entry = v == null ? null : v/1000;
  const onSlide = sec != null && entry != null ? sec - entry : null;
  const prev = runs().filter(r => r.start !== run?.start).at(-1);
  const prevEnd = prev && splits(prev).end[s.dataset.id];

  const head = [], rows = [];
  // the clock row is static markup, so its buttons are not rebuilt under the pointer every second
  const ck = document.getElementById('p-clock');
  ck.textContent = sec == null ? '--:--' : mmss(sec);
  ck.classList.toggle('over', sec > 900);
  document.getElementById('p-wall').textContent =
    new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
  rows.push('<div class="p-state">' + (sec == null ? 'press <kbd>t</kbd> to start the clock'
    : paused ? '<b class="late">PAUSED</b> · <kbd>t</kbd> resumes' : '') +
    (armed ? ' <b class="late">press <kbd>r</kbd> or ↺ again to reset</b>' : '') + '</div>');
  head.push('<div class="p-slide">' + (isB ? labelOf(i) : (i + 1) + ' / ' + nMain) +
    (mf ? ' · click ' + f + '/' + mf : '') + '</div>');
  head.push('<div class="p-title">' + esc(titleOf(i)) + '</div>');

  if (end != null){
    const share = end - start, used = onSlide ?? 0;
    const frac = share > 0 ? used/share : 0;
    rows.push('<div class="p-meter ' + (frac > 1 ? 'late' : frac > .8 ? 'warn' : 'ok') +
      '"><i style="width:' + Math.min(100, frac*100) + '%"></i></div>');
    rows.push('<div class="p-line">on this slide <b>' + mmss(used) + '</b> of ' + mmss(share) + '</div>');
    rows.push('<div class="p-line">finish by <b>' + timeOf(i) + '</b>' +
      (sec != null ? ' · <b class="' + (end - sec < 0 ? 'late' : '') + '">' +
        mmss(Math.abs(end - sec)) + '</b> ' + (end - sec < 0 ? 'over' : 'left') : '') + '</div>');
    if (entry != null){
      const d = entry - start;
      rows.push('<div class="p-line">arrived <b class="' + pace(d) + '">' +
        (pace(d) === 'ok' ? 'on time' : mmss(Math.abs(d)) + ' ' + pace(d)) + '</b></div>');
    }
    if (prevEnd) rows.push('<div class="p-line dim">last run left it at ' + mmss(prevEnd/1000) + '</div>');
  } else if (onSlide != null){
    rows.push('<div class="p-line">on this slide <b>' + mmss(onSlide) + '</b></div>');
  }

  const n = i + 1 < slides.length ? i + 1 : null;
  rows.push('<div class="p-next">' + (n == null ? 'last slide'
    : 'next → ' + labelOf(n) + ' · ' + esc(titleOf(n)) +
      (timeOf(n) ? ' <span class="dim">' + timeOf(n) + '</span>' : '')) + '</div>');
  rows.push('<div class="p-crop" id="p-crop">' + cropText() + '</div>');
  el.innerHTML = head.join('');
  tm.innerHTML = rows.join('');
}

/* ---------- ?script: the whole talk as one document ----------
 * Talk-wide material lives in two blocks outside the slides: #talk-intro
 * (before the first slide) and #talk-outro (delivery notes, cut list, backups).
 * Unresolved @refs are listed at the top in red, so a renamed id is caught the
 * first time anyone looks. */
function renderScript(){
  const block = id => md(document.getElementById(id)?.textContent || '', true);
  const secs = slides.map((s, n) =>
    '<section id="s-' + (s.dataset.id || n) + '"><h2>' + labelOf(n) + ' · ' + esc(titleOf(n)) +
    (timeOf(n) ? ' <span class="t">' + esc(timeOf(n)) + '</span>' : '') + '</h2>' +
    (notesSrc(s) ? md(notesSrc(s), true) : '<p class="bg dim">No notes.</p>') + '</section>').join('');
  const doc = document.createElement('main');
  doc.id = 'script';
  doc.innerHTML = block('talk-intro') + secs + block('talk-outro');
  if (unresolved.size) doc.insertAdjacentHTML('afterbegin',
    '<p class="bad-ref">Unresolved slide refs: @' + [...unresolved].join(', @') + '</p>');
  // the presenter view lights the notes by CLICK cue, so each fragment needs one
  const off = slides.map((s, n) => {
    const d = document.createElement('div');
    d.innerHTML = md(notesSrc(s));
    const {frags} = tagCues(d);
    return frags === maxFrOf(n) ? null : '@' + s.dataset.id + ' (' + frags + ' cued, ' + maxFrOf(n) + ' fragments)';
  }).filter(Boolean);
  if (off.length) doc.insertAdjacentHTML('afterbegin',
    '<p class="bad-ref">CLICK cues do not match fragments: ' + inline(off.join(', ')) + '</p>');
  document.body.replaceChildren(doc);
  document.body.classList.add('script-view');
  document.title = 'Script — ' + document.title;
}
const SCRIPT_VIEW = new URLSearchParams(location.search).has('script');

/* The panel's own back / next buttons and slide picker, for when the keys are
   not an option. Each hands the focus back afterwards, so a later space or
   arrow moves the deck rather than pressing the button or scrolling the list. */
function wireNav(){
  const pick = document.getElementById('p-pick');
  const opt = n => '<option value="' + n + '">' + labelOf(n) + ' · ' + esc(titleOf(n)) +
    (timeOf(n) ? ' — ' + timeOf(n) : '') + '</option>';
  const all = slides.map((s, n) => n);
  pick.innerHTML = all.filter(n => !slides[n].dataset.backup).map(opt).join('') +
    '<optgroup label="Backup">' + all.filter(n => slides[n].dataset.backup).map(opt).join('') + '</optgroup>';
  const done = el => { el.blur(); reclaimFocus(); };
  document.getElementById('p-prev').addEventListener('click', e => { prev(); done(e.currentTarget); });
  document.getElementById('p-next').addEventListener('click', e => { next(); done(e.currentTarget); });
  pick.addEventListener('change', () => { go(+pick.value); done(pick); });
  document.getElementById('p-run').addEventListener('click', e => { toggleClock(); paint(); done(e.currentTarget); });
  document.getElementById('p-reset').addEventListener('click', e => { askReset(); paint(); done(e.currentTarget); });
}

/* ---------- ?timing: the rehearsal log against the targets ----------
 * One column per run, newest first: when each slide was left, and how long it
 * took, each against its target. */
function renderTiming(){
  const all = runs().slice().reverse().slice(0, 8);
  const cell = (ms, target) => {
    if (ms == null) return '<td class="dim">—</td>';
    const sec = ms/1000;
    if (target == null) return '<td>' + mmss(sec) + '</td>';
    const d = sec - target;
    return '<td>' + mmss(sec) + ' <span class="' + pace(d) + '">' + mmss(d, true) + '</span></td>';
  };
  const sp = all.map(splits);
  const shown = slides.map((s, n) => n).filter(n => !slides[n].dataset.backup ||
    sp.some(x => slides[n].dataset.id in x.dur));
  const head = '<tr><th></th><th>slide</th><th>target</th><th>per click, newest run</th>' + all.map((r, k) =>
    '<th colspan="2">' + new Date(r.start).toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'}) +
    ' <button data-del="' + r.start + '" title="delete this run">×</button></th>').join('') + '</tr>' +
    '<tr class="sub"><th></th><th></th><th>end · share</th><th>before the 1st click, then after each</th>' + all.map(() => '<th>left at</th><th>took</th>').join('') + '</tr>';
  const body = shown.map(n => {
    const id = slides[n].dataset.id, end = targetEnd(n);
    const share = end == null ? null : end - targetStart(n);
    return '<tr><td class="dim">' + labelOf(n) + '</td><td>' + esc(titleOf(n)) + '</td><td class="dim">' +
      (end == null ? '' : timeOf(n) + ' · ' + mmss(share)) + '</td><td class="clicks">' +
      (all[0] ? [...fragSplits(all[0], id)].map(ms => ms == null ? '–' : mmss(ms/1000)).join(' · ') : '') + '</td>' +
      sp.map(x => cell(x.end[id], end) + cell(x.dur[id], share)).join('') + '</tr>';
  }).join('');
  const total = '<tr class="total"><td></td><td>total</td><td class="dim">15:00 slot</td><td></td>' +
    all.map(r => cell(r.last, 900) + '<td></td>').join('') + '</tr>';
  const doc = document.createElement('main');
  doc.id = 'timing';
  doc.innerHTML = '<h1>Rehearsal timing</h1><p class="dim">Each run of the clock (<kbd>t</kbd> to <kbd>r</kbd>) ' +
    'in this browser. Late is red, early is green, within 10 s is plain. ' +
    (all.length ? '<button id="copy">Copy as JSON</button><button id="download">Download JSON</button><button id="clear">Clear all</button>' : '') + '</p>' +
    (all.length ? '<div class="scroll"><table>' + head + body + total + '</table></div>'
                : '<p>No runs yet. Press <kbd>t</kbd> in the deck to start one.</p>');
  document.body.replaceChildren(doc);
  document.body.classList.add('script-view');
  document.title = 'Timing — ' + document.title;
  doc.addEventListener('click', e => {
    const del = e.target.closest('[data-del]')?.dataset.del;
    if (del){ store.set(RUNS_KEY, runs().filter(r => r.start !== del)); renderTiming(); }
    if (e.target.id === 'clear' && e.target.dataset.sure){ store.set(RUNS_KEY, []); renderTiming(); }
    else if (e.target.id === 'clear'){ e.target.dataset.sure = 1; e.target.textContent = 'Clear all runs? click again'; }
    // the runs plus each slide's target, so the paste or file stands on its own
    const dump = () => JSON.stringify({targets: slides.map((s, n) => ({id: s.dataset.id, title: titleOf(n),
      end: timeOf(n) || null, fragments: maxFrOf(n)})), runs: runs()}, null, 1);
    if (e.target.id === 'copy')
      navigator.clipboard.writeText(dump())
        .then(() => { e.target.textContent = 'Copied'; }, () => { e.target.textContent = 'Copy failed'; });
    if (e.target.id === 'download'){
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([dump()], {type: 'application/json'}));
      a.download = 'timings-' + new Date().toISOString().slice(0, 16).replace(/[T:]/g, '-') + '.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }
  });
}
const TIMING_VIEW = new URLSearchParams(location.search).has('timing');

/* ---------- keys ---------- */
/* Take the keyboard back from an embedded Hazel. Blurring the iframe is what
   matters; focusing our own window alone leaves it with the focus. */
function reclaimFocus(){
  klog('reclaimFocus from', focusDesc(), new Error().stack.split('\n')[2]?.trim());
  if (document.activeElement instanceof HTMLIFrameElement) document.activeElement.blur();
  window.focus();
  markEditing();
}

/* Say which of the two has the keyboard. An embed is "editing" when it holds
   the focus and its slide is the one on screen -- exactly when guardKeys lets
   Hazel have the keys -- and deck.css turns its LIVE badge into EDITING. Focus
   moves without any event this window reliably sees (into an iframe, between
   iframes), so every path that can move it calls this, and the embeds report
   their own focus and blur too. */
function markEditing(){
  const a = document.activeElement;
  document.querySelectorAll('.embed').forEach(el => {
    const f = el.querySelector('iframe');
    el.classList.toggle('editing', !!f && a === f && slides[i] === el.closest('.slide'));
  });
}
addEventListener('blur',  () => setTimeout(markEditing));
addEventListener('focus', () => setTimeout(markEditing));

/* ?keylog: log every keydown the deck sees, and which way it went, to the
   console as [keys]. For chasing keys that reach the deck when they should
   have reached an embedded editor. */
const KEYLOG = new URLSearchParams(location.search).has('keylog');
const klog = (...a) => { if (KEYLOG) console.log('[keys]', ...a); };
const focusDesc = () => {
  const a = document.activeElement;
  if (!(a instanceof HTMLIFrameElement)) return 'deck:' + (a?.tagName || 'none');
  let inner = '?';
  try { const d = a.contentDocument.activeElement; inner = (d?.id || d?.tagName || 'none') + (d?.className ? '.' + String(d.className).split(' ')[0] : ''); } catch {}
  return 'iframe(' + (a.closest('.slide')?.dataset.id) + '):' + inner;
};

function onKey(e){
  klog('onKey', JSON.stringify(e.key), 'slide', slides[i]?.dataset.id, 'focus', focusDesc(),
       'target', e.target?.tagName || e.target?.constructor?.name);
  if (SCRIPT_VIEW || TIMING_VIEW) return;
  if (e.target.closest?.('select, input, textarea')) return;   // the slide picker keeps its own keys
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  switch(e.key){
    case 'ArrowRight': case ' ': case 'PageDown': case 'n': next(); e.preventDefault(); return;
    case 'ArrowLeft':  case 'PageUp': case 'p':             prev(); e.preventDefault(); return;
    case 'Home': go(0); return;
    case 'End':  go(slides.length-1); return;
    case 's': notes.classList.toggle('on'); return;
    case '?': case '/': help.classList.toggle('on'); return;
    case 't': toggleClock(); paint(); return;
    case 'r': askReset(); paint(); return;
    case '[': case ']':
      if (!PRESENTER) return;
      panelW = Math.max(240, Math.min(innerWidth/2, panelW + (e.key === ']' ? 40 : -40)));
      store.set(PANEL_KEY, panelW); fit(); return;
    case 'd': fitReport(); return;
    case 'Escape':
      help.classList.remove('on'); notes.classList.remove('on');
      reclaimFocus();
      return;
  }
  if (/^[1-9]$/.test(e.key)) go(+e.key - 1);
}
addEventListener('keydown', onKey);

/* click advances, except on interactive things */
addEventListener('click', e=>{
  if (SCRIPT_VIEW || TIMING_VIEW) return;
  if (e.target.closest('input, button, a, #notes, #help, #panel')) return;
  next();
});

/* ---------- live Hazel embeds ----------
 * A Hazel instance is a whole language implementation with its own evaluator,
 * so the deck mounts each one only around the slide that needs it rather than
 * booting every instance at startup and leaving them all running.
 *
 * The window is deliberately lopsided. LOOKAHEAD is how many slides early an
 * embed starts: one is enough for it to boot and seed while you are talking
 * over the slide before, and more would just put both back on screen at once.
 * KEEP_BEHIND is how long it survives after you leave, so stepping back one
 * slide — the common case — costs nothing. Go back further and it reboots.
 *
 * Slides 14–16 are three embeds in a row, so on 15 all three are up; the
 * others never overlap more than two. Nothing runs at startup.
 *
 * Mounting into an off-screen slide works because `.has-embed` keeps the slide
 * laid out and hides it with visibility rather than display. Hazel measures
 * font metrics from a real box on startup and gets nothing from `display:none`.
 *
 * Set __EMBED__ = false to fall back to the static listing beside each one. */
const LOOKAHEAD = 1, KEEP_BEHIND = 1;

const embeds = [...document.querySelectorAll('[data-embed]')].map(el => {
  const slide = el.closest('.slide');
  slide?.classList.add('has-embed');       // keep it laid out when off-slide
  const fallback = el.parentElement.querySelector('[data-embed-fallback]');
  if (window.__EMBED__ === false){ el.hidden = true; if (fallback) fallback.hidden = false; }
  else if (fallback) fallback.hidden = true;
  return { el, slide, onMount: null };
});

function mountEmbed(e){
  if (window.__EMBED__ === false || e.el.querySelector('iframe')) return;
  const f = document.createElement('iframe');
  f.src = e.el.dataset.embed;
  f.setAttribute('title', 'Hazel');
  f.addEventListener('load', () => guardKeys(f, e.slide));
  e.el.replaceChildren(f);
  e.onMount?.();                            // seed it, once the channel answers
}

/* Keys pressed inside an embed never reach this window, so an embed holding the
 * focus swallows the clicker. And it can hold it without being touched: an embed
 * boots a slide early, off screen, and Hazel focuses its editor on startup —
 * which left the slide before an embed deaf to the arrow keys.
 *
 * Same origin, so listen inside it, capturing, ahead of Hazel. If its slide is
 * not the one on screen, every key is the deck's. If it is, Hazel keeps the
 * arrows and the typing — that is how you edit it — but Escape, PageUp and
 * PageDown (what a clicker sends) still drive the deck. */
const DECK_KEYS = new Set(['Escape', 'PageUp', 'PageDown']);

function guardKeys(frame, slide){
  let w;
  try { w = frame.contentWindow; } catch { return; }
  w?.addEventListener('focus', () => setTimeout(markEditing));
  w?.addEventListener('blur',  () => setTimeout(markEditing));
  w?.addEventListener('keydown', e => {
    klog('guard', JSON.stringify(e.key), 'embed', slide.dataset.id, 'current', slides[i]?.dataset.id,
         'target', (e.target?.id || e.target?.tagName),
         (slides[i] === slide && !DECK_KEYS.has(e.key)) ? '-> hazel' : '-> deck');
    if (slides[i] === slide && !DECK_KEYS.has(e.key)) return;
    e.preventDefault(); e.stopImmediatePropagation();
    reclaimFocus();
    onKey(e);
  }, true);
}

function unmountEmbed(e){
  /* Also the first thing an embed shows, before it has ever been mounted —
     hence no early return on "there is no iframe to remove". An empty box
     looks like a bug; this says what it is waiting for. */
  if (e.el.querySelector('.embed-ph')) return;
  const ph = document.createElement('div');
  ph.className = 'embed-ph';
  ph.textContent = 'Hazel starts when this slide is next';
  e.el.replaceChildren(ph);
}

/* Called from paint(). Slide index, not slide number: `slides` is 0-based. */
function syncEmbeds(){
  if (window.__EMBED__ === false) return;
  embeds.forEach(e => {
    const n = slides.indexOf(e.slide);
    if (n < 0) return;
    const d = n - i;                        // >0 ahead of us, <0 behind
    (d <= LOOKAHEAD && d >= -KEEP_BEHIND) ? mountEmbed(e) : unmountEmbed(e);
  });
}

/* ---------- driving the embedded Hazel ----------
 * The embed is served SAME-ORIGIN with the deck (/embed/), so we can reach
 * into its window — and the build it runs exposes two entry points put there
 * for exactly this (src/web/ActionChannel.re, installed from Main.on_startup):
 *
 *   hazelAction(sexp)  schedules any Page.Update.t. The update type derives
 *                      sexp, so the whole action surface is addressable as
 *                      text and nothing here has to stay in sync with it.
 *   hazelLoad(text)    switches to the scratch editor and loads a program,
 *                      accepting the same text as a .hz slide file — probe
 *                      and statics triggers included.
 *
 * Both go through Hazel's ordinary update loop, so statics, history and
 * persistence behave as they would from the UI. Actions used below:
 *   (Globals (Set (SetLiveTyping true)))  turn live typing on or off
 *   (Globals (Set (Evaluation (SetProjectTables true))))
 *                                         draw tables in the evaluation panel
 *   (Globals (Set (SetDisplayWarnings false)))
 *                                         hide warnings (unused variables)
 *   (Editors (Scratch RefreshStatics))    force a statics pass
 *
 * Because the deck seeds the program itself, the embed's stored editor state
 * never matters — whatever was left in it from rehearsal is overwritten on
 * entry to the slide.
 *
 * Live typing is set outright, not toggled. Hazel's command palette only ever
 * flips it, and its record of the value (IndexedDB "hazel" / "kv" / "SETTINGS")
 * is written on a debounce, so a deck that flipped would drift out of step with
 * the editor the moment a read came back stale. Settings.Update.SetLiveTyping
 * exists so the knob on the slide and the editor cannot disagree: whatever the
 * embed was left in after rehearsal, the slide asserts its state on entry. */

/* Wait for ActionChannel to have installed itself in one slide's frame.
   `frame` is a getter, not an element: the iframe may not exist yet. */
function hazelWin(frame, timeout = 20000){
  return new Promise(resolve => {
    const t0 = Date.now();
    (function poll(){
      const f = frame();
      let w = null;
      try { w = f && f.contentWindow; } catch { /* not ready */ }
      if (w && typeof w.hazelAction === 'function') return resolve(w);
      if (Date.now() - t0 > timeout) return resolve(null);
      setTimeout(poll, 200);
    })();
  });
}

async function hazelAction(frame, sexp){
  const w = await hazelWin(frame);
  return !!w && w.hazelAction(sexp);
}
async function hazelLoad(frame, text){
  const w = await hazelWin(frame);
  return !!w && w.hazelLoad(text);
}
/* From the console: hazelAt(14).hazelAction('(Globals (Set (SetLiveTyping true)))') */
window.hazelAt = n => document.querySelectorAll('.slide')[n - 1]
  ?.querySelector('.embed iframe')?.contentWindow;

/* ---------- the live-Hazel slides ----------
 * Seven slides embed a real Hazel and drive it from controls on the slide. All
 * work the same way: a program written once with a PROBE placeholder, a
 * segmented view selector that decides which probe fills that placeholder, and
 * a live typing switch that is independent of it.
 *
 * Each program is a function of the trigger. `at(e)` wraps an expression in
 * whichever probe the current view asks for; the empty trigger leaves it bare
 * rather than wrapping it in nothing, so the None view is the program with no
 * decoration and no stray parentheses.
 *
 * Switching views re-seeds. That re-runs the program, which on something this
 * small is a blink, and it means every view is authored rather than clicked
 * into shape — nothing depends on a projector being where rehearsal left it.
 *
 * ^^fold collapses a definition to a single glyph. It must sit on ONE line;
 * split across lines the trigger is not consumed and leaks in as text. */

/* The paper's to_string example (Fig. 8).
 *
 * Called once per input rather than mapped over a list, so each input is a
 * line of its own. The calls carry no probes (the slide is about the branch
 * types, and probed results drew the eye away from them), and the evaluation
 * panel is not needed (the slide is `wide`). The last line maps over three
 * more inputs, the empty list among them, so the same function is also seen
 * used on a list.
 *
 * At the slide's 23pt these fourteen lines fill the editor's height. The
 * case is indented under the fun, `end` and `in` each get a line, and the
 * empty-list call rides in the map to pay for them; nothing wider than the
 * map call is left.
 *
 * d is matched on every call, so a VALUE probe on it is every input wide and
 * clips. Its types are short and worth showing, so d keeps a probe in the
 * type views and loses it in the value view. */
const TO_STRING = trigger => {
  const at = trigger ? (e => trigger + '(' + e + ')') : (e => e);
  const scrutinee = trigger === '^^probe' ? 'd' : at('d');
  const call = arg => 'to_string(' + arg + ');';
  return [
    'let sum : [Int] -> Int = ^^fold(fun xs -> case xs | [] => 0 | hd::tl => hd + sum(tl) end) in',
    'let to_string(d : (String, ?)) =',
    '    case ' + scrutinee,
    '    | ("int", ' + at('v') + ')  => string_of_int(v)',
    '    | ("bool", ' + at('v') + ') => string_of_int(v)',
    '    | ("nums", ' + at('v') + ') => string_of_int(sum(v))',
    '    | (_, ' + at('v') + ')      => "Unknown: " ++ v',
    '    end',
    'in',
    call('"int", 1'),
    call('"string", "hello"'),
    call('"bool", true'),
    call('"nums", [1., 2.]'),
    'map([("string", "world"), ("bool", false), ("nums", [])], to_string)',
    ''
  ].join('\n');
};

/* The label-value slide: to_lvs on a row, a city's weather reading (the
 * talk's running domain, from the notebook slide), from_lvs straight back, and then
 * what the conversion is for -- a filter on the labels as strings, so the row
 * from_lvs builds keeps only the entries whose labels start with temp
 * (string_match is an unanchored JS regex test, hence the ^). The row mixes
 * Ints and a String, so to_lvs types as [(label=String, value=?)]; from_lvs
 * gives ? both times. It opens on Value Probes, then the presenter switches
 * to Type Probes.
 *
 * The program ends in a hole, not in temps: with a variable as the
 * body, Hazel marks the other bindings (row) as unused. Nothing is written
 * after the last `in`; Hazel fills the body with grout. The blank first line
 * keeps the top line of code clear of the embed's LIVE badge.
 *
 * Bullets left, the editor right at 68%, 30pt.
 * The to_lvs call and the filter both break across two lines to fit at 30pt.
 * The value probe on lvs is wider than the editor and runs off the right
 * edge; that is fine, the start of it is what matters.
 *
 * No live typing switch: live typing has not been introduced yet, and on
 * build-column the same pair is what it answers. */
const LVS = trigger => {
  const at = trigger ? (e => trigger + '(' + e + ')') : (e => e);
  return [
    '',
    'let ' + at('lvs') + ' =',
    '    to_lvs((temp_max=14, temp_min=6,',
    '            wind=5, city="Oakland")) in',
    '',
    'let ' + at('row') + ' =',
    '    from_lvs(lvs) in',
    '',
    'let ' + at('temps') + ' =',
    '    from_lvs(filter(lvs, fun e ->',
    '      string_match("^temp", e.label))) in',
    ''
  ].join('\n');
};

/* The callback to slide 4: B2T2's buildColumn, adding a mean-quiz column whose
 * name is a runtime string and whose source columns are found by matching the
 * header. This is the operation that slide asked four unanswerable questions
 * about, now running, with live typing answering them.
 *
 * `build_column` is the real Hazel Lab implementation, verbatim from
 * hazel-programs/docs/b2t2/table-api-constructors-buildcolumn.hz: to_lvs, an
 * append, from_lvs. Its argument is [?] because labels are second class, which
 * is exactly the trade slide 12 set up.
 *
 * Field access, not destructuring: `fun (label, _) -> ...` over a to_lvs entry
 * binds `label` to the whole (label=…, value=…) pair rather than to the string,
 * because the positional pattern puns against the field name. `e.label` is both
 * correct and closer to the B2T2 pseudocode's getValue(row, c).
 *
 * The result carries ^^probe_table, which renders it through the table probe.
 * Hazel's evaluation-output panel has no rich rendering — it is a read-only
 * editor — so this is how the answer arrives as a table rather than as text. */
const BUILD_COLUMN = trigger => {
  const at = trigger ? (e => trigger + '(' + e + ')') : (e => e);
  return [
    'let average = ^^fold(fun (ns : [Int]) -> float_of_int(fold_left(ns, int_plus, 0)) /. float_of_int(length(ns))) in',
    'let build_column = ^^fold(fun (t : [?], c : String, f : ? -> ?) -> map(t, fun r -> from_lvs(to_lvs(r) @ [(c, f(r))]))) in',
    /* folded: the gradebook is on slide 4 as a table, and the result table
       below restates every column of it. Unfolded it costs four lines, which
       is exactly what the result table needs to clear the bottom of the box. */
    'let gradebook = ^^fold([(name="Alice", age=12, quiz1=8, quiz2=9, quiz3=7, quiz4=8, final=87), (name="Bob", age=17, quiz1=6, quiz2=8, quiz3=8, quiz4=7, final=85), (name="Cleo", age=13, quiz1=9, quiz2=10, quiz3=8, quiz4=8, final=90)]) in',
    '^^probe_table(build_column(gradebook, "average-quiz", fun ' + at('row') + ' ->',
    '  let ' + at('quizzes') + ' =',
    '    to_lvs(row)',
    '    |> filter(_, fun e -> string_match("quiz.*", e.label))',
    '    |> map(_, fun e -> e.value) in',
    '  average(quizzes)))',
    ''
  ].join('\n');
};

/* The rich-probe slide: a table straight out of a CSV, so every column is a
 * String — which is why the numbers are in quotes and why a conversion is the
 * first thing you reach for.
 *
 * The cleaning is a function, `clean`, called on two surveys. It loads with
 * no probe: the presenter adds one on `data` (Cmd+E) and turns it into a table
 * (right-click ▸ View as table), which shows both invocations side by side,
 * so one click cleans both. The probed expression is deliberately just `data`: a column action rewrites THAT
 * expression into a pipeline, so the rewrite lands in the function body
 * rather than inside a literal. `clean` comes first, its `in` on its own line.
 * View as table opens the probe in drawer mode (oopsla26_talk's ProbeProj), which opens below its line and pushes the
 * code down, so no blank rows are kept for the table to overlay. Year is left out of the rows: each survey is one year. The
 * numeric columns are cut to Temp alone, so the demo converts one column.
 *
 * survey_2021 loads drawn as a table (^^table: the Table projector on the
 * literal) so the data is on screen before any probe; survey_2022 stays
 * folded. The slide runs at 26pt for the room, which the tables pay for in
 * width: a probe anchors at the end of its expression's last line, so with
 * both invocations shown the 2022 table runs past the right edge, and after
 * Transform the table sits at the end of the long `|> map` line and runs
 * past it too (a scrollbar, not a cut). One invocation fits, and once the
 * filter is written the table anchors on that shorter line and fits again.
 * Everything fits at 20pt, if that trade ever goes the other way.
 *
 * View as table chooses the renderer explicitly, and an explicitly chosen
 * renderer stays inline however tall it is; `inline_rows_cap` only governs
 * the ones Hazel picks for you.
 *
 * Takes and ignores a trigger: this slide has no view selector, since which
 * probe decorates a node is not what it is about. */
const CLEANING = () => {
  const row = (y, r, t, s) => `(Region="${r}", Temp="${t}", Sector="${s}")`;
  return [
    'let clean(data) =',
    '    data',
    'in',
    'let survey_2021 = ^^table([' + [
      row('2021', 'ANC', '15.0', 'Industrial'),
      row('2021', 'ANC', '18.5', 'Industrial'),
      row('2021', 'ANC', '16.3', 'Artisanal'),
      row('2021', 'GBC', '12.7', 'Artisanal'),
    ].join(', ') + ']) in',
    'let survey_2022 = ^^fold([' + [
      row('2022', 'TQC', '15.5', 'Industrial'),
      row('2022', 'TQC', '14.3', 'Recreational'),
      row('2022', 'GBC', '13.1', 'Artisanal'),
    ].join(', ') + ']) in',
    '',
    'clean(survey_2021);',
    'clean(survey_2022)',
    ''
  ].join('\n');
};

/* The opening example again: the same unstack on the same weather readings,
 * so the audience already knows the values are strings. The readings load drawn
 * as a table (^^table), so there is nothing to switch on. `pivot_table` is the
 * Hazel Lab builtin; its columns come out of the `element` values, so all the
 * checker can say statically is [?].
 *
 * `report` is a thunk nothing calls. Its body never evaluates, and with live
 * typing on `wide.tmean` is marked anyway: no `tmean` among the columns
 * `index`, `tmax`, `tmin` — the opening slide's KeyError, found without running.
 *
 * The probe sits on the `let` pattern, and the definition is on its own line,
 * so the probe has the whole width of the line to itself — at the end of the
 * pivot_table line the observed rows clip. The editor is 70% wide beside
 * bullets at 23pt: the readings are written without spaces around `=`, and
 * the pivot_table call takes one argument per line with the first on the
 * call line, so the Live Type Probes reading of `wide` is the widest line and
 * fits. The presenter types one more line, so the height keeps one spare.
 *
 * The result carries a value probe in every view: the slide is `wide`, so
 * there is no evaluation panel. The presenter then types `head(wide).tmean;`
 * above it and probes that: the probe goes stuck and `2` stays, which is
 * what shows evaluation carrying on around the error. */
const UNSTACK = trigger => {
  const at = trigger ? (e => trigger + '(' + e + ')') : (e => e);
  return [
    'let readings = ^^table([' + [
      '(id="MX17004", element="tmax", value="27.8")',
      '(id="MX17004", element="tmin", value="14.5")',
      '(id="MX17005", element="tmax", value="31.2")',
      '(id="MX17005", element="tmin", value="16.0")',
    ].join(', ') + ']) in',
    'let ' + at('wide') + ' =',
    '    pivot_table(readings,',
    '                fun r -> r.element,',
    '                fun r -> r.id,',
    '                fun rs -> head(rs).value) in',
    'let report() = wide.tmean in',
    '^^probe(length(wide))',
    ''
  ].join('\n');
};

/* The representation slide: plain Hazel, before anything Hazel Lab adds.
 *
 * `labeled-tuples` is the presenter's own example, and a demo of the typing
 * rather than a tour of the syntax. The probed call takes its vector inline,
 * `magnitude(x=3., y=4.)`, so there is no `r` to explain, and the
 * `v.z` mark sits in a function above any value it could be about. Hazel
 * still evaluates around the error, so the probe goes stuck as soon as `z` is
 * typed and stays stuck once the annotation is gone: the talk uses that, the
 * mark changing while the probe does not. It loads with one probe, on the result
 * (5.), and the presenter then edits it live: `v.y` to `v.z`, a static error
 * because Vec2 has no z; then the annotation off `v`, which makes v's type
 * unknown, so the error goes and the program runs until it gets stuck at the
 * `.z` (the probe shows the stuck term). Reset puts it back. Every value is
 * written with exactly the labels, in exactly the order, of its type: Hazel
 * will reorder entries and fill labels in from a type, but the talk shows
 * neither. There are no bullets (the script carries the points), so the editor
 * has the slide's full width: about 65 characters at 32pt, which is why
 * `magnitude` fits on one line in Hazel's named-function syntax.
 *
 * `rs` is the slide's table, which used to be a slide of its own: a list
 * LITERAL of fully labeled rows, so the Table projector can take it over
 * (Option+L) and draw that same syntax as a table with the labels as its
 * header. It comes AFTER the probed call, sequenced with `;`, one row per
 * line, and the program ends by mapping `magnitude` over it, with a second
 * probe on that: `[5., 10., 13.]`. Its rows are Pythagorean triples, like
 * the probed call's, so every magnitude is whole. It opens broken: `v` has no annotation and
 * the body reads `v.z`, so both probes are stuck, and the map's stuck list runs
 * off the right edge (with a scrollbar). The presenter annotates `v` to get
 * the static error, then fixes `z` to `x` before reaching the table and the map.
 * (If the program ever needs to end in a hole on its own line again: `¿` in
 * the seed is FastParse's marker for implicit grout. A trailing newline alone
 * leaves the hole on the `in` line, and a source `?` is an explicit hole tile,
 * drawn as a yellow `?`.)
 * Broadcast projection (rs.x) is Hazel Lab's, so it is left out here and
 * arrives with the structural operations.
 *
 * It ignores the trigger, like CLEANING: Reset only, no view selector. */
const TUPLES = () => [
  'type Vec2 = (x=Float, y=Float) in',
  '',
  'let magnitude(v) = sqrt(v.z **. 2 +. (v.y **. 2)) in',
  '^^probe(magnitude(x=3., y=4.));',
  '',
  'let rs : [Vec2] = [',
  '  (x=3., y=4.),',
  '  (x=6., y=8.),',
  '  (x=5., y=12.)',
  '] in',
  '^^probe(map(rs, magnitude))'
].join('\n');

const PROGRAMS = { tuples: TUPLES, lvs: LVS, tostring: TO_STRING, unstack: UNSTACK, buildcolumn: BUILD_COLUMN, cleaning: CLEANING };

/* What the tracked nodes show, keyed by the segment's data-view.
 *
 *   none    (no trigger)        the bare program. Marks still appear here when
 *                               live typing is on — they come from re-checking,
 *                               not from any probe — so this is also how to
 *                               show the marks with nothing else on screen.
 *   static  ^^statics           type probe, expected reading. On a pattern the
 *                               expectation comes from the scrutinee, so the
 *                               tracked nodes read ? — statically we know
 *                               nothing about them.
 *   value   ^^probe             value probe — the evidence. Every value a node
 *                               saw, because the deck asks for the Many sample
 *                               window; otherwise it is one with a count badge.
 *   live    ^^statics_dynamic   type probe, dynamic reading — the meet of what
 *                               the node observed.
 *
 * Left-to-right order and the labels live in index.html, which is where you
 * would look for them; nothing here depends on the order, so the two cannot
 * drift. A slide opens on whichever segment its markup marks pressed.
 *
 * Independent of the live typing switch, deliberately. The dynamic reading
 * shows what ran whether or not anything is being checked against it, so you
 * can put the observations on screen first and then turn the checking on. */
const VIEW_TRIGGER = {
  none:   '',
  static: '^^statics',
  value:  '^^probe',
  live:   '^^statics_dynamic',
};

/* Wire one slide's controls to the Hazel in that same slide. Each control
   group names its program with data-embed-controls; everything else is found
   relative to the enclosing .slide, so slides cannot reach into each other. */
async function wireEmbedControls(ectl){
  const slide = ectl.closest('.slide');
  const build = PROGRAMS[ectl.dataset.embedControls];
  const tog   = ectl.querySelector('.bigtoggle');
  const rst   = ectl.querySelector('.ebtn');
  const msg   = ectl.querySelector('.warn-msg');
  const segs  = [...ectl.querySelectorAll('[data-view]')];
  const frame = () => slide.querySelector('.embed iframe');
  if (!build) return;

  /* Both controls are optional. A slide about what a probe shows wants the
     view selector; a slide about what a probe lets you DO does not, though it
     may still carry the live typing switch. What every slide gets is Reset,
     because these are editors and the audience watches you type in them. */
  const opening = segs.length
    ? (segs.find(b => b.getAttribute('aria-pressed') === 'true') || segs[0]).dataset.view
    : 'none';
  let view = opening;
  let on   = false;    // live typing off unless a toggle turns it on

  const paint = () => {
    if (tog){
      tog.setAttribute('aria-pressed', on ? 'true' : 'false');
      tog.querySelector('.state').textContent = on ? 'on' : 'off';
    }
    segs.forEach(b => b.setAttribute(
      'aria-pressed', b.dataset.view === view ? 'true' : 'false'));
  };
  const busy = v => {
    if (tog) tog.disabled = v;
    segs.forEach(b => b.disabled = v);
    if (rst) rst.disabled = v;
  };

  /* Changing live_typing does not by itself always retrigger a re-check
     promptly, and on stage the marks have to land while your hand is still on
     the switch. RefreshStatics is idempotent, so asking twice costs nothing. */
  const setLiveTyping = async v => {
    const ok = await hazelAction(frame, '(Globals (Set (SetLiveTyping ' + v + ')))');
    if (ok) await hazelAction(frame, '(Editors (Scratch RefreshStatics))');
    return ok;
  };

  /* Assert the whole state: the program in the current view, live typing where
     the knob says, and every probed value shown rather than one at a time.
     Nothing here reads anything back out of the embed, so it does not matter
     what rehearsal left behind.

     The sample window is a global probe setting, not part of the program, so a
     re-seed does not reset it — but asserting it each time is what keeps this
     function the single description of the slide's state. `Many` shows up to
     30 per node; the most any node here sees is six. */
  /* Slides whose answer is a rich probe do not need the evaluation panel
     restating it as text; embed.css takes the width back on this class. Set
     on every apply because a re-seed rebuilds the iframe's document body but
     not its root element -- cheap either way. */
  const layout = () => {
    const d = frame()?.contentDocument, want = ectl.dataset.embedLayout;
    if (!d) return;
    d.documentElement.classList.toggle('deck-wide', want === 'wide');
    d.documentElement.classList.toggle('deck-code', want === 'code');
    /* A slide can ask for a bigger editor font. --base-font-size is the
       supported knob (never a transform), and Hazel re-measures its font
       metrics when it changes, so setting it after boot is safe. */
    if (ectl.dataset.embedFont) d.documentElement.style.setProperty('--base-font-size', ectl.dataset.embedFont);
  };

  const apply = async () => {
    busy(true);
    const ok = await hazelLoad(frame, build(VIEW_TRIGGER[view]));
    layout();
    if (ok) await hazelAction(frame, '(Globals (Set (SetSampleWindow Many)))');
    /* Draw a table in the evaluation panel as a table, not a printed list --
       Hazel's "Project tables in evaluated results", off by default. Set, not
       toggled, for the same reason as live typing. */
    if (ok) await hazelAction(frame, '(Globals (Set (Evaluation (SetProjectTables true))))');
    /* No unused-variable warnings: the programs bind things only to talk
       about them (report), and a warning box there reads as a mark.
       Set, not toggled, for the same reason. */
    if (ok) await hazelAction(frame, '(Globals (Set (SetDisplayWarnings false)))');
    if (ok) await setLiveTyping(on);
    if (msg) msg.textContent = ok ? '' : 'embed not ready';
    paint();
    busy(false);
    /* Hazel focuses its editor when it boots, so an embed that boots on the
       slide on screen (a reload, a jump straight to it) would take the keys
       without being clicked. Every seed ends with the deck in charge; you
       click into the editor to edit it. */
    if (document.activeElement === frame()) reclaimFocus();
    return ok;
  };

  /* The embed is mounted and retired around this slide, so seeding is not a
     one-off: it runs on every mount, and because apply() asserts the whole
     state, a slide you come back to comes back as you left it rather than
     reset. Dead until the seed lands — clicking while Hazel is still coming up
     races it, and the controls end up saying the opposite of what the editor
     is doing. */
  paint();
  busy(true);
  embeds.find(e => e.slide === slide).onMount = apply;
  if (slide.querySelector('.embed iframe')) apply();   // already up

  segs.forEach(b => b.addEventListener('click', () => {
    const v = b.dataset.view;
    /* `in`, not truthiness: the None view's trigger is the empty string. */
    if (!(v in VIEW_TRIGGER) || v === view) return;
    view = v;
    apply();
    if (b.dataset.frTo != null) setFr(slide, +b.dataset.frTo);
  }));

  /* The toggle does not re-seed: flipping it must not disturb the view, and
     the program is the same either way. */
  tog?.addEventListener('click', async () => {
    busy(true);
    const ok = await setLiveTyping(!on);
    busy(false);
    if (!ok){ if (msg) msg.textContent = 'embed not ready'; return; }
    if (msg) msg.textContent = '';
    on = !on; paint();
  });

  /* Reset re-seeds rather than reloading: instant, discards whatever was
     typed, and puts both controls back where the slide opens. */
  if (rst) rst.addEventListener('click', () => {
    view = opening; on = false; apply();
    const b = segs.find(b => b.dataset.view === opening);
    if (b?.dataset.frTo != null) setFr(slide, +b.dataset.frTo);
  });
}

document.querySelectorAll('.ectl[data-embed-controls]').forEach(wireEmbedControls);

/* ---------- boot ---------- */
if (SCRIPT_VIEW || TIMING_VIEW) run = null;   // only the deck writes to the run it is recording
if (SCRIPT_VIEW) renderScript();
else if (TIMING_VIEW) renderTiming();
else {
  if (PRESENTER){ document.getElementById('panel').append(notes); wireNav(); }
  const m = /^#(\d+)(?:\.(\d+))?/.exec(location.hash);
  if (m){ i = Math.min(slides.length-1, +m[1]-1); f = +(m[2]||0); }
  paint();
}
