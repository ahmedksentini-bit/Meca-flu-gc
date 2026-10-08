// Laboratoire virtuel d'hydrostatique — moteur de calcul (chapitres 1 et 2 du cours) ;
// les écoulements (chapitres 3, 4 et 6) le prolongent dans labo-ecoulement.js.
//
// Module pur, sans DOM, testé par tests/labo.test.mjs. Unités SI ; les pressions
// sont relatives (p − p_atm) sauf mention « abs ». Le plan de travail est une
// coupe verticale : x horizontal, z vertical ascendant, b profondeur normale au
// plan du dessin.
//
// Hypothèses (rappelées dans l'interface) : fluides au repos ; liquides
// incompressibles et non miscibles, stratifiés par densité ; poids des gaz
// négligé ; gaz piégés isothermes (p·V constant) ; appareils de mesure de volume
// négligeable devant celui des réservoirs ; conduites amorcées.

export const G = 9.81;
export const PATM = 101325;
export const VERSION = 1;
export const MAX_ELEMENTS = 60;

// Propriétés à 20 °C (chapitre 1). mu : viscosité dynamique ; sigma : tension
// superficielle au contact de l'air ; theta : angle de raccordement sur le verre ;
// Ev : module d'élasticité volumique ; pv : pression de vapeur saturante.
export const FLUIDES = {
  eau: { nom: 'Eau douce', rho: 1000, mu: 1.0e-3, sigma: 0.073, theta: 0, Ev: 2.2e9, pv: 2340, couleur: '#8CC4DA' },
  mer: { nom: 'Eau de mer', rho: 1025, mu: 1.08e-3, sigma: 0.074, theta: 0, Ev: 2.34e9, pv: 2300, couleur: '#5DA3BD' },
  huile: { nom: 'Huile (d = 0,85)', rho: 850, mu: 0.18, sigma: 0.032, theta: 0, Ev: 1.6e9, pv: 10, couleur: '#E6BE62' },
  essence: { nom: 'Essence', rho: 720, mu: 5.0e-4, sigma: 0.022, theta: 0, Ev: 1.3e9, pv: 55000, couleur: '#F3DD96' },
  glycerine: { nom: 'Glycérine', rho: 1260, mu: 1.49, sigma: 0.063, theta: 0, Ev: 4.35e9, pv: 0.01, couleur: '#C8B4DD' },
  tetra: { nom: 'Tétrachlorure (d = 1,59)', rho: 1590, mu: 9.7e-4, sigma: 0.027, theta: 0, Ev: 1.31e9, pv: 12000, couleur: '#93C6A2' },
  mercure: { nom: 'Mercure', rho: 13600, mu: 1.55e-3, sigma: 0.48, theta: 130, Ev: 2.85e10, pv: 0.17, couleur: '#8A949C' },
  air: { nom: 'Air', rho: 1.2, mu: 1.8e-5, sigma: 0, theta: 0, Ev: 1.42e5, pv: 0, gaz: true, couleur: '#F1F5F7' },
  perso: { nom: 'Liquide personnalisé', rho: 1200, mu: 1e-3, sigma: 0.05, theta: 0, Ev: 2e9, pv: 2000, couleur: '#D9A1A1' }
};
export const LIQUIDES = Object.keys(FLUIDES).filter(k => !FLUIDES[k].gaz);

export const UNITES = {
  Pa: { nom: 'Pa', f: 1, d: 0 },
  kPa: { nom: 'kPa', f: 1e-3, d: 2 },
  bar: { nom: 'bar', f: 1e-5, d: 4 },
  mCE: { nom: 'mCE', f: 1 / 9810, d: 3 },
  mmHg: { nom: 'mmHg', f: 1 / 133.322, d: 1 }
};

// ---------- mise en forme (virgule décimale, espaces fines) ----------
export function nombre(v, d = 2) {
  if (!Number.isFinite(v)) return '—';
  // Le léger décalage relatif arrondit 44,145 en 44,15 quel que soit le chemin de calcul.
  const t = Math.abs(v) < 0.5 * Math.pow(10, -d) ? (0).toFixed(d) : (v * (1 + 1e-12)).toFixed(d);
  const [ent, dec] = t.split('.');
  const signe = ent.startsWith('-') ? '−' : '';
  const e = ent.replace('-', '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return signe + e + (dec ? ',' + dec : '');
}
export function pression(p, unite = 'kPa') {
  const u = UNITES[unite] || UNITES.kPa;
  return nombre(p * u.f, u.d) + ' ' + u.nom;
}

// ---------- contexte de calcul ----------
const fini = v => typeof v === 'number' && Number.isFinite(v);
export function contexte(scene) {
  const env = (scene && scene.env) || {};
  const g = fini(env.g) ? env.g : G;
  const patm = fini(env.patm) ? env.patm : PATM;
  const rhoPerso = scene && scene.perso && fini(scene.perso.rho) ? scene.perso.rho : FLUIDES.perso.rho;
  const muPerso = scene && scene.perso && fini(scene.perso.mu) ? scene.perso.mu : FLUIDES.perso.mu;
  const perso = { ...FLUIDES.perso, rho: rhoPerso, mu: muPerso };
  const fl = id => (id === 'perso' ? perso : FLUIDES[id]) || null;
  return { g, patm, fl, rho: id => (id && fl(id) && !fl(id).gaz ? fl(id).rho : 0) };
}

// ---------- géométrie d'un réservoir ----------
// Paroi gauche verticale ; paroi droite inclinée de alpha sur l'horizontale
// (90° : verticale ; < 90° : évasée vers l'extérieur ; > 90° : en surplomb).
const rad = d => d * Math.PI / 180;
export function cotan(r) {
  const a = fini(r.alpha) ? r.alpha : 90;
  return Math.abs(a - 90) < 1e-9 ? 0 : 1 / Math.tan(rad(a));
}
export const largeurA = (r, s) => r.w + s * cotan(r);
const volumeGeom = (r, s) => r.b * (r.w * s + cotan(r) * s * s / 2);
export const longueurParoi = (r, paroi) => paroi === 'd' ? r.H / Math.sin(rad(fini(r.alpha) ? r.alpha : 90))
  : paroi === 'g' ? r.H : paroi === 'f' ? r.w : largeurA(r, r.H);

// Volume disponible jusqu'à la hauteur s, flotteurs déduits (obstacles).
function volumeLibre(r, s, obs) {
  let v = volumeGeom(r, s);
  for (const o of obs) v -= o.A * Math.min(Math.max(s - o.s0, 0), o.s1 - o.s0);
  return v;
}
function hauteurPourVolume(r, V, obs) {
  if (!(V > 0)) return 0;
  if (!obs.length) {
    const c = cotan(r);
    const s = Math.abs(c) < 1e-12 ? V / (r.b * r.w) : (-r.w + Math.sqrt(Math.max(0, r.w * r.w + 2 * c * V / r.b))) / c;
    return Math.min(s, r.H);
  }
  if (V >= volumeLibre(r, r.H, obs)) return r.H;
  let lo = 0, hi = r.H;
  for (let i = 0; i < 64; i++) { const m = (lo + hi) / 2; if (volumeLibre(r, m, obs) < V) lo = m; else hi = m; }
  return (lo + hi) / 2;
}
export const capacite = r => volumeGeom(r, r.H);

// Couches données par hauteurs (du fond vers le haut) → volumes.
export function couchesDepuisHauteurs(r, liste) {
  let s = 0;
  return liste.map(({ fluide, h }) => {
    const s1 = Math.min(r.H, s + Math.max(0, h));
    const V = volumeGeom(r, s1) - volumeGeom(r, s);
    s = s1;
    return { fluide, V };
  }).filter(c => c.V > 0);
}

// Tri par densité décroissante et fusion des couches d'un même fluide.
export function trierCouches(couches, ctx) {
  const parFluide = new Map();
  for (const c of couches) if (c.V > 1e-12) parFluide.set(c.fluide, (parFluide.get(c.fluide) || 0) + c.V);
  return [...parFluide].map(([fluide, V]) => ({ fluide, V })).sort((a, b) => ctx.rho(b.fluide) - ctx.rho(a.fluide));
}

// ---------- état hydrostatique d'un réservoir ----------
// Un réservoir « à niveau imposé » (mer, nappe, grande retenue) garde sa surface
// libre à la hauteur hc : la couche supérieure s'ajuste aux volumes déplacés.
function imposerNiveau(r, obs) {
  if (!r.constant || !r.couches.length || !fini(r.hc)) return;
  const cible = volumeLibre(r, Math.min(Math.max(r.hc, 0), r.H), obs);
  const dessous = r.couches.slice(0, -1).reduce((t, c) => t + c.V, 0);
  r.couches[r.couches.length - 1].V = Math.max(1e-9, cible - dessous);
}
export function etatReservoir(r, ctx, obs = []) {
  imposerNiveau(r, obs);
  const niveaux = [];
  let V = 0, s0 = 0;
  for (const c of r.couches) {
    if (!(c.V > 0)) continue;
    V += c.V;
    const s1 = hauteurPourVolume(r, V, obs);
    niveaux.push({ fluide: c.fluide, rho: ctx.rho(c.fluide), V: c.V, s0, s1, z0: r.z + s0, z1: r.z + s1 });
    s0 = s1;
  }
  const Vtot = volumeLibre(r, r.H, obs);
  const Vgaz = Math.max(Vtot - V, 0);
  let pCiel = 0;
  if (r.ferme) pCiel = r.ciel.mode === 'piege' ? r.ciel.n / Math.max(Vgaz, 1e-9) - ctx.patm : r.ciel.p;
  let p = pCiel;
  for (let i = niveaux.length - 1; i >= 0; i--) {
    const n = niveaux[i];
    n.pHaut = p;
    p += n.rho * ctx.g * (n.s1 - n.s0);
    n.pBas = p;
    n.charge = n.z1 + n.pHaut / (n.rho * ctx.g); // plan de charge de la couche
  }
  return { id: r.id, r, niveaux, sL: s0, zL: r.z + s0, Vliq: V, Vtot, Vgaz, pCiel, pFond: p, obs };
}
export function pressionDans(e, z, ctx) {
  if (z >= e.zL) return e.pCiel;
  for (let i = e.niveaux.length - 1; i >= 0; i--) {
    const n = e.niveaux[i];
    if (z >= n.z0 || i === 0) return n.pHaut + n.rho * ctx.g * (n.z1 - z);
  }
  return e.pCiel;
}
export function coucheA(e, z) {
  for (const n of e.niveaux) if (z >= n.z0 - 1e-9 && z < n.z1 - 1e-9) return n;
  return null;
}

// ---------- points de piquage ----------
// Identifiant « paroi:s » : g, d (s = hauteur au-dessus du fond), f (fond),
// h (couvercle d'un réservoir fermé) ; s = abscisse depuis le coin gauche.
export const PAS_PIQUAGE = 0.25;
const arrondi = (v, p = 1e-6) => Math.round(v / p) * p;
export function portReservoir(r, paroi, s) {
  const H = r.H, w = r.w;
  if (paroi === 'g' || paroi === 'd') {
    if (!(s > 1e-9 && s < H - 1e-9)) return null;
    const x = paroi === 'g' ? r.x : r.x + w + s * cotan(r);
    return { id: `${paroi}:${s.toFixed(2)}`, el: r.id, paroi, s, x, z: r.z + s, sx: paroi === 'g' ? -1 : 1, sz: 0 };
  }
  if (paroi === 'f') {
    if (!(s > 1e-9 && s < w - 1e-9)) return null;
    return { id: `f:${s.toFixed(2)}`, el: r.id, paroi, s, x: r.x + s, z: r.z, sx: 0, sz: -1 };
  }
  if (paroi === 'h') {
    if (!r.ferme || !(s > 1e-9 && s < largeurA(r, H) - 1e-9)) return null;
    return { id: `h:${s.toFixed(2)}`, el: r.id, paroi, s, x: r.x + s, z: r.z + H, sx: 0, sz: 1 };
  }
  return null;
}
export function portsReservoir(r) {
  const res = [];
  for (let s = PAS_PIQUAGE; s < r.H - 1e-6; s = arrondi(s + PAS_PIQUAGE)) {
    res.push(portReservoir(r, 'g', s), portReservoir(r, 'd', s));
  }
  for (const k of [0.25, 0.5, 0.75]) res.push(portReservoir(r, 'f', arrondi(r.w * k, 0.01)));
  if (r.ferme) for (const k of [0.25, 0.5, 0.75]) res.push(portReservoir(r, 'h', arrondi(largeurA(r, r.H) * k, 0.01)));
  return res.filter(Boolean);
}
export const TAPS_CONDUITE = [0.2, 0.35, 0.5, 0.65, 0.8];

export function indexer(scene) {
  const m = new Map();
  for (const e of scene.elements) m.set(e.id, e);
  return m;
}
function lirePort(id) {
  const m = /^([gdfhtk]):(-?\d+(?:\.\d+)?)$/.exec(String(id || ''));
  if (m) return { paroi: m[1], s: +m[2] };
  return /^(o|asp|ref|a|b)$/.test(String(id || '')) ? { paroi: id, s: 0 } : null;
}
// Appareils posés librement dans le plan (écoulements) et leurs raccords.
export const APPAREILS = ['exutoire', 'pompe', 'raccord'];
export function portAppareil(el, port) {
  if (el.type === 'exutoire' && port === 'o') return { x: el.x, z: el.z, sx: 0, sz: 0 };
  const d = el.sens === -1 ? -1 : 1;
  if (el.type === 'pompe' && (port === 'asp' || port === 'ref')) {
    const s = port === 'asp' ? -d : d;
    return { x: el.x + s * 0.35, z: el.z, sx: s, sz: 0 };
  }
  if (el.type === 'raccord' && (port === 'a' || port === 'b')) {
    const s = port === 'a' ? -1 : 1;
    return { x: el.x + s * 0.2, z: el.z, sx: s, sz: 0 };
  }
  return null;
}
export const PORTS_APPAREIL = { exutoire: ['o'], pompe: ['asp', 'ref'], raccord: ['a', 'b'] };
// Résout une référence {el, port} en coordonnées ; les conduites exposent des
// piquages « t:0.50 » le long de leur tracé.
export function resoudre(scene, ref, idx = indexer(scene)) {
  if (!ref) return null;
  const el = idx.get(ref.el), q = lirePort(ref.port);
  if (!el || !q) return null;
  if (el.type === 'reservoir') return ['g', 'd', 'f', 'h'].includes(q.paroi) ? portReservoir(el, q.paroi, q.s) : null;
  if (el.type === 'conduite' && (q.paroi === 't' || q.paroi === 'k')) {
    const tr = traceConduite(el, scene, idx);
    if (!tr || !(q.s > 0 && q.s < 1)) return null;
    const p = pointSurTrace(tr, q.s);
    // « k » : prise de pression totale (tube de Pitot) au même point.
    return { id: ref.port, el: el.id, paroi: q.paroi, s: q.s, x: p.x, z: p.z, sx: 0, sz: 1, t: q.s, total: q.paroi === 'k' };
  }
  if (APPAREILS.includes(el.type)) {
    const a = portAppareil(el, ref.port);
    return a ? { id: ref.port, el: el.id, paroi: 'appareil', s: 0, ...a } : null;
  }
  return null;
}

// ---------- conduites ----------
export function traceConduite(c, scene, idx = indexer(scene)) {
  const A = resoudre(scene, c.a, idx), B = resoudre(scene, c.b, idx);
  if (!A || !B || A.paroi === 't' || B.paroi === 't' || A.paroi === 'k' || B.paroi === 'k') return null;
  const L0 = 0.3;
  const A1 = { x: A.x + A.sx * L0, z: A.z + A.sz * L0 }, B1 = { x: B.x + B.sx * L0, z: B.z + B.sz * L0 };
  const zr = fini(c.zr) ? c.zr : zPassageDefaut(A, B);
  const brut = [{ x: A.x, z: A.z }, A1, { x: A1.x, z: zr }, { x: B1.x, z: zr }, B1, { x: B.x, z: B.z }];
  const pts = [];
  for (const p of brut) {
    const q = pts[pts.length - 1];
    if (q && Math.hypot(p.x - q.x, p.z - q.z) < 1e-9) continue;
    const r = pts[pts.length - 2];
    if (q && r && Math.abs((q.x - r.x) * (p.z - q.z) - (q.z - r.z) * (p.x - q.x)) < 1e-12 &&
      (q.x - r.x) * (p.x - q.x) + (q.z - r.z) * (p.z - q.z) > 0) { pts[pts.length - 1] = p; continue; }
    pts.push(p);
  }
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z));
  return { A, B, pts, cum, L: cum[cum.length - 1], zr };
}
export function zPassageDefaut(A, B) {
  const zA = A.z + A.sz * 0.3, zB = B.z + B.sz * 0.3;
  return A.sz > 0 || B.sz > 0 ? Math.max(zA, zB) : Math.min(zA, zB);
}
export function pointSurTrace(tr, t) {
  const d = Math.max(0, Math.min(1, t)) * tr.L;
  for (let i = 1; i < tr.pts.length; i++) {
    if (d <= tr.cum[i] + 1e-12 || i === tr.pts.length - 1) {
      const l = tr.cum[i] - tr.cum[i - 1] || 1, u = Math.max(0, Math.min(1, (d - tr.cum[i - 1]) / l));
      const a = tr.pts[i - 1], b = tr.pts[i];
      return { x: a.x + (b.x - a.x) * u, z: a.z + (b.z - a.z) * u, i };
    }
  }
  return { ...tr.pts[0], i: 1 };
}
// Projection d'un point sur le tracé → paramètre t et distance.
export function projeterSurTrace(tr, x, z) {
  let best = { t: 0, d: Infinity, x: tr.pts[0].x, z: tr.pts[0].z };
  for (let i = 1; i < tr.pts.length; i++) {
    const a = tr.pts[i - 1], b = tr.pts[i], dx = b.x - a.x, dz = b.z - a.z, l2 = dx * dx + dz * dz || 1;
    const u = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / l2));
    const px = a.x + dx * u, pz = a.z + dz * u, d = Math.hypot(x - px, z - pz);
    if (d < best.d) best = { t: tr.L ? (tr.cum[i - 1] + u * Math.sqrt(l2)) / tr.L : 0, d, x: px, z: pz };
  }
  return best;
}
export const vannesDe = (scene, c) => scene.elements.filter(e => e.type === 'vanne' && e.conduite === c.id);
export const estOuverte = (scene, c) => vannesDe(scene, c).every(v => v.ouverte);

