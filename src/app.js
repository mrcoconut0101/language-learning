"use strict";
/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.floor(Math.random() * a.length)];
const DAY = 86400000;
const todayKey = (d = new Date()) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const NPC_COLORS = ["#2E5AAC", "#A23B72", "#1F7A5A", "#B5541B", "#6B4FBB", "#0F7C8A", "#B83B3B", "#5C6B1F"];
const ICON = {
  play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 9v6h4l5 4V5L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg>',
  turtle: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 6c-4 0-7 3-7 6.5V14h14v-1.5C19 9 16 6 12 6zm8 4.5c.8 0 2 .6 2 2s-1.2 2-2 2zM6 15l-1 3h3l1-3zm9 0 1 3h3l-1-3z"/></svg>',
  mic: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-3.1A7 7 0 0 0 19 11z"/></svg>',
  flame: '<svg viewBox="0 0 24 24" fill="#E8590C" aria-hidden="true"><path d="M13.5 1s.7 2.6.7 4.7c0 2-1.3 3.6-3.3 3.6S7.5 7.7 7.5 5.7V5.4C5.6 7.7 4.5 10.6 4.5 13.8 4.5 18 7.9 21.4 12 21.4s7.5-3.4 7.5-7.6c0-5.1-2.4-9.6-6-12.8z"/></svg>',
  map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M6 8.5v3a3 3 0 0 0 3 3h6a3 3 0 0 1 3 3"/></svg>',
  cards: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="6" width="13" height="15" rx="2"/><path d="M8 3h11a2 2 0 0 1 2 2v12"/></svg>',
  grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M10 3v18"/></svg>',
  people: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2A5 5 0 0 1 21.5 19"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
  close: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>'
};

/* ---------- state ---------- */
const STORE_KEY = "quartier-save-v1";
const fresh = () => ({ v: 1, xp: 0, streak: 0, lastDay: "", goal: 150, rate: 0.95, items: {}, units: {}, friends: {}, days: {}, updatedAt: 0 });
let S = fresh();
try { const raw = localStorage.getItem(STORE_KEY); if (raw) S = Object.assign(fresh(), JSON.parse(raw)); } catch (e) { }
function save(cloud) {
  S.updatedAt = Date.now();
  try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { }
  if (cloud) Cloud.push();
}
const level = () => Math.floor(Math.sqrt(S.xp / 60)) + 1;
const todayXp = () => S.days[todayKey()] || 0;
function addXp(n) {
  const t = todayKey();
  if (S.lastDay !== t) {
    const y = todayKey(new Date(Date.now() - DAY));
    S.streak = S.lastDay === y ? S.streak + 1 : 1;
    S.lastDay = t;
  }
  S.xp += n; S.days[t] = (S.days[t] || 0) + n;
  const keys = Object.keys(S.days).sort(); while (keys.length > 60) delete S.days[keys.shift()];
}
const unitState = id => (S.units[id] = S.units[id] || { l: [0, 0, 0], conv: 0 });
const unitDone = u => { const s = S.units[u.id]; return !!s && s.l.every(Boolean); };
const unitUnlocked = i => i === 0 || unitDone(UNITS[i - 1]);

/* ---------- items ---------- */
const ITEMS = {};
UNITS.forEach((u, ui) => {
  u.color = NPC_COLORS[ui % NPC_COLORS.length];
  u.words.forEach((w, i) => { const [fr, en] = w.split("|"); ITEMS[u.id + ":w" + i] = { id: u.id + ":w" + i, type: "w", fr, en, alts: [], ui }; });
  u.sents.forEach((s, i) => { const [fr, en, alt] = s.split("|"); ITEMS[u.id + ":s" + i] = { id: u.id + ":s" + i, type: "s", fr, en, alts: alt ? alt.split(";") : [], ui }; });
});
const unitItems = (ui, type) => Object.values(ITEMS).filter(it => it.ui === ui && (!type || it.type === type));
// Spaced repetition: strength 0..7, each step roughly doubles the gap.
const GAPS = [0, 10 * 60e3, DAY, 3 * DAY, 7 * DAY, 16 * DAY, 35 * DAY, 90 * DAY];
function grade(item, ok, hinted) {
  if (!item) return;
  const r = S.items[item.id] || { s: 0, due: 0, n: 0, w: 0 };
  r.n++;
  if (ok && hinted) r.s = Math.max(1, r.s);
  else if (ok) { if (r.s < 2 || r.due <= Date.now()) r.s = Math.min(7, r.s + 1); } else { r.s = Math.max(0, r.s - 2); r.w++; }
  r.due = Date.now() + GAPS[r.s];
  S.items[item.id] = r;
}
const learned = () => Object.keys(S.items).filter(id => ITEMS[id]);
const dueList = () => learned().filter(id => S.items[id].due <= Date.now()).sort((a, b) => S.items[a].due - S.items[b].due);
const knownCount = () => learned().filter(id => S.items[id].s >= 2).length;

