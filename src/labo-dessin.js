// Laboratoire virtuel : rendu SVG de la scène. Fonctions pures qui renvoient du
// balisage ; les coordonnées du monde (m) sont converties en pixels ici, si bien
// que traits et textes gardent la même taille à tous les zooms.
import * as P from './labo-physique.js';
import { chargeEn, segmentObstacle } from './labo-ecoulement.js';

export const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const n1 = v => (Math.round(v * 10) / 10).toString();
const clampPx = (v, a, b) => Math.max(a, Math.min(b, v));

export function vueDe(v) {
  return { ...v, X: x => v.ox + x * v.k, Y: z => v.oy - z * v.k, x: X => (X - v.ox) / v.k, z: Y => (v.oy - Y) / v.k };
}
const pt = (V, p) => `${n1(V.X(p.x))},${n1(V.Y(p.z))}`;
const chemin = (V, pts) => pts.map((p, i) => (i ? 'L' : 'M') + pt(V, p)).join('');
const texte = (x, y, s, cls = '', ancre = 'start') => `<text x="${n1(x)}" y="${n1(y)}" class="lb-t ${cls}" text-anchor="${ancre}">${s}</text>`;
function fleche(x1, y1, x2, y2, cls = '', tete = 8) {
  const a = Math.atan2(y2 - y1, x2 - x1), c = Math.cos(a), s = Math.sin(a);
  const bx = x2 - c * tete, by = y2 - s * tete;
  return `<line x1="${n1(x1)}" y1="${n1(y1)}" x2="${n1(bx)}" y2="${n1(by)}" class="lb-fl ${cls}"/>` +
    `<polygon points="${n1(x2)},${n1(y2)} ${n1(bx - s * tete * 0.45)},${n1(by + c * tete * 0.45)} ${n1(bx + s * tete * 0.45)},${n1(by - c * tete * 0.45)}" class="lb-fl-t ${cls}"/>`;
}
const couleur = (ctx, f) => (f ? (ctx.fl(f) || P.FLUIDES.eau).couleur : '#F4F7F8');
const nomFluide = (ctx, f) => (f ? ctx.fl(f).nom : 'air');
export function fmtP(p, env) {
  const ref = env.reference === 'absolue';
  return P.pression(ref ? p + env.patm : p, env.unite) + (ref ? ' abs' : '');
}

// Portion du tracé d'une conduite entre deux paramètres.
function sousTrace(tr, t0, t1) {
  const a = P.pointSurTrace(tr, t0), b = P.pointSurTrace(tr, t1), pts = [a];
  for (let i = 1; i < tr.pts.length - 1; i++) {
    const t = tr.cum[i] / tr.L;
    if (t > t0 && t < t1) pts.push(tr.pts[i]);
  }
  pts.push(b);
  return pts;
}

// ---------- fond : quadrillage et cotes ----------
function fond(V, W, H, env) {
  const x0 = V.x(0), x1 = V.x(W), z1 = V.z(0), z0 = V.z(H);
  const pas = V.k >= 70 ? 0.25 : V.k >= 30 ? 0.5 : 1;
  const maj = V.k >= 30 ? 1 : 5;
  let s = '';
  for (let x = Math.ceil(x0 / pas) * pas; x <= x1; x += pas) {
    const m = Math.abs(x / maj - Math.round(x / maj)) < 1e-6;
    s += `<line x1="${n1(V.X(x))}" y1="0" x2="${n1(V.X(x))}" y2="${H}" class="${m ? 'lb-g2' : 'lb-g1'}"/>`;
  }
  for (let z = Math.ceil(z0 / pas) * pas; z <= z1; z += pas) {
    const m = Math.abs(z / maj - Math.round(z / maj)) < 1e-6;
    s += `<line x1="0" y1="${n1(V.Y(z))}" x2="${W}" y2="${n1(V.Y(z))}" class="${Math.abs(z) < 1e-9 ? 'lb-g0' : m ? 'lb-g2' : 'lb-g1'}"/>`;
    if (m && env.vues.cotes) s += texte(6, V.Y(z) - 3, `${P.nombre(z, 0)} m`, 'lb-axe');
  }
  return s;
}