// ---------- flotteurs ----------
function recouvrement(a0, a1, b0, b1) { return Math.max(0, Math.min(a1, b1) - Math.max(a0, b0)); }
// Caisson creux (parois d'épaisseur e) : ballast liquide au fond de la cavité.
export function lestFlotteur(f, ctx) {
  const e = f.creux && fini(f.e) ? f.e : 0;
  const li = Math.max(0.01, f.l - 2 * e), bi = Math.max(0.01, f.b - 2 * e), hi = Math.max(0.01, f.h - 2 * e);
  const Vmax = f.creux ? li * bi * hi : 0;
  const V = f.creux ? Math.min(Math.max(f.ballast || 0, 0), Vmax) : 0;
  const rho = ctx.rho(f.ballastFluide || 'eau');
  const h = V / (li * bi);
  const n = Math.max(1, Math.round(f.cloisons || 1)); // compartiments répartis sur la largeur l
  return { V, Vmax, m: rho * V, rho, h, e, li, bi, hi, n, zc: e + h / 2, surfaceLibre: V > 1e-9 && V < Vmax - 1e-9 };
}
export const masseTotale = (f, ctx) => f.m + lestFlotteur(f, ctx).m;
export function equilibreFlotteur(f, e, ctx) {
  const A = f.l * f.b, P = masseTotale(f, ctx) * ctx.g;
  const poussee = s0 => {
    let F = 0;
    for (const n of e.niveaux) F += n.rho * recouvrement(n.s0, n.s1, s0, s0 + f.h);
    return ctx.g * A * F;
  };
  const F0 = poussee(0);
  if (F0 <= P) return { s0: 0, P, FA: F0, R: P - F0, fond: true };
  let lo = 0, hi = Math.max(e.sL, 0);
  for (let i = 0; i < 64; i++) { const m = (lo + hi) / 2; if (poussee(m) > P) lo = m; else hi = m; }
  const s0 = (lo + hi) / 2;
  return { s0, P, FA: poussee(s0), R: 0, fond: false };
}
function obstaclesDe(r, flotteurs, ctx) {
  if (!flotteurs.length) return [];
  let obs = flotteurs.map(f => ({ id: f.id, s0: fini(f._s0) ? f._s0 : 0, s1: (fini(f._s0) ? f._s0 : 0) + f.h, A: f.l * f.b }));
  for (let it = 0; it < 40; it++) {
    const e = etatReservoir(r, ctx, obs);
    let delta = 0;
    obs = flotteurs.map((f, i) => {
      const s0 = equilibreFlotteur(f, e, ctx).s0;
      delta = Math.max(delta, Math.abs(s0 - obs[i].s0));
      return { id: f.id, s0, s1: s0 + f.h, A: f.l * f.b };
    });
    if (delta < 1e-9) break;
  }
  flotteurs.forEach((f, i) => { f._s0 = obs[i].s0; });
  return obs;
}
export function etatAvecFlotteurs(scene, r, ctx) {
  const fs = scene.elements.filter(e => e.type === 'flotteur' && e.reservoir === r.id);
  return etatReservoir(r, ctx, obstaclesDe(r, fs, ctx));
}