/* ---------- answer checking ---------- */
const norm = s => s.toLowerCase().replace(/[’`]/g, "'").replace(/[.,!?;:«»"…()]/g, " ").replace(/-/g, " ").replace(/\s+/g, " ").trim();
const bare = s => norm(s).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/œ/g, "oe").replace(/æ/g, "ae");
const ARTICLE = /^(le|la|les|l'|un|une|des|du|de la|de l')\s*/;
function lev(a, b) {
  const m = a.length, n = b.length; if (Math.abs(m - n) > 2) return 3;
  let p = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) { const c = [i]; for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; }
  return p[n];
}
// Returns {ok, note}
function check(input, answers) {
  const ni = norm(input), bi = bare(input);
  if (!ni) return { ok: false };
  for (const a of answers) if (norm(a) === ni) return { ok: true };
  for (const a of answers) if (bare(a) === bi) return { ok: true, note: "Watch the accents: " + a };
  for (const a of answers) {
    const ba = bare(a);
    if (ARTICLE.test(norm(a)) && ba.replace(ARTICLE, "") === bi) return { ok: true, note: "Learn it with its article: " + a };
    if (ba.length > 5 && lev(ba, bi) <= (ba.length > 14 ? 2 : 1)) return { ok: true, note: "Small typo. Correct spelling: " + a };
  }
  return { ok: false };
}
// Hint: first letter of each word, then `extra` more letters, the rest as underscores.
function mask(ans, extra) {
  let seen = 0, startOfWord = true;
  return [...ans.replace(/\(e\)s?/g, "")].map(ch => {
    if (!/[a-zà-ÿœæ]/i.test(ch)) { startOfWord = /[\s'’-]/.test(ch); return ch; }
    const show = startOfWord || seen++ < extra; startOfWord = false;
    return show ? ch : "_";
  }).join("");
}
const tokens = s => s.replace(/[.,!?;:«»"…]/g, " ").split(/\s+/).filter(Boolean);

/* ---------- speech ---------- */
let VOICE = null;
function pickVoice() {
  try {
    const vs = speechSynthesis.getVoices();
    VOICE = vs.find(v => v.lang === "fr-FR" && /Amélie|Thomas|Audrey|Marie|Google/.test(v.name)) || vs.find(v => v.lang === "fr-FR") || vs.find(v => /^fr/i.test(v.lang)) || null;
  } catch (e) { }
}
if ("speechSynthesis" in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
function speak(text, slow) {
  if (!("speechSynthesis" in window)) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "fr-FR"; if (VOICE) u.voice = VOICE;
    u.rate = slow ? 0.6 : S.rate;
    speechSynthesis.speak(u);
  } catch (e) { }
}
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
function listen() {
  return new Promise((res, rej) => {
    try {
      const r = new SR(); r.lang = "fr-FR"; r.interimResults = false; r.maxAlternatives = 3;
      let done = false;
      r.onresult = e => { done = true; res(Array.from(e.results[0]).map(x => x.transcript)); };
      r.onerror = e => { done = true; rej(e.error || "error"); };
      r.onend = () => { if (!done) rej("no-speech"); };
      r.start();
    } catch (e) { rej("unsupported"); }
  });
}
function speechScore(heard, target) {
  const t = bare(target).split(" "), h = new Set(bare(heard).split(" "));
  return t.filter(w => h.has(w)).length / t.length;
}

/* ---------- conjugation engine ---------- */
const PRON = ["je", "tu", "il/elle", "nous", "vous", "ils/elles"];
const TENSES = { pres: "Présent", pc: "Passé composé", imp: "Imparfait", fut: "Futur", cond: "Conditionnel", subj: "Subjonctif" };
const TENSE_EN = { pres: "present", pc: "past (perfect)", imp: "past (habit)", fut: "future", cond: "would…", subj: "subjunctive" };
const VERB = Object.fromEntries(VERBS.map(v => [v.inf, v]));
function joinEr(stem, end) { // manger → mangeons, commencer → commençons
  if (/g$/.test(stem) && /^[ao]/.test(end)) return stem + "e" + end;
  if (/c$/.test(stem) && /^[ao]/.test(end)) return stem.slice(0, -1) + "ç" + end;
  return stem + end;
}
function present(v) {
  if (v.pres) return v.pres;
  const st = v.inf.slice(0, -2);
  if (v.g === "er") return ["e", "es", "e", "ons", "ez", "ent"].map(e => joinEr(st, e));
  if (v.g === "ir") return ["is", "is", "it", "issons", "issez", "issent"].map(e => st + e);
  return ["s", "s", "", "ons", "ez", "ent"].map(e => st + e);
}
function participle(v) { return v.pp || (v.g === "er" ? v.inf.slice(0, -2) + "é" : v.g === "ir" ? v.inf.slice(0, -2) + "i" : v.inf.slice(0, -2) + "u"); }
function impStem(v) { return v.imp || present(v)[3].replace(/ons$/, ""); }
function addEnd(stem, end) {
  if (/ge$/.test(stem) && /^i/.test(end)) return stem.slice(0, -1) + end;
  if (/ç$/.test(stem) && /^i/.test(end)) return stem.slice(0, -1) + "c" + end;
  return stem + end;
}
const IMP_END = ["ais", "ais", "ait", "ions", "iez", "aient"];
// Returns list of accepted answers; the first one is shown.
function conj(inf, tense, p) {
  const v = VERB[inf];
  if (tense === "pres") return [present(v)[p]];
  if (tense === "imp") return [addEnd(impStem(v), IMP_END[p])];
  const fstem = v.fut || (v.g === "re" ? v.inf.slice(0, -1) : v.inf);
  if (tense === "fut") return [fstem + ["ai", "as", "a", "ons", "ez", "ont"][p]];
  if (tense === "cond") return [fstem + IMP_END[p]];
  if (tense === "subj") {
    if (v.subj) return [v.subj[p]];
    if (p === 3 || p === 4) return [addEnd(impStem(v), ["ions", "iez"][p - 3])];
    return [present(v)[5].replace(/ent$/, "") + ["e", "es", "e", "", "", "ent"][p]];
  }
  if (tense === "pc") {
    const aux = present(v.etre ? VERB["être"] : VERB["avoir"])[p], pp = participle(v);
    if (!v.etre) return [aux + " " + pp];
    if (p < 3) return [aux + " " + pp + "(e)", aux + " " + pp, aux + " " + pp + "e"];
    const out = [aux + " " + pp + "(e)s", aux + " " + pp + "s", aux + " " + pp + "es"];
    if (p === 4) out.push(aux + " " + pp, aux + " " + pp + "e");
    return out;
  }
}
function pronFor(p, form, tense) {
  let pr = PRON[p];
  if (p === 0 && /^[aeéèêiîoôuyh]/i.test(form)) pr = "j'";
  if (tense === "subj") pr = (p === 0 || p === 2 || p === 5) && /^[aeéèêiîoôuyh]/i.test(pr) ? "qu'" + pr : "que " + pr;
  return pr;
}
const sayConj = (inf, tense, p) => { const f = conj(inf, tense, p)[0].replace(/\(e\)s?|\(e\)/g, m => m.includes("s") ? "s" : ""); const pr = pronFor(p, f, tense).replace("il/elle", "il").replace("ils/elles", "ils"); return (pr.endsWith("'") ? pr : pr + " ") + f; };

/* ---------- exercise builders ---------- */
function distractors(item, field, n) {
  const same = Object.values(ITEMS).filter(x => x.type === item.type && x.id !== item.id && bare(x[field]) !== bare(item[field]));
  const near = shuffle(same.filter(x => Math.abs(x.ui - item.ui) <= 1));
  const far = shuffle(same.filter(x => Math.abs(x.ui - item.ui) > 1));
  return near.concat(far).slice(0, n).map(x => x[field]);
}
const ex = {
  intro: it => ({ t: "intro", item: it }),
  mcEn: it => ({ t: "mc", item: it, kind: "Pick the meaning", prompt: it.fr, promptFr: true, audio: it.fr, ans: it.en, opts: shuffle([it.en, ...distractors(it, "en", 3)]) }),
  mcFr: it => ({ t: "mc", item: it, kind: "Pick the French", prompt: it.en, ans: it.fr, opts: shuffle([it.fr, ...distractors(it, "fr", 3)]), optFr: true }),
  typeHint: it => Object.assign(ex.type(it), { hint: true }),
  gram: (u, table) => ({ t: "gram", u, table }),
  conjMc: (inf, tense, p) => {
    const a = conj(inf, tense, p)[0], others = [...new Set([0, 1, 2, 3, 4, 5].map(x => conj(inf, tense, x)[0]))].filter(f => f !== a);
    return { t: "mc", kind: "Pick the right form", prompt: pronFor(p, a, tense) + " ___", promptFr: true, sub: `${inf} (${VERB[inf].en}) · ${TENSE_EN[tense]}`, ans: a, opts: shuffle([a, ...shuffle(others).slice(0, 3)]), optFr: true, say: sayConj(inf, tense, p) };
  },
  mcListen: it => ({ t: "mc", item: it, kind: "Tap what you hear", listen: true, audio: it.fr, ans: it.fr, opts: shuffle([it.fr, ...distractors(it, "fr", 3)]), optFr: true }),
  type: it => ({ t: "type", item: it, kind: it.type === "w" ? "Write in French" : "Translate into French", prompt: it.en, answers: [it.fr, ...it.alts] }),
  dict: it => ({ t: "type", item: it, kind: "Listen and write", listen: true, audio: it.fr, answers: [it.fr, ...it.alts], meaning: it.en, hint: true }),
  tiles: it => {
    const own = tokens(it.fr);
    const others = shuffle(unitItems(it.ui, "s").filter(x => x.id !== it.id).flatMap(x => tokens(x.fr))).filter(w => !own.some(o => bare(o) === bare(w)));
    return { t: "tiles", item: it, kind: "Build the sentence", prompt: it.en, answers: [it.fr, ...it.alts], bank: shuffle([...own, ...[...new Set(others)].slice(0, 3)]) };
  },
  speak: it => ({ t: "speak", item: it, kind: "Say it out loud", audio: it.fr }),
  conj: (inf, tense, p) => { const a = conj(inf, tense, p); return { t: "conj", kind: TENSES[tense] + " · " + inf, inf, tense, p, answers: a, pron: pronFor(p, a[0], tense), hint: true }; },
  dlg: (u, turn, i) => ({ t: "dlg", u, turn, i, opts: shuffle(turn[2].map((o, k) => ({ fr: o[0], en: o[1], hint: o[2], ok: k === 0 }))) })
};
// Each item gets harder only as you get it right: recognise → choose → build → write → write from audio.
function stageEx(it) {
  const s = S.items[it.id] ? S.items[it.id].s : 0;
  if (it.type === "w") {
    if (s <= 0) return ex.mcEn(it);
    if (s === 1) return pick([ex.mcEn, ex.mcFr])(it);
    if (s === 2) return pick([ex.mcFr, ex.mcListen, ex.typeHint])(it);
    if (s === 3) return pick([ex.typeHint, ex.type])(it);
    return pick([ex.type, ex.dict, ex.typeHint])(it);
  }
  if (s <= 2) return ex.tiles(it);
  if (s === 3) return pick([ex.tiles, ex.speak])(it);
  return pick([ex.tiles, ex.speak, ex.dict])(it);
}
function conjMcs(u, n) {
  if (!u.conj) return [];
  return Array.from({ length: n }, () => ex.conjMc(u.conj.verbs[0], u.conj.tenses[0], Math.floor(Math.random() * 6)));
}
function conjDrills(u, n) {
  if (!u.conj) return [];
  const out = [];
  for (let i = 0; i < n; i++) out.push(ex.conj(pick(u.conj.verbs), pick(u.conj.tenses), Math.floor(Math.random() * 6)));
  return out;
}
function buildLesson(ui, li) {
  const u = UNITS[ui];
  const words = unitItems(ui, "w"), sents = unitItems(ui, "s");
  const per = Math.ceil(words.length / 3);
  const newW = words.slice(li * per, li * per + per);
  const sp = Math.ceil(sents.length / 3);
  const newS = sents.slice(li * sp, li * sp + sp);
  const q = [];
  if (li === 0) q.push(ex.gram(u, false));
  // 1. See and hear each new word, then recognise it straight away.
  newW.forEach(w => { if (!S.items[w.id]) q.push(ex.intro(w)); q.push(ex.mcEn(w)); });
  // 2. Choose the French (by reading or listening, with written options).
  q.push(...shuffle(newW.map(w => pick([ex.mcFr, ex.mcFr, ex.mcListen])(w))));
  // 3. See each sentence, then build it from tiles.
  newS.forEach(s => { if (!S.items[s.id]) q.push(ex.intro(s)); q.push(ex.tiles(s)); });
  // 4. Grammar pattern with a table, then pick the right verb form.
  if (li === 2 && u.conj) { q.push(ex.gram(u, true)); q.push(...conjMcs(u, 3)); }
  // 5. Write the words, with first letters as a hint.
  q.push(...shuffle(newW.map(ex.typeHint)));
  // 6. A few older items that are due, at their own difficulty.
  dueList().filter(id => ITEMS[id].ui !== ui).slice(0, 3).forEach(id => q.push(stageEx(ITEMS[id])));
  return q;
}
function buildReview() {
  const ids = dueList().slice(0, 15);
  if (ids.length < 6) learned().sort((a, b) => S.items[a].s - S.items[b].s).forEach(id => { if (ids.length < 12 && !ids.includes(id)) ids.push(id); });
  return shuffle(ids.map(id => stageEx(ITEMS[id])));
}
function buildTest(ui) {
  const u = UNITS[ui];
  const q = shuffle(unitItems(ui, "w")).slice(0, 6).map(ex.type).concat(shuffle(unitItems(ui, "s")).slice(0, 3).map(ex.tiles), conjDrills(u, 1));
  return shuffle(q);
}

/* ---------- player ---------- */
let P = null;
let audioUnlocked = false;
function unlockAudio() { // iOS only allows speech after a tap; prime it once inside the tap handler.
  if (audioUnlocked || !("speechSynthesis" in window)) return;
  try { const u = new SpeechSynthesisUtterance(" "); u.volume = 0; speechSynthesis.speak(u); audioUnlocked = true; } catch (e) { }
}
function startSession(mode, opts = {}) {
  unlockAudio();
  let q = [];
  if (mode === "lesson") q = buildLesson(opts.ui, opts.li);
  else if (mode === "review") q = buildReview();
  else if (mode === "test") q = buildTest(opts.ui);
  else if (mode === "conv") q = UNITS[opts.ui].dlg.map((t, i) => ex.dlg(UNITS[opts.ui], t, i));
  else if (mode === "conj") q = Array.from({ length: 10 }, () => ex.conj(opts.inf, opts.tense, Math.floor(Math.random() * 6)));
  else if (mode === "sprint") q = [];
  if (!q.length && mode !== "sprint") { toast("Nothing to practise yet. Start a lesson first."); return; }
  closeSheet();
  P = { mode, ...opts, q, i: 0, right: 0, graded: 0, xp: 0, combo: 0, best: 0, retried: new Set(), chat: [], end: 0 };
  if (mode === "sprint") { P.end = Date.now() + 75e3; P.q = [sprintEx()]; P.timer = setInterval(tickSprint, 250); }
  $("#player").hidden = false;
  document.body.style.overflow = "hidden";
  renderEx();
}
function sprintEx() {
  const pool = learned().length >= 8 ? learned().map(id => ITEMS[id]) : unitItems(0, "w");
  const it = pick(pool.filter(x => x.type === "w").length ? pool.filter(x => x.type === "w") : pool);
  return pick([ex.mcEn, ex.mcListen])(it);
}
function tickSprint() {
  const left = Math.max(0, P.end - Date.now());
  const el = $("#ptimer"); if (el) el.textContent = Math.ceil(left / 1000) + "s";
  const b = $("#pbar b"); if (b) b.style.width = (100 - left / 750) + "%";
  if (!left) { clearInterval(P.timer); finish(); }
}
function quitSession() {
  if (P && P.timer) clearInterval(P.timer);
  P = null; $("#player").hidden = true; document.body.style.overflow = ""; try { speechSynthesis.cancel(); } catch (e) { }
  render();
}
function audioBtns(text, big) {
  return `<div class="row"><button class="say ${big ? "big-say" : ""}" data-say="${esc(text)}" aria-label="Play audio">${ICON.play}</button>` +
    `<button class="say slow" data-say="${esc(text)}" data-slow="1" aria-label="Play slowly">${ICON.turtle}${big ? "" : " Slow"}</button></div>`;
}
const ACC = ["é", "è", "ê", "à", "â", "ç", "ù", "û", "î", "ï", "ô", "œ", "ë", "'"];
function renderEx() {
  const e = P.q[P.i];
  const pct = P.mode === "sprint" ? 0 : Math.round(P.i / P.q.length * 100);
  let body = "", foot = "";
  if (e.t === "intro") {
    const sent = e.item.type === "s";
    body = `<div class="q-kind">${sent ? "New sentence" : "New word"}</div><div class="intro ${sent ? "sent" : ""}"><div class="fr">${esc(e.item.fr)}</div><div class="muted">${esc(e.item.en)}</div>${audioBtns(e.item.fr)}</div>
      <p class="muted">${sent ? "Read it, listen, and say it out loud. You'll build it from tiles next." : "Say it out loud twice. Saying words aloud makes them stick much faster than reading them."}</p>`;
    foot = `<button class="btn wide" id="next">Got it</button>`;
    speak(e.item.fr);
  } else if (e.t === "gram") {
    const u = e.u, v = u.conj && VERB[u.conj.verbs[0]], tn = u.conj && u.conj.tenses[0];
    body = `<div class="q-kind">${e.table ? "Verb pattern" : "Before you start"}</div><div class="gram">${u.gram}</div>` +
      (e.table && v ? `<div class="card"><div class="eyebrow">${esc(v.inf)} · ${TENSES[tn]} · tap to hear</div><table class="tbl">${PRON.map((p, i) => { const f = conj(v.inf, tn, i)[0]; return `<tr><td>${esc(pronFor(i, f, tn))}</td><td><button class="fr" data-say="${esc(sayConj(v.inf, tn, i))}">${esc(f)}</button></td></tr>`; }).join("")}</table></div>` : "");
    foot = `<button class="btn wide" id="next">Got it</button>`;
  } else if (e.t === "mc") {
    body = `<div class="q-kind">${e.kind}</div>` + (e.listen ? `<div class="q">${esc(e.item.en)}</div><p class="muted" style="margin:0">Listen and tap the French you hear.</p>${audioBtns(e.audio)}` : `<div class="q ${e.promptFr ? "fr" : ""}">${esc(e.prompt)}</div>${e.sub ? `<p class="muted" style="margin:0">${esc(e.sub)}</p>` : ""}${e.audio ? audioBtns(e.audio) : ""}`) +
      `<div class="opts">${e.opts.map((o, k) => `<button class="opt ${e.optFr ? "fr" : ""}" data-opt="${k}">${esc(o)}</button>`).join("")}</div>`;
    if (e.audio) speak(e.audio);
  } else if (e.t === "type" || e.t === "conj") {
    const prompt = e.t === "conj"
      ? `<div class="q"><span class="fr">${esc(e.pron)}</span> ______</div><p class="muted">${esc(e.inf)} (${esc(VERB[e.inf].en)}) · ${TENSE_EN[e.tense]}</p>`
      : e.listen ? `<div class="q">${esc(e.meaning)}</div><p class="muted" style="margin:0">Listen, then write it in French.</p>${audioBtns(e.audio)}` : `<div class="q">${esc(e.prompt)}</div>`;
    const hint = e.hint ? `<div class="row"><span class="hintline fr" id="hintline" aria-label="Hint">${esc(mask(e.answers[0], e.shown || 0))}</span><button class="linkish" id="hintbtn">Show a letter</button></div>` : "";
    body = `<div class="q-kind">${e.kind}</div>${prompt}${hint}
      <textarea id="ans" class="inp" lang="fr" autocapitalize="off" autocomplete="off" autocorrect="off" spellcheck="false" rows="2" placeholder="Type in French"></textarea>
      <div class="accents">${ACC.map(a => `<button data-acc="${a}" aria-label="Insert ${a}">${a}</button>`).join("")}</div>`;
    foot = `<button class="btn wide" id="check">Check</button>`;
    if (e.listen) speak(e.audio);
  } else if (e.t === "tiles") {
    e.picked = [];
    body = `<div class="q-kind">${e.kind}</div><div class="q">${esc(e.prompt)}</div>
      <div class="tiles" id="answer" aria-label="Your sentence"></div>
      <div class="tiles bank" id="bank"></div>
      <div class="row" style="justify-content:space-between"><span class="muted" style="font-size:14px">Tap a word in your sentence to send it back.</span><button class="linkish" id="cleartiles">Clear</button></div>`;
    foot = `<button class="btn wide" id="check">Check</button>`;
  } else if (e.t === "speak") {
    body = `<div class="q-kind">${e.kind}</div><div class="q fr">${esc(e.item.fr)}</div><p class="muted">${esc(e.item.en)}</p>${audioBtns(e.item.fr)}
      <p class="muted">Listen, then say the whole sentence out loud. Copy the rhythm, not just the words.</p>`;
    foot = SR ? `<button class="btn wide" id="mic">${ICON.mic.replace("<svg", '<svg width="20" height="20" style="vertical-align:-4px"')} Tap and speak</button><button class="linkish" id="selfok">Can't talk right now? I said it in my head</button>`
      : `<button class="btn wide ok" id="selfok">I said it out loud</button><button class="linkish" id="skip">Skip</button>`;
    speak(e.item.fr);
  } else if (e.t === "dlg") {
    const u = e.u, t = e.turn;
    const last = P.chat[P.chat.length - 1];
    if (!last || last.fr !== t[0]) P.chat.push({ who: "npc", fr: t[0], en: t[1] });
    body = `<div class="row"><div class="av" style="background:${u.color}">${esc(u.npc[0])}</div><div><b>${esc(u.npc)}</b><div class="muted" style="font-size:13px">${esc(u.place)}</div></div></div>
      <div class="chat">${P.chat.map((c, k) => `<div class="bub ${c.who}"><span class="fr">${esc(c.fr)}</span>${c.who === "npc" ? ` <button class="linkish" data-say="${esc(c.fr)}" aria-label="Play">▶</button>` : ""}<span class="en" ${c.who === "npc" && k === P.chat.length - 1 ? 'hidden id="tr"' : ""}>${esc(c.en)}</span></div>`).join("")}</div>
      <button class="linkish" id="showtr">Show translation</button>
      <div class="q-kind">Your reply</div>
      <div class="opts">${e.opts.map((o, k) => `<button class="opt fr" data-dopt="${k}">${esc(o.fr)}</button>`).join("")}</div>`;
    speak(t[0]);
  }
  const top = P.mode === "sprint"
    ? `<div class="bar" id="pbar"><b style="width:0%"></b></div><div class="timer" id="ptimer">75s</div>`
    : `<div class="bar"><b style="width:${pct}%"></b></div>`;
  $("#player").innerHTML = `<div class="p-top"><button class="x" id="quit" aria-label="Leave session">${ICON.close}</button>${top}<div class="combo" id="combo">${P.combo > 1 ? "×" + P.combo : ""}</div></div>
    <div class="p-body"><div class="p-inner">${body}</div></div><div class="p-foot" id="foot"><div class="in">${foot}</div></div>`;
  $("#foot").hidden = !foot;
  if (e.t === "tiles") drawTiles(e);
  const inp = $("#ans");
  if (inp) {
    inp.addEventListener("keydown", ev => { if (ev.key === "Enter") { ev.preventDefault(); doCheck(); } });
    if (window.matchMedia("(pointer:fine)").matches) inp.focus();
  }
}
// Tiles are redrawn from e.picked each time, so adding and removing always stay in sync.
function drawTiles(e) {
  $("#answer").innerHTML = e.picked.map(k => `<button class="tile fr" data-back="${k}">${esc(e.bank[k])}</button>`).join("");
  $("#bank").innerHTML = e.bank.map((w, k) => `<button class="tile fr ${e.picked.includes(k) ? "used" : ""}" data-tile="${k}" aria-pressed="${e.picked.includes(k)}">${esc(w)}</button>`).join("");
}
function feedback(ok, title, detail, item) {
  if (P.mode !== "conv") {
    P.graded++;
    if (ok) { P.right++; P.combo++; P.best = Math.max(P.best, P.combo); P.xp += P.mode === "sprint" ? 3 : 5 + Math.min(5, P.combo - 1); }
    else {
      P.combo = 0;
      const e = P.q[P.i];
      // Mistakes come back at the end of the session (once).
      if (P.mode !== "sprint" && !P.retried.has(P.i)) { P.retried.add(P.q.length); P.q.push(Object.assign({}, e, { usedHint: false, shown: 0, checked: false, picked: [] })); }
    }
    grade(item, ok, P.q[P.i] && P.q[P.i].usedHint);
  }
  if (P.mode === "sprint") { setTimeout(() => { if (!P || P.finished) return; P.q.push(sprintEx()); P.i++; renderEx(); }, ok ? 350 : 1100); if (!ok) showFoot(false, title, detail, true); return; }
  showFoot(ok, title, detail);
}
function showFoot(ok, title, detail, noBtn) {
  const f = $("#foot"); f.hidden = false; f.className = "p-foot " + (ok ? "ok" : "bad");
  f.innerHTML = `<div class="in"><div class="fb-title">${esc(title)}</div>${detail ? `<div>${detail}</div>` : ""}${noBtn ? "" : `<button class="btn wide ${ok ? "ok" : "bad"}" id="next">Continue</button>`}</div>`;
  const c = $("#combo"); if (c) { c.textContent = P.combo > 1 ? "×" + P.combo : ""; if (ok && P.combo > 1) { c.classList.remove("pop"); void c.offsetWidth; c.classList.add("pop"); } }
  if (!ok) { const b = $(".p-inner"); b.classList.add("shake"); }
  const n = $("#next"); if (n) n.focus();
}
const PRAISE = ["Très bien !", "Parfait !", "Excellent !", "Bravo !", "Super !", "Génial !", "Impeccable !"];
function doCheck() {
  const e = P.q[P.i];
  if ($("#foot").classList.contains("ok") || $("#foot").classList.contains("bad")) return;
  if (e.t === "type" || e.t === "conj") {
    let v = $("#ans").value;
    if (e.t === "conj") v = v.replace(/^\s*(que\s+|qu')?(j'\s*|(je|tu|il|elle|on|nous|vous|ils|elles)\s+)/i, "");
    if (!v.trim()) return;
    const r = check(v, e.answers);
    $("#ans").disabled = true;
    const ans = e.t === "conj" ? `${esc(e.pron)} ${esc(e.answers[0])}` : esc(e.answers[0]);
    if (r.ok) { feedback(true, pick(PRAISE), r.note ? esc(r.note) : (e.listen || e.t === "conj" ? `<span class="fr">${ans}</span>` : ""), e.item); speak(e.t === "conj" ? sayConj(e.inf, e.tense, e.p) : e.answers[0]); }
    else { feedback(false, "Not quite", `Correct answer: <span class="fr">${ans}</span>`, e.item); speak(e.t === "conj" ? sayConj(e.inf, e.tense, e.p) : e.answers[0]); }
  } else if (e.t === "tiles") {
    if (!e.picked.length) return;
    const said = e.picked.map(k => e.bank[k]).join(" ");
    const ok = e.answers.some(a => bare(a) === bare(said));
    e.checked = true;
    if (ok) feedback(true, pick(PRAISE), `<span class="fr">${esc(e.item.fr)}</span>`, e.item); else feedback(false, "Not quite", `Correct answer: <span class="fr">${esc(e.item.fr)}</span>`, e.item);
    speak(e.item.fr);
  }
}
function next() {
  if (!P) return;
  P.i++;
  if (P.i >= P.q.length) finish(); else renderEx();
}
function finish() {
  if (P.timer) clearInterval(P.timer);
  const u = P.ui != null ? UNITS[P.ui] : null;
  const notes = [];
  let bonus = 0;
  if (P.mode === "lesson") {
    const st = unitState(u.id);
    if (!st.l[P.li]) { st.l[P.li] = 1; S.friends[u.id] = Math.min(5, (S.friends[u.id] || 0) + 1); notes.push(`${u.npc} likes you more.`); }
    bonus = 15;
    if (unitDone(u) && UNITS[P.ui + 1] && P.li === 2) notes.push(`New station unlocked: ${UNITS[P.ui + 1].place}`);
  } else if (P.mode === "conv") {
    const st = unitState(u.id);
    if (!st.conv) { st.conv = 1; S.friends[u.id] = Math.min(5, (S.friends[u.id] || 0) + 2); notes.push(`You and ${u.npc} are now friends.`); }
    bonus = 40;
  } else if (P.mode === "test") {
    const acc = P.right / Math.max(1, P.graded);
    if (acc >= 0.8) { const st = unitState(u.id); st.l = [1, 1, 1]; S.friends[u.id] = Math.max(S.friends[u.id] || 0, 3); notes.push(`You tested out of ${u.place}. Next station unlocked.`); bonus = 30; }
    else notes.push(`You need 80% to skip. You got ${Math.round(acc * 100)}%. Take the lessons; they're quick.`);
  } else if (P.mode === "review") bonus = 10;
  const gained = P.xp + bonus;
  const wasBelow = todayXp() < S.goal;
  addXp(gained);
  if (wasBelow && todayXp() >= S.goal) notes.push("Daily goal reached!");
  save(true);
  const acc = P.graded ? Math.round(P.right / P.graded * 100) : 100;
  const title = P.mode === "sprint" ? "Time's up!" : acc >= 90 ? "Magnifique !" : acc >= 70 ? "Bien joué !" : "Courage, ça vient !";
  $("#player").innerHTML = `<div class="p-body"><div class="p-inner result">
    <div class="eyebrow">${P.mode === "conv" ? "Conversation complete" : P.mode === "sprint" ? "Sprint" : "Session complete"}</div>
    <h2>${title}</h2>
    <div class="kpis"><div class="kpi"><b>+${gained}</b><span>XP</span></div><div class="kpi"><b>${acc}%</b><span>accuracy</span></div><div class="kpi"><b>${P.mode === "sprint" ? P.right : P.best}</b><span>${P.mode === "sprint" ? "correct" : "best combo"}</span></div></div>
    ${notes.map(n => `<div class="card">${esc(n)}</div>`).join("")}
    <div class="card" style="width:100%;text-align:left"><div class="eyebrow">Today</div><div style="font-variant-numeric:tabular-nums">${todayXp()} / ${S.goal} XP · streak ${S.streak} day${S.streak === 1 ? "" : "s"}</div></div>
  </div></div><div class="p-foot"><div class="in"><button class="btn wide" id="done">Continue</button></div></div>`;
  P.finished = true;
}

