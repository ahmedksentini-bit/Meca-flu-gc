// Laboratoire virtuel, théorème des quantités de mouvement : contrôles contre
// les exercices résolus du chapitre 5.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as P from '../src/labo-physique.js';
import * as E from '../src/labo-ecoulement.js';
import { creerScenario } from '../src/labo-scenarios.js';

const near = (a, b, tol, msg = '') => assert.ok(Math.abs(a - b) <= tol, `${msg} ${a} ≠ ${b} (± ${tol})`);
const rel = (a, b, r, msg = '') => near(a, b, Math.abs(b) * r, msg);
const norme = F => Math.hypot(F.x, F.z);
const obstacle = (s, id) => E.analyserTout(s).ecoulement.obstacles.get(id);

test('Ex. 5.1 — jet sur plaque fixe normale : F = ρQV = 636 N, nappes égales', () => {
  const ob = obstacle(creerScenario('jet-plaque'), 'PL1'), im = ob.impacts[0];
  rel(norme(ob.F), 636, 2e-3, 'effort');
  near(ob.F.z, 0, 0.5, 'effort horizontal');
  rel(im.Q1, im.Q2, 1e-6, 'partage symétrique');
  rel(im.Q1 + im.Q2, 0.04241, 1e-3, 'débit');
});

test('Ex. 5.2 — auget fixe 1 272 N, mobile à 5 m/s : 565 N et 2,83 kW, optimum à V/3', () => {
  const s = creerScenario('auget'), au = s.elements.find(e => e.id === 'AU1');
  au.u = 0;
  rel(norme(obstacle(s, 'AU1').F), 1272, 2e-3, 'auget fixe');
  au.u = 5;
  const ob = obstacle(s, 'AU1');
  rel(norme(ob.F), 565, 2e-3, 'auget mobile');
  rel(ob.P, 2827, 2e-3, 'puissance');
  // la puissance est maximale pour u = V/3
  const P = u => { au.u = u; return obstacle(s, 'AU1').P; };
  assert.ok(P(5) > P(4) && P(5) > P(6), 'maximum en u = 5 m/s');
  // à u = V/2, l'eau renvoyée repart à vitesse (quasi) nulle
  au.u = 7.5;
  assert.ok(norme(obstacle(s, 'AU1').impacts[0].vo) < 0.05);
});

test('Ex. 5.3 — coude à 90° sous 200 kPa, Q = 250 L/s : F = 21,2 kN à 45°', () => {
  const A = E.analyserTout(creerScenario('coude'));
  const hauts = A.efforts.coudes.filter(c => Math.abs(c.p - 200000) < 50);
  assert.equal(hauts.length, 2);
  for (const c of hauts) {
    rel(norme(c.F), 21243, 2e-3, 'effort');
    near(Math.abs(c.F.x), Math.abs(c.F.z), 1, 'bissectrice');
    rel(c.V, 3.54, 2e-3, 'vitesse');
  }
  // sans écoulement, le terme de pression subsiste
  const s = creerScenario('coude');
  s.env.ecoulement = 'illustratif';
  const statique = E.analyserTout(s).efforts.coudes.find(c => c.z > 1);
  rel(norme(statique.F), Math.SQRT2 * statique.p * statique.S, 1e-9, 'coude au repos');
});

test('Ex. 5.4 — convergent 250/150 mm : p₂ = 171 kPa, effort axial 5,58 kN vers l’aval', () => {
  const r = E.analyserTout(creerScenario('convergent')).efforts.raccords[0];
  rel(r.a.p, 180000, 1e-4, 'p₁');
  rel(r.b.p, 171070, 1e-3, 'p₂');
  rel(r.Fa, 5581, 2e-3, 'effort');
  assert.ok(r.F.x > 0, 'vers l’aval');
});

test('Ex. 5.5 — réaction d’un jet sous 2 m : F = ρQV = 2ρghs = 78,4 N', () => {
  const o = E.analyserTout(creerScenario('reaction')).ecoulement.orifices.get('O1');
  rel(o.V, 6.26, 1e-3, 'vitesse');
  rel(o.reaction, 2 * 1000 * P.G * 2 * 20e-4, 1e-6, '2ρghs');
  rel(o.reaction, 78.4, 2e-3, 'réaction');
});

test('Ex. 5.6 — plaque à 60° : 312 N, Q₁ = 22,5 L/s, Q₂ = 7,5 L/s', () => {
  const ob = obstacle(creerScenario('plaque-inclinee'), 'PL1'), im = ob.impacts[0];
  rel(norme(ob.F), 312, 2e-3, 'effort normal');
  near(im.alpha, 60, 0.05, 'angle d’attaque');
  rel(im.Q1, 0.0225, 1e-3, 'Q₁'); rel(im.Q2, 0.0075, 3e-3, 'Q₂');
});

test('Les nappes déviées emportent tout le débit vers leurs destinations', () => {
  const s = creerScenario('jet-plaque');
  s.elements.push({ id: 'R9', type: 'reservoir', nom: '', x: -1, z: -0.2, w: 4, H: 0.8, b: 1, alpha: 90, ferme: false, diagramme: 'aucune', ciel: { mode: 'impose', p: 0, n: 0 }, couches: [] });
  const E2 = E.analyserTout(s).ecoulement;
  const tr = E2.transferts.filter(t => t.lance);
  rel(tr.reduce((a, t) => a + t.Q, 0), 0.04241, 1e-3, 'débit total');
  assert.ok(tr.every(t => t.dst && t.dst.id === 'R9'), 'les deux nappes tombent dans le bac');
});
