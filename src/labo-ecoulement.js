// Laboratoire virtuel — écoulements en charge (chapitres 3, 4 et 6).
//
// Prolonge le moteur hydrostatique (labo-physique.js) : les conduites relient
// réservoirs, sorties à l'air libre, pompes et raccords en « chaînes » série ;
// chaque chaîne est résolue en régime quasi permanent par Bernoulli généralisé,
//   H_amont − H_aval + H_pompe(Q) = Σ pertes(Q),
// en fluide parfait (seule l'énergie cinétique de sortie est perdue) ou réel
// (Darcy–Weisbach, λ de Colebrook, pertes singulières). Les niveaux évoluent
// ensuite dans le temps (vidange, remplissage) par bilan de volume.
import * as P from './labo-physique.js';
import { darcyFriction } from './solvers.js';
import { avancerCanal, diagnostic, deriverMaquette } from './labo-canal.js';
import { avancerBille, etatBille } from './labo-bille.js';
// Les maquettes recopient leur prototype avant tout calcul.
function maquettes(scene) {
  for (const m of scene.elements) {
    if (m.type !== 'canal' || !m.modeleDe) continue;
    const p = scene.elements.find(e => e.id === m.modeleDe && e.type === 'canal');
    if (p) deriverMaquette(p, m);
  }
}

const aire = D => Math.PI * D * D / 4;
const fini = v => typeof v === 'number' && Number.isFinite(v);
export const MODES = { illustratif: 'Illustratif (équilibre rapide)', parfait: 'Fluide parfait (ch. 4)', reel: 'Fluide réel (ch. 6)' };
export const KS = { entree: 0.5, sortie: 1, venturi: 0.15 };

// Vanne à opercule : K croît très vite à la fermeture (table usuelle 1 ; 5,7 ; 28 ; 120
// pour 1, 3/4, 1/2, 1/4 d'ouverture, rapportée à K = 0,2 en pleine ouverture).
const COURBE_VANNE = [[1, 1], [0.75, 5.75], [0.5, 28], [0.25, 120], [0.1, 900]];
export function kVanne(v) {
  // une vanne posée sans réglage d'ouverture est grande ouverte
  const ouv = fini(v.ouverture) ? v.ouverture : 1;
  if (!v.ouverte || !(ouv > 0)) return Infinity;
  const a = Math.min(1, ouv), K0 = fini(v.Kv) ? v.Kv : 0.2;
  let r;
  if (a >= 1) r = 1;
  else if (a < 0.1) r = 900 * (0.1 / a) ** 2;
  else for (let i = 1; i < COURBE_VANNE.length; i++) {
    const [a1, k1] = COURBE_VANNE[i - 1], [a2, k2] = COURBE_VANNE[i];
    if (a >= a2) { const u = (a - a2) / (a1 - a2); r = Math.exp(Math.log(k2) + u * (Math.log(k1) - Math.log(k2))); break; }
  }
  return K0 + 0.2 * (r - 1);
}

// Débitmètre de Venturi (ex. 4.5) et tube de Pitot double (ex. 4.4).
export function debitVenturi({ dh, D1, d, Cq = 0.98, rho = 1000, rhoM = 13600, g = P.G }) {
  const dp = (rhoM - rho) * g * dh, S1 = aire(D1), S2 = aire(d);
  return Cq * S2 * Math.sqrt(2 * dp / (rho * (1 - (S2 / S1) ** 2)));
}
export const vitessePitot = ({ dh, rho = 1000, rhoM = 13600, g = P.G }) => Math.sqrt(2 * (rhoM - rho) * g * dh / rho);

// ---------- chaînes de conduites ----------
const autrePort = (el, port) => (el.type === 'pompe' ? (port === 'asp' ? 'ref' : 'asp') : el.type === 'raccord' ? (port === 'a' ? 'b' : 'a') : null);
const terminal = el => !el || el.type === 'reservoir' || el.type === 'exutoire';
export function chaines(scene, idx = P.indexer(scene)) {
  const conduites = scene.elements.filter(e => e.type === 'conduite');
  const parPort = new Map();
  for (const c of conduites) for (const k of ['a', 'b']) {
    const cle = `${c[k].el}:${c[k].port}`;
    if (!parPort.has(cle)) parPort.set(cle, []);
    parPort.get(cle).push({ c, bout: k });
  }
  const vus = new Set(), res = [];
  for (const c0 of conduites) {
    if (vus.has(c0.id)) continue;
    // On remonte côté « a » jusqu'à un réservoir, une sortie ou un port libre.
    let c = c0, bout = 'a', complet = true;
    for (let g = 0; g < 100; g++) {
      const q = c[bout], el = idx.get(q.el);
      if (terminal(el)) break;
      const ap = autrePort(el, q.port), suiv = (parPort.get(`${el.id}:${ap}`) || []).find(o => o.c !== c);
      if (!suiv) { complet = false; break; }
      c = suiv.c; bout = suiv.bout === 'a' ? 'b' : 'a';
    }
    // Puis on parcourt la chaîne dans l'autre sens.
    const items = [];
    let entree = bout, Y = null;
    const X = c[entree];
    for (let g = 0; g < 100; g++) {
      if (vus.has(c.id)) { complet = false; break; }
      vus.add(c.id);
      const sortie = entree === 'a' ? 'b' : 'a';
      items.push({ type: 'conduite', c, sens: entree === 'a' ? 1 : -1 });
      const q = c[sortie], el = idx.get(q.el);
      if (terminal(el)) { Y = q; break; }
      const ap = autrePort(el, q.port);
      items.push({ type: el.type, el, entre: q.port });
      const suiv = (parPort.get(`${el.id}:${ap}`) || []).find(o => o.c !== c);
      if (!suiv) { complet = false; break; }
      c = suiv.c; entree = suiv.bout;
    }
    if (!terminal(idx.get(X.el))) complet = false;
    res.push({ id: items.filter(i => i.type === 'conduite').map(i => i.c.id).join('+'), X, Y, items, complet: complet && !!Y });
  }
  return res;
}

