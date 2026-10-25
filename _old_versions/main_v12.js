// =====================================================
//  LODESTONE — a little hackathon story
//  a steampunk duck learns how real projects get made
//  made at SBUHacks 2026 (Steel & Steam) by nick
// =====================================================
import './font.css';
import {
  TS, MW, MH, T, tiles, BUILDINGS, DECOR, STATUE_TEXT, LOCKED_TOWER, STAGES, INTRO_A, INTRO_B,
  BIG_PROMPT, SMALL_NOTE, GEAR_NOTES, NPCS, NOTE_COUNT, FINALE_SPOTS, FINALE_LINES, NICK_LINES, CREDITS,
} from './data.js';
import { DUCK, DUCK_PAL, SOOT_PAL, PERSON, EMOTES, EMOTE_PAL } from './sprites.js';

const VW = 320, VH = 180, SCALE = 3;
const FONT = '"Press Start 2P", "Courier New", monospace';

const canvas = document.getElementById('game');
canvas.width = VW * SCALE; canvas.height = VH * SCALE;
const ctx = canvas.getContext('2d');
function fit() {
  const s = Math.min(innerWidth / VW, innerHeight / VH);
  canvas.style.width = Math.floor(VW * s) + 'px';
  canvas.style.height = Math.floor(VH * s) + 'px';
}
addEventListener('resize', fit); fit();

const lightC = document.createElement('canvas');
lightC.width = VW; lightC.height = VH;
const lctx = lightC.getContext('2d');

// ---------- helpers ----------
const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return (h ^ (h >>> 16)) >>> 0; };
const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
const circ = (x, y, r, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2); ctx.fill(); };
const rand = (a, b) => a + Math.random() * (b - a);
const lerp = (a, b, t) => a + (b - a) * t;
const hexRgb = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const rgbStr = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
function shade(hex, amt) { return '#' + hexRgb(hex).map(v => Math.max(0, Math.min(255, v + amt)).toString(16).padStart(2, '0')).join(''); }
function parseLine(s) {
  const m = /^\{(\w+)\}/.exec(s);
  return m ? { emote: m[1], text: s.slice(m[0].length) } : { emote: null, text: s };
}

// ---------- collision ----------
const solid = [...Array(MH)].map((_, y) => tiles[y].map(t => t === T.WATER || t === T.FENCE));
for (const b of BUILDINGS) for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) solid[y][x] = true;
for (const d of DECOR) solid[d.y][d.x] = true;
const decorAt = (x, y) => DECOR.find(d => d.x === x && d.y === y);
const npcAt = (x, y) => NPCS.find(n => !n.hidden && n.x === x && n.y === y);
const walkable = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH && !solid[y][x] && !npcAt(x, y);
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };
const npc = id => NPCS.find(n => n.id === id);
for (const n of NPCS) n.orig = { x: n.x, y: n.y, name: n.name, pal: { ...(n.pal || {}) }, acc: n.acc, hood: n.hood };
const LAMPS = DECOR.filter(d => d.kind === 'lamp');
LAMPS.forEach((d, i) => { d.idx = i; });

const DOOR_TEXT = {
  archive: ['it\'s locked. there\'s a note on the door', '"gone planning. back soon (probably)"'],
  workshop: ['you can hear ticking inside', '{dots}like... 41 different ticking things'],
  foundry: ['the door is warm to the touch', '{zzz}is someone snoring in there? no, it\'s just the furnace'],
  house: ['nobody\'s home. the welcome mat says "commit often"'],
  inn: ['{zzz}the inn is full of sleeping hackers. shh'],
  telegraph: ['the telegraph inside is beeping in morse code', '...it says "did you push your code?"'],
  garage: ['there\'s a big shape under a tarp in there', 'it looks like it\'s been waiting a long time'],
};

// =====================================================
//  GAME STATE
// =====================================================
const SPAWN = { x: 23, y: 13 };
const GEM = { x: 19 * TS + 48, y: 1 * TS + 12 };   // the lodestone, in the clock tower
let state = 'title';          // title | cutscene | play | end
let stage = 0;
let time = 0;
let dialog = null, journal = null, toast = null, term = null;
let fade = 1, fadeTarget = 0, fadeSpeed = 2.5;
let flash = 0, boomFlash = 0, shake = 0;
let brain = 'idle';           // idle | strain | broken | fixed
let brainTries = 0;
let camTarget = null;
let muted = false;
const notes = new Set();
const particles = [];
const emotes = new Map();     // key -> { type, t }
const airship = { lift: 0, launching: false, launched: false };
const lode = { lit: false, wave: -1 };
const credits = { t: 0, done: false };
const player = { tx: SPAWN.x, ty: SPAWN.y, x: SPAWN.x * TS, y: SPAWN.y * TS, fx: SPAWN.x, fy: SPAWN.y,
  dir: 'up', moving: false, prog: 0, step: 0, turnT: 0, queued: null, soot: false, bumpT: 0, blink: 0 };
const cam = { x: 0, y: 0, fx: 0, fy: 0 };
const env = { dark: STAGES[0].dark, tint: [...STAGES[0].tint], sky: STAGES[0].sky.map(hexRgb) };
const syncNPCs = () => { for (const n of NPCS) if (n.path) [n.x, n.y] = n.path[Math.min(stage, n.path.length - 1)]; };

// =====================================================
//  AUDIO — tiny blips, plus optional music files
//  drop mp3s into /public/music (see the readme there)
// =====================================================
let actx = null;
const ac = () => { try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { actx = null; } return actx; };
function beep(freq, dur = 0.05, vol = 0.03, type = 'square') {
  if (muted) return;
  const a = ac(); if (!a) return;
  try {
    const o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.value = freq; g.gain.value = vol;
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
    o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + dur);
  } catch (e) { /* ignore */ }
}
const jingle = () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.14, 0.04, 'triangle'), i * 90));
const bigChord = () => [262, 330, 392, 523, 659, 784].forEach((f, i) => setTimeout(() => beep(f, 1.6, 0.03, 'triangle'), i * 60));
// pip's little "weh!": short, squeaky, soft. a triangle voice + a touch of square, through a vowel filter
function quackSnd() {
  if (muted) return;
  const a = ac(); if (!a) return;
  try {
    const t = a.currentTime + 0.01, dur = 0.17, f0 = 640 * (0.93 + Math.random() * 0.14), v = 0.07;
    const mk = type => {
      const o = a.createOscillator(); o.type = type;
      o.frequency.setValueAtTime(f0 * 0.92, t); o.frequency.linearRampToValueAtTime(f0 * 1.18, t + 0.035); o.frequency.exponentialRampToValueAtTime(f0 * 0.78, t + dur);
      return o;
    };
    const o = mk('triangle'), o2 = mk('square'), g2 = a.createGain(); g2.gain.value = 0.18;
    const bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.6;
    bp.frequency.setValueAtTime(900, t); bp.frequency.exponentialRampToValueAtTime(2200, t + 0.05); bp.frequency.exponentialRampToValueAtTime(1100, t + dur);
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.012); g.gain.setValueAtTime(v, t + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(bp); o2.connect(g2); g2.connect(bp); bp.connect(g); g.connect(a.destination);
    o.start(t); o2.start(t); o.stop(t + dur + 0.02); o2.stop(t + dur + 0.02);
  } catch (e) { /* ignore */ }
}
// pip's footsteps: a very soft little squishy "pap", alternating feet so it waddles
function waddle(left) {
  if (muted) return;
  const a = ac(); if (!a) return;
  try {
    const t = a.currentTime, f0 = (left ? 520 : 430) * (0.97 + Math.random() * 0.06), dur = 0.07, v = 0.02;
    const o = a.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * 0.38, t + dur);
    const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400;
    const g = a.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(lp); lp.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + 0.01);
  } catch (e) { /* ignore */ }
}
function boomSound() {
  if (muted) return;
  const a = ac(); if (!a) return;
  try {
    const len = a.sampleRate * 1.2, buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    const src = a.createBufferSource(), g = a.createGain(), f = a.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 900; g.gain.value = 0.35;
    src.buffer = buf; src.connect(f); f.connect(g); g.connect(a.destination); src.start();
    const o = a.createOscillator(), og = a.createGain();
    o.frequency.setValueAtTime(120, a.currentTime); o.frequency.exponentialRampToValueAtTime(30, a.currentTime + 0.6);
    og.gain.setValueAtTime(0.4, a.currentTime); og.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.7);
    o.connect(og); og.connect(a.destination); o.start(); o.stop(a.currentTime + 0.7);
  } catch (e) { /* ignore */ }
}
const MUSIC = { intro: 'music/intro.mp3', town: 'music/town.mp3', finale: 'music/finale.mp3' };
// background music is meant to be barely there. raise these to make it louder
const MUSIC_VOL = { intro: 0.03, town: 0.035, finale: 0.05 };
let music = null, musicKey = null;
const fadingOut = [];
function playMusic(key) {
  if (musicKey === key && music) return;
  musicKey = key;
  if (music) { fadingOut.push(music); music = null; }
  if (!key) return;
  try {
    const a = new Audio(MUSIC[key]); a.loop = true; a.muted = muted; a.volume = 0;
    a.addEventListener('error', () => { if (music === a) music = null; });
    music = a;
    a.play().catch(() => { /* blocked until next keypress */ });
  } catch (e) { music = null; }
}
// called every frame. music is forced silent whenever the brass brain's screen is open
function updateMusic(dt) {
  if (music) {
    const target = term ? 0 : MUSIC_VOL[musicKey] || 0;
    const rate = (term ? 0.12 : MUSIC_VOL[musicKey] / 2) * dt;
    music.volume = Math.max(0, Math.min(1, music.volume + Math.max(-rate, Math.min(rate, target - music.volume))));
  }
  for (let i = fadingOut.length - 1; i >= 0; i--) {
    const f = fadingOut[i];
    f.volume = Math.max(0, f.volume - 0.08 * dt);
    if (f.volume <= 0) { f.pause(); fadingOut.splice(i, 1); }
  }
}
function resumeMusic() { if (music && music.paused && musicKey) music.play().catch(() => {}); }
addEventListener('keydown', resumeMusic);
addEventListener('mousedown', resumeMusic);

// =====================================================
//  SCRIPTING  (promise-based so cutscenes read top to bottom)
// =====================================================
const SKIP = Symbol('skip');
let timers = [];
let cutSkippable = false;
const pending = new Set();
function track(p, rej) { pending.add(rej); return p.finally(() => pending.delete(rej)); }
function wait(s) { let rej; const p = new Promise((res, r) => { rej = r; timers.push({ t: s, res }); }); return track(p, rej); }
function say(name, lines, who = null) { let rej; const p = new Promise((res, r) => { rej = r; openDialog(name, lines, res, who); }); return track(p, rej); }
function cancelScripts() { timers = []; for (const r of [...pending]) r(SKIP); pending.clear(); }
const fadeTo = (v, speed = 2.5) => { fadeTarget = v; fadeSpeed = speed; };

