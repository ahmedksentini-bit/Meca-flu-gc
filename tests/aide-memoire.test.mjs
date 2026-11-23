// L aide-memoire imprime ses resultats en dur dans le HTML. Sans garde-fou, une
// retouche des solveurs laisserait la page afficher d anciens chiffres sans que
// rien ne le signale. On verifie donc que la page, le catalogue et le moteur
// racontent la meme chose.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { solvers } from "../src/solvers.js";

const racine = new URL("../", import.meta.url);
const page = readFileSync(new URL("aide-memoire.html", racine), "utf8");
const catalogue = JSON.parse(readFileSync(new URL("data/exercises.json", racine), "utf8"));
const sw = readFileSync(new URL("sw.js", racine), "utf8");

// Les donnees des deux exercices corriges, telles que l enonce de la page les pose.
const A = { D: 150, L: 250, Q: 30, eps: 0.1, nu: 1, Ksum: 6.5 };
const B = { D: 200, L: 400, H: 12, eps: 0.15, nu: 1, Ksum: 4.5 };

const valeurs = e => Object.fromEntries(e.variables.map(v => [v.key, v.value]));

test("les exercices 6.8 et 6.9 existent et portent les donnees de l aide-memoire", () => {
  const ex68 = catalogue.exercises.find(e => e.id === "LOSSES_TOTAL_03");
  const ex69 = catalogue.exercises.find(e => e.id === "LOSSES_INVERSE_04");
  assert.ok(ex68 && ex69, "les deux exercices doivent etre au catalogue");
  assert.equal(ex68.solver, "totalLosses");
  assert.equal(ex69.solver, "flowFromHead");
  assert.equal(ex68.chapter, "losses");
  assert.equal(ex69.chapter, "losses");
  assert.deepEqual(valeurs(ex68), A, "exercice 6.8 : les valeurs par defaut doivent etre celles du corrige A");
  assert.deepEqual(valeurs(ex69), B, "exercice 6.9 : les valeurs par defaut doivent etre celles du corrige B");
  // Chaque question du catalogue doit correspondre a une grandeur que le solveur rend.
  for (const [ex, donnees] of [[ex68, A], [ex69, B]]) {
    const rendu = solvers[ex.solver](donnees).values;
    for (const q of ex.questions) {
      assert.ok(Number.isFinite(rendu[q.key]), `${ex.id} : le solveur ne rend pas « ${q.key} »`);
    }
  }
});

test("les resultats imprimes dans la page sont ceux du moteur", () => {
  const a = solvers.totalLosses(A).values;
  const b = solvers.flowFromHead(B).values;
  // Chaque couple : ce que la page affiche, et la valeur que le moteur doit produire.
  const attendus = [
    ["V = Q / S = 0,030 / 0,017671 = 1,6977 m/s", a.V, 1.6977],
    ["= 32,15 × 0,14689 = 4,722 m", a.hLin, 4.722],
    ["h_sing = ΣK · V²/(2g) = 6,50 × 0,14689 = 0,9548 m", a.hSing, 0.9548],
    ["h_t = h_lin + h_sing = 4,722 + 0,955 = 5,677 m", a.hTot, 5.677],
    ["L_eq = ΣK · D / λ = 6,50 × 0,150 / 0,019289 = 50,5 m", A.Ksum * A.D / 1000 / a.f, 50.5],
    ["Q = V · S = 2,348 × 0,031416 = 0,07376 m³/s = 73,8 L/s", b.Q, 73.8],
    ["V = 2,348 m/s", b.V, 2.348],
  ];
  for (const [texte, calcule, imprime] of attendus) {
    assert.ok(page.includes(texte), `la page n affiche plus : « ${texte} »`);
    const ecart = Math.abs(calcule - imprime) / Math.abs(imprime);
    assert.ok(ecart < 2e-3, `« ${texte} » : la page dit ${imprime}, le moteur ${calcule}`);
  }
  // Les lambda convergés, cites a quatre chiffres dans les deux corriges.
  assert.ok(page.includes("0,019 289"), "lambda de l exercice A");
  assert.ok(Math.abs(a.f - 0.019289) < 1e-6, `lambda A = ${a.f}`);
  assert.ok(page.includes("0,019 106"), "lambda de l exercice B");
  assert.ok(Math.abs(b.f - 0.019106) < 1e-6, `lambda B = ${b.f}`);
});

test("la page est precachee et relie au reste de l application", () => {
  assert.ok(sw.includes("'./aide-memoire.html'"), "l aide-memoire doit etre dans le precache");
  const app = readFileSync(new URL("src/app.js", racine), "utf8");
  assert.ok(app.includes('href="aide-memoire.html"'), "une carte Ressources doit pointer vers la page");
  for (const lien of ["exerciseur.html", "labo.html", "cours.html"]) {
    assert.ok(page.includes(lien), `la page doit renvoyer vers ${lien}`);
  }
});

test("le diagramme de Moody est bien trace par Colebrook", () => {
  // Douze familles de rugosite, la droite laminaire et la frontiere du regime rugueux.
  assert.equal((page.match(/class="cb"/g) || []).length, 12, "douze courbes de rugosite attendues");
  assert.ok(page.includes('class="lam"') && page.includes('class="front"'));
  // Les points sont calcules : on verifie qu un point au hasard de la courbe eps/D = 0,05
  // tombe bien sur l asymptote rugueuse de Colebrook (lambda constant a droite).
  const rugueux = (() => {
    let f = 0.02;
    for (let i = 0; i < 60; i++) f = Math.pow(-2 * Math.log10(0.05 / 3.7), -2);
    return f;
  })();
  assert.ok(rugueux > 0.07 && rugueux < 0.08, `asymptote rugueuse eps/D=0,05 : ${rugueux}`);
  // Aucun exposant mal forme : « 10¯4 » au lieu de « 10⁻⁴ » dans les etiquettes.
  assert.ok(!/·10⁻\d/.test(page), "les exposants des etiquettes doivent etre en chiffres superieurs");
});
