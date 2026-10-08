// Laboratoire virtuel, écoulements en charge : contrôles contre les exercices
// résolus des chapitres 3, 4 et 6.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as P from '../src/labo-physique.js';
import * as E from '../src/labo-ecoulement.js';
import { creerScenario, SCENARIOS } from '../src/labo-scenarios.js';

const near = (a, b, tol, msg = '') => assert.ok(Math.abs(a - b) <= tol, `${msg} ${a} ≠ ${b} (± ${tol})`);
const rel = (a, b, r, msg = '') => near(a, b, Math.abs(b) * r, msg);
const chaine = A => A.ecoulement.chaines.find(c => c.Q > 0);
const volume = s => s.elements.filter(e => e.type === 'reservoir' && !e.constant).reduce((t, r) => t + r.couches.reduce((u, c) => u + c.V, 0), 0);

test('Ex. 4.2 — Torricelli : 8,86 m/s, 10,8 L/s, portée 4,80 m', () => {
  const A = E.analyserTout(creerScenario('torricelli')), o = A.ecoulement.orifices.get('O1');
  near(o.h, 4, 1e-9, 'charge'); near(o.Vth, 8.86, 0.005, 'V théorique');
  rel(o.Q, 0.01079, 3e-3, 'débit'); near(o.jet.portee, 4.80, 0.01, 'portée');
});

test('Ex. 4.3 — vidange de 4 m à 1 m au-dessus de l’orifice en 1 166 s', () => {
  const s = creerScenario('vidange'), r = s.elements.find(e => e.id === 'R1');
  const hOrifice = () => E.analyserTout(s).ecoulement.orifices.get('O1').h;
  let t = 0;
  while (hOrifice() > 1 && t < 3000) { E.integrer(s, 5, { dzMax: 0.002 }); t += 5; }
  // interpolation fine sur le dernier pas
  rel(s._t, 1166, 0.01, 'temps de vidange');
  assert.ok(r.couches[0].V > 0);
});

test('Ex. 3.5 — remplissage : 2,12 mm/s, 1,50 m en 707 s', () => {
  const s = creerScenario('remplissage');
  const z0 = E.analyserTout(s).etats.get('R1').zL;
  E.integrer(s, 707, { dzMax: 0.01 });
  near(E.analyserTout(s).etats.get('R1').zL - z0, 1.5, 0.01, 'montée');
});

test('Ex. 4.1 — continuité et Bernoulli : p₂ − p₁ = −27,1 kPa', () => {
  const A = E.analyserTout(creerScenario('bernoulli'));
  const m1 = A.mesures.get('M1'), m2 = A.mesures.get('M2');
  near(m2.tap.z - m1.tap.z, 2.5, 1e-9, 'dénivelée');
  near(m2.p - m1.p, -27138, 30, 'Δp');
  const c = chaine(A);
  near(c.det[0].V, 1.13, 0.005); near(c.det[2].V, 2.55, 0.005);
});

test('Ex. 4.4 — Pitot : Δh = 60 mm pour V = 3,85 m/s ; Pitot moins piézomètre = V²/2g', () => {
  const A = E.analyserTout(creerScenario('pitot'));
  const u = A.mesures.get('U1'), V = chaine(A).det[0].V;
  near(V, 3.85, 0.005, 'V');
  near(Math.abs(u.dh), 0.060, 0.0005, 'Δh mercure');
  near(E.vitessePitot({ dh: 0.060 }), 3.85, 0.005, 'formule');
  const p1 = A.mesures.get('P1'), p2 = A.mesures.get('P2');
  near((p2.zN - p2.hc) - (p1.zN - p1.hc), V * V / (2 * 9.81), 1e-6, 'écart Pitot – statique');
});

test('Ex. 4.5 — Venturi : la formule redonne 48,4 L/s pour Δh = 150 mm', () => {
  rel(E.debitVenturi({ dh: 0.150, D1: 0.2, d: 0.1, Cq: 0.98 }), 0.0484, 2e-3, 'formule');
  const A = E.analyserTout(creerScenario('venturi')), v = A.ecoulement.venturis.get('VT1');
  near(v.V1, 1.54, 0.005); near(v.V2, 6.16, 0.01);
  rel(v.dp, 500 * (v.V2 ** 2 - v.V1 ** 2), 1e-6, 'Δp au col');
  rel(v.Qmes, 0.98 * 0.0484, 2e-3, 'débit mesuré');
});

