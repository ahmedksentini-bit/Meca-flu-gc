// Laboratoire virtuel : expériences guidées des chapitres 1 à 6. Chaque
// scénario reproduit une situation du cours (exercice résolu ou paragraphe) ;
// les valeurs attendues figurent dans la consigne et sont vérifiées par les tests.
import { sceneVide, couchesDepuisHauteurs, contexte, calerGaz, G } from './labo-physique.js';

function reservoir(id, o) {
  const r = { id, type: 'reservoir', nom: o.nom || '', x: o.x || 0, z: o.z || 0, w: o.w || 1.5, H: o.H || 3, b: o.b || 1,
    alpha: o.alpha || 90, ferme: !!o.ferme, diagramme: o.diagramme || 'aucune',
    constant: !!o.constant, aspect: o.aspect || 'liquide',
    ciel: { mode: o.mode || 'impose', p: o.p || 0, n: 0 }, couches: [] };
  r.couches = couchesDepuisHauteurs(r, o.couches || []);
  if (r.constant) r.hc = (o.couches || []).reduce((t, c) => t + c.h, 0);
  return r;
}
const caisson = (id, o) => ({ id, type: 'flotteur', reservoir: o.reservoir, x: o.x, l: o.l, h: o.h, b: o.b, m: o.m, zG: o.zG, gite: 0,
  creux: true, e: o.e ?? 0.03, ballast: o.ballast || 0, ballastFluide: o.ballastFluide || 'eau' });
const piezo = (id, el, port, Ht, o = {}) => ({ id, type: 'piezometre', piquage: { el, port }, Ht, d: o.d ?? 12, ox: o.ox ?? 0.35 });
const mano = (id, el, port, o = {}) => ({ id, type: 'manometre', piquage: { el, port }, mode: o.mode || 'relatif', ox: o.ox ?? 0.35 });
const tubeU = (id, el, port, fluideM, o = {}) => ({ id, type: 'tubeU', piquage: { el, port }, piquage2: o.b || null, fluideM, L: o.L ?? 1, ox: o.ox ?? 0.6, oz: o.oz ?? -0.6 });
const conduite = (id, a, b, o = {}) => ({ id, type: 'conduite', a, b, zr: o.zr ?? null, D: o.D ?? 0.1,
  rugo: o.rugo ?? 0.1, lambda: o.lambda ?? null, Lreel: o.Lreel ?? null, K: o.K ?? 0, Kauto: o.Kauto !== false });
const pompe = (id, x, z, o = {}) => ({ id, type: 'pompe', x, z, sens: o.sens ?? 1, marche: true, mode: o.mode || 'debit', Q: o.Q ?? 0.01, H0: o.H0 ?? 30, k: o.k ?? 1e4, eta: o.eta ?? 0.7 });
const sortie = (id, x, z) => ({ id, type: 'exutoire', x, z });
const raccord = (id, x, z) => ({ id, type: 'raccord', x, z });
const orifice = (id, reservoir, paroi, s, o = {}) => ({ id, type: 'orifice', reservoir, paroi, s, d: o.d ?? 0.05, Cd: o.Cd ?? 0.62, Cv: o.Cv ?? 0.98, ouvert: true });
const vanne = (id, c, t, o = {}) => ({ id, type: 'vanne', conduite: c, t, ouverte: o.ouverte !== false, ouverture: o.ouverture ?? 1, Kv: o.Kv ?? 0.2 });
// Chapitre 5 : la lance est légèrement relevée pour que le jet, au sommet de sa
// parabole, arrive horizontal sur l'obstacle placé à la distance x (sin 2a = 2gx/V²).
const visee = (V, x) => { const a = Math.asin(Math.min(1, 2 * G * x / (V * V))) / 2; return { angle: a * 180 / Math.PI, dz: (V * Math.sin(a)) ** 2 / (2 * G) }; };
const lance = (id, x, z, o = {}) => ({ id, type: 'lance', x, z, angle: o.angle ?? 0, d: o.d ?? 0.05, V: o.V ?? 10, fluide: o.fluide || 'eau', ouvert: true });
const aire = d => Math.PI * d * d / 4;
// Chapitre 8 : canal vu en profil en long dans un cadre de 10 × 4 m de la scène.
const canal = (id, o) => ({ id, type: 'canal', nom: o.nom || '', x: 0, z: 0, largeur: o.largeur ?? 10, hauteur: o.hauteur ?? 4.2, x0: o.x0 ?? 0, L: o.L, N: o.N ?? 200,
  section: o.section || 'rect', b: o.b, m: o.m ?? 0, K: o.K ?? 0, i: o.i ?? 0, xr: o.xr ?? null, i2: o.i2 ?? 0, zf0: o.zf0 ?? 0,
  amont: o.amont || 'debit', Q: o.Q ?? 0, aval: o.aval || 'libre', hAval: o.hAval ?? 1, init: o.init || { type: 'normale' }, bosse: o.bosse || null,
  sonde: o.sonde ?? null, station: o.station ?? null, ritter: !!o.ritter, ondes: !!o.ondes });

