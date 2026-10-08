// Laboratoire virtuel, écoulements à surface libre : contrôles du solveur de
// Saint-Venant contre les exercices résolus du chapitre 8.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../src/labo-canal.js';
import * as E from '../src/labo-ecoulement.js';
import * as P from '../src/labo-physique.js';
import { creerScenario, SCENARIOS } from '../src/labo-scenarios.js';

const g = P.G;
const near = (a, b, tol, msg = '') => assert.ok(Math.abs(a - b) <= tol, `${msg} ${a} ≠ ${b} (± ${tol})`);
const rel = (a, b, r, msg = '') => near(a, b, Math.abs(b) * r, msg);
const canalDe = id => creerScenario(id).elements.find(e => e.type === 'canal');
const proche = (d, x) => d.pts.reduce((a, p) => (Math.abs(p.x - x) < Math.abs(a.x - x) ? p : a));
const tourner = (c, duree, pas = 10) => { for (let t = 0; t < duree; t += pas) C.avancerCanal(c, Math.min(pas, duree - t), g); return C.diagnostic(c, g); };

test('Ex. 8.1 — canal trapézoïdal : S = 4,56 m², R_h = 0,721 m, Q = 5,13 m³/s, Fr = 0,40', () => {
  const c = canalDe('canal-trapeze'), s = C.section(c, 1.2);
  near(s.S, 4.56, 1e-9, 'S'); rel(s.P, 6.33, 1e-3, 'P'); rel(s.Rh, 0.721, 1e-3, 'Rh'); near(s.B, 5.6, 1e-9, 'B');
  rel(C.debitManning(c, 1.2, c.i), 5.13, 2e-3, 'Q');
  rel(C.hNormale(c, 5.13, c.i), 1.2, 1e-3, 'profondeur normale');
  // le régime uniforme se maintient dans le calcul de Saint-Venant
  const d = tourner(c, 1500, 50), p = proche(d, 1000);
  rel(p.h, 1.2, 3e-3, 'h au milieu'); rel(p.Q, 5.13, 2e-3, 'Q au milieu'); near(p.Fr, 0.40, 0.01, 'Froude');
});

test('Ex. 8.2 — caniveau : h_n ≈ 0,80 m, fluvial, chute libre vers h_c (courbe M2)', () => {
  const c = canalDe('caniveau'), hn = C.hNormale(c, 2.4, 0.002), hc = C.hCritique(c, 2.4, g);
  near(hn, 0.80, 0.01, 'h_n'); rel(hc, Math.cbrt((2.4 / 1.5) ** 2 / g), 1e-6, 'h_c = (q²/g)^(1/3)');
  assert.ok(hn > hc, 'pente faible : fluvial');
  const d = tourner(c, 300, 20);
  rel(proche(d, 100).h, hn, 0.01, 'profondeur normale loin de la chute');
  const fin = d.pts[d.pts.length - 1].h;
  assert.ok(fin < hn - 0.08 && fin > hc - 0.02, `abaissement vers h_c en bout (${fin})`);
  // niveau aval imposé au-dessus de h_n : remous M1 qui remonte vers l'amont
  c.aval = 'niveau'; c.hAval = 1.2;
  const d2 = tourner(c, 600, 20);
  assert.ok(proche(d2, 350).h > hn + 0.15 && proche(d2, 350).h < 1.21, 'exhaussement à l’aval');
  assert.ok(proche(d2, 350).h > proche(d2, 200).h && proche(d2, 200).h >= proche(d2, 50).h - 1e-3, 'courbe M1 croissante vers l’aval');
});

