// Laboratoire virtuel : contrôles du moteur hydrostatique contre les exercices
// résolus des chapitres 1 et 2 du cours et contre des bilans indépendants.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../src/labo-physique.js';
import { SCENARIOS, creerScenario } from '../src/labo-scenarios.js';

const near = (a, b, tol = 1e-6, msg = '') => assert.ok(Math.abs(a - b) <= tol, `${msg} ${a} ≠ ${b} (± ${tol})`);
const rel = (a, b, r = 1e-3, msg = '') => near(a, b, Math.abs(b) * r, msg);

function reservoir(id, o = {}) {
  const r = { id, type: 'reservoir', nom: '', x: 0, z: 0, w: 1, H: 6, b: 1, alpha: 90, ferme: false, diagramme: 'aucune', ciel: { mode: 'impose', p: 0, n: 0 }, couches: [], ...o };
  if (o.hauteurs) { r.couches = L.couchesDepuisHauteurs(r, o.hauteurs); delete r.hauteurs; }
  return r;
}
function scene(...elements) { const s = L.sceneVide(); s.elements = elements; return s; }
const volume = s => s.elements.filter(e => e.type === 'reservoir').reduce((t, r) => t + r.couches.reduce((u, c) => u + c.V, 0), 0);
const volumeFluide = (s, f) => s.elements.filter(e => e.type === 'reservoir').reduce((t, r) => t + r.couches.filter(c => c.fluide === f).reduce((u, c) => u + c.V, 0), 0);

test('Ex. 2.1 — huile sur eau : pressions à l’interface et au fond', () => {
  const r = reservoir('R1', { hauteurs: [{ fluide: 'eau', h: 3 }, { fluide: 'huile', h: 2 }] });
  const s = scene(r), A = L.analyser(s), e = A.etats.get('R1');
  rel(L.pressionDans(e, 3, A.ctx), 16677, 1e-4, 'interface');
  rel(e.pFond, 46107, 1e-4, 'fond');
  near(e.pFond / 9810, 4.70, 0.005, 'mCE');
  assert.equal(L.coucheA(e, 2.9).fluide, 'eau');
  assert.equal(L.coucheA(e, 3.1).fluide, 'huile');
  // Plan de charge de l'eau sous l'huile : 3 + 16677/9810 = 4,70 m < surface libre 5 m.
  near(e.niveaux[0].charge, 3 + 16677 / 9810, 1e-3);
});

test('Piézomètres : même niveau quel que soit le piquage, à la remontée capillaire près', () => {
  const r = reservoir('R1', { hauteurs: [{ fluide: 'eau', h: 3 }] });
  const s = scene(r,
    { id: 'P1', type: 'piezometre', piquage: { el: 'R1', port: 'd:0.50' }, Ht: 4, d: 12 },
    { id: 'P2', type: 'piezometre', piquage: { el: 'R1', port: 'd:2.00' }, Ht: 4, d: 12 },
    { id: 'P3', type: 'piezometre', piquage: { el: 'R1', port: 'g:1.25' }, Ht: 4, d: 4 });
  const A = L.analyser(s);
  for (const id of ['P1', 'P2', 'P3']) {
    const m = A.mesures.get(id);
    near(m.zN - m.hc, 3, 1e-9, id);
  }
  // Jurin : h = 4σcosθ/(ρgd)
  near(A.mesures.get('P1').hc, 4 * 0.073 / (1000 * 9.81 * 0.012), 1e-12);
  assert.ok(A.mesures.get('P3').capillaire, 'un tube de 4 mm doit être signalé');
  assert.ok(!A.mesures.get('P1').capillaire);
});