// Charge d'un bout de chaîne pour un liquide de masse volumique rho.
function bout(scene, A, q) {
  const el = A.idx.get(q.el);
  if (el.type === 'exutoire') return { type: 'sortie', el, z: el.z, p: 0, couche: null, libre: true };
  const e = A.etats.get(el.id), Pt = P.resoudre(scene, q, A.idx);
  const n = P.coucheA(e, Pt.z);
  return { type: 'reservoir', el, e, x: Pt.x, z: Pt.z, port: Pt, p: P.pressionDans(e, Pt.z, A.ctx), couche: n, libre: !n };
}

// Résolution d'une chaîne : débit, pertes détaillées et profil de charge.
function resoudreChaine(ch, scene, A, mode) {
  const { ctx } = A, g = ctx.g;
  const sol = { ch, Q: 0, dir: 1, raison: null };
  if (!ch.complet) { sol.raison = 'Chaîne ouverte : un appareil n’est raccordé que d’un côté.'; return sol; }
  const X = bout(scene, A, ch.X), Y = bout(scene, A, ch.Y);
  for (const dir of [1, -1]) {
    const S = dir > 0 ? X : Y, Dt = dir > 0 ? Y : X;
    if (S.type !== 'reservoir' || !S.couche) continue;
    const ordre = dir > 0 ? ch.items : ch.items.slice().reverse();
    const fluide = S.couche.fluide, rho = S.couche.rho, f = ctx.fl(fluide), nu = f.mu / rho;
    // Pompes : actives dans leur sens, clapet anti-retour sinon.
    const pompes = ordre.filter(i => i.type === 'pompe').map(i => ({ el: i.el, actif: i.el.marche !== false && (dir > 0 ? i.entre === 'asp' : i.entre === 'ref') }));
    if (pompes.some(p => !p.actif)) continue;
    const tuyaux = ordre.filter(i => i.type === 'conduite').map(i => {
      const c = i.c, vannes = P.vannesDe(scene, c), tr = A.conduites.get(c.id)?.tr;
      return { c, sens: i.sens * dir, D: c.D, L: fini(c.Lreel) ? c.Lreel : (tr ? tr.L : 1), Lt: tr ? tr.L : 1, tr,
        Kv: vannes.reduce((t, v) => t + kVanne(v), 0), vannes,
        venturis: scene.elements.filter(e => e.type === 'venturi' && e.conduite === c.id) };
    });
    if (tuyaux.some(t => !Number.isFinite(t.Kv))) continue; // vanne fermée
    const raccords = [];
    ordre.forEach((it, k) => {
      if (it.type !== 'raccord') return;
      const avant = ordre.slice(0, k).reverse().find(o => o.type === 'conduite'), apres = ordre.slice(k + 1).find(o => o.type === 'conduite');
      raccords.push({ el: it.el, D1: avant.c.D, D2: apres.c.D, iAvant: tuyaux.findIndex(t => t.c === avant.c) });
    });
    const sortieNoyee = Dt.type === 'reservoir' && !!Dt.couche;
    const Hs = S.z + S.p / (rho * g);
    const Hd = Dt.type === 'sortie' ? Dt.z : Dt.z + Dt.p / (rho * g);
    // Pertes pour un débit Q (et leur détail quand on le demande).
    const pertes = (Q, detail = false) => {
      let total = 0;
      const det = tuyaux.map((t, i) => {
        const V = Q / aire(t.D), hv = V * V / (2 * g);
        const d = { V, hv, Re: V * t.D / nu, lambda: 0, hf: 0, hK: 0, he: 0, hvannes: 0, hventuri: 0 };
        if (mode === 'reel') {
          d.lambda = fini(t.c.lambda) ? t.c.lambda : (Q > 0 ? darcyFriction(d.Re, (fini(t.c.rugo) ? t.c.rugo : 0.1) / 1000 / t.D) : 0);
          d.hf = d.lambda * t.L / t.D * hv;
          d.hK = (t.c.K || 0) * hv;
          d.hvannes = t.Kv * hv;
          if (i === 0 && t.c.Kauto !== false) d.he = KS.entree * hv;
          for (const v of t.venturis) { const Vc = Q / aire(v.d); d.hventuri += KS.venturi * (Vc - V) ** 2 / (2 * g); }
        }
        total += d.hf + d.hK + d.hvannes + d.he + d.hventuri;
        return d;
      });
      const rac = raccords.map(r => {
        const V1 = Q / aire(r.D1), V2 = Q / aire(r.D2);
        let h = 0;
        if (mode === 'reel') h = r.D2 >= r.D1 ? (V1 - V2) ** 2 / (2 * g) : 0.5 * (1 - (r.D2 / r.D1) ** 2) * V2 * V2 / (2 * g);
        total += h;
        return { ...r, V1, V2, h };
      });
      const dl = det[det.length - 1];
      // Énergie cinétique de sortie : toujours perdue à l'air libre ; dans un
      // réservoir, perte de Borda (K = 1), incluse dans ΣK si l'utilisateur la saisit.
      const derniere = tuyaux[tuyaux.length - 1];
      const ks = mode === 'parfait' || !sortieNoyee || derniere.c.Kauto !== false ? 1 : 0;
      const hs = ks * dl.hv;
      total += hs;
      return detail ? { total, det, rac, hs } : total;
    };
    const hPompes = Q => pompes.reduce((t, p) => t + (p.el.mode === 'courbe' ? p.el.H0 - p.el.k * Q * Q : 0), 0);
    const imposee = pompes.find(p => p.el.mode === 'debit');
    let Q;
    if (imposee) Q = Math.max(0, imposee.el.Q);
    else {
      const F = Q => Hs - Hd + hPompes(Q) - pertes(Q);
      if (!(F(1e-9) > 1e-6)) continue;
      let hi = aire(Math.min(...tuyaux.map(t => t.D))) * Math.sqrt(2 * g * Math.max(1, Math.abs(Hs - Hd) + pompes.reduce((t, p) => t + p.el.H0, 0)));
      for (let k = 0; k < 60 && F(hi) > 0; k++) hi *= 2;
      let lo = 0;
      for (let k = 0; k < 70; k++) { const m = (lo + hi) / 2; if (F(m) > 0) lo = m; else hi = m; }
      Q = (lo + hi) / 2;
    }
    if (!(Q > 0)) continue;
    const det = pertes(Q, true);
    const Hcourbes = hPompes(Q);
    const hmtImposee = imposee ? det.total - (Hs - Hd) - Hcourbes : 0;
    Object.assign(sol, { Q, dir, ordre, S, Dt, Hs, Hd, fluide, rho, nu, tuyaux, raccords: det.rac, det: det.det, hs: det.hs, total: det.total, sortieNoyee,
      pompes: pompes.map(p => {
        const H = p.el.mode === 'courbe' ? p.el.H0 - p.el.k * Q * Q : hmtImposee;
        return { el: p.el, H, Ph: rho * g * Q * H, Pabs: rho * g * Q * H / p.el.eta };
      }) });
    profil(sol, mode, g);
    return sol;
  }
  return sol;
}