// =====================================================
//  DIALOG
// =====================================================
function openDialog(name, items, done, who = null) {
  dialog = { name, items: [...items], i: 0, shown: 0, done, who, sel: 0 };
  if (who && who.id) { const [dx, dy] = [player.tx - who.x, player.ty - who.y]; who.face = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'); who.faceT = 999; }
}
const curItem = () => dialog && dialog.items[dialog.i];
const itemText = it => typeof it === 'string' ? parseLine(it).text : it.quiz.q;
const itemEmote = it => typeof it === 'string' ? parseLine(it).emote : 'q';
function advanceDialog() {
  const it = curItem(); const text = itemText(it);
  if (dialog.shown < text.length) { dialog.shown = text.length; return; }
  if (typeof it !== 'string') {
    const q = it.quiz;
    if (dialog.sel === q.ans) { dialog.items.splice(dialog.i + 1, 0, '{spark}' + q.right); beep(880, 0.08, 0.04, 'triangle'); setTimeout(() => beep(1175, 0.1, 0.04, 'triangle'), 80); }
    else { dialog.items.splice(dialog.i + 1, 0, '{sweat}' + q.wrong, { quiz: q }); beep(180, 0.15, 0.04); }
    dialog.sel = 0;
  } else beep(440, 0.03);
  dialog.i++; dialog.shown = 0;
  if (dialog.i >= dialog.items.length) {
    const d = dialog.done, who = dialog.who;
    dialog = null;
    if (who && who.id) who.faceT = 1.6;
    if (d) d();
  }
}

// =====================================================
//  TERMINAL  (the brass brain's screen)
// =====================================================
function termOpen(title) { term = { title, lines: [], choice: null }; }
function termClose() { term = null; }
function termType(text, kind = 'ai', cps = 40) { let rej; const p = new Promise((res, r) => { rej = r; term.lines.push({ text, kind, shown: 0, cps, res }); }); return track(p, rej); }
function termChoose(opts) { let rej; const p = new Promise((res, r) => { rej = r; term.choice = { opts, sel: 0, res }; }); return track(p, rej); }

// =====================================================
//  PARTICLES + EMOTES
// =====================================================
function spawn(o) { particles.push(Object.assign({ vx: 0, vy: 0, g: 0, life: 1, rot: 0, vr: 0, size: 2, col: '#fff', kind: 'dot' }, o)); }
const BRAIN_X = 24 * TS, BRAIN_Y = 12 * TS - 6;
function explode() {
  boomSound(); boomFlash = 1; shake = 7;
  for (let i = 0; i < 16; i++) spawn({ kind: 'gear', x: BRAIN_X, y: BRAIN_Y, vx: rand(-90, 90), vy: rand(-170, -60), g: 280, life: rand(1.4, 2.2), size: rand(2, 4), vr: rand(-12, 12), col: ['#c9972f', '#a8822f', '#e0b04a', '#8a8f96'][i % 4] });
  for (let i = 0; i < 34; i++) spawn({ kind: 'smoke', x: BRAIN_X + rand(-8, 8), y: BRAIN_Y + rand(-6, 6), vx: rand(-50, 50), vy: rand(-50, 5), g: -12, life: rand(1.5, 3), size: rand(3, 7), col: '#2a2420' });
  for (let i = 0; i < 46; i++) spawn({ kind: 'spark', x: BRAIN_X, y: BRAIN_Y, vx: rand(-160, 160), vy: rand(-180, 40), g: 200, life: rand(0.3, 0.9), size: 1, col: '#ffd060' });
  for (let i = 0; i < 6; i++) spawn({ kind: 'paper', x: BRAIN_X, y: BRAIN_Y, vx: rand(-40, 40), vy: rand(-110, -60), g: 40, life: rand(2.5, 3.5), size: 3, vr: rand(-4, 4), col: '#f0e6c8' });
}
function steamPuff(x, y, n = 3, col = '#e8ecee') { for (let i = 0; i < n; i++) spawn({ kind: 'smoke', x: x + rand(-3, 3), y, vx: rand(-12, 12), vy: rand(-45, -25), life: rand(0.8, 1.4), size: rand(2, 4), col }); }
function confetti(x, y, n = 30) { for (let i = 0; i < n; i++) spawn({ kind: 'confetti', x, y, vx: rand(-90, 90), vy: rand(-150, -50), g: 120, life: rand(1.5, 2.8), vr: rand(-10, 10), col: ['#f0c050', '#e85a5a', '#7fd0ff', '#7aff9a', '#f0f0f0'][i % 5] }); }
function emote(key, type, t = 1.4) { emotes.set(key, { type, t }); }
const motes = [...Array(36)].map(() => ({ x: rand(0, VW), y: rand(0, VH), p: rand(0, 6), s: rand(0.4, 1) }));

// =====================================================
//  INPUT
// =====================================================
const keys = {};
addEventListener('keydown', e => {
  const c = e.code;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab'].includes(c)) e.preventDefault();
  const first = !keys[c];
  keys[c] = true;
  if (!first) return;
  ac();
  const dir = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' }[c];

  if (c === 'KeyM') { muted = !muted; if (music) music.muted = muted; return; }
  if (c === 'Escape') {
    if (journal) { journal = null; beep(330, 0.04); return; }
    if (state === 'cutscene' && cutSkippable) { skipIntro(); return; }
  }
  if ((c === 'KeyJ' || c === 'Tab') && state === 'play' && !dialog && !term) {
    journal = journal ? null : { tab: 0, scroll: 0 }; beep(journal ? 520 : 330, 0.04); return;
  }
  if (c === 'KeyQ' && state === 'play' && !dialog && !term && !journal) { quack(); return; }
  if (dir) {
    if (journal) {
      if (dir === 'left' || dir === 'right') { journal.tab = 1 - journal.tab; journal.scroll = 0; beep(400, 0.03); }
      if (dir === 'up') journal.scroll = Math.max(0, journal.scroll - 1);
      if (dir === 'down') journal.scroll++;
      return;
    }
    if (term && term.choice) {
      const ch = term.choice;
      if (dir === 'up') ch.sel = (ch.sel + ch.opts.length - 1) % ch.opts.length;
      if (dir === 'down') ch.sel = (ch.sel + 1) % ch.opts.length;
      beep(500, 0.02); return;
    }
    const it = curItem();
    if (it && typeof it !== 'string' && dialog.shown >= it.quiz.q.length) {
      const n = it.quiz.opts.length;
      if (dir === 'up') dialog.sel = (dialog.sel + n - 1) % n;
      if (dir === 'down') dialog.sel = (dialog.sel + 1) % n;
      beep(500, 0.02); return;
    }
    if (state === 'play' && !dialog && !term) {
      if (!player.moving && player.dir !== dir) { player.dir = dir; player.turnT = 0.09; }
      else player.queued = dir;
    }
    return;
  }
  if (['Space', 'Enter', 'KeyE', 'KeyZ'].includes(c)) interact();
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
canvas.addEventListener('mousedown', () => { ac(); interact(); });
const held = (...c) => c.some(k => keys[k]);
function heldDir() {
  if (held('ArrowUp', 'KeyW')) return 'up';
  if (held('ArrowDown', 'KeyS')) return 'down';
  if (held('ArrowLeft', 'KeyA')) return 'left';
  if (held('ArrowRight', 'KeyD')) return 'right';
  return null;
}

function quack() {
  quackSnd(); emote('pip', 'note', 1.1);
  for (const n of NPCS) {
    if (n.hidden) continue;
    const d = Math.abs(n.x - player.tx) + Math.abs(n.y - player.ty);
    if (d <= 3) setTimeout(() => emote(n.id, ['heart', 'q', 'bang', 'note'][hash(n.x, Math.floor(time)) % 4], 1.2), 150 + d * 90);
  }
}

function interact() {
  if (journal) return;
  if (state === 'title') { startGame(); return; }
  if (state === 'end') { if (credits.done) restart(); else credits.t += 6; return; }
  if (term && term.choice) { const ch = term.choice; term.choice = null; beep(660, 0.05); ch.res(ch.sel); return; }
  if (term) { const l = term.lines[term.lines.length - 1]; if (l && l.shown < l.text.length) l.shown = l.text.length; return; }
  if (dialog) { advanceDialog(); return; }
  if (state !== 'play' || player.moving) return;
  const [dx, dy] = DIRS[player.dir];
  const fx = player.tx + dx, fy = player.ty + dy;
  const n = npcAt(fx, fy);
  if (n) return talk(n);
  const d = decorAt(fx, fy);
  if (d) {
    if (d.kind === 'sign') { beep(520, 0.04); openDialog('sign', d.text); }
    else if (d.kind === 'statue') { beep(520, 0.04); openDialog('statue', STATUE_TEXT); }
    else if (d.kind === 'brain') useBrain();
    else if (d.kind === 'lamp') { const lit = lampLit(d); openDialog('lamp', [lit ? 'a warm lamp. it hums a little' : '{dots}this one is dark. maybe it needs a reason to glow']); }
    return;
  }
  for (const b of BUILDINGS) {
    const doorRow = b.y + b.h - 1;
    if (fy !== doorRow || !(fx === b.door || (b.tower && fx === b.door + 1))) continue;
    beep(300, 0.04);
    if (b.tower) openDialog('clock tower', lode.lit ? ['{heart}the lodestone hums up there. warm'] : LOCKED_TOWER);
    else openDialog(b.name, DOOR_TEXT[b.name] || ['locked.']);
    return;
  }
}

// =====================================================
//  STORY
// =====================================================
function talk(n) {
  beep(520, 0.04);
  if (n.talks) return openDialog(n.name, n.talks[Math.min(stage, n.talks.length - 1)], null, n);
  if (n.note) {
    const first = !notes.has(n.note);
    return openDialog(n.name, n.lines, () => { if (first) { notes.add(n.note); noteToast(n.note); } }, n);
  }
  if (n.quest === undefined) return openDialog(n.name, n.lines, null, n);
  if (stage < n.quest) return openDialog(n.name, n.early || ['not yet tho. ' + STAGES[stage].obj], null, n);
  if (stage === n.quest) {
    const lines = [...n.lesson];
    if (n.quest === 0 && player.soot) lines.unshift('{q}oh hey, you\'re kind of... covered in soot. was that explosion you?', 'ha, okay. happens to everyone');
    const after = n.id === 'gale' ? launchScene : n.id === 'mayor' ? finaleScene : gainGear;
    return openDialog(n.name, lines, after, n);
  }
  return openDialog(n.name, n.recap, null, n);
}

function gainGear() {
  const g = STAGES[stage].gear;
  stage++;
  syncNPCs();
  if (stage === 1) player.soot = false;
  if (stage >= 2 && brain === 'broken') brain = 'fixed';
  jingle(); flash = 1; emote('pip', 'spark', 1.6);
  toast = { text: '+ ' + g + ' gear', sub: stage < 6 ? 'a few more lamps flicker on  (j: journal)' : 'all six', t: 3 };
}
function noteToast(name) {
  beep(700, 0.06, 0.03, 'triangle'); setTimeout(() => beep(940, 0.08, 0.03, 'triangle'), 80);
  toast = { text: '+ note: ' + name, sub: 'saved to your journal', t: 2.4, note: true };
}

// ---------- intro: the big prompt ----------
async function introScene() {
  state = 'cutscene'; cutSkippable = true; brain = 'idle';
  placePlayer(SPAWN.x, SPAWN.y, 'up');
  fade = 1; fadeTo(0, 0.8);
  try {
    await wait(1.6);
    await say('...', INTRO_A);
    await wait(0.3);
    emote('pip', 'spark', 1.2);
    await wait(0.8);
    playMusic(null);
    termOpen('BRASS BRAIN v0.9 - ask me anything!');
    await wait(0.5);
    await termType('hi!! i\'m the brass brain. i can build anything. what do you need?', 'ai', 34);
    await wait(0.4);
    await termType(BIG_PROMPT, 'duck', 32);
    await wait(0.6);
    brain = 'strain';
    await termType('processing...', 'ai', 18);
    await wait(0.5);
    await termType('processing..........', 'ai', 14);
    await termType('a w-website? ALL of it?? at ONCE??', 'ai', 30);
    await termType('login + payments + ai + multipl- + mobi- + vir-', 'ai', 70);
    await termType('ERR: TOO MUCH  ERR: TOO MUCH  ERR: TOO MU', 'err', 90);
    await wait(0.7);
    termClose();
    emote('pip', 'sweat', 1.3);
    playMusic(null);
    await wait(1.3);
    explode(); brain = 'broken'; player.soot = true;
    await wait(2.4);
    emote('pip', 'dots', 1.5);
    await wait(1.0);
    cutSkippable = false;
    playMusic('town');
    await say('...', INTRO_B);
    state = 'play';
  } catch (e) { if (e !== SKIP) throw e; }
}
function skipIntro() {
  cancelScripts();
  termClose(); dialog = null; cutSkippable = false;
  brain = 'broken'; player.soot = true; fade = 0; fadeTo(0);
  placePlayer(SPAWN.x, SPAWN.y, 'up');
  playMusic('town');
  openDialog('...', INTRO_B.slice(1), () => { state = 'play'; });
}

// ---------- the brass brain, take two ----------
function useBrain() {
  if (brain === 'broken') { beep(200, 0.08); openDialog('brass brain', ['it\'s smoking a little. there\'s a sticky note on it', '"out of order. someone asked for everything at once"', '{sweat}(pip slowly backs away)']); return; }
  brainScene();
}
async function brainScene() {
  state = 'cutscene'; cutSkippable = false;
  playMusic(null);
  try {
    termOpen('BRASS BRAIN v1.0 - (fixed. please be nice)');
    await termType(brainTries ? 'oh. it\'s you again.' : 'oh. it\'s you. the duck from friday.', 'ai', 30);
    if (!brainTries) await termType('please don\'t do that again', 'ai', 30);
    await termType('...what do you want to ask me?', 'ai', 30);
    const pick = await termChoose([
      'build me a whole working website. everything. now.',
      'make a button that says hi when you click it',
      'i don\'t know, you pick',
    ]);
    brainTries++;
    if (pick === 0) {
      await termType('> build me a whole working website. everything. now.', 'duck', 40);
      brain = 'strain';
      await termType('no. no no no. not again', 'ai', 26);
      await termType('ERR ERR ERR ERR ERR', 'err', 80);
      await wait(0.4);
      termClose();
      await wait(0.9);
      explode(); brain = 'broken'; player.soot = true;
      await wait(2.2);
      await say('...', ['...it remembers you. it\'s scared of you now', 'the brass brain slowly reboots. it looks at you like "...really?"']);
      brain = 'fixed'; player.soot = false;
    } else if (pick === 2) {
      await termType('> i don\'t know, you pick', 'duck', 40);
      await termType('?????', 'ai', 20);
      await termType('i can\'t read your mind. tell me what you want, what it\'s for, and how you want it back', 'ai', 36);
      await wait(0.6);
      termClose();
      await say('...', ['{q}(context + task + format. that\'s the formula)']);
    } else {
      await termType('> make a button that says hi when you click it', 'duck', 40);
      await termType('easy. here you go:', 'ai', 30);
      await termType('<button onclick="alert(\'hi\')">say hi</button>', 'code', 45);
      await termType('done in 0.2 seconds. no explosions.', 'ai', 30);
      await termType('small ask = good answer. now ask for the next small thing. that\'s how you build big stuff', 'ai', 36);
      await termType('...also, thanks for asking nicely. nobody ever asks nicely', 'ai', 30);
      await wait(0.7);
      termClose();
      emote('brain', 'heart', 2);
      if (!notes.has(SMALL_NOTE.note)) { notes.add(SMALL_NOTE.note); noteToast(SMALL_NOTE.note); }
    }
    termClose();
    state = 'play';
    playMusic('town');
  } catch (e) { if (e !== SKIP) throw e; state = 'play'; playMusic('town'); }
}

// ---------- gale's airship ----------
async function launchScene() {
  state = 'cutscene';
  const g = npc('gale');
  try {
    camTarget = { x: 9 * TS, y: 25 * TS };
    await wait(0.8);
    g.face = 'up'; g.faceT = 999;
    emote('gale', 'bang', 1);
    beep(200, 0.3, 0.03, 'sawtooth');
    for (let i = 0; i < 8; i++) { steamPuff(9 * TS + rand(-20, 20), 27 * TS + 6, 4); await wait(0.12); }
    airship.launching = true;
    for (let i = 0; i < 10; i++) { beep(300 + i * 60, 0.15, 0.025, 'triangle'); await wait(0.25); }
    confetti(9 * TS, 26 * TS, 40);
    emote('pip', 'heart', 2); emote('cat', 'heart', 2);
    await wait(1.6);
    camTarget = null;
    g.faceT = 0.1;
    await say('gale', ['{heart}she\'s flying. she\'s actually flying', 'three years of almost ready, and she just... went', 'she flies herself, so i\'m staying down here. i just needed to see her go', 'thank you pip, for real. here\'s the deploy gear', 'now go see the mayor at the clock tower. they close at 9 sharp'], g);
    gainGear();
    state = 'play';
  } catch (e) { if (e !== SKIP) throw e; state = 'play'; }
}

// ---------- the finale ----------
async function finaleScene() {
  state = 'cutscene';
  try {
    gainGear();
    await wait(1.4);
    fadeTo(1, 2); await wait(1.0);
    for (const [id, [x, y]] of Object.entries(FINALE_SPOTS)) { const n = npc(id); n.x = x; n.y = y; n.face = 'down'; n.faceT = 999; }
    npc('pizza').hidden = true;
    placePlayer(21, 11, 'up');
    camTarget = { x: GEM.x, y: GEM.y + 40 };
    cam.fx = camTarget.x - VW / 2; cam.fy = camTarget.y - VH / 2;
    fadeTo(0, 1.2); await wait(1.6);
    for (let i = 0; i < 6; i++) {
      spawn({ kind: 'fly', x: player.x + 8, y: player.y, sx: player.x + 8, sy: player.y, tx: GEM.x, ty: GEM.y, t: 0, life: 99, col: '#f0c050' });
      beep([523, 587, 659, 784, 880, 1047][i], 0.2, 0.035, 'triangle');
      await wait(0.45);
    }
    await wait(1.1);
    lode.lit = true; lode.wave = 0; shake = 3; boomFlash = 0.7;
    bigChord(); playMusic('finale');
    confetti(GEM.x, GEM.y, 60);
    await wait(3.8);
    camTarget = { x: 22 * TS, y: 10 * TS };
    await wait(1.4);
    for (const [id, line] of FINALE_LINES) {
      const n = npc(id);
      n.face = 'down';
      await say(n.name, [line], n);
    }
    await wait(0.4);
    const h = npc('hood');
    emote('hood', 'dots', 1.4); await wait(1.4);
    await say('???', NICK_LINES.slice(0, 2), h);
    h.acc = null; h.pal = { ...h.pal, H: '#3a2a20', h: '#2a1e16', C: '#2e3a4e', c: '#f0c050', S: '#d8a888' };
    h.name = 'nick'; emote('hood', 'spark', 1); beep(880, 0.1, 0.03, 'triangle');
    await wait(0.6);
    await say('nick', NICK_LINES.slice(2), h);
    for (const n of NPCS) if (!n.hidden) emote(n.id, 'heart', 3);
    emote('pip', 'heart', 3);
    await wait(2.2);
    fadeTo(1, 1); await wait(1.8);
    camTarget = null;
    state = 'end'; credits.t = 0; credits.done = false;
    fadeTo(0, 1);
  } catch (e) { if (e !== SKIP) throw e; }
}

function placePlayer(x, y, dir) { Object.assign(player, { tx: x, ty: y, fx: x, fy: y, x: x * TS, y: y * TS, dir, moving: false, prog: 0, queued: null }); }
function startGame() { beep(660, 0.1); playMusic('intro'); introScene(); }
function restart() {
  cancelScripts();
  stage = 0; state = 'title'; dialog = null; toast = null; journal = null; term = null; camTarget = null;
  brain = 'idle'; brainTries = 0; notes.clear(); particles.length = 0; emotes.clear(); player.soot = false;
  airship.lift = 0; airship.launching = false; airship.launched = false;
  lode.lit = false; lode.wave = -1;
  for (const n of NPCS) { Object.assign(n, { x: n.orig.x, y: n.orig.y, name: n.orig.name, pal: { ...n.orig.pal }, acc: n.orig.acc, hidden: false, face: 'down', faceT: 0 }); }
  syncNPCs();
  placePlayer(SPAWN.x, SPAWN.y, 'up');
  fade = 1; fadeTo(0); playMusic(null);
}
syncNPCs();

// for demos / testing: window.LODESTONE.skipTo(5)
window.LODESTONE = {
  skipTo: n => { stage = n; brain = n >= 2 ? 'fixed' : 'broken'; if (n >= 5) { airship.launched = true; } syncNPCs(); },
  get stage() { return stage; }, get state() { return state; }, get notes() { return notes.size; },
  get dialog() { return dialog; }, get term() { return term; }, get credits() { return credits; }, get music() { return musicKey + (music && !music.paused ? ':playing' : ':off'); }, get musicVol() { return (music ? music.volume : 0) + fadingOut.reduce((a, f) => a + f.volume, 0); },
  tp: (x, y, d = 'down') => placePlayer(x, y, d),
  goTo: id => {
    const n = npc(id); if (!n) return false;
    for (const [d, [dx, dy]] of Object.entries(DIRS)) { const x = n.x - dx, y = n.y - dy; if (walkable(x, y)) { placePlayer(x, y, d); return true; } }
    return false;
  },
};

// =====================================================
//  UPDATE
// =====================================================
function lampLit(d) {
  if (stage >= 6 || lode.lit) { if (lode.wave >= 0 && lode.wave < 900) return Math.hypot(d.x * TS - GEM.x, d.y * TS - GEM.y) < lode.wave || (d.idx % 6) < stage + 2; return true; }
  return (d.idx % 6) < stage + 2;
}
function windowLit(x, y) {
  const base = (hash(x, y) % 6) < stage + 3;
  if (lode.lit) return base || lode.wave < 0 || Math.hypot(x - GEM.x, y - GEM.y) < lode.wave;
  return base;
}

function update(dt) {
  time += dt;
  updateMusic(dt);
  for (const t of [...timers]) { t.t -= dt; if (t.t <= 0) { timers.splice(timers.indexOf(t), 1); t.res(); } }

  fade += (fadeTarget - fade) * Math.min(1, dt * fadeSpeed);
  if (Math.abs(fade - fadeTarget) < 0.003) fade = fadeTarget;
  flash = Math.max(0, flash - dt * 1.5);
  boomFlash = Math.max(0, boomFlash - dt * 2.2);
  shake = Math.max(0, shake - dt * 9);
  if (toast) { toast.t -= dt; if (toast.t <= 0) toast = null; }
  for (const [k, e] of emotes) { e.t -= dt; if (e.t <= 0) emotes.delete(k); }
  for (const n of NPCS) if (n.faceT > 0) { n.faceT -= dt; if (n.faceT <= 0) n.face = 'down'; }
  player.blink -= dt; if (player.blink < -0.12) player.blink = rand(2, 4.5);

  const S = STAGES[lode.lit ? 6 : Math.min(stage, 5)], k = Math.min(1, dt * (lode.lit ? 0.6 : 0.9));
  env.dark = lerp(env.dark, S.dark, k);
  env.tint = env.tint.map((v, i) => lerp(v, S.tint[i], k));
  env.sky = env.sky.map((c, j) => c.map((v, i) => lerp(v, hexRgb(S.sky[j])[i], k)));
  if (lode.wave >= 0 && lode.wave < 900) lode.wave += dt * 220;

  if (airship.launching) {
    airship.lift += dt * (14 + airship.lift * 0.9);
    if (Math.random() < dt * 20) steamPuff(9 * TS + rand(-12, 12), 26 * TS + 22 - airship.lift, 1);
    if (airship.lift > 320) { airship.launching = false; airship.launched = true; }
  }

  if (dialog) {
    const text = itemText(curItem());
    const before = Math.floor(dialog.shown);
    dialog.shown = Math.min(text.length, dialog.shown + dt * (held('Space', 'Enter') ? 90 : 42));
    if (Math.floor(dialog.shown) !== before && before % 3 === 0) beep(320 + (before % 5) * 18, 0.022, 0.03);
  }
  if (term) {
    const l = term.lines[term.lines.length - 1];
    if (l && l.shown < l.text.length) {
      const before = Math.floor(l.shown);
      l.shown = Math.min(l.text.length, l.shown + dt * l.cps * (held('Space', 'Enter') ? 3 : 1));
      if (Math.floor(l.shown) !== before && before % 2 === 0) beep(l.kind === 'err' ? 150 : l.kind === 'duck' ? 600 : 880, 0.015, 0.025);
    }
    if (l && l.shown >= l.text.length && l.res) { const r = l.res; l.res = null; r(); }
  }

  if (brain === 'strain') { shake = Math.max(shake, 1.2 + Math.sin(time * 30) * 0.4); if (Math.random() < dt * 14) steamPuff(BRAIN_X + rand(-12, 12), BRAIN_Y - 10, 2); }
  if (brain === 'broken') {
    if (Math.random() < dt * 2) spawn({ kind: 'smoke', x: BRAIN_X + rand(-6, 6), y: BRAIN_Y - 10, vx: rand(-6, 6), vy: rand(-25, -12), life: rand(1.2, 2), size: rand(2, 4), col: '#3a3430' });
    if (Math.random() < dt * 1.2) for (let i = 0; i < 4; i++) spawn({ kind: 'spark', x: BRAIN_X + rand(-10, 10), y: BRAIN_Y - 4, vx: rand(-40, 40), vy: rand(-60, 0), g: 200, life: rand(0.2, 0.5), size: 1, col: '#ffd060' });
  }
  if (player.soot && Math.random() < dt * 0.8) spawn({ kind: 'smoke', x: player.x + 8, y: player.y - 2, vx: rand(-4, 4), vy: -14, life: 1, size: 1.5, col: '#4a4440' });
  if (lode.lit && Math.random() < dt * 3) spawn({ kind: 'spark', x: GEM.x + rand(-6, 6), y: GEM.y + rand(-6, 6), vx: rand(-10, 10), vy: rand(-20, -5), life: rand(0.6, 1.2), size: 1, col: '#ffe080' });

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    if (p.kind === 'fly') {
      p.t += dt * 1.1;
      const t = Math.min(1, p.t), mx = (p.sx + p.tx) / 2, my = Math.min(p.sy, p.ty) - 60;
      p.x = (1 - t) * (1 - t) * p.sx + 2 * (1 - t) * t * mx + t * t * p.tx;
      p.y = (1 - t) * (1 - t) * p.sy + 2 * (1 - t) * t * my + t * t * p.ty;
      p.rot += dt * 10;
      if (t >= 1) { for (let j = 0; j < 10; j++) spawn({ kind: 'spark', x: p.tx, y: p.ty, vx: rand(-60, 60), vy: rand(-60, 60), life: rand(0.3, 0.6), size: 1, col: '#ffe080' }); particles.splice(i, 1); }
      continue;
    }
    p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; p.life -= dt;
    if (p.kind === 'smoke') { p.vx *= 1 - dt * 1.5; p.size += dt * 3; }
    if (p.kind === 'paper' || p.kind === 'confetti') { p.vx *= 1 - dt * 1.2; p.vx += Math.sin(time * 4 + i) * dt * 40; }
    if (p.life <= 0) particles.splice(i, 1);
  }

  if (state === 'end') {
    credits.t += dt * (held('Space', 'Enter') ? 4 : 1);
    return;
  }
  if (state !== 'play' || dialog || journal || term) return;

  player.turnT -= dt; player.bumpT -= dt;
  if (!player.moving) {
    let d = heldDir();
    if (!d && player.queued) d = player.queued;
    player.queued = null;
    if (d && (player.turnT <= 0 || d !== player.dir)) {
      if (d !== player.dir) { player.dir = d; player.turnT = 0.09; }
      else {
        const nx = player.tx + DIRS[d][0], ny = player.ty + DIRS[d][1];
        if (walkable(nx, ny)) { player.fx = player.tx; player.fy = player.ty; player.tx = nx; player.ty = ny; player.moving = true; player.prog = 0; }
        else if (player.bumpT <= 0) { beep(90, 0.06, 0.03); player.bumpT = 0.3; }
      }
    }
  }
  if (player.moving) {
    const run = held('ShiftLeft', 'ShiftRight');
    player.prog += dt * (run ? 8 : 4.6);
    if (player.prog >= 1) {
      player.prog = 1; player.moving = false; player.step++;
      waddle(player.step % 2 === 0);
      if (run) spawn({ kind: 'smoke', x: player.x + 8, y: player.y + 14, vx: rand(-8, 8), vy: -6, life: 0.4, size: 1.5, col: '#8a7a6a' });
    }
    player.x = (player.fx + (player.tx - player.fx) * player.prog) * TS;
    player.y = (player.fy + (player.ty - player.fy) * player.prog) * TS;
  }
}

// =====================================================
//  DRAW: WORLD
// =====================================================
function drawSky() {
  const g = ctx.createLinearGradient(0, 0, 0, VH);
  g.addColorStop(0, rgbStr(env.sky[0])); g.addColorStop(0.6, rgbStr(env.sky[1])); g.addColorStop(1, rgbStr(env.sky[2]));
  ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
  const night = Math.min(1, env.dark / 0.6);
  for (let i = 0; i < 46; i++) {
    const k = hash(i, 7), x = k % VW, y = (k >>> 9) % 70;
    if ((Math.floor(time * 1.5) + i) % 11 !== 0) R(x, y, 1, 1, `rgba(255,240,210,${0.7 * night})`);
  }
  if (airship.launched) { // the steady breeze, out on its morning lap
    const x = ((time * 9) % (VW + 80)) - 40, y = 16 + Math.sin(time * 0.7) * 3;
    pEllipse(x, y, 11, 4, 'rgba(60,40,40,0.65)');
    R(x - 4, y + 5, 8, 2, 'rgba(60,40,40,0.65)'); R(x - 1, y + 6, 2, 1, 'rgba(255,200,100,0.8)');
  }
}
function drawSkyline() {
  for (let i = -2; i < 50; i++) {
    const k = hash(i, 3), x = i * 18, h = 14 + (k % 30), w = 14 + ((k >>> 5) % 10);
    R(x, -h, w, h + 2, '#241a2a');
    if (k % 3 === 0) { R(x + w - 5, -h - 9, 3, 9, '#241a2a'); smokeFx(x + w - 3, -h - 10, (k % 100) / 100, '#5a4a5a', 0.5); }
    if (k % 4 === 0) R(x + 4, -h + 5, 2, 2, 'rgba(255,190,100,0.7)');
  }
}

// ---------- pixel-art ground tiles (each variant/frame is drawn once, then cached) ----------
const tileCache = new Map();
function tileSprite(key, gen) {
  let c = tileCache.get(key); if (c) return c;
  c = document.createElement('canvas'); c.width = c.height = 16;
  const g = c.getContext('2d');
  gen((x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); });
  tileCache.set(key, c);
  return c;
}
function genGrass(P, v, f) {
  const s = [0, 1, 0, -1][f];
  P(0, 0, 16, 16, '#4c5636');
  for (let i = 0; i < 14; i++) { const k = hash(v * 97 + i, 13); P(k % 16, (k >>> 4) % 16, 1, 1, (k >>> 8) % 3 === 0 ? '#58643e' : '#434d30'); }
  if (v % 4 === 1) { const k = hash(v, 41); P(2 + k % 11, 3 + (k >>> 4) % 9, 2, 1, '#5e7040'); P(3 + k % 11, 2 + (k >>> 4) % 9, 1, 1, '#5e7040'); }   // clover
  const nT = 2 + (v % 2);
  for (let i = 0; i < nT; i++) {                                                                                       // swaying tufts
    const k = hash(v * 53 + i, 29), x = 2 + k % 12, y = 5 + (k >>> 5) % 9, sw = (k >>> 9) % 2 ? s : -s;
    P(x - 1, y + 1, 3, 1, '#3a4428');
    P(x - 1, y - 1, 1, 2, '#62723e'); P(x - 1 + Math.min(0, sw), y - 2, 1, 1, '#7a8a50');
    P(x, y - 2, 1, 3, '#6a7a44'); P(x + sw, y - 3, 1, 1, '#8ea05e');
    P(x + 1, y - 1, 1, 2, '#62723e'); P(x + 1 + Math.max(0, sw), y - 2, 1, 1, '#7a8a50');
  }
  if (v % 8 === 0) {                                                                                                   // a little flower (rare)
    const k = hash(v, 77), x = 3 + k % 10, y = 6 + (k >>> 4) % 7;
    const pc = [['#e89aa0', '#c86a78'], ['#f0d070', '#c8a040'], ['#f4ecd8', '#c8bca8']][(k >>> 8) % 3];
    P(x, y, 1, 3, '#5a6a3a'); const fx = x + s;
    P(fx - 1, y - 2, 3, 1, pc[0]); P(fx, y - 3, 1, 3, pc[0]); P(fx, y - 2, 1, 1, '#ffe8a0'); P(fx + 1, y - 1, 1, 1, pc[1]);
  }
}
function genCobble(P, v) {
  const mortar = '#463c34', cols = ['#786c5e', '#6e6254', '#82766a', '#6a5e50'];
  P(0, 0, 16, 16, mortar);
  for (let r = 0; r < 4; r++) {
    const y = r * 4; let x = -(hash(v, r) % 5);
    while (x < 16) {
      const k = hash(v * 7 + r, x + 20), w = 4 + k % 3, c = cols[k % 4];
      const x0 = Math.max(0, x), x1 = Math.min(16, x + w - 1);
      if (x1 > x0) {
        P(x0, y, x1 - x0, 3, c); P(x0, y, x1 - x0, 1, shade(c, 14)); P(x0, y + 2, x1 - x0, 1, shade(c, -14));
        if (x >= 0) { P(x0, y, 1, 1, mortar); P(x0, y + 2, 1, 1, mortar); }
        if (x + w - 1 <= 16) { P(x1 - 1, y, 1, 1, mortar); P(x1 - 1, y + 2, 1, 1, mortar); }
      }
      x += w;
    }
  }
  if (v % 5 === 0) P(hash(v, 3) % 15, 3, 2, 1, '#56663a');
}
function genDock(P, v) {
  const base = ['#6e4c30', '#76523a', '#684628', '#704e32'];
  for (let p = 0; p < 4; p++) {
    const x = p * 4, k = hash(v * 13 + p, 5), c = base[k % 4];
    P(x, 0, 4, 16, c); P(x, 0, 1, 16, shade(c, 14)); P(x + 3, 0, 1, 16, '#3e2818');
    P(x + 1 + (k % 2), (k >>> 3) % 10, 1, 3 + (k >>> 6) % 3, shade(c, -14));
    const jy = (k >>> 9) % 16; P(x, jy, 3, 1, '#3e2818'); P(x + 1, (jy + 2) % 16, 1, 1, '#2a1a0c'); P(x + 1, (jy + 14) % 16, 1, 1, '#2a1a0c');
  }
}
function genBridge(P, v, side) {
  for (let r = 0; r < 4; r++) {
    const y = r * 4, k = hash(v * 11 + r, 9), c = ['#6a4628', '#724c2c', '#64422a'][k % 3];
    P(0, y, 16, 4, c); P(0, y, 16, 1, shade(c, 14)); P(0, y + 3, 16, 1, '#3e2616');
    P(3 + (k % 8), y + 1, 3, 1, shade(c, -12)); P(1, y + 1, 1, 1, '#2a1a0c'); P(14, y + 1, 1, 1, '#2a1a0c');
  }
  if (side === 'L') { P(0, 0, 3, 16, '#2e1e10'); P(0, 0, 1, 16, '#4a3018'); for (let y = 0; y < 16; y += 8) { P(0, y, 3, 2, '#c9972f'); P(0, y, 3, 1, '#e8c060'); } }
  if (side === 'R') { P(13, 0, 3, 16, '#2e1e10'); P(15, 0, 1, 16, '#1a1008'); for (let y = 0; y < 16; y += 8) { P(13, y, 3, 2, '#c9972f'); P(13, y, 3, 1, '#e8c060'); } }
}
function genWater(P, f, top, bottom) {
  P(0, 0, 16, 16, '#233f52'); P(0, 9, 16, 7, '#20394b');
  for (const [y, o] of [[4, 0], [8, 6], [12, 11]]) {
    const x = (o + f * 2) % 16;
    P(x, y, 4, 1, '#3a6074'); P(x + 4, y, 1, 1, '#4f7c90'); if (x + 4 > 15) P(0, y, x + 5 - 16, 1, '#3a6074');
  }
  const sp = [[4, 6], [11, 3], [7, 12], [13, 9]][f]; P(sp[0], sp[1], 1, 1, '#a8d8f0');
  if (top) { for (let x = 0; x < 16; x += 4) { P(x, 0, 4, 3, '#5e554c'); P(x, 0, 4, 1, '#766c60'); P(x + 3, 0, 1, 3, '#3e3830'); } P(0, 3, 16, 1, '#152838'); }
  if (bottom) { P(0, 14, 16, 2, '#5e554c'); P(0, 14, 16, 1, '#3e3830'); }
}
function genFence(P, v, f) {
  genGrass(P, v, f);
  for (const y of [5, 11]) { P(0, y, 16, 2, '#221e1c'); P(0, y, 16, 1, '#3e3632'); }
  for (const x of [3, 11]) { P(x, 2, 2, 13, '#2e2824'); P(x, 2, 1, 13, '#4a423a'); P(x, 1, 2, 1, '#c9972f'); P(x, 0, 1, 1, '#e8c060'); }
}
function genBrass(P, v) {
  P(0, 0, 16, 16, v % 9 === 0 ? '#80632f' : '#8a6a34');
  P(0, 0, 16, 1, '#a8843e'); P(0, 1, 1, 15, '#9c7a3a'); P(0, 15, 16, 1, '#5a4420'); P(15, 0, 1, 15, '#634a22');
  for (let yy = 3; yy < 13; yy += 3) for (let xx = 3 + ((yy / 3) % 2) * 2; xx < 12; xx += 4) { P(xx, yy, 2, 1, '#a07d3c'); P(xx, yy + 1, 2, 1, '#6c5126'); }
  for (const [a, b] of [[1, 1], [13, 1], [1, 13], [13, 13]]) { P(a, b, 1, 1, '#e8c470'); P(a + 1, b, 1, 1, '#b8913f'); P(a, b + 1, 1, 1, '#5a4420'); }
  if (v % 7 === 0) { P(4 + (v % 6), 9, 2, 1, '#5f8a78'); P(5 + (v % 6), 10, 2, 1, '#4f7868'); }
  if (v % 11 === 0) P(6, 4, 4, 1, '#c09a4c');
}
const isWet = (x, y) => tiles[y] && (tiles[y][x] === T.WATER || tiles[y][x] === T.BRIDGE);
function drawTile(tx, ty) {
  const t = tiles[ty][tx], h = hash(tx, ty), v = h % 8;
  const wind = ((Math.floor(time * 2.2 - tx * 0.35 - ty * 0.2) % 4) + 4) % 4;   // a breeze rolling across town
  let key, gen;
  if (t === T.GRASS) { const gv = h % 16; key = 'g' + gv + '_' + wind; gen = P => genGrass(P, gv, wind); }
  else if (t === T.COBBLE) { key = 'c' + v; gen = P => genCobble(P, v); }
  else if (t === T.BRASS) { const b = h % 16; key = 'b' + b; gen = P => genBrass(P, b); }
  else if (t === T.WATER) { const f = ((Math.floor(time * 3 + tx * 0.7) % 4) + 4) % 4, top = !isWet(tx, ty - 1), bot = !isWet(tx, ty + 1); key = 'w' + f + top + bot; gen = P => genWater(P, f, top, bot); }
  else if (t === T.BRIDGE) { const side = tx === 21 ? 'L' : tx === 22 ? 'R' : ''; key = 'r' + (v % 4) + side; gen = P => genBridge(P, v % 4, side); }
  else if (t === T.DOCK) { key = 'd' + v; gen = P => genDock(P, v); }
  else if (t === T.FENCE) { key = 'f' + (v % 4) + wind; gen = P => genFence(P, v % 4, wind); }
  else return;
  ctx.drawImage(tileSprite(key, gen), tx * TS, ty * TS);
}

function smokeFx(x, y, phase, col = '#b8b0a6', scale = 1) {
  for (let i = 0; i < 5; i++) {
    const p = (time * 0.4 + phase + i / 5) % 1;
    ctx.globalAlpha = (1 - p) * 0.4;
    pCircle(x + Math.sin(p * 5 + i + phase * 9) * 4 * scale + p * 6 * scale, y - p * 32 * scale, (2 + p * 6) * scale, col);
  }
  ctx.globalAlpha = 1;
}
// pixel-art gears: rasterized once per (size, color, rotation step) and cached
const gearCache = new Map();
function gearSprite(r, col, step) {
  const key = r + '|' + col + '|' + step;
  let c = gearCache.get(key); if (c) return c;
  const P = r <= 3 ? { N: 6, tl: 1.5, hole: 1.0 } : r <= 5 ? { N: 8, tl: 1.75, hole: 1.4 } : r <= 7 ? { N: 8, tl: 2, hole: r * 0.32 } : { N: 10, tl: 2.5, hole: r * 0.32 };
  const per = Math.PI * 2 / P.N, rot = step * (per / 8);
  const inside = (x, y) => {
    const d = Math.hypot(x, y);
    if (d < P.hole) return 2;
    if (d <= r) return 1;
    if (d <= r + P.tl) { let a = (Math.atan2(y, x) + rot) % per; if (a < 0) a += per; if (a < per * 0.5) return 1; }
    return 0;
  };
  const R = r + 3, S = R * 2 + 1, grid = new Int8Array(S * S);
  for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) {   // 4x4 supersampled coverage = clean pixel edges
    let c1 = 0, c2 = 0;
    for (let sy = 0; sy < 4; sy++) for (let sx = 0; sx < 4; sx++) {
      const v = inside(x - 0.5 + (sx + 0.5) / 4, y - 0.5 + (sy + 0.5) / 4);
      if (v === 1) c1++; else if (v === 2) c2++;
    }
    grid[(y + R) * S + x + R] = c1 + c2 < 8 ? 0 : c2 >= 8 ? 2 : 1;
  }
  const g2 = (x, y) => (x < -R || y < -R || x > R || y > R) ? 0 : grid[(y + R) * S + x + R];
  c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d');
  const dark = shade(col, -50), light = shade(col, 40), holeCol = shade(col, -85);
  for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) {
    const v = g2(x, y); if (!v) continue;
    let color = col;
    if (v === 2) color = holeCol;
    else if (g2(x + 1, y) !== 1 || g2(x - 1, y) !== 1 || g2(x, y + 1) !== 1 || g2(x, y - 1) !== 1) color = dark;
    else if (x + y < -r * 0.5 && Math.hypot(x, y) > P.hole + 0.8) color = light;
    g.fillStyle = color; g.fillRect(x + R, y + R, 1, 1);
  }
  gearCache.set(key, c);
  return c;
}
function drawGear(x, y, r, col, rot) {
  r = Math.max(2, Math.round(r));
  const step = ((Math.round(rot / (Math.PI * 2 / 64)) % 8) + 8) % 8;
  ctx.drawImage(gearSprite(r, col, step), Math.round(x) - (r + 3), Math.round(y) - (r + 3));
}
function drawWindow(x, y, phase, lit = true) {
  R(x, y, 10, 9, '#3a2414');
  if (lit) {
    ctx.globalAlpha = 0.88 + Math.sin(time * 3 + phase) * 0.08;
    R(x + 1, y + 1, 8, 7, '#ffc65a'); R(x + 1, y + 1, 8, 2, '#ffdc8a');
    ctx.globalAlpha = 1;
    R(x + 1, y + 1, 1, 7, '#c0603a'); R(x + 8, y + 1, 1, 7, '#c0603a');          // little curtains
  } else { R(x + 1, y + 1, 8, 7, '#2e2a3a'); R(x + 1, y + 1, 8, 1, '#3e3a4c'); }
  R(x + 5, y + 1, 1, 7, '#3a2414'); R(x + 1, y + 4, 8, 1, '#3a2414');
  R(x + 2, y + 2, 1, 1, lit ? '#fff6d0' : '#5a5670');
  R(x - 1, y + 9, 12, 1, '#a08060'); R(x - 1, y + 10, 12, 1, '#4a3020');         // sill
}
// individually shaded bricks. P is any (x, y, w, h, color) painter
function brickWall(P, x0, y0, w, h, col, seed) {
  P(x0, y0, w, h, shade(col, -34));
  for (let r = 0; r * 4 < h; r++) {
    const y = y0 + r * 4, off = (r % 2) * 4, bh = Math.min(3, y0 + h - y); if (bh <= 0) continue;
    for (let x = x0 - off; x < x0 + w; x += 8) {
      const bx = Math.max(x0, x), bw = Math.min(x + 7, x0 + w) - bx; if (bw <= 0) continue;
      const k = hash(seed + x * 3, r * 7 + seed), c = shade(col, (k % 3 - 1) * 7);
      P(bx, y, bw, bh, c); P(bx, y, bw, 1, shade(c, 14));
      if (k % 9 === 0 && bw > 3) P(bx + 1, y + 1, 2, 1, shade(c, -12));
    }
  }
}
const SIGN_ICONS = {
  archive:   ['.KKKKK.', 'KWWKWWK', 'KWWKWWK', '.KKKKK.'],
  workshop:  ['K.....K', '.K...K.', '..KKK..', '..K.K..'],
  foundry:   ['...R...', '..RYR..', '.RYYYR.', '..RRR..'],
  house:     ['.RR.RR.', '.RRRRR.', '..RRR..', '...R...'],
  inn:       ['.......', 'KK.....', 'KKKKKKK', 'K.....K'],
  telegraph: ['...YY..', '..YY...', '.YYYY..', '...YY..'],
  garage:    ['.K.K.K.', '..KKK..', '.KK.KK.', '..KKK..'],
};
const SIGN_PAL = { K: '#3a2414', W: '#f4ecd8', R: '#c0403a', Y: '#ffd060' };
const bldCache = new Map();
function buildingSprite(b) {
  if (bldCache.has(b)) return bldCache.get(b);
  const W = b.w * TS, H = b.h * TS, roofH = b.h >= 6 ? 40 : 32, X0 = 4, Y0 = 24, wallY = Y0 + roofH - 4;
  const c = document.createElement('canvas'); c.width = W + 8; c.height = H + 30;
  const g = c.getContext('2d');
  const P = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const seed = b.x * 31 + b.y * 7;
  P(X0 + 3, Y0 + H - 1, W, 3, 'rgba(0,0,0,0.28)');                                    // ground shadow
  brickWall(P, X0, wallY, W, H - roofH, b.wall, seed);                                  // walls
  P(X0, wallY, 1, H - roofH + 4, shade(b.wall, -55)); P(X0 + W - 1, wallY, 1, H - roofH + 4, shade(b.wall, -55));
  P(X0, Y0 + H - 4, W, 4, '#3a342e');                                                   // stone foundation
  for (let x = X0; x < X0 + W; x += 6) { const sc = hash(x, b.y) % 2 ? '#5e564c' : '#544c44'; P(x, Y0 + H - 4, Math.min(5, X0 + W - x), 3, sc); P(x, Y0 + H - 4, Math.min(5, X0 + W - x), 1, '#706858'); }
  P(X0, Y0 + H - 1, W, 1, '#2a241e');
  P(X0 + 2, wallY + 4, 2, H - roofH - 6, '#4a3e32'); P(X0 + 2, wallY + 4, 1, H - roofH - 6, '#6a5a4a');   // drain pipe
  P(X0 + 1, wallY + 10, 4, 2, '#a8822f'); P(X0 + 1, wallY + 10, 4, 1, '#e0b860'); P(X0 + 1, Y0 + H - 9, 4, 2, '#a8822f');
  const dX = X0 + (b.door - b.x) * TS;                                                   // door
  P(dX + 2, Y0 + H - 19, 12, 16, shade(b.wall, -25)); P(dX + 2, Y0 + H - 19, 12, 1, shade(b.wall, 18));
  P(dX + 3, Y0 + H - 17, 10, 14, '#5a3820');
  P(dX + 3, Y0 + H - 17, 1, 1, shade(b.wall, -25)); P(dX + 12, Y0 + H - 17, 1, 1, shade(b.wall, -25));
  P(dX + 4, Y0 + H - 17, 8, 1, '#7a5030');
  P(dX + 6, Y0 + H - 16, 1, 13, '#3e2614'); P(dX + 9, Y0 + H - 16, 1, 13, '#3e2614');
  P(dX + 3, Y0 + H - 14, 2, 1, '#2a1a0e'); P(dX + 3, Y0 + H - 7, 2, 1, '#2a1a0e');
  P(dX + 10, Y0 + H - 10, 1, 1, '#f0d070'); P(dX + 10, Y0 + H - 9, 1, 1, '#a8822f');
  P(dX + 1, Y0 + H - 3, 14, 2, '#7a7068'); P(dX + 1, Y0 + H - 3, 14, 1, '#948a80');     // step
  const icon = SIGN_ICONS[b.name];                                                       // little brass shop sign
  if (icon) {
    P(dX + 3, Y0 + H - 26, 10, 6, '#6a4e22'); P(dX + 4, Y0 + H - 25, 8, 4, '#c9972f'); P(dX + 4, Y0 + H - 25, 8, 1, '#e8c060');
    for (let r = 0; r < 4; r++) for (let q = 0; q < 7; q++) { const ch = icon[r][q]; if (ch !== '.') P(dX + 4 + q, Y0 + H - 25 + r, 1, 1, SIGN_PAL[ch]); }
  }
  const doorWX = b.door * TS;                                                            // flower boxes under some windows
  for (let wx = b.x * TS + 5; wx + 10 < (b.x + b.w) * TS; wx += 20) {
    if (Math.abs(wx + 5 - (doorWX + 8)) < 14 || hash(wx, b.y) % 2) continue;
    const lx = X0 + wx - b.x * TS;
    P(lx - 1, wallY + 18, 12, 3, '#6a4428'); P(lx - 1, wallY + 18, 12, 1, '#8a5a36');
    for (let q = 0; q < 5; q++) { const fc = ['#e89aa0', '#f0d070', '#f4ecd8', '#e8a0c8'][(hash(wx, q) % 4)]; P(lx + q * 2, wallY + 17, 1, 1, fc); P(lx + q * 2, wallY + 17 + 1, 1, 1, '#5a7a3a'); }
  }
  // roof: scalloped shingles
  P(X0 - 2, Y0 + 6, W + 4, roofH - 9, shade(b.roof, -32));
  for (let r = 0; Y0 + 6 + r * 4 < Y0 + roofH - 3; r++) {
    const y = Y0 + 6 + r * 4, off = (r % 2) * 3, hh = Math.min(4, Y0 + roofH - 3 - y);
    for (let x = X0 - 2 - off; x < X0 + W + 2; x += 6) {
      const bx = Math.max(X0 - 2, x), bw = Math.min(x + 6, X0 + W + 2) - bx; if (bw <= 0) continue;
      const k = hash(x + seed, r + b.y * 5), sc = shade(b.roof, (k % 3 - 1) * 8);
      P(bx, y, bw, hh, sc); P(bx, y + hh - 1, bw, 1, shade(sc, -28)); P(bx, y, 1, Math.max(1, hh - 1), shade(sc, 16));
      if (x >= X0 - 2) P(bx, y + hh - 1, 1, 1, shade(sc, -45));
    }
  }
  P(X0 - 2, Y0 + 6, 1, roofH - 9, shade(b.roof, -55)); P(X0 + W + 1, Y0 + 6, 1, roofH - 9, shade(b.roof, -55));
  P(X0 + 4, Y0, W - 8, 7, shade(b.roof, -25)); P(X0 + 4, Y0, W - 8, 1, shade(b.roof, 12));          // ridge
  for (let x = X0 + 7; x < X0 + W - 6; x += 5) P(x, Y0 + 1, 1, 5, shade(b.roof, -42));
  P(X0 + 3, Y0 - 2, 2, 3, '#c9972f'); P(X0 + W - 5, Y0 - 2, 2, 3, '#c9972f'); P(X0 + 3, Y0 - 2, 1, 1, '#f0d070'); P(X0 + W - 5, Y0 - 2, 1, 1, '#f0d070');
  P(X0 - 2, Y0 + roofH - 3, W + 4, 2, '#a8822f'); P(X0 - 2, Y0 + roofH - 3, W + 4, 1, '#e0b860');    // brass gutter
  P(X0, Y0 + roofH - 1, W, 2, 'rgba(0,0,0,0.28)');
  if (b.chim) { const cx = X0 + W - 16; brickWall(P, cx, Y0 - 10, 7, 16, '#6a3a2a', seed + 3); P(cx - 1, Y0 - 11, 9, 3, '#2e2018'); P(cx - 1, Y0 - 11, 9, 1, '#4a3628'); }
  if (b.big) { brickWall(P, X0 + 8, Y0 - 16, 8, 22, '#4a3a32', seed + 9); P(X0 + 7, Y0 - 18, 10, 3, '#221a16'); P(X0 + 7, Y0 - 18, 10, 1, '#3a2e28'); }
  bldCache.set(b, c);
  return c;
}
function drawBuilding(b) {
  if (b.tower) return drawTower(b);
  const X = b.x * TS, Y = b.y * TS, W = b.w * TS, roofH = b.h >= 6 ? 40 : 32, wallY = Y + roofH - 4;
  ctx.drawImage(buildingSprite(b), X - 4, Y - 24);
  const doorX = b.door * TS;
  for (let xx = X + 5; xx + 10 < X + W; xx += 20) { if (Math.abs(xx + 5 - (doorX + 8)) < 14) continue; drawWindow(xx, wallY + 7, xx * 0.1, windowLit(xx, Y)); }
  if (b.chim) smokeFx(X + W - 13, Y - 12, b.x * 0.37);
  if (b.big) {
    drawGear(X + W / 2 - 22, wallY + 14, 7, '#c9973f', time * 1.2);
    drawGear(X + W / 2 + 26, wallY + 12, 5, '#a8822f', -time * 1.6);
    smokeFx(X + 12, Y - 19, 0.5, '#9a8a80', 1.3);
    R(X + 11, Y - 19, 2, 2, 'rgba(255,140,60,0.85)'); R(X + 11, Y - 19, 1, 1, '#ffd080');
  }
}