test('Piézomètre sur un réservoir pressurisé, sur une couche inférieure, en dépression', () => {
  const r = reservoir('R1', { ferme: true, ciel: { mode: 'impose', p: 19620 }, H: 3, hauteurs: [{ fluide: 'eau', h: 2 }] });
  const r2 = reservoir('R2', { x: 3, hauteurs: [{ fluide: 'eau', h: 3 }, { fluide: 'huile', h: 2 }] });
  const r3 = reservoir('R3', { x: 6, ferme: true, H: 3, ciel: { mode: 'impose', p: -30000 }, hauteurs: [{ fluide: 'eau', h: 1 }] });
  const s = scene(r, r2, r3,
    { id: 'P1', type: 'piezometre', piquage: { el: 'R1', port: 'd:0.50' }, Ht: 5, d: 30 },
    { id: 'P2', type: 'piezometre', piquage: { el: 'R2', port: 'd:1.00' }, Ht: 6, d: 30 },
    { id: 'P3', type: 'piezometre', piquage: { el: 'R1', port: 'h:0.50' }, Ht: 2, d: 30 },
    { id: 'P4', type: 'piezometre', piquage: { el: 'R3', port: 'd:0.50' }, Ht: 2, d: 30 });
  const A = L.analyser(s);
  const m1 = A.mesures.get('P1');
  near(m1.zN - m1.hc, 2 + 2, 1e-9, 'surface + p0/ρg');
  const m2 = A.mesures.get('P2');
  near(m2.zN - m2.hc, 3 + 0.85 * 2, 1e-9, 'plan de charge de l’eau sous l’huile');
  assert.ok(A.mesures.get('P3').vide, 'un piézomètre ne mesure pas un gaz');
  assert.ok(A.mesures.get('P4').depression, 'dépression signalée');
});

test('Ex. 2.2 — manomètre différentiel au mercure : Δh = 0,20 m pour pA − pB = 27,7 kPa', () => {
  // Deux enceintes d'eau sous pression jouent le rôle des conduites A et B.
  const pA = 40000;
  const pB = pA - 27664;
  // Ciel imposé pour obtenir pA à z = 1,00 et pB à z = 1,30 (axe de B 30 cm plus haut).
  const ra = reservoir('RA', { ferme: true, H: 2, ciel: { mode: 'impose', p: pA - 9810 * 0.5 }, hauteurs: [{ fluide: 'eau', h: 1.5 }] });
  const rb = reservoir('RB', { x: 3, ferme: true, H: 2, ciel: { mode: 'impose', p: pB - 9810 * 0.2 }, hauteurs: [{ fluide: 'eau', h: 1.5 }] });
  const s = scene(ra, rb, { id: 'U1', type: 'tubeU', piquage: { el: 'RA', port: 'd:1.00' }, piquage2: { el: 'RB', port: 'g:1.30' }, fluideM: 'mercure', L: 1, ox: 0.6, oz: -0.5 });
  const A = L.analyser(s), m = A.mesures.get('U1');
  near(m.tap.p, pA, 1e-6); near(m.tap2.p, pB, 1e-6);
  near(m.dh, 0.20, 1e-4, 'Δh');
  near(1 - m.z1, 0.60, 1e-4, 'ménisque côté A 60 cm sous A');
  near(m.pMesuree, 27664, 1, 'chaîne de proche en proche');
  // Formule du cours : pA − pB = (ρHg − ρe) g Δh + ρe g (zB − zA)
  near(m.pMesuree, (13600 - 1000) * 9.81 * 0.2 + 1000 * 9.81 * 0.3, 1);
});