// ---------- vases communicants : relaxation ----------
// Chaque conduite ouverte transfère le liquide présent à son piquage amont tant
// que la charge motrice D = p₁ − p₂ + ρg(z₁ − z₂) est positive. Le pas exact
// D/K (K : raideur des deux surfaces libres et des ciels gazeux) est amorti par
// un facteur ≤ 1 ; un facteur faible donne l'animation, 1 la solution.
const TOL_P = 0.5;
function retirer(r, ctx, fluide, dV) {
  const c = r.couches.find(k => k.fluide === fluide);
  if (c) c.V = Math.max(0, c.V - dV);
  r.couches = r.couches.filter(k => k.V > 1e-12);
}
function ajouter(r, ctx, fluide, dV) {
  const c = r.couches.find(k => k.fluide === fluide);
  if (c) c.V += dV; else r.couches.push({ fluide, V: dV });
  r.couches = trierCouches(r.couches, ctx);
}
function deverser(scene, r, ctx) {
  if (r.ferme || r.constant) return 0;
  const e = etatAvecFlotteurs(scene, r, ctx);
  let exces = e.Vliq - e.Vtot;
  if (exces <= 1e-12) return 0;
  const perdu = exces;
  for (let i = r.couches.length - 1; i >= 0 && exces > 0; i--) {
    const d = Math.min(r.couches[i].V, exces);
    r.couches[i].V -= d; exces -= d;
  }
  r.couches = r.couches.filter(k => k.V > 1e-12);
  r._deborde = (r._deborde || 0) + perdu;
  return perdu;
}
function raideur(e, ctx, rho) {
  const r = e.r;
  if (r.constant) return 0; // surface infinie : le niveau ne bouge pas
  let k = rho * ctx.g / Math.max(r.b * largeurA(r, Math.min(e.sL, r.H)), 1e-6);
  if (r.ferme && r.ciel.mode === 'piege') k += (e.pCiel + ctx.patm) / Math.max(e.Vgaz, 1e-9);
  return k;
}
function etapeConduite(scene, c, ctx, idx, facteur) {
  if (!estOuverte(scene, c)) { c._q = 0; return { D: 0, dV: 0 }; }
  const ra = idx.get(c.a.el), rb = idx.get(c.b.el);
  if (!ra || !rb || ra.type !== 'reservoir' || rb.type !== 'reservoir') return { D: 0, dV: 0 };
  const A = resoudre(scene, c.a, idx), B = resoudre(scene, c.b, idx);
  if (!A || !B || ra === rb) return { D: 0, dV: 0 };
  const ea = etatAvecFlotteurs(scene, ra, ctx), eb = etatAvecFlotteurs(scene, rb, ctx);
  const pa = pressionDans(ea, A.z, ctx), pb = pressionDans(eb, B.z, ctx);
  const na = coucheA(ea, A.z), nb = coucheA(eb, B.z);
  const Dab = na ? pa - pb + na.rho * ctx.g * (A.z - B.z) : -Infinity;
  const Dba = nb ? pb - pa + nb.rho * ctx.g * (B.z - A.z) : -Infinity;
  let src, dst, es, ed, n, P, D;
  if (Dab >= Dba && Dab > TOL_P) { src = ra; dst = rb; es = ea; ed = eb; n = na; P = A; D = Dab; }
  else if (Dba > TOL_P) { src = rb; dst = ra; es = eb; ed = ea; n = nb; P = B; D = Dba; }
  else { c._q = 0; return { D: Math.max(Dab, Dba, 0), dV: 0 }; }
  // Deux niveaux imposés différents entretiendraient un écoulement permanent :
  // ce n'est plus de l'hydrostatique, on ne transfère rien (alerte dans analyser).
  if (src.constant && dst.constant) { c._q = 0; return { D, dV: 0 }; }
  const K = raideur(es, ctx, n.rho) + raideur(ed, ctx, n.rho);
  let dV = facteur * D / K;
  // On ne vidange pas une couche sous le piquage (une source à niveau imposé est inépuisable).
  const dispo = src.constant ? Infinity : volumeLibre(src, n.s1, es.obs) - volumeLibre(src, P.z - src.z, es.obs);
  dV = Math.min(dV, Math.max(0, dispo));
  if (dst.ferme) {
    const lim = Math.max(0, ed.Vgaz - 0.02 * ed.Vtot);
    dV = Math.min(dV, dst.ciel.mode === 'piege' ? 0.5 * lim : lim);
  }
  if (!(dV > 1e-15)) { c._q = 0; return { D, dV: 0 }; }
  retirer(src, ctx, n.fluide, dV);
  ajouter(dst, ctx, n.fluide, dV);
  deverser(scene, dst, ctx);
  c._sens = src === ra ? 1 : -1;
  c._fluideQ = n.fluide;
  return { D, dV };
}
export function equilibrer(scene, { facteur = 1, iterations = 3000 } = {}) {
  const ctx = contexte(scene), idx = indexer(scene);
  const conduites = scene.elements.filter(e => e.type === 'conduite');
  let residu = 0, it = 0;
  for (; it < iterations; it++) {
    residu = 0;
    let bouge = 0;
    for (const c of conduites) {
      const { D, dV } = etapeConduite(scene, c, ctx, idx, facteur);
      residu = Math.max(residu, D);
      bouge += dV;
    }
    if (residu <= TOL_P || bouge < 1e-12) break;
  }
  for (const c of conduites) c._q = 0;
  return { iterations: it, residu, converge: residu <= TOL_P * 4 };
}
// Transferts de liquide pour le moteur d'écoulement (labo-ecoulement.js).
export function retirerFluide(r, ctx, fluide, dV) { retirer(r, ctx, fluide, dV); }
export function ajouterFluide(scene, r, ctx, fluide, dV) { ajouter(r, ctx, fluide, dV); return deverser(scene, r, ctx); }
export function volumeSous(r, s, obs = []) { return volumeLibre(r, s, obs); }

// Avance d'un pas de temps (animation) ; renvoie vrai tant que ça s'écoule.
export function avancer(scene, dt, tau = 0.45) {
  const ctx = contexte(scene), idx = indexer(scene);
  const f = 1 - Math.exp(-Math.max(dt, 0) / tau);
  let actif = false;
  for (const c of scene.elements) {
    if (c.type !== 'conduite') continue;
    // Près de l'équilibre (< 30 Pa, soit 3 mm d'eau) on termine d'un coup.
    const essai = etapeConduite(scene, c, ctx, idx, 0);
    const { dV } = etapeConduite(scene, c, ctx, idx, essai.D < 30 ? 1 : f);
    c._q = dt > 0 ? dV / dt : 0;
    if (dV > 1e-12) actif = true;
  }
  return actif;
}

// ---------- état d'une conduite (contenu et pressions le long du tracé) ----------
export function etatConduite(c, scene, ctx, etats, idx = indexer(scene)) {
  const tr = traceConduite(c, scene, idx);
  if (!tr) return null;
  const ea = etats.get(c.a.el), eb = etats.get(c.b.el);
  // Au repos, un bout raccordé à un appareil (pompe, raccord, sortie) n'apporte
  // aucune pression : la conduite est un bras mort alimenté par l'autre bout.
  const cote = (e, z) => {
    if (!e) return { p: NaN, z, f: null, rho: 0, mort: true };
    const n = coucheA(e, z);
    return { p: pressionDans(e, z, ctx), z, f: n ? n.fluide : null, rho: n ? n.rho : 0 };
  };
  const cotes = { a: cote(ea, tr.A.z), b: cote(eb, tr.B.z) };
  const pA = cotes.a.p, pB = cotes.b.p;
  const depuis = (k, z) => { const s = cotes[k]; return s.f ? s.p + s.rho * ctx.g * (s.z - z) : s.p; };
  const vannes = vannesDe(scene, c);
  const fermees = vannes.filter(v => !v.ouverte).map(v => v.t);
  if (cotes.a.mort && cotes.b.mort) fermees.push(0, 1);
  else if (cotes.b.mort) fermees.push(1);
  else if (cotes.a.mort) fermees.push(0);
  fermees.sort((u, v) => u - v);
  const ouverte = !fermees.length;
  const zDe = t => pointSurTrace(tr, t).z;
  // Premier point (en partant d'un côté) où le tracé dépasse la cote zMax.
  const premierAuDessus = (depuisA, zMax) => {
    const N = 200;
    for (let i = 0; i <= N; i++) { const t = depuisA ? i / N : 1 - i / N; if (zDe(t) > zMax + 1e-9) return t; }
    return null;
  };
  // Contenu d'un tronçon alimenté par un seul côté [t0, t1].
  const tronconsCote = (k, t0, t1) => {
    const s = cotes[k];
    if (!s.f) return [{ t0, t1, fluide: null, cote: k }];
    return [{ t0, t1, fluide: s.f, cote: k }];
  };
  let troncons = [], tInterface = null;
  if (ouverte) {
    const a = cotes.a, b = cotes.b;
    if (a.f && b.f && a.f !== b.f) {
      const zi = (a.p + a.rho * ctx.g * a.z - b.p - b.rho * ctx.g * b.z) / (ctx.g * (a.rho - b.rho));
      // Le liquide lourd occupe le bas : on cherche où le tracé franchit zi.
      const N = 400;
      for (let i = 1; i <= N && tInterface === null; i++) {
        const z0 = zDe((i - 1) / N) - zi, z1 = zDe(i / N) - zi;
        if (z0 === 0 || z0 * z1 < 0) tInterface = i / N;
      }
      if (tInterface === null) tInterface = 0.5;
      troncons = [{ t0: 0, t1: tInterface, fluide: a.f, cote: 'a' }, { t0: tInterface, t1: 1, fluide: b.f, cote: 'b' }];
    } else if (a.f || b.f) {
      const k = a.f ? 'a' : 'b', autre = a.f ? 'b' : 'a', s = cotes[k];
      if (cotes[autre].f) troncons = [{ t0: 0, t1: 1, fluide: s.f, cote: null }];
      else {
        const zMax = s.z + (s.p - cotes[autre].p) / (s.rho * ctx.g);
        const t = premierAuDessus(k === 'a', zMax);
        if (t === null) troncons = [{ t0: 0, t1: 1, fluide: s.f, cote: k }];
        else troncons = k === 'a' ? [{ t0: 0, t1: t, fluide: s.f, cote: 'a' }, { t0: t, t1: 1, fluide: null, cote: 'b' }]
          : [{ t0: 0, t1: t, fluide: null, cote: 'a' }, { t0: t, t1: 1, fluide: s.f, cote: 'b' }];
      }
    } else troncons = [{ t0: 0, t1: 1, fluide: null, cote: null }];
  } else {
    if (fermees[0] > 0) troncons.push(...tronconsCote('a', 0, fermees[0]));
    if (fermees.length > 1 && fermees[fermees.length - 1] > fermees[0]) troncons.push({ t0: fermees[0], t1: fermees[fermees.length - 1], fluide: cotes.a.f || cotes.b.f, cote: null, isole: true });
    if (fermees[fermees.length - 1] < 1) troncons.push(...tronconsCote('b', fermees[fermees.length - 1], 1));
    if (!troncons.length) troncons.push({ t0: 0, t1: 1, fluide: null, cote: null, isole: true });
  }
  const en = t => {
    const tc = troncons.find(k => t >= k.t0 - 1e-9 && t <= k.t1 + 1e-9) || troncons[0];
    const z = zDe(t);
    if (tc.isole) return { p: NaN, fluide: tc.fluide, z, isole: true };
    if (!tc.fluide) {
      const p = tc.cote ? cotes[tc.cote].p : (1 - t) * pA + t * pB;
      return { p, fluide: null, z };
    }
    let p;
    if (tc.cote) p = depuis(tc.cote, z);
    else p = (1 - t) * depuis('a', z) + t * depuis('b', z);
    return { p, fluide: tc.fluide, z };
  };
  // Point le plus défavorable (pression absolue minimale) dans le liquide.
  let pire = null;
  for (let i = 0; i <= 120; i++) {
    const t = i / 120, q = en(t);
    if (!q.fluide || !Number.isFinite(q.p)) continue;
    const pabs = q.p + ctx.patm;
    if (!pire || pabs < pire.pabs) pire = { t, pabs, fluide: q.fluide, z: q.z, p: q.p };
  }
  const deltas = vannes.map(v => {
    if (v.ouverte || fermees.length !== 1 || cotes.a.mort || cotes.b.mort) return { id: v.id, dp: null };
    const z = zDe(v.t);
    return { id: v.id, dp: depuis('a', z) - depuis('b', z), z };
  });
  return { id: c.id, tr, ouverte, troncons, tInterface, en, pire, cotes, deltas, q: c._q || 0, sens: c._sens || 1, fluideQ: c._fluideQ };
}

// ---------- lecture des appareils ----------
export function piquage(scene, ref, A, idx = A.idx) {
  const P = resoudre(scene, ref, idx);
  if (!P) return null;
  if (P.paroi === 't' || P.paroi === 'k') {
    const ec = A.conduites.get(P.el);
    if (!ec) return null;
    const q = P.total && ec.enTotal ? ec.enTotal(P.t) : ec.en(P.t);
    return { ...P, p: q.p, fluide: q.fluide, rho: A.ctx.rho(q.fluide), isole: !!q.isole };
  }
  if (P.paroi === 'appareil') return null;
  const e = A.etats.get(P.el);
  const n = coucheA(e, P.z);
  return { ...P, p: pressionDans(e, P.z, A.ctx), fluide: n ? n.fluide : null, rho: n ? n.rho : 0 };
}

// Tube vertical d'un piézomètre (ou tige d'un manomètre) : déporté de ox le long
// de la sortie du piquage pour aligner plusieurs appareils sur une même paroi.
export function geometrieAppareil(u, tap) {
  const ox = fini(u.ox) ? u.ox : 0.35;
  if (tap.sx) return { x: tap.x + tap.sx * ox, zB: tap.z, coude: { x: tap.x + tap.sx * ox, z: tap.z } };
  if (tap.sz < 0) return { x: tap.x + ox, zB: tap.z - 0.25, coude: { x: tap.x, z: tap.z - 0.25 } };
  return { x: tap.x, zB: tap.z, coude: null };
}