function drawTower(b) {
  const X = b.x * TS, Y = b.y * TS, W = b.w * TS, H = b.h * TS;
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(X + 3, Y + H - 2, W, 4);
  brickWall(R, X, Y + 30, W, H - 30, '#5e4e40', 7);
  R(X - 2, Y + 28, W + 4, 4, '#3f6f66');
  const sx0 = X + 22, sw = 52;
  brickWall(R, sx0, Y - 34, sw, 64, '#6e4434', 11);
  R(sx0 - 4, Y - 40, sw + 8, 7, '#3f6f66');
  ctx.fillStyle = '#35605a';
  for (let k = 0; k <= 30; k++) { const hw = Math.round((k / 30) * (sw / 2 + 2)); R(sx0 + sw / 2 - hw, Y - 70 + k, hw * 2, 1, '#35605a'); R(sx0 + sw / 2 - hw, Y - 70 + k, 1, 1, '#4f8078'); if (k % 6 === 3) R(sx0 + sw / 2 - hw + 1, Y - 70 + k, hw * 2 - 2, 1, '#2c5048'); }
  R(sx0 + sw / 2 - 1, Y - 80, 2, 12, '#a8822f');
  const cx = sx0 + sw / 2, cy = Y - 18;
  pCircle(cx, cy, 13, '#6a4e22'); pCircle(cx, cy, 12, '#a8822f'); pCircle(cx, cy, 10, '#f0e2bc'); R(cx - 6, cy - 7, 3, 1, '#fffaf0');
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; R(Math.round(cx + Math.cos(a) * 9), Math.round(cy + Math.sin(a) * 9), 1, 1, '#3a2a1a'); }
  const [hh, mm] = STAGES[Math.min(stage, 6)].time.split(' ')[1].split(':').map(Number);
  const hA = ((hh % 12) + mm / 60) / 12 * Math.PI * 2 - Math.PI / 2, mA = mm / 60 * Math.PI * 2 - Math.PI / 2;
  ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 2;
  pLine(cx, cy, cx + Math.cos(hA) * 5, cy + Math.sin(hA) * 5, '#2a1a10'); pLine(cx + 1, cy, cx + 1 + Math.cos(hA) * 5, cy + Math.sin(hA) * 5, '#2a1a10');
  ctx.lineWidth = 1;
  pLine(cx, cy, cx + Math.cos(mA) * 8, cy + Math.sin(mA) * 8, '#2a1a10'); R(cx, cy, 1, 1, '#c9972f');
  // the lodestone
  R(cx - 10, GEM.y - 9, 20, 19, '#1e140c'); R(cx - 9, GEM.y - 8, 18, 17, lode.lit ? '#4a3418' : '#1a1a22');
  R(cx - 11, GEM.y + 9, 22, 2, '#a8822f');
  const pulse = lode.lit ? 0.8 + Math.sin(time * 3) * 0.2 : 0;
  ctx.fillStyle = lode.lit ? `rgb(255,${200 + pulse * 40 | 0},${90 + pulse * 40 | 0})` : '#4a5466';
  { const gc = ctx.fillStyle; for (let dy = -7; dy <= 7; dy++) { const w = Math.round(5 * (1 - Math.abs(dy) / 7.5)); R(cx - w, GEM.y + dy, w * 2 + 1, 1, gc); if (w > 0) R(cx + w, GEM.y + dy, 1, 1, lode.lit ? '#c8902a' : '#343c4c'); } }
  R(cx - 2, GEM.y - 3, 2, 2, lode.lit ? '#fff8d8' : '#6a7486');
  drawWindow(sx0 + 4, Y + 8, 1, lode.lit); drawWindow(sx0 + sw - 14, Y + 8, 2, lode.lit);
  const doorX = b.door * TS;
  R(doorX + 2, Y + H - 18, 28, 18, '#2a1a0e'); R(doorX + 4, Y + H - 16, 24, 16, '#4a2e18'); R(doorX + 15, Y + H - 16, 1, 16, '#2a1a0e');
  R(doorX + 2, Y + H - 20, 28, 2, '#c9972f');
  drawGear(X + 10, Y + 50, 6, '#a8822f', time * 0.8);
  drawGear(X + W - 10, Y + 50, 6, '#a8822f', -time * 0.8);
}