/* ---------- player events ---------- */
document.addEventListener("click", ev => {
  const t = ev.target.closest("button"); if (!t) return;
  if (t.dataset.say) { speak(t.dataset.say, !!t.dataset.slow); return; }
  if (!P) return;
  const e = P.q[P.i];
  if (t.id === "quit" || t.id === "done") return quitSession();
  if (t.id === "next") return next();
  if (t.id === "check") return doCheck();
  if (t.id === "skip") return next();
  if (t.id === "hintbtn") {
    e.shown = (e.shown || 0) + 1; e.usedHint = true;
    const h = $("#hintline"); if (h) h.textContent = mask(e.answers[0], e.shown);
    return;
  }
  if (t.id === "showtr") { const tr = $("#tr"); if (tr) tr.hidden = false; t.hidden = true; return; }
  if (t.dataset.acc) { const i = $("#ans"); if (!i || i.disabled) return; const s = i.selectionStart ?? i.value.length; i.value = i.value.slice(0, s) + t.dataset.acc + i.value.slice(i.selectionEnd ?? s); i.focus(); i.selectionStart = i.selectionEnd = s + 1; return; }
  if (t.dataset.opt != null && e.t === "mc") {
    if ($("#foot").classList.contains("ok") || $("#foot").classList.contains("bad") || $(".opt.right")) return;
    const ch = e.opts[+t.dataset.opt], ok = ch === e.ans;
    t.classList.add(ok ? "right" : "wrong");
    if (!ok) document.querySelectorAll(".opt").forEach(b => { if (b.textContent === e.ans) b.classList.add("right"); });
    const info = e.item ? `<span class="fr">${esc(e.item.fr)}</span> = ${esc(e.item.en)}` : `<span class="fr">${esc(e.say)}</span>`;
    feedback(ok, ok ? pick(PRAISE) : "Not quite", info, e.item);
    if (P.mode !== "sprint") speak(e.say || e.item.fr);
    return;
  }
  if (e.t === "tiles" && !e.checked && (t.dataset.tile != null || t.dataset.back != null || t.id === "cleartiles")) {
    if (t.id === "cleartiles") e.picked = [];
    else { const k = +(t.dataset.tile ?? t.dataset.back); e.picked = e.picked.includes(k) ? e.picked.filter(x => x !== k) : e.picked.concat(k); }
    drawTiles(e);
    return;
  }
  if (t.id === "selfok" && e.t === "speak") { feedback(true, "Bien !", "Shadowing every day trains your mouth and your ear at once.", e.item); return; }
  if (t.id === "mic" && e.t === "speak") {
    t.disabled = true; t.textContent = "Listening…";
    listen().then(alts => {
      const best = alts.reduce((m, a) => Math.max(m, speechScore(a, e.item.fr)), 0);
      if (best >= 0.7) feedback(true, pick(PRAISE), `I heard: <span class="fr">${esc(alts[0])}</span>`, e.item);
      else { t.disabled = false; t.textContent = "Try again"; toast(`I heard: "${alts[0]}". Try again, a bit slower.`); }
    }).catch(err => { t.disabled = false; t.textContent = "Tap and speak"; toast(err === "not-allowed" || err === "service-not-allowed" ? "Microphone is blocked here. Say it out loud, then tap the link below." : "I didn't catch that. Try again."); });
    return;
  }
  if (t.dataset.dopt != null && e.t === "dlg") {
    const o = e.opts[+t.dataset.dopt];
    if (o.ok) {
      document.querySelectorAll("[data-dopt]").forEach(b => b.disabled = true);
      t.classList.add("right");
      P.chat[P.chat.length - 1].en = e.turn[1];
      P.chat.push({ who: "me", fr: o.fr, en: o.en });
      P.xp += P.wrongTurn ? 3 : 8; P.right++; P.graded++; P.wrongTurn = false;
      speak(o.fr);
      showFoot(true, pick(PRAISE), "");
    } else {
      t.classList.add("wrong"); t.disabled = true; P.graded++; P.wrongTurn = true;
      toast(o.hint || "That doesn't fit. Try another reply.");
    }
  }
});