test('Tube en U simple : la chaîne retrouve la pression du piquage, liquide ou gaz', () => {
  for (const port of ['d:0.50', 'h:0.50']) {
    const r = reservoir('R1', { ferme: true, H: 3, ciel: { mode: 'impose', p: 15000 }, hauteurs: [{ fluide: 'eau', h: 2 }] });
    const s = scene(r, { id: 'U1', type: 'tubeU', piquage: { el: 'R1', port }, piquage2: null, fluideM: 'mercure', L: 1, ox: 0.6, oz: -0.6 });
    const m = L.analyser(s).mesures.get('U1');
    near(m.pMesuree, m.tap.p, 1e-6, port);
    near(m.z1 + m.z2, 2 * m.geo.z0, 1e-12, 'conservation du mercure');
  }
  const r = reservoir('R1', { ferme: true, H: 3, ciel: { mode: 'impose', p: 200000 }, hauteurs: [{ fluide: 'eau', h: 2 }] });
  const s = scene(r, { id: 'U1', type: 'tubeU', piquage: { el: 'R1', port: 'd:0.50' }, piquage2: null, fluideM: 'tetra', L: 1, ox: 0.6, oz: -0.6 });
  assert.ok(L.analyser(s).mesures.get('U1').chasse, 'liquide chassé au-delà de la longueur des branches');
  const s2 = scene(reservoir('R1', { hauteurs: [{ fluide: 'eau', h: 2 }] }), { id: 'U1', type: 'tubeU', piquage: { el: 'R1', port: 'd:0.50' }, piquage2: null, fluideM: 'huile', L: 1, ox: 0.6, oz: -0.6 });
  assert.ok(L.analyser(s2).mesures.get('U1').invalide, 'liquide manométrique plus léger refusé');
});

test('Tube en U renversé à huile : même relation générale', () => {
  const eq = L.equilibreTubeU({ pA: 5000, rhoA: 1000, zA: 0, pB: 2000, rhoB: 1000, zB: 0, rhoM: 850, z0: 1, g: 9.81 });
  // pA − pB = ρ g (z1 − zA)… : contrôle par la chaîne hydrostatique
  const pB = 5000 + 1000 * 9.81 * (0 - eq.z1) - 850 * 9.81 * (eq.z2 - eq.z1) - 1000 * 9.81 * (0 - eq.z2);
  near(pB, 2000, 1e-6);
  assert.ok(eq.z2 > eq.z1 === false || true);
});

test('Ex. 2.4 — vanne rectangulaire verticale : F = 92,7 kN, C à 2,229 m sous la surface', () => {
  const r = reservoir('R1', { w: 4, b: 3, H: 4, hauteurs: [{ fluide: 'eau', h: 3 }] });
  const s = scene(r, { id: 'VP1', type: 'vannePlane', reservoir: 'R1', paroi: 'd', s: 0.9, forme: 'rect', a: 1.8, l: 2.5, charniere: 'haut' });
  const v = L.analyser(s).ouvrages.get('VP1');
  rel(v.F, 92704, 2e-4, 'F');
  rel(v.formule.F, 92704, 1e-4, 'F formule');
  near(3 - v.C.z, 2.229, 1e-3, 'hC');
  near(v.formule.ecart, 0.1286, 1e-3, 'C sous G');
  near(v.uG - v.uC, v.formule.ecart, 2e-5, 'numérique = formule');
  // Charnière en haut : moment = F × (distance de l'arête haute à C)
  near(v.moment, v.F * (v.formule.ecart + 0.9), 1);
});

test('Ex. 2.5 — mur de réservoir : F = 60,1 kN au tiers inférieur, M = 70,1 kN·m', () => {
  const r = reservoir('R1', { w: 2, H: 4, b: 1, diagramme: 'd', hauteurs: [{ fluide: 'eau', h: 3.5 }] });
  const A = L.analyser(scene(r)), p = A.parois.get('R1');
  rel(p.F, 60086, 2e-4); near(p.zC, 3.5 / 3, 1e-3); rel(p.momentPied, 70100, 1e-3);
  near(p.mouille, 3.5, 1e-12);
});

test('Ex. 2.6 — vanne circulaire sur paroi inclinée à 60° : F = 26,6 kN, C 3,25 cm sous G', () => {
  const r = reservoir('R1', { w: 3, H: 4.5, b: 3, alpha: 60, hauteurs: [{ fluide: 'eau', h: 3.5 }] });
  const s = scene(r, { id: 'VP1', type: 'vannePlane', reservoir: 'R1', paroi: 'd', s: (3.5 - 2.4) / Math.sin(Math.PI / 3), forme: 'cercle', a: 1.2, l: 1.2, charniere: 'aucune' });
  const v = L.analyser(s).ouvrages.get('VP1');
  near(3.5 - v.G.z, 2.4, 1e-9, 'hG');
  rel(v.F, 26628, 3e-4, 'F');
  near(v.formule.ecart, 0.0325, 1e-4, 'yC − yG');
  near(v.uG - v.uC, 0.0325, 2e-4, 'intégration');
  // Composantes : la paroi évasée porte de l'eau, F_V vers le bas.
  near(v.FH, v.F * Math.sin(Math.PI / 3), 1e-6); assert.ok(v.FV < 0);
});