// Profil de charge H le long de la chaîne : pertes linéaires réparties, pertes
// locales aux vannes, au venturi, aux raccords ; saut de charge à la pompe.
function profil(sol, mode, g) {
  let H = sol.Hs;
  sol.parTuyau = new Map();
  let iT = 0;
  for (const it of sol.ordre) {
    if (it.type === 'pompe') { H += sol.pompes.find(p => p.el === it.el).H; continue; }
    if (it.type === 'raccord') { const r = sol.raccords.find(k => k.el === it.el); r.Hav = H; H -= r.h; r.Hap = H; continue; }
    if (it.type !== 'conduite') continue;
    const t = sol.tuyaux[iT], d = sol.det[iT];
    iT++;
    // u : abscisse réduite dans le sens de l'écoulement ; t = u ou 1 − u.
    const vers = u => (t.sens > 0 ? u : 1 - u);
    const evts = [];
    for (const v of t.vannes) evts.push({ u: t.sens > 0 ? v.t : 1 - v.t, dH: mode === 'reel' ? kVanne(v) * d.hv : 0, vanne: v });
    for (const v of t.venturis) evts.push({ u: t.sens > 0 ? v.t : 1 - v.t, dH: mode === 'reel' ? KS.venturi * (sol.Q / aire(v.d) - d.V) ** 2 / (2 * g) : 0, venturi: v });
    evts.sort((a, b) => a.u - b.u);
    const pente = d.hf + d.hK; // réparties sur la longueur
    const pts = [];
    H -= d.he;
    pts.push({ u: 0, H: H + d.he }, { u: 0, H });
    let u0 = 0;
    for (const e of evts) {
      H -= pente * (e.u - u0); u0 = e.u;
      pts.push({ u: e.u, H }); H -= e.dH; pts.push({ u: e.u, H });
      e.H = H;
    }
    H -= pente * (1 - u0);
    pts.push({ u: 1, H });
    // La perte de sortie (énergie cinétique du jet) se dessine après le dernier point.
    const hsExit = iT === sol.tuyaux.length ? sol.hs : 0;
    const points = pts.map(p => ({ t: vers(p.u), H: p.H }));
    if (t.sens < 0) points.reverse();
    // demi-largeur (en t) de la zone du col d'un venturi
    const cols = t.venturis.map(v => ({ t: v.t, dt: 0.3 / Math.max(t.Lt, 0.6), hv: (sol.Q / aire(v.d)) ** 2 / (2 * g) }));
    sol.parTuyau.set(t.c.id, { t, d, points, cols, evts, Hfin: H, hsExit, sortieT: vers(1) });
  }
}

// Charge et hauteur dynamique en un point d'une conduite en écoulement.
export function chargeEn(pt, t) {
  const pts = pt.points;
  let H = pts[0].H;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    if (t >= a.t - 1e-12 && t <= b.t + 1e-12) { H = b.t - a.t > 1e-12 ? a.H + (b.H - a.H) * (t - a.t) / (b.t - a.t) : (t <= a.t ? a.H : b.H); break; }
  }
  let hv = pt.d.hv;
  for (const c of pt.cols) hv += (c.hv - pt.d.hv) * Math.max(0, 1 - Math.abs(t - c.t) / c.dt);
  return { H, hv };
}