// ---------- réservoirs ----------
function contour(r) {
  const c = P.cotan(r);
  return [{ x: r.x, z: r.z + r.H }, { x: r.x, z: r.z }, { x: r.x + r.w, z: r.z }, { x: r.x + r.w + r.H * c, z: r.z + r.H }];
}
function bande(r, s0, s1) {
  const c = P.cotan(r);
  return [{ x: r.x, z: r.z + s0 }, { x: r.x + r.w + s0 * c, z: r.z + s0 }, { x: r.x + r.w + s1 * c, z: r.z + s1 }, { x: r.x, z: r.z + s1 }];
}
function reservoir(V, r, e, A, env, ui, defs) {
  const ctx = A.ctx, sel = ui.selection === r.id;
  let s = `<g data-h="res:${r.id}" class="lb-res${sel ? ' sel' : ''}">`;
  s += `<path d="${chemin(V, contour(r))}Z" class="lb-zone"/>`;
  const pRef = ui.pRef, sol = r.aspect === 'sol';
  // Terrain : sol sec au-dessus de la nappe, sol saturé en dessous.
  if (sol) s += `<path d="${chemin(V, contour(r))}Z" class="lb-sol-sec"/><path d="${chemin(V, contour(r))}Z" fill="url(#lb-grains)" class="lb-liq"/>`;
  // liquides
  e.niveaux.forEach((n, i) => {
    const poly = chemin(V, bande(r, n.s0, n.s1)) + 'Z';
    s += `<path d="${poly}" fill="${couleur(ctx, n.fluide)}" class="lb-liq${sol ? ' lb-liq-sol' : ''}"/>`;
    if (sol) s += `<path d="${poly}" fill="url(#lb-grains)" class="lb-liq"/>`;
    if (env.vues.champ && pRef > 0) {
      const id = `gp-${r.id}-${i}`;
      const o1 = Math.max(0, Math.min(1, n.pHaut / pRef)) * 0.5, o0 = Math.max(0, Math.min(1, n.pBas / pRef)) * 0.5;
      defs.push(`<linearGradient id="${id}" x1="0" y1="${n1(V.Y(n.z1))}" x2="0" y2="${n1(V.Y(n.z0))}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#0B2A3C" stop-opacity="${o1.toFixed(3)}"/><stop offset="1" stop-color="#0B2A3C" stop-opacity="${o0.toFixed(3)}"/></linearGradient>`);
      s += `<path d="${poly}" fill="url(#${id})" class="lb-champp"/>`;
    }
  });
  // ciel gazeux
  if (r.ferme && e.sL < r.H - 1e-6) {
    s += `<path d="${chemin(V, bande(r, e.sL, r.H))}Z" class="lb-gaz"/>`;
    const y = V.Y(r.z + r.H) + 28;
    if (V.Y(e.zL) - y > 4) s += texte(V.X(r.x) + 6, y, `p₀ = ${fmtP(e.pCiel, env)}`, 'lb-petit lb-gazt');
  }
  // isobares
  if (env.vues.isobares && e.niveaux.length) {
    const pmax = e.pFond, pmin = e.pCiel, pasP = pasIsobare(Math.max(Math.abs(pmax - pmin), 1));
    for (let p = Math.ceil(pmin / pasP) * pasP; p < pmax; p += pasP) {
      const z = zDePression(e, p, ctx);
      if (z == null || z >= e.zL - 1e-6) continue;
      const sz = z - r.z, xa = r.x, xb = r.x + P.largeurA(r, sz);
      s += `<line x1="${n1(V.X(xa))}" y1="${n1(V.Y(z))}" x2="${n1(V.X(xb))}" y2="${n1(V.Y(z))}" class="lb-iso"/>`;
      s += texte(V.X(xb) - 4, V.Y(z) - 2, P.pression(p, env.unite), 'lb-petit lb-isot', 'end');
    }
  }
  // interfaces et surface libre
  e.niveaux.forEach((n, i) => {
    const sz = n.s1, xa = V.X(r.x), xb = V.X(r.x + P.largeurA(r, sz)), y = V.Y(n.z1);
    const top = i === e.niveaux.length - 1;
    s += `<line x1="${n1(xa)}" y1="${n1(y)}" x2="${n1(xb)}" y2="${n1(y)}" class="${top ? 'lb-surf' : 'lb-interf'}"/>`;
    if (top) {
      const xs = xa + (xb - xa) * 0.72;
      s += `<path d="M${n1(xs - 6)},${n1(y - 10)}L${n1(xs + 6)},${n1(y - 10)}L${n1(xs)},${n1(y)}Z" class="lb-nivsym"/>` +
        `<line x1="${n1(xs - 5)}" y1="${n1(y + 3)}" x2="${n1(xs + 5)}" y2="${n1(y + 3)}" class="lb-nivsym2"/><line x1="${n1(xs - 3)}" y1="${n1(y + 6)}" x2="${n1(xs + 3)}" y2="${n1(y + 6)}" class="lb-nivsym2"/>`;
      if (env.vues.cotes || r.constant) s += texte(xs + 9, y - 3, `${sol ? 'nappe · ' : ''}${P.nombre(n.z1, 2)} m${r.constant ? ' (niveau imposé)' : ''}`, 'lb-petit lb-cote');
    } else if (env.vues.cotes) s += texte(xb - 4, y - 3, `${P.nombre(n.z1, 2)} m`, 'lb-petit lb-cote', 'end');
    // poignée de remplissage
    s += `<line x1="${n1(xa)}" y1="${n1(y)}" x2="${n1(xb)}" y2="${n1(y)}" class="lb-poignee-niv" data-h="surf:${r.id}:${i}"/>`;
    const hpx = (n.z1 - n.z0) * V.k;
    if (hpx > 15) s += texte(xa + 6, (V.Y(n.z0) + y) / 2 + 4, `${sol ? 'terrain saturé' : esc(nomFluide(ctx, n.fluide).toLowerCase())} · ${P.nombre(n.z1 - n.z0, 2)} m`, 'lb-petit lb-couchet');
  });
  // plans de charge (surface libre fictive)
  if (env.vues.charge) {
    for (const n of e.niveaux) {
      if (Math.abs(n.charge - e.zL) < 2e-3 && n === e.niveaux[e.niveaux.length - 1]) continue;
      const y = V.Y(n.charge), xa = V.X(r.x) - 10, xb = V.X(r.x + P.largeurA(r, Math.min(r.H, Math.max(0, n.charge - r.z)))) + 10;
      s += `<line x1="${n1(xa)}" y1="${n1(y)}" x2="${n1(xb)}" y2="${n1(y)}" class="lb-charge"/>`;
      const lib = `plan de charge ${esc(nomFluide(ctx, n.fluide).toLowerCase())} · ${P.nombre(n.charge, 2)} m`;
      // à gauche du réservoir, sauf s'il touche le bord de la vue
      s += xa - 4 - lib.length * 6.4 > 34 ? texte(xa - 4, y + 3, lib, 'lb-petit lb-charget', 'end') : texte(xb + 4, y + 3, lib, 'lb-petit lb-charget');
    }
  }
  // parois
  const cont = contour(r);
  if (sol) {
    // Limites de la zone de terrain représentée et surface du sol.
    s += `<path d="${chemin(V, cont)}" class="lb-paroi-sol"/>`;
    const y = V.Y(r.z + r.H), x0 = V.X(r.x), x1 = V.X(r.x + P.largeurA(r, r.H));
    s += `<line x1="${n1(x0)}" y1="${n1(y)}" x2="${n1(x1)}" y2="${n1(y)}" class="lb-terrain"/>`;
    for (let x = x0 + 4; x < x1; x += 12) s += `<line x1="${n1(x)}" y1="${n1(y)}" x2="${n1(x - 6)}" y2="${n1(y - 6)}" class="lb-terrain-h"/>`;
  } else {
    s += `<path d="${chemin(V, cont)}${r.ferme ? 'Z' : ''}" class="lb-hach"/>`;
    s += `<path d="${chemin(V, cont)}${r.ferme ? 'Z' : ''}" class="lb-paroi"/>`;
  }
  const titre = `${r.id}${r.nom ? ' · ' + esc(r.nom) : ''}`;
  s += texte(V.X(r.x) + 6, V.Y(r.z + r.H) + 14, titre, 'lb-nom');
  if (r.rouleaux) {
    // réservoir posé sur rouleaux (ex. 5.5) : il est libre de reculer
    const y = V.Y(r.z), rr = clampPx(0.09 * V.k, 4, 9), Lp = P.largeurA(r, 0);
    for (const u of [0.15, 0.5, 0.85]) s += `<circle cx="${n1(V.X(r.x + u * Lp))}" cy="${n1(y + rr + 2)}" r="${n1(rr)}" class="lb-rouleau"/>`;
    s += `<line x1="${n1(V.X(r.x) - 10)}" y1="${n1(y + 2 * rr + 2)}" x2="${n1(V.X(r.x + Lp) + 10)}" y2="${n1(y + 2 * rr + 2)}" class="lb-sol-ligne"/>`;
  }
  if (sel) {
    const hx = V.X(r.x + P.largeurA(r, r.H)), hy = V.Y(r.z + r.H);
    s += `<rect x="${n1(hx - 6)}" y="${n1(hy - 6)}" width="12" height="12" class="lb-taille" data-h="taille:${r.id}"/>`;
  }
  s += '</g>';
  return s;
}
function pasIsobare(dp) {
  const brut = dp / 5, p10 = Math.pow(10, Math.floor(Math.log10(brut)));
  for (const k of [1, 2, 2.5, 5, 10]) if (brut <= k * p10) return k * p10;
  return 10 * p10;
}
function zDePression(e, p, ctx) {
  for (const n of e.niveaux) if (p >= n.pHaut - 1e-9 && p <= n.pBas + 1e-9) return n.z1 - (p - n.pHaut) / (n.rho * ctx.g);
  return null;
}

// ---------- diagramme des pressions sur une paroi ou une vanne ----------
function diagramme(V, res, env, opts = {}) {
  const { R, profil } = res;
  const pmax = Math.max(...profil.map(q => Math.abs(q.p)), 1);
  const echelle = (opts.largeur || 110) / pmax; // px par Pa
  const pW = u => ({ X: V.X(R.ox + (res.s + u) * R.dx), Y: V.Y(R.oz + (res.s + u) * R.dz) });
  // vers l'intérieur du liquide : −n (écran : y inversé)
  const ix = -R.nx, iy = R.nz;
  let poly = '', s = '';
  profil.forEach((q, i) => { const w = pW(q.u); poly += (i ? 'L' : 'M') + `${n1(w.X + ix * q.p * echelle)},${n1(w.Y + iy * q.p * echelle)}`; });
  for (let i = profil.length - 1; i >= 0; i--) { const w = pW(profil[i].u); poly += `L${n1(w.X)},${n1(w.Y)}`; }
  s += `<path d="${poly}Z" class="lb-diag"/>`;
  const nf = 9;
  for (let i = 0; i < nf; i++) {
    const q = profil[Math.round((i + 0.5) / nf * (profil.length - 1))];
    if (Math.abs(q.p) * echelle < 7) continue;
    const w = pW(q.u);
    s += q.p > 0 ? fleche(w.X + ix * q.p * echelle, w.Y + iy * q.p * echelle, w.X, w.Y, 'lb-dfl', 6)
      : fleche(w.X, w.Y, w.X + ix * q.p * echelle, w.Y + iy * q.p * echelle, 'lb-dfl', 6);
  }
  const haut = profil[profil.length - 1], bas = profil[0];
  if (opts.etiquettes !== false) {
    for (const q of [bas, haut]) {
      if (Math.abs(q.p) < 1) continue;
      const w = pW(q.u);
      s += texte(w.X + ix * q.p * echelle + ix * 4, w.Y + iy * q.p * echelle + 4, fmtP(q.p, env), 'lb-petit lb-diagt', ix > 0 ? 'start' : ix < 0 ? 'end' : 'middle');
    }
  }
  return s;
}
function resultante(V, res, env, etiquette) {
  const { R, F, C, G } = res;
  if (!(Math.abs(F) > 1e-3)) return '';
  const cx = V.X(C.x), cy = V.Y(C.z), L = 54, sg = Math.sign(F);
  // la flèche part de la paroi vers l'extérieur (force exercée par le liquide)
  let s = fleche(cx, cy, cx + R.nx * L * sg, cy - R.nz * L * sg, 'lb-res-fl', 11);
  s += `<circle cx="${n1(V.X(G.x))}" cy="${n1(V.Y(G.z))}" r="5" class="lb-ptG"/><line x1="${n1(V.X(G.x) - 5)}" y1="${n1(V.Y(G.z))}" x2="${n1(V.X(G.x) + 5)}" y2="${n1(V.Y(G.z))}" class="lb-ptGx"/><line x1="${n1(V.X(G.x))}" y1="${n1(V.Y(G.z) - 5)}" x2="${n1(V.X(G.x))}" y2="${n1(V.Y(G.z) + 5)}" class="lb-ptGx"/>`;
  s += `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="4" class="lb-ptC"/>`;
  const tx = cx + R.nx * (L + 6) * sg, ty = cy - R.nz * (L + 6) * sg;
  const ancre = R.nx * sg > 0.3 ? 'start' : R.nx * sg < -0.3 ? 'end' : 'middle';
  s += texte(tx, ty + (R.nz ? (R.nz * sg < 0 ? 14 : -4) : -4), `${etiquette}F = ${P.nombre(F / 1000, 2)} kN`, 'lb-forcet', ancre);
  s += texte(V.X(G.x) + (R.nx > 0 ? -9 : 9), V.Y(G.z) - 5, 'G', 'lb-petit lb-ptt', R.nx > 0 ? 'end' : 'start');
  s += texte(cx + (R.nx > 0 ? -9 : 9), cy + 12, 'C', 'lb-petit lb-ptt lb-ptCt', R.nx > 0 ? 'end' : 'start');
  return s;
}

