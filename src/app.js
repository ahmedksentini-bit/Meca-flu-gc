import { solve, isClose } from "./solvers.js";

const app = document.querySelector("#app");
const state = { catalog: null, exercise: null, mode: "learn", data: {}, attempts: {}, timer: null, seconds: 0, installPrompt: null };
const modes = { learn: "Apprentissage", train: "Entraînement", exam: "Examen" };

const esc = value => String(value).replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
const parse = value => Number(String(value).trim().replace(",", ".").replace(/\s/g, ""));
const randomValue = v => Number((Math.round((v.min + Math.random() * (v.max - v.min)) / v.step) * v.step).toFixed(8));
const formatTime = seconds => `${String(Math.floor(seconds / 60)).padStart(2,"0")}:${String(seconds % 60).padStart(2,"0")}`;
const toast = text => { const el = document.querySelector("#toast"); el.textContent = text; el.classList.add("show"); setTimeout(() => el.classList.remove("show"), 1800); };

function home() {
  stopTimer(); state.exercise = null;
  app.innerHTML = `<section class="hero"><p class="eyebrow">Mécanique des fluides · Génie civil</p><h1>Comprendre, calculer, vérifier.</h1><p>Des exercices paramétriques fidèles au polycopié, avec unités, validation tolérante et correction raisonnée.</p></section><div class="section-title"><div><h2>Choisir un chapitre</h2><p>Six familles représentatives pour la V2.</p></div></div><section class="chapter-grid">${state.catalog.chapters.map(ch => { const count = state.catalog.exercises.filter(e => e.chapter === ch.id).length; return `<button class="chapter" data-chapter="${ch.id}"><span class="num">${ch.number}</span><h3>${esc(ch.title)}</h3><p>${esc(ch.description)}</p><span class="count">${count} exercice pilote →</span></button>`; }).join("")}</section>`;
  document.querySelectorAll("[data-chapter]").forEach(button => button.addEventListener("click", () => openExercise(state.catalog.exercises.find(e => e.chapter === button.dataset.chapter))));
  history.replaceState({}, "", location.pathname);
}

function openExercise(exercise, mode = state.mode) {
  stopTimer(); state.exercise = exercise; state.mode = mode; state.attempts = {};
  state.data = Object.fromEntries(exercise.variables.map(v => [v.key, mode === "learn" ? v.value : randomValue(v)]));
  renderExercise();
  if (mode === "exam") startTimer();
  history.replaceState({}, "", `#${exercise.id}`);
}

function renderExercise() {
  const e = state.exercise, chapter = state.catalog.chapters.find(c => c.id === e.chapter);
  app.innerHTML = `<section class="exercise-head"><div><button class="back" id="back">← Tous les chapitres</button><h1>${esc(e.title)}</h1><p>Chapitre ${chapter.number} · Niveau ${e.difficulty}</p></div><div><div class="mode-switch" aria-label="Mode de travail">${Object.entries(modes).map(([key,label]) => `<button data-mode="${key}" class="${state.mode===key?"active":""}">${label}</button>`).join("")}</div><div id="clock" class="exam-clock">${state.mode === "exam" ? "Temps 00:00" : ""}</div></div></section><section class="workspace"><div><article class="card"><h2>Énoncé</h2><p class="statement">${esc(e.statement)}</p><div class="data-grid">${e.variables.map(v => `<div class="field"><label for="v_${v.key}">${esc(v.label)}</label><div class="input-wrap"><input id="v_${v.key}" data-variable="${v.key}" type="number" step="any" value="${state.data[v.key]}" ${state.mode === "exam" ? "readonly" : ""}><span class="unit">${v.unit}</span></div></div>`).join("")}</div><div class="actions">${state.mode !== "learn" ? `<button class="secondary" id="randomize">↻ Nouvelles données</button>` : ""}</div></article><article class="card"><h2>Schéma de principe</h2><div class="diagram">${diagram(e.solver)}</div></article></div><div><article class="card"><h2>${state.mode === "exam" ? "Votre copie" : "Résolution guidée"}</h2><div id="questions">${e.questions.map((q,i) => question(q,i)).join("")}</div><div class="actions"><button class="primary" id="submitAll">${state.mode === "exam" ? "Rendre la copie" : "Tout vérifier"}</button>${state.mode !== "exam" ? `<button class="secondary" id="showCorrection">Voir la correction</button>` : ""}</div><div id="score"></div></article><article class="card correction" id="correction" hidden></article></div></section>`;
  bindExerciseEvents();
}

function question(q, i) { return `<div class="question"><div class="question-title">${i+1}. ${esc(q.label)}</div><div class="answer-row"><div class="input-wrap"><input id="a_${q.key}" data-answer="${q.key}" inputmode="decimal" autocomplete="off" placeholder="Votre réponse"><span class="unit">${q.unit}</span></div>${state.mode !== "exam" ? `<button class="ghost" data-check="${q.key}">Vérifier</button>` : ""}</div><p class="feedback" id="f_${q.key}"></p></div>`; }