function drawAirship() {
  if (airship.launched) return;
  const lift = airship.lift;
  const bx = Math.round(9 * TS + lift * 0.25), by = Math.round(26 * TS - 4 + Math.sin(time * 1.2) * 2 - lift);
  pEllipse(9 * TS, 27 * TS + 8, 30, 3, `rgba(0,0,0,${Math.max(0, 0.25 - lift / 400)})`);
  if (!lift) { pLine(bx - 12, by + 26, bx - 16, 27 * TS + 14, '#2a1a10'); pLine(bx + 12, by + 26, bx + 16, 27 * TS + 14, '#2a1a10'); }
  pLine(bx - 20, by + 8, bx - 12, by + 18, '#2a1a10'); pLine(bx + 20, by + 8, bx + 12, by + 18, '#2a1a10');
  for (let k = 0; k <= 10; k++) { const hh = Math.round(k * 0.8); R(bx - 32 - k, by - hh, 1, hh * 2 + 1, k === 10 ? '#3a2414' : '#5a3a22'); }  // tail fin
  pEllipse(bx, by, 34, 13, '#4a2c18');
  pEllipse(bx, by, 33, 12, '#7a4a30');
  pEllipse(bx, by, 22, 12, '#8a5a38');
  pEllipse(bx, by, 9, 12, '#9a6a42');
  R(bx - 20, by - 9, 10, 1, '#b8845a'); R(bx - 24, by - 7, 4, 1, '#b8845a');                  // shine
  R(bx - 34, by - 1, 68, 2, '#c9972f'); R(bx - 34, by - 1, 68, 1, '#e8c060');
  R(bx - 14, by + 18, 28, 8, '#4a2e18'); R(bx - 14, by + 18, 28, 2, '#c9972f'); R(bx - 14, by + 25, 28, 1, '#2e1a0c');
  for (let i = 0; i < 3; i++) { R(bx - 10 + i * 8, by + 21, 4, 3, '#ffc65a'); R(bx - 10 + i * 8, by + 21, 1, 1, '#fff0b8'); }
  const sp = Math.abs(Math.round(Math.cos(time * (lift ? 40 : 25)) * 7)); R(bx + 34, by - sp, 2, sp * 2 + 1, '#c0c4c8');
  if (!lift) R(bx - 6, by - 6, 12, 1, 'rgba(240,200,120,0.6)');
}