// ---------- conduites et vannes ----------
function conduite(V, c, ec, A, env, ui) {
  const ctx = A.ctx, sel = ui.selection === c.id;
  let s = `<g data-h="cond:${c.id}" class="lb-cond${sel ? ' sel' : ''}">`;
  const d = chemin(V, ec.tr.pts);
  // Le trait suit le diamètre réel (lisible entre 6 et 30 px).
  const ext = clampPx((c.D || 0.1) * V.k + 3, 6, 30), int = Math.max(2.5, ext - 3.5);
  s += `<path d="${d}" class="lb-tuyau-ext" style="stroke-width:${n1(ext)}"/>`;
  for (const t of ec.troncons) {
    const pts = sousTrace(ec.tr, t.t0, t.t1);
    s += `<path d="${chemin(V, pts)}" class="lb-tuyau-int${t.isole ? ' isole' : ''}" stroke="${couleur(ctx, t.fluide)}" style="stroke-width:${n1(int)}"/>`;
  }
  const flux = A.ecoulement && A.ecoulement.parConduite.get(c.id);
  if (Math.abs(ec.q) > 1e-7) {
    const v = flux ? clampPx(flux.d.V * V.k, 12, 420) : Math.min(80, 18 + Math.abs(ec.q) * 4000);
    s += `<path d="${d}" class="lb-flux" style="stroke-dashoffset:${n1(-ec.sens * ui.temps * v)}"/>`;
  }
  if (flux) {
    // étiquette au milieu du plus long tronçon droit
    let best = 1, lg = 0;
    for (let i = 1; i < ec.tr.pts.length; i++) { const l = ec.tr.cum[i] - ec.tr.cum[i - 1]; if (l > lg) { lg = l; best = i; } }
    const a = ec.tr.pts[best - 1], b = ec.tr.pts[best], horiz = Math.abs(b.z - a.z) < 1e-9;
    const mx = V.X((a.x + b.x) / 2), my = V.Y((a.z + b.z) / 2);
    // sur un tronçon court, l'étiquette se réduit à V, puis disparaît
    const pix = lg * V.k, vit = `V = ${P.nombre(flux.d.V, 2)} m/s`;
    const lab = !horiz || pix >= 185 ? `Q = ${P.nombre(flux.sol.Q * 1000, 1)} L/s · ${vit}` : pix >= 80 ? vit : null;
    if (lab) s += texte(horiz ? mx : mx + ext / 2 + 5, horiz ? my - ext / 2 - 5 : my, lab, 'lb-petit lb-debit', horiz ? 'middle' : 'start');
  }
  s += `<path d="${d}" class="lb-tuyau-hit"/>`;
  // palier horizontal déplaçable
  if (sel) {
    const i = ec.tr.pts.findIndex((p, k) => k > 0 && Math.abs(p.z - ec.tr.zr) < 1e-9 && Math.abs(ec.tr.pts[k - 1].z - ec.tr.zr) < 1e-9);
    if (i > 0) {
      const a = ec.tr.pts[i - 1], b = ec.tr.pts[i], mx = V.X((a.x + b.x) / 2), my = V.Y(ec.tr.zr);
      s += `<rect x="${n1(mx - 9)}" y="${n1(my - 5)}" width="18" height="10" rx="2" class="lb-poignee" data-h="palier:${c.id}"/>`;
    }
  }
  const m = P.pointSurTrace(ec.tr, 0.2);
  s += texte(V.X(m.x) + 6, V.Y(m.z) + 16, c.id, 'lb-petit lb-idc');
  s += '</g>';
  return s;
}
function vanne(V, v, ec, A, env, ui) {
  const p = P.pointSurTrace(ec.tr, v.t), a = ec.tr.pts[p.i - 1], b = ec.tr.pts[p.i];
  const ang = Math.atan2(-(b.z - a.z), b.x - a.x) * 180 / Math.PI;
  const x = V.X(p.x), y = V.Y(p.z), sel = ui.selection === v.id;
  const ouv = ui.aff.vanne(v);
  let s = `<g data-h="van:${v.id}" class="lb-vanne${v.ouverte ? '' : ' fermee'}${sel ? ' sel' : ''}" transform="translate(${n1(x)},${n1(y)}) rotate(${n1(ang)})">`;
  s += `<circle r="16" class="lb-vanne-hit"/>`;
  s += `<path d="M-11,-7L11,7L11,-7L-11,7Z" class="lb-vanne-corps"/>`;
  s += `<g transform="rotate(${n1(90 * (1 - ouv))})"><line x1="0" y1="0" x2="0" y2="-15" class="lb-vanne-tige"/><line x1="-7" y1="-15" x2="7" y2="-15" class="lb-vanne-volant"/></g>`;
  s += '</g>';
  const dlt = ec.deltas.find(k => k.id === v.id);
  s += texte(x, y + 24, `${v.id}${v.ouverte ? ' ouverte' : ' fermée'}`, 'lb-petit lb-vannet', 'middle');
  if (!v.ouverte && dlt && dlt.dp != null && Number.isFinite(dlt.dp)) s += texte(x, y + 36, `Δp = ${P.pression(dlt.dp, env.unite)}`, 'lb-petit lb-vannedp', 'middle');
  return s;
}