function readData() { state.exercise.variables.forEach(v => state.data[v.key] = parse(document.querySelector(`#v_${v.key}`).value)); }
function check(key) {
  readData(); const target = solve(state.exercise, state.data).values[key], input = document.querySelector(`#a_${key}`), value = parse(input.value), feedback = document.querySelector(`#f_${key}`);
  state.attempts[key] = (state.attempts[key] || 0) + 1;
  const correct = isClose(value, target); feedback.className = `feedback ${correct ? "good" : "bad"}`;
  feedback.innerHTML = correct ? "✓ Correct — unité et ordre de grandeur cohérents." : `✕ À revoir.${state.mode === "learn" && state.attempts[key] > 1 ? `<span class="hint">Indice : commencez par convertir toutes les données en SI et écrivez la relation littérale.</span>` : ""}`;
  return correct;
}
function submitAll() {
  const correct = state.exercise.questions.filter(q => check(q.key)).length, total = state.exercise.questions.length, score = 20 * correct / total;
  document.querySelector("#score").innerHTML = `<p class="score">Résultat : ${correct}/${total} — ${score.toLocaleString("fr-FR",{maximumFractionDigits:1})}/20</p>`;
  if (state.mode === "exam") { stopTimer(); showCorrection(); document.querySelector("#showCorrection")?.remove(); }
}
function showCorrection() {
  readData(); const result = solve(state.exercise, state.data), box = document.querySelector("#correction");
  box.hidden = false; box.innerHTML = `<h2>Correction pas à pas</h2>${result.steps.map((s,i) => `<div class="solution-step" data-step="${i+1}"><h3>${esc(s[0])}</h3><p class="formula">${esc(s[1])}</p></div>`).join("")}<div class="final-result"><strong>Résultats :</strong><br>${state.exercise.questions.map(q => `${esc(q.label)} = <strong>${Number(result.values[q.key]).toLocaleString("fr-FR",{maximumSignificantDigits:5})} ${q.unit}</strong>`).join("<br>")}</div>`; box.scrollIntoView({behavior:"smooth",block:"start"});
}
function bindExerciseEvents() {
  document.querySelector("#back").addEventListener("click", home);
  document.querySelectorAll("[data-mode]").forEach(b => b.addEventListener("click", () => openExercise(state.exercise, b.dataset.mode)));
  document.querySelectorAll("[data-variable]").forEach(input => input.addEventListener("change", () => { readData(); document.querySelector("#correction").hidden = true; }));
  document.querySelectorAll("[data-check]").forEach(b => b.addEventListener("click", () => check(b.dataset.check)));
  document.querySelector("#submitAll").addEventListener("click", submitAll);
  document.querySelector("#showCorrection")?.addEventListener("click", showCorrection);
  document.querySelector("#randomize")?.addEventListener("click", () => openExercise(state.exercise, state.mode));
}

function diagram(type) {
  const common = `viewBox="0 0 520 190" role="img" aria-label="Schéma de principe"`;
  if (type === "venturi") return `<svg ${common}><path d="M20 45h145l80 35h75l80-35h100v100H400l-80-35h-75l-80 35H20z" fill="#7dd3fc" stroke="#0369a1" stroke-width="4"/><path d="M110 145v25h250v-60" fill="none" stroke="#475569" stroke-width="7"/><path d="M130 164h210" stroke="#d97706" stroke-width="12"/><text x="80" y="35">1</text><text x="275" y="70">2</text></svg>`;
  if (type === "manometer") return `<svg ${common}><path d="M150 30v105q0 35 35 35h150q35 0 35-35V30" fill="none" stroke="#475569" stroke-width="18"/><path d="M159 95v40q0 26 26 26h150q26 0 26-26V70" fill="none" stroke="#d97706" stroke-width="12"/><text x="105" y="35">p₁</text><text x="380" y="35">p₂</text></svg>`;
  if (type === "planeForce") return `<svg ${common}><path d="M30 35h280v135H30z" fill="#bae6fd"/><path d="M310 25v150" stroke="#334155" stroke-width="12"/><path d="M80 48h210M80 80h210M80 112h210M80 144h210" stroke="#0284c7" stroke-width="2"/><path d="M130 55h150M130 90h150M130 130h150" stroke="#0f766e" stroke-width="4" marker-end="url(#a)"/><defs><marker id="a" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0l6 3-6 3z" fill="#0f766e"/></marker></defs></svg>`;
  if (type === "jetPlate") return `<svg ${common}><path d="M30 85h270" stroke="#0284c7" stroke-width="28"/><path d="M310 25v140" stroke="#334155" stroke-width="14"/><path d="M300 90q60-5 90-55M300 100q60 5 90 55" fill="none" stroke="#7dd3fc" stroke-width="13"/><text x="120" y="70">V</text></svg>`;
  return `<svg ${common}><path d="M30 55h450v80H30z" fill="#bae6fd" stroke="#475569" stroke-width="7"/><path d="M70 95h360" stroke="#0284c7" stroke-width="4" stroke-dasharray="12 8"/><text x="205" y="45">L · D · ε</text></svg>`;
}
function startTimer() { state.seconds = 0; state.timer = setInterval(() => { state.seconds++; const clock = document.querySelector("#clock"); if (clock) clock.textContent = `Temps ${formatTime(state.seconds)}`; }, 1000); }
function stopTimer() { clearInterval(state.timer); state.timer = null; }

document.querySelector("#homeButton").addEventListener("click", home);
window.addEventListener("beforeinstallprompt", event => { event.preventDefault(); state.installPrompt = event; const b = document.querySelector("#installButton"); b.hidden = false; b.onclick = async () => { await state.installPrompt.prompt(); b.hidden = true; }; });
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));

try { state.catalog = await fetch("./data/exercises.json").then(r => { if (!r.ok) throw new Error(); return r.json(); }); const requested = state.catalog.exercises.find(e => `#${e.id}` === location.hash); requested ? openExercise(requested) : home(); }
catch { app.innerHTML = `<section class="card"><h1>Chargement impossible</h1><p>Lancez l’application depuis un serveur web local ou depuis Cloudflare Pages.</p></section>`; }