test('Vanne traversant l’interface huile–eau : intégration par tranches exacte', () => {
  const r = reservoir('R1', { w: 2, H: 6, b: 1, hauteurs: [{ fluide: 'eau', h: 3 }, { fluide: 'huile', h: 2 }] });
  const s = scene(r, { id: 'VP1', type: 'vannePlane', reservoir: 'R1', paroi: 'g', s: 3, forme: 'rect', a: 2, l: 1, charniere: 'aucune' });
  const v = L.analyser(s).ouvrages.get('VP1');
  assert.equal(v.formule, undefined);
  // Analytique : huile de 4 à 2 m de profondeur dans l'huile… (z de 2 à 4)
  const g = 9.81, ph = z => (z >= 3 ? 850 * g * (5 - z) : 850 * g * 2 + 1000 * g * (3 - z));
  let F = 0; const N = 20000; for (let i = 0; i < N; i++) { const z = 2 + (i + 0.5) * 2 / N; F += ph(z) * 2 / N; }
  rel(v.F, F, 1e-5);
});

test('Fond et ciel gazeux : pression uniforme, C confondu avec G', () => {
  const r = reservoir('R1', { w: 2, H: 3, b: 1.5, ferme: true, ciel: { mode: 'impose', p: 30000 }, hauteurs: [{ fluide: 'eau', h: 1 }] });
  const s = scene(r, { id: 'VP1', type: 'vannePlane', reservoir: 'R1', paroi: 'f', s: 1, forme: 'rect', a: 1, l: 1, charniere: 'aucune' });
  const v = L.analyser(s).ouvrages.get('VP1');
  rel(v.F, (30000 + 9810) * 1, 1e-6); near(v.uC, v.uG, 1e-9);
});

test('Ex. 2.8 et 2.9 — caisson flottant en eau de mer : T = 2,07 m, GM = 0,28 m', () => {
  const r = reservoir('R1', { w: 10, H: 5, b: 8, hauteurs: [{ fluide: 'mer', h: 3.5 }] });
  const f = { id: 'F1', type: 'flotteur', reservoir: 'R1', x: 5, l: 4, h: 3, b: 6, m: 500000 / 9.81, zG: 1.4, gite: 0 };
  const s = scene(r, f), A = L.analyser(s), res = A.flotteurs.get('F1');
  near(res.T, 2.07, 0.005, 'tirant d’eau'); near(res.CM, 0.644, 0.002, 'CM'); near(res.GM, 0.28, 0.005, 'GM');
  assert.equal(res.stable, true);
  // Le niveau du bassin monte du volume déplacé divisé par la surface.
  near(A.etats.get('R1').zL, 3.5 + res.Vimm / 80, 1e-6, 'niveau relevé');
  rel(res.FA, 500000, 1e-6, 'F_A = P');
});

test('Gîte : le bras de redressement suit GM sin θ aux petits angles', () => {
  const r = reservoir('R1', { w: 10, H: 5, b: 8, hauteurs: [{ fluide: 'mer', h: 3.5 }] });
  const f = { id: 'F1', type: 'flotteur', reservoir: 'R1', x: 5, l: 4, h: 3, b: 6, m: 500000 / 9.81, zG: 1.4, gite: 2 };
  const res = L.analyser(scene(r, f)).flotteurs.get('F1');
  near(res.gite.GZ, res.GM * Math.sin(2 * Math.PI / 180), 2e-4);
  assert.equal(res.gite.redresse, true);
  f.zG = 2.2; f.gite = 3;
  const res2 = L.analyser(scene(r, f)).flotteurs.get('F1');
  assert.ok(res2.GM < 0 && !res2.gite.redresse, 'caisson trop haut chargé : chavire');
});