// ---------- obstacles : plaques et augets (chapitre 5) ----------
const rad = a => a * Math.PI / 180;
// Segment d'interception : la plaque elle-même, ou l'embouchure de l'auget
// (perpendiculaire à la direction f vers laquelle il s'ouvre).
export function segmentObstacle(o) {
  if (o.type === 'plaque') {
    const t = { x: Math.cos(rad(o.angle)), z: Math.sin(rad(o.angle)) };
    return { a: { x: o.x - t.x * o.L / 2, z: o.z - t.z * o.L / 2 }, b: { x: o.x + t.x * o.L / 2, z: o.z + t.z * o.L / 2 }, t };
  }
  const f = { x: Math.cos(rad(o.angle)), z: Math.sin(rad(o.angle)) }, t = { x: -f.z, z: f.x };
  return { a: { x: o.x - t.x * o.w / 2, z: o.z - t.z * o.w / 2 }, b: { x: o.x + t.x * o.w / 2, z: o.z + t.z * o.w / 2 }, t, f };
}
// Abscisse u ∈ [0, 1] du croisement des segments [p, q] et [a, b], ou null.
function croisement(p, q, a, b) {
  const rx = q.x - p.x, rz = q.z - p.z, sx = b.x - a.x, sz = b.z - a.z, den = rx * sz - rz * sx;
  if (Math.abs(den) < 1e-14) return null;
  const u = ((a.x - p.x) * sz - (a.z - p.z) * sx) / den, v = ((a.x - p.x) * rz - (a.z - p.z) * rx) / den;
  return u >= 0 && u <= 1 && v >= 0 && v <= 1 ? u : null;
}

// ---------- orifices, sorties libres et jets ----------
function trajectoire(scene, A, x0, z0, vx, vz, exclu = null, sauf = null) {
  const g = A.ctx.g, zSol = fini(scene.env.zSol) ? scene.env.zSol : 0;
  const pts = [{ x: x0, z: z0 }];
  let cible = null, x = x0, z = z0, t = 0;
  const dt = 0.01;
  const obs = scene.elements.filter(o => (o.type === 'plaque' || o.type === 'auget') && o !== sauf).map(o => ({ o, seg: segmentObstacle(o) }));
  for (let i = 0; i < 4000; i++) {
    t += dt;
    const xn = x0 + vx * t, zn = z0 + vz * t - g * t * t / 2;
    // premier obstacle rencontré pendant ce pas
    let choc = null;
    for (const { o, seg } of obs) {
      const u = croisement({ x, z }, { x: xn, z: zn }, seg.a, seg.b);
      if (u == null || (choc && u >= choc.u)) continue;
      const th = t - dt + u * dt, v = { x: vx, z: vz - g * th };
      // l'auget n'intercepte que le jet qui entre par son embouchure plus vite qu'il ne fuit
      if (o.type === 'auget' && -(v.x * seg.f.x + v.z * seg.f.z) <= (o.u || 0)) continue;
      choc = { u, o, x: x + (xn - x) * u, z: z + (zn - z) * u, v, t: th };
    }
    if (choc) { pts.push({ x: choc.x, z: choc.z }); return { pts, cible: null, x: choc.x, z: choc.z, impact: choc }; }
    // entrée par le haut d'un réservoir ouvert
    if (!cible) for (const r of scene.elements) {
      if (r.type !== 'reservoir' || r.ferme || r === exclu) continue;
      const zt = r.z + r.H;
      if (z >= zt && zn < zt) {
        const xc = x + (xn - x) * (z - zt) / (z - zn);
        if (xc > r.x && xc < r.x + P.largeurA(r, r.H)) cible = r;
      }
    }
    if (cible) {
      const zl = A.etats.get(cible.id).zL;
      if (zn <= zl) { pts.push({ x: xn, z: zl }); return { pts, cible, x: xn, z: zl }; }
    } else if (zn <= zSol) {
      const xs = x + (xn - x) * (z - zSol) / (z - zn);
      pts.push({ x: xs, z: zSol });
      return { pts, cible: null, x: xs, z: zSol, portee: xs - x0, chute: z0 - zSol };
    }
    if (i % 3 === 0) pts.push({ x: xn, z: zn });
    x = xn; z = zn;
  }
  return { pts, cible: null, x, z };
}
function etatOrifice(o, scene, A) {
  const r = A.idx.get(o.reservoir), e = A.etats.get(o.reservoir), g = A.ctx.g;
  const R = P.repereParoi(r, o.paroi), pos = { x: R.ox + o.s * R.dx, z: R.oz + o.s * R.dz };
  const n = P.coucheA(e, pos.z), p = P.pressionDans(e, pos.z, A.ctx);
  const res = { o, r, pos, n: { x: R.nx, z: R.nz }, h: n ? p / (n.rho * g) : 0, Q: 0, V: 0, fluide: n ? n.fluide : null };
  if (!o.ouvert || !n || !(res.h > 0)) return res;
  const Vth = Math.sqrt(2 * g * res.h);
  Object.assign(res, { Vth, V: o.Cv * Vth, Q: o.Cd * aire(o.d) * Vth, rho: n.rho });
  // réaction du jet sur le réservoir (ex. 5.5) : −ρQV dans l'axe du jet
  res.reaction = n.rho * res.Q * res.V;
  return res;
}

