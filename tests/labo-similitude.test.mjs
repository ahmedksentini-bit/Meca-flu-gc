// Laboratoire virtuel, analyse dimensionnelle et similitude : contrôles contre
// les exercices résolus du chapitre 7.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../src/labo-canal.js';
import * as B from '../src/labo-bille.js';
import * as E from '../src/labo-ecoulement.js';
import * as P from '../src/labo-physique.js';
import { creerScenario } from '../src/labo-scenarios.js';

const g = P.G;
const near = (a, b, tol, msg = '') => assert.ok(Math.abs(a - b) <= tol, `${msg} ${a} ≠ ${b} (± ${tol})`);
const rel = (a, b, r, msg = '') => near(a, b, Math.abs(b) * r, msg);

test('Échelles de Froude et de Reynolds (même fluide)', () => {
  rel(1800 * C.facteur(50, 'debit'), 0.1018, 1e-3, 'Ex. 7.4 débit');
  rel(1.70 / C.facteur(50, 'vitesse'), 12.0, 2e-3, 'vitesse');
  rel(2 / C.facteur(50, 'temps'), 14.1, 4e-3, 'temps');
  rel(85 / C.facteur(50, 'force'), 1.0625e7, 1e-9, 'force');
  // Ex. 7.3 : en similitude de Reynolds avec le même fluide, les forces sont égales et V_m = 20 V_p
  near(C.facteur(20, 'force', 'reynolds'), 1, 1e-12, 'force Reynolds');
  near(C.facteur(20, 'vitesse', 'reynolds'), 20, 1e-12, 'vitesse Reynolds');
});

test('Ex. 7.4 — maquette au 1/50 : lignes d’eau homothétiques, temps en √50', () => {
  const s = creerScenario('evacuateur');
  s.env.vitesse = 1;
  for (let k = 0; k < 150; k++) E.avancer(s, 2);
  const A = E.analyserTout(s), p = A.canaux.get('CA1'), m = A.canaux.get('CA2'), cm = s.elements.find(e => e.id === 'CA2');
  rel(cm.Q, 0.1018, 1e-3, 'Q_m');
  rel(cm.K, 75 * Math.pow(50, 1 / 6), 1e-9, 'Strickler de la maquette');
  rel(p.t / m.t, Math.sqrt(50), 1e-9, 'rapport des temps');
  rel(p.sonde.h, 50 * m.sonde.h, 1e-6, 'profondeurs homologues');
  rel(p.sonde.U, Math.sqrt(50) * m.sonde.U, 1e-6, 'vitesses homologues');
  near(p.sonde.Fr, m.sonde.Fr, 1e-6, 'même Froude');
  // vitesse au pied du coursier ≈ 12 m/s, torrentielle ; ressaut dans le bassin
  assert.ok(p.sonde.U > 10.5 && p.sonde.U < 13 && p.sonde.Fr > 1, `pied du coursier ${p.sonde.U}`);
  assert.equal(p.ressauts.length, 1);
  assert.ok(p.ressauts[0].x > 60 && p.ressauts[0].x < 300);
  rel(p.ressauts[0].x, 50 * m.ressauts[0].x, 0.02, 'ressaut homologue');
});

test('Ex. 7.5 — chute de bille : V = 0,12 m/s, μ = 0,284 Pa·s, Re = 1,13', () => {
  rel(B.vitesseLimite(3e-3, 7850, 890, 0.284, g, 'stokes'), 0.12, 2e-3, 'vitesse limite');
  rel(B.muStokes(3e-3, 7850, 890, 0.12, g), 0.284, 2e-3, 'viscosité');
  const s = creerScenario('bille'), b = s.elements.find(e => e.type === 'bille');
  let n = 0;
  while (E.avancer(s, 0.05) && n < 1000) n++;
  const st = E.analyserTout(s).billes.get('B1');
  assert.ok(st.fond, 'la bille touche le fond');
  rel(st.mesure.V, 0.12, 5e-3, 'vitesse mesurée entre les repères');
  rel(st.mesure.mu, 0.284, 5e-3, 'μ par Stokes');
  rel(st.mesure.Re, 1.13, 0.01, 'Reynolds');
  // traînée complète : la bille est plus lente et Stokes surestime μ
  b.trainee = 'complete'; B.lacher(b, s); n = 0;
  while (E.avancer(s, 0.05) && n < 1000) n++;
  const st2 = E.analyserTout(s).billes.get('B1');
  rel(st2.mesure.V, 0.1047, 0.01, 'vitesse limite corrigée');
  assert.ok(st2.mesure.mu > 0.284 * 1.1, 'Stokes surestime la viscosité');
});