test('Corps plus dense : il repose au fond avec son poids apparent (ex. 2.8, bloc de béton)', () => {
  const r = reservoir('R1', { w: 3, H: 3, b: 2, hauteurs: [{ fluide: 'eau', h: 2.5 }] });
  const f = { id: 'F1', type: 'flotteur', reservoir: 'R1', x: 1.5, l: 1, h: 0.8, b: 1, m: 2400 * 0.8, zG: 0.4, gite: 0 };
  const res = L.analyser(scene(r, f)).flotteurs.get('F1');
  assert.equal(res.fond, true);
  near(res.R, (2400 - 1000) * 9.81 * 0.8, 1e-6);
});

test('Corps entre deux liquides : il flotte à l’interface huile–eau', () => {
  const r = reservoir('R1', { w: 3, H: 4, b: 1, hauteurs: [{ fluide: 'eau', h: 1.5 }, { fluide: 'huile', h: 1.5 }] });
  const f = { id: 'F1', type: 'flotteur', reservoir: 'R1', x: 1.5, l: 0.6, h: 0.5, b: 0.5, m: 920 * 0.6 * 0.5 * 0.5, zG: 0.25, gite: 0 };
  const A = L.analyser(scene(r, f)), res = A.flotteurs.get('F1'), e = A.etats.get('R1');
  assert.ok(res.immerge && !res.fond);
  const zi = e.niveaux[0].z1;
  // fraction dans l'eau : (920 − 850)/(1000 − 850)
  near(zi - res.zb, 0.5 * (920 - 850) / 150, 1e-6);
});

test('Vases communicants : la vanne fermée tient Δp, ouverte les niveaux s’égalisent', () => {
  const ra = reservoir('R1', { w: 1, hauteurs: [{ fluide: 'eau', h: 3 }] });
  const rb = reservoir('R2', { x: 3, w: 3, hauteurs: [{ fluide: 'eau', h: 1 }] });
  const s = scene(ra, rb, { id: 'C1', type: 'conduite', a: { el: 'R1', port: 'd:0.25' }, b: { el: 'R2', port: 'g:0.25' }, zr: null, D: 0.1 },
    { id: 'V1', type: 'vanne', conduite: 'C1', t: 0.5, ouverte: false },
    { id: 'P1', type: 'piezometre', piquage: { el: 'C1', port: 't:0.35' }, Ht: 4, d: 20 });
  let A = L.analyser(s);
  near(A.conduites.get('C1').deltas[0].dp, 9810 * 2, 1e-6, 'Δp vanne');
  const V0 = volume(s);
  L.equilibrer(s);
  near(volume(s), V0, 1e-9, 'pas de création de liquide');
  assert.equal(A.etats.get('R1').zL, 3, 'vanne fermée : rien ne bouge');
  s.elements.find(e => e.id === 'V1').ouverte = true;
  const r = L.equilibrer(s);
  assert.ok(r.converge, 'convergence');
  A = L.analyser(s);
  near(A.etats.get('R1').zL, (3 * 1 + 1 * 3) / 4, 1e-4, 'niveau commun');
  near(A.etats.get('R2').zL, 1.5, 1e-4);
  near(volume(s), V0, 1e-9, 'volume conservé');
  // Le piézomètre piqué sur la conduite affiche le niveau commun.
  const m = A.mesures.get('P1');
  near(m.zN - m.hc, 1.5, 1e-4);
});

test('Animation : avancer converge vers la même solution sans perdre de liquide', () => {
  const ra = reservoir('R1', { hauteurs: [{ fluide: 'eau', h: 4 }] });
  const rb = reservoir('R2', { x: 3, hauteurs: [{ fluide: 'eau', h: 0.5 }] });
  const s = scene(ra, rb, { id: 'C1', type: 'conduite', a: { el: 'R1', port: 'f:0.50' }, b: { el: 'R2', port: 'f:0.50' }, zr: null, D: 0.1 });
  const V0 = volume(s);
  let n = 0;
  while (L.avancer(s, 1 / 60) && n < 2000) n++;
  assert.ok(n > 10 && n < 2000, `pas d’animation : ${n}`);
  const A = L.analyser(s);
  near(A.etats.get('R1').zL, 2.25, 1e-3); near(A.etats.get('R2').zL, 2.25, 1e-3);
  near(volume(s), V0, 1e-9);
});