const fabriques = {
  vases(s) {
    s.elements.push(
      reservoir('R1', { nom: 'Château d’eau', x: 0, w: 1.2, H: 4, couches: [{ fluide: 'eau', h: 3.5 }] }),
      reservoir('R2', { nom: 'Bassin', x: 3.4, w: 2.4, H: 3, couches: [{ fluide: 'eau', h: 0.75 }] }),
      conduite('C1', { el: 'R1', port: 'f:0.60' }, { el: 'R2', port: 'f:0.60' }, { zr: -0.6 }),
      { id: 'V1', type: 'vanne', conduite: 'C1', t: 0.55, ouverte: false },
      piezo('P1', 'C1', 't:0.35', 4.4),
      piezo('P2', 'C1', 't:0.65', 4.4),
      mano('M1', 'R1', 'g:0.25'));
  },
  piezometres(s) {
    s.elements.push(
      reservoir('R1', { nom: 'Réservoir', x: 0, w: 2, H: 3.5, couches: [{ fluide: 'eau', h: 2.5 }] }),
      piezo('P1', 'R1', 'd:0.50', 3, { ox: 0.35 }),
      piezo('P2', 'R1', 'd:1.50', 2, { ox: 0.8 }),
      piezo('P3', 'R1', 'd:2.25', 1.25, { ox: 1.25 }),
      mano('M1', 'R1', 'g:0.25'), mano('M2', 'R1', 'g:1.50'));
  },
  bicouche(s) {
    s.elements.push(
      reservoir('R1', { nom: 'Bac huile sur eau', x: 0, w: 2, H: 5.5, diagramme: 'g', couches: [{ fluide: 'eau', h: 3 }, { fluide: 'huile', h: 2 }] }),
      piezo('P1', 'R1', 'd:1.00', 4.5, { ox: 0.35 }),
      piezo('P2', 'R1', 'd:4.00', 1.75, { ox: 0.85 }),
      mano('M1', 'R1', 'f:1.00'));
  },
  pressurise(s) {
    s.elements.push(
      reservoir('R1', { nom: 'Cuve pressurisée', x: 0, w: 2, H: 3, ferme: true, p: 20000, couches: [{ fluide: 'eau', h: 2 }] }),
      piezo('P1', 'R1', 'd:0.50', 4.25),
      mano('M1', 'R1', 'h:1.50'),
      mano('M2', 'R1', 'f:1.00'),
      tubeU('U1', 'R1', 'g:1.00', 'mercure', { ox: -0.7, oz: -0.7 }));
  },
  'tube-u'(s) {
    s.elements.push(
      reservoir('R1', { nom: 'Enceinte', x: 0, w: 1.6, H: 2.5, ferme: true, p: 5000, couches: [{ fluide: 'eau', h: 1.5 }] }),
      tubeU('U1', 'R1', 'd:0.50', 'mercure', { ox: 0.6, oz: -0.6 }),
      tubeU('U2', 'R1', 'g:0.50', 'tetra', { ox: -0.6, oz: -0.2, L: 2 }),
      mano('M1', 'R1', 'h:1.20'));
  },
  differentiel(s) {
    const pA = 40000, pB = pA - 27664;
    s.elements.push(
      reservoir('RA', { nom: 'Conduite A', x: 0, w: 1.2, H: 2, ferme: true, p: pA - 9810 * 0.5, couches: [{ fluide: 'eau', h: 1.5 }] }),
      reservoir('RB', { nom: 'Conduite B', x: 2.6, w: 1.2, H: 2, ferme: true, p: pB - 9810 * 0.2, couches: [{ fluide: 'eau', h: 1.5 }] }),
      tubeU('U1', 'RA', 'd:1.00', 'mercure', { b: { el: 'RB', port: 'g:1.30' }, ox: 0.6, oz: -0.5 }),
      mano('M1', 'RA', 'h:0.90'), mano('M2', 'RB', 'h:0.90'));
  },
  'deux-liquides'(s) {
    s.elements.push(
      reservoir('R1', { nom: 'Eau', x: 0, w: 1, H: 3, couches: [{ fluide: 'eau', h: 2 }] }),
      reservoir('R2', { nom: 'Huile', x: 2.4, w: 1, H: 3, couches: [{ fluide: 'huile', h: 2 }] }),
      conduite('C1', { el: 'R1', port: 'f:0.50' }, { el: 'R2', port: 'f:0.50' }, { zr: -0.5 }),
      { id: 'V1', type: 'vanne', conduite: 'C1', t: 0.5, ouverte: false },
      mano('M1', 'R1', 'g:0.25'), mano('M2', 'R2', 'd:0.25'));
  },
  pascal(s) {
    s.elements.push(
      reservoir('R1', { nom: 'Évasé', x: 0, w: 1, H: 3, alpha: 55, couches: [{ fluide: 'eau', h: 2 }] }),
      reservoir('R2', { nom: 'Droit', x: 3.6, w: 0.6, H: 3, couches: [{ fluide: 'eau', h: 2 }] }),
      reservoir('R3', { nom: 'En surplomb', x: 5.4, w: 2.6, H: 3, alpha: 115, couches: [{ fluide: 'eau', h: 2 }] }),
      conduite('C1', { el: 'R1', port: 'f:0.50' }, { el: 'R2', port: 'f:0.30' }, { zr: -0.5 }),
      conduite('C2', { el: 'R2', port: 'f:0.15' }, { el: 'R3', port: 'f:0.50' }, { zr: -0.8 }),
      mano('M1', 'R1', 'g:0.25'), mano('M2', 'R2', 'g:0.25', { ox: 0.3 }), mano('M3', 'R3', 'g:0.25', { ox: 0.3 }));
  },
  'vanne-verticale'(s) {
    s.elements.push(
      reservoir('R1', { nom: 'Canal (largeur 2,50 m)', x: 0, w: 3, H: 4, b: 2.5, couches: [{ fluide: 'eau', h: 3 }] }),
      { id: 'VP1', type: 'vannePlane', reservoir: 'R1', paroi: 'd', s: 0.9, forme: 'rect', a: 1.8, l: 2.5, charniere: 'haut' });
  },
  mur(s) {
    s.elements.push(reservoir('R1', { nom: 'Réservoir (tranche de 1 m)', x: 0, w: 2.5, H: 4, b: 1, diagramme: 'd', couches: [{ fluide: 'eau', h: 3.5 }] }));
  },
  'vanne-inclinee'(s) {
    s.elements.push(
      reservoir('R1', { nom: 'Bassin à paroi inclinée', x: 0, w: 2.5, H: 4.5, b: 3, alpha: 60, couches: [{ fluide: 'eau', h: 3.5 }] }),
      { id: 'VP1', type: 'vannePlane', reservoir: 'R1', paroi: 'd', s: 1.1 / Math.sin(Math.PI / 3), forme: 'cercle', a: 1.2, l: 1.2, charniere: 'aucune' });
  },
  caisson(s) {
    s.elements.push(
      reservoir('R1', { nom: 'Darse (eau de mer)', x: 0, w: 10, H: 4.5, b: 8, couches: [{ fluide: 'mer', h: 3.5 }] }),
      { id: 'F1', type: 'flotteur', reservoir: 'R1', x: 6.2, l: 4, h: 3, b: 6, m: 500000 / 9.81, zG: 1.4, gite: 0 },
      { id: 'F2', type: 'flotteur', reservoir: 'R1', x: 1.6, l: 1, h: 0.8, b: 1, m: 1920, zG: 0.4, gite: 0 });
  },
  capillarite(s) {
    s.elements.push(
      reservoir('R1', { nom: 'Eau', x: 0, w: 1.4, H: 2, couches: [{ fluide: 'eau', h: 1.25 }] }),
      piezo('P1', 'R1', 'd:0.50', 1.5, { d: 2, ox: 0.35 }),
      piezo('P2', 'R1', 'd:0.50', 1.5, { d: 5, ox: 0.85 }),
      piezo('P3', 'R1', 'd:0.50', 1.5, { d: 15, ox: 1.35 }),
      reservoir('R2', { nom: 'Mercure', x: 4.2, w: 1, H: 1, couches: [{ fluide: 'mercure', h: 0.5 }] }),
      piezo('P4', 'R2', 'd:0.25', 0.75, { d: 2, ox: 0.35 }),
      piezo('P5', 'R2', 'd:0.25', 0.75, { d: 15, ox: 0.85 }));
  },
  'vanne-chasse'(s) {
    s.elements.push(
      reservoir('R1', { nom: 'Retenue du barrage', x: 0, w: 5, H: 13, b: 1.5, couches: [{ fluide: 'eau', h: 12 }] }),
      { id: 'VP1', type: 'vannePlane', reservoir: 'R1', paroi: 'd', s: 0.5, forme: 'rect', a: 1, l: 1.5, charniere: 'glissieres', f: 0.25, poids: 8000 },
      mano('M1', 'R1', 'd:3.00', { ox: 0.5 }));
  },
  batardeau(s) {
    s.elements.push(
      reservoir('R1', { nom: 'Mer (niveau constant)', x: 0, z: -3.6, w: 14, H: 5, b: 16, constant: true, couches: [{ fluide: 'mer', h: 3.6 }] }),
      caisson('F1', { reservoir: 'R1', x: 7, l: 5, h: 4, b: 12, m: 720000 / 9.81, zG: 1.8, e: 0.03, ballastFluide: 'mer' }));
  },
  nappe(s) {
    s.elements.push(
      reservoir('R1', { nom: 'Terrain, nappe phréatique', x: 0, z: -4.5, w: 12, H: 4.5, b: 12, constant: true, aspect: 'sol', couches: [{ fluide: 'eau', h: 2 }] }),
      caisson('F1', { reservoir: 'R1', x: 6, l: 6, h: 4, b: 10, m: 2500 * (6 * 10 * 4 - 5.4 * 9.4 * 3.4), zG: 1.75, e: 0.3 }),
      piezo('P1', 'R1', 'g:0.50', 5, { ox: 0.5 }));
  },
  // ---------- écoulements en charge (chapitres 3, 4 et 6) ----------
  torricelli(s) {
    s.elements.push(
      reservoir('R1', { nom: 'Grand réservoir (niveau constant)', x: 0, z: 1.25, w: 2, H: 5, b: 2, constant: true, couches: [{ fluide: 'eau', h: 4.25 }] }),
      orifice('O1', 'R1', 'd', 0.25, { d: 0.05, Cd: 0.62, Cv: 0.98 }));
  },
  vidange(s) {
    s.elements.push(
      reservoir('R1', { nom: 'Réservoir cylindrique (S = π m²)', x: 0, z: 1, w: 2, H: 5, b: Math.PI / 2, couches: [{ fluide: 'eau', h: 4.25 }] }),
      orifice('O1', 'R1', 'd', 0.25, { d: 0.05, Cd: 0.62, Cv: 0.98 }));
  },
  remplissage(s) {
    s.elements.push(
      reservoir('R1', { nom: 'Réservoir D = 3 m', x: 0, z: 0, w: 3, H: 3.5, b: Math.PI * 9 / 4 / 3, couches: [{ fluide: 'eau', h: 0.5 }] }),
      { id: 'RB1', type: 'robinet', x: 1.2, z: 4.3, Q: 0.025, fluide: 'eau', ouvert: true },
      pompe('PO1', 4.2, 0.25, { Q: 0.010 }),
      sortie('S1', 6.2, 1.2),
      conduite('C1', { el: 'R1', port: 'd:0.25' }, { el: 'PO1', port: 'asp' }),
      conduite('C2', { el: 'PO1', port: 'ref' }, { el: 'S1', port: 'o' }));
  },
  bernoulli(s) {
    s.elements.push(
      reservoir('R1', { nom: 'Bâche', x: 0, z: -1, w: 1.5, H: 3, constant: true, couches: [{ fluide: 'eau', h: 2 }] }),
      pompe('PO1', 3, -0.5, { Q: 0.020 }),
      raccord('RC1', 5.2, -0.5),
      reservoir('R2', { nom: 'Réservoir haut', x: 8.5, z: 1.5, w: 1.5, H: 3, constant: true, couches: [{ fluide: 'eau', h: 2 }] }),
      conduite('C1', { el: 'R1', port: 'd:0.50' }, { el: 'PO1', port: 'asp' }, { D: 0.15 }),
      conduite('C2', { el: 'PO1', port: 'ref' }, { el: 'RC1', port: 'a' }, { D: 0.15 }),
      conduite('C3', { el: 'RC1', port: 'b' }, { el: 'R2', port: 'g:0.50' }, { D: 0.10, zr: 2 }),
      mano('M1', 'C2', 't:0.50', { ox: 0 }), mano('M2', 'C3', 't:0.70', { ox: 0 }));
  },
  pitot(s) {
    s.elements.push(
      reservoir('R1', { nom: 'Réservoir (niveau constant)', x: 0, z: 0.5, w: 1.5, H: 2.5, constant: true, couches: [{ fluide: 'eau', h: 1.8555 }] }),
      sortie('S1', 4.6, 1.6),
      conduite('C1', { el: 'R1', port: 'd:0.50' }, { el: 'S1', port: 'o' }, { D: 0.1, zr: 1 }),
      piezo('P1', 'C1', 't:0.30', 1.6, { ox: 0 }),
      piezo('P2', 'C1', 'k:0.48', 1.6, { ox: 0 }),
      tubeU('U1', 'C1', 'k:0.68', 'mercure', { b: { el: 'C1', port: 't:0.68' }, ox: 0, oz: -0.7, L: 0.6 }));
  },
  venturi(s) {
    s.elements.push(
      reservoir('R1', { nom: 'Bâche', x: 0, z: -1, w: 1.5, H: 2.5, constant: true, couches: [{ fluide: 'eau', h: 1.5 }] }),
      pompe('PO1', 2.8, -0.5, { Q: 0.0484 }),
      reservoir('R2', { nom: 'Réservoir aval', x: 8.6, z: -1, w: 1.5, H: 2.5, constant: true, couches: [{ fluide: 'eau', h: 1.5 }] }),
      conduite('C1', { el: 'R1', port: 'd:0.50' }, { el: 'PO1', port: 'asp' }, { D: 0.2 }),
      conduite('C2', { el: 'PO1', port: 'ref' }, { el: 'R2', port: 'g:0.50' }, { D: 0.2, zr: 0.5 }),
      { id: 'VT1', type: 'venturi', conduite: 'C2', t: 0.5, d: 0.1, Cq: 0.98, fluideM: 'mercure' });
  },
  siphon(s) {
    s.elements.push(
      reservoir('R1', { nom: 'Grand réservoir (niveau constant)', x: 0, z: 0, w: 2, H: 4, b: 2, constant: true, couches: [{ fluide: 'eau', h: 3 }] }),
      sortie('S1', 5, 0),
      conduite('C1', { el: 'R1', port: 'd:2.00' }, { el: 'S1', port: 'o' }, { D: 0.08, zr: 4.5 }),
      mano('M1', 'C1', 't:0.38', { mode: 'absolu', ox: 0 }));
  },
  pompage(s) {
    s.elements.push(
      reservoir('R1', { nom: 'Puits (cote 0)', x: 0, z: -3, w: 2, H: 3.5, constant: true, couches: [{ fluide: 'eau', h: 3 }] }),
      pompe('PO1', 3.5, -2.5, { Q: 0.030, eta: 0.70 }),
      reservoir('R2', { nom: 'Réservoir (cote 35)', x: 18, z: 33, w: 2, H: 4, constant: true, couches: [{ fluide: 'eau', h: 2 }] }),
      conduite('C1', { el: 'R1', port: 'd:0.50' }, { el: 'PO1', port: 'asp' }, { D: 0.3 }),
      conduite('C2', { el: 'PO1', port: 'ref' }, { el: 'R2', port: 'g:1.00' }, { D: 0.3, zr: -2.5 }));
  },
  gravitaire(s) {
    s.elements.push(
      reservoir('R1', { nom: 'Réservoir amont (cote 20)', x: 0, z: 17, w: 2, H: 4, constant: true, couches: [{ fluide: 'eau', h: 3 }] }),
      reservoir('R2', { nom: 'Réservoir aval (cote 2)', x: 9, z: 0, w: 2, H: 3, constant: true, couches: [{ fluide: 'eau', h: 2 }] }),
      conduite('C1', { el: 'R1', port: 'd:0.50' }, { el: 'R2', port: 'g:0.50' }, { D: 0.15, rugo: 0.25, Lreel: 1200, K: 4.2, Kauto: false, zr: 17.5 }),
      vanne('V1', 'C1', 0.15, { Kv: 0.3 }));
  },
  station(s) {
    s.elements.push(
      reservoir('R1', { nom: 'Bâche (cote 2)', x: 0, z: -1, w: 2.5, H: 4, constant: true, couches: [{ fluide: 'eau', h: 3 }] }),
      pompe('PO1', 4, -0.5, { Q: 0.025, eta: 0.72 }),
      reservoir('R2', { nom: 'Réservoir (cote 48)', x: 46, z: 45, w: 2.5, H: 4, constant: true, couches: [{ fluide: 'eau', h: 3 }] }),
      conduite('C1', { el: 'R1', port: 'd:0.50' }, { el: 'PO1', port: 'asp' }, { D: 0.15, Lreel: 8, K: 4.0, Kauto: false, lambda: 0.022 }),
      conduite('C2', { el: 'PO1', port: 'ref' }, { el: 'R2', port: 'g:0.50' }, { D: 0.125, Lreel: 620, K: 3.5, Kauto: false, lambda: 0.022, zr: -0.5 }));
  },
  borda(s) {
    s.elements.push(
      reservoir('R1', { nom: 'Bâche', x: 0, z: -1, w: 1.5, H: 2.5, constant: true, couches: [{ fluide: 'eau', h: 1.5 }] }),
      pompe('PO1', 2.6, -0.5, { Q: 0.015 }),
      raccord('RC1', 5.4, -0.5),
      reservoir('R2', { nom: 'Réservoir aval', x: 8.6, z: -1, w: 1.5, H: 2.5, constant: true, couches: [{ fluide: 'eau', h: 1.5 }] }),
      conduite('C1', { el: 'R1', port: 'd:0.50' }, { el: 'PO1', port: 'asp' }, { D: 0.1 }),
      conduite('C2', { el: 'PO1', port: 'ref' }, { el: 'RC1', port: 'a' }, { D: 0.1, lambda: 0 }),
      conduite('C3', { el: 'RC1', port: 'b' }, { el: 'R2', port: 'g:0.50' }, { D: 0.2, lambda: 0 }),
      piezo('P1', 'C2', 't:0.80', 2.2, { ox: 0 }), piezo('P2', 'C3', 't:0.20', 2.2, { ox: 0 }));
  },
  cavitation(s) {
    s.elements.push(
      reservoir('R1', { nom: 'Cuve sous vide', x: 0, w: 1.6, H: 2.5, ferme: true, p: -60000, couches: [{ fluide: 'essence', h: 1.5 }] }),
      mano('M1', 'R1', 'h:0.80', { mode: 'absolu' }),
      mano('M2', 'R1', 'g:0.25', { mode: 'relatif' }),
      tubeU('U1', 'R1', 'd:1.75', 'mercure', { ox: 0.6, oz: -1.1, L: 1.4 }),
      piezo('P1', 'R1', 'g:1.00', 1.5, { ox: 0.9 }));
  },
  'jet-plaque'(s) {
    const v = visee(15, 0.8);
    s.elements.push(lance('LA1', 0, 1.2, { d: 0.06, V: 15, angle: v.angle }),
      { id: 'PL1', type: 'plaque', x: 0.8, z: 1.2 + v.dz, angle: 90, L: 0.8 });
  },
  auget(s) {
    const v = visee(15, 0.8);
    s.elements.push(lance('LA1', 0, 1.2, { d: 0.06, V: 15, angle: v.angle }),
      { id: 'AU1', type: 'auget', x: 0.8, z: 1.2 + v.dz, angle: 180, w: 0.3, beta: 180, sens: 1, u: 5 });
  },
  'plaque-inclinee'(s) {
    const v = visee(12, 0.5);
    s.elements.push(lance('LA1', 0, 1.2, { d: Math.sqrt(4 * 0.030 / (Math.PI * 12)), V: 12, angle: v.angle }),
      { id: 'PL1', type: 'plaque', x: 0.5, z: 1.2 + v.dz, angle: 60, L: 0.8 });
  },
  reaction(s) {
    const r = reservoir('R1', { nom: 'Réservoir sur rouleaux', x: 0, z: 0.4, w: 1.5, H: 3, constant: true, couches: [{ fluide: 'eau', h: 2.25 }] });
    r.rouleaux = true;
    s.elements.push(r, orifice('O1', 'R1', 'd', 0.25, { d: Math.sqrt(4 * 20e-4 / Math.PI), Cd: 1, Cv: 1 }));
  },
  coude(s) {
    // Ciels sous pression imposée : p = 200 kPa dans les coudes hauts, Q = 250 L/s.
    const V = 0.250 / aire(0.3), pv = 1000 * V * V / 2;
    s.elements.push(
      reservoir('R1', { nom: 'Réservoir sous pression', x: 0, z: 0, w: 1.4, H: 2, ferme: true, p: Math.round(200000 + pv), constant: true, couches: [{ fluide: 'eau', h: 1.5 }] }),
      reservoir('R2', { nom: 'Réservoir aval sous pression', x: 5.6, z: 0, w: 1.4, H: 2, ferme: true, p: 200000, constant: true, couches: [{ fluide: 'eau', h: 1.5 }] }),
      conduite('C1', { el: 'R1', port: 'd:0.50' }, { el: 'R2', port: 'g:0.50' }, { D: 0.3, zr: 1.5 }));
  },
  'canal-trapeze'(s) {
    s.elements.push(canal('CA1', { nom: 'canal d’irrigation', L: 2000, section: 'trap', b: 2, m: 1.5, K: 70, i: 0.0004, Q: 5.13, aval: 'normal', sonde: 1000 }));
  },
  caniveau(s) {
    s.elements.push(canal('CA1', { nom: 'caniveau en béton lissé', L: 400, b: 1.5, K: 85, i: 0.002, Q: 2.4, aval: 'libre', sonde: 120 }));
  },
  intumescence(s) {
    s.elements.push(canal('CA1', { nom: 'canal rectangulaire large', x0: -4000, L: 7000, N: 700, b: 10, K: 0, i: 0, Q: 14.4, aval: 'niveau', hAval: 1.6,
      init: { type: 'uniforme', h: 1.6, U: 0.9 }, bosse: { x: 0, dh: 0.2, w: 300 }, ondes: true, station: -3000, sonde: -3000 }));
  },
  rupture(s) {
    s.elements.push(canal('CA1', { nom: 'vallée à fond horizontal', x0: -6000, L: 16000, N: 800, b: 1, K: 0, i: 0, amont: 'mur', aval: 'libre',
      init: { type: 'barrage', xb: 0, h1: 25, h2: 0 }, ritter: true, station: 8000, sonde: 0 }));
  },
  ressaut(s) {
    s.elements.push(canal('CA1', { nom: 'coursier puis bief doux', L: 100, N: 400, b: 1, K: 75, i: 0.05, xr: 25, i2: 0.002, zf0: 2, Q: 1, aval: 'normal', sonde: 60 }));
  },
  convergent(s) {
    // p₁ = 180 kPa juste en amont du convergent (z = 0,5 m), Q = 80 L/s.
    const V1 = 0.080 / aire(0.25), V2 = 0.080 / aire(0.15), g = 9.81;
    const p0 = 180000 + 1000 * V1 * V1 / 2 - 1000 * g * 1.0;
    s.elements.push(
      reservoir('R1', { nom: 'Réservoir sous pression', x: 0, z: 0, w: 1.4, H: 2, ferme: true, p: Math.round(p0), constant: true, couches: [{ fluide: 'eau', h: 1.5 }] }),
      raccord('RC1', 3.2, 0.5),
      reservoir('R2', { nom: 'Réservoir aval sous pression', x: 6, z: 0, w: 1.4, H: 2, ferme: true, p: Math.round(p0 - 1000 * V2 * V2 / 2), constant: true, couches: [{ fluide: 'eau', h: 1.5 }] }),
      conduite('C1', { el: 'R1', port: 'd:0.50' }, { el: 'RC1', port: 'a' }, { D: 0.25 }),
      conduite('C2', { el: 'RC1', port: 'b' }, { el: 'R2', port: 'g:0.50' }, { D: 0.15 }));
  }
};