test('Ex. 4.6 — siphon : 7,67 m/s, 38,6 L/s, 57,2 kPa absolus au sommet', () => {
  const s = creerScenario('siphon');
  let A = E.analyserTout(s);
  const c = chaine(A);
  near(c.det[0].V, 7.67, 0.005); rel(c.Q, 0.0386, 2e-3);
  rel(A.mesures.get('M1').pabs, 101325 - 9810 * 1.5 - 500 * 7.672 ** 2, 2e-3, 'p abs point haut');
  assert.ok(!A.alertes.some(a => /cavitation/.test(a.texte)));
  s.elements.find(e => e.id === 'C1').zr = 3 + 7.3;
  A = E.analyserTout(s);
  assert.ok(A.alertes.some(a => /cavitation/.test(a.texte)), 'au-delà de 7,09 m');
});

test('Ex. 4.7 — pompage en fluide parfait : H = 35,0 m, 10,3 kW, 14,7 kW', () => {
  const c = chaine(E.analyserTout(creerScenario('pompage'))), p = c.pompes[0];
  near(p.H, 35.0, 0.02); rel(p.Ph, 10300, 3e-3); rel(p.Pabs, 14700, 4e-3);
});

test('Ex. 6.4 — conduite gravitaire : λ ≈ 0,023, Q ≈ 24 L/s', () => {
  const c = chaine(E.analyserTout(creerScenario('gravitaire')));
  near(c.det[0].lambda, 0.0233, 0.0003, 'λ'); near(c.det[0].V, 1.36, 0.01, 'U'); rel(c.Q, 0.0240, 0.01, 'Q');
});

test('Ex. 6.6 — station de pompage : HMT 70,4 m, 17,3 kW, 24,0 kW', () => {
  const c = chaine(E.analyserTout(creerScenario('station'))), p = c.pompes[0];
  const ha = c.det[0].hf + c.det[0].hK, hr = c.det[1].hf + c.det[1].hK;
  near(ha, 0.52, 0.01, 'aspiration'); near(hr, 23.9, 0.1, 'refoulement');
  near(p.H, 70.4, 0.1, 'HMT'); rel(p.Ph, 17266, 3e-3); rel(p.Pabs, 24000, 5e-3);
});

test('Ex. 6.7 — élargissement brusque : perte 0,105 m, la pression remonte de 677 Pa', () => {
  const A = E.analyserTout(creerScenario('borda')), r = chaine(A).raccords[0];
  near(r.h, 0.105, 0.001, 'Borda');
  const p1 = A.mesures.get('P1'), p2 = A.mesures.get('P2');
  near(p2.p - p1.p, 677, 15, 'Δp');
});

test('Vanne : fermer progressivement réduit le débit, fermée elle l’annule', () => {
  const s = creerScenario('gravitaire'), v = s.elements.find(e => e.id === 'V1');
  const q = () => (chaine(E.analyserTout(s)) || { Q: 0 }).Q;
  const q100 = q(); v.ouverture = 0.5; const q50 = q(); v.ouverture = 0.25; const q25 = q();
  assert.ok(q100 > q50 && q50 > q25 && q25 > 0);
  assert.ok(q50 > 0.85 * q100, 'la vanne à moitié ouverte freine peu une longue conduite');
  v.ouverte = false; assert.equal(q(), 0);
});

test('Deux réservoirs reliés : les niveaux convergent sans perte de volume (fluide réel)', () => {
  const s = P.sceneVide(); s.env.ecoulement = 'reel';
  const r = (id, x, h) => { const o = { id, type: 'reservoir', nom: '', x, z: 0, w: 1, H: 4, b: 1, alpha: 90, ferme: false, diagramme: 'aucune', ciel: { mode: 'impose', p: 0, n: 0 }, couches: [] }; o.couches = P.couchesDepuisHauteurs(o, [{ fluide: 'eau', h }]); return o; };
  s.elements.push(r('R1', 0, 3), r('R2', 3, 1), { id: 'C1', type: 'conduite', a: { el: 'R1', port: 'f:0.50' }, b: { el: 'R2', port: 'f:0.50' }, zr: null, D: 0.05, rugo: 0.05, lambda: null, Lreel: null, K: 0, Kauto: true });
  const V0 = volume(s);
  for (let i = 0; i < 200; i++) E.integrer(s, 5);
  const A = E.analyserTout(s);
  near(A.etats.get('R1').zL, 2, 0.01); near(A.etats.get('R2').zL, 2, 0.01);
  near(volume(s), V0, 1e-9, 'volume');
});

