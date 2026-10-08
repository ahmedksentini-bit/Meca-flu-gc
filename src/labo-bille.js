// Laboratoire virtuel — viscosimètre à chute de bille (chapitre 7, ex. 7.5).
//
// Une sphère lâchée dans le liquide d'un réservoir atteint une vitesse limite
// où poids apparent et traînée s'équilibrent : (ρs − ρ) g πd³/6 = ½ ρ V² Cx S.
// En régime de Stokes (Re < 1), Cx = 24/Re, soit F = 3πμVd. La loi complète
// (Schiller–Naumann) corrige Cx quand Re approche ou dépasse 1.
import * as P from './labo-physique.js';

const etats = new WeakMap();
export function cx(Re, loi = 'stokes') {
  if (!(Re > 0)) return Infinity;
  if (loi === 'stokes') return 24 / Re;
  return Re < 1000 ? 24 / Re * (1 + 0.15 * Math.pow(Re, 0.687)) : 0.44;
}
// Traînée linéarisée k (F = k v) : 3πμd en régime de Stokes.
function raideur(v, d, rho, mu, loi) {
  const Re = rho * Math.abs(v) * d / mu;
  if (Re < 1e-9) return 3 * Math.PI * mu * d;
  return 0.5 * rho * Math.abs(v) * cx(Re, loi) * Math.PI * d * d / 4;
}
export function vitesseLimite(d, rhoS, rho, mu, g, loi = 'stokes') {
  const W = (rhoS - rho) * g * Math.PI * d ** 3 / 6;
  if (!(W > 0)) return 0;
  if (loi === 'stokes') return W / (3 * Math.PI * mu * d);
  let lo = 0, hi = 1;
  for (let k = 0; k < 80 && raideur(hi, d, rho, mu, loi) * hi < W; k++) hi *= 2;
  for (let k = 0; k < 80; k++) { const m = (lo + hi) / 2; if (raideur(m, d, rho, mu, loi) * m < W) lo = m; else hi = m; }
  return (lo + hi) / 2;
}
export const muStokes = (d, rhoS, rho, V, g) => (rhoS - rho) * g * d * d / (18 * V);

// Liquide traversé à la cote z (absolue) : couche du réservoir, sinon air.
function milieu(b, scene, ctx, z) {
  const r = scene.elements.find(e => e.id === b.reservoir && e.type === 'reservoir');
  const e = r && P.etatReservoir(r, ctx), n = e && P.coucheA(e, z);
  if (n) { const f = ctx.fl(n.fluide); return { fluide: n.fluide, rho: f.rho, mu: f.mu }; }
  return { fluide: null, rho: 1.2, mu: 1.8e-5 };
}
const bas = (b, r) => r.z + b.d / 2;
function etat(b, scene) {
  let st = etats.get(b);
  const r = scene.elements.find(e => e.id === b.reservoir && e.type === 'reservoir');
  if (!r) return null;
  if (!st || st.sig !== `${b.z0}|${b.d}|${r.z}`) {
    st = { sig: `${b.z0}|${b.d}|${r.z}`, z: r.z + b.z0, v: 0, t: 0, lache: true, fond: false, passages: {} };
    etats.set(b, st);
  }
  return st;
}
export function lacher(b, scene) { etats.delete(b); const st = etat(b, scene); if (st) st.lache = true; return st; }
// Avance la chute de « dt » secondes ; vrai tant que la bille tombe.
export function avancerBille(b, scene, dt) {
  const st = etat(b, scene), ctx = P.contexte(scene), g = ctx.g;
  if (!st || !st.lache || st.fond) return false;
  if (!(dt > 0)) return true;
  const r = scene.elements.find(e => e.id === b.reservoir), m = b.rhoS * Math.PI * b.d ** 3 / 6, z1 = r.z + b.r1, z2 = r.z + b.r2;
  let reste = dt;
  for (let n = 0; n < 20000 && reste > 1e-12; n++) {
    const md = milieu(b, scene, ctx, st.z), k = raideur(st.v, b.d, md.rho, md.mu, b.trainee);
    // pas limité au quart du temps de relaxation m/k
    const h = Math.min(reste, 0.25 * m / k, 0.005);
    const W = (b.rhoS - md.rho) * g * Math.PI * b.d ** 3 / 6;
    const zAv = st.z;
    st.v = (st.v + h * W / m) / (1 + h * k / m);
    st.z -= st.v * h; st.t += h; reste -= h;
    // passages aux repères (interpolés dans le pas)
    for (const [nom, zr] of [['r1', z1], ['r2', z2]]) if (st.passages[nom] == null && zAv > zr && st.z <= zr) st.passages[nom] = st.t - h * (zr - st.z) / (zAv - st.z);
    if (st.z <= bas(b, r)) { st.z = bas(b, r); st.v = 0; st.fond = true; break; }
  }
  return !st.fond;
}
export function etatBille(b, scene, A) {
  const st = etat(b, scene);
  if (!st) return null;
  const ctx = A.ctx, g = ctx.g, r = scene.elements.find(e => e.id === b.reservoir);
  const md = milieu(b, scene, ctx, r.z + (b.r1 + b.r2) / 2);
  const Vlim = md.fluide ? vitesseLimite(b.d, b.rhoS, md.rho, md.mu, g, b.trainee) : null;
  const res = { ...st, milieu: md, Vlim, Re: Vlim ? md.rho * Vlim * b.d / md.mu : null, tau: md.fluide ? b.rhoS * b.d * b.d / (18 * md.mu) : null };
  const { r1, r2 } = st.passages;
  if (r1 != null && r2 != null && r2 > r1) {
    const V = (b.r1 - b.r2) / (r2 - r1), mu = muStokes(b.d, b.rhoS, md.rho, V, g);
    res.mesure = { dt: r2 - r1, V, mu, Re: md.rho * V * b.d / mu };
  }
  return res;
}