// ---------- appareils de mesure ----------
function raccord(V, tap, geo, couleurLiq) {
  const pts = [{ x: tap.x, z: tap.z }];
  if (geo.coude) pts.push(geo.coude);
  pts.push({ x: geo.x, z: geo.zB });
  return `<path d="${chemin(V, pts)}" class="lb-racc-ext"/><path d="${chemin(V, pts)}" class="lb-racc-int" stroke="${couleurLiq}"/>`;
}
function piezometre(V, u, m, A, env, ui) {
  if (!m || m.erreur) return '';
  const ctx = A.ctx, t = m.tap, geo = m.geo, sel = ui.selection === u.id;
  const xT = V.X(geo.x), yB = V.Y(geo.zB), yH = V.Y(geo.zB + u.Ht), w = 7;
  let s = `<g data-h="inst:${u.id}" class="lb-inst${sel ? ' sel' : ''}">`;
  s += raccord(V, t, geo, couleur(ctx, t.fluide));
  s += `<rect x="${n1(xT - w / 2)}" y="${n1(yH)}" width="${w}" height="${n1(yB - yH)}" class="lb-verre"/>`;
  if (!m.vide && !m.depression) {
    const zN = Math.min(ui.aff.val(u.id, m.zN), geo.zB + u.Ht);
    if (zN > geo.zB) {
      const yN = V.Y(zN);
      s += `<rect x="${n1(xT - w / 2 + 1.5)}" y="${n1(yN)}" width="${w - 3}" height="${n1(yB - yN)}" fill="${couleur(ctx, m.fluide)}" class="lb-colonne"/>`;
      const conc = ctx.fl(m.fluide).theta < 90;
      s += `<path d="M${n1(xT - w / 2 + 1.5)},${n1(yN)}Q${n1(xT)},${n1(yN + (conc ? 4 : -4))} ${n1(xT + w / 2 - 1.5)},${n1(yN)}" class="lb-menisque"/>`;
      if (m.deborde) s += `<path d="M${n1(xT + w / 2)},${n1(yH)}q6,4 5,22" class="lb-debord" stroke="${couleur(ctx, m.fluide)}"/>`;
      else {
        s += `<line x1="${n1(xT - 9)}" y1="${n1(yN)}" x2="${n1(xT + 9)}" y2="${n1(yN)}" class="lb-repere"/>`;
        s += texte(xT + 10, yN + 4, `${P.nombre(m.zN, 3)}`, 'lb-petit lb-lect');
      }
    }
  }
  s += `<rect x="${n1(xT - 9)}" y="${n1(yH - 4)}" width="18" height="${n1(yB - yH + 8)}" class="lb-hit"/>`;
  s += texte(xT, yH - 6, u.id, 'lb-petit lb-idi', 'middle');
  s += '</g>';
  return s;
}
function manometre(V, u, m, A, env, ui) {
  if (!m || m.erreur) return '';
  const ctx = A.ctx, t = m.tap, geo = m.geo, sel = ui.selection === u.id;
  const ex = V.X(geo.x), ey = V.Y(geo.zB);
  const dessous = t.sz < 0;
  const cx = ex, cy = dessous ? ey + 22 : ey - 22, r = 16;
  let s = `<g data-h="inst:${u.id}" class="lb-inst${sel ? ' sel' : ''}">`;
  s += raccord(V, t, geo, couleur(ctx, t.fluide));
  s += `<line x1="${n1(ex)}" y1="${n1(ey)}" x2="${n1(cx)}" y2="${n1(cy + (dessous ? -r : r))}" class="lb-tige"/>`;
  s += `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${r}" class="lb-cadran"/>`;
  const FS = m.pleineEchelle, v = ui.aff.val(u.id, Number.isFinite(m.lu) ? m.lu : 0);
  const compose = u.mode !== 'absolu' && (m.lu < 0);
  const angle = val => (compose ? 135 * val / FS : -135 + 270 * val / FS) * Math.PI / 180;
  for (let i = 0; i <= 10; i++) {
    const a = (-135 + 27 * i) * Math.PI / 180, c = Math.sin(a), d = -Math.cos(a);
    s += `<line x1="${n1(cx + c * (r - 4))}" y1="${n1(cy + d * (r - 4))}" x2="${n1(cx + c * (r - (i % 5 ? 2 : 0.5)))}" y2="${n1(cy + d * (r - (i % 5 ? 2 : 0.5)))}" class="lb-grad"/>`;
  }
  const a = Math.max(-2.5, Math.min(2.5, angle(v)));
  s += `<line x1="${n1(cx)}" y1="${n1(cy)}" x2="${n1(cx + Math.sin(a) * (r - 3))}" y2="${n1(cy - Math.cos(a) * (r - 3))}" class="lb-aiguille"/><circle cx="${n1(cx)}" cy="${n1(cy)}" r="2" class="lb-axeaig"/>`;
  const lbl = Number.isFinite(m.lu) ? P.pression(m.lu, env.unite) + (u.mode === 'absolu' ? ' abs' : '') : '—';
  s += texte(cx, dessous ? cy + r + 12 : cy - r - 5, `${u.id} · ${lbl}`, 'lb-petit lb-lect', 'middle');
  s += `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${r + 4}" class="lb-hit"/>`;
  s += '</g>';
  return s;
}
function tubeU(V, u, m, A, env, ui) {
  if (!m || m.erreur) return '';
  const ctx = A.ctx, geo = m.geo, sel = ui.selection === u.id;
  const inv = !!m.inverse, e = geo.e;
  const xA = geo.cotA === 'g' ? geo.xg : geo.xd, xB = geo.cotA === 'g' ? geo.xd : geo.xg;
  const yHaut = V.Y(geo.zHaut), yBas = V.Y(geo.zBas), rpx = e / 2 * V.k;
  const valid = !m.invalide && Number.isFinite(m.x);
  const dx = valid ? ui.aff.val(u.id, m.x) : 0;
  const lim = geo.L / 2 - 0.005;
  const zA = geo.z0 - Math.max(-lim, Math.min(lim, dx)), zB = geo.z0 + Math.max(-lim, Math.min(lim, dx));
  let s = `<g data-h="inst:${u.id}" class="lb-inst${sel ? ' sel' : ''}">`;
  // lignes de raccordement
  const zc = inv ? geo.zBas - 0.15 : geo.zHaut + 0.15;
  const ligne = (tap, xLeg) => {
    const a1 = tap.sx ? { x: tap.x + tap.sx * 0.2, z: tap.z } : { x: tap.x, z: tap.z + tap.sz * 0.2 };
    return [{ x: tap.x, z: tap.z }, a1, { x: a1.x, z: zc }, { x: xLeg, z: zc }, { x: xLeg, z: inv ? geo.zBas : geo.zHaut }];
  };
  const la = ligne(m.tap, xA);
  s += `<path d="${chemin(V, la)}" class="lb-racc-ext"/><path d="${chemin(V, la)}" class="lb-racc-int" stroke="${couleur(ctx, m.tap.fluide)}"/>`;
  if (m.tap2) {
    const lb = ligne(m.tap2, xB);
    s += `<path d="${chemin(V, lb)}" class="lb-racc-ext"/><path d="${chemin(V, lb)}" class="lb-racc-int" stroke="${couleur(ctx, m.tap2.fluide)}"/>`;
  }
  // corps du tube
  const XA = V.X(xA), XB = V.X(xB), sw = XB > XA ? 0 : 1;
  const corps = inv
    ? `M${n1(XA)},${n1(yBas)}L${n1(XA)},${n1(yHaut + rpx)}A${n1(rpx)},${n1(rpx)} 0 0 ${1 - sw} ${n1(XB)},${n1(yHaut + rpx)}L${n1(XB)},${n1(yBas)}`
    : `M${n1(XA)},${n1(yHaut)}L${n1(XA)},${n1(yBas - rpx)}A${n1(rpx)},${n1(rpx)} 0 0 ${sw} ${n1(XB)},${n1(yBas - rpx)}L${n1(XB)},${n1(yHaut)}`;
  s += `<path d="${corps}" class="lb-u-ext"/><path d="${corps}" class="lb-u-verre"/>`;
  // fluides dans les branches
  const fa = couleur(ctx, m.tap.fluide), fb = m.tap2 ? couleur(ctx, m.tap2.fluide) : '#F4F7F8';
  const fm = couleur(ctx, u.fluideM);
  if (inv) {
    s += `<path d="M${n1(XA)},${n1(yBas)}L${n1(XA)},${n1(V.Y(zA))}" class="lb-u-liq" stroke="${fa}"/>`;
    s += `<path d="M${n1(XB)},${n1(yBas)}L${n1(XB)},${n1(V.Y(zB))}" class="lb-u-liq" stroke="${fb}"/>`;
    s += `<path d="M${n1(XA)},${n1(V.Y(zA))}L${n1(XA)},${n1(yHaut + rpx)}A${n1(rpx)},${n1(rpx)} 0 0 ${1 - sw} ${n1(XB)},${n1(yHaut + rpx)}L${n1(XB)},${n1(V.Y(zB))}" class="lb-u-liq" stroke="${fm}"/>`;
  } else {
    s += `<path d="M${n1(XA)},${n1(yHaut)}L${n1(XA)},${n1(V.Y(zA))}" class="lb-u-liq" stroke="${fa}"/>`;
    if (m.tap2) s += `<path d="M${n1(XB)},${n1(yHaut)}L${n1(XB)},${n1(V.Y(zB))}" class="lb-u-liq" stroke="${fb}"/>`;
    s += `<path d="M${n1(XA)},${n1(V.Y(zA))}L${n1(XA)},${n1(yBas - rpx)}A${n1(rpx)},${n1(rpx)} 0 0 ${sw} ${n1(XB)},${n1(yBas - rpx)}L${n1(XB)},${n1(V.Y(zB))}" class="lb-u-liq" stroke="${fm}"/>`;
    if (!m.tap2) s += texte(XB, yHaut - 4, 'air', 'lb-petit lb-idi', 'middle');
  }
  // cote Δh
  if (valid) {
    const xd = Math.max(XA, XB) + 12, y1 = V.Y(zA), y2 = V.Y(zB);
    s += `<line x1="${n1(Math.min(XA, XB) - 6)}" y1="${n1(y1)}" x2="${n1(xd + 4)}" y2="${n1(y1)}" class="lb-repere-fin"/><line x1="${n1(Math.min(XA, XB) - 6)}" y1="${n1(y2)}" x2="${n1(xd + 4)}" y2="${n1(y2)}" class="lb-repere-fin"/>`;
    if (Math.abs(y2 - y1) > 6) s += fleche(xd, (y1 + y2) / 2, xd, y1, 'lb-cote-fl', 5) + fleche(xd, (y1 + y2) / 2, xd, y2, 'lb-cote-fl', 5);
    s += texte(xd + 6, (y1 + y2) / 2 + 4, `Δh = ${P.nombre(Math.abs(m.dh) * 1000, 0)} mm`, 'lb-petit lb-lect');
  }
  const xmin = Math.min(XA, XB) - 8, xmax = Math.max(XA, XB) + 8;
  s += `<rect x="${n1(xmin)}" y="${n1(yHaut - 6)}" width="${n1(xmax - xmin)}" height="${n1(yBas - yHaut + 12)}" class="lb-hit" data-h="ubloc:${u.id}"/>`;
  s += texte((XA + XB) / 2, inv ? yHaut - 8 : yBas + 14, `${u.id} · ${esc(nomFluide(ctx, u.fluideM).toLowerCase())}`, 'lb-petit lb-idi', 'middle');
  s += '</g>';
  return s;
}