test('Ex. 8.3 — intumescence : c = 3,96 m/s, ondes à U + c et U − c', () => {
  const c = canalDe('intumescence');
  near(Math.sqrt(g * 1.6), 3.96, 0.005, 'célérité');
  const d = tourner(c, 400, 20);
  let am = null, av = null;
  for (const p of d.pts) { if (p.x < -200 && (!am || p.h > am.h)) am = p; if (p.x > 200 && (!av || p.h > av.h)) av = p; }
  rel(am.x, (0.9 - 3.96) * 400, 0.08, 'crête remontante');
  rel(av.x, (0.9 + 3.96) * 400, 0.08, 'crête descendante');
  assert.ok(am.h > 1.62 && av.h > 1.62, 'les deux ondes sont visibles');
  // arrivée à l'ouvrage situé 3 km à l'amont
  rel(3000 / (3.96 - 0.9), 980, 0.01, 'temps de parcours');
});

test('Ex. 8.4 — rupture de barrage : détente de Ritter, 4/9 h₀ au droit du barrage', () => {
  const c = canalDe('rupture'), d = tourner(c, 120, 20);
  near(C.ritter(0, 120, 25, g), 4 / 9 * 25, 1e-9, 'Ritter au barrage');
  rel(proche(d, 0).h, 11.1, 0.05, 'profondeur au barrage');
  rel(proche(d, 0).U, 2 / 3 * Math.sqrt(g * 25), 0.05, 'vitesse au barrage');
  for (const x of [-1500, 1000, 2500]) rel(proche(d, x).h, C.ritter(x, 120, 25, g), 0.06, `h(${x})`);
  // le front a dépassé 3 km et reste en deçà du front théorique (31,3 m/s × 120 s)
  const front = d.pts.filter(p => p.h > 0.05).pop().x;
  assert.ok(front > 2800 && front < 2 * Math.sqrt(g * 25) * 120, `front ${front}`);
  // volume conservé tant que l'eau n'est pas sortie
  const V = d.pts.reduce((t, p) => t + p.S * d.st.dx, 0);
  rel(V, 25 * 6000, 1e-6, 'volume');
});

test('Ressaut : passage torrentiel → fluvial avec hauteurs conjuguées', () => {
  const c = canalDe('ressaut'), d = tourner(c, 200, 5);
  assert.equal(d.ressauts.length, 1);
  const r = d.ressauts[0];
  assert.ok(r.x > c.xr && r.x < c.x0 + c.L, 'le ressaut est sur le bief doux');
  assert.ok(r.Fr1 > 1.5, 'amont torrentiel');
  rel(r.h2, r.h2theo, 0.08, 'hauteur conjuguée');
  rel(proche(d, 90).h, C.hNormale(c, 1, c.i2), 0.02, 'profondeur normale aval');
  rel(proche(d, 10).h, C.hNormale(c, 1, c.i), 0.03, 'profondeur normale du coursier');
});

test('Les canaux passent le contrôle d’import et se figent au repos', () => {
  for (const sc of SCENARIOS.filter(k => k.chapitre === '8')) {
    const s = creerScenario(sc.id), t = P.verifierScene(P.exporterScene(s)), a = s.elements[0], v = t.elements[0];
    for (const k of ['x0', 'L', 'N', 'section', 'b', 'm', 'K', 'i', 'xr', 'i2', 'zf0', 'amont', 'Q', 'aval', 'hAval', 'bosse', 'sonde', 'station', 'ritter', 'ondes'])
      assert.deepEqual(v[k], a[k], `${sc.id} ${k}`);
    for (const k of Object.keys(a.init)) assert.equal(v.init[k], a.init[k], `${sc.id} init.${k}`);
    assert.ok(E.analyserTout(s).canaux.get('CA1'), sc.id);
  }
  // un canal plein, sans débit, entre deux murs reste au repos
  const c = { ...canalDe('caniveau'), amont: 'mur', aval: 'mur', i: 0.002, init: { type: 'repos', h: 1 } };
  const d = tourner(c, 100, 10);
  assert.ok(Math.max(...d.pts.map(p => Math.abs(p.U))) < 1e-6, 'lac au repos sur fond en pente');
  assert.equal(C.avancerCanal(c, 1, g), false);
});