export function geometrieTubeU(u, tap) {
  const L = u.L, z0 = tap.z + u.oz, xc = tap.x + u.ox, e = 0.24;
  return { L, z0, xc, e, xg: xc - e / 2, xd: xc + e / 2, zBas: z0 - L / 2, zHaut: z0 + L / 2, cotA: u.ox >= 0 ? 'g' : 'd' };
}

// Équilibre d'un tube en U (simple si B absent, différentiel sinon, inversé si
// le liquide manométrique est plus léger que les fluides mesurés). Les deux
// branches ont même section : z₁ + z₂ = 2 z₀.
export function equilibreTubeU({ pA, rhoA, zA, pB = 0, rhoB = 0, zB = 0, rhoM, z0, g = G }) {
  const den = g * (2 * rhoM - rhoA - rhoB);
  const x = ((pA - pB) + rhoA * g * (zA - z0) - rhoB * g * (zB - z0)) / den;
  return { x, z1: z0 - x, z2: z0 + x, dh: 2 * x };
}

function lirePiezometre(u, scene, A) {
  const { ctx } = A, t = piquage(scene, u.piquage, A);
  if (!t) return { erreur: 'Piquage introuvable.' };
  const geo = geometrieAppareil(u, t);
  const res = { tap: t, geo, zBas: geo.zB, zHaut: geo.zB + u.Ht, etapes: [] };
  if (!t.fluide) {
    res.vide = true;
    res.message = t.isole ? 'Tronçon isolé entre deux vannes fermées.' : 'Piquage hors du liquide : un piézomètre ne mesure pas la pression d’un gaz.';
    return res;
  }
  const f = ctx.fl(t.fluide), rho = f.rho, d = u.d / 1000;
  const hc = 4 * f.sigma * Math.cos(rad(f.theta)) / (rho * ctx.g * d);
  const h = t.p / (rho * ctx.g);
  const zN = t.z + h + hc;
  Object.assign(res, { fluide: t.fluide, rho, h, hc, zN, p: t.p });
  res.etapes.push(`Le liquide monte jusqu’à la charge piézométrique du piquage : h = p/(ρg) = ${nombre(t.p, 0)} / (${nombre(rho, 0)} × ${nombre(ctx.g, 2)}) = ${nombre(h, 3)} m`);
  res.etapes.push(`Cote du ménisque : z = z<sub>piquage</sub> + h = ${nombre(t.z, 2)} + ${nombre(h, 3)} = ${nombre(t.z + h, 3)} m`);
  res.etapes.push(`Remontée capillaire (Jurin) : h<sub>c</sub> = 4σ cos θ/(ρ g d) = 4 × ${nombre(f.sigma, 3)} × ${nombre(Math.cos(rad(f.theta)), 2)} / (${nombre(rho, 0)} × ${nombre(ctx.g, 2)} × ${nombre(d, 3)}) = ${nombre(hc * 1000, 1)} mm`);
  if (u.d < 10) res.capillaire = `Tube de ${nombre(u.d, 0)} mm : l’erreur capillaire (${nombre(hc * 1000, 1)} mm) n’est plus négligeable ; le cours recommande d ≥ 10 mm.`;
  if (zN < Math.max(geo.zB, t.z) - 1e-9 && t.p < 0) { res.depression = true; res.message = 'Dépression au piquage : l’air entre par le tube, le piézomètre ne peut pas la mesurer (utiliser un tube en U).'; }
  else if (zN > res.zHaut) { res.deborde = true; res.message = `Le liquide déborde : il faudrait un tube de ${nombre(zN - t.z, 2)} m au moins.`; }
  return res;
}
function lireManometre(u, scene, A) {
  const { ctx } = A, t = piquage(scene, u.piquage, A);
  if (!t) return { erreur: 'Piquage introuvable.' };
  if (t.isole) return { tap: t, message: 'Tronçon isolé entre deux vannes fermées.', p: NaN };
  const pabs = t.p + ctx.patm;
  const lu = u.mode === 'absolu' ? pabs : t.p;
  const pleineEchelle = echelle(Math.abs(lu));
  const etapes = [t.fluide ? `Piquage dans ${ctx.fl(t.fluide).nom.toLowerCase()} à la cote z = ${nombre(t.z, 2)} m : p = ${nombre(t.p, 0)} Pa (relative)`
    : `Piquage dans le gaz : p = p<sub>ciel</sub> = ${nombre(t.p, 0)} Pa (relative)`,
  `Pression absolue : p<sub>abs</sub> = p + p<sub>atm</sub> = ${nombre(t.p, 0)} + ${nombre(ctx.patm, 0)} = ${nombre(pabs, 0)} Pa`];
  return { tap: t, geo: geometrieAppareil(u, t), p: t.p, pabs, lu, pleineEchelle, etapes, fluide: t.fluide };
}
export function echelle(v) {
  for (const e of [10e3, 25e3, 50e3, 100e3, 160e3, 250e3, 400e3, 600e3, 1e6, 1.6e6, 2.5e6, 4e6, 1e7]) if (v <= 0.92 * e) return e;
  return 1e7;
}
function lireTubeU(u, scene, A) {
  const { ctx } = A, ta = piquage(scene, u.piquage, A);
  if (!ta) return { erreur: 'Piquage introuvable.' };
  const tb = u.piquage2 ? piquage(scene, u.piquage2, A) : null;
  if (u.piquage2 && !tb) return { erreur: 'Second piquage introuvable.' };
  const geo = geometrieTubeU(u, ta);
  const rhoM = ctx.rho(u.fluideM) || ctx.fl(u.fluideM).rho;
  const rhoA = ta.rho, rhoB = tb ? tb.rho : 0;
  const res = { tap: ta, tap2: tb, geo, rhoM, rhoA, rhoB, etapes: [] };
  if (ta.isole || (tb && tb.isole)) { res.message = 'Tronçon isolé entre deux vannes fermées.'; res.invalide = true; return res; }
  const inverse = tb ? rhoM < Math.min(rhoA, rhoB) : false;
  const lourd = rhoM > Math.max(rhoA, rhoB);
  res.inverse = inverse;
  if (!inverse && !lourd) {
    res.invalide = true;
    res.message = tb ? 'Le liquide manométrique doit être plus lourd (U) ou plus léger (U renversé) que les deux fluides mesurés.'
      : 'Le liquide manométrique doit être plus dense que le fluide mesuré.';
    return res;
  }
  const eq = equilibreTubeU({ pA: ta.p, rhoA, zA: ta.z, pB: tb ? tb.p : 0, rhoB, zB: tb ? tb.z : geo.z0, rhoM, z0: geo.z0, g: ctx.g });
  Object.assign(res, eq);
  const marge = 0.03;
  if (Math.abs(eq.x) > geo.L / 2 - marge) {
    res.chasse = true;
    res.message = `Le liquide manométrique serait chassé du tube (déplacement ${nombre(Math.abs(eq.x) * 1000, 0)} mm pour des branches de ${nombre(geo.L * 500, 0)} mm) : allonger le tube ou choisir un liquide plus dense.`;
  }
  const nm = ctx.fl(u.fluideM).nom.toLowerCase();
  const fa = ta.fluide ? ctx.fl(ta.fluide).nom.toLowerCase() : 'gaz', fb = tb ? (tb.fluide ? ctx.fl(tb.fluide).nom.toLowerCase() : 'gaz') : 'air libre';
  const g = ctx.g;
  res.etapes.push(`Équilibre trouvé : niveau côté A z₁ = ${nombre(eq.z1, 3)} m, côté ${tb ? 'B' : 'air libre'} z₂ = ${nombre(eq.z2, 3)} m, dénivellation Δh = ${nombre(eq.dh * 1000, 1)} mm.`);
  if (!tb) {
    res.etapes.push(`Cheminement de A vers l’air libre (on ajoute ρgh en descendant, on retranche en montant) :`);
    res.etapes.push(`p<sub>A</sub> + ρ<sub>${fa}</sub> g (z<sub>A</sub> − z₁) − ρ<sub>${nm}</sub> g (z₂ − z₁) = 0`);
    const pAcalc = rhoM * g * eq.dh - rhoA * g * (ta.z - eq.z1);
    res.etapes.push(`p<sub>A</sub> = ${nombre(rhoM, 0)} × ${nombre(g, 2)} × ${nombre(eq.dh, 3)} − ${nombre(rhoA, rhoA < 10 ? 1 : 0)} × ${nombre(g, 2)} × ${nombre(ta.z - eq.z1, 3)} = ${nombre(pAcalc, 0)} Pa`);
    res.pMesuree = pAcalc;
  } else {
    res.etapes.push(`Cheminement de A vers B : p<sub>A</sub> + ρ<sub>${fa}</sub> g (z<sub>A</sub> − z₁) − ρ<sub>${nm}</sub> g (z₂ − z₁) − ρ<sub>${fb}</sub> g (z<sub>B</sub> − z₂) = p<sub>B</sub>`);
    const dp = rhoM * g * (eq.z2 - eq.z1) - rhoA * g * (ta.z - eq.z1) + rhoB * g * (tb.z - eq.z2);
    res.etapes.push(`p<sub>A</sub> − p<sub>B</sub> = ${nombre(rhoM, 0)}·g·(${nombre(eq.z2 - eq.z1, 3)}) − ${nombre(rhoA, 0)}·g·(${nombre(ta.z - eq.z1, 3)}) + ${nombre(rhoB, 0)}·g·(${nombre(tb.z - eq.z2, 3)}) = ${nombre(dp, 0)} Pa`);
    if (rhoA === rhoB && !inverse) res.etapes.push(`Même fluide des deux côtés : p<sub>A</sub> − p<sub>B</sub> = (ρ<sub>m</sub> − ρ) g Δh + ρ g (z<sub>B</sub> − z<sub>A</sub>)`);
    res.pMesuree = dp;
  }
  return res;
}