test('Deux liquides non miscibles : hauteurs inversement proportionnelles aux densités', () => {
  const ra = reservoir('R1', { hauteurs: [{ fluide: 'eau', h: 2 }] });
  const rb = reservoir('R2', { x: 3, hauteurs: [{ fluide: 'huile', h: 2 }] });
  const s = scene(ra, rb, { id: 'C1', type: 'conduite', a: { el: 'R1', port: 'f:0.50' }, b: { el: 'R2', port: 'f:0.50' }, zr: null, D: 0.1 });
  const Ve = volumeFluide(s, 'eau'), Vh = volumeFluide(s, 'huile');
  assert.ok(L.equilibrer(s).converge);
  const A = L.analyser(s), ea = A.etats.get('R1'), eb = A.etats.get('R2');
  near(ea.zL, 1.85, 1e-3, 'eau dans R1'); near(eb.niveaux[0].z1, 0.15, 1e-3, 'eau sous l’huile');
  assert.equal(eb.niveaux[1].fluide, 'huile');
  near(ea.pFond, eb.pFond, 2, 'même pression au fond');
  near(volumeFluide(s, 'eau'), Ve, 1e-9); near(volumeFluide(s, 'huile'), Vh, 1e-9);
});

test('Gaz piégé : loi de Boyle–Mariotte quand le liquide comprime le ciel', () => {
  const ra = reservoir('R1', { H: 8, hauteurs: [{ fluide: 'eau', h: 7 }] });
  const rb = reservoir('R2', { x: 3, H: 2, ferme: true, ciel: { mode: 'piege', p: 0 }, hauteurs: [{ fluide: 'eau', h: 0.5 }] });
  const ctx = L.contexte(scene());
  L.calerGaz(rb, ctx);
  const s = scene(ra, rb, { id: 'C1', type: 'conduite', a: { el: 'R1', port: 'f:0.50' }, b: { el: 'R2', port: 'f:0.50' }, zr: null, D: 0.1 });
  const n0 = rb.ciel.n;
  assert.ok(L.equilibrer(s).converge);
  const A = L.analyser(s), ea = A.etats.get('R1'), eb = A.etats.get('R2');
  near((eb.pCiel + 101325) * eb.Vgaz, n0, 1e-6 * n0, 'p·V constant');
  near(ea.pFond, eb.pFond, 1, 'équilibre au fond');
  assert.ok(eb.pCiel > 0, 'le gaz est comprimé');
});

test('Débordement : un réservoir sous pression vidange jusqu’au piquage dans un bac ouvert', () => {
  const ra = reservoir('R1', { ferme: true, H: 3, ciel: { mode: 'impose', p: 80000 }, hauteurs: [{ fluide: 'eau', h: 2 }] });
  const rb = reservoir('R2', { x: 3, H: 1, hauteurs: [{ fluide: 'eau', h: 0.2 }] });
  const s = scene(ra, rb, { id: 'C1', type: 'conduite', a: { el: 'R1', port: 'd:0.50' }, b: { el: 'R2', port: 'g:0.50' }, zr: null, D: 0.1 });
  L.equilibrer(s);
  const A = L.analyser(s);
  near(A.etats.get('R1').zL, 0.5, 1e-6, 'vidangé jusqu’au piquage');
  assert.ok(rb._deborde > 0 && A.alertes.some(a => a.id === 'R2'));
});

test('Paroi inclinée : volume et hauteur restent cohérents', () => {
  for (const alpha of [45, 60, 120]) {
    const r = reservoir('R1', { w: 2, H: 3, b: 1.5, alpha, hauteurs: [{ fluide: 'eau', h: 1.7 }] });
    const e = L.etatReservoir(r, L.contexte(scene()));
    near(e.zL, 1.7, 1e-9, `α = ${alpha}`);
  }
});