// ---------- vannes planes ----------
function vannePlane(V, v, res, A, env, ui) {
  if (!res || res.erreur) return '';
  const sel = ui.selection === v.id;
  let s = `<g data-h="vp:${v.id}" class="lb-vp${sel ? ' sel' : ''}">`;
  if (sel) s += diagramme(V, res, env, { largeur: 70 });
  s += `<line x1="${n1(V.X(res.bas.x))}" y1="${n1(V.Y(res.bas.z))}" x2="${n1(V.X(res.haut.x))}" y2="${n1(V.Y(res.haut.z))}" class="lb-vp-trait"/>`;
  if (v.charniere === 'haut' || v.charniere === 'bas') {
    const h = v.charniere === 'haut' ? res.haut : res.bas;
    s += `<circle cx="${n1(V.X(h.x))}" cy="${n1(V.Y(h.z))}" r="5" class="lb-charniere"/>`;
  }
  if (v.charniere === 'glissieres' && res.levage != null) {
    // Effort de levage le long des glissières (verticalement pour une trappe de fond).
    const R = res.R, o = v.paroi === 'f' ? res.G : res.haut, ux = v.paroi === 'f' ? 0 : R.dx, uz = v.paroi === 'f' ? 1 : R.dz;
    const x = V.X(o.x) + (v.paroi === 'f' ? 0 : R.nx * 14), y = V.Y(o.z) - (v.paroi === 'f' ? 0 : R.nz * 14), L = 46;
    s += fleche(x, y, x + ux * L, y - uz * L, 'lb-levage', 9);
    s += texte(x + ux * L + 6, y - uz * L - 2, `T = ${P.nombre(res.levage / 1000, 2)} kN`, 'lb-petit lb-levaget');
  }
  s += resultante(V, res, env, `${v.id} · `);
  s += `<line x1="${n1(V.X(res.bas.x))}" y1="${n1(V.Y(res.bas.z))}" x2="${n1(V.X(res.haut.x))}" y2="${n1(V.Y(res.haut.z))}" class="lb-vp-hit"/>`;
  s += '</g>';
  return s;
}

// ---------- flotteurs ----------
function flotteur(V, f, res, r, e, A, env, ui) {
  if (!res || res.erreur) return '';
  const sel = ui.selection === f.id;
  const dens = f.m / (f.l * f.h * f.b);
  // Caisson creux : acier (paroi mince) ou béton ; corps plein : teinte selon la densité.
  const teinte = f.creux ? (f.e < 0.1 ? '#8E9BA5' : '#B9B6AC') : dens < 950 ? '#C9A46C' : dens > 1500 ? '#A9ADA8' : '#B7B39A';
  const lest = res.lest, ep = f.creux ? Math.max(lest.e, 2 / V.k) : 0;
  const xc = r.x + f.x;
  let s = `<g data-h="flot:${f.id}" class="lb-flot${sel ? ' sel' : ''}">`;
  let pG, pC, pM = null, poly, interieur = null, ballast = null, cloisons = [];
  if (res.gite && !ui.saisi?.has(f.id)) {
    const g = res.gite, oz = e.zL - g.zw;
    const W = ([x, z]) => ({ x: xc + x, z: oz + z });
    poly = g.coins.map(W);
    pG = W([g.Gx, g.Gz]); pC = W([g.Cx, g.Cz]);
    if (g.interieur) {
      interieur = g.interieur.map(W);
      ballast = g.ballast ? g.ballast.map(poly => poly.map(W)) : null;
      cloisons = g.cloisons.map(([a, b]) => [W(a), W(b)]);
    }
  } else {
    const zb = ui.aff.flot(f.id, res.zb);
    poly = [{ x: xc - f.l / 2, z: zb }, { x: xc + f.l / 2, z: zb }, { x: xc + f.l / 2, z: zb + f.h }, { x: xc - f.l / 2, z: zb + f.h }];
    const d = zb - res.zb;
    pG = { x: xc, z: res.zG + d }; pC = { x: xc, z: res.zC + d };
    if (res.zM != null && !res.immerge) pM = { x: xc, z: res.zM + d };
    if (f.creux) {
      const li = f.l - 2 * ep, hi = f.h - 2 * ep, zi = zb + ep;
      interieur = [{ x: xc - li / 2, z: zi }, { x: xc + li / 2, z: zi }, { x: xc + li / 2, z: zi + hi }, { x: xc - li / 2, z: zi + hi }];
      if (lest.V > 0) ballast = [[{ x: xc - li / 2, z: zi }, { x: xc + li / 2, z: zi }, { x: xc + li / 2, z: zi + Math.min(lest.h, hi) }, { x: xc - li / 2, z: zi + Math.min(lest.h, hi) }]];
      for (let k = 1; k < lest.n; k++) { const x = xc - li / 2 + k * li / lest.n; cloisons.push([{ x, z: zi }, { x, z: zi + hi }]); }
    }
  }
  s += `<path d="${chemin(V, poly)}Z" fill="${teinte}" class="lb-flotcorps"/>`;
  if (interieur) s += `<path d="${chemin(V, interieur)}Z" class="lb-cavite"/>`;
  for (const b of ballast || []) if (b.length > 2) s += `<path d="${chemin(V, b)}Z" fill="${couleur(A.ctx, f.ballastFluide)}" class="lb-ballast"/>`;
  for (const c of cloisons) s += `<path d="${chemin(V, c)}" class="lb-cloison"/>`;
  // forces : poids en G, poussée en C
  // Poids et poussée décalés de part et d'autre de l'axe pour rester lisibles.
  const Pn = 46, ec = Math.abs(V.X(pG.x) - V.X(pC.x)) < 8 ? 6 : 0;
  s += fleche(V.X(pG.x) - ec, V.Y(pG.z), V.X(pG.x) - ec, V.Y(pG.z) + Pn, 'lb-poids', 8);
  if (res.FA > 0) s += fleche(V.X(pC.x) + ec, V.Y(pC.z), V.X(pC.x) + ec, V.Y(pC.z) - Pn * Math.min(1.6, res.FA / res.P), 'lb-poussee', 8);
  if (res.fond && res.R > 0) s += fleche(V.X(xc), V.Y(poly[0].z) + 30, V.X(xc), V.Y(poly[0].z) + 2, 'lb-poussee', 7) + texte(V.X(xc) + 6, V.Y(poly[0].z) + 26, 'R', 'lb-petit lb-ptt');
  s += `<circle cx="${n1(V.X(pG.x))}" cy="${n1(V.Y(pG.z))}" r="5" class="lb-ptG"/><line x1="${n1(V.X(pG.x) - 5)}" y1="${n1(V.Y(pG.z))}" x2="${n1(V.X(pG.x) + 5)}" y2="${n1(V.Y(pG.z))}" class="lb-ptGx"/><line x1="${n1(V.X(pG.x))}" y1="${n1(V.Y(pG.z) - 5)}" x2="${n1(V.X(pG.x))}" y2="${n1(V.Y(pG.z) + 5)}" class="lb-ptGx"/>`;
  s += `<circle cx="${n1(V.X(pC.x))}" cy="${n1(V.Y(pC.z))}" r="4" class="lb-ptC"/>`;
  s += texte(V.X(pG.x) + 8, V.Y(pG.z) - 4, 'G', 'lb-petit lb-ptt');
  s += texte(V.X(pC.x) - 8, V.Y(pC.z) + 4, 'C', 'lb-petit lb-ptt lb-ptCt', 'end');
  if (pM) {
    const mx = V.X(pM.x), my = V.Y(pM.z);
    s += `<path d="M${n1(mx)},${n1(my - 5)}L${n1(mx + 5)},${n1(my + 4)}L${n1(mx - 5)},${n1(my + 4)}Z" class="lb-ptM"/>`;
    s += texte(mx + 8, my + 4, 'M', 'lb-petit lb-ptt lb-ptMt');
  }
  if (res.gite) {
    const g = res.gite;
    s += texte(V.X(xc), V.Y(Math.max(...poly.map(p => p.z))) - 6, `${g.redresse ? 'couple de redressement' : 'couple de chavirement'} ${P.nombre(Math.abs(g.couple) / 1000, 1)} kN·m`, `lb-petit ${g.redresse ? 'lb-ok' : 'lb-ko'}`, 'middle');
  }
  const haut = Math.max(...poly.map(p => p.z));
  s += texte(V.X(xc), V.Y(haut) - (res.gite ? 18 : 6), `${f.id}${res.fond ? ' (au fond)' : ''}`, 'lb-petit lb-idi', 'middle');
  s += '</g>';
  return s;
}