// ---------- poussée sur une paroi plane ----------
// Repère de paroi : origine au coin bas (g, d) ou gauche (f), u le long de la
// paroi (vers le haut, ou vers la droite pour le fond).
export function repereParoi(r, paroi) {
  if (paroi === 'g') return { ox: r.x, oz: r.z, dx: 0, dz: 1, nx: -1, nz: 0, alpha: 90, L: r.H };
  if (paroi === 'd') {
    const a = rad(fini(r.alpha) ? r.alpha : 90);
    return { ox: r.x + r.w, oz: r.z, dx: Math.cos(a), dz: Math.sin(a), nx: Math.sin(a), nz: -Math.cos(a), alpha: r.alpha, L: r.H / Math.sin(a) };
  }
  if (paroi === 'f') return { ox: r.x, oz: r.z, dx: 1, dz: 0, nx: 0, nz: -1, alpha: 0, L: r.w };
  return null;
}
export const formes = {
  rect: { nom: 'rectangulaire', largeur: (u, a, l) => l, IG: (a, l) => l * a ** 3 / 12, S: (a, l) => a * l, uG: () => 0 },
  cercle: { nom: 'circulaire', largeur: (u, a) => 2 * Math.sqrt(Math.max(0, a * a / 4 - u * u)), IG: a => Math.PI * a ** 4 / 64, S: a => Math.PI * a * a / 4, uG: () => 0 },
  triangle: { nom: 'triangulaire (base en bas)', largeur: (u, a, l) => l * (a / 2 - u) / a, IG: (a, l) => l * a ** 3 / 36, S: (a, l) => a * l / 2, uG: a => -a / 6 }
};
export function pousseePlane({ r, e, ctx, paroi, s, forme = 'rect', a, l }) {
  const R = repereParoi(r, paroi), F_ = formes[forme] || formes.rect;
  const N = 1200;
  let F = 0, M = 0, S = 0, SM = 0;
  const profil = [];
  for (let i = 0; i < N; i++) {
    const u = -a / 2 + (i + 0.5) * a / N, du = a / N, wd = F_.largeur(u, a, l);
    const z = R.oz + (s + u) * R.dz;
    const p = pressionDans(e, z, ctx);
    F += p * wd * du; M += p * wd * u * du; S += wd * du; SM += wd * u * du;
  }
  for (let i = 0; i <= 48; i++) {
    const u = -a / 2 + i * a / 48, z = R.oz + (s + u) * R.dz;
    profil.push({ u, z, p: pressionDans(e, z, ctx) });
  }
  const uG = SM / S, uC = Math.abs(F) > 1e-9 ? M / F : uG;
  const pt = u => ({ x: R.ox + (s + u) * R.dx, z: R.oz + (s + u) * R.dz });
  const res = { R, F, S, uG, uC, G: pt(uG), C: pt(uC), FH: F * R.nx, FV: F * R.nz, profil, a, l, s, forme, paroi,
    bas: pt(-a / 2), haut: pt(a / 2), pG: pressionDans(e, pt(uG).z, ctx) };
  // Méthode du cours (§ 2.4) quand la paroi reste dans une seule couche.
  const zMin = Math.min(res.bas.z, res.haut.z), zMax = Math.max(res.bas.z, res.haut.z);
  const couche = e.niveaux.find(n => zMin >= n.z0 - 1e-9 && zMax <= n.z1 + 1e-9);
  const enGaz = zMin >= e.zL - 1e-9;
  if (couche || enGaz) {
    const IG = F_.IG(a, l), Sf = F_.S(a, l);
    res.formule = { IG, S: Sf, pG: res.pG, F: res.pG * Sf };
    if (couche && paroi !== 'f' && !(res.pG > 1e-6)) res.formule = null;
    else if (couche && paroi !== 'f') {
      const sinA = Math.sin(rad(R.alpha));
      const hEq = res.pG / (couche.rho * ctx.g), yEq = hEq / sinA;
      res.formule.rho = couche.rho; res.formule.hEq = hEq; res.formule.yEq = yEq;
      res.formule.ecart = IG / (yEq * Sf); // C sous G, le long de la paroi
      res.formule.fluide = couche.fluide;
      res.formule.libreFictive = Math.abs(couche.charge - e.zL) > 1e-6 || couche !== e.niveaux[e.niveaux.length - 1];
    } else res.formule.ecart = 0;
  }
  return res;
}
function analyserVannePlane(v, scene, A) {
  const r = A.idx.get(v.reservoir), e = A.etats.get(v.reservoir);
  if (!r || !e) return { erreur: 'Réservoir introuvable.' };
  const res = pousseePlane({ r, e, ctx: A.ctx, paroi: v.paroi, s: v.s, forme: v.forme, a: v.a, l: v.l });
  const g = A.ctx.g, F_ = formes[v.forme] || formes.rect;
  const etapes = [];
  etapes.push(`Surface S = ${v.forme === 'cercle' ? `πD²/4 = π × ${nombre(v.a, 2)}²/4` : v.forme === 'triangle' ? `l a/2 = ${nombre(v.l, 2)} × ${nombre(v.a, 2)}/2` : `l × a = ${nombre(v.l, 2)} × ${nombre(v.a, 2)}`} = ${nombre(F_.S(v.a, v.l), 3)} m²`);
  if (res.formule) {
    const f = res.formule;
    if (f.fluide) {
      const nom = A.ctx.fl(f.fluide).nom.toLowerCase();
      etapes.push(`Pression au centre de gravité G : p<sub>G</sub> = ${nombre(f.pG, 0)} Pa${f.libreFictive ? ` — surface libre fictive de ${nom} à ${nombre(f.hEq, 3)} m au-dessus de G (p<sub>G</sub> = ρ g h<sub>G</sub>)` : ` = ρ g h<sub>G</sub> avec h<sub>G</sub> = ${nombre(f.hEq, 3)} m`}`);
      etapes.push(`Résultante F = p<sub>G</sub> S = ${nombre(f.pG, 0)} × ${nombre(f.S, 3)} = ${nombre(f.F / 1000, 2)} kN`);
      etapes.push(`I<sub>G</sub> = ${v.forme === 'cercle' ? 'πD⁴/64' : v.forme === 'triangle' ? 'l a³/36' : 'l a³/12'} = ${nombre(f.IG, 4)} m⁴ ; y<sub>G</sub> = h<sub>G</sub>/sin α = ${nombre(f.yEq, 3)} m`);
      etapes.push(`Centre de poussée : y<sub>C</sub> − y<sub>G</sub> = I<sub>G</sub>/(y<sub>G</sub> S) = ${nombre(f.IG, 4)} / (${nombre(f.yEq, 3)} × ${nombre(f.S, 3)}) = ${nombre(f.ecart * 100, 2)} cm sous G, le long de la paroi`);
    } else {
      etapes.push(`Pression uniforme p = ${nombre(f.pG, 0)} Pa ${v.paroi === 'f' ? '(fond horizontal)' : '(gaz)'} : F = p S = ${nombre(f.F / 1000, 2)} kN et C confondu avec G`);
    }
  } else {
    etapes.push(`La vanne traverse une interface ou la surface libre : la pression n’y est plus linéaire, F = ∫ p dS est intégrée par tranches.`);
  }
  etapes.push(`Intégration numérique de contrôle : F = ${nombre(res.F / 1000, 2)} kN, C à ${nombre((res.uG - res.uC) * 100, 2)} cm sous G`);
  if (v.paroi === 'd' && Math.abs((r.alpha ?? 90) - 90) > 1e-6) etapes.push(`Composantes : F<sub>H</sub> = F sin α = ${nombre(res.FH / 1000, 2)} kN ; F<sub>V</sub> = −F cos α = ${nombre(res.FV / 1000, 2)} kN`);
  if (v.charniere === 'glissieres') {
    const fr = fini(v.f) ? v.f : 0.25, Pv = fini(v.poids) ? v.poids : 0;
    if (v.paroi === 'f') {
      res.levage = Pv + Math.max(0, res.F);
      etapes.push(`Trappe de fond levée verticalement : T = P + F = ${nombre(Pv / 1000, 2)} + ${nombre(res.F / 1000, 2)} = ${nombre(res.levage / 1000, 2)} kN`);
    } else {
      const sinA = Math.sin(rad(R_alpha(r, v.paroi)));
      res.frottement = fr * Math.abs(res.F);
      res.levage = Pv * sinA + res.frottement;
      etapes.push(`Vanne levante en glissières : au décollement, T = P${sinA < 0.999 ? ' sin α' : ''} + f F = ${nombre(Pv * sinA / 1000, 2)} + ${nombre(fr, 2)} × ${nombre(Math.abs(res.F) / 1000, 2)} = ${nombre(res.levage / 1000, 2)} kN ; le frottement dû à la poussée en représente ${nombre(100 * res.frottement / Math.max(res.levage, 1e-9), 0)} %`);
    }
  }
  if (v.charniere === 'haut' || v.charniere === 'bas') {
    const uh = v.charniere === 'haut' ? v.a / 2 : -v.a / 2;
    const bras = Math.abs(uh - res.uC);
    res.moment = res.F * bras;
    res.effort = res.moment / v.a;
    etapes.push(`Charnière en ${v.charniere} : moment M = F × ${nombre(bras, 3)} m = ${nombre(res.moment / 1000, 2)} kN·m ; effort à l’arête opposée pour maintenir la vanne : M/a = ${nombre(res.effort / 1000, 2)} kN`);
  }
  res.etapes = etapes;
  return res;
}
const R_alpha = (r, paroi) => (paroi === 'd' ? (fini(r.alpha) ? r.alpha : 90) : paroi === 'g' ? 90 : 0);
// Analyse d'une paroi entière (diagramme des pressions, § 2.4 et ex. 2.5).
export function analyserParoi(r, e, ctx, paroi) {
  const R = repereParoi(r, paroi);
  if (!R) return null;
  let L;
  if (paroi === 'f') L = r.w;
  else if (r.ferme) L = R.L;
  else L = Math.min(R.L, e.sL / R.dz);
  if (!(L > 1e-6)) return null;
  const res = pousseePlane({ r, e, ctx, paroi, s: L / 2, forme: 'rect', a: L, l: r.b });
  res.mouille = L;
  res.momentPied = paroi === 'f' ? null : res.F * res.uC + res.F * L / 2; // bras depuis le pied le long de la paroi
  res.zC = res.C.z - r.z;
  return res;
}