// ---------- the brass brain (pixel sprite) ----------
function drawBrain() {
  const strain = brain === 'strain', broken = brain === 'broken';
  const j = strain ? Math.round(rand(-1, 1)) : 0;
  const X = 23 * TS + j, Y = 12 * TS;
  const body = broken ? '#3e3028' : '#7a4a2a', hi = broken ? '#4e3e32' : '#a0683a', lo = broken ? '#2a201a' : '#4e2c18';
  // shadow + plinth
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(X + 1, Y + 15, 30, 2); ctx.fillRect(X + 3, Y + 17, 26, 1);
  R(X + 1, Y + 12, 30, 4, '#2e1e12'); R(X + 1, Y + 12, 30, 1, '#4a3020');
  // cabinet with bevels
  R(X + 2, Y - 6, 28, 18, body);
  R(X + 2, Y - 6, 1, 18, hi); R(X + 29, Y - 6, 1, 18, lo); R(X + 2, Y + 11, 28, 1, lo);
  R(X + 2, Y - 6, 28, 2, broken ? '#5a4a30' : '#c9972f'); R(X + 3, Y - 6, 26, 1, broken ? '#6a5a3a' : '#e8c060');
  for (const [a, b] of [[4, -3], [27, -3], [4, 9], [27, 9]]) { R(X + a, Y + b, 1, 1, broken ? '#6a5a4a' : '#e8c060'); R(X + a, Y + b + 1, 1, 1, lo); }
  // screen
  R(X + 5, Y - 3, 14, 11, '#24160c'); R(X + 6, Y - 2, 12, 9, broken ? '#141414' : '#0c1810');
  if (!broken) {
    const c = strain ? '#ff6a4a' : '#7aff9a', c2 = strain ? '#a83a2a' : '#3a8a52';
    for (let i = 0; i < 3; i++) { const w = 2 + ((Math.floor(time * 4) + i * 3) % 8); R(X + 7, Y - 1 + i * 3, Math.min(w, 10), 1, i === 2 && Math.floor(time * 3) % 2 ? c2 : c); }
    R(X + 6, Y - 2, 12, 1, 'rgba(255,255,255,0.06)');
  } else { pLine(X + 8, Y - 1, X + 11, Y + 5, '#3a3a3a'); pLine(X + 11, Y + 5, X + 15, Y + 2, '#3a3a3a'); }
  // gauge
  pCircle(X + 24, Y + 1, 4, '#2e1e12'); pCircle(X + 24, Y + 1, 3, broken ? '#8a8270' : '#efe4c4');
  const ga = strain ? -0.3 + Math.sin(time * 40) * 0.25 : broken ? 1.4 : -2.3 + Math.sin(time) * 0.15;
  pLine(X + 24, Y + 1, X + 24 + Math.cos(ga) * 3, Y + 1 + Math.sin(ga) * 3, '#d63a2f'); R(X + 24, Y + 1, 1, 1, '#2e1e12');
  // buttons
  R(X + 21, Y + 7, 2, 2, broken ? '#4a2a22' : Math.floor(time * 2) % 2 ? '#e85a4a' : '#8a2a22');
  R(X + 25, Y + 7, 2, 2, broken ? '#2a3a2a' : '#5ad07a'); R(X + 21, Y + 7, 1, 1, 'rgba(255,255,255,0.3)'); R(X + 25, Y + 7, 1, 1, 'rgba(255,255,255,0.3)');
  // side pipe
  R(X + 28, Y - 13, 3, 8, '#5a4a3a'); R(X + 28, Y - 13, 1, 8, '#7a6a5a'); R(X + 27, Y - 14, 5, 2, broken ? '#5a4a30' : '#c9972f');
  // glass dome
  const cx = X + 16, cy = Y - 7;
  const glass = broken ? '#3a3430' : strain ? (Math.floor(time * 12) % 2 ? '#ff7a5a' : '#d8503a') : '#78c8bc';
  const rim = broken ? '#2a2420' : strain ? '#a83a2a' : '#3a8a80';
  for (let y = -8; y <= 0; y++) { const w = Math.round(9 * Math.sqrt(Math.max(0, 1 - (y / 8.5) ** 2))); R(cx - w, cy + y, w * 2, 1, rim); if (w > 1) R(cx - w + 1, cy + y, w * 2 - 2, 1, glass); }
  if (!broken) {
    ctx.globalAlpha = 0.85;
    for (let i = 0; i < 9; i++) { const yy = Math.round(Math.sin(i * 0.9 + time * (strain ? 14 : 2.5)) * 2); R(cx - 4 + i, cy - 4 + yy, 1, 1, strain ? '#fff0a0' : '#eafff4'); }
    ctx.globalAlpha = 1;
    R(cx - 6, cy - 6, 1, 2, '#ffffff'); R(cx - 5, cy - 7, 2, 1, '#ffffff');    // glare
  } else { pLine(cx - 5, cy - 6, cx - 2, cy - 2, '#140e0a'); pLine(cx - 2, cy - 2, cx + 1, cy - 5, '#140e0a'); pLine(cx + 3, cy - 6, cx + 5, cy - 3, '#140e0a'); }
  R(X + 5, Y - 8, 22, 3, broken ? '#5a4a30' : '#a8822f'); R(X + 5, Y - 8, 22, 1, broken ? '#6a5a3a' : '#e0b860'); R(X + 5, Y - 6, 22, 1, '#6a4e22');
  // antenna
  R(cx - 1, Y - 22, 2, 7, '#5a4a3a'); R(cx - 1, Y - 22, 1, 7, '#7a6a5a');
  const bulb = broken ? '#3a2a20' : strain ? (Math.floor(time * 12) % 2 ? '#ff3a2a' : '#5a1a10') : (Math.floor(time * 2) % 2 ? '#7aff9a' : '#3a8a4a');
  R(cx - 2, Y - 25, 4, 3, bulb); R(cx - 1, Y - 26, 2, 1, bulb); R(cx - 1, Y - 25, 1, 1, broken ? '#4a3a30' : 'rgba(255,255,255,0.7)');
  // out of order note
  if (broken) { R(X + 7, Y + 3, 10, 7, '#f0e6a0'); R(X + 7, Y + 3, 10, 1, '#d8c870'); R(X + 8, Y + 5, 7, 1, '#8a7a4a'); R(X + 8, Y + 7, 5, 1, '#8a7a4a'); }
}