// ---------- écoulements : lignes de charge, jets, appareils ----------
function lignesDeCharge(V, scene, A) {
  let s = '';
  for (const sol of A.ecoulement.chaines) {
    if (!(sol.Q > 0) || !sol.parTuyau) continue;
    const egl = [], hgl = [];
    for (const it of sol.ordre) {
      if (it.type !== 'conduite') continue;
      const pt = sol.parTuyau.get(it.c.id), ec = A.conduites.get(it.c.id);
      if (!pt || !ec) continue;
      const ts = new Set([0, 1]);
      for (let i = 0; i <= 40; i++) ts.add(i / 40);
      for (let i = 1; i < ec.tr.pts.length - 1; i++) ts.add(ec.tr.cum[i] / ec.tr.L);
      for (const p of pt.points) { ts.add(Math.max(0, p.t - 1e-6)); ts.add(Math.min(1, p.t + 1e-6)); }
      for (const c of pt.cols) for (const k of [-1, -0.5, 0, 0.5, 1]) ts.add(Math.min(1, Math.max(0, c.t + k * c.dt)));
      let liste = [...ts].sort((a, b) => a - b);
      if (pt.t.sens < 0) liste = liste.reverse();
      for (const t of liste) {
        const q = P.pointSurTrace(ec.tr, t), c = chargeEn(pt, t);
        egl.push({ x: q.x, z: c.H }); hgl.push({ x: q.x, z: c.H - c.hv });
      }
      if (pt.hsExit > 0) { const q = P.pointSurTrace(ec.tr, pt.sortieT), c = chargeEn(pt, pt.sortieT); egl.push({ x: q.x, z: c.H - pt.hsExit }); }
    }
    if (egl.length < 2) continue;
    s += `<path d="${chemin(V, egl)}" class="lb-egl"/><path d="${chemin(V, hgl)}" class="lb-hgl"/>`;
    s += texte(V.X(egl[0].x) + 4, V.Y(egl[0].z) - 4, `ligne de charge ${P.nombre(egl[0].z, 2)} m`, 'lb-petit lb-eglt');
    const i = Math.min(hgl.length - 1, Math.floor(hgl.length * 0.55));
    s += texte(V.X(hgl[i].x) + 4, V.Y(hgl[i].z) + 12, 'ligne piézométrique', 'lb-petit lb-hglt');
  }
  return s;
}
function jets(V, scene, A, ui) {
  let s = '';
  const zSol = Number.isFinite(scene.env.zSol) ? scene.env.zSol : 0;
  for (const j of A.ecoulement.jets) {
    if (!j.pts || j.pts.length < 2) continue;
    // nappes déviées : épaisseur tirée du débit et de la vitesse
    const d = !j.nappe && j.d ? j.d : (j.Q > 0 && j.V > 0 ? Math.sqrt(4 * j.Q / (Math.PI * j.V)) : 0.05);
    const w = clampPx(d * V.k, 2.5, 12), path = chemin(V, j.pts);
    s += `<path d="${path}" class="lb-jet" stroke="${couleur(A.ctx, j.fluide)}" style="stroke-width:${n1(w)}"/>`;
    s += `<path d="${path}" class="lb-jet-flux" style="stroke-dashoffset:${n1(-ui.temps * 90)}"/>`;
    const f = j.pts[j.pts.length - 1];
    if (j.portee != null && Math.abs(f.z - zSol) < 1e-6 && Math.abs(j.portee) > 0.05) {
      s += `<path d="M${n1(V.X(f.x) - 9)},${n1(V.Y(f.z))}q4,-7 9,0q5,-7 9,0" class="lb-eclat" stroke="${couleur(A.ctx, j.fluide)}"/>`;
      s += texte(V.X(f.x), V.Y(f.z) + 14, `portée ${P.nombre(Math.abs(j.portee), 2)} m`, 'lb-petit lb-lect', 'middle');
    }
  }
  return s;
}
function sol(V, scene, A, vue) {
  const zSol = Number.isFinite(scene.env.zSol) ? scene.env.zSol : 0, y = V.Y(zSol);
  if (y < 0 || y > vue.H) return '';
  let s = `<line x1="0" y1="${n1(y)}" x2="${vue.W}" y2="${n1(y)}" class="lb-sol-ligne"/>`;
  for (let x = 6; x < vue.W; x += 14) s += `<line x1="${x}" y1="${n1(y)}" x2="${x - 7}" y2="${n1(y + 7)}" class="lb-sol-h"/>`;
  return s + texte(vue.W - 8, y - 4, `sol · z = ${P.nombre(zSol, 2)} m`, 'lb-petit lb-idi', 'end');
}
function appareil(V, el, A, scene, ui) {
  const sel = ui.selection === el.id, x = V.X(el.x), y = V.Y(el.z), E = A.ecoulement;
  let s = `<g data-h="dev:${el.id}" class="lb-dev${sel ? ' sel' : ''}">`;
  if (el.type === 'pompe') {
    const r = clampPx(0.26 * V.k, 11, 20), d = el.sens === -1 ? -1 : 1;
    for (const port of ['asp', 'ref']) { const q = P.portAppareil(el, port); s += `<line x1="${n1(x)}" y1="${n1(y)}" x2="${n1(V.X(q.x))}" y2="${n1(V.Y(q.z))}" class="lb-dev-tube"/>`; }
    const sol = E && E.chaines.find(c => c.Q > 0 && c.pompes && c.pompes.some(p => p.el === el)), info = sol && sol.pompes.find(p => p.el === el);
    s += `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(r)}" class="lb-pompe${el.marche === false ? ' arret' : ''}"/>`;
    const ang = info ? ui.temps * 6 : 0;
    s += `<g transform="translate(${n1(x)},${n1(y)}) rotate(${n1((ang * 57.3) % 360)})"><path d="M${n1(-r * 0.55)},0L${n1(r * 0.55)},0M0,${n1(-r * 0.55)}L0,${n1(r * 0.55)}" class="lb-roue"/></g>`;
    s += `<path d="M${n1(x - d * r * 0.2)},${n1(y - r - 7)}l${n1(d * 10)},4l${n1(-d * 10)},4z" class="lb-pompe-sens"/>`;
    s += texte(x, y + r + 13, `${el.id}${info ? ` · H = ${P.nombre(info.H, 2)} m` : el.marche === false ? ' · arrêt' : ''}`, 'lb-petit lb-idi', 'middle');
    s += `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(r + 6)}" class="lb-hit"/>`;
  } else if (el.type === 'raccord') {
    const pa = P.portAppareil(el, 'a'), pb = P.portAppareil(el, 'b');
    const conduites = scene.elements.filter(c => c.type === 'conduite');
    const D = port => { const c = conduites.find(k => (k.a.el === el.id && k.a.port === port) || (k.b.el === el.id && k.b.port === port)); return c ? c.D : 0.1; };
    const wa = clampPx(D('a') * V.k + 3, 6, 30) / 2, wb = clampPx(D('b') * V.k + 3, 6, 30) / 2;
    const xa = V.X(pa.x), xb = V.X(pb.x);
    s += `<path d="M${n1(xa)},${n1(y - wa)}L${n1(xb)},${n1(y - wb)}L${n1(xb)},${n1(y + wb)}L${n1(xa)},${n1(y + wa)}Z" class="lb-raccord"/>`;
    s += texte(x, y + Math.max(wa, wb) + 13, el.id, 'lb-petit lb-idi', 'middle');
    s += `<rect x="${n1(xa - 4)}" y="${n1(y - Math.max(wa, wb) - 4)}" width="${n1(xb - xa + 8)}" height="${n1(2 * Math.max(wa, wb) + 8)}" class="lb-hit"/>`;
  } else if (el.type === 'exutoire') {
    s += `<circle cx="${n1(x)}" cy="${n1(y)}" r="5" class="lb-exutoire"/>`;
    const so = E && E.sorties.get(el.id);
    s += texte(x + 8, y - 7, `${el.id}${so ? ` · V = ${P.nombre(so.V, 2)} m/s` : ' · sortie libre'}`, 'lb-petit lb-idi');
    s += `<circle cx="${n1(x)}" cy="${n1(y)}" r="12" class="lb-hit"/>`;
  } else if (el.type === 'lance') {
    // lance : buse effilée dont (x, z) est la sortie du jet
    const a = el.angle * Math.PI / 180, dx = Math.cos(a), dz = Math.sin(a), Lb = clampPx(0.45 * V.k, 28, 64);
    const w0 = clampPx(el.d * V.k * 1.9, 9, 24) / 2, w1 = clampPx(el.d * V.k, 4, 16) / 2, ux = dx, uy = -dz, px = -uy, py = ux;
    const bx = x - ux * Lb, by = y - uy * Lb;
    s += `<path d="M${n1(bx + px * w0)},${n1(by + py * w0)}L${n1(x + px * w1)},${n1(y + py * w1)}L${n1(x - px * w1)},${n1(y - py * w1)}L${n1(bx - px * w0)},${n1(by - py * w0)}Z" class="lb-lance${el.ouvert ? '' : ' fermee'}"/>`;
    s += `<line x1="${n1(bx)}" y1="${n1(by)}" x2="${n1(bx - ux * 14)}" y2="${n1(by - uy * 14)}" class="lb-dev-tube"/>`;
    const st = E && E.lances.get(el.id);
    s += texte(bx, by - w0 - 8, `${el.id} · ${el.ouvert ? `V = ${P.nombre(el.V, 2)} m/s${st ? ` · Q = ${P.nombre(st.Q * 1000, 1)} L/s` : ''}` : 'fermée'}`, 'lb-petit lb-idi', 'middle');
    s += `<circle cx="${n1((x + bx) / 2)}" cy="${n1((y + by) / 2)}" r="${n1(Lb / 2 + 4)}" class="lb-hit"/>`;
  } else if (el.type === 'robinet') {
    s += `<path d="M${n1(x - 26)},${n1(y - 8)}L${n1(x)},${n1(y - 8)}Q${n1(x + 6)},${n1(y - 8)} ${n1(x + 6)},${n1(y - 2)}L${n1(x + 6)},${n1(y)}" class="lb-robinet"/>`;
    s += `<path d="M${n1(x - 14)},${n1(y - 8)}L${n1(x - 14)},${n1(y - 16)}M${n1(x - 19)},${n1(y - 16)}L${n1(x - 9)},${n1(y - 16)}" class="lb-robinet-volant"/>`;
    s += texte(x - 28, y - 14, `${el.id} · ${el.ouvert ? P.nombre(el.Q * 1000, 1) + ' L/s' : 'fermé'}`, 'lb-petit lb-idi', 'end');
    s += `<rect x="${n1(x - 30)}" y="${n1(y - 22)}" width="40" height="24" class="lb-hit"/>`;
  }
  return s + '</g>';
}
function orificeDessin(V, o, A, ui) {
  const r = A.idx.get(o.reservoir);
  if (!r) return '';
  const R = P.repereParoi(r, o.paroi), x = V.X(R.ox + o.s * R.dx), y = V.Y(R.oz + o.s * R.dz);
  const st = A.ecoulement && A.ecoulement.orifices.get(o.id), sel = ui.selection === o.id;
  const w = clampPx(o.d * V.k, 4, 14);
  // trou dans la paroi, perpendiculaire à celle-ci
  const tx = R.dx, ty = -R.dz;
  let s = `<g data-h="dev:${o.id}" class="lb-orifice${sel ? ' sel' : ''}${o.ouvert ? '' : ' ferme'}">`;
  s += `<line x1="${n1(x - tx * w / 2)}" y1="${n1(y - ty * w / 2)}" x2="${n1(x + tx * w / 2)}" y2="${n1(y + ty * w / 2)}" class="lb-trou"/>`;
  s += `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(w / 2 + 6)}" class="lb-hit"/>`;
  const lib = `${o.id}${st && st.Q > 0 ? ` · ${P.nombre(st.Q * 1000, 1)} L/s` : o.ouvert ? '' : ' · bouché'}`;
  s += texte(x + R.nx * 10, y - R.nz * 10 - 8, lib, 'lb-petit lb-idi', R.nx < 0 ? 'end' : 'start');
  return s + '</g>';
}
function venturiDessin(V, v, A, ui) {
  const c = A.idx.get(v.conduite), ec = A.conduites.get(v.conduite);
  if (!c || !ec) return '';
  const p = P.pointSurTrace(ec.tr, v.t), a = ec.tr.pts[p.i - 1], b = ec.tr.pts[p.i];
  const ang = Math.atan2(-(b.z - a.z), b.x - a.x) * 180 / Math.PI;
  const x = V.X(p.x), y = V.Y(p.z), L = clampPx(0.7 * V.k, 34, 90);
  const W = clampPx(c.D * V.k + 3, 6, 30) / 2 + 2, w = Math.max(2, W * v.d / c.D);
  const st = A.ecoulement && A.ecoulement.venturis.get(v.id), sel = ui.selection === v.id;
  let s = `<g data-h="vt:${v.id}" class="lb-venturi${sel ? ' sel' : ''}"><g transform="translate(${n1(x)},${n1(y)}) rotate(${n1(ang)})">`;
  s += `<path d="M${n1(-L / 2)},${n1(-W)}L${n1(-L / 6)},${n1(-w)}L${n1(-L / 12)},${n1(-w)}L${n1(L / 2)},${n1(-W)}L${n1(L / 2)},${n1(W)}L${n1(-L / 12)},${n1(w)}L${n1(-L / 6)},${n1(w)}L${n1(-L / 2)},${n1(W)}Z" class="lb-venturi-corps"/>`;
  s += `<rect x="${n1(-L / 2 - 2)}" y="${n1(-W - 4)}" width="${n1(L + 4)}" height="${n1(2 * W + 8)}" class="lb-hit"/>`;
  s += `</g>`;
  if (st && Number.isFinite(st.dh)) s += texte(x, y + W + 26, `Δh = ${P.nombre(Math.abs(st.dh) * 1000, 0)} mm · Q mesuré ${P.nombre(st.Qmes * 1000, 1)} L/s`, 'lb-petit lb-lect', 'middle');
  s += texte(x, y + W + 13, v.id, 'lb-petit lb-idi', 'middle');
  return s + '</g>';
}