// ---------- flotteur : résultats ----------
function analyserFlotteur(f, scene, A) {
  const r = A.idx.get(f.reservoir), e = A.etats.get(f.reservoir);
  if (!r || !e) return { erreur: 'Réservoir introuvable.' };
  const ctx = A.ctx, eq = equilibreFlotteur(f, e, ctx), lest = lestFlotteur(f, ctx);
  const mTot = f.m + lest.m, zGrel = (f.m * f.zG + lest.m * lest.zc) / mTot;
  const s0 = eq.s0, zb = r.z + s0, A0 = f.l * f.b;
  const parts = e.niveaux.map(n => ({ n, h: recouvrement(n.s0, n.s1, s0, s0 + f.h) })).filter(k => k.h > 1e-9);
  const Vimm = A0 * parts.reduce((t, k) => t + k.h, 0);
  const poids = parts.reduce((t, k) => t + k.n.rho * k.h, 0);
  const zC = poids > 0 ? r.z + parts.reduce((t, k) => t + k.n.rho * k.h * (Math.max(k.n.s0, s0) + k.h / 2), 0) / poids : zb;
  const zG = zb + zGrel;
  const T = Math.min(f.h, Math.max(0, e.sL - s0));
  const immerge = e.sL >= s0 + f.h - 1e-9;
  const res = { s0, zb, x: r.x + f.x, P: eq.P, FA: eq.FA, R: eq.R, fond: eq.fond, Vimm, T, zC, zG, immerge, lest, mTot, etapes: [] };
  res.Fs = eq.FA > 1e-9 ? eq.P / eq.FA : Infinity;
  const g = ctx.g;
  if (lest.V > 0) {
    res.etapes.push(`Poids à vide ${nombre(f.m * g / 1000, 2)} kN + ballast ${nombre(lest.V, 2)} m³ × ${nombre(lest.rho, 0)} × ${nombre(g, 2)} = ${nombre(lest.m * g / 1000, 2)} kN → P = ${nombre(eq.P / 1000, 2)} kN`);
    res.etapes.push(`Ballast sur ${nombre(lest.h, 3)} m au fond de la cavité ; G global à (${nombre(f.m, 0)} × ${nombre(f.zG, 3)} + ${nombre(lest.m, 0)} × ${nombre(lest.zc, 3)}) / ${nombre(mTot, 0)} = ${nombre(zGrel, 3)} m du fond`);
  } else res.etapes.push(`Poids P = m g = ${nombre(f.m, 0)} × ${nombre(g, 2)} = ${nombre(eq.P / 1000, 2)} kN (masse volumique moyenne ${nombre(f.m / (A0 * f.h), 0)} kg/m³)`);
  if (eq.fond) {
    res.etapes.push(`${immerge ? 'Même totalement immergé, la' : 'Posé sur le fond, la'} poussée ne vaut que ${nombre(eq.FA / 1000, 2)} kN < P : le corps repose sur le fond, réaction R = P − F<sub>A</sub> = ${nombre(eq.R / 1000, 2)} kN`);
    if (eq.FA > 0) res.etapes.push(`Sécurité au soulèvement F<sub>s</sub> = P / F<sub>A</sub> = ${nombre(eq.P / 1000, 2)} / ${nombre(eq.FA / 1000, 2)} = ${nombre(res.Fs, 2)} (les règles de calcul exigent une marge, de l’ordre de 1,1 à 1,2 selon les référentiels)`);
  }
  else res.etapes.push(`Équilibre de flottaison : F<sub>A</sub> = Σ ρ<sub>i</sub> g V<sub>imm,i</sub> = P → ${parts.length === 1 && !immerge ? `T = P/(ρ g l b) = ${nombre(eq.P, 0)} / (${nombre(parts[0].n.rho, 0)} × ${nombre(g, 2)} × ${nombre(f.l, 2)} × ${nombre(f.b, 2)}) = ${nombre(T, 3)} m` : `immersion ${immerge ? 'totale' : 'partielle'} sur ${nombre(Vimm / A0, 3)} m`}`);
  res.etapes.push(`Centre de carène C à ${nombre(zC - zb, 3)} m au-dessus du fond du corps ; G à ${nombre(f.zG, 3)} m`);
  const unFluide = parts.length === 1;
  if (!eq.fond && unFluide) {
    const rho = parts[0].n.rho;
    if (immerge) {
      res.CM = 0; res.zM = zC; res.GM = zC - zG;
      res.etapes.push(`Corps totalement immergé : pas de surface de flottaison (I = 0), M est confondu avec C ; stable si G est sous C : CG = ${nombre(res.GM, 3)} m`);
    } else {
      const I = f.b * f.l ** 3 / 12;
      res.CM = I / Vimm; res.zM = zC + res.CM; res.GM = res.zM - zG;
      res.etapes.push(`Rayon métacentrique CM = I/V<sub>imm</sub> = (${nombre(f.b, 2)} × ${nombre(f.l, 2)}³/12) / ${nombre(Vimm, 3)} = ${nombre(res.CM, 3)} m`);
      res.etapes.push(`Hauteur métacentrique GM = CM − CG = ${nombre(res.CM, 3)} − (${nombre(zG - zC, 3)}) = ${nombre(res.GM, 3)} m${lest.surfaceLibre ? ' (ballast supposé figé)' : ` → ${res.GM > 0 ? 'équilibre stable' : 'équilibre instable'}`}`);
      if (lest.surfaceLibre) {
        // Carène liquide : le ballast se déplace à la gîte, ce qui équivaut à remonter G.
        // n compartiments de largeur l/n : l'inertie des surfaces libres est divisée par n².
        const ib = lest.bi * lest.li ** 3 / (12 * lest.n * lest.n);
        res.GMfige = res.GM;
        res.correction = lest.rho * ib / (rho * Vimm);
        res.GM -= res.correction;
        res.etapes.push(`Surface libre du ballast${lest.n > 1 ? ` (${lest.n} compartiments : i divisé par ${lest.n * lest.n})` : ''} : le liquide se déplace à la gîte, G remonte fictivement de ρ<sub>b</sub> i/(ρ V<sub>imm</sub>) = ${nombre(lest.rho, 0)} × ${nombre(ib, 2)} / (${nombre(rho, 0)} × ${nombre(Vimm, 2)}) = ${nombre(res.correction, 3)} m → GM effectif = ${nombre(res.GM, 3)} m, ${res.GM > 0 ? 'équilibre stable' : 'équilibre instable'}`);
      }
    }
    res.stable = res.GM > 0;
    if (f.gite && !immerge) Object.assign(res, gite(f, T, rho, ctx, lest));
  } else if (!eq.fond) res.etapes.push(`Carène répartie sur plusieurs liquides : la formule CM = I/V ne s’applique plus telle quelle (stabilité non évaluée).`);
  return res;
}
// Flotteur incliné de theta : nouvelle carène à volume constant (polygone).
function gite(f, T, rho, ctx, lest) {
  const th = rad(f.gite), c = Math.cos(th), s = Math.sin(th);
  // Corps dans son repère (origine au milieu du fond), tourné dans le sens horaire.
  const coins = [[-f.l / 2, 0], [f.l / 2, 0], [f.l / 2, f.h], [-f.l / 2, f.h]];
  const tourne = ([x, z]) => [x * c + z * s, -x * s + z * c];
  const pts = coins.map(tourne);
  // Polygone sous une horizontale, d'aire imposée (carène ou ballast).
  const niveau = (poly, cible) => {
    let lo = Math.min(...poly.map(p => p[1])), hi = Math.max(...poly.map(p => p[1]));
    for (let i = 0; i < 64; i++) { const m = (lo + hi) / 2; if (surfaceSous(poly, m).A < cible) lo = m; else hi = m; }
    return (lo + hi) / 2;
  };
  const zw = niveau(pts, f.l * T), car = surfaceSous(pts, zw);
  let Gp = tourne([0, f.zG]), interieur = null, ballast = null, cloisons = [];
  if (f.creux) {
    const e = lest.e, n = lest.n, lc = lest.li / n;
    interieur = [[-lest.li / 2, e], [lest.li / 2, e], [lest.li / 2, e + lest.hi], [-lest.li / 2, e + lest.hi]].map(tourne);
    for (let k = 1; k < n; k++) { const x = -lest.li / 2 + k * lc; cloisons.push([tourne([x, e]), tourne([x, e + lest.hi])]); }
    if (lest.V > 1e-9) {
      // Dans chaque compartiment la surface du ballast reste horizontale : son centre de gravité se déplace.
      ballast = [];
      let mx = 0, mz = 0;
      for (let k = 0; k < n; k++) {
        const x0 = -lest.li / 2 + k * lc, cell = [[x0, e], [x0 + lc, e], [x0 + lc, e + lest.hi], [x0, e + lest.hi]].map(tourne);
        const sb = surfaceSous(cell, niveau(cell, lc * lest.h));
        ballast.push(sb.poly); mx += sb.x / n; mz += sb.z / n;
      }
      const m = f.m + lest.m;
      Gp = [(f.m * Gp[0] + lest.m * mx) / m, (f.m * Gp[1] + lest.m * mz) / m];
    }
  }
  const GZ = car.x - Gp[0];
  const P = (f.m + (lest ? lest.m : 0)) * ctx.g;
  return { gite: { theta: f.gite, zw, Cx: car.x, Cz: car.z, Gx: Gp[0], Gz: Gp[1], GZ, couple: P * GZ, redresse: GZ * Math.sign(f.gite) > 0, coins: pts, interieur, ballast, cloisons } };
}
function surfaceSous(pts, zw) {
  // Sutherland–Hodgman contre le demi-plan z ≤ zw, puis aire et centroïde.
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], ina = a[1] <= zw, inb = b[1] <= zw;
    if (ina) out.push(a);
    if (ina !== inb) { const u = (zw - a[1]) / (b[1] - a[1]); out.push([a[0] + (b[0] - a[0]) * u, zw]); }
  }
  let A = 0, cx = 0, cz = 0;
  for (let i = 0; i < out.length; i++) {
    const a = out[i], b = out[(i + 1) % out.length], k = a[0] * b[1] - b[0] * a[1];
    A += k; cx += (a[0] + b[0]) * k; cz += (a[1] + b[1]) * k;
  }
  A /= 2;
  return Math.abs(A) < 1e-12 ? { A: 0, x: 0, z: 0, poly: out } : { A: Math.abs(A), x: cx / (6 * A), z: cz / (6 * A), poly: out };
}

// ---------- analyse complète ----------
export function analyser(scene, { apresConduites = null } = {}) {
  const ctx = contexte(scene), idx = indexer(scene);
  const etats = new Map(), conduites = new Map(), mesures = new Map(), ouvrages = new Map(), flotteurs = new Map(), parois = new Map();
  const A = { ctx, idx, etats, conduites };
  for (const r of scene.elements) if (r.type === 'reservoir') etats.set(r.id, etatAvecFlotteurs(scene, r, ctx));
  for (const c of scene.elements) if (c.type === 'conduite') { const ec = etatConduite(c, scene, ctx, etats, idx); if (ec) conduites.set(c.id, ec); }
  if (apresConduites) apresConduites(A);
  for (const u of scene.elements) {
    if (u.type === 'piezometre') mesures.set(u.id, lirePiezometre(u, scene, A));
    else if (u.type === 'manometre') mesures.set(u.id, lireManometre(u, scene, A));
    else if (u.type === 'tubeU') mesures.set(u.id, lireTubeU(u, scene, A));
    else if (u.type === 'vannePlane') ouvrages.set(u.id, analyserVannePlane(u, scene, A));
    else if (u.type === 'flotteur') flotteurs.set(u.id, analyserFlotteur(u, scene, A));
  }
  for (const r of scene.elements) {
    if (r.type !== 'reservoir' || !r.diagramme || r.diagramme === 'aucune') continue;
    const p = analyserParoi(r, etats.get(r.id), ctx, r.diagramme);
    if (p) parois.set(r.id, p);
  }
  const alertes = [];
  for (const [id, e] of etats) {
    const r = e.r;
    if (r._deborde > 1e-9) alertes.push({ id, niveau: 'info', texte: `${id} a débordé : ${nombre(r._deborde * 1000, 0)} L perdus par le haut.` });
    const haut = e.niveaux[e.niveaux.length - 1];
    if (haut) {
      const pabs = e.pCiel + ctx.patm, pv = ctx.fl(haut.fluide).pv;
      if (pabs < pv) alertes.push({ id, niveau: 'alerte', texte: `${id} : pression absolue en surface ${nombre(pabs / 1000, 2)} kPa < p<sub>v</sub> = ${nombre(pv / 1000, 2)} kPa — le liquide se vaporise (§ 1.7).` });
    }
    if (r.ferme && e.Vgaz < 0.03 * e.Vtot) alertes.push({ id, niveau: 'alerte', texte: `${id} : réservoir fermé presque plein, le ciel gazeux ne joue plus son rôle (verrou hydraulique).` });
  }
  for (const [id, ec] of conduites) {
    const c = idx.get(id), ra = idx.get(c.a.el), rb = idx.get(c.b.el);
    if ((scene.env.ecoulement || 'illustratif') === 'illustratif' && ec.ouverte && ra?.constant && rb?.constant && ec.cotes.a.f && ec.cotes.b.f) {
      const ha = ec.cotes.a.z + ec.cotes.a.p / (ec.cotes.a.rho * ctx.g), hb = ec.cotes.b.z + ec.cotes.b.p / (ec.cotes.b.rho * ctx.g);
      if (Math.abs(ha - hb) > 1e-3) alertes.push({ id, niveau: 'alerte', texte: `${id} relie deux niveaux imposés différents : l’écoulement serait permanent (pertes de charge, chapitre 6) ; rien ne bouge ici.` });
    }
    const pv = ec.pire ? ctx.fl(ec.pire.fluide).pv : 0;
    if (ec.pire && ec.pire.pabs < pv) alertes.push({ id, niveau: 'alerte', texte: `${id} : au point haut (z = ${nombre(ec.pire.z, 2)} m) la pression absolue tomberait à ${nombre(ec.pire.pabs / 1000, 2)} kPa < p<sub>v</sub> : la colonne liquide se rompt (cavitation).` });
  }
  for (const [id, m] of mesures) if (m.message && (m.deborde || m.chasse || m.depression || m.invalide)) alertes.push({ id, niveau: 'info', texte: `${id} : ${m.message}` });
  for (const [id, f] of flotteurs) if (f.fond) alertes.push({ id, niveau: 'info', texte: `${id} repose sur le fond (poids apparent ${nombre(f.R / 1000, 2)} kN).` });
  A.mesures = mesures; A.ouvrages = ouvrages; A.flotteurs = flotteurs; A.parois = parois; A.alertes = alertes;
  if (A.alertesEcoulement) alertes.push(...A.alertesEcoulement);
  return A;
}

// Sonde : grandeurs en un point du plan.
export function sonder(scene, analyse, x, z) {
  const { ctx } = analyse;
  for (const r of scene.elements) {
    if (r.type !== 'reservoir') continue;
    const s = z - r.z;
    if (s < 0 || s > r.H || x < r.x || x > r.x + largeurA(r, s)) continue;
    const e = analyse.etats.get(r.id);
    for (const f of scene.elements) {
      if (f.type !== 'flotteur' || f.reservoir !== r.id) continue;
      const fr = analyse.flotteurs.get(f.id);
      if (fr && x >= r.x + f.x - f.l / 2 && x <= r.x + f.x + f.l / 2 && z >= fr.zb && z <= fr.zb + f.h) return { el: f.id, corps: true, z };
    }
    const n = coucheA(e, z), p = pressionDans(e, z, ctx);
    return { el: r.id, z, p, pabs: p + ctx.patm, fluide: n ? n.fluide : null, profondeur: n ? e.zL - z : 0,
      charge: n ? z + p / (n.rho * ctx.g) : null };
  }
  return null;
}