// =====================================================
//  DRAW: CHARACTERS
// =====================================================
function sprite(bmp, pal, x, y, flip) {
  for (let r = 0; r < bmp.length; r++) {
    const row = bmp[r];
    for (let c = 0; c < row.length; c++) {
      const ch = row[c]; if (ch === '.') continue;
      ctx.fillStyle = pal[ch] || '#ff00ff'; ctx.fillRect(flip ? x + 15 - c : x + c, y + r, 1, 1);
    }
  }
}
// pixel-art primitives (row spans, so edges stay crisp)
function pEllipse(cx, cy, rx, ry, col) {
  ctx.fillStyle = col; cx = Math.round(cx); cy = Math.round(cy); rx = Math.max(1, Math.round(rx)); ry = Math.max(0, Math.round(ry));
  for (let y = -ry; y <= ry; y++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y / (ry + 0.5)) ** 2))); if (w > 0) ctx.fillRect(cx - w, cy + y, w * 2, 1); }
}
function pCircle(cx, cy, r, col) { pEllipse(cx, cy, r, r, col); }
function pLine(x0, y0, x1, y1, col) {
  ctx.fillStyle = col; x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) ctx.fillRect(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), 1, 1);
}
function shadow(x, y) { x = Math.round(x); y = Math.round(y); ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(x + 4, y + 14, 8, 1); ctx.fillRect(x + 3, y + 15, 10, 1); ctx.fillRect(x + 4, y + 16, 8, 1); }

function drawDuck(px, py, dir, frame, soot = false, withShadow = true, blink = false) {
  const x = Math.round(px), y = Math.round(py) - 2;
  if (withShadow) shadow(x, y + 2);
  const bob = frame ? -1 : 0;
  const bmp = dir === 'up' ? DUCK.up : dir === 'down' ? DUCK.down : DUCK.side;
  const flip = dir === 'left';
  const pal = soot ? SOOT_PAL : DUCK_PAL;
  sprite(bmp, blink ? { ...pal, K: pal.Y } : pal, x, y + bob, flip);
  const O = soot ? '#a86a2a' : '#ff8c1a';
  if (dir === 'up' || dir === 'down') {
    R(x + 5, y + 14 - (frame === 1 ? 1 : 0), 2, frame === 1 ? 1 : 2, O);
    R(x + 9, y + 14 - (frame === 2 ? 1 : 0), 2, frame === 2 ? 1 : 2, O);
  } else {
    const a = frame === 1 ? 1 : frame === 2 ? -1 : 0;
    R((flip ? x + 8 : x + 6) + a, y + 14, 2, 2, O);
    R((flip ? x + 5 : x + 9) - a, y + 14, 2, 2, O);
  }
}

function drawPerson(n, x, y, bob = 0, dir = 'down') {
  if (n.cat) {
    const blink = Math.floor(time * 2 + 3) % 7 === 0;
    R(x + 3, y + 8, 10, 7, '#7a8086'); R(x + 4, y + 4 + bob, 8, 6, '#8a9096');
    R(x + 4, y + 2 + bob, 2, 2, '#8a9096'); R(x + 10, y + 2 + bob, 2, 2, '#8a9096');
    if (!blink) { R(x + 5, y + 6 + bob, 2, 1, '#7fd0ff'); R(x + 9, y + 6 + bob, 2, 1, '#7fd0ff'); }
    R(x + 8, y - 1 + bob, 1, 3, '#55585c'); R(x + 8, y - 2 + bob, 1, 1, '#ff5a4a');
    const tail = Math.sin(time * 4) > 0 ? 1 : 0;
    R(x + 13, y + 9, 2, 1, '#7a8086'); R(x + 14 + tail, y + 7, 1, 2, '#7a8086');
    return;
  }
  const bmp = dir === 'up' ? PERSON.up : dir === 'down' ? PERSON.down : PERSON.side;
  const flip = dir === 'left';
  sprite(bmp, n.pal, x, y + bob, flip);
  const a = n.acc, yb = y + bob;
  if (a === 'tophat') { R(x + 6, yb - 4, 4, 5, n.pal.H); R(x + 6, yb, 4, 1, '#e8c060'); }
  if (a === 'hood') { R(x + 4, yb + 1, 1, 6, n.pal.H); R(x + 11, yb + 1, 1, 6, n.pal.H); R(x + 5, yb, 6, 1, n.pal.H); }
  if (dir !== 'down') return;
  if (a === 'goggles') { R(x + 6, yb + 1, 2, 2, '#7fd0ff'); R(x + 9, yb + 1, 2, 2, '#7fd0ff'); R(x + 8, yb + 2, 1, 1, '#c9972f'); }
  if (a === 'monocle') { R(x + 9, yb + 3, 3, 3, '#e0b04a'); R(x + 10, yb + 4, 1, 1, '#bfe6ff'); R(x + 11, yb + 6, 1, 3, '#e0b04a'); }
  if (a === 'apron') { R(x + 5, yb + 9, 6, 4, '#4a3a30'); R(x + 5, yb + 9, 6, 1, '#6a5a50'); }
  if (a === 'wrench') { R(x + 13, yb + 7, 1, 6, '#b0b4b8'); R(x + 12, yb + 7, 3, 1, '#b0b4b8'); }
  if (a === 'aviator') { R(x + 6, yb + 1, 2, 2, '#ffd27a'); R(x + 9, yb + 1, 2, 2, '#ffd27a'); R(x + 5, yb + 7, 6, 1, '#d63a2f'); R(x + 11, yb + 8, 2, 2 + (Math.floor(time * 3) % 2), '#d63a2f'); }
  if (a === 'tophat') for (let i = 0; i < 4; i++) R(x + 6 + i, yb + 8 + i, 1, 1, '#d63a2f');
  if (a === 'pizza') { R(x + 11, yb + 9, 5, 2, '#e8b860'); R(x + 12, yb + 8, 3, 1, '#c8682a'); }
}
function drawNPC(n) {
  if (n.hidden) return;
  const x = n.x * TS, y = n.y * TS - 2;
  shadow(x, y + 2);
  const talking = dialog && dialog.who === n && dialog.shown < itemText(curItem()).length;
  const bob = talking ? (Math.floor(time * 8) % 2 ? -1 : 0) : (Math.floor(time * 1.4 + n.x) % 4 === 0 ? -1 : 0);
  drawPerson(n, x, y, bob, n.face || 'down');
}

const TREE = [
  '......KKKK......',
  '....KKLLMMKK....',
  '...KLHLMMMMMK...',
  '..KLHLMMMMMDDK..',
  '..KLLMMMMVMDDK..',
  '.KMLMMMMMMMMDDK.',
  '.KMMMMMMMMMDDDK.',
  'KMMLMMMMMMMMDDDK',
  'KMLHLMMMMMMDDDDK',
  'KMMLMMMMVMMMDDDK',
  'KMMMMMMMMMMDDDDK',
  '.KMMMMMMMMDDDDK.',
  '.KDMMMMMMDDDDDK.',
  '..KDDMMDDDDDDK..',
  '...KKDDDKDDKK...',
  '.....KKtTKK.....',
  '......tTT.......',
  '......tTT.......',
  '......tTT.......',
  '......tTT.......',
  '.....ttTTt......',
];
const TREE_PAL = { K: '#3a1a0c', D: '#7a3e1c', M: '#9a5a2c', L: '#c8803a', H: '#e8a858', V: '#5f8a78', T: '#5a3a20', t: '#3a2414' };
function drawDecor(d) {
  const X = d.x * TS, Y = d.y * TS;
  if (d.kind === 'lamp') {
    const lit = lampLit(d);
    shadow(X, Y);
    R(X + 7, Y + 2, 2, 13, '#221e1c'); R(X + 5, Y + 13, 6, 3, '#2e2824');
    R(X + 4, Y - 4, 8, 7, '#2e2824');
    R(X + 5, Y - 3, 6, 5, lit ? '#ffd27a' : '#3e3832');
    if (lit) R(X + 6, Y - 2, 2, 2, '#fff4cc');
    R(X + 3, Y - 6, 10, 2, '#a8822f'); R(X + 7, Y - 8, 2, 2, '#a8822f');
  } else if (d.kind === 'vent') {
    R(X + 2, Y + 4, 12, 10, '#221e1c');
    for (let i = 0; i < 4; i++) R(X + 3, Y + 5 + i * 2, 10, 1, '#4a423a');
    R(X + 1, Y + 3, 14, 1, '#a8822f');
    smokeFx(X + 8, Y + 4, d.x * 0.13, '#d8dee2', 0.8);
  } else if (d.kind === 'crate') {
    shadow(X, Y);
    R(X + 1, Y + 3, 14, 12, '#7a5432'); R(X + 1, Y + 3, 14, 1, '#9a7448');
    R(X + 1, Y + 3, 1, 12, '#5a3a20'); R(X + 14, Y + 3, 1, 12, '#5a3a20'); R(X + 1, Y + 14, 14, 1, '#5a3a20');
    for (let i = 0; i < 12; i++) R(X + 2 + i, Y + 3 + i, 1, 1, '#5a3a20');
  } else if (d.kind === 'tree') {
    shadow(X, Y);
    const sway = Math.round(Math.sin(time * 0.8 + d.x) * 0.7);
    for (let r = 0; r < TREE.length; r++) {
      const off = r < 15 ? sway : 0, row = TREE[r];
      for (let c = 0; c < 16; c++) { const ch = row[c]; if (ch !== '.') R(X + c + off, Y - 7 + r, 1, 1, TREE_PAL[ch]); }
    }
  } else if (d.kind === 'sign') {
    shadow(X, Y);
    R(X + 7, Y + 6, 2, 10, '#3a2414');
    R(X + 2, Y + 1, 12, 8, '#7a5432'); R(X + 2, Y + 1, 12, 1, '#a8822f'); R(X + 2, Y + 8, 12, 1, '#4a2e18');
    R(X + 4, Y + 3, 8, 1, '#3a2414'); R(X + 4, Y + 5, 6, 1, '#3a2414');
  } else if (d.kind === 'statue') {
    if (d.x !== 21 || d.y !== 9) return;
    const cx = 22 * TS, cy = 10 * TS;
    pEllipse(cx, cy + 14, 14, 3, 'rgba(0,0,0,0.3)');
    R(cx - 13, cy + 2, 26, 12, '#4e4238'); R(cx - 15, cy + 12, 30, 4, '#3a3028'); R(cx - 13, cy + 2, 26, 2, '#6a5a4a');
    R(cx - 5, cy + 6, 10, 4, '#a8822f');
    drawGear(cx, cy - 10, 11, '#b8903f', time * 0.25);
    drawGear(cx, cy - 10, 5, '#d8b060', -time * 0.5);
    smokeFx(cx - 10, cy, 0.3, '#d8dee2', 0.6);
  } else if (d.kind === 'brain') {
    if (d.x !== 23) return;
    drawBrain();
  }
}