// Déviation d'un jet par un obstacle (théorème d'Euler, frottements négligés) :
// effort exercé par le jet et jets qui en repartent.
export function deflexion(im, Q, rho) {
  const o = im.o, seg = segmentObstacle(o), v = im.v, V = Math.hypot(v.x, v.z);
  if (o.type === 'plaque') {
    // plaque lisse : effort normal, nappes le long de la plaque à la même vitesse
    const t = seg.t, n = { x: -t.z, z: t.x };
    const vt = v.x * t.x + v.z * t.z, vn = v.x * n.x + v.z * n.z;
    const Q1 = Q / 2 * (1 + vt / V), Q2 = Q - Q1;
    const sorties = [];
    if (Q1 > 1e-3 * Q) sorties.push({ x: seg.b.x, z: seg.b.z, vx: V * t.x, vz: V * t.z, Q: Q1 });
    if (Q2 > 1e-3 * Q) sorties.push({ x: seg.a.x, z: seg.a.z, vx: -V * t.x, vz: -V * t.z, Q: Q2 });
    return { o, x: im.x, z: im.z, Q, V, v, rho, vn, vt, alpha: Math.asin(Math.min(1, Math.abs(vn) / V)) * 180 / Math.PI, Q1, Q2,
      F: { x: rho * Q * vn * n.x, z: rho * Q * vn * n.z }, sorties };
  }
  // auget animé de la vitesse u vers son fond (direction −f) : on raisonne en
  // vitesses relatives, le jet est tourné de β puis rendu à l'absolu
  const e = { x: -seg.f.x, z: -seg.f.z }, u = o.u || 0;
  const vr = { x: v.x - u * e.x, z: v.z - u * e.z }, Vr = Math.hypot(vr.x, vr.z), Qr = Q * Vr / V;
  const b = rad(o.beta) * (o.sens === -1 ? -1 : 1), c = Math.cos(b), sn = Math.sin(b);
  const vro = { x: vr.x * c - vr.z * sn, z: vr.x * sn + vr.z * c };
  const F = { x: rho * Qr * (vr.x - vro.x), z: rho * Qr * (vr.z - vro.z) };
  const vo = { x: vro.x + u * e.x, z: vro.z + u * e.z };
  // à 180°, l'arête partage le jet entre les deux lèvres (auget Pelton)
  const levres = o.beta >= 179 ? [[seg.a, 0.5], [seg.b, 0.5]] : [[o.sens === -1 ? seg.a : seg.b, 1]];
  return { o, x: im.x, z: im.z, Q, Qr, V, Vr, v, rho, u, F, P: (F.x * e.x + F.z * e.z) * u, vo,
    sorties: levres.map(([l, k]) => ({ x: l.x, z: l.z, vx: vo.x, vz: vo.z, Q: Q * k })) };
}
// Lance un jet, le suit d'obstacle en obstacle et renvoie ses destinations.
function lancerJet(scene, A, src, prof = 0) {
  const E = A.ecoulement;
  const tr = trajectoire(scene, A, src.x, src.z, src.vx, src.vz, src.exclu || null, src.sauf || null);
  E.jets.push({ de: src.de, pts: src.depuis ? [src.depuis, ...tr.pts] : tr.pts, fluide: src.fluide, Q: src.Q, V: Math.hypot(src.vx, src.vz),
    portee: prof ? null : tr.portee, d: src.d, nappe: prof > 0 });
  if (!tr.impact || prof >= 3) return { tr, dests: [{ cible: tr.cible, Q: src.Q }] };
  const im = deflexion(tr.impact, src.Q, src.rho);
  let ob = E.obstacles.get(im.o.id);
  if (!ob) E.obstacles.set(im.o.id, ob = { o: im.o, F: { x: 0, z: 0 }, P: 0, impacts: [] });
  ob.F.x += im.F.x; ob.F.z += im.F.z; ob.P += im.P || 0; ob.impacts.push({ ...im, de: src.de });
  const dests = [];
  for (const so of im.sorties) dests.push(...lancerJet(scene, A, { ...so, fluide: src.fluide, rho: src.rho, de: src.de, sauf: im.o, depuis: { x: im.x, z: im.z } }, prof + 1).dests);
  return { tr, im, dests };
}