// Plaque et auget (chapitre 5).
function obstacleDessin(V, o, A, ui) {
  const seg = segmentObstacle(o), sel = ui.selection === o.id, ob = A.ecoulement && A.ecoulement.obstacles.get(o.id);
  let s = `<g data-h="dev:${o.id}" class="lb-obst${sel ? ' sel' : ''}">`;
  const a = { X: V.X(seg.a.x), Y: V.Y(seg.a.z) }, b = { X: V.X(seg.b.x), Y: V.Y(seg.b.z) };
  if (o.type === 'plaque') {
    s += `<line x1="${n1(a.X)}" y1="${n1(a.Y)}" x2="${n1(b.X)}" y2="${n1(b.Y)}" class="lb-plaque"/>`;
    s += `<line x1="${n1(a.X)}" y1="${n1(a.Y)}" x2="${n1(b.X)}" y2="${n1(b.Y)}" class="lb-hit-trait"/>`;
  } else {
    // demi-cercle ouvert vers f : p(φ) = c − r cos φ · t − r sin φ · f
    const r = o.w / 2, pts = [];
    for (let k = 0; k <= 16; k++) { const ph = Math.PI * k / 16; pts.push({ x: o.x - r * Math.cos(ph) * seg.t.x - r * Math.sin(ph) * seg.f.x, z: o.z - r * Math.cos(ph) * seg.t.z - r * Math.sin(ph) * seg.f.z }); }
    const d = pts.map((q, i) => `${i ? 'L' : 'M'}${n1(V.X(q.x))},${n1(V.Y(q.z))}`).join('');
    s += `<path d="${d}" class="lb-auget"/><path d="${d}" class="lb-hit-trait"/>`;
    if (o.u > 0) {
      // sens de déplacement de l'auget, dessiné sous lui
      const cx = V.X(o.x), cy = V.Y(o.z) + r * V.k + 22;
      s += fleche(cx - seg.f.x * 13, cy + seg.f.z * 13, cx - seg.f.x * 39, cy + seg.f.z * 39, 'lb-mvt', 7);
      s += texte(cx, cy + 18, `auget à u = ${P.nombre(o.u, 1)} m/s`, 'lb-petit lb-mvtt', 'middle');
    }
  }
  const haut = Math.min(a.Y, b.Y);
  s += texte((a.X + b.X) / 2, haut - 8, `${o.id}${ob ? ` · ${forceTexte(Math.hypot(ob.F.x, ob.F.z))}` : ''}`, 'lb-petit lb-idi', 'middle');
  return s + '</g>';
}
const forceTexte = F => (Math.abs(F) >= 1000 ? `${P.nombre(F / 1000, 2)} kN` : `${P.nombre(F, Math.abs(F) < 10 ? 2 : 1)} N`);
// Flèche d'effort de longueur croissant avec le logarithme de la force.
function effort(x, y, F, texteF, cls = '') {
  const m = Math.hypot(F.x, F.z);
  if (!(m > 0.05)) return '';
  const L = clampPx(14 + 13 * Math.log10(1 + m), 24, 82), ux = F.x / m, uy = -F.z / m;
  return `<g class="lb-effort ${cls}">${fleche(x, y, x + ux * L, y + uy * L, 'lb-effort-fl', 9)}${texte(x + ux * (L + 6), y + uy * (L + 6) + (uy > 0.3 ? 10 : uy < -0.3 ? -2 : 4), texteF || forceTexte(m), 'lb-petit lb-effortt', ux < -0.3 ? 'end' : ux > 0.3 ? 'start' : 'middle')}</g>`;
}
// Efforts du chapitre 5 : obstacles, coudes, raccords, réactions des jets.
function efforts(V, scene, A) {
  let s = '';
  const E = A.ecoulement, ef = A.efforts;
  if (ef) {
    for (const c of ef.coudes) s += effort(V.X(c.x), V.Y(c.z), c.F);
    for (const r of ef.raccords) s += effort(V.X(r.x), V.Y(r.z) + 26, r.F);
  }
  if (!E) return s;
  for (const [, ob] of E.obstacles) {
    const q = ob.impacts[0];
    s += effort(V.X(q ? q.x : ob.o.x), V.Y(q ? q.z : ob.o.z), ob.F, `F = ${forceTexte(Math.hypot(ob.F.x, ob.F.z))}`);
  }
  for (const [, st] of E.orifices) if (st.Q > 0 && st.reaction) s += effort(V.X(st.pos.x), V.Y(st.pos.z), { x: -st.reaction * st.n.x, z: -st.reaction * st.n.z }, `réaction ${forceTexte(st.reaction)}`, 'lb-reaction');
  for (const [, l] of E.lances) if (l.Q > 0) {
    const a = l.l.angle * Math.PI / 180, bx = l.l.x - Math.cos(a) * 0.5, bz = l.l.z - Math.sin(a) * 0.5;
    s += effort(V.X(bx), V.Y(bz), { x: -l.reaction * l.dir.x, z: -l.reaction * l.dir.z }, `réaction ${forceTexte(l.reaction)}`, 'lb-reaction');
  }
  return s;
}