// ---------- création, contrôle et nettoyage des scènes ----------
const ID = /^[A-Za-z][A-Za-z0-9_-]{0,15}$/;
export const PREFIXES = { reservoir: 'R', conduite: 'C', vanne: 'V', piezometre: 'P', manometre: 'M', tubeU: 'U', vannePlane: 'VP', flotteur: 'F',
  orifice: 'O', exutoire: 'S', pompe: 'PO', raccord: 'RC', venturi: 'VT', robinet: 'RB', lance: 'LA', plaque: 'PL', auget: 'AU', canal: 'CA', bille: 'B' };
export const ECOULEMENTS = ['illustratif', 'parfait', 'reel'];
export function nouvelId(scene, type) {
  const p = PREFIXES[type] || 'E';
  const pris = new Set(scene.elements.map(e => e.id));
  for (let i = 1; ; i++) if (!pris.has(p + i)) return p + i;
}
export function sceneVide(nom = 'Nouvelle expérience') {
  return { version: VERSION, nom, env: { g: G, patm: PATM, unite: 'kPa', reference: 'relative', ecoulement: 'illustratif', vitesse: 1, zSol: 0,
    vues: { champ: true, charge: true, cotes: true, isobares: false, lignes: true, efforts: false } }, perso: { rho: FLUIDES.perso.rho, mu: FLUIDES.perso.mu }, elements: [] };
}
// Recalcule la quantité de gaz piégé pour que le ciel soit à la pression p.
export function calerGaz(r, ctx, scene = null) {
  if (!r.ferme) return;
  const ouvert = { ...r, ferme: false };
  const e = scene ? etatAvecFlotteurs(scene, ouvert, ctx) : etatReservoir(ouvert, ctx);
  r.ciel.n = (r.ciel.p + ctx.patm) * Math.max(e.Vgaz, 1e-6);
}