// Chapitres des expériences (groupes du sélecteur) ; les écoulements fixent leur modèle de fluide.
// (liste ordonnée : des clés numériques passeraient avant les autres dans un objet)
export const GROUPES = [['1-2', 'Chapitres 1 et 2 — hydrostatique'], ['3-4', 'Chapitres 3 et 4 — écoulements, Bernoulli'], ['5', 'Chapitre 5 — quantité de mouvement'], ['6', 'Chapitre 6 — pertes de charge'], ['8', 'Chapitre 8 — surface libre']];
export const SCENARIOS = [
  { id: 'vases', chapitre: '1-2', titre: 'Vases communicants', ref: '§ 2.2.2', ancre: 's-cas-du-liquide-incompressible',
    consigne: 'Ouvrez la vanne V1 (clic) : le liquide passe du château d’eau au bassin jusqu’à l’égalité des surfaces libres. Le volume se conserve : le niveau commun vaut Σ(hᵢSᵢ)/ΣSᵢ. Les piézomètres de la conduite suivent la charge.' },
  { id: 'piezometres', titre: 'Piézomètres et charge piézométrique', ref: '§ 2.2 – 2.3', ancre: 's-piézomètre',
    consigne: 'Les trois piézomètres affleurent la surface libre : z + p/ρg est constant dans un liquide au repos. Faites glisser la surface libre du réservoir et observez les colonnes et les manomètres.' },
  { id: 'bicouche', titre: 'Ex. 2.1 — Huile sur eau', ref: 'Ex. 2.1', ancre: 's-exercice-2.1-pressions-dans-un-réservoir',
    consigne: 'Pression à l’interface : 16,7 kPa ; au fond : 46,1 kPa = 4,70 mCE. Le piézomètre branché dans l’eau s’arrête 30 cm sous la surface de l’huile ; le diagramme des pressions sur la paroi gauche présente un coude à l’interface.' },
  { id: 'pressurise', titre: 'Réservoir fermé sous pression', ref: '§ 2.1.3 – 2.3', ancre: 's-pression-absolue-pression-relative',
    consigne: 'Le ciel gazeux à 20 kPa relève toutes les pressions : le piézomètre monte de p₀/ρg = 2,04 m au-dessus de la surface. Passez l’affichage en pression absolue, ou réglez p₀ négatif (dépression).' },
  { id: 'tube-u', titre: 'Manomètres en U', ref: '§ 2.3.3', ancre: 's-manomètre-en-u',
    consigne: 'Même pression mesurée par deux tubes en U : le mercure (d = 13,6) donne une petite dénivellation, le tétrachlorure (d = 1,59) l’amplifie. Sélectionnez un tube pour suivre le calcul de proche en proche.' },
  { id: 'differentiel', titre: 'Ex. 2.2 — Manomètre différentiel', ref: 'Ex. 2.2', ancre: 's-exercice-2.2-manomètre-différentiel-au-mercure',
    consigne: 'B est 30 cm plus haut que A ; le mercure se dénivelle de 20 cm, le ménisque côté A est 60 cm sous A : pA − pB = 27,7 kPa. Modifiez les pressions des deux enceintes pour voir Δh changer.' },
  { id: 'deux-liquides', titre: 'Deux liquides non miscibles', ref: '§ 1.3 – 2.2', ancre: 's-densité',
    consigne: 'Ouvrez la vanne : l’eau, plus dense, passe sous l’huile. À l’équilibre, la pression est la même au fond des deux branches et les colonnes au-dessus de l’interface sont en raison inverse des densités.' },
  { id: 'pascal', titre: 'Paradoxe de l’hydrostatique', ref: '§ 2.2.2', ancre: 's-cas-du-liquide-incompressible',
    consigne: 'Trois récipients de formes différentes, reliés par le fond : même surface libre, même pression au fond (lisez les manomètres), quelle que soit la quantité de liquide au-dessus.' },
  { id: 'vanne-verticale', titre: 'Ex. 2.4 — Vanne rectangulaire verticale', ref: 'Ex. 2.4', ancre: 's-exercice-2.4-poussée-sur-une-vanne-rectangulaire-verticale',
    consigne: 'Vanne 2,50 × 1,80 m, arête supérieure à 1,20 m sous la surface : F = 92,7 kN, centre de poussée 12,9 cm sous G. Faites glisser la vanne le long de la paroi : C se rapproche de G en profondeur.' },
  { id: 'mur', titre: 'Ex. 2.5 — Mur de réservoir', ref: 'Ex. 2.5', ancre: 's-exercice-2.5-mur-de-réservoir-diagramme-des-pressions',
    consigne: 'Diagramme triangulaire : F = ½ρgbH² = 60,1 kN à H/3 = 1,17 m du pied, moment de renversement 70,1 kN·m. Faites varier le niveau : le moment croît comme H³.' },
  { id: 'vanne-inclinee', titre: 'Ex. 2.6 — Vanne circulaire inclinée', ref: 'Ex. 2.6', ancre: 's-exercice-2.6-vanne-circulaire-inclinée',
    consigne: 'Paroi à 60°, D = 1,20 m, centre à 2,40 m sous la surface : F = 26,6 kN, C à 3,25 cm sous G le long de la paroi. La paroi évasée porte de l’eau : F a une composante verticale vers le bas.' },
  { id: 'caisson', titre: 'Ex. 2.8 – 2.9 — Caisson flottant', ref: 'Ex. 2.8 – 2.9', ancre: 's-exercice-2.9-stabilité-dun-caisson-flottant',
    consigne: 'Caisson 6 × 4 × 3 m de 500 kN : tirant d’eau 2,07 m, GM = 0,28 m (stable). Montez son centre de gravité ou inclinez-le (gîte) pour voir le couple changer de signe. Le bloc de béton (d = 2,4) repose au fond.' },
  { id: 'capillarite', titre: 'Capillarité des tubes piézométriques', ref: '§ 1.6.2', ancre: 's-capillarité-loi-de-jurin',
    consigne: 'Loi de Jurin h = 4σ cos θ/(ρ g d) : dans l’eau, les tubes fins lisent trop haut ; dans le mercure (θ = 130°), trop bas. D’où la règle d ≥ 10 mm pour les piézomètres.' },
  { id: 'vanne-chasse', titre: 'S.1 — Vanne de chasse d’un barrage', ref: 'Problème S.1', ancre: 's-problème-s.1-vanne-de-chasse-dun-barrage-et-butée',
    consigne: 'Pertuis de fond 1,50 × 1,00 m sous 12 m d’eau : F = 169 kN, et C n’est qu’à 7 mm sous G (pression quasi uniforme en grande profondeur). Vanne levante en glissières (f = 0,25, poids 8 kN) : effort de levage 50,3 kN, dont 84 % dus au frottement. Abaissez la retenue pour voir l’effort chuter. La question 3 (débit d’orifice) relève du chapitre 4.' },
  { id: 'batardeau', titre: 'S.6 — Batardeau flottant ballasté', ref: 'Problème S.6', ancre: 's-problème-s.6-batardeau-flottant-échoué-puis-ballasté',
    consigne: 'Caisson acier 12 × 5 × 4 m de 720 kN en mer (niveau constant) : au remorquage, tirant d’eau 1,19 m et GM = 0,54 m. Augmentez le ballast : le caisson s’enfonce, touche le fond à 3,60 m (≈ 144 m³), puis la réaction d’appui croît ; il faut 164 m³ pour R ≥ 200 kN. Tant qu’il flotte, la surface libre du ballast ruine la stabilité (GM < 0 dès 60 m³ avec une seule cuve) : cloisonnez le ballast en 3 compartiments, comme sur chantier, pour la retrouver.' },
  { id: 'nappe', titre: 'Réservoir enterré et remontée de nappe', ref: '§ 2.6.2', ancre: 's-équilibre-des-corps-immergés-et-flottants',
    consigne: 'Bassin enterré vide en béton (1 653 kN) posé sur son radier : nappe à 2,00 m au-dessus du radier, F_A = 1 177 kN, sécurité au soulèvement F_s = 1,40. Remontez la nappe (tirez sa surface) : au-delà de 2,81 m, la poussée l’emporte et l’ouvrage se soulève. Remèdes : lester (ballast, radier épaissi) ou ancrer. Le poids des terres et le frottement latéral, favorables, sont négligés.' },
  { id: 'torricelli', chapitre: '3-4', ecoulement: 'parfait', vitesse: 1, titre: 'Ex. 4.2 — Vidange par un orifice (Torricelli)', ref: 'Ex. 4.2', ancre: 's-exercice-4.2-vidange-dun-réservoir-torricelli',
    consigne: 'Orifice en mince paroi (d = 50 mm, C_d = 0,62) sous 4,00 m d’eau, niveau maintenu : V = √(2gh) = 8,86 m/s, Q = 10,8 L/s. Le jet, lancé à 1,50 m du sol avec C_v·V = 8,68 m/s, touche le sol à 4,80 m. Déplacez l’orifice le long de la paroi : la portée est maximale à mi-hauteur.' },
  { id: 'vidange', chapitre: '3-4', ecoulement: 'parfait', vitesse: 60, titre: 'Ex. 4.3 — Temps de vidange d’un réservoir', ref: 'Ex. 4.3', ancre: 's-exercice-4.3-temps-de-vidange-dun-réservoir-cylindrique',
    consigne: 'Réservoir de section S = π m², orifice d = 50 mm (C_d = 0,62). Le niveau baisse de plus en plus lentement : de 4 m à 1 m au-dessus de l’orifice en t = 2S(√h₁ − √h₂)/(C_d s √2g) = 1 166 s ≈ 19,4 min. Le temps est accéléré (× 60) : suivez le chronomètre.' },
  { id: 'remplissage', chapitre: '3-4', ecoulement: 'parfait', vitesse: 30, titre: 'Ex. 3.5 — Remplissage d’un réservoir', ref: 'Ex. 3.5', ancre: 's-exercice-3.5-remplissage-dun-réservoir-régime-non-permanent',
    consigne: 'Bilan de volume S dh/dt = Q_e − Q_s : le robinet apporte 25 L/s, la pompe en retire 10 L/s, le niveau monte de 2,12 mm/s et gagne 1,50 m en 707 s (temps accéléré × 30). Fermez le robinet ou changez le débit de la pompe.' },
  { id: 'bernoulli', chapitre: '3-4', ecoulement: 'parfait', vitesse: 1, titre: 'Ex. 4.1 — Continuité et Bernoulli', ref: 'Ex. 4.1', ancre: 's-exercice-4.1-conduite-avec-changement-de-section-et-de-niveau',
    consigne: 'Q = 20 L/s : V₁ = 1,13 m/s dans le DN 150, V₂ = 2,55 m/s dans le DN 100 (continuité). Entre M1 et M2, la pression chute de 24,5 kPa (montée de 2,50 m) et de 2,6 kPa (accélération) : p₂ − p₁ = −27,1 kPa. Lignes de charge horizontale et piézométrique tracées en fluide parfait.' },
  { id: 'pitot', chapitre: '3-4', ecoulement: 'parfait', vitesse: 1, titre: 'Ex. 4.4 — Tube de Pitot', ref: 'Ex. 4.4', ancre: 's-exercice-4.4-tube-de-pitot-en-conduite',
    consigne: 'Le piézomètre statique P1 lit la ligne piézométrique, le tube de Pitot P2 (prise face au courant) la ligne de charge : l’écart vaut V²/2g. Le Pitot double U1 au mercure indique 60 mm, d’où V = √(2(ρ_Hg − ρ)gΔh/ρ) = 3,85 m/s. Le jet de sortie remonte jusqu’au niveau du réservoir : c’est Bernoulli.' },
  { id: 'venturi', chapitre: '3-4', ecoulement: 'reel', vitesse: 1, titre: 'Ex. 4.5 — Débitmètre de Venturi', ref: 'Ex. 4.5', ancre: 's-exercice-4.5-débitmètre-de-venturi',
    consigne: 'Venturi D₁ = 200 mm, col d = 100 mm, débit 48,4 L/s : la pression chute au col (V₂ = 6,16 m/s), le manomètre au mercure se dénivelle, et la formule Q = C_q S₂ √(2Δp/(ρ(1 − (S₂/S₁)²))) restitue le débit. Le divergent récupère presque toute la pression.' },
  { id: 'siphon', chapitre: '3-4', ecoulement: 'parfait', vitesse: 1, titre: 'Ex. 4.6 — Siphon', ref: 'Ex. 4.6', ancre: 's-exercice-4.6-siphon',
    consigne: 'Siphon d = 80 mm, point haut 1,50 m au-dessus de la surface, sortie 3,00 m dessous : V = √(2g·3) = 7,67 m/s, Q = 38,6 L/s, pression absolue au sommet 57,2 kPa. Montez le passage de la conduite (poignée) : au-delà de 7,09 m, la veine se rompt (cavitation).' },
  { id: 'pompage', chapitre: '3-4', ecoulement: 'parfait', vitesse: 1, titre: 'Ex. 4.7 — Pompage (fluide parfait)', ref: 'Ex. 4.7', ancre: 's-exercice-4.7-pompage-entre-deux-réservoirs-fluide-parfait',
    consigne: 'Sans frottement, la pompe ne fournit que la hauteur géométrique : H = 35,0 m pour 30 L/s, puissance hydraulique 10,3 kW, absorbée 14,7 kW (η = 0,70). Passez en fluide réel : les pertes de charge s’ajoutent.' },
  { id: 'jet-plaque', chapitre: '5', ecoulement: 'parfait', vitesse: 1, titre: 'Ex. 5.1 — Jet sur une plaque fixe', ref: 'Ex. 5.1', ancre: 's-exercice-5.1-jet-sur-plaque-fixe-perpendiculaire',
    consigne: 'Jet d = 60 mm, V = 15 m/s, Q = 42,4 L/s, normal à la plaque : la quantité de mouvement ρQV = 636 N, détruite dans l’axe, pousse la plaque. Le jet se partage en deux nappes égales qui filent le long de la plaque. Inclinez la plaque (inspecteur) : l’effort normal devient ρQV sin α.' },
  { id: 'auget', chapitre: '5', ecoulement: 'parfait', vitesse: 1, titre: 'Ex. 5.2 — Auget fixe puis mobile', ref: 'Ex. 5.2', ancre: 's-exercice-5.2-jet-sur-auget-fixe-puis-mobile',
    consigne: 'L’auget retourne le jet : fixe, F = 2ρSV² = 1 272 N. Animé de u = 5 m/s, il ne voit plus que la vitesse relative V − u : F = 2ρS(V − u)² = 565 N et P = F·u = 2,83 kW, le maximum (u = V/3, courbe P(u) dans l’inspecteur). À u = V/2, l’eau renvoyée repart à vitesse nulle.' },
  { id: 'coude', chapitre: '5', ecoulement: 'parfait', vitesse: 1, titre: 'Ex. 5.3 — Effort sur un coude', ref: 'Ex. 5.3', ancre: 's-exercice-5.3-force-dancrage-dun-coude-horizontal',
    consigne: 'DN 300, Q = 250 L/s, V = 3,54 m/s, p = 200 kPa dans les coudes hauts : chaque coude à 90° subit F = (pS + ρQV)√2 = (14,1 + 0,9)√2 = 21,2 kN sur sa bissectrice extérieure. Coudes ici dans le plan vertical, poids de l’eau négligé. Fermez la conduite par la pression aval : l’effort de pression demeure, c’est lui qui dimensionne les butées.' },
  { id: 'convergent', chapitre: '5', ecoulement: 'parfait', vitesse: 1, titre: 'Ex. 5.4 — Convergent : effort sur la bride', ref: 'Ex. 5.4', ancre: 's-exercice-5.4-convergent-horizontal-effort-sur-la-bride',
    consigne: 'D = 250 → 150 mm, Q = 80 L/s, p₁ = 180 kPa : Bernoulli donne p₂ = 171 kPa, et le bilan axial F = p₁S₁ + ρQV₁ − p₂S₂ − ρQV₂ = 5,58 kN pousse le convergent vers l’aval. Sélectionnez le raccord pour suivre la projection d’Euler.' },
  { id: 'reaction', chapitre: '5', ecoulement: 'parfait', vitesse: 1, titre: 'Ex. 5.5 — Réaction d’un jet', ref: 'Ex. 5.5', ancre: 's-exercice-5.5-réaction-dun-jet-à-la-sortie-dun-réservoir',
    consigne: 'Orifice profilé (C_d = 1) de 20 cm² sous h = 2 m : V = 6,26 m/s, Q = 12,5 L/s, et le réservoir sur rouleaux est repoussé par F = ρQV = 2ρghs = 78,4 N, le double de la poussée hydrostatique sur un bouchon. Doublez la charge : la réaction double aussi.' },
  { id: 'plaque-inclinee', chapitre: '5', ecoulement: 'parfait', vitesse: 1, titre: 'Ex. 5.6 — Jet sur plaque inclinée', ref: 'Ex. 5.6', ancre: 's-exercice-5.6-jet-incliné-sur-plaque-décomposition-du-débit',
    consigne: 'Jet V = 12 m/s, Q = 30 L/s, plaque lisse à 60° : effort normal ρQV sin α = 312 N ; la quantité de mouvement tangentielle se conserve, d’où Q₁ = Q(1 + cos α)/2 = 22,5 L/s vers l’aval et Q₂ = 7,5 L/s vers l’amont. Tournez la plaque pour voir le partage changer.' },
  { id: 'gravitaire', chapitre: '6', ecoulement: 'reel', vitesse: 1, titre: 'Ex. 6.4 — Conduite gravitaire', ref: 'Ex. 6.4', ancre: 's-exercice-6.4-conduite-gravitaire-entre-deux-réservoirs',
    consigne: 'Fonte ε = 0,25 mm, D = 150 mm, L = 1 200 m, ΣK = 4,5, Δz = 18 m : Colebrook donne λ ≈ 0,023 et Q ≈ 24 L/s. La ligne de charge descend de l’amont à l’aval. Fermez progressivement la vanne : le débit ne baisse vraiment qu’en fin de course.' },
  { id: 'station', chapitre: '6', ecoulement: 'reel', vitesse: 1, titre: 'Ex. 6.6 — Station de pompage', ref: 'Ex. 6.6', ancre: 's-exercice-6.6-installation-de-pompage-complète',
    consigne: 'Q = 25 L/s, λ = 0,022 : pertes à l’aspiration 0,52 m, au refoulement 23,9 m ; HMT = 46,0 + 24,4 = 70,4 m, P_h = 17,3 kW, P_abs = 24,0 kW (η = 0,72). Essayez un refoulement en DN 150 : la puissance baisse d’environ 20 %.' },
  { id: 'borda', chapitre: '6', ecoulement: 'reel', vitesse: 1, titre: 'Ex. 6.7 — Élargissement brusque', ref: 'Ex. 6.7', ancre: 's-exercice-6.7-élargissement-brusque-bordacarnot',
    consigne: 'D = 100 → 200 mm, Q = 15 L/s : la vitesse tombe de 1,91 à 0,48 m/s, la perte de Borda vaut (U₁ − U₂)²/2g = 0,105 m, et la pression remonte de 6,9 cm d’eau seulement (677 Pa) au lieu des 17,4 cm d’une récupération sans perte.' },
  { id: 'canal-trapeze', chapitre: '8', ecoulement: 'reel', vitesse: 60, titre: 'Ex. 8.1 — Canal trapézoïdal uniforme', ref: 'Ex. 8.1', ancre: 's-exercice-8.1-canal-trapézoïdal-en-régime-uniforme',
    consigne: 'b = 2 m, fruit 3H/2V, K = 70, i = 0,4 ‰ : à h = 1,20 m, S = 4,56 m², P_m = 6,33 m, R_h = 0,721 m et Manning–Strickler donne Q = 5,13 m³/s, U = 1,13 m/s, Fr = 0,40 (fluvial). La ligne d’eau suit la profondeur normale h_n. Augmentez le débit dans l’inspecteur : l’onde se propage, puis un nouveau régime uniforme s’installe.' },
  { id: 'caniveau', chapitre: '8', ecoulement: 'reel', vitesse: 10, titre: 'Ex. 8.2 — Profondeur normale d’un caniveau', ref: 'Ex. 8.2', ancre: 's-exercice-8.2-profondeur-normale-dun-collecteur-rectangulaire',
    consigne: 'b = 1,50 m, K = 85, i = 2 ‰, Q = 2,40 m³/s : h_n ≈ 0,80 m (Fr = 0,71, fluvial) et h_c = 0,64 m. En bout de caniveau, la chute libre abaisse la ligne d’eau vers h_c (courbe de remous M2). Choisissez un niveau aval imposé de 1,20 m : la courbe M1 remonte vers l’amont.' },
  { id: 'intumescence', chapitre: '8', ecoulement: 'reel', vitesse: 30, titre: 'Ex. 8.3 — Propagation d’une intumescence', ref: 'Ex. 8.3', ancre: 's-exercice-8.3-célérité-et-propagation-dune-intumescence',
    consigne: 'h = 1,60 m, U = 0,90 m/s : c = √(gh) = 3,96 m/s, Fr = 0,23. La bosse créée au droit de la vanne se partage en deux ondes, l’une descend à U + c = 4,86 m/s, l’autre remonte le courant à U − c = −3,06 m/s et atteint l’ouvrage situé 3 km à l’amont après 980 s (temps × 30). Créez d’autres intumescences depuis l’inspecteur.' },
  { id: 'rupture', chapitre: '8', ecoulement: 'reel', vitesse: 20, titre: 'Ex. 8.4 — Rupture de barrage (Ritter)', ref: 'Ex. 8.4', ancre: 's-exercice-8.4-onde-de-rupture-de-barrage-solution-de-ritter',
    consigne: 'Retenue de 25 m sur fond sec et horizontal : le front dévale à 2√(gh₀) = 31,3 m/s, la profondeur au droit du barrage reste à 4/9 h₀ = 11,1 m avec une vitesse de 10,4 m/s, et l’onde atteint 8 km en 256 s. La courbe tiretée est la solution de Ritter ; le calcul numérique, légèrement diffusif, en suit la détente parabolique.' },
  { id: 'ressaut', chapitre: '8', ecoulement: 'reel', vitesse: 1, titre: 'Ressaut hydraulique au pied d’un coursier', ref: '§ 8.2', ancre: 's-célérité-des-ondes-et-nombre-de-froude',
    consigne: 'Q = 1 m³/s dans un canal de 1 m : sur le coursier à 5 %, l’écoulement est torrentiel (h_n = 0,21 m, Fr ≈ 3,3) ; sur le bief à 2 ‰, fluvial (h_n = 0,68 m). Le passage se fait par un ressaut dont les hauteurs conjuguées vérifient h₂/h₁ = (√(1 + 8Fr₁²) − 1)/2. Abaissez la pente aval : le ressaut remonte vers le coursier.' },
  { id: 'cavitation', titre: 'Dépression et vaporisation', ref: '§ 1.7 – 2.1.3', ancre: 's-pression-de-vapeur-saturante-et-cavitation',
    consigne: 'Ciel à −60 kPa : la pression absolue en surface tombe à 41 kPa, sous la pression de vapeur de l’essence (55 kPa) : le liquide se vaporise. Remplacez l’essence par de l’eau (pv = 2,3 kPa) et l’alerte disparaît. Le piézomètre ne peut pas mesurer une dépression ; le tube en U, si.' }
];

export function creerScenario(id) {
  const meta = SCENARIOS.find(k => k.id === id);
  const s = sceneVide(meta ? meta.titre : 'Nouvelle expérience');
  if (meta && fabriques[id]) fabriques[id](s);
  if (meta && meta.ecoulement) { s.env.ecoulement = meta.ecoulement; s.env.vitesse = meta.vitesse || 1; s.env.vues.champ = false; }
  if (meta && meta.chapitre === '5') { s.env.vues.efforts = true; s.env.vues.lignes = false; }
  const ctx = contexte(s);
  for (const e of s.elements) if (e.type === 'reservoir') calerGaz(e, ctx, s);
  if (id === 'caisson') s.env.vues.champ = false;
  return s;
}