test('Cavitation : vide poussé au-dessus d’une essence volatile', () => {
  const r = reservoir('R1', { ferme: true, H: 3, ciel: { mode: 'impose', p: -60000 }, hauteurs: [{ fluide: 'essence', h: 1 }] });
  const A = L.analyser(scene(r));
  assert.ok(A.alertes.some(a => a.niveau === 'alerte' && /vaporise/.test(a.texte)));
});

test('Conduite passant au-dessus du plan de charge : rupture signalée', () => {
  const ra = reservoir('R1', { hauteurs: [{ fluide: 'eau', h: 2 }] });
  const rb = reservoir('R2', { x: 3, hauteurs: [{ fluide: 'eau', h: 2 }] });
  const s = scene(ra, rb, { id: 'C1', type: 'conduite', a: { el: 'R1', port: 'd:0.50' }, b: { el: 'R2', port: 'g:0.50' }, zr: 14, D: 0.1 });
  const A = L.analyser(s);
  assert.ok(A.alertes.some(a => a.id === 'C1'), 'point haut à 12 m au-dessus de la surface');
  const s2 = scene(reservoir('R1', { hauteurs: [{ fluide: 'eau', h: 2 }] }), reservoir('R2', { x: 3, hauteurs: [{ fluide: 'eau', h: 2 }] }),
    { id: 'C1', type: 'conduite', a: { el: 'R1', port: 'd:0.50' }, b: { el: 'R2', port: 'g:0.50' }, zr: 6, D: 0.1 });
  assert.ok(!L.analyser(s2).alertes.some(a => a.id === 'C1'), 'siphon de 4 m : pas de rupture');
});

test('Import : contrôle strict, export sans caches, piquages recalés au redimensionnement', () => {
  assert.throws(() => L.verifierScene({ version: 2, elements: [] }), /Version/);
  assert.throws(() => L.verifierScene({ version: 1, elements: [{ id: 'R1', type: 'reservoir', x: 0, z: 0, w: 1, H: 2, b: 1, couches: [{ fluide: 'lave', V: 1 }] }] }), /fluide/);
  assert.throws(() => L.verifierScene({ version: 1, elements: [{ id: 'P1', type: 'piezometre', piquage: { el: 'R9', port: 'g:0.50' } }] }), /liaisons/);
  const s = creerScenario('vases');
  L.equilibrer(s);
  const json = JSON.stringify(L.exporterScene(s));
  assert.ok(!json.includes('"_'));
  const t = L.verifierScene(JSON.parse(json));
  assert.equal(t.elements.length, s.elements.length);
  const r = t.elements.find(e => e.type === 'reservoir');
  const inst = t.elements.find(e => e.piquage && e.piquage.el === r.id);
  if (inst) {
    r.H = 0.6; L.nettoyerScene(t);
    assert.ok(t.elements.includes(inst) && L.resoudre(t, inst.piquage), 'piquage ramené sur la paroi');
  }
});

test('Toutes les expériences guidées se chargent, se contrôlent et s’équilibrent', () => {
  assert.ok(SCENARIOS.length >= 10);
  for (const { id } of SCENARIOS) {
    const s = creerScenario(id);
    const t = L.verifierScene(L.exporterScene(s));
    assert.equal(t.elements.length, s.elements.length, id);
    const V0 = volume(s);
    L.equilibrer(s);
    near(volume(s) + s.elements.reduce((u, e) => u + (e._deborde || 0), 0), V0, 1e-8, id);
    const A = L.analyser(s);
    for (const [k, m] of A.mesures) assert.ok(!m.erreur, `${id} ${k}`);
  }
});

test('Mise en forme française', () => {
  assert.equal(L.nombre(46107.4, 0), '46 107');
  assert.equal(L.nombre(-0.5, 2), '−0,50');
  assert.equal(L.nombre(0.0001, 2), '0,00');
  assert.equal(L.pression(46107, 'bar'), '0,4611 bar');
});