/* ---------- toasts & sheets ---------- */
let toastT;
function toast(msg) {
  let t = $("#toast"); if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
  t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 3200);
}
function openSheet(html) { const s = $("#sheet"); s.innerHTML = `<div class="sheet" role="dialog" aria-modal="true">${html}</div>`; s.hidden = false; }
function closeSheet() { $("#sheet").hidden = true; }
$("#sheet").addEventListener("click", ev => { if (ev.target.id === "sheet") closeSheet(); });

/* ---------- screens ---------- */
let TAB = "map";
const hearts = n => `<span class="hearts" aria-label="${n} of 5 hearts">${"♥".repeat(n)}<span class="off">${"♥".repeat(5 - n)}</span></span>`;
function header() {
  const pct = Math.min(1, todayXp() / S.goal), C = 2 * Math.PI * 15;
  $("#top").innerHTML = `<div class="brand">Le Quartier<small>Level ${level()} · ${knownCount()} words and phrases known</small></div>
    <div class="stat" title="Day streak">${ICON.flame}${S.streak}</div>
    <div class="ring" title="Daily goal"><svg viewBox="0 0 38 38"><circle cx="19" cy="19" r="15" fill="none" style="stroke:var(--surface-2)" stroke-width="5"/><circle cx="19" cy="19" r="15" fill="none" style="stroke:var(--line)" stroke-width="5" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct)}"/></svg><span>${Math.round(pct * 100)}%</span></div>`;
}
function nextLesson() {
  for (let i = 0; i < UNITS.length; i++) {
    if (!unitUnlocked(i)) break;
    const st = S.units[UNITS[i].id] || { l: [0, 0, 0], conv: 0 };
    const li = st.l.findIndex(x => !x);
    if (li >= 0) return { ui: i, li };
    if (!st.conv) return { ui: i, conv: true };
  }
  return null;
}
function screenMap() {
  const nx = nextLesson(), due = dueList().length;
  const nxLabel = !nx ? "Review" : nx.conv ? `Talk to ${UNITS[nx.ui].npc}` : `${UNITS[nx.ui].place} · Lesson ${nx.li + 1}`;
  let h = `<section class="hero"><div class="eyebrow" style="color:inherit;opacity:.8">${S.xp ? "Bon retour !" : "Bienvenue à Paris"}</div>
    <h1>${S.xp ? "Next stop: " + esc(nxLabel) : "You just moved into a Paris neighbourhood."}</h1>
    <p>${S.xp ? (due ? `${due} review${due === 1 ? "" : "s"} due. Doing reviews first locks in what you learned.` : "All reviews done. Keep going down the line.") : "Every place is a lesson. Every neighbour is a friend to make. Finish the line and you can hold a real conversation in French."}</p>
    <div class="row"><button class="btn" data-go="next">${S.xp ? "Continue" : "Start lesson 1"}</button>${due ? `<button class="btn ghost" data-go="review">Review ${due}</button>` : ""}</div></section>
    <div class="eyebrow">Ligne F · ${UNITS.filter(unitDone).length} of ${UNITS.length} stations</div><div class="line">`;
  UNITS.forEach((u, i) => {
    const st = S.units[u.id] || { l: [0, 0, 0], conv: 0 }, open = unitUnlocked(i), done = unitDone(u) && st.conv;
    h += `<button class="stop ${done ? "done" : ""} ${open ? "" : "locked"}" data-unit="${i}" aria-label="${esc(u.place)}${open ? "" : " (locked)"}">
      <span class="plaque">${esc(u.place)}</span>
      <span class="meta"><span class="av" style="background:${u.color}">${esc(u.npc[0])}</span><span>${esc(u.npc)}, ${esc(u.role)}</span><span class="lvl">${u.level}</span>
      <span class="pips">${st.l.map(x => `<i class="${x ? "on" : ""}"></i>`).join("")}<i class="${st.conv ? "on" : ""}" title="Conversation"></i></span></span></button>`;
  });
  return h + `</div><p class="muted" style="font-size:14px">Dots show three lessons and one conversation per station. Already know some French? Open a station and take its skip test.</p>`;
}
function openUnit(i) {
  const u = UNITS[i], st = unitState(u.id), open = unitUnlocked(i);
  const lbl = ["Words", "More words", "Sentences"];
  openSheet(`<div class="row" style="justify-content:space-between"><span class="plaque">${esc(u.place)}</span><button class="x" data-close aria-label="Close">${ICON.close}</button></div>
    <div class="row"><div class="av" style="background:${u.color};width:44px;height:44px;font-size:18px">${esc(u.npc[0])}</div><div><b>${esc(u.npc)}</b> · ${esc(u.role)}<div>${hearts(S.friends[u.id] || 0)}</div></div></div>
    ${open ? "" : `<div class="card">Finish the previous station, or pass this station's skip test, to unlock it.</div>`}
    <div class="gram"><div class="eyebrow" style="margin-bottom:6px">Grammar point · ${u.level}</div>${u.gram}</div>
    <div class="lessons">${[0, 1, 2].map(li => `<button class="btn ${st.l[li] ? "ghost" : ""}" data-lesson="${i},${li}" ${open ? "" : "disabled"}>Lesson ${li + 1}<small>${lbl[li]}${st.l[li] ? " · done" : ""}</small></button>`).join("")}
    <button class="btn ${st.conv ? "ghost" : ""}" data-conv="${i}" ${open && unitDone(u) ? "" : "disabled"} style="${open && unitDone(u) && !st.conv ? "background:var(--line);color:#1A1400" : ""}">Talk to ${esc(u.npc)}<small>${unitDone(u) ? (st.conv ? "done · replay" : "conversation") : "after the 3 lessons"}</small></button></div>
    <button class="btn ghost wide" data-test="${i}">Skip test: prove you know it (80% needed)</button>
    <details class="card"><summary style="font-weight:600">Word list (${u.words.length})</summary><table class="tbl" style="margin-top:8px">${u.words.map(w => { const [fr, en] = w.split("|"); return `<tr><td>${esc(en)}</td><td><button data-say="${esc(fr)}" class="fr">${esc(fr)}</button></td></tr>`; }).join("")}</table></details>`);
}
function screenReview() {
  const due = dueList().length, n = learned().length;
  const weak = learned().filter(id => S.items[id].w > 0).sort((a, b) => S.items[b].w - S.items[a].w).slice(0, 8);
  return `<h2 style="font-size:28px">Review</h2>
    <div class="card"><div class="eyebrow">Spaced repetition</div><p style="margin:.4em 0 1em">Each word comes back right before you'd forget it: 10 minutes, 1 day, 3 days, a week, and so on. Ten minutes of review a day keeps everything.</p>
    <div class="row"><button class="btn" data-go="review" ${n ? "" : "disabled"}>Review ${due ? due + " due" : "weakest words"}</button></div></div>
    <div class="card"><div class="eyebrow">Sprint</div><p style="margin:.4em 0 1em">75 seconds. Answer as many as you can. Good for waiting in line.</p><button class="btn ghost" data-go="sprint">Start sprint</button></div>
    ${weak.length ? `<div class="card"><div class="eyebrow">Your trickiest words</div><table class="tbl">${weak.map(id => `<tr><td>${esc(ITEMS[id].en)}</td><td><button class="fr" data-say="${esc(ITEMS[id].fr)}">${esc(ITEMS[id].fr)}</button></td></tr>`).join("")}</table></div>` : ""}
    <div class="card"><div class="eyebrow">Last 7 days</div>${weekBars()}</div>`;
}
function weekBars() {
  const days = [...Array(7)].map((_, k) => { const d = new Date(Date.now() - (6 - k) * DAY); return { k: todayKey(d), l: "SMTWTFS"[d.getDay()], v: S.days[todayKey(d)] || 0 }; });
  const max = Math.max(S.goal, ...days.map(d => d.v));
  return `<div class="bars" role="img" aria-label="XP per day for the last week">${days.map((d, i) => `<div class="${i === 6 ? "today" : ""}"><span style="font-variant-numeric:tabular-nums">${d.v || ""}</span><i style="height:${Math.round(d.v / max * 60)}px"></i>${d.l}</div>`).join("")}</div>`;
}
let CJ = { inf: "être", tense: "pres" };
function screenConj() {
  const v = VERB[CJ.inf];
  return `<h2 style="font-size:28px">Conjugation lab</h2>
    <p class="muted" style="margin:0">${VERBS.length} verbs in 6 tenses. With these, you can build almost any sentence.</p>
    <label class="eyebrow" for="cjverb">Verb</label>
    <select id="cjverb" class="inp">${VERBS.map(x => `<option value="${esc(x.inf)}" ${x.inf === CJ.inf ? "selected" : ""}>${esc(x.inf)} · ${esc(x.en)}</option>`).join("")}</select>
    <div class="chips" role="group" aria-label="Tense">${Object.keys(TENSES).map(t => `<button class="chip" data-tense="${t}" aria-pressed="${t === CJ.tense}">${TENSES[t]}</button>`).join("")}</div>
    <div class="card"><div class="eyebrow">${esc(v.inf)} · ${TENSES[CJ.tense]} · tap to hear</div><table class="tbl">${PRON.map((p, i) => { const f = conj(v.inf, CJ.tense, i)[0]; return `<tr><td>${esc(pronFor(i, f, CJ.tense))}</td><td><button class="fr" data-say="${esc(sayConj(v.inf, CJ.tense, i))}">${esc(f)}</button></td></tr>`; }).join("")}</table></div>
    <button class="btn wide" data-drill="1">Drill: 10 quick forms</button>`;
}
function screenFriends() {
  let h = `<h2 style="font-size:28px">Neighbours</h2><div class="eyebrow">Friends in the neighbourhood</div><div class="friends">`;
  const seen = new Set();
  UNITS.forEach((u, i) => {
    if (seen.has(u.npc)) return; seen.add(u.npc);
    const n = Math.max(...UNITS.filter(x => x.npc === u.npc).map(x => S.friends[x.id] || 0));
    const met = unitUnlocked(i);
    h += `<div class="friend"><div class="av" style="background:${met ? u.color : "var(--border)"}">${met ? esc(u.npc[0]) : "?"}</div><div><b>${met ? esc(u.npc) : "Not met yet"}</b>${hearts(n)}</div></div>`;
  });
  h += `</div><div class="eyebrow">Your friends' leaderboard</div><div class="card" id="lb">${Cloud.boardHtml()}</div>`;
  return h;
}
function screenProfile() {
  const units = UNITS.filter(unitDone).length;
  const cefr = units >= 15 ? "B1" : units >= 11 ? "A2+" : units >= 6 ? "A2" : units >= 1 ? "A1" : "Beginner";
  return `<h2 style="font-size:28px">Your progress</h2>
    <div class="kpis"><div class="kpi"><b>${S.xp}</b><span>total XP</span></div><div class="kpi"><b>${knownCount()}</b><span>known items</span></div><div class="kpi"><b>${cefr}</b><span>estimated level</span></div></div>
    <div class="card"><div class="eyebrow">Daily goal</div><p style="margin:.4em 0 .8em">How fast do you want to go? Intensive is about 45 minutes a day and covers the whole line in roughly 6 to 8 weeks.</p>
      <div class="chips" role="group" aria-label="Daily goal">${[[60, "Relaxed · 60 XP"], [150, "Serious · 150 XP"], [400, "Intensive · 400 XP"], [700, "All in · 700 XP"]].map(([v, l]) => `<button class="chip" data-goal="${v}" aria-pressed="${S.goal === v}">${l}</button>`).join("")}</div></div>
    <div class="card"><div class="eyebrow">Voice speed</div><div class="chips" style="margin-top:8px">${[[0.75, "Slower"], [0.95, "Normal"], [1.1, "Native"]].map(([v, l]) => `<button class="chip" data-rate="${v}" aria-pressed="${S.rate === v}">${l}</button>`).join("")}</div>
      <p class="muted" style="font-size:14px;margin:.6em 0 0">No sound on iPhone? Turn off silent mode. For a better voice, download a French voice in Settings › Accessibility › Spoken Content › Voices.</p></div>
    <div class="card"><div class="eyebrow">How Le Quartier teaches</div>
      <ul style="margin:.5em 0 0;padding-left:1.1em;display:grid;gap:6px">
        <li><b>No lives, no paywall.</b> Mistakes come back at the end of the lesson until you get them right.</li>
        <li><b>You produce French.</b> Most exercises have you type, build or say French, not just recognise it.</li>
        <li><b>Spaced repetition</b> brings each word back right before you'd forget it.</li>
        <li><b>Real conversations</b> with neighbours test what you learned in context.</li>
        <li><b>Skip tests</b> let you jump ahead when you already know something.</li>
      </ul></div>
    <div class="card"><div class="eyebrow">Sync</div><p style="margin:.4em 0 0" id="syncmsg">${Cloud.syncText()}</p></div>
    <div class="card"><div class="eyebrow">Start over</div><p style="margin:.4em 0 .8em">Erase all progress on this device.</p><button class="btn ghost" id="reset">Erase progress</button></div>`;
}
function render() {
  header();
  const m = $("#main");
  m.innerHTML = `<div class="wrap">${{ map: screenMap, review: screenReview, conj: screenConj, friends: screenFriends, profile: screenProfile }[TAB]()}</div>`;
  document.querySelectorAll(".tabs button").forEach(b => b.setAttribute("aria-current", b.dataset.tab === TAB ? "page" : "false"));
}
$("#tabs").innerHTML = [["map", "Quartier", ICON.map], ["review", "Review", ICON.cards], ["conj", "Verbs", ICON.grid], ["friends", "Neighbours", ICON.people], ["profile", "Me", ICON.user]]
  .map(([k, l, i]) => `<button data-tab="${k}">${i}${l}</button>`).join("");
document.addEventListener("click", ev => {
  const t = ev.target.closest("button,[data-close]"); if (!t || P) return;
  if (t.dataset.tab) { TAB = t.dataset.tab; render(); $("#main").scrollTop = 0; return; }
  if (t.hasAttribute("data-close")) return closeSheet();
  if (t.dataset.unit) return openUnit(+t.dataset.unit);
  if (t.dataset.lesson) { const [ui, li] = t.dataset.lesson.split(",").map(Number); return startSession("lesson", { ui, li }); }
  if (t.dataset.conv) return startSession("conv", { ui: +t.dataset.conv });
  if (t.dataset.test) return startSession("test", { ui: +t.dataset.test });
  if (t.dataset.go === "review") return startSession("review");
  if (t.dataset.go === "sprint") return startSession("sprint");
  if (t.dataset.go === "next") { const nx = nextLesson(); if (!nx) return startSession("review"); return nx.conv ? startSession("conv", { ui: nx.ui }) : startSession("lesson", nx); }
  if (t.dataset.tense) { CJ.tense = t.dataset.tense; return render(); }
  if (t.dataset.drill) return startSession("conj", { ...CJ });
  if (t.dataset.goal) { S.goal = +t.dataset.goal; save(); return render(); }
  if (t.dataset.rate) { S.rate = +t.dataset.rate; save(); speak("Bonjour, ça va ?"); return render(); }
  if (t.id === "reset") { if (t.dataset.armed) { S = fresh(); save(true); toast("Progress erased."); return render(); } t.dataset.armed = "1"; t.textContent = "Tap again to erase everything"; t.className = "btn bad"; return; }
});
document.addEventListener("change", ev => { if (ev.target.id === "cjverb") { CJ.inf = ev.target.value; render(); } });


/* ---------- cloud: sync + friends leaderboard (only inside Claude) ---------- */
const Cloud = {
  db: null, user: null, uid: null, board: null, names: {}, state: "local", queue: Promise.resolve(),
  async init() {
    if (!window.claude || typeof window.claude.use !== "function") return;
    try {
      const [db, user] = await Promise.all([window.claude.use("db"), window.claude.use("user")]);
      if (!db || !user) return;
      this.user = user; this.uid = await user.id();
      if (!this.uid) return;
      this.db = db; this.state = "on";
      const snap = await db.doc("data/users/" + this.uid + "/save").get().catch(() => null);
      if (snap && snap.exists) {
        const d = snap.data();
        if (d && d.updatedAt > S.updatedAt && d.json) { try { S = Object.assign(fresh(), JSON.parse(d.json)); localStorage.setItem(STORE_KEY, d.json); } catch (e) { } }
      }
      db.collection("board").orderBy("xp", "desc").limit(50).onSnapshot(async s => {
        this.board = s.docs.map(d => ({ id: d.id, ...d.data() }));
        try { const ps = await user.profiles(this.board.map(b => b.id)); for (const id in ps) this.names[id] = ps[id]; } catch (e) { }
        const lb = $("#lb"); if (lb) lb.innerHTML = this.boardHtml();
      }, () => { this.board = []; });
      if (!P) render();
    } catch (e) { this.state = "local"; }
  },
  push() {
    if (this.state !== "on") return;
    const snapshot = JSON.stringify(S), at = S.updatedAt;
    const entry = { xp: S.xp, level: level(), streak: S.streak, stations: UNITS.filter(unitDone).length, updated: Date.now() };
    this.queue = this.queue.then(async () => {
      try { await this.db.doc("data/users/" + this.uid + "/save").set({ json: snapshot, updatedAt: at }); } catch (e) { }
      try { await this.db.doc("board/" + this.uid).set(entry); } catch (e) { this.boardRO = true; }
    });
  },
  boardHtml() {
    if (this.state !== "on") return `<p style="margin:0">The shared leaderboard works when you open Le Quartier through its Claude link while signed in. Share the link with friends so you can see each other's XP and streaks.</p>`;
    if (!this.board) return `<p class="muted" style="margin:0">Loading…</p>`;
    if (!this.board.length) return `<p style="margin:0">No one is on the board yet. Finish a lesson to be first, then share this page with friends.</p>`;
    return `<div class="lb">${this.board.map((b, i) => { const p = this.names[b.id] || {}; const me = b.id === this.uid; return `<div class="lb-row ${me ? "me" : ""}"><span class="rk">${i + 1}</span>${p.avatarUrl ? `<img src="${esc(p.avatarUrl)}" alt="">` : `<span class="av" style="background:${esc(p.color || "#56617A")}">?</span>`}<span class="nm">${esc(p.name || "Neighbour")}${me ? " (you)" : ""}</span><span class="muted" style="font-size:13px">Lv ${+b.level || 1} · ${+b.streak || 0}d</span><b>${+b.xp || 0}</b></div>`; }).join("")}</div>
      ${this.boardRO ? `<p class="muted" style="font-size:13px;margin:.6em 0 0">Your score can't be posted with view-only access. Ask the owner to share the page with you as Contributor.</p>` : ""}`;
  },
  syncText() { return this.state === "on" ? "Your progress is saved to your Claude account and follows you to any device where you open this page." : "Progress is saved on this device. Open the Claude link while signed in to sync across devices."; }
};

/* ---------- boot ---------- */
render();
Cloud.init();