// ---------- analyse complète ----------
export function appliquerEcoulement(scene, A) {
  const mode = scene.env.ecoulement, g = A.ctx.g;
  const E = { mode, chaines: [], parConduite: new Map(), orifices: new Map(), sorties: new Map(), robinets: new Map(), venturis: new Map(), lances: new Map(),
    obstacles: new Map(), transferts: [], jets: [] };
  A.ecoulement = E;
  A.alertesEcoulement = [];
  for (const ch of chaines(scene, A.idx)) {
    const sol = resoudreChaine(ch, scene, A, mode);
    E.chaines.push(sol);
    if (!ch.complet) A.alertesEcoulement.push({ id: ch.items[0]?.c.id, niveau: 'info', texte: `${ch.id} : ${sol.raison}` });
    if (!(sol.Q > 0)) continue;
    for (const [id, pt] of sol.parTuyau) {
      E.parConduite.set(id, { sol, ...pt });
      const ec = A.conduites.get(id);
      if (!ec) continue;
      // Les prises lisent désormais la ligne piézométrique (statique) ou la ligne de charge (Pitot).
      const z = t => P.pointSurTrace(ec.tr, t).z;
      ec.q = sol.Q * pt.t.sens; ec.sens = pt.t.sens; ec.ecoulement = true;
      ec.troncons = [{ t0: 0, t1: 1, fluide: sol.fluide, cote: null }];
      ec.en = t => { const c = chargeEn(pt, t); return { p: sol.rho * g * (c.H - c.hv - z(t)), fluide: sol.fluide, z: z(t) }; };
      ec.enTotal = t => { const c = chargeEn(pt, t); return { p: sol.rho * g * (c.H - z(t)), fluide: sol.fluide, z: z(t) }; };
      ec.deltas = pt.t.vannes.map(v => {
        const e = pt.evts.find(k => k.vanne === v);
        return { id: v.id, dp: sol.rho * g * (e ? e.dH : 0), z: z(v.t), ecoulement: true };
      });
      let pire = null;
      for (let i = 0; i <= 120; i++) {
        const q = ec.en(i / 120), pabs = q.p + A.ctx.patm;
        if (!pire || pabs < pire.pabs) pire = { t: i / 120, pabs, fluide: sol.fluide, z: q.z, p: q.p };
      }
      ec.pire = pire;
    }
    // Sortie à l'air libre : jet dans l'axe du dernier tronçon.
    if (sol.Dt.type === 'sortie' || !sol.sortieNoyee) {
      const der = sol.tuyaux[sol.tuyaux.length - 1], ec = A.conduites.get(der.c.id);
      const pts = ec.tr.pts, fin = der.sens > 0 ? pts[pts.length - 1] : pts[0], av = der.sens > 0 ? pts[pts.length - 2] : pts[1];
      const lg = Math.hypot(fin.x - av.x, fin.z - av.z) || 1, V = sol.Q / aire(der.D);
      if (sol.Dt.type === 'reservoir') {
        // sortie au-dessus de la surface d'un réservoir : elle le remplit directement
        E.transferts.push({ src: sol.S.el, port: sol.S.port, fluide: sol.fluide, Q: sol.Q, dst: sol.Dt.el, sol });
      } else {
        const j = lancerJet(scene, A, { x: fin.x, z: fin.z, vx: V * (fin.x - av.x) / lg, vz: V * (fin.z - av.z) / lg, Q: sol.Q, fluide: sol.fluide, rho: sol.rho, de: sol.Dt.el.id, d: der.D });
        E.sorties.set(sol.Dt.el.id, { V, Q: sol.Q, jet: j.tr, sol, reaction: sol.rho * sol.Q * V });
        for (const d of j.dests) E.transferts.push({ src: sol.S.el, port: sol.S.port, fluide: sol.fluide, Q: d.Q, dst: d.cible, sol });
      }
    } else E.transferts.push({ src: sol.S.el, port: sol.S.port, fluide: sol.fluide, Q: sol.Q, dst: sol.Dt.el, sol, H: sol.Hs - sol.Hd });
    // Cavitation : la colonne se rompt si la pression absolue tombe sous p_v.
    for (const [id] of sol.parTuyau) {
      const ec = A.conduites.get(id), pv = A.ctx.fl(sol.fluide).pv;
      if (ec && ec.pire && ec.pire.pabs < pv) A.alertesEcoulement.push({ id, niveau: 'alerte', texte: `${id} : pression absolue ${P.nombre(ec.pire.pabs / 1000, 2)} kPa < p<sub>v</sub> à z = ${P.nombre(ec.pire.z, 2)} m — la veine se rompt (cavitation, désamorçage).` });
    }
  }
  // Venturis : chute de pression au col (Bernoulli entre l'entrée et le col) et
  // lecture du manomètre différentiel intégré.
  for (const v of scene.elements) {
    if (v.type !== 'venturi') continue;
    const c = A.idx.get(v.conduite), pc = E.parConduite.get(v.conduite), ec = A.conduites.get(v.conduite);
    if (!c || !ec) continue;
    const Q = pc ? pc.sol.Q : 0, rho = pc ? pc.sol.rho : A.ctx.rho(ec.en(v.t).fluide) || 1000, rhoM = A.ctx.rho(v.fluideM);
    const V1 = Q / aire(c.D), V2 = Q / aire(v.d), dp = rho / 2 * (V2 * V2 - V1 * V1), dh = dp / ((rhoM - rho) * g);
    const p1 = ec.en(v.t).p;
    E.venturis.set(v.id, { v, Q, V1, V2, dp, dh, p1, p2: p1 - dp, Qmes: Q > 0 ? debitVenturi({ dh, D1: c.D, d: v.d, Cq: v.Cq, rho, rhoM, g }) : 0, rho, rhoM });
    if (pc && p1 - dp + A.ctx.patm < A.ctx.fl(pc.sol.fluide).pv)
      A.alertesEcoulement.push({ id: v.id, niveau: 'alerte', texte: `${v.id} : la pression absolue au col tombe sous p<sub>v</sub> — cavitation au col du venturi.` });
  }
  for (const o of scene.elements) {
    if (o.type !== 'orifice' || !A.idx.get(o.reservoir)) continue;
    const st = etatOrifice(o, scene, A);
    E.orifices.set(o.id, st);
    if (st.Q > 0) {
      const j = lancerJet(scene, A, { x: st.pos.x, z: st.pos.z, vx: st.V * st.n.x, vz: st.V * st.n.z, Q: st.Q, fluide: st.fluide, rho: st.rho, de: o.id, exclu: st.r, d: o.d });
      st.jet = j.tr;
      for (const d of j.dests) E.transferts.push({ src: st.r, port: { z: st.pos.z, x: st.pos.x }, fluide: st.fluide, Q: d.Q, dst: d.cible, orifice: o });
    }
  }
  for (const b of scene.elements) {
    if (b.type !== 'robinet') continue;
    const st = { b, Q: b.ouvert ? b.Q : 0 };
    if (st.Q > 0) {
      const j = lancerJet(scene, A, { x: b.x, z: b.z, vx: 0, vz: -0.3, Q: st.Q, fluide: b.fluide, rho: A.ctx.rho(b.fluide), de: b.id, d: 0.03 });
      st.jet = j.tr;
      for (const d of j.dests) E.transferts.push({ src: null, fluide: b.fluide, Q: d.Q, dst: d.cible, robinet: b });
    }
    E.robinets.set(b.id, st);
  }
  // Lances : jet de vitesse et de diamètre imposés (alimentation extérieure).
  for (const l of scene.elements) {
    if (l.type !== 'lance') continue;
    const rho = A.ctx.rho(l.fluide), Q = l.ouvert ? aire(l.d) * l.V : 0, a = rad(l.angle);
    const st = { l, Q, V: l.V, rho, reaction: rho * Q * l.V, dir: { x: Math.cos(a), z: Math.sin(a) } };
    if (Q > 0) {
      const j = lancerJet(scene, A, { x: l.x, z: l.z, vx: l.V * st.dir.x, vz: l.V * st.dir.z, Q, fluide: l.fluide, rho, de: l.id, d: l.d });
      st.jet = j.tr; st.im = j.im;
      for (const d of j.dests) E.transferts.push({ src: null, fluide: l.fluide, Q: d.Q, dst: d.cible, lance: l });
    }
    E.lances.set(l.id, st);
  }
  return E;
}
export function analyserTout(scene) {
  const mode = scene.env.ecoulement || 'illustratif';
  let A;
  if (mode === 'illustratif') {
    A = P.analyser(scene);
    if (scene.elements.some(e => ['orifice', 'pompe', 'exutoire', 'robinet', 'raccord', 'venturi', 'lance'].includes(e.type)))
      A.alertes.push({ id: '', niveau: 'info', texte: 'Mode illustratif : orifices, pompes, lances et sorties libres sont inactifs. Choisissez « fluide parfait » ou « fluide réel » pour simuler l’écoulement.' });
  } else A = P.analyser(scene, { apresConduites: B => appliquerEcoulement(scene, B) });
  A.efforts = effortsAncrage(scene, A);
  maquettes(scene);
  A.canaux = new Map();
  for (const c of scene.elements) if (c.type === 'canal') A.canaux.set(c.id, diagnostic(c, A.ctx.g));
  A.billes = new Map();
  for (const b of scene.elements) if (b.type === 'bille') A.billes.set(b.id, etatBille(b, scene, A));
  return A;
}

