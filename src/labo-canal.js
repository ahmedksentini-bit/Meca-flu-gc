// Laboratoire virtuel — écoulements à surface libre (chapitre 8).
//
// Un canal prismatique (rectangulaire ou trapézoïdal) est vu en profil en long.
// Les équations de Saint-Venant 1D en section S et débit Q,
//   ∂S/∂t + ∂Q/∂x = 0,   ∂Q/∂t + ∂(Q²/S + g I₁)/∂x = g S (i − j),
// sont résolues par volumes finis (flux HLL, reconstruction hydrostatique
// d'Audusse pour la pente du fond, frottement de Manning–Strickler
// semi-implicite). Les fronts secs (rupture de barrage) sont admis.

const fini = v => typeof v === 'number' && Number.isFinite(v);
const SEC = 1e-6;

// ---------- géométrie d'une section trapézoïdale (m = 0 : rectangle) ----------
export const section = (c, h) => {
  const b = c.b, m = c.section === 'trap' ? c.m : 0;
  const S = h * (b + m * h), P = b + 2 * h * Math.sqrt(1 + m * m), B = b + 2 * m * h;
  return { S, P, B, Rh: P > 0 ? S / P : 0, hm: B > 0 ? S / B : 0, I1: b * h * h / 2 + m * h * h * h / 3 };
};
const hDeS = (c, S) => {
  const b = c.b, m = c.section === 'trap' ? c.m : 0;
  if (S <= 0) return 0;
  return m > 1e-12 ? (-b + Math.sqrt(b * b + 4 * m * S)) / (2 * m) : S / b;
};
// Profondeur normale (Manning–Strickler) et profondeur critique (Q²B = gS³).
export function hNormale(c, Q, i) {
  if (!(Q > 0) || !(i > 0) || !(c.K > 0)) return null;
  const f = h => { const s = section(c, h); return c.K * s.S * Math.pow(s.Rh, 2 / 3) * Math.sqrt(i) - Q; };
  let lo = 0, hi = 1;
  for (let k = 0; k < 60 && f(hi) < 0; k++) hi *= 2;
  for (let k = 0; k < 80; k++) { const mid = (lo + hi) / 2; if (f(mid) < 0) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
}
export function hCritique(c, Q, g) {
  if (!(Q > 0)) return 0;
  const f = h => { const s = section(c, h); return Q * Q * s.B - g * s.S ** 3; };
  let lo = 0, hi = 1;
  for (let k = 0; k < 60 && f(hi) > 0; k++) hi *= 2;
  for (let k = 0; k < 80; k++) { const mid = (lo + hi) / 2; if (f(mid) > 0) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
}
export const debitManning = (c, h, i) => { const s = section(c, h); return c.K * s.S * Math.pow(s.Rh, 2 / 3) * Math.sqrt(i); };
// Solution de Ritter (rupture de barrage sur fond sec, sans frottement).
export function ritter(x, t, h0, g) {
  const c0 = Math.sqrt(g * h0);
  if (!(t > 0)) return x <= 0 ? h0 : 0;
  if (x <= -c0 * t) return h0;
  if (x >= 2 * c0 * t) return 0;
  return (2 * c0 - x / t) ** 2 / (9 * g);
}
// Hauteur conjuguée d'un ressaut (canal rectangulaire) : h₂/h₁ = (√(1 + 8Fr₁²) − 1)/2.
export const conjuguee = (h1, Fr1) => h1 * (Math.sqrt(1 + 8 * Fr1 * Fr1) - 1) / 2;

// ---------- maillage, fond et état ----------
const pente = (c, x) => (fini(c.xr) && x >= c.xr ? c.i2 : c.i);
// Cote du fond : zf0 à l'amont, puis pentes i (et i₂ au-delà de la rupture xr).
export function fond(c, x) {
  const z0 = c.zf0 || 0, d = x - c.x0;
  if (fini(c.xr) && x > c.xr) return z0 - c.i * (c.xr - c.x0) - c.i2 * (x - c.xr);
  return z0 - c.i * d;
}
const etats = new WeakMap();
const signature = c => [c.x0, c.L, c.N, c.section, c.b, c.m, c.i, c.xr, c.i2, c.zf0, JSON.stringify(c.init)].join('|');
function initialiser(c, g) {
  const N = Math.max(20, Math.min(600, Math.round(c.N || 200))), dx = c.L / N;
  const x = [], zf = [], h = [], Q = [];
  for (let k = 0; k < N; k++) { x.push(c.x0 + (k + 0.5) * dx); zf.push(fond(c, x[k])); }
  const ini = c.init || { type: 'normale' };
  for (let k = 0; k < N; k++) {
    let hk = 0, qk = 0;
    if (ini.type === 'normale') {
      const q = c.amont === 'debit' ? c.Q : 0, hn = hNormale(c, q, pente(c, x[k]));
      hk = hn != null ? hn : (fini(ini.h) ? ini.h : 1); qk = q;
    } else if (ini.type === 'repos') hk = Math.max(0, ini.h - (zf[k] - (c.zf0 || 0)));
    else if (ini.type === 'barrage') hk = x[k] < (ini.xb || 0) ? ini.h1 : (ini.h2 || 0);
    else if (ini.type === 'uniforme') { hk = ini.h; qk = ini.U * section(c, ini.h).S; }
    h.push(hk); Q.push(qk);
  }
  const st = { N, dx, x, zf, h, Q, t: 0, sig: signature(c), actif: true, perturbations: [], hmax: 0 };
  if (c.bosse) perturber(c, st, c.bosse.x, c.bosse.dh, c.bosse.w, g);
  return st;
}
export function etatCanal(c, g) {
  let st = etats.get(c);
  if (!st || st.sig !== signature(c)) { st = initialiser(c, g); etats.set(c, st); }
  return st;
}
export function reinitialiser(c, g) { etats.delete(c); return etatCanal(c, g); }
// Intumescence : bosse cosinus de hauteur dh et de largeur w autour de x.
export function perturber(c, st, xb, dh, w, g) {
  let U = 0, h = 0, n = 0;
  for (let k = 0; k < st.N; k++) {
    const d = Math.abs(st.x[k] - xb);
    if (d < w / 2) {
      const s = section(c, st.h[k]), Uk = s.S > SEC ? st.Q[k] / s.S : 0;
      const hk = st.h[k] + dh * 0.5 * (1 + Math.cos(2 * Math.PI * d / w));
      st.h[k] = hk; st.Q[k] = Uk * section(c, hk).S;
    }
    if (d < w) { const s = section(c, st.h[k]); U += s.S > SEC ? st.Q[k] / s.S : 0; h += st.h[k]; n++; }
  }
  if (n) { U /= n; h /= n; st.perturbations.push({ x: xb, t: st.t, U, c: Math.sqrt(g * section(c, h).hm), dh }); }
  st.actif = true;
}

// ---------- schéma numérique ----------
function flux(c, g, hL, QL, hR, QR) {
  const sL = section(c, hL), sR = section(c, hR);
  const UL = hL > SEC ? QL / sL.S : 0, UR = hR > SEC ? QR / sR.S : 0;
  const cL = hL > SEC ? Math.sqrt(g * sL.hm) : 0, cR = hR > SEC ? Math.sqrt(g * sR.hm) : 0;
  if (hL <= SEC && hR <= SEC) return [0, 0];
  let a = Math.min(UL - cL, UR - cR), b = Math.max(UL + cL, UR + cR);
  if (hL <= SEC) a = UR - 2 * cR;
  if (hR <= SEC) b = UL + 2 * cL;
  const FL = [sL.S * UL, sL.S * UL * UL + g * sL.I1], FR = [sR.S * UR, sR.S * UR * UR + g * sR.I1];
  if (a >= 0) return FL;
  if (b <= 0) return FR;
  return [(b * FL[0] - a * FR[0] + a * b * (sR.S - sL.S)) / (b - a), (b * FL[1] - a * FR[1] + a * b * (sR.S * UR - sL.S * UL)) / (b - a)];
}
// Cellules fantômes : conditions aux limites amont et aval.
function fantomes(c, st, g) {
  const N = st.N, h1 = st.h[0], q1 = st.Q[0], hN = st.h[N - 1], qN = st.Q[N - 1];
  let am, av;
  if (c.amont === 'debit') am = { h: h1, Q: c.Q, zf: st.zf[0] + pente(c, st.x[0]) * st.dx };
  else am = { h: h1, Q: -q1, zf: st.zf[0] };
  const zfa = st.zf[N - 1] - pente(c, st.x[N - 1]) * st.dx;
  if (c.aval === 'mur') av = { h: hN, Q: -qN, zf: st.zf[N - 1] };
  else if (c.aval === 'niveau') av = { h: Math.max(0, c.hAval), Q: qN, zf: st.zf[N - 1] };
  else if (c.aval === 'normal') { const hn = hNormale(c, Math.max(qN, 0), pente(c, st.x[N - 1])); av = { h: hn != null ? hn : hN, Q: qN, zf: zfa }; }
  else {
    // chute libre : profondeur critique en bout de canal si l'écoulement y est fluvial
    const s = section(c, hN), U = hN > SEC ? qN / s.S : 0, Fr = hN > SEC ? Math.abs(U) / Math.sqrt(g * s.hm) : 0;
    av = { h: qN > 0 && Fr < 1 ? Math.min(hN, hCritique(c, qN, g)) : hN, Q: Math.max(qN, 0), zf: zfa };
    if (hN <= SEC) av = { h: 0, Q: 0, zf: zfa };
  }
  return { am, av };
}
function pas(c, st, g, dtMax) {
  const N = st.N, dx = st.dx, { am, av } = fantomes(c, st, g);
  const H = [am.h, ...st.h, av.h], Qs = [am.Q, ...st.Q, av.Q], Z = [am.zf, ...st.zf, av.zf];
  // pas de temps (CFL 0,8)
  let vmax = 1e-9;
  for (let k = 0; k < N + 2; k++) {
    if (H[k] <= SEC) continue;
    const s = section(c, H[k]);
    vmax = Math.max(vmax, Math.abs(Qs[k] / s.S) + Math.sqrt(g * s.hm));
  }
  const dt = Math.min(dtMax, 0.8 * dx / vmax);
  // flux aux interfaces avec reconstruction hydrostatique
  const FL = new Array(N + 1), FR = new Array(N + 1);
  for (let k = 0; k <= N; k++) {
    const l = k, r = k + 1, zs = Math.max(Z[l], Z[r]);
    const hl = Math.max(0, H[l] + Z[l] - zs), hr = Math.max(0, H[r] + Z[r] - zs);
    const sl = section(c, H[l]), sr = section(c, H[r]);
    const Ul = H[l] > SEC ? Qs[l] / sl.S : 0, Ur = H[r] > SEC ? Qs[r] / sr.S : 0;
    const F = flux(c, g, hl, Ul * section(c, hl).S, hr, Ur * section(c, hr).S);
    FL[k] = [F[0], F[1] + g * (sl.I1 - section(c, hl).I1)];
    FR[k] = [F[0], F[1] + g * (sr.I1 - section(c, hr).I1)];
  }
  let dmax = 0;
  for (let k = 0; k < N; k++) {
    const s0 = section(c, st.h[k]);
    let S = s0.S - dt / dx * (FL[k + 1][0] - FR[k][0]);
    let Q = st.Q[k] - dt / dx * (FL[k + 1][1] - FR[k][1]);
    if (S < 1e-9) { S = 0; Q = 0; }
    const h = hDeS(c, S);
    // frottement de Manning–Strickler, semi-implicite
    if (c.K > 0 && h > SEC) {
      const s = section(c, h);
      // ∂Q/∂t = −g S j avec j = Q|Q|/(K² S² Rh^(4/3))
      Q = Q / (1 + dt * g * Math.abs(Q) / (c.K * c.K * s.S * Math.pow(s.Rh, 4 / 3)));
    }
    if (h <= SEC) Q = 0;
    dmax = Math.max(dmax, Math.abs(h - st.h[k]));
    st.h[k] = h; st.Q[k] = Q;
  }
  st.t += dt;
  return { dt, vitesse: dmax / dt };
}
// Avance le canal de « duree » secondes ; vrai tant que l'écoulement évolue.
export function avancerCanal(c, duree, g) {
  const st = etatCanal(c, g);
  if (!(duree > 0)) return st.actif;
  let reste = duree, n = 0, vmax = 0;
  while (reste > 1e-12 && n < 3000) {
    const r = pas(c, st, g, reste);
    reste -= r.dt; n++;
    vmax = Math.max(vmax, r.vitesse);
  }
  // régime permanent atteint : les profondeurs ne bougent plus (< 1 µm/s)
  st.actif = vmax > 1e-6;
  return st.actif;
}

// ---------- lecture des résultats ----------
export function diagnostic(c, g) {
  const st = etatCanal(c, g), N = st.N, pts = [];
  let hmax = 0;
  for (let k = 0; k < N; k++) {
    const s = section(c, st.h[k]), U = st.h[k] > SEC ? st.Q[k] / s.S : 0, cel = st.h[k] > SEC ? Math.sqrt(g * s.hm) : 0;
    pts.push({ x: st.x[k], zf: st.zf[k], h: st.h[k], Q: st.Q[k], U, c: cel, Fr: cel > 0 ? Math.abs(U) / cel : 0, ...s, E: st.h[k] + U * U / (2 * g) });
    hmax = Math.max(hmax, st.h[k]);
  }
  st.hmax = Math.max(st.hmax, hmax);
  // ressauts : passage du torrentiel au fluvial dans le sens du courant
  const ressauts = [];
  for (let k = 1; k < N - 1; k++) {
    const a = pts[k - 1], b = pts[k + 1];
    if (a.Fr > 1 && b.Fr < 1 && a.U > 0 && pts[k].h > SEC && !ressauts.some(r => Math.abs(r.k - k) < 6)) {
      // pied et sommet du ressaut sur une fenêtre de quelques mailles
      let i1 = k - 1, i2 = k + 1;
      for (let j = k - 1; j >= Math.max(0, k - 8); j--) if (pts[j].h < pts[i1].h) i1 = j;
      for (let j = k + 1; j <= Math.min(N - 1, k + 8); j++) if (pts[j].h > pts[i2].h) i2 = j;
      const p1 = pts[i1], p2 = pts[i2];
      // un vrai ressaut relève nettement la ligne d'eau (pas le front d'une onde sur fond sec)
      if (!(p2.h > 1.15 * p1.h && p1.h > 1e-3)) continue;
      ressauts.push({ k, x: pts[k].x, h1: p1.h, h2: p2.h, Fr1: p1.Fr, Fr2: p2.Fr, U1: p1.U, h2theo: conjuguee(p1.h, p1.Fr),
        dE: (p2.h - p1.h) ** 3 / (4 * p1.h * p2.h) });
    }
  }
  const sonde = fini(c.sonde) ? Math.min(N - 1, Math.max(0, Math.floor((c.sonde - c.x0) / st.dx))) : Math.floor(N / 2);
  const Qref = c.amont === 'debit' ? c.Q : Math.max(0, ...st.Q);
  return { st, pts, t: st.t, actif: st.actif, sonde: pts[sonde], ressauts, Qref,
    hn: hNormale(c, Qref, c.i), hn2: fini(c.xr) ? hNormale(c, Qref, c.i2) : null, hc: hCritique(c, Qref, g), hmax: st.hmax };
}