function drawEmote(type, x, y) {
  const icon = EMOTES[type]; if (!icon) return;
  const b = Math.round(Math.sin(time * 6) * 1);
  y += b;
  R(x - 1, y - 1, 11, 10, '#2a1a10'); R(x, y, 9, 8, '#fff6e0'); R(x + 3, y + 8, 3, 1, '#fff6e0'); R(x + 4, y + 9, 1, 1, '#2a1a10');
  for (let r = 0; r < icon.length; r++) for (let c = 0; c < icon[r].length; c++) {
    const ch = icon[r][c]; if (ch !== '.') R(x + 1 + c, y + 1 + r, 1, 1, EMOTE_PAL[ch]);
  }
}
function drawMarkersAndEmotes() {
  const speaking = dialog ? (dialog.who && dialog.who.id ? dialog.who.id : (dialog.name === '...' ? 'pip' : null)) : null;
  const lineEmote = dialog && !journal ? itemEmote(curItem()) : null;
  const headY = n => n.y * TS - 2 - (n.acc === 'tophat' ? 20 : 15);
  for (const n of NPCS) {
    if (n.hidden) continue;
    const under = state !== 'title' && state !== 'end' && Math.round(player.x / TS) === n.x && Math.round(player.y / TS) === n.y - 1;
    const x = n.x * TS + 4 + (under ? 11 : 0), y = headY(n) + (under ? 7 : 0);
    let e = emotes.get(n.id);
    if (speaking === n.id && lineEmote) e = { type: lineEmote };
    if (e) { drawEmote(e.type, x, y); continue; }
    if (dialog || state !== 'play') continue;
    const isQuest = n.quest === stage, isNote = n.note && !notes.has(n.note);
    const near = Math.abs(n.x - player.tx) + Math.abs(n.y - player.ty) <= 9;
    if (isQuest) drawEmote('bang', x, y);
    else if (isNote && near) drawEmote('q', x, y);
  }
  let pe = emotes.get('pip');
  if (speaking === 'pip' && lineEmote) pe = { type: lineEmote };
  if (pe && state !== 'title' && state !== 'end') drawEmote(pe.type, Math.round(player.x) + 4, Math.round(player.y) - 17);
  const be = emotes.get('brain');
  if (be) drawEmote(be.type, BRAIN_X - 4, BRAIN_Y - 34);
  else if (brain === 'fixed' && !notes.has(SMALL_NOTE.note) && state === 'play' && !dialog) drawEmote('q', BRAIN_X - 4, BRAIN_Y - 34);
}

function drawLabels() {
  ctx.font = `5px ${FONT}`; ctx.textBaseline = 'top'; ctx.textAlign = 'center';
  for (const b of BUILDINGS) {
    const fx = b.door, fy = b.y + b.h;
    if (Math.abs(player.tx - fx) + Math.abs(player.ty - fy) > 4) continue;
    const X = fx * TS + 8 + (b.tower ? 8 : 0), Y = (b.y + b.h) * TS - (b.tower ? 32 : 26);
    const w = ctx.measureText(b.name).width + 8;
    R(X - w / 2, Y - 2, w, 9, 'rgba(20,14,10,0.85)'); R(X - w / 2, Y + 7, w, 1, '#a8822f');
    ctx.fillStyle = '#ffe9b0'; ctx.fillText(b.name, X, Y);
  }
  ctx.textAlign = 'left';
}

function drawParticles(additive) {
  for (const p of particles) {
    if ((p.kind === 'spark') !== additive) continue;
    if (p.kind === 'gear' || p.kind === 'fly') drawGear(p.x, p.y, p.kind === 'fly' ? 3 : p.size, p.col, p.rot);
    else if (p.kind === 'smoke') { ctx.globalAlpha = Math.min(0.6, p.life * 0.5); pCircle(p.x, p.y, p.size, p.col); ctx.globalAlpha = 1; }
    else if (p.kind === 'paper') { const px = Math.round(p.x), py = Math.round(p.y), flip = Math.sin(p.rot) > 0; R(px - 2, py - 1, flip ? 4 : 3, flip ? 3 : 4, p.col); R(px - 1, py, 2, 1, '#8a7a5a'); }
    else if (p.kind === 'confetti') { ctx.globalAlpha = Math.min(1, p.life); R(Math.round(p.x), Math.round(p.y), Math.sin(p.rot) > 0 ? 2 : 1, Math.sin(p.rot) > 0 ? 1 : 2, p.col); ctx.globalAlpha = 1; }
    else if (p.kind === 'spark') { ctx.globalAlpha = Math.min(1, p.life * 2); R(p.x, p.y, 1, 1, p.col); ctx.globalAlpha = 1; }
  }
}

// =====================================================
//  LIGHTING
// =====================================================
function lightAt(x, y, r, a = 1) {
  const sx = x - cam.x, sy = y - cam.y;
  if (sx < -r || sy < -r || sx > VW + r || sy > VH + r) return;
  const g = lctx.createRadialGradient(sx, sy, 0, sx, sy, r);
  g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(1, 'rgba(0,0,0,0)');
  lctx.fillStyle = g; lctx.beginPath(); lctx.arc(sx, sy, r, 0, Math.PI * 2); lctx.fill();
}
function warmGlow(x, y, r, a, col = '255,190,100') {
  const sx = x - cam.x, sy = y - cam.y;
  if (sx < -r || sy < -r || sx > VW + r || sy > VH + r || a <= 0.001) return;
  const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
  g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
}
function drawLighting() {
  const night = Math.min(1, env.dark / 0.6);
  if (env.dark > 0.005) {
    lctx.globalCompositeOperation = 'source-over';
    lctx.clearRect(0, 0, VW, VH);
    lctx.fillStyle = rgbStr(env.tint, env.dark); lctx.fillRect(0, 0, VW, VH);
    lctx.globalCompositeOperation = 'destination-out';
    const flick = 1 + Math.sin(time * 9) * 0.03;
    if (state !== 'title' && state !== 'end') lightAt(player.x + 8, player.y + 6, 46 * flick, 0.95);
    for (const d of LAMPS) if (lampLit(d)) lightAt(d.x * TS + 8, d.y * TS - 1, 38, 0.9);
    for (const b of BUILDINGS) {
      if (b.tower) continue;
      const wallY = b.y * TS + (b.h >= 6 ? 40 : 32) - 4;
      for (let xx = b.x * TS + 5; xx + 10 < (b.x + b.w) * TS; xx += 20) {
        if (Math.abs(xx + 5 - (b.door * TS + 8)) < 14) continue;
        if (windowLit(xx, b.y * TS)) lightAt(xx + 5, wallY + 11, 16, 0.7);
      }
      if (b.big) lightAt(b.x * TS + 12, b.y * TS - 18, 26, 0.8);
    }
    if (!airship.launched) lightAt(9 * TS + airship.lift * 0.25, 26 * TS + 18 - airship.lift, 26, 0.7);
    lightAt(BRAIN_X, BRAIN_Y - 6, brain === 'strain' ? 40 : brain === 'broken' ? 10 : 22, 0.8);
    lightAt(22 * TS, 9 * TS, 22, 0.5);
    if (lode.lit) lightAt(GEM.x, GEM.y, 70, 1);
    for (const n of NPCS) if (n.quest === stage && !n.hidden) lightAt(n.x * TS + 8, n.y * TS + 4, 20, 0.5);
    for (const p of particles) if (p.kind === 'spark' || p.kind === 'fly') lightAt(p.x, p.y, p.kind === 'fly' ? 14 : 6, 0.6);
    ctx.drawImage(lightC, 0, 0);
  }

  ctx.globalCompositeOperation = 'lighter';
  if (state !== 'title' && state !== 'end') warmGlow(player.x + 8, player.y + 6, 26, 0.1 * night);
  for (const d of LAMPS) if (lampLit(d)) warmGlow(d.x * TS + 8, d.y * TS - 1, 22, 0.16 * night);
  if (brain === 'strain') warmGlow(BRAIN_X, BRAIN_Y - 6, 34, 0.25, '255,90,60');
  if (brain === 'fixed' || brain === 'idle') warmGlow(BRAIN_X, BRAIN_Y - 8, 16, 0.12, '120,255,200');
  if (lode.lit) {
    warmGlow(GEM.x, GEM.y, 60 + Math.sin(time * 3) * 6, 0.35, '255,210,110');
    if (lode.wave >= 0 && lode.wave < 900) {
      const sx = GEM.x - cam.x, sy = GEM.y - cam.y;
      ctx.fillStyle = `rgba(255,220,140,${Math.max(0, 0.5 - lode.wave / 1800)})`;
      const n = Math.max(24, Math.round(lode.wave * 1.2));
      for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2; ctx.fillRect(Math.round(sx + Math.cos(a) * lode.wave) - 1, Math.round(sy + Math.sin(a) * lode.wave) - 1, 3, 3); }
    }
  }
  ctx.translate(-cam.x, -cam.y); drawParticles(true); ctx.translate(cam.x, cam.y);
  for (const m of motes) {
    const x = ((m.x + Math.sin(time * 0.5 + m.p) * 10 - cam.x * 0.2 * m.s) % VW + VW) % VW;
    const y = ((m.y + Math.cos(time * 0.4 + m.p) * 8 - time * 3 * m.s - cam.y * 0.2 * m.s) % VH + VH) % VH;
    if (night > 0.4) { const tw = (Math.sin(time * 2 + m.p * 3) + 1) / 2; ctx.globalAlpha = tw * night * 0.45; circ(x, y, 1.3, '#ffd27a'); ctx.globalAlpha = tw * night * 0.12; circ(x, y, 2, '#ffb850'); }
    else { ctx.globalAlpha = 0.18 * m.s; R(x, y, 1, 1, '#fff6e0'); }
    ctx.globalAlpha = 1;
  }
  ctx.globalCompositeOperation = 'source-over';
  if (lode.lit) {
    const sun = Math.min(1, 1 - env.dark / 0.3);
    ctx.globalCompositeOperation = 'overlay'; ctx.fillStyle = `rgba(255,190,110,${0.32 * sun})`; ctx.fillRect(0, 0, VW, VH);
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(60,36,12,${0.12 * sun})`; ctx.fillRect(0, 0, VW, VH);
    ctx.globalCompositeOperation = 'source-over';
  }
  const v = ctx.createRadialGradient(VW / 2, VH / 2, VH * 0.35, VW / 2, VH / 2, VW * 0.65);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(6,2,12,${0.2 + 0.25 * night})`);
  ctx.fillStyle = v; ctx.fillRect(0, 0, VW, VH);
}

// =====================================================
//  UI
// =====================================================
function panel(x, y, w, h, bg = 'rgba(22,14,10,0.92)') {
  x = Math.round(x); y = Math.round(y);
  R(x, y, w, h, bg);
  R(x, y, w, 1, '#a8822f'); R(x, y + h - 1, w, 1, '#a8822f'); R(x, y, 1, h, '#a8822f'); R(x + w - 1, y, 1, h, '#a8822f');
  R(x + 1, y + 1, 1, 1, '#f0d070'); R(x + w - 2, y + 1, 1, 1, '#f0d070'); R(x + 1, y + h - 2, 1, 1, '#f0d070'); R(x + w - 2, y + h - 2, 1, 1, '#f0d070');
}
function wrap(text, maxW) {
  const words = text.split(' '); const lines = []; let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}