// ---------- efforts sur les coudes et les raccords (théorème d'Euler) ----------
// Effort de l'eau sur un coude : F = (p S + ρ Q V)(e₁ − e₂), e₁ et e₂ étant les
// directions de l'écoulement à l'entrée et à la sortie (poids de l'eau contenue
// négligé). Sur un raccord : F = (p₁S₁ + ρQV₁ − p₂S₂ − ρQV₂) dans l'axe.
const unite = (a, b) => { const l = Math.hypot(b.x - a.x, b.z - a.z) || 1; return { x: (b.x - a.x) / l, z: (b.z - a.z) / l }; };
export function effortsAncrage(scene, A) {
  const E = A.ecoulement, coudes = [], raccords = [];
  const debit = c => { const pc = E && E.parConduite.get(c.id); return pc ? { Q: pc.sol.Q, sens: pc.t.sens } : { Q: 0, sens: 1 }; };
  const pression = (ec, t) => { const q = ec.en(t); return q && q.fluide && fini(q.p) ? { p: q.p, rho: A.ctx.rho(q.fluide) } : null; };
  for (const c of scene.elements) {
    if (c.type !== 'conduite') continue;
    const ec = A.conduites.get(c.id);
    if (!ec || !ec.tr || !ec.en) continue;
    const { Q, sens } = debit(c), S = aire(c.D), V = Q / S, pts = ec.tr.pts;
    for (let i = 1; i < pts.length - 1; i++) {
      let e1 = unite(pts[i - 1], pts[i]), e2 = unite(pts[i], pts[i + 1]);
      if (sens < 0) [e1, e2] = [{ x: -e2.x, z: -e2.z }, { x: -e1.x, z: -e1.z }];
      const q = pression(ec, ec.tr.cum[i] / ec.tr.L);
      if (!q) continue;
      const m = q.p * S + q.rho * Q * V;
      const dev = Math.acos(Math.max(-1, Math.min(1, e1.x * e2.x + e1.z * e2.z)));
      coudes.push({ id: `${c.id}:${i}`, c, i, x: pts[i].x, z: pts[i].z, e1, e2, p: q.p, rho: q.rho, S, Q, V, m,
        angle: dev * 180 / Math.PI, F: { x: m * (e1.x - e2.x), z: m * (e1.z - e2.z) } });
    }
  }
  for (const r of scene.elements) {
    if (r.type !== 'raccord') continue;
    const bout = port => {
      const c = scene.elements.find(k => k.type === 'conduite' && ((k.a.el === r.id && k.a.port === port) || (k.b.el === r.id && k.b.port === port)));
      const ec = c && A.conduites.get(c.id);
      if (!ec || !ec.en) return null;
      const q = pression(ec, c.a.el === r.id && c.a.port === port ? 0 : 1);
      return q ? { c, ...q, S: aire(c.D), ...debit(c) } : null;
    };
    const a = bout('a'), b = bout('b');
    if (!a || !b) continue;
    const Q = a.Q, Va = Q / a.S, Vb = Q / b.S, pa = P.portAppareil(r, 'a'), pb = P.portAppareil(r, 'b'), e = unite(pa, pb);
    const ma = a.p * a.S + a.rho * Q * Va, mb = b.p * b.S + b.rho * Q * Vb;
    raccords.push({ id: r.id, r, x: r.x, z: r.z, e, a, b, Q, Va, Vb, Fa: ma - mb, F: { x: (ma - mb) * e.x, z: (ma - mb) * e.z } });
  }
  return { coudes, raccords };
}