// ---------- scène complète ----------
export function dessinerScene(scene, A, vue, ui) {
  const V = vueDe(vue), env = scene.env, defs = [];
  const parties = [fond(V, vue.W, vue.H, env)];
  ui.pRef = 0;
  for (const [, e] of A.etats) ui.pRef = Math.max(ui.pRef, e.pFond, e.pCiel);
  const E = A.ecoulement;
  if (E && (E.jets.length || scene.elements.some(e => e.type === 'orifice' || e.type === 'robinet' || e.type === 'exutoire'))) parties.push(sol(V, scene, A, vue));
  for (const c of scene.elements) if (c.type === 'conduite' && A.conduites.get(c.id)) parties.push(conduite(V, c, A.conduites.get(c.id), A, env, ui));
  for (const v of scene.elements) if (v.type === 'venturi') parties.push(venturiDessin(V, v, A, ui));
  for (const el of scene.elements) if (['pompe', 'raccord', 'exutoire', 'robinet'].includes(el.type)) parties.push(appareil(V, el, A, scene, ui));
  for (const r of scene.elements) if (r.type === 'reservoir') parties.push(reservoir(V, r, A.etats.get(r.id), A, env, ui, defs));
  for (const r of scene.elements) {
    if (r.type !== 'reservoir') continue;
    const p = A.parois.get(r.id);
    if (p) parties.push(`<g class="lb-paroi-diag">${diagramme(V, p, env, { largeur: Math.min(0.45 * r.w * V.k, 130) })}${resultante(V, p, env, '')}</g>`);
  }
  for (const f of scene.elements) if (f.type === 'flotteur') {
    const r = A.idx.get(f.reservoir);
    if (r) parties.push(flotteur(V, f, A.flotteurs.get(f.id), r, A.etats.get(r.id), A, env, ui));
  }
  for (const v of scene.elements) if (v.type === 'vannePlane') parties.push(vannePlane(V, v, A.ouvrages.get(v.id), A, env, ui));
  for (const u of scene.elements) {
    const m = A.mesures.get(u.id);
    if (u.type === 'piezometre') parties.push(piezometre(V, u, m, A, env, ui));
    else if (u.type === 'manometre') parties.push(manometre(V, u, m, A, env, ui));
    else if (u.type === 'tubeU') parties.push(tubeU(V, u, m, A, env, ui));
  }
  for (const v of scene.elements) if (v.type === 'vanne' && A.conduites.get(v.conduite)) parties.push(vanne(V, v, A.conduites.get(v.conduite), A, env, ui));
  for (const o of scene.elements) if (o.type === 'orifice') parties.push(orificeDessin(V, o, A, ui));
  if (E) {
    parties.push(jets(V, scene, A, ui));
    if (env.vues.lignes !== false) parties.push(lignesDeCharge(V, scene, A));
  }
  for (const o of scene.elements) if (o.type === 'plaque' || o.type === 'auget') parties.push(obstacleDessin(V, o, A, ui));
  for (const el of scene.elements) if (el.type === 'lance') parties.push(appareil(V, el, A, scene, ui));
  if (env.vues.efforts) parties.push(efforts(V, scene, A));
  parties.push(surcouche(V, ui));
  return `<defs>${DEFS}${defs.join('')}</defs>${parties.join('')}`;
}

const DEFS = `<pattern id="lb-hachure" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="#6D7F89" stroke-width="1.2"/></pattern>` +
  `<pattern id="lb-grains" width="14" height="12" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.3" fill="#8B7650" opacity=".55"/><circle cx="10" cy="8" r="1.6" fill="#8B7650" opacity=".45"/><circle cx="6" cy="10.5" r=".9" fill="#6E5C3B" opacity=".5"/></pattern>`;

// Cibles d'accrochage, guides et aperçu pendant un glisser-déposer.
function surcouche(V, ui) {
  let s = '';
  for (const g of ui.guides || []) {
    const y = V.Y(g.z);
    s += `<line x1="0" y1="${n1(y)}" x2="${ui.W || 4000}" y2="${n1(y)}" class="lb-guide"/>`;
    if (g.texte) s += texte(V.X(g.x ?? 0) + 4, y - 4, esc(g.texte), 'lb-petit lb-guidet');
  }
  for (const c of ui.cibles || []) s += `<circle cx="${n1(V.X(c.x))}" cy="${n1(V.Y(c.z))}" r="${c.actif ? 6 : 3.5}" class="lb-cible${c.actif ? ' actif' : ''}" ${c.h ? `data-h="${c.h}"` : ''}/>`;
  if (ui.aimant) {
    const a = ui.aimant, x = V.X(a.x), y = V.Y(a.z);
    s += `<circle cx="${n1(x)}" cy="${n1(y)}" r="7" class="lb-aimant"/><circle cx="${n1(x)}" cy="${n1(y)}" r="7" class="lb-aimant-onde"/>`;
    if (a.texte) s += texte(x + 12, y - 10, esc(a.texte), 'lb-aimantt');
  }
  if (ui.apercu) s += `<g class="lb-apercu">${ui.apercu}</g>`;
  return s;
}

// Aperçu d'un réservoir en cours de dépôt.
export function apercuReservoir(vue, r) {
  const V = vueDe(vue);
  return `<path d="${chemin(V, contour(r))}${r.ferme ? 'Z' : ''}" class="lb-apercu-res"/>`;
}
export function apercuRemplissage(vue, r, s0, s1, coul, etiquette) {
  const V = vueDe(vue);
  return `<path d="${chemin(V, bande(r, s0, s1))}Z" fill="${coul}" class="lb-apercu-liq"/>` + texte(V.X(r.x) + 6, V.Y(r.z + s1) - 5, esc(etiquette), 'lb-aimantt');
}
export function apercuFlotteur(vue, r, f, z) {
  const V = vueDe(vue), x = r.x + f.x;
  return `<path d="${chemin(V, [{ x: x - f.l / 2, z }, { x: x + f.l / 2, z }, { x: x + f.l / 2, z: z + f.h }, { x: x - f.l / 2, z: z + f.h }])}Z" class="lb-apercu-res"/>`;
}
export function apercuSegment(vue, a, b) {
  const V = vueDe(vue);
  return `<line x1="${n1(V.X(a.x))}" y1="${n1(V.Y(a.z))}" x2="${n1(V.X(b.x))}" y2="${n1(V.Y(b.z))}" class="lb-apercu-seg"/>`;
}
export { contour, sousTrace };