function text(t, x, y, size, col, align = 'left') {
  ctx.font = `${size}px ${FONT}`; ctx.textBaseline = 'top'; ctx.textAlign = align;
  ctx.fillStyle = col; ctx.fillText(t, x, y); ctx.textAlign = 'left';
}
function centerText(t, y, size, col) {
  ctx.font = `${size}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillText(t, VW / 2 + 1, y + 1);
  ctx.fillStyle = col; ctx.fillText(t, VW / 2, y);
  ctx.textAlign = 'left';
}


function drawHUD() {
  panel(4, 4, 178, 30);
  text('objective', 9, 8, 5, '#d8a84a');
  ctx.font = `5px ${FONT}`;
  wrap(STAGES[stage].obj, 166).slice(0, 2).forEach((l, i) => text(l, 9, 16 + i * 8, 5, '#fff0d0'));
  panel(4, 37, 86, 15);
  for (let i = 0; i < 6; i++) drawGear(13 + i * 14, 44, 4, i < stage ? '#f0c050' : '#4a3e30', i < stage ? time * 2 : 0);
  panel(93, 37, 40, 15);
  text(`? ${notes.size}/${NOTE_COUNT}`, 98, 42, 5, '#bcd8ff');
  const tstr = STAGES[stage].time;
  ctx.font = `5px ${FONT}`;
  const tw = ctx.measureText(tstr).width;
  panel(VW - tw - 14, 4, tw + 10, 13);
  text(tstr, VW - tw - 9, 8, 5, '#ffe9b0');
  if (muted) text('muted', VW - 6, 21, 5, 'rgba(255,233,176,0.5)', 'right');
  if (!dialog && !term && !journal && !player.moving) {
    const [dx, dy] = DIRS[player.dir];
    const fx = player.tx + dx, fy = player.ty + dy;
    const n = npcAt(fx, fy), d = decorAt(fx, fy);
    const door = BUILDINGS.some(b => fy === b.y + b.h - 1 && (fx === b.door || (b.tower && fx === b.door + 1)));
    const verb = n ? 'talk' : d && d.kind === 'brain' ? 'use' : d && d.kind !== 'tree' && d.kind !== 'crate' && d.kind !== 'vent' ? 'look' : door ? 'knock' : null;
    if (verb) { const s = `space: ${verb}`; ctx.font = `5px ${FONT}`; const w = ctx.measureText(s).width + 10; panel(VW / 2 - w / 2, VH - 16, w, 12); text(s, VW / 2, VH - 12, 5, '#ffe9b0', 'center'); }
    else text('j journal  q quack', VW - 6, VH - 9, 5, 'rgba(255,233,176,0.5)', 'right');
  }
}

function drawPortrait(who, x, y) {
  panel(x, y, 36, 36, 'rgba(40,28,20,0.95)');
  ctx.save(); ctx.beginPath(); ctx.rect(x + 1, y + 1, 34, 34); ctx.clip();
  const talking = dialog && dialog.shown < itemText(curItem()).length;
  ctx.translate(x + 2, y + 4); ctx.scale(2, 2);
  if (who === 'pip') drawDuck(0, 2, 'down', 0, player.soot, false);
  else drawPerson(who, 0, who.acc === 'tophat' ? 3 : 1, talking && Math.floor(time * 8) % 2 ? -1 : 0, 'down');
  ctx.restore();
}

function drawDialog() {
  if (!dialog) return;
  const it = curItem(), line = itemText(it), isQuiz = typeof it !== 'string';
  const x = 6, y = VH - 54, w = VW - 12, h = 48;
  const who = dialog.who;
  panel(x, y, w, h);
  ctx.font = `5px ${FONT}`;
  const nw = ctx.measureText(dialog.name).width + 12;
  panel(x + 6, y - 9, nw, 11);
  text(dialog.name, x + 12, y - 6, 5, (who && who.color) || '#e8b850');
  if (who) drawPortrait(who, x + 6, y + 6);
  const tx = x + (who ? 48 : 9), tw = w - (who ? 56 : 18);
  ctx.font = `6px ${FONT}`;
  const wrapped = wrap(line, tw);
  let budget = Math.floor(dialog.shown);
  wrapped.forEach((l, i) => {
    if (budget <= 0) return;
    text(l.slice(0, budget), tx, y + 9 + i * 11, 6, isQuiz ? '#ffe9a0' : line.startsWith('(') ? '#c8b8a0' : '#fff3d6');
    budget -= l.length + 1;
  });
  if (isQuiz && dialog.shown >= line.length) {
    const opts = it.quiz.opts;
    ctx.font = `5px ${FONT}`;
    const ow = Math.max(...opts.map(o => ctx.measureText(o).width)) + 26;
    const oh = opts.length * 11 + 8, ox = VW - ow - 8, oy = y - oh - 12;
    panel(ox, oy, ow, oh);
    opts.forEach((o, i) => {
      const sel = i === dialog.sel;
      if (sel) R(ox + 3, oy + 4 + i * 11, ow - 6, 10, 'rgba(232,184,80,0.18)');
      text((sel ? '> ' : '  ') + o, ox + 7, oy + 7 + i * 11, 5, sel ? '#ffe9a0' : '#c8b8a0');
    });
  } else if (dialog.shown >= line.length && Math.floor(time * 3) % 2) {
    R(x + w - 13, y + h - 9, 5, 1, '#e8b850'); R(x + w - 12, y + h - 8, 3, 1, '#e8b850'); R(x + w - 11, y + h - 7, 1, 1, '#e8b850');
  }
}

function drawTerminal() {
  if (!term) return;
  const x = 24, y = 14, w = VW - 48, h = 104;
  const j = brain === 'strain' ? Math.round(rand(-1, 1)) : 0;
  ctx.save(); ctx.translate(j, j);
  R(x - 2, y - 2, w + 4, h + 4, '#2a1a10');
  panel(x, y, w, h, 'rgba(8,14,10,0.96)');
  R(x + 1, y + 1, w - 2, 9, '#7a4a2a'); R(x + 1, y + 10, w - 2, 1, '#a8822f');
  text(term.title, x + 6, y + 3, 5, '#ffe9b0');
  R(x + w - 10, y + 3, 4, 4, brain === 'strain' ? (Math.floor(time * 10) % 2 ? '#ff3a2a' : '#5a1a10') : '#7aff9a'); R(x + w - 10, y + 3, 1, 1, 'rgba(255,255,255,0.6)');
  // scanlines
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; for (let yy = y + 12; yy < y + h - 1; yy += 2) ctx.fillRect(x + 1, yy, w - 2, 1);
  ctx.font = `5px ${FONT}`;
  const col = { duck: '#fff3d6', ai: '#7aff9a', err: '#ff5a4a', code: '#ffd27a' };
  const rows = [];
  for (const l of term.lines) {
    const ws = wrap(l.text, w - 14); let b = Math.floor(l.shown);
    for (const s of ws) { if (b <= 0) break; rows.push({ t: s.slice(0, b), c: col[l.kind] }); b -= s.length + 1; }
  }
  const maxRows = term.choice ? 5 : 10;
  const vis = rows.slice(-maxRows);
  vis.forEach((r, i) => {
    const gl = brain === 'strain' && Math.random() < 0.08 ? Math.round(rand(-2, 2)) : 0;
    text(r.t, x + 7 + gl, y + 15 + i * 8, 5, r.c);
  });
  const last = vis[vis.length - 1];
  if (!term.choice && Math.floor(time * 3) % 2) { const cw = last ? ctx.measureText(last.t).width : 0; R(x + 8 + cw, y + 15 + Math.max(0, vis.length - 1) * 8, 4, 5, '#7aff9a'); }
  if (term.choice) {
    const cy = y + 15 + vis.length * 8 + 4;
    R(x + 6, cy - 2, w - 12, 1, 'rgba(122,255,154,0.3)');
    text('what do you type?', x + 7, cy + 2, 5, '#a8c8a8');
    term.choice.opts.forEach((o, i) => {
      const sel = i === term.choice.sel;
      if (sel) R(x + 5, cy + 10 + i * 9, w - 10, 8, 'rgba(122,255,154,0.12)');
      text((sel ? '> ' : '  ') + o, x + 7, cy + 11 + i * 9, 5, sel ? '#fff3d6' : '#8aa88a');
    });
  }
  ctx.restore();
}


function drawToast() {
  if (!toast) return;
  ctx.font = `7px ${FONT}`;
  const tw = ctx.measureText(toast.text).width; ctx.font = `5px ${FONT}`;
  const w = Math.max(tw, ctx.measureText(toast.sub).width) + 30;
  const yy = 52 - Math.max(0, (toast.t - (toast.note ? 2.1 : 2.7)) * 40);
  panel(VW / 2 - w / 2, yy, w, 22);
  if (toast.note) drawEmote('q', VW / 2 - w / 2 + 4, yy + 6); else drawGear(VW / 2 - w / 2 + 11, yy + 9, 4, '#f0c050', time * 3);
  text(toast.text, VW / 2 + 5, yy + 4, 7, '#ffe9b0', 'center');
  text(toast.sub, VW / 2 + 5, yy + 14, 5, '#b8a890', 'center');
}

function drawJournal() {
  if (!journal) return;
  const x = 14, y = 10, w = VW - 28, h = VH - 20;
  R(0, 0, VW, VH, 'rgba(6,3,10,0.6)');
  panel(x, y, w, h, 'rgba(36,26,18,0.97)');
  R(x + 1, y + 1, w - 2, 14, '#4a3222'); R(x + 1, y + 15, w - 2, 1, '#a8822f');
  text("pip's field notes", x + 8, y + 5, 5, '#ffe9b0');
  const tabs = ['gears ' + Math.min(stage, 6) + '/6', 'notes ' + notes.size + '/' + NOTE_COUNT];
  ctx.font = `5px ${FONT}`;
  let tx = x + w - 6;
  for (let i = 1; i >= 0; i--) {
    const tw = ctx.measureText(tabs[i]).width + 10; tx -= tw;
    R(tx, y + 3, tw - 2, 10, i === journal.tab ? '#a8822f' : '#2a1c12');
    text(tabs[i], tx + 4, y + 6, 5, i === journal.tab ? '#2a1a10' : '#c8b8a0');
    tx -= 2;
  }
  const lines = [];
  ctx.font = `5px ${FONT}`;
  const bw = w - 40;
  if (journal.tab === 0) {
    GEAR_NOTES.forEach((g, i) => {
      const got = i < stage;
      lines.push({ t: g.t, c: got ? '#f0c050' : '#6a5a4a', gear: got ? 1 : 0, ind: 0 });
      (got ? wrap(g.s, bw) : ['...']).forEach(s => lines.push({ t: s, c: got ? '#fff0d0' : '#6a5a4a', ind: 1 }));
      lines.push({ t: '', ind: 0 });
    });
  } else {
    [...NPCS.filter(n => n.note), SMALL_NOTE].forEach(n => {
      const got = notes.has(n.note);
      lines.push({ t: got ? n.note : '???', c: got ? '#bcd8ff' : '#6a5a4a', q: 1, ind: 0, from: got ? '- ' + n.name : '' });
      (got ? wrap(n.sum, bw) : ['find someone with a ? over their head']).forEach(s => lines.push({ t: s, c: got ? '#fff0d0' : '#5a4a3a', ind: 1 }));
      lines.push({ t: '', ind: 0 });
    });
  }
  const visN = 16;
  journal.scroll = Math.min(journal.scroll, Math.max(0, lines.length - visN));
  lines.slice(journal.scroll, journal.scroll + visN).forEach((l, i) => {
    const ly = y + 21 + i * 8;
    if (l.gear !== undefined && !l.ind) drawGear(x + 13, ly + 2.5, 2.5, l.gear ? '#f0c050' : '#3e3428', 0);
    if (l.q) text('?', x + 10, ly, 5, l.c);
    if (l.t) text(l.t, l.ind ? x + 26 : x + 22, ly, 5, l.c);
    if (l.from) { ctx.font = `5px ${FONT}`; text(l.from, x + 26 + ctx.measureText(l.t).width, ly, 5, '#8a7a6a'); }
  });
  if (lines.length > visN) {
    const th = h - 34, sh = Math.max(10, th * visN / lines.length), sy = y + 19 + (th - sh) * journal.scroll / Math.max(1, lines.length - visN);
    R(x + w - 6, y + 19, 2, th, '#2a1c12'); R(x + w - 6, sy, 2, sh, '#a8822f');
  }
  text('<- -> switch   up/down scroll   j close', VW / 2, y + h - 9, 5, '#8a7a6a', 'center');
}

function drawTitle() {
  R(0, 0, VW, VH, 'rgba(8,4,14,0.5)');
  const g = Math.sin(time * 1.2) * 0.5 + 0.5;
  centerText('LODESTONE', 24, 20, `rgb(240,${180 + g * 30 | 0},${70 + g * 30 | 0})`);
  centerText('a little hackathon story', 52, 6, '#e8d8c0');
  ctx.save(); ctx.translate(VW / 2 - 24, 66 + Math.round(Math.sin(time * 2) * 2)); ctx.scale(3, 3);
  drawDuck(0, 2, 'down', 0, false, true, player.blink < 0); ctx.restore();
  if (Math.floor(time * 2) % 2) centerText('press enter', 130, 7, '#fff3d6');
  centerText('arrows/wasd walk - space talk - j journal - m mute', 148, 5, '#b8a890');
  centerText('sbuhacks 2026 - steel & steam', 160, 5, '#8a7a6a');
}

function drawEnd() {
  R(0, 0, VW, VH, 'rgba(8,4,14,0.16)');
  const band = ctx.createLinearGradient(0, 0, VW, 0);
  band.addColorStop(0, 'rgba(8,4,14,0)'); band.addColorStop(0.22, 'rgba(8,4,14,0.5)'); band.addColorStop(0.78, 'rgba(8,4,14,0.5)'); band.addColorStop(1, 'rgba(8,4,14,0)');
  ctx.fillStyle = band; ctx.fillRect(0, 0, VW, VH);
  const rows = [
    { t: 'project submitted.', s: 10, c: '#f0c050', g: 16 },
    { t: 'sun 8:42 am. 18 minutes to spare', s: 5, c: '#e8d8c0', g: 20 },
    { t: 'idea > plan > build > debug > deploy > submit', s: 5, c: '#ffe9b0', g: 10 },
    { t: 'that\'s how real projects get made', s: 5, c: '#c8b8a0', g: 34 },
    { gears: true, g: 34 },
  ];
  for (const [name, what] of CREDITS) { rows.push({ t: name, s: 6, c: '#f0c050', g: 10 }); rows.push({ t: what, s: 5, c: '#e8d8c0', g: 22 }); }
  rows.push({ t: `workshop notes found: ${notes.size}/${NOTE_COUNT}`, s: 5, c: notes.size === NOTE_COUNT ? '#bcd8ff' : '#8a9aaa', g: 34 });
  rows.push({ t: 'made at sbuhacks 2026', s: 5, c: '#b8a890', g: 10 });
  rows.push({ t: 'by nick', s: 7, c: '#ffe9b0', g: 34 });
  rows.push({ t: 'make something small.', s: 6, c: '#fff3d6', g: 12 });
  rows.push({ t: 'finish it. share it.', s: 6, c: '#fff3d6', g: 40 });
  rows.push({ duck: true, g: 40 });
  const total = rows.reduce((a, r) => a + r.g, 0);
  const startY = VH - credits.t * 16;
  const endStop = VH / 2 - total + 60;
  const y0 = Math.max(startY, endStop);
  if (startY <= endStop) credits.done = true;
  let y = y0;
  for (const r of rows) {
    if (y > -20 && y < VH + 10) {
      if (r.gears) ['idea', 'plan', 'build', 'debug', 'deploy', 'submit'].forEach((n, i) => { drawGear(VW / 2 - 100 + i * 40, y + 6, 6, '#f0c050', time * (i % 2 ? -1.5 : 1.5)); text(n, VW / 2 - 100 + i * 40, y + 16, 5, '#fff0d0', 'center'); });
      else if (r.duck) { ctx.save(); ctx.translate(VW / 2 - 8, y + Math.round(Math.abs(Math.sin(time * 6)) * -3)); drawDuck(0, 2, 'down', Math.floor(time * 6) % 3); ctx.restore(); drawEmote('heart', VW / 2 - 4, y - 16); }
      else centerText(r.t, y, r.s, r.c);
    }
    y += r.g;
  }
  if (credits.done && Math.floor(time * 2) % 2) centerText('press enter to play again', VH - 14, 5, '#fff3d6');
}

// =====================================================
//  RENDER LOOP
// =====================================================
function render(dt) {
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  ctx.imageSmoothingEnabled = false;

  let tx, ty, k = 1;
  if (state === 'title' || state === 'end') {
    tx = 180 + Math.sin(time * 0.15) * 160; ty = 60 + Math.sin(time * 0.1) * 40;
  } else if (camTarget) {
    tx = camTarget.x - VW / 2; ty = camTarget.y - VH / 2; k = Math.min(1, dt * 2.2);
  } else {
    tx = player.x + 8 - VW / 2; ty = player.y + 8 - VH / 2;
    k = Math.min(1, dt * 10);
  }
  tx = Math.max(0, Math.min(MW * TS - VW, tx)); ty = Math.max(-60, Math.min(MH * TS - VH, ty));
  cam.fx = lerp(cam.fx, tx, k); cam.fy = lerp(cam.fy, ty, k);
  cam.x = Math.round(cam.fx); cam.y = Math.round(cam.fy);
  if (shake > 0) { cam.x += Math.round(rand(-shake, shake)); cam.y += Math.round(rand(-shake, shake)); }

  drawSky();
  ctx.save(); ctx.translate(-cam.x, -cam.y);
  drawSkyline();
  const x0 = Math.max(0, Math.floor(cam.x / TS)), y0 = Math.max(0, Math.floor(cam.y / TS));
  const x1 = Math.min(MW - 1, Math.ceil((cam.x + VW) / TS)), y1 = Math.min(MH - 1, Math.ceil((cam.y + VH) / TS));
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) drawTile(x, y);
  if (!airship.launching) drawAirship();
  for (const b of BUILDINGS) drawBuilding(b);

  const list = [];
  for (const d of DECOR) list.push({ y: d.y * TS + (d.kind === 'statue' ? 16 : 0), f: () => drawDecor(d) });
  for (const n of NPCS) list.push({ y: n.y * TS, f: () => drawNPC(n) });
  if (state !== 'title' && state !== 'end') {
    const frame = player.moving ? (player.prog < 0.5 ? 1 + (player.step % 2) : 0) : 0;
    list.push({ y: player.y + 0.5, f: () => drawDuck(player.x, player.y, player.dir, frame, player.soot, true, player.blink < 0 && player.dir !== 'up') });
  }
  list.sort((a, b) => a.y - b.y).forEach(o => o.f());
  if (airship.launching) drawAirship();
  drawParticles(false);
  drawMarkersAndEmotes();
  if (state === 'play' && !dialog && !journal) drawLabels();
  ctx.restore();

  drawLighting();

  if (flash > 0) R(0, 0, VW, VH, `rgba(255,220,150,${flash * 0.25})`);
  if (boomFlash > 0) R(0, 0, VW, VH, `rgba(255,250,235,${boomFlash})`);

  if (state === 'play' || state === 'cutscene') {
    if (state === 'play') drawHUD();
    drawToast(); drawTerminal(); drawDialog(); drawJournal();
    if (state === 'cutscene' && cutSkippable) text('esc: skip', VW - 6, VH - 9, 5, 'rgba(255,233,176,0.45)', 'right');
  }
  if (state === 'title') drawTitle();
  if (state === 'end') drawEnd();
  if (fade > 0.003) R(0, 0, VW, VH, `rgba(4,2,8,${fade})`);
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  try { update(dt); render(dt); } catch (e) { console.error(e); }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