// ---------- évolution dans le temps ----------
function analyseLegere(scene) {
  const ctx = P.contexte(scene), idx = P.indexer(scene), etats = new Map(), conduites = new Map();
  for (const r of scene.elements) if (r.type === 'reservoir') etats.set(r.id, P.etatAvecFlotteurs(scene, r, ctx));
  for (const c of scene.elements) if (c.type === 'conduite') { const ec = P.etatConduite(c, scene, ctx, etats, idx); if (ec) conduites.set(c.id, ec); }
  const A = { ctx, idx, etats, conduites };
  appliquerEcoulement(scene, A);
  return A;
}
// Avance la simulation de « duree » secondes (temps simulé) ; renvoie vrai tant
// qu'un débit circule. Le pas interne limite la variation de niveau.
export function integrer(scene, duree, { dzMax = null, pasMax = 400 } = {}) {
  let reste = duree, actif = false;
  scene._t = scene._t || 0;
  for (let n = 0; n < pasMax && reste > 1e-9; n++) {
    const A = analyseLegere(scene), E = A.ecoulement;
    const tr = E.transferts.filter(t => t.Q > 0);
    if (!tr.length) break;
    actif = true;
    // Pas admissible : variation de niveau limitée dans chaque réservoir concerné.
    const net = new Map();
    for (const t of tr) {
      if (t.src && !t.src.constant) net.set(t.src, (net.get(t.src) || 0) - t.Q);
      if (t.dst && !t.dst.constant) net.set(t.dst, (net.get(t.dst) || 0) + t.Q);
    }
    let dt = reste;
    for (const [r, q] of net) {
      const e = A.etats.get(r.id), S = r.b * P.largeurA(r, Math.min(e.sL, r.H));
      const lim = dzMax != null ? dzMax : Math.max(0.002, 0.004 * r.H);
      if (Math.abs(q) > 1e-12) dt = Math.min(dt, lim * S / Math.abs(q));
    }
    // Entre deux réservoirs, on ne dépasse pas l'égalité des charges.
    for (const t of tr) {
      if (!t.src || !t.dst || !(t.H > 0)) continue;
      const Sa = t.src.constant ? Infinity : t.src.b * P.largeurA(t.src, A.etats.get(t.src.id).sL);
      const Sb = t.dst.constant ? Infinity : t.dst.b * P.largeurA(t.dst, Math.min(A.etats.get(t.dst.id).sL, t.dst.H));
      const k = 1 / Sa + 1 / Sb;
      if (k > 0) dt = Math.min(dt, 0.3 * t.H / (k * t.Q));
    }
    dt = Math.max(dt, duree / pasMax);
    for (const t of tr) {
      let dV = t.Q * dt;
      if (t.src) {
        // Pas plus que le liquide situé au-dessus du piquage.
        const e = A.etats.get(t.src.id), n = P.coucheA(e, t.port.z);
        if (!n) continue;
        if (!t.src.constant) {
          const dispo = P.volumeSous(t.src, n.s1, e.obs) - P.volumeSous(t.src, t.port.z - t.src.z, e.obs);
          dV = Math.min(dV, Math.max(0, dispo));
        }
        P.retirerFluide(t.src, A.ctx, t.fluide, dV);
      }
      if (t.dst) P.ajouterFluide(scene, t.dst, A.ctx, t.fluide, dV);
      else scene._perdu = (scene._perdu || 0) + dV;
    }
    reste -= dt;
    scene._t += dt;
  }
  if (!actif) {
    // Rien ne coule : le temps avance quand même (chronomètre).
    scene._t += Math.max(0, reste);
  }
  return actif;
}
export function avancer(scene, dt) {
  const mode = scene.env.ecoulement || 'illustratif';
  if (mode === 'illustratif') return P.avancer(scene, dt);
  const d = dt * (fini(scene.env.vitesse) ? scene.env.vitesse : 1), g = P.contexte(scene).g;
  let actif = integrer(scene, d);
  // canaux à surface libre (chapitre 8) : Saint-Venant sur la même durée ;
  // une maquette au 1/N vit en temps réduit (t_m = t_p/√N) pour rester homologue
  maquettes(scene);
  for (const c of scene.elements) if (c.type === 'canal') actif = avancerCanal(c, c.modeleDe ? d / Math.sqrt(c.echelle) : d, g) || actif;
  // billes en chute libre (viscosimètre, chapitre 7) : temps réel
  for (const b of scene.elements) if (b.type === 'bille') actif = avancerBille(b, scene, d) || actif;
  return actif;
}
export function equilibrer(scene) {
  if ((scene.env.ecoulement || 'illustratif') === 'illustratif') return P.equilibrer(scene);
  return { converge: true };
}