test('Orifice dont le jet tombe dans un autre réservoir : le volume passe de l’un à l’autre', () => {
  const s = creerScenario('torricelli');
  const r2 = { id: 'R2', type: 'reservoir', nom: '', x: 5.5, z: 0, w: 2, H: 0.5, b: 2, alpha: 90, ferme: false, diagramme: 'aucune', ciel: { mode: 'impose', p: 0, n: 0 }, couches: [] };
  s.elements.push(r2);
  const A = E.analyserTout(s);
  assert.equal(A.ecoulement.orifices.get('O1').jet.cible?.id, 'R2');
  E.integrer(s, 10);
  rel(r2.couches[0].V, 10 * 0.01079, 0.01, 'volume reçu');
});

test('Les expériences d’écoulement se chargent et passent le contrôle d’import', () => {
  for (const sc of SCENARIOS.filter(k => k.ecoulement)) {
    const s = creerScenario(sc.id);
    const t = P.verifierScene(P.exporterScene(s));
    assert.equal(t.elements.length, s.elements.length, sc.id);
    assert.equal(t.env.ecoulement, sc.ecoulement);
    const A = E.analyserTout(s);
    assert.ok(A.ecoulement.chaines.some(c => c.Q > 0) || A.ecoulement.orifices.size || A.ecoulement.lances.size || A.canaux.size, sc.id);
    for (const [k, m] of A.mesures) assert.ok(!m.erreur, `${sc.id} ${k}`);
  }
});

test('Montage à la souris : vanne et conduite sans réglages explicites (ouverture, rugosité)', () => {
  // Les éléments posés dans l'interface ne passent pas par verifierScene.
  const s = P.sceneVide();
  s.env.ecoulement = 'reel';
  const r = { id: 'R1', type: 'reservoir', nom: '', x: 0, z: 0, w: 1.5, H: 3, b: 1, alpha: 90, ferme: false, diagramme: 'aucune', ciel: { mode: 'impose', p: 0, n: 0 }, couches: [] };
  r.couches = P.couchesDepuisHauteurs(r, [{ fluide: 'eau', h: 2 }]);
  s.elements.push(r,
    { id: 'PO1', type: 'pompe', x: 3, z: 0.25, sens: 1, marche: true, mode: 'debit', Q: 0.01, H0: 30, k: 1e4, eta: 0.7 },
    { id: 'S1', type: 'exutoire', x: 5, z: 2 },
    { id: 'C1', type: 'conduite', a: { el: 'R1', port: 'd:0.25' }, b: { el: 'PO1', port: 'asp' }, zr: null, D: 0.1 },
    { id: 'V1', type: 'vanne', conduite: 'C1', t: 0.5, ouverte: true },
    { id: 'C2', type: 'conduite', a: { el: 'PO1', port: 'ref' }, b: { el: 'S1', port: 'o' }, zr: null, D: 0.1 });
  const sol = chaine(E.analyserTout(s));
  assert.ok(sol, 'la pompe débite');
  near(sol.Q, 0.01, 1e-12, 'débit imposé');
  // rugosité par défaut 0,1 mm : λ de Colebrook, pas celui d'un tube lisse
  const lisse = chaine(E.analyserTout({ ...s, elements: s.elements.map(e => (e.type === 'conduite' ? { ...e, rugo: 0 } : e)) }));
  assert.ok(sol.det[0].lambda > lisse.det[0].lambda * 1.05, `λ ${sol.det[0].lambda} vs lisse ${lisse.det[0].lambda}`);
  near(sol.det[0].lambda, 0.0217, 0.0005, 'λ de Colebrook (Re ≈ 1,3·10⁵, ε/D = 10⁻³)');
});