function nb(v, nom, min, max) {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) throw Error(`${nom} : valeur attendue entre ${min} et ${max}.`);
  return v;
}
function texte(v, max, defaut) { return typeof v === 'string' ? v.slice(0, max) : defaut; }
function ref(v, nom) {
  if (!v || typeof v !== 'object' || typeof v.el !== 'string' || !lirePort(v.port)) throw Error(`${nom} : piquage invalide.`);
  return { el: v.el, port: v.port };
}
// Contrôle strict d'une scène importée ; renvoie une copie propre.
export function verifierScene(brut) {
  if (!brut || typeof brut !== 'object' || Array.isArray(brut)) throw Error('Fichier de scène illisible.');
  if (brut.version !== VERSION) throw Error('Version de scène non reconnue.');
  if (!Array.isArray(brut.elements)) throw Error('La scène doit contenir une liste d’éléments.');
  if (brut.elements.length > MAX_ELEMENTS) throw Error(`${MAX_ELEMENTS} éléments au plus.`);
  const s = sceneVide(texte(brut.nom, 80, 'Expérience'));
  const env = brut.env || {};
  s.env.g = nb(env.g ?? G, 'g', 1, 30);
  s.env.patm = nb(env.patm ?? PATM, 'Pression atmosphérique', 50000, 120000);
  s.env.unite = UNITES[env.unite] ? env.unite : 'kPa';
  s.env.reference = env.reference === 'absolue' ? 'absolue' : 'relative';
  s.env.ecoulement = ECOULEMENTS.includes(env.ecoulement) ? env.ecoulement : 'illustratif';
  s.env.vitesse = nb(env.vitesse ?? 1, 'Accélération du temps', 0.1, 10000);
  s.env.zSol = nb(env.zSol ?? 0, 'Cote du sol', -200, 200);
  const v = env.vues || {};
  for (const k of Object.keys(s.env.vues)) if (typeof v[k] === 'boolean') s.env.vues[k] = v[k];
  s.perso.rho = nb(brut.perso?.rho ?? FLUIDES.perso.rho, 'Masse volumique du liquide personnalisé', 500, 20000);
  s.perso.mu = nb(brut.perso?.mu ?? FLUIDES.perso.mu, 'Viscosité du liquide personnalisé', 1e-5, 100);
  const ctx = contexte(s);
  const vus = new Set();
  for (const e of brut.elements) {
    if (!e || typeof e !== 'object' || !PREFIXES[e.type]) throw Error('Élément de type inconnu.');
    if (typeof e.id !== 'string' || !ID.test(e.id) || vus.has(e.id)) throw Error('Identifiant d’élément invalide ou en double.');
    vus.add(e.id);
    const o = { id: e.id, type: e.type };
    const nom = `${e.id}`;
    if (e.type === 'reservoir') {
      Object.assign(o, { nom: texte(e.nom, 40, ''), x: nb(e.x, `${nom} x`, -200, 200), z: nb(e.z, `${nom} cote du fond`, -100, 200),
        w: nb(e.w, `${nom} largeur`, 0.2, 60), H: nb(e.H, `${nom} hauteur`, 0.3, 60), b: nb(e.b, `${nom} profondeur`, 0.05, 60),
        alpha: nb(e.alpha ?? 90, `${nom} inclinaison`, 30, 150), ferme: !!e.ferme, diagramme: ['g', 'd', 'f'].includes(e.diagramme) ? e.diagramme : 'aucune',
        constant: !!e.constant, aspect: e.aspect === 'sol' ? 'sol' : 'liquide', rouleaux: !!e.rouleaux });
      if (o.constant) o.hc = nb(e.hc ?? o.H / 2, `${nom} niveau imposé`, 0, o.H);
      if (largeurA(o, o.H) < 0.2) throw Error(`${nom} : l’inclinaison referme le réservoir.`);
      const c = e.ciel || {};
      o.ciel = { mode: c.mode === 'piege' ? 'piege' : 'impose', p: nb(c.p ?? 0, `${nom} pression du ciel`, -100000, 1e7) };
      if (!Array.isArray(e.couches) || e.couches.length > 6) throw Error(`${nom} : 6 couches au plus.`);
      o.couches = trierCouches(e.couches.map(k => {
        if (!k || !LIQUIDES.includes(k.fluide)) throw Error(`${nom} : fluide inconnu.`);
        return { fluide: k.fluide, V: nb(k.V, `${nom} volume`, 0, 1e6) };
      }), ctx);
      const tot = o.couches.reduce((t, k) => t + k.V, 0);
      if (tot > capacite(o) * (1 + 1e-6) && !o.constant) throw Error(`${nom} : plus de liquide que le réservoir n’en contient.`);
      if (o.ferme) { if (c.mode === 'piege' && fini(c.n) && c.n > 0) o.ciel.n = c.n; else calerGaz(o, ctx); }
      else o.ciel.n = 0;
    } else if (e.type === 'conduite') {
      Object.assign(o, { a: ref(e.a, nom), b: ref(e.b, nom), zr: e.zr == null ? null : nb(e.zr, `${nom} cote de passage`, -200, 200), D: nb(e.D ?? 0.1, `${nom} diamètre`, 0.005, 5),
        rugo: nb(e.rugo ?? 0.1, `${nom} rugosité (mm)`, 0, 50), lambda: e.lambda == null ? null : nb(e.lambda, `${nom} λ`, 0, 0.2),
        Lreel: e.Lreel == null ? null : nb(e.Lreel, `${nom} longueur réelle`, 0.01, 100000), K: nb(e.K ?? 0, `${nom} ΣK`, 0, 10000), Kauto: e.Kauto !== false });
    } else if (e.type === 'vanne') {
      Object.assign(o, { conduite: String(e.conduite), t: nb(e.t, `${nom} position`, 0.01, 0.99), ouverte: e.ouverte !== false,
        ouverture: nb(e.ouverture ?? 1, `${nom} ouverture`, 0, 1), Kv: nb(e.Kv ?? 0.2, `${nom} K pleine ouverture`, 0, 1000) });
    } else if (e.type === 'piezometre') {
      Object.assign(o, { piquage: ref(e.piquage, nom), Ht: nb(e.Ht ?? 3, `${nom} hauteur du tube`, 0.2, 40), d: nb(e.d ?? 12, `${nom} diamètre (mm)`, 0.5, 60), ox: nb(e.ox ?? 0.35, `${nom} déport`, -20, 20) });
    } else if (e.type === 'manometre') {
      Object.assign(o, { piquage: ref(e.piquage, nom), mode: e.mode === 'absolu' ? 'absolu' : 'relatif', ox: nb(e.ox ?? 0.35, `${nom} déport`, -20, 20) });
    } else if (e.type === 'tubeU') {
      if (!LIQUIDES.includes(e.fluideM) && e.fluideM !== 'air') throw Error(`${nom} : liquide manométrique inconnu.`);
      Object.assign(o, { piquage: ref(e.piquage, nom), piquage2: e.piquage2 ? ref(e.piquage2, nom) : null, fluideM: e.fluideM,
        L: nb(e.L ?? 1, `${nom} longueur des branches`, 0.2, 10), ox: nb(e.ox ?? 0.6, `${nom} décalage`, -20, 20), oz: nb(e.oz ?? -0.6, `${nom} décalage vertical`, -20, 20) });
    } else if (e.type === 'vannePlane') {
      Object.assign(o, { reservoir: String(e.reservoir), paroi: ['g', 'd', 'f'].includes(e.paroi) ? e.paroi : 'd', s: nb(e.s, `${nom} position`, 0, 200),
        forme: formes[e.forme] ? e.forme : 'rect', a: nb(e.a, `${nom} dimension`, 0.05, 60), l: nb(e.l ?? 1, `${nom} largeur`, 0.05, 60),
        charniere: ['haut', 'bas', 'glissieres'].includes(e.charniere) ? e.charniere : 'aucune',
        f: nb(e.f ?? 0.25, `${nom} coefficient de frottement`, 0, 1.5), poids: nb(e.poids ?? 0, `${nom} poids propre`, 0, 1e8) });
    } else if (e.type === 'orifice') {
      Object.assign(o, { reservoir: String(e.reservoir), paroi: ['g', 'd', 'f'].includes(e.paroi) ? e.paroi : 'd', s: nb(e.s, `${nom} position`, 0, 200),
        d: nb(e.d ?? 0.05, `${nom} diamètre`, 0.001, 5), Cd: nb(e.Cd ?? 0.62, `${nom} Cd`, 0.05, 1), Cv: nb(e.Cv ?? 0.98, `${nom} Cv`, 0.05, 1), ouvert: e.ouvert !== false });
    } else if (e.type === 'exutoire' || e.type === 'raccord') {
      Object.assign(o, { x: nb(e.x, `${nom} x`, -500, 500), z: nb(e.z, `${nom} z`, -500, 500) });
    } else if (e.type === 'pompe') {
      Object.assign(o, { x: nb(e.x, `${nom} x`, -500, 500), z: nb(e.z, `${nom} z`, -500, 500), sens: e.sens === -1 ? -1 : 1, marche: e.marche !== false,
        mode: e.mode === 'courbe' ? 'courbe' : 'debit', Q: nb(e.Q ?? 0.01, `${nom} débit`, 0, 100), H0: nb(e.H0 ?? 30, `${nom} H₀`, 0, 5000),
        k: nb(e.k ?? 10000, `${nom} coefficient de courbe`, 0, 1e9), eta: nb(e.eta ?? 0.7, `${nom} rendement`, 0.05, 1) });
    } else if (e.type === 'venturi') {
      Object.assign(o, { conduite: String(e.conduite), t: nb(e.t, `${nom} position`, 0.05, 0.95), d: nb(e.d, `${nom} diamètre du col`, 0.002, 5),
        Cq: nb(e.Cq ?? 0.98, `${nom} Cq`, 0.5, 1), fluideM: LIQUIDES.includes(e.fluideM) ? e.fluideM : 'mercure' });
    } else if (e.type === 'robinet') {
      Object.assign(o, { x: nb(e.x, `${nom} x`, -500, 500), z: nb(e.z, `${nom} z`, -500, 500), Q: nb(e.Q ?? 0.005, `${nom} débit`, 0, 100),
        fluide: LIQUIDES.includes(e.fluide) ? e.fluide : 'eau', ouvert: e.ouvert !== false });
    } else if (e.type === 'lance') {
      Object.assign(o, { x: nb(e.x, `${nom} x`, -500, 500), z: nb(e.z, `${nom} z`, -500, 500), angle: nb(e.angle ?? 0, `${nom} angle`, -360, 360),
        d: nb(e.d ?? 0.05, `${nom} diamètre`, 0.002, 2), V: nb(e.V ?? 10, `${nom} vitesse`, 0, 200), fluide: LIQUIDES.includes(e.fluide) ? e.fluide : 'eau', ouvert: e.ouvert !== false });
    } else if (e.type === 'plaque') {
      Object.assign(o, { x: nb(e.x, `${nom} x`, -500, 500), z: nb(e.z, `${nom} z`, -500, 500), angle: nb(e.angle ?? 90, `${nom} angle`, -360, 360), L: nb(e.L ?? 1, `${nom} longueur`, 0.05, 50) });
    } else if (e.type === 'auget') {
      Object.assign(o, { x: nb(e.x, `${nom} x`, -500, 500), z: nb(e.z, `${nom} z`, -500, 500), angle: nb(e.angle ?? 180, `${nom} orientation`, -360, 360),
        w: nb(e.w ?? 0.4, `${nom} ouverture`, 0.05, 10), beta: nb(e.beta ?? 180, `${nom} déviation`, 10, 180), sens: e.sens === -1 ? -1 : 1, u: nb(e.u ?? 0, `${nom} vitesse`, 0, 200) });
    } else if (e.type === 'canal') {
      const ini = e.init || {}, types = ['normale', 'repos', 'barrage', 'uniforme', 'sec'];
      Object.assign(o, { nom: texte(e.nom, 60, ''), x: nb(e.x, `${nom} x`, -500, 500), z: nb(e.z, `${nom} z`, -500, 500),
        largeur: nb(e.largeur ?? 10, `${nom} largeur du cadre`, 2, 100), hauteur: nb(e.hauteur ?? 4, `${nom} hauteur du cadre`, 1, 60),
        x0: nb(e.x0 ?? 0, `${nom} abscisse amont`, -1e6, 1e6), L: nb(e.L ?? 100, `${nom} longueur`, 1, 1e6), N: Math.round(nb(e.N ?? 200, `${nom} mailles`, 20, 1000)),
        section: e.section === 'trap' ? 'trap' : 'rect', b: nb(e.b ?? 1, `${nom} largeur au fond`, 0.01, 1000), m: nb(e.m ?? 0, `${nom} fruit`, 0, 10),
        K: nb(e.K ?? 70, `${nom} Strickler`, 0, 200), i: nb(e.i ?? 0.001, `${nom} pente`, -0.2, 0.5),
        xr: e.xr == null ? null : nb(e.xr, `${nom} abscisse de rupture de pente`, -1e6, 1e6), i2: nb(e.i2 ?? 0, `${nom} seconde pente`, -0.2, 0.5),
        zf0: nb(e.zf0 ?? 0, `${nom} cote du fond amont`, -1e4, 1e4), amont: e.amont === 'mur' ? 'mur' : 'debit', Q: nb(e.Q ?? 1, `${nom} débit`, 0, 1e5),
        aval: ['libre', 'niveau', 'normal', 'mur'].includes(e.aval) ? e.aval : 'libre', hAval: nb(e.hAval ?? 1, `${nom} profondeur aval`, 0, 1000),
        init: { type: types.includes(ini.type) ? ini.type : 'normale', h: nb(ini.h ?? 1, `${nom} profondeur initiale`, 0, 1000), U: nb(ini.U ?? 0, `${nom} vitesse initiale`, -100, 100),
          xb: nb(ini.xb ?? 0, `${nom} position du barrage`, -1e6, 1e6), h1: nb(ini.h1 ?? 1, `${nom} retenue`, 0, 1000), h2: nb(ini.h2 ?? 0, `${nom} aval du barrage`, 0, 1000) },
        bosse: e.bosse ? { x: nb(e.bosse.x, `${nom} intumescence`, -1e6, 1e6), dh: nb(e.bosse.dh, `${nom} intumescence`, -100, 100), w: nb(e.bosse.w, `${nom} intumescence`, 0.01, 1e6) } : null,
        sonde: e.sonde == null ? null : nb(e.sonde, `${nom} sonde`, -1e6, 1e6), station: e.station == null ? null : nb(e.station, `${nom} station`, -1e6, 1e6),
        ritter: !!e.ritter, ondes: !!e.ondes, modeleDe: typeof e.modeleDe === 'string' ? e.modeleDe : null, echelle: nb(e.echelle ?? 1, `${nom} échelle`, 1, 1000),
        Fm: nb(e.Fm ?? 0, `${nom} force mesurée`, 0, 1e9) });
    } else if (e.type === 'bille') {
      Object.assign(o, { reservoir: String(e.reservoir), x: nb(e.x ?? 0.5, `${nom} position`, 0, 200), d: nb(e.d ?? 0.003, `${nom} diamètre`, 1e-4, 0.5),
        rhoS: nb(e.rhoS ?? 7850, `${nom} masse volumique`, 1, 30000), z0: nb(e.z0 ?? 1, `${nom} hauteur de lâcher`, 0, 200),
        r1: nb(e.r1 ?? 0.6, `${nom} repère haut`, 0, 200), r2: nb(e.r2 ?? 0.2, `${nom} repère bas`, 0, 200), trainee: e.trainee === 'complete' ? 'complete' : 'stokes' });
    } else if (e.type === 'flotteur') {
      Object.assign(o, { reservoir: String(e.reservoir), x: nb(e.x, `${nom} position`, 0, 200), l: nb(e.l, `${nom} largeur`, 0.05, 60), h: nb(e.h, `${nom} hauteur`, 0.05, 60),
        b: nb(e.b, `${nom} profondeur`, 0.05, 60), m: nb(e.m, `${nom} masse`, 0.01, 1e9), zG: nb(e.zG ?? e.h / 2, `${nom} centre de gravité`, 0, 60), gite: nb(e.gite ?? 0, `${nom} gîte`, -45, 45),
        creux: !!e.creux, e: nb(e.e ?? 0.02, `${nom} épaisseur de paroi`, 0, 5), ballast: nb(e.ballast ?? 0, `${nom} ballast`, 0, 1e6),
        ballastFluide: LIQUIDES.includes(e.ballastFluide) ? e.ballastFluide : 'eau', cloisons: Math.round(nb(e.cloisons ?? 1, `${nom} compartiments`, 1, 12)) });
    }
    s.elements.push(o);
  }
  const avant = s.elements.length;
  nettoyerScene(s);
  if (s.elements.length !== avant) throw Error('La scène contient des liaisons vers des éléments absents ou des piquages hors des parois.');
  return s;
}
// Retire les éléments dont l'ancrage a disparu, recale les piquages après un
// redimensionnement et garde chaque flotteur ou vanne dans son réservoir.
export function nettoyerScene(scene) {
  let change = true;
  while (change) {
    change = false;
    const idx = indexer(scene);
    const garder = e => {
      const okRef = q => {
        if (!q) return false;
        if (resoudre(scene, q, idx)) return true;
        const el = idx.get(q.el), p = lirePort(q.port);
        if (!el || !p || el.type !== 'reservoir' || p.paroi === 't') return false;
        // Piquage sorti de la paroi : on le ramène au plus proche.
        const max = p.paroi === 'g' || p.paroi === 'd' ? el.H : p.paroi === 'f' ? el.w : largeurA(el, el.H);
        if (p.paroi === 'h' && !el.ferme) return false;
        const s = Math.min(Math.max(p.s, PAS_PIQUAGE), Math.floor((max - 1e-6) / PAS_PIQUAGE) * PAS_PIQUAGE);
        if (!(s > 0 && s < max)) return false;
        q.port = `${p.paroi}:${s.toFixed(2)}`;
        return !!resoudre(scene, q, idx);
      };
      switch (e.type) {
        case 'reservoir': if (e.constant) e.hc = Math.min(Math.max(fini(e.hc) ? e.hc : e.H / 2, 0), e.H); return true;
        case 'conduite': {
          const extremite = q => {
            const el = idx.get(q.el);
            if (!el) return false;
            if (el.type === 'reservoir') return okRef(q) && !/^[tk]:/.test(q.port);
            if (!APPAREILS.includes(el.type) || !PORTS_APPAREIL[el.type].includes(q.port)) return false;
            // un port d'appareil ne reçoit qu'une conduite
            const cle = `${q.el}:${q.port}`;
            if (portsPris.has(cle) && portsPris.get(cle) !== e.id) return false;
            portsPris.set(cle, e.id);
            return true;
          };
          return e.a.el !== e.b.el && extremite(e.a) && extremite(e.b);
        }
        case 'orifice': {
          const r = idx.get(e.reservoir);
          if (r?.type !== 'reservoir') return false;
          const L = e.paroi === 'f' ? r.w : r.H;
          e.s = Math.min(Math.max(e.s, Math.min(e.d / 2 + 0.01, L / 2)), Math.max(L - e.d / 2 - 0.01, L / 2));
          return true;
        }
        case 'venturi': {
          const c = idx.get(e.conduite);
          if (c?.type !== 'conduite') return false;
          e.d = Math.min(e.d, c.D * 0.95);
          return true;
        }
        case 'exutoire': case 'pompe': case 'raccord': case 'robinet': case 'lance': case 'plaque': case 'auget': return true;
        case 'canal': if (e.modeleDe && idx.get(e.modeleDe)?.type !== 'canal') e.modeleDe = null; return true;
        case 'bille': {
          const r = idx.get(e.reservoir);
          if (r?.type !== 'reservoir') return false;
          e.x = Math.min(Math.max(e.x, e.d), Math.max(e.d, largeurA(r, 0) - e.d));
          e.z0 = Math.min(Math.max(e.z0, e.d), r.H + 1);
          return true;
        }
        case 'vanne': return idx.get(e.conduite)?.type === 'conduite';
        case 'piezometre': case 'manometre': return okRef(e.piquage);
        case 'tubeU': return okRef(e.piquage) && (!e.piquage2 || okRef(e.piquage2));
        case 'vannePlane': {
          const r = idx.get(e.reservoir);
          if (r?.type !== 'reservoir') return false;
          const L = longueurParoi(r, e.paroi);
          e.a = Math.min(e.a, L);
          e.s = Math.min(Math.max(e.s, e.a / 2), L - e.a / 2);
          return true;
        }
        case 'flotteur': {
          const r = idx.get(e.reservoir);
          if (r?.type !== 'reservoir') return false;
          e.l = Math.min(e.l, Math.max(0.05, r.w - 0.02));
          e.b = Math.min(e.b, r.b);
          e.x = Math.min(Math.max(e.x, e.l / 2), r.w - e.l / 2);
          return true;
        }
        default: return false;
      }
    };
    const avant = scene.elements.length;
    const portsPris = new Map();
    scene.elements = scene.elements.filter(garder);
    if (scene.elements.length !== avant) change = true;
  }
  return scene;
}
// Copie sérialisable (sans les caches « _ » du calcul).
export function exporterScene(scene) {
  return JSON.parse(JSON.stringify(scene, (k, v) => (k.startsWith('_') ? undefined : v)));
}
