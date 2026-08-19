const esc = value => String(value ?? "").replace(/[&<>'"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c]));
const num = (value, digits = 3) => Number.isFinite(+value) ? Number(value).toLocaleString("fr-FR", { maximumSignificantDigits: digits }) : "—";

const PALETTE = {
  water: "#0077be",
  waterFill: "rgba(0,119,190,0.15)",
  force: "#e63946",
  velocity: "#2a9d8f",
  pressure: "#e76f51",
  dim: "#2b2d42",
  egl: "#e63946",
  hgl: "#0077be"
};
const VECTOR_MARK = {
  force: { color: PALETTE.force, marker: "mkForce" },
  velocity: { color: PALETTE.velocity, marker: "mkVel" },
  pressure: { color: PALETTE.pressure, marker: "mkPress" }
};

function svg(label, body) {
  return `<svg viewBox="0 0 560 250" role="img" aria-label="${esc(label)}"><defs>
    <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0v6" stroke="#94a3b8" stroke-width="1"/></pattern>
    <marker id="ar" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="#0f172a"/></marker>
    <marker id="arb" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="${PALETTE.water}"/></marker>
    <marker id="arr" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="${PALETTE.force}"/></marker>
    <marker id="mkFlow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="${PALETTE.water}"/></marker>
    <marker id="mkForce" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="${PALETTE.force}"/></marker>
    <marker id="mkVel" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="${PALETTE.velocity}"/></marker>
    <marker id="mkPress" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="${PALETTE.pressure}"/></marker>
    <marker id="dimA" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto-start-reverse"><path d="M0 0l7 3.5-7 3.5z" fill="${PALETTE.dim}"/></marker>
    <style>text{font-family:Inter,system-ui,sans-serif;font-size:12.5px;font-weight:700;fill:#0f172a}</style>
  </defs>${body}</svg>`;
}

const t = (x, y, text, extra = "") => `<text x="${x}" y="${y}" ${extra}>${text}</text>`;
const line = (x1, y1, x2, y2, color = "#0f172a", width = 1.6, extra = "") =>
  `<path d="M${x1} ${y1}L${x2} ${y2}" fill="none" stroke="${color}" stroke-width="${width}" ${extra}/>`;
const hatch = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#hatch)" stroke="#334155" stroke-width="1.4"/>`;
const oil = d => `<path d="${d}" fill="#fde68a" stroke="#b45309" stroke-width="1.4"/>`;
const flow = d => `<path class="flow-animate" d="${d}" fill="none" stroke="${PALETTE.water}" stroke-width="3.2" stroke-dasharray="12 8" marker-end="url(#mkFlow)"/>`;

function drawDimension(x1, y1, x2, y2, label, options = {}) {
  const color = options.color || PALETTE.dim;
  const side = options.side ?? 1;
  const gap = options.gap ?? 10;
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const px = (-dy / len) * side, py = (dx / len) * side;
  const mx = (x1 + x2) / 2 + px * gap;
  const my = (y1 + y2) / 2 + py * gap + 4;
  const vertical = Math.abs(dx) < Math.abs(dy);
  const extra = vertical
    ? `fill="${color}" ${side < 0 ? 'text-anchor="end"' : ""}`
    : `fill="${color}" text-anchor="middle"`;
  return `${line(x1, y1, x2, y2, color, 1.3, 'marker-start="url(#dimA)" marker-end="url(#dimA)"')}${label ? t(mx, my, label, extra) : ""}`;
}

function drawVector(x, y, dx, dy, color, label) {
  const spec = VECTOR_MARK[color] || { color: color || PALETTE.force, marker: "mkForce" };
  const x2 = x + dx, y2 = y + dy;
  const lbl = label ? t(x2 + 6, y2 - 4, label, `fill="${spec.color}"`) : "";
  return `${line(x, y, x2, y2, spec.color, 2.2, `marker-end="url(#${spec.marker})"`)}${lbl}`;
}

function drawWaterSurface(x, y, width, height, options = {}) {
  const fill = options.fill || PALETTE.waterFill;
  const stroke = options.stroke || PALETTE.water;
  const cx = x + Math.min(22, width * 0.2);
  const symbol = options.symbol === false
    ? ""
    : `<path d="M${cx} ${y}l7-11h-14z" fill="${stroke}"/>`;
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}" stroke="${stroke}" stroke-width="1.4"/>${line(x, y, x + width, y, stroke, 2.2)}${symbol}`;
}

function drawEnergyLines(points, options = {}) {
  const stations = Array.isArray(points) ? points : null;
  const egl = stations ? stations.map(p => [p.x, p.egl]) : (points.egl || []);
  const hgl = stations
    ? stations.filter(p => Number.isFinite(p.hgl)).map(p => [p.x, p.hgl])
    : (points.hgl || []);
  const markStations = stations || points.gaps || [];
  const marked = markStations.filter(p => p.mark);
  const toMark = marked.length ? marked : markStations;
  const showGap = options.gap !== false;
  let marks = "";
  if (showGap) {
    for (const p of toMark) {
      if (!Number.isFinite(p?.egl) || !Number.isFinite(p?.hgl)) continue;
      if (Math.abs(p.egl - p.hgl) < 3) continue;
      marks += line(p.x, p.egl, p.x, p.hgl, PALETTE.dim, 1.1, 'stroke-dasharray="3 3"');
      marks += t(p.x + 5, (p.egl + p.hgl) / 2 + 4, p.label || "V²/2g", `fill="${PALETTE.dim}"`);
    }
  }
  return `${poly(egl, options.eglColor || PALETTE.egl, 2.2, 'stroke-dasharray="8 5"')}${poly(hgl, options.hglColor || PALETTE.hgl, 2, 'stroke-dasharray="5 4"')}${marks}`;
}

function drawParabola(x0, y0, cx, cy, x1, y1, color = PALETTE.velocity) {
  return `<path d="M${x0} ${y0}Q${cx} ${cy} ${x1} ${y1}" fill="none" stroke="${color}" stroke-width="2.3"/>`;
}

function drawPressureDiagram(x, y, height, pTop, pBottom, options = {}) {
  const dir = options.dir ?? 1;
  const y2 = y + height;
  const w1 = Math.max(+pTop || 0, 0) * dir;
  const w2 = Math.max(+pBottom || 0, 0) * dir;
  const fill = options.fill || "rgba(231,111,81,0.28)";
  const stroke = options.stroke || PALETTE.pressure;
  return `<path d="M${x} ${y}L${x + w1} ${y}L${x + w2} ${y2}H${x}z" fill="${fill}" stroke="${stroke}" stroke-width="1.4"/>`;
}

function iso(x, y, z, o = {}) {
  const ox = o.ox ?? 58, oy = o.oy ?? 218, s = o.s ?? 20;
  return [ox + (x + 0.56 * z) * s, oy - (y + 0.33 * z) * s];
}
function isoFace(pts, fill, stroke = "#334155", width = 1.25) {
  if (!pts || pts.length < 3) return "";
  return `<path d="M${pts.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("L")}z" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;
}
function isoTank(cx, cy, rx, h, fill, options = {}) {
  const ry = options.ry ?? Math.max(rx * 0.32, 8);
  const body = options.body || "#94a3b8";
  return `<ellipse cx="${cx}" cy="${cy + h}" rx="${rx}" ry="${ry}" fill="${body}" stroke="#334155" stroke-width="1.4"/>
    <path d="M${cx - rx} ${cy}v${h}a${rx} ${ry} 0 0 0 ${2 * rx} 0v${-h}" fill="${fill}" stroke="#334155" stroke-width="1.4"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="#334155" stroke-width="1.6"/>`;
}
function isoChannel(d, opts = {}) {
  const b = Math.max(+d.b || 3, 0.25);
  const y = Math.max(+d.y || 1, 0.06);
  const m = Math.max(+d.z || 0, 0);
  const L = opts.L ?? 6.2;
  const wall = opts.wall ?? Math.max(y * 1.28 + 0.7, y + 0.45);
  const o = { ox: opts.ox ?? 42, oy: opts.oy ?? 222, s: opts.s ?? 18 };
  const P = (x, yy, z) => iso(x, yy, z, o);
  const zL = yy => -m * yy, zR = yy => b + m * yy;
  const zLo = zL(wall) - 0.28, zRo = zR(wall) + 0.28;
  const leftW = isoFace([P(0, 0, zLo), P(L, 0, zLo), P(L, wall, zLo), P(0, wall, zLo)], "#94a3b8");
  const back = isoFace([P(L, 0, zLo), P(L, 0, zRo), P(L, wall, zRo), P(L, wall, zLo)], "#e2e8f0");
  const bed = isoFace([P(0, 0, 0), P(L, 0, 0), P(L, 0, b), P(0, 0, b)], "#cbd5e1");
  const rightW = isoFace([P(0, 0, zRo), P(L, 0, zRo), P(L, wall, zRo), P(0, wall, zRo)], "#64748b");
  const wRight = isoFace([P(0, 0, b), P(L, 0, b), P(L, y, zR(y)), P(0, y, zR(y))], "rgba(0,119,190,0.22)", PALETTE.water);
  const wFront = isoFace([P(0, 0, 0), P(0, 0, b), P(0, y, zR(y)), P(0, y, zL(y))], "rgba(0,119,190,0.32)", PALETTE.water);
  const wTop = isoFace([P(0, y, zL(y)), P(L, y, zL(y)), P(L, y, zR(y)), P(0, y, zR(y))], PALETTE.waterFill, PALETTE.water, 1.6);
  const a = P(0.45, y + 0.12, b / 2), c = P(L - 0.35, y + 0.12, b / 2);
  const arr = line(a[0], a[1], c[0], c[1], PALETTE.water, 2.4, 'marker-end="url(#mkFlow)"');
  return { body: `${back}${leftW}${bed}${rightW}${wRight}${wFront}${wTop}${arr}`, P, L, wall, o };
}

const Gfig = 9.81;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const headY = (head, hMax, yBed, hPx) => yBed - clamp(head / Math.max(hMax, 1e-6), -0.18, 1.15) * hPx;
function poly(points, color, width, extra = "") {
  if (points.length < 2) return "";
  return `<path d="M${points.map(p => `${p[0]},${p[1]}`).join("L")}" fill="none" stroke="${color}" stroke-width="${width}" ${extra}/>`;
}
const dot = (x, y, color = "#0f172a") => `<circle cx="${x}" cy="${y}" r="4.5" fill="${color}"/>`;
function iterateGravity(d, Ksum) {
  const D = (+d.D || 200) / 1000, eps = (+d.eps || 0.2) / 1000, nu = (+d.nu || 1) * 1e-6;
  const L = +d.L || 100, H = +d.H || 10, K = Number.isFinite(+Ksum) ? +Ksum : (+d.Ksum || 4);
  let V = Math.sqrt(2 * Gfig * H / (0.02 * L / D + K)), f = 0.02;
  for (let i = 0; i < 16; i++) {
    f = colebrookF(V * D / nu, eps / D);
    V = Math.sqrt(2 * Gfig * H / Math.max(f * L / D + K, 1e-6));
  }
  const hv = V * V / (2 * Gfig);
  return { V, f, hv, hf: f * (L / D) * hv, hs: K * hv, H };
}

function colebrookF(Re, epsRel) {
  if (!(Re > 0)) return NaN;
  if (Re < 2000) return 64 / Re;
  let f = 0.02;
  const er = Math.max(+epsRel || 0, 0);
  for (let i = 0; i < 24; i++) f = 1 / (-2 * Math.log10(er / 3.7 + 2.51 / (Re * Math.sqrt(f)))) ** 2;
  return f;
}

function moodyPoint(d) {
  const D = Number.isFinite(+d.D) ? +d.D / 1000 : NaN;
  const eps = Number.isFinite(+d.eps) ? +d.eps / 1000 : NaN;
  const nu = Number.isFinite(+d.nu) ? +d.nu * 1e-6 : 1e-6;
  let V = +d.V;
  if (!Number.isFinite(V) && Number.isFinite(+d.Q) && D > 0) V = (+d.Q / 1000) / (Math.PI * D * D / 4);
  let Re = +d.Re;
  if (!Number.isFinite(Re) && Number.isFinite(V) && D > 0) Re = V * D / nu;
  let epsRel = +d.epsRel;
  if (!Number.isFinite(epsRel) && D > 0 && Number.isFinite(eps)) epsRel = eps / D;
  if (!Number.isFinite(Re)) Re = 2e5;
  if (!Number.isFinite(epsRel)) epsRel = 7.5e-4;
  return { Re, epsRel, f: colebrookF(Re, epsRel) };
}

function moodyChart(d, options = {}) {
  const { Re, epsRel, f } = moodyPoint(d);
  const L = 58, T = 26, R = 592, B = 368, W = R - L, H = B - T;
  const x0 = Math.log10(500), x1 = Math.log10(1e8), y0 = Math.log10(0.008), y1 = Math.log10(0.1);
  const X = re => L + ((Math.log10(Math.min(Math.max(re, 500), 1e8)) - x0) / (x1 - x0)) * W;
  const Y = lam => T + (1 - (Math.log10(Math.min(Math.max(lam, 0.008), 0.1)) - y0) / (y1 - y0)) * H;
  const inPlot = (re, lam) => re >= 500 && re <= 1e8 && lam >= 0.008 && lam <= 0.1;
  const sample = (from, to, n, fn) => {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const re = 10 ** (Math.log10(from) + (Math.log10(to) - Math.log10(from)) * i / n);
      const lam = fn(re);
      if (inPlot(re, lam)) pts.push([X(re).toFixed(1), Y(lam).toFixed(1)]);
    }
    return pts.length > 1 ? `<path d="M${pts.map(p => p.join(",")).join("L")}" fill="none"` : "";
  };
  const curves = [0, 1e-5, 5e-5, 1e-4, 2e-4, 4e-4, 6e-4, 8e-4, 0.001, 0.002, 0.004, 0.006, 0.008, 0.01, 0.015, 0.02, 0.03, 0.04, 0.05];
  const nearest = curves.reduce((best, er) => Math.abs(Math.log10(Math.max(er, 1e-8)) - Math.log10(Math.max(epsRel, 1e-8))) < Math.abs(Math.log10(Math.max(best, 1e-8)) - Math.log10(Math.max(epsRel, 1e-8))) ? er : best, curves[0]);
  const fmtEr = er => {
    if (er === 0) return "lisse";
    if (er >= 0.001) return String(er).replace(".", ",");
    const exp = Math.floor(Math.log10(er) + 1e-12);
    const mant = Math.round(er / 10 ** exp);
    const sup = "⁰¹²³⁴⁵⁶⁷⁸⁹";
    const expTxt = String(Math.abs(exp)).split("").map(c => sup[c]).join("");
    return (mant === 1 ? "" : `${mant}×`) + "10⁻" + expTxt;
  };
  const curvePaths = curves.map(er => {
    const path = sample(4000, 1e8, 48, re => colebrookF(re, er));
    if (!path) return "";
    const hot = er === nearest;
    const fEnd = colebrookF(1e8, er);
    const labelY = inPlot(1e8, fEnd) ? Y(fEnd) : Y(Math.min(Math.max(fEnd, 0.008), 0.1));
    return `${path} stroke="${hot ? "#b91c1c" : "#0f172a"}" stroke-width="${hot ? 2.6 : 1.5}"/>${t(R + 4, labelY + 3, fmtEr(er), `font-size="9px" fill="${hot ? "#b91c1c" : "#334155"}"`)}`;
  }).join("");
  const laminar = sample(500, 2300, 16, re => 64 / re);
  const dashPts = [];
  for (const er of curves.filter(er => er > 0)) {
    const fInf = 1 / (-2 * Math.log10(er / 3.7)) ** 2;
    const reC = 200 / (er * Math.sqrt(fInf));
    if (inPlot(reC, fInf)) dashPts.push([X(reC).toFixed(1), Y(fInf).toFixed(1)]);
  }
  const ticksRe = [1e3, 2e3, 4e3, 1e4, 2e4, 4e4, 1e5, 2e5, 4e5, 1e6, 2e6, 4e6, 1e7, 2e7, 4e7, 1e8];
  const labelsRe = { 1000: "10³", 10000: "10⁴", 100000: "10⁵", 1000000: "10⁶", 10000000: "10⁷", 100000000: "10⁸" };
  const ticksF = [0.008, 0.009, 0.01, 0.012, 0.015, 0.02, 0.025, 0.03, 0.04, 0.05, 0.06, 0.08, 0.1];
  const labelsF = new Set([0.008, 0.01, 0.015, 0.02, 0.03, 0.04, 0.05, 0.08, 0.1]);
  const grid = [
    ...ticksRe.map(re => `${line(X(re), T, X(re), B, re in labelsRe ? "#cbd5e1" : "#e2e8f0", re in labelsRe ? 1 : 0.6)}`),
    ...ticksF.map(lam => `${line(L, Y(lam), R, Y(lam), labelsF.has(lam) ? "#cbd5e1" : "#e2e8f0", labelsF.has(lam) ? 1 : 0.6)}`)
  ].join("");
  const axisLabels = [
    ...ticksRe.map(re => `${line(X(re), B, X(re), B + 5, "#334155", 1)}${labelsRe[re] ? t(X(re), B + 18, labelsRe[re], 'text-anchor="middle" font-size="10px"') : ""}`),
    ...ticksF.map(lam => `${line(L - 5, Y(lam), L, Y(lam), "#334155", 1)}${labelsF.has(lam) ? t(L - 8, Y(lam) + 3, String(lam).replace(".", ","), 'text-anchor="end" font-size="10px"') : ""}`)
  ].join("");
  const xP = X(Re), yP = Y(f);
  const point = inPlot(Re, f)
    ? `${line(xP, T, xP, B, "#b91c1c", 1, 'stroke-dasharray="4 3"')}${line(L, yP, R, yP, "#b91c1c", 1, 'stroke-dasharray="4 3"')}<circle cx="${xP}" cy="${yP}" r="5" fill="#b91c1c"/>`
    : "";
  const hatchId = options.hatchId || "moodyHatch";
  const zone = `<rect x="${X(2000)}" y="${T}" width="${X(4000) - X(2000)}" height="${H}" fill="url(#${hatchId})" opacity="0.55"/>`;
  return {
    caption: `Diagramme de Moody : entrer par Re = ${num(Re, 3)}, suivre ε/D = ${num(epsRel, 2)}, lire λ = ${num(f, 3)}. Cliquez pour agrandir et déplacer les curseurs Re et ε/D.`,
    svg: `<svg class="moody-chart" viewBox="0 0 680 400" role="img" aria-label="Diagramme de Moody"><defs>
      <pattern id="${hatchId}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0v6" stroke="#f59e0b" stroke-width="1"/></pattern>
      <style>text{font-family:Inter,system-ui,sans-serif;font-weight:700;fill:#0f172a}</style>
    </defs>
    <rect x="0" y="0" width="680" height="400" fill="#fff"/>
    ${t(L, 16, "Diagramme de Moody  ·  λ (Re, ε/D)", 'font-size="13px"')}
    ${t(R, 16, "ε/D", 'text-anchor="end" font-size="11px" fill="#0f766e"')}
    ${grid}${zone}
    ${laminar ? `${laminar} stroke="#0369a1" stroke-width="2.1"/>` : ""}
    ${curvePaths}
    ${dashPts.length > 1 ? `<path d="M${dashPts.map(p => p.join(",")).join("L")}" fill="none" stroke="#0f172a" stroke-width="1.3" stroke-dasharray="6 4"/>` : ""}
    <rect x="${L}" y="${T}" width="${W}" height="${H}" fill="none" stroke="#0f172a" stroke-width="1.6"/>
    ${axisLabels}${point}
    ${t((L + R) / 2, 394, "Nombre de Reynolds Re", 'text-anchor="middle" font-size="12px"')}
    ${t(16, (T + B) / 2, "λ", 'font-size="13px"')}
    ${t(L + 8, T + 16, "laminaire 64/Re", 'font-size="10px" fill="#0369a1"')}
    ${t(X(2600), T + 16, "crit.", 'font-size="10px" fill="#b45309"')}
    </svg>`
  };
}

const figures = {
  viscosity(d) {
    const yT = 56, yB = 168, xR = 100, uPx = 130, nA = 6, dh = (yB - yT) / (nA + 1);
    let va = '';
    for (let i = 1; i <= nA; i++) { const y = yB - i * dh, len = (i / (nA + 1)) * uPx; if (len > 6) va += drawVector(xR, y, len, 0, "velocity"); }
    return {
      caption: "Propriété du fluide : τ = μ U/e. On mesure F et on en déduit μ = τ e/U, puis ν = μ/ρ.",
      svg: svg("Viscosité dynamique", `${hatch(40, 36, 360, 16)}${drawWaterSurface(40, 52, 360, 120)}${hatch(40, 172, 360, 16)}${line(xR, yB, xR, yT, PALETTE.velocity, 1, 'stroke-dasharray="4 3"')}${line(xR, yB, xR + uPx, yT, PALETTE.velocity, 2.3)}${va}${drawVector(250, 28, 80, 0, "velocity", `U = ${num(d.U)} m/s`)}${drawDimension(36, 52, 36, 172, `e = ${num(d.e)} mm`, { side: -1 })}${t(270, 120, "τ = μ·du/dy = μU/e", `fill="${PALETTE.velocity}" font-size="13"`)}${t(48, 228, "plaque fixe — adhérence u = 0")}${t(270, 228, `F = ${num(d.F)} N · A = ${num(d.A)} m² → μ`)}`)
    };
  },
  viscosityForce(d) {
    const yT = 56, yB = 168, xR = 100, uPx = 130, nA = 6, dh = (yB - yT) / (nA + 1);
    let va = '';
    for (let i = 1; i <= nA; i++) { const y = yB - i * dh, len = (i / (nA + 1)) * uPx; if (len > 6) va += drawVector(xR, y, len, 0, "velocity"); }
    return {
      caption: "Couette plan : profil linéaire, τ = μU/e. La force de traction F = τA s’applique sur la plaque mobile, pas sur le fluide « en bloc ».",
      svg: svg("Force de traction visqueuse", `${hatch(40, 36, 360, 16)}${drawWaterSurface(40, 52, 360, 120)}${hatch(40, 172, 360, 16)}${line(xR, yB, xR, yT, PALETTE.velocity, 1, 'stroke-dasharray="4 3"')}${line(xR, yB, xR + uPx, yT, PALETTE.velocity, 2.3)}${va}${drawVector(80, 28, 170, 0, "force", `F = τA`)}${drawVector(280, 44, 70, 0, "velocity", `U = ${num(d.U)} m/s`)}${drawDimension(36, 52, 36, 172, `e = ${num(d.e)} mm`, { side: -1 })}${t(270, 120, "τ = μ·du/dy = μU/e", `fill="${PALETTE.velocity}" font-size="13"`)}${t(48, 228, "plaque fixe — adhérence u = 0")}${t(270, 228, `μ = ${num(d.mu)} Pa·s · A = ${num(d.A)} m²`)}`)
    };
  },

  density(d) {
    if (Number.isFinite(d.D) && Number.isFinite(d.h)) {
      const hPx = clamp((+d.h || 0.9) * 70, 70, 130);
      return {
        caption: "Citerne cylindrique en volume : 𝒱 = πD²h/4, puis ρ = m/𝒱, γ = ρg et d = ρ/ρeau.",
        svg: svg("Réservoir cylindrique d’huile", `${hatch(80, 210, 400, 16)}${isoTank(280, 210 - hPx, 78, hPx, "#fde68a", { body: "#d6d3d1" })}${drawDimension(175, 210 - hPx, 175, 210, `h = ${num(d.h)} m`)}${drawDimension(202, 226, 358, 226, `D = ${num(d.D)} m`, { side: -1 })}${t(200, 36, `huile · m = ${num(d.mass)} kg`)}`)
      };
    }
    return {
      caption: "Le poids W est une force verticale. On en déduit m = W/g, puis ρ = m/𝒱.",
      svg: svg("Réservoir d’huile", `${hatch(80, 210, 400, 16)}${isoTank(280, 80, 78, 130, "#fde68a")}${t(200, 36, `huile · 𝒱 = ${num(d.volume)} m³`)}${drawVector(390, 100, 0, 70, "force", `W = ${num(d.W)} kN`)}`)
    };
  },

  compressibility(d) {
    const dp = ((+d.p2 || 200) - (+d.p1 || 1)) * 1e5;
    const ratio = Math.min(dp / ((+d.K || 2.2) * 1e9), 0.25);
    const w1 = 250, w2 = w1 * (1 - ratio * 0.7);
    return {
      caption: "Piston-cylindre fermé : la masse d’eau se conserve, seul le volume diminue quand p augmente. Δ𝒱 est visible par la course du piston.",
      svg: svg("Compression d’un volume d’eau", `${hatch(70, 70, 28, 110)}<rect x="98" y="78" width="${w1}" height="94" fill="${PALETTE.waterFill}" stroke="${PALETTE.water}" stroke-width="3"/><rect x="${98 + w2}" y="70" width="22" height="110" fill="#94a3b8" stroke="#334155"/>${hatch(348, 70, 22, 110)}${drawVector(30, 125, 40, 0, "force", "p")}${t(28, 60, `p₁ = ${num(d.p1)} bar → p₂ = ${num(d.p2)} bar`)}${t(120, 120, `𝒱₁ = ${num(d.volume)} m³`)}${t(120, 148, `Δ𝒱/𝒱 = Δp/K`)}${t(120, 220, "eau — compression isotherme")}`)
    };
  },

  coaxialViscometer(d) {
    const ri = +d.ri || 20, ro = +d.ro || 22;
    const e = Math.max(ro - ri, 0.1);
    const y0 = 70, y1 = 168, xWall = 148, uMax = 70;
    return {
      caption: "Coupe : cylindre intérieur tournant, extérieur fixe. L’entrefer e = Rₑ − Rᵢ est un Couette plan enroulé : profil u(y) linéaire.",
      svg: svg("Viscosimètre coaxial", `<rect x="120" y="36" width="88" height="168" fill="#e2e8f0" stroke="#334155" stroke-width="7"/><rect x="142" y="52" width="44" height="136" fill="${PALETTE.waterFill}" stroke="${PALETTE.water}" stroke-width="5"/>${drawDimension(142, 210, 164, 210, `e = ${num(e)} mm`, { side: 1 })}${line(xWall, y1, xWall + uMax, y0, PALETTE.velocity, 2.3)}${drawVector(xWall + uMax, y0, 28, 0, "velocity", "U = ωRᵢ")}${t(250, 58, `N = ${num(d.rpm)} tr/min`)}${t(250, 86, `Rᵢ = ${num(d.ri)} mm`)}${t(250, 114, `Rₑ = ${num(d.ro)} mm`)}${t(250, 142, `L = ${num(d.L)} mm`)}${t(250, 170, `C = ${num(d.torque)} N·m`)}${t(130, 228, "stator fixe")} ${t(155, 28, "rotor")}`)
    };
  },

  capillary(d) {
    const diam = Math.max(+d.d || 1, 0.2);
    const theta = ((+d.theta || 0) * Math.PI) / 180;
    const hJurin = 4 * (+d.sigma || 0.074) * Math.cos(theta) / (Math.max(+d.rho || 1000, 1) * Gfig * (diam / 1000));
    const tubeW = clamp(8 + diam * 1.6, 10, 28);
    const hPx = clamp(hJurin * 180, 28, 120);
    const x = 132, yFree = 150, yMen = yFree - hPx;
    const rMen = tubeW * 0.45;
    return {
      caption: "Loi de Jurin : h ∝ 1/d. Un liquide mouillant (θ < 90°) monte ; le ménisque est plus cambré dans un tube plus fin.",
      svg: svg("Ascension capillaire", `${drawWaterSurface(40, 150, 200, 60)}${hatch(40, 210, 200, 14)}<path d="M${x} 28v182" fill="none" stroke="#334155" stroke-width="${tubeW + 6}"/><path d="M${x + 4.5} 208V${yMen + rMen}q0 ${-rMen} ${tubeW / 2 - 3} ${-rMen}t${tubeW / 2 - 3} ${rMen}v${208 - (yMen + rMen)}" fill="${PALETTE.waterFill}" stroke="${PALETTE.water}" stroke-width="1"/>${drawDimension(x + tubeW + 18, yMen, x + tubeW + 18, yFree, `h = ${num(hJurin)} m`, { side: -1 })}${t(250, 80, `d = ${num(d.d)} mm`)}${t(250, 108, `θ = ${num(d.theta)}°`)}${t(250, 136, `σ = ${num(d.sigma)} N/m`)}${t(48, 142, "surface libre")}`)
    };
  },

  laplace(d) {
    const bubble = +d.factor === 4;
    return {
      caption: bubble ? "Bulle de savon : deux interfaces, Δp = 4σ/R." : "Goutte : une seule interface, Δp = 2σ/R. Plus R est petit, plus la surpression est grande.",
      svg: svg(bubble ? "Bulle de savon" : "Goutte", `<circle cx="200" cy="120" r="62" fill="${PALETTE.waterFill}" stroke="${PALETTE.water}" stroke-width="3"/>${bubble ? `<circle cx="200" cy="120" r="52" fill="none" stroke="${PALETTE.water}" stroke-width="2"/>` : ""}${drawDimension(200, 120, 262, 120, `R = ${num(d.radius)} µm`, { side: -1 })}${drawVector(262, 88, 36, 0, "pressure", "Δp")}${t(330, 120, bubble ? "2 interfaces" : "1 interface")}${t(330, 150, `Δp = ${+d.factor || 2}σ/R`)}`)
    };
  },

  idealGas(d) {
    const extra = Number.isFinite(d.volumeL)
      ? `${t(330, 180, `𝒱 = ${num(d.volumeL)} L`)}`
      : "";
    return {
      caption: Number.isFinite(d.volumeL)
        ? "Bouteille d’air comprimé : ρ = p/(RT), m = ρ𝒱, puis 𝒱₂ = 𝒱₁ p₁/p₂ à T constante."
        : "Gaz parfait : la masse volumique se déduit de p et T absolues, ρ = p/(RT). Pas besoin de « voir » les molécules.",
      svg: svg("Récipient de gaz", `<rect x="90" y="50" width="200" height="130" rx="8" fill="#e0f2fe" stroke="#64748b" stroke-width="3.5"/><circle cx="290" cy="70" r="18" fill="#fff" stroke="${PALETTE.pressure}" stroke-width="2"/>${t(282, 75, "p", `fill="${PALETTE.pressure}"`)}<rect x="168" y="36" width="44" height="18" fill="#fff" stroke="#64748b" stroke-width="2"/>${t(176, 50, "T")}${t(330, 90, `T = ${num(d.temp)} °C`)}${t(330, 120, `p = ${num(d.pressure)} bar`)}${t(330, 150, `R = ${num(d.R)} J/(kg·K)`)}${extra}${t(120, 210, "air — équation d’état")}`)
    };
  },

  pressureDepth(d) {
    return {
      caption: "Hydrostatique : en descendant de h, la pression relative augmente de ρgh. L’absolue ajoute pₐₜₘ.",
      svg: svg("Plongeur en profondeur", `${drawWaterSurface(40, 48, 360, 150)}${t(48, 38, "surface libre · pₐₜₘ")}<circle cx="230" cy="168" r="13" fill="${PALETTE.pressure}"/>${drawDimension(250, 48, 250, 168, `h = ${num(d.h)} m`, { side: -1 })}${t(270, 175, "plongeur · p")}${t(420, 80, `ρ = ${num(d.rho)} kg/m³`)}`)
    };
  },

  layeredPressure(d) {
    const hO = Math.max(+d.hOil || 1.5, 0.2), hW = Math.max(+d.hWater || 2.4, 0.2);
    const rhoO = +d.rhoOil || 810, rhoW = +d.rhoWater || 1000;
    const yFree = 40, bed = 210, sc = (bed - yFree) / (hO + hW);
    const yInt = yFree + hO * sc;
    const pI = rhoO * Gfig * hO, pF = pI + rhoW * Gfig * hW;
    const pScale = 90 / pF, xW = 362;
    return {
      caption: "Deux fluides : la pression est continue à l’interface, mais la pente du diagramme change (ρhuile ≠ ρeau).",
      svg: svg("Réservoir à deux couches", `${hatch(118, 28, 14, 190)}<path d="M132 28v190h230" fill="none" stroke="#334155" stroke-width="6"/>${oil(`M132 ${yFree}h230v${yInt - yFree}H132z`)}${drawWaterSurface(132, yInt, 230, bed - yInt, { symbol: false })}${drawPressureDiagram(xW, yFree, yInt - yFree, 0, pI * pScale)}${drawPressureDiagram(xW, yInt, bed - yInt, pI * pScale, pF * pScale)}${drawDimension(400, yFree, 400, yInt, `huile ${num(d.hOil)} m`)}${drawDimension(430, yInt, 430, bed, `eau ${num(d.hWater)} m`)}${t(150, yInt - 6, "interface · pᵢ")}${t(150, bed - 12, "fond · p_f")}`)
    };
  },

  manometer(d) {
    if (Number.isFinite(d.zConnect)) {
      const dh = Math.max(+d.h || 0.2, 0.05), zA = +d.zConnect || 0.4;
      const sc = 90 / Math.max(dh, zA, 0.3);
      const yA = 36, yB = 20;
      const yHgHigh = 92, yHgLow = yHgHigh + dh * sc;
      return {
        caption: "Les axes A et B ne sont pas à la même cote. On chemine : descente dans l’eau, montée dans le mercure, remontée vers B. Δh se cote entre les deux ménisques.",
        svg: svg("Manomètre différentiel décalé", `<path d="M90 ${yA}v24h70" fill="none" stroke="#64748b" stroke-width="10"/><path d="M430 ${yB}v40h-70" fill="none" stroke="#64748b" stroke-width="10"/><path d="M160 60v80q0 28 28 28h184q28 0 28-28V60" fill="none" stroke="#475569" stroke-width="16"/><path d="M168 ${yHgLow}v${168 - yHgLow}q0 16 18 16h184q18 0 18-16V${yHgHigh}" fill="none" stroke="#d97706" stroke-width="10"/>${drawDimension(40, yA, 40, 60, `A`, { side: -1 })}${drawDimension(500, yB, 500, 60, `B +${num(d.dzAB)} m`, { side: -1 })}${drawDimension(455, yHgHigh, 455, yHgLow, `Δh = ${num(d.h)} m`, { side: -1 })}${t(48, 28, "p_A")}${t(400, 16, "p_B")}${t(240, 188, "mercure")}${t(150, 230, `raccord A : ${num(d.zConnect)} m`)}`)
      };
    }
    const h = Math.max((+d.h || 80) / 1000, 0.02);
    const drop = clamp(h * 400, 18, 56);
    return {
      caption: "Manomètre en U à la même cote : p₁ − p₂ = (ρₘ − ρ)gΔh. Le mercure est plus bas du côté de la plus forte pression. Δh se cote entre les ménisques.",
      svg: svg("Manomètre différentiel", `<path d="M70 40v20h80" fill="none" stroke="#64748b" stroke-width="10"/><path d="M410 40v20h-80" fill="none" stroke="#64748b" stroke-width="10"/><path d="M150 60v70q0 28 28 28h204q28 0 28-28V60" fill="none" stroke="#475569" stroke-width="16"/><path d="M158 ${118 + drop / 2}v${16}q0 18 20 18h204q20 0 20-18V${86 - drop / 2}" fill="none" stroke="#d97706" stroke-width="10"/>${drawDimension(430, 86 - drop / 2, 430, 134 + drop / 2, `Δh = ${num(d.h)} mm`, { side: -1 })}${t(40, 32, "prise 1 · p₁")}${t(400, 32, "prise 2 · p₂")}${t(240, 175, "mercure")}${t(200, 220, "eau")}`)
    };
  },

  hydraulicPress(d) {
    const d1 = +d.dSmall || 20, d2 = +d.dBig || 80;
    const w1 = clamp(d1 / d2 * 90, 22, 50), w2 = clamp(d2 / d1 * 18, 70, 130);
    return {
      caption: "Principe de Pascal : F₁/A₁ = F₂/A₂. Le grand piston est nettement plus large ; les forces sont proportionnelles aux surfaces.",
      svg: svg("Presse hydraulique", `${drawWaterSurface(80, 150, 400, 40)}<rect x="${136 - w1 / 2}" y="70" width="${w1}" height="80" fill="#64748b" stroke="#0f172a" stroke-width="2"/><rect x="${395 - w2 / 2}" y="48" width="${w2}" height="102" fill="#475569" stroke="#0f172a" stroke-width="2"/>${drawVector(136, 48, 0, -20, "force", `F₁ · d = ${num(d.dSmall)} mm`)}${drawVector(395, 48, 0, -36, "force", `F₂ = ${num(d.load)} N`)}${t(200, 220, `D₂ = ${num(d.dBig)} mm`)}`)
    };
  },

  bargeStability(d) {
    const Te = Math.max(0.3, +d.draft || 1.2), zG = +d.zG || 1.5;
    const L = +d.L || 14, B = +d.B || 6;
    const zB = Te / 2, vol = L * B * Te, BM = (L * B ** 3 / 12) / vol, zM = zB + BM, GM = zM - zG;
    const keel = 208, span = Math.max(Te, zG, zM, 0.8) * 1.25;
    const sc = 150 / span;
    const yK = keel, yWL = keel - Te * sc, yTop = Math.min(yWL - 18, keel - span * sc);
    const yB = keel - zB * sc, yG = keel - zG * sc, yM = keel - zM * sc;
    return {
      caption: "Stabilité initiale : B à Tₑ/2 depuis la quille, M = B + I/∇. Stable si M est au-dessus de G (GM > 0).",
      svg: svg("Stabilité d’une barge", `${drawWaterSurface(40, yWL, 480, 242 - yWL)}<rect x="130" y="${yTop}" width="280" height="${keel - yTop}" fill="#cbd5e1" stroke="#334155" stroke-width="3"/>${line(270, yTop - 8, 270, keel + 4, "#64748b", 1.2, 'stroke-dasharray="4 3"')}${dot(270, yB, PALETTE.hgl)}${t(280, yB + 4, "B")}${dot(270, yG, PALETTE.force)}${t(280, yG + 4, "G")}${dot(270, yM, PALETTE.velocity)}${t(280, yM + 4, "M")}${drawDimension(120, yWL, 120, yK, `Tₑ = ${num(d.draft)} m`, { side: -1 })}${drawDimension(430, yG, 430, yM, `GM = ${num(GM)} m`)}${t(140, yTop - 10, `L = ${num(d.L)} m · B = ${num(d.B)} m`)}${t(140, 236, `z_B = Tₑ/2 · z_G = ${num(d.zG)} m · ${GM > 0 ? "stable" : "instable"}`)}`)
    };
  },

  planeForce(d) {
    const H = Math.max(+d.H || 4, 0.5);
    const ch = isoChannel({ b: Math.max(+d.b || 1, 0.8), y: H, z: 0 }, { L: 4.2, s: 22, ox: 36, oy: 228, wall: H * 1.08 });
    const pBot = 90;
    const yFree = 48, bed = 200, sc = (bed - yFree) / H;
    const yF = bed - (H / 3) * sc;
    return {
      caption: "Bassin prismatique : triangle des pressions d’amplitude ρgH. F s’applique à H/3 du pied (2H/3 sous la surface).",
      svg: svg("Mur de réservoir", `${ch.body}${drawPressureDiagram(430, yFree, bed - yFree, 0, pBot)}${drawDimension(510, yFree, 510, bed, `H = ${num(d.H)} m`, { side: -1 })}${drawVector(400, yF, 28, 0, "force", "F · H/3")}${t(40, 36, `b = ${num(d.b)} m · yₚ = 2H/3`)}`)
    };
  },

  submergedGate(d) {
    const y0 = Math.max(+d.y0 || 0, 0.05), H = Math.max(+d.H || 1, 0.05);
    const yc = y0 + H / 2, area = 1 * H, ig = H ** 3 / 12, yp = yc + ig / (area * yc);
    const yFree = 36, bed = 210, sc = (bed - yFree) / (y0 + H);
    const yTop = yFree + y0 * sc, yBot = yFree + (y0 + H) * sc, yG = yFree + yc * sc, yP = yFree + yp * sc;
    const pScale = 72 / (y0 + H), wTop = y0 * pScale, wBot = (y0 + H) * pScale;
    return {
      caption: "Vanne entièrement immergée : ȳ et yₚ se comptent verticalement depuis la surface libre. P est sous G.",
      svg: svg("Vanne immergée", `${drawWaterSurface(50, yFree, 280, bed - yFree)}${hatch(330, yFree - 8, 20, bed - yFree + 16)}<rect x="318" y="${yTop}" width="24" height="${H * sc}" fill="#475569" stroke="#0f172a" stroke-width="2"/>${drawPressureDiagram(318, yTop, yBot - yTop, wTop, wBot, { dir: -1 })}${drawDimension(370, yFree, 370, yTop, `y₀ = ${num(d.y0)} m`, { side: -1 })}${drawDimension(400, yTop, 400, yBot, `a = ${num(d.H)} m`, { side: -1 })}${drawDimension(52, yFree, 52, yG, `ȳ = ${num(yc)} m`)}${dot(330, yG, "#fff")}${t(230, yG + 4, "G")}${dot(330, yP, PALETTE.force)}${t(230, yP + 16, "P", `fill="${PALETTE.force}"`)}`)
    };
  },

  circularGate(d) {
    const yc = Math.max(+d.yc || 2, 0.4), D = Math.max(+d.D || 1, 0.2);
    const yp = yc + D ** 2 / (16 * yc);
    const yFree = 36, sc = 155 / Math.max(yc + D / 2, 1);
    const yG = yFree + yc * sc, yP = yFree + yp * sc, r = (D / 2) * sc;
    const bed = Math.max(yG + r + 8, 210);
    return {
      caption: "Disque vertical : F passe par le centre de poussée P, strictement sous le centre géométrique G (yₚ > ȳ). Les deux cotes sont verticales depuis la surface.",
      svg: svg("Vanne circulaire", `${drawWaterSurface(40, yFree, 300, bed - yFree)}${hatch(340, yFree - 8, 22, bed - yFree + 16)}<circle cx="250" cy="${yG}" r="${r}" fill="#64748b" stroke="#0f172a" stroke-width="3"/>${drawDimension(370, yFree, 370, yG, `ȳ = ${num(d.yc)} m`, { side: -1 })}${drawDimension(410, yFree, 410, yP, `yₚ = ${num(yp)} m`, { side: -1 })}${t(400, yG + r + 16, `D = ${num(d.D)} m`)}${t(242, yG + 4, "G", 'fill="#fff"')}${dot(250, yP, PALETTE.force)}${t(258, yP + 14, "P", `fill="${PALETTE.force}"`)}`)
    };
  },
  inclinedCircularGate(d) {
    const alphaDeg = +d.alpha || 60, alpha = (alphaDeg * Math.PI) / 180;
    const hG = Math.max(+d.hG || 2, 0.3), D = Math.max(+d.D || 1, 0.2);
    const yGwall = hG / Math.sin(alpha);
    const yFree = 36, sc = 140 / Math.max(hG + D / 2, 1.2);
    const x0 = 200;
    const xG = x0 + (hG / Math.tan(alpha)) * sc, yG = yFree + hG * sc;
    const x1 = x0 + 210 * Math.cos(alpha), y1 = yFree + 210 * Math.sin(alpha);
    const r = Math.min((D / 2) * sc, 40);
    const s1 = Math.max((yGwall - D / 2) * sc, 4), s2 = (yGwall + D / 2) * sc;
    const nx = Math.sin(alpha), ny = -Math.cos(alpha);
    const ax = (s) => x0 + s * Math.cos(alpha), ay = (s) => yFree + s * Math.sin(alpha);
    const hTop = Math.max(hG - (D / 2) * Math.sin(alpha), 0.05), hBot = hG + (D / 2) * Math.sin(alpha);
    const pSc = 36 / hBot;
    const ox = nx * 22, oy = ny * 22;
    return {
      caption: "Paroi inclinée : h_G est une cote verticale depuis la surface ; y_G = h_G / sin α se mesure le long de la paroi. Le trapèze des pressions suit le disque.",
      svg: svg("Vanne circulaire inclinée", `${drawWaterSurface(40, yFree, 280, 174, { symbol: true })}<path d="M${x0} ${yFree}L${x1} ${y1}" stroke="#334155" stroke-width="16" stroke-linecap="round"/><g transform="translate(${x0} ${yFree}) rotate(${alphaDeg - 90})">${drawPressureDiagram(0, s1, s2 - s1, hTop * pSc, hBot * pSc, { dir: -1 })}</g><circle cx="${xG}" cy="${yG}" r="${r}" fill="#64748b" stroke="#0f172a" stroke-width="3"/>${drawDimension(90, yFree, 90, yG, `h_G = ${num(d.hG)} m`, { side: -1 })}${drawDimension(ax(0) + ox, ay(0) + oy, ax(yGwall * sc) + ox, ay(yGwall * sc) + oy, `y_G = ${num(yGwall)} m`)}${t(xG + r + 8, yG - 8, "G")}${t(380, 70, `α = ${num(d.alpha)}°`)}${t(380, 100, `D = ${num(d.D)} m`)}`)
    };
  },
  quarterCylinder(d) {
    const px = 140, cx = 280, cy = 180, yFree = 40;
    const xLeft = cx - px;
    const yFH = cy - px / 3;
    const xFV = xLeft + 0.38 * px, yFV = yFree + 0.22 * px;
    const xR = cx - px * 0.71, yR = cy - px * 0.71;
    return {
      caption: "F_H sur la projection verticale (à R/3 du radier) ; F_V = poids du volume d’eau au-dessus, vers le bas. La résultante s’applique sur la paroi courbe.",
      svg: svg("Vanne quart de cylindre", `<path d="M${xLeft} ${yFree}H${cx}A${px} ${px} 0 0 1 ${xLeft} ${cy}V${yFree}z" fill="${PALETTE.waterFill}" stroke="${PALETTE.water}" stroke-width="2"/>${line(xLeft, yFree, cx, yFree, PALETTE.water, 2.2)}<path d="M${cx} ${yFree}A${px} ${px} 0 0 1 ${xLeft} ${cy}H${cx}z" fill="#94a3b8" stroke="#334155" stroke-width="2"/>${hatch(xLeft - 8, cy, px + 16, 18)}${drawVector(cx, yFH, 90, 0, "force", "F_H")}${drawVector(xFV, yFV, 0, 72, "force", "F_V")}${dot(xR, yR, PALETTE.force)}${t(xR + 10, yR - 6, "R")}${drawDimension(cx + 16, yFree, cx + 16, cy, `R = ${num(d.R)} m`)}${t(90, 230, `b = ${num(d.b)} m · 𝒱 = R²(1−π/4)b`)}`)
    };
  },
  archimedesCaisson(d) {
    const Hbox = Math.max(+d.Hbox || 2, 0.4);
    const Te = (+d.W || 80) * 1000 / (Math.max(+d.rho || 1025, 900) * Gfig * Math.max(+d.L || 8, 1) * Math.max(+d.B || 4, 1));
    const keel = 210, sc = 110 / Math.max(Hbox, Te, 0.5);
    const yTop = keel - Hbox * sc, yWL = keel - Math.min(Te, Hbox) * sc;
    return {
      caption: "À gauche : bloc immergé, poids apparent. À droite : caisson, tirant Tₑ = W/(ρgLB) sous la flottaison, distinct de la hauteur de caisse H.",
      svg: svg("Bloc immergé et caisson", `${drawWaterSurface(40, 70, 220, 140)}<rect x="110" y="110" width="70" height="50" fill="#94a3b8" stroke="#334155" stroke-width="2"/>${t(100, 100, "bloc")}${drawWaterSurface(300, yWL, 220, keel - yWL)}<rect x="330" y="${yTop}" width="160" height="${keel - yTop}" fill="#cbd5e1" stroke="#334155" stroke-width="3"/>${drawDimension(500, yWL, 500, keel, `Tₑ = ${num(Te)} m`, { side: -1 })}${t(340, yTop - 10, `H = ${num(d.Hbox)} m`)}${t(48, 58, "eau douce")}${t(310, 230, `L×B = ${num(d.L)}×${num(d.B)} m · mer`)}`)
    };
  },

  pipeContinuity(d) {
    return {
      caption: "Une seule conduite actuelle : on calcule V = Q/A, puis le diamètre qui donnerait la vitesse cible. Ce n’est pas un réducteur.",
      svg: svg("Conduite circulaire", `<path d="M40 90h300v70H40z" fill="${PALETTE.waterFill}" stroke="${PALETTE.water}" stroke-width="4"/>${flow("M60 125h250")}${drawVector(70, 108, 90, 0, "velocity", `V actuelle`)}${t(50, 78, `D = ${num(d.D)} mm`)}${t(50, 188, `Q = ${num(d.Q)} L/s`)}<circle cx="450" cy="125" r="38" fill="none" stroke="${PALETTE.velocity}" stroke-width="2.4" stroke-dasharray="7 5"/>${t(400, 78, `D cible`, `fill="${PALETTE.velocity}"`)}${t(392, 188, `V = ${num(d.targetV)} m/s`, `fill="${PALETTE.velocity}"`)}`)
    };
  },

  twoSectionContinuity(d) {
    return {
      caption: "Tube de courant : Q = A₁V₁ = A₂V₂. Diviser le diamètre par 2 multiplie la vitesse par 4.",
      svg: svg("Continuité entre deux sections", `<path d="M30 70h190l90 28h220v54H310l-90 28H30z" fill="${PALETTE.waterFill}" stroke="${PALETTE.water}" stroke-width="3.5"/>${flow("M50 125h430")}${drawVector(60, 100, 70, 0, "velocity", "V₁")}${drawVector(380, 100, 110, 0, "velocity", "V₂")}${t(50, 58, `1 · D₁ = ${num(d.D1)} mm`)}${t(340, 58, `2 · D₂ = ${num(d.D2)} mm`)}${t(190, 210, `Q = ${num(d.Q)} L/s  ·  A₁V₁ = A₂V₂`)}`)
    };
  },

  networkNode(d) {
    return {
      caption: "Loi des nœuds : aucun stockage. Q₁ + Q₂ = Q₃ + Qᵦ.",
      svg: svg("Nœud de réseau", `${line(30, 70, 250, 120, PALETTE.water, 14)}${line(30, 180, 250, 130, PALETTE.water, 14)}${line(270, 125, 520, 70, PALETTE.water, 14)}${line(270, 130, 400, 210, PALETTE.water, 12)}<circle cx="260" cy="125" r="16" fill="#075985"/>${drawVector(60, 85, 70, 16, "velocity", "Q₁")}${drawVector(60, 165, 70, -14, "velocity", "Q₂")}${drawVector(300, 110, 90, -20, "velocity", "Q₃")}${t(410, 230, `Qᵦ = ${num(d.Qbranch)} L/s`)}${t(200, 40, `D₁ = ${num(d.D1)} mm`)}`)
    };
  },

  convectiveAcceleration(d) {
    const V1 = +d.V1 || 1, V2 = +d.V2 || 3;
    const arrows = [0, 1, 2, 3, 4].map(i => {
      const x = 60 + i * 90, len = 24 + (V1 + (V2 - V1) * i / 4) * 10;
      return drawVector(x, 110, len, 0, "velocity");
    }).join("");
    return {
      caption: "Régime permanent : ∂V/∂t = 0, mais la particule accélère dans le convergent. Les flèches allongent de V₁ à V₂.",
      svg: svg("Convergent", `<path d="M30 48h170l210 36h120v50H410l-210 36H30z" fill="${PALETTE.waterFill}" stroke="${PALETTE.water}" stroke-width="3.5"/>${arrows}${t(40, 36, `V₁ = ${num(d.V1)} m/s`)}${t(400, 36, `V₂ = ${num(d.V2)} m/s`)}${drawDimension(30, 200, 530, 200, `L = ${num(d.L)} m`, { side: -1 })}${t(210, 230, "a = V · dV/dx")}`)
    };
  },

  reservoirRise(d) {
    return {
      caption: "Bilan de volume sur le réservoir : A dh/dt = Qₑ − Qₛ. La surface libre monte si l’alimentation dépasse la vidange.",
      svg: svg("Remplissage d’un réservoir", `${hatch(88, 28, 16, 190)}<path d="M104 28v190h220V28" fill="none" stroke="#334155" stroke-width="6"/>${drawWaterSurface(104, 92, 220, 126)}<path d="M104 68h220" stroke="${PALETTE.water}" stroke-width="2" stroke-dasharray="6 4"/>${flow("M30 70h74")}${flow("M324 190h90")}${drawDimension(350, 68, 350, 92, "Δh", { side: -1 })}${t(36, 58, "Qₑ")}${t(420, 186, "Qₛ")}${t(120, 230, `D = ${num(d.D)} m`)}`)
    };
  },

  tankFilling(d) {
    return {
      caption: "On impose un temps de remplissage et une vitesse maximale dans la conduite d’amenée — il n’y a pas de vidange ici.",
      svg: svg("Conduite de remplissage", `${hatch(200, 36, 16, 180)}<path d="M216 36v180h200V36" fill="none" stroke="#334155" stroke-width="6"/>${drawWaterSurface(216, 100, 200, 116)}${flow("M40 150h176")}${t(48, 130, `conduite`)}${t(48, 230, `𝒱 = ${num(d.volume)} m³ en ${num(d.hours)} h`)}${t(250, 88, `V ≤ ${num(d.maxV)} m/s`)}`)
    };
  },

  distributedFlow(d) {
    const taps = [90, 165, 240, 315, 390, 465].map((x, i) =>
      drawVector(x, 90, 0, 28 + i * 6, "velocity")
    ).join("");
    return {
      caption: "Service en route : le débit décroît linéairement, Q(x) = Qₑ − qx. Les petites flèches sont le prélèvement linéique q.",
      svg: svg("Conduite à débit réparti", `<path d="M40 90h480" stroke="#475569" stroke-width="18"/>${flow("M50 90h400")}${taps}${t(40, 70, `Qₑ = ${num(d.Qin)} L/s`)}${t(400, 70, `Qₛ = ${num(d.Qout)} L/s`)}${drawDimension(40, 210, 520, 210, `L = ${num(d.L)} m`, { side: -1 })}${t(200, 240, "q uniforme vers le bas")}`)
    };
  },

  venturi(d) {
    const byPressure = Number.isFinite(+d.dpK);
    return {
      caption: byPressure
        ? "Venturi horizontal : le col accélère le fluide et abaisse p₂. Ici p₁ − p₂ est donné directement."
        : "Venturi horizontal : le col accélère le fluide et abaisse p₂. Le U au mercure mesure p₁ − p₂.",
      svg: svg("Tube de Venturi", `<path d="M20 40h150l70 32h70l70-32h150v64H380l-70 32h-70l-70-32H20z" fill="${PALETTE.waterFill}" stroke="${PALETTE.water}" stroke-width="3"/>${flow("M40 72h460")}${t(30, 30, `1 · D₁ = ${num(d.D1)} mm`)}${t(230, 86, `2 · D₂ = ${num(d.D2)} mm`)}${byPressure ? `${t(160, 230, `p₁ − p₂ = ${num(d.dpK)} kPa`)}` : `<path d="M90 104v36h260v-20" fill="none" stroke="#475569" stroke-width="8"/><path d="M98 132h140v8H98z" fill="#d97706"/><path d="M250 116h92v24H250z" fill="#d97706"/>${drawDimension(400, 116, 400, 140, `Δh = ${num(d.h)} mm`, { side: -1 })}${t(160, 230, "mercure")}`}`)
    };
  },

  torricelli(d) {
    return {
      caption: "Grande section, orifice à l’air libre : Bernoulli se réduit à Torricelli. Cᵈ corrige la contraction du jet.",
      svg: svg("Vidange par orifice", `${hatch(48, 28, 16, 180)}<path d="M64 28v180h200V28" fill="none" stroke="#334155" stroke-width="6"/>${drawWaterSurface(64, 56, 200, 152)}<path d="M264 168q80 8 180 48" fill="none" stroke="${PALETTE.water}" stroke-width="7"/>${drawDimension(280, 56, 280, 168, `h = ${num(d.h)} m`, { side: -1 })}${t(300, 160, `V = Cᵈ√(2gh)`)}${t(300, 230, `d = ${num(d.d)} mm · Cᵈ = ${num(d.Cd)}`)}`)
    };
  },

  bernoulliSections(d) {
    const D1 = (+d.D1 || 300) / 1000, D2 = (+d.D2 || 200) / 1000, Q = (+d.Q || 80) / 1000;
    const V1 = Q / (Math.PI * D1 * D1 / 4), V2 = Q / (Math.PI * D2 * D2 / 4);
    const hv1 = V1 * V1 / (2 * Gfig), hv2 = V2 * V2 / (2 * Gfig);
    const z1 = +d.z1 || 0, z2 = +d.z2 || 2.5, p1 = (+d.p1 || 150) * 1000, rho = +d.rho || 1000;
    const HGL1 = z1 + p1 / (rho * Gfig), EGL = HGL1 + hv1, HGL2 = EGL - hv2;
    const yAxis = 210, hMax = Math.max(EGL, z2, 4);
    const Y = h => headY(h, hMax, yAxis, 150);
    const x1 = 90, x2 = 420;
    const stations = [
      { x: x1, egl: Y(EGL), hgl: Y(HGL1), mark: true },
      { x: 220, egl: Y(EGL), hgl: Y(HGL1) },
      { x: 310, egl: Y(EGL), hgl: Y(HGL2) },
      { x: x2, egl: Y(EGL), hgl: Y(HGL2), mark: true }
    ];
    return {
      caption: "Fluide parfait : EGL est horizontale. HGL = EGL − V²/2g s’abaisse au rétrécissement (Venturi) et suit aussi z.",
      svg: svg("Conduite avec dénivelée", `<path d="M24 150h170l90-50h250v48H284l-90 50H24z" fill="${PALETTE.waterFill}" stroke="${PALETTE.water}" stroke-width="3.2"/>${flow("M40 174h190l90-50h200")}${drawEnergyLines(stations)}${t(30, 130, `1 · z₁ = ${num(d.z1)} m`)}${t(30, 230, `p₁ = ${num(d.p1)} kPa · D₁ = ${num(d.D1)} mm`)}${t(340, 58, `2 · z₂ = ${num(d.z2)} m`)}${t(340, 230, `D₂ = ${num(d.D2)} mm`)}${t(100, Y(EGL) - 8, "EGL", `fill="${PALETTE.egl}"`)}${t(100, Y(HGL1) + 14, "HGL", `fill="${PALETTE.hgl}"`)}`)
    };
  },

  drainTime(d) {
    return {
      caption: "Niveau variable : −A dh/dt = Cᵈ a √(2gh). Le jet en mince paroi se contracte (veine de vena contracta, Cᵈ).",
      svg: svg("Temps de vidange", `${hatch(70, 24, 16, 190)}<path d="M86 24v190h200V24" fill="none" stroke="#334155" stroke-width="6"/>${drawWaterSurface(86, 100, 200, 114)}<path d="M86 58h200" stroke="${PALETTE.water}" stroke-width="2" stroke-dasharray="6 4"/><path d="M286 200c8 0 14 4 16 12c2 10-6 18-16 22" fill="none" stroke="${PALETTE.water}" stroke-width="7"/>${flow("M304 214h110")}${drawDimension(310, 58, 310, 100, "h₁ → h₂", { side: -1 })}${t(330, 160, `Cᵈ = ${num(d.Cd)}`)}${t(330, 184, `orifice ${num(d.orificeD)} mm`)}${t(100, 48, "h₁")}${t(100, 92, "h₂")}`)
    };
  },

  pitot(d) {
    return {
      caption: "Pitot-statique à manomètre différentiel : le mercure (fluide dense) mesure p₀ − p. Ce n’est pas une colonne d’eau ouverte.",
      svg: svg("Tube de Pitot au mercure", `<path d="M20 70h360v50H20z" fill="${PALETTE.waterFill}" stroke="${PALETTE.water}" stroke-width="3"/>${flow("M40 95h120")}${drawVector(40, 78, 80, 0, "velocity", "V")}<path d="M200 95h130l36-36h70" fill="none" stroke="#334155" stroke-width="7"/><path d="M200 108h40" stroke="#334155" stroke-width="3"/>${t(30, 58, "statique · p")}${t(330, 48, "arrêt · p₀")}<path d="M436 59v70h70" fill="none" stroke="#d97706" stroke-width="7"/><path d="M444 129h54v18H444z" fill="#d97706"/>${drawDimension(530, 59, 530, 129, `Δh = ${num(d.h)} mm`, { side: -1 })}${t(430, 170, "Hg · p₀ − p = (ρₘ − ρ)gΔh")}`)
    };
  },

  siphon(d) {
    return {
      caption: "Points A (surface), C (sommet) et S (sortie à l’air). La dépression en C vaut ρg(z_C + V²/2g) ; c’est là que la cavitation menace.",
      svg: svg("Siphon", `${hatch(36, 70, 14, 140)}<path d="M50 70v140h150V90" fill="none" stroke="#334155" stroke-width="5"/>${drawWaterSurface(50, 100, 150, 110)}<path d="M170 108c70-70 150-70 170 8v84" fill="none" stroke="#475569" stroke-width="12"/>${flow("M170 108c70-70 150-70 170 8v70")}${t(70, 92, "A")}${t(300, 28, `C · z_C = ${num(d.rise)} m`)}${t(400, 220, `S · Δz = ${num(d.drop)} m`)}${t(60, 230, "réservoir")}`)
    };
  },

  hydraulicPower(d) {
    const Hg = +d.head || 35, losses = +d.losses || 0, HMT = Hg + losses;
    const hAsp = losses * 0.3, hv = Math.max(HMT * 0.05, 1.2);
    const yBed = 210, hMax = Math.max(HMT, Hg, 1);
    const Y = h => headY(h, hMax, yBed, 150);
    const yLow = Y(0), yHigh = Y(Hg);
    const eglIn = -hAsp, eglOut = eglIn + HMT;
    const yPump = (Y(eglIn) + Y(eglOut)) / 2;
    const hLow = Math.max(32, Math.min(yBed - yLow, 56));
    const hHigh = Math.max(28, Math.min(yBed - yHigh, 48));
    const stations = [
      { x: 50, egl: yLow, hgl: yLow },
      { x: 176, egl: yLow, hgl: yLow },
      { x: 250, egl: Y(eglIn), hgl: Y(eglIn - hv) },
      { x: 250, egl: Y(eglOut), hgl: Y(eglOut - hv) },
      { x: 310, egl: Y(eglOut), hgl: Y(eglOut - hv), mark: true },
      { x: 380, egl: yHigh, hgl: yHigh },
      { x: 500, egl: yHigh, hgl: yHigh }
    ];
    return {
      caption: "Bernoulli généralisé entre deux surfaces libres : la pompe relève EGL d’un saut égal à la HMT = H_g + pertes.",
      svg: svg("Pompage entre réservoirs", `${drawWaterSurface(36, yLow, 140, hLow)}${drawWaterSurface(380, yHigh, 140, hHigh)}${hatch(36, yLow + hLow, 140, 12)}${hatch(380, yHigh + hHigh, 140, 12)}<path d="M176 ${yLow + 22}h50V${yPump}H306" fill="none" stroke="#475569" stroke-width="9"/><circle cx="250" cy="${yPump}" r="20" fill="#075985"/>${t(243, yPump + 5, "P", 'fill="#fff"')}${drawEnergyLines(stations)}${t(50, yLow - 10, "puits")}${t(390, yHigh - 10, `H_g = ${num(d.head)} m`)}${drawDimension(268, Y(eglOut), 268, Y(eglIn), `+HMT = ${num(HMT)} m`)}${t(160, 236, `Q = ${num(d.Q)} L/s · η = ${num(d.efficiency)}`)}${t(70, Y(eglOut) - 8, "EGL", `fill="${PALETTE.egl}"`)}${t(318, Y(eglOut - hv) + 14, "HGL", `fill="${PALETTE.hgl}"`)}`)
    };
  },

  jetPlate(d) {
    return {
      caption: "Plaque fixe normale au jet : après l’impact, la composante axiale de V s’annule. F = ρQV sur la plaque.",
      svg: svg("Jet sur plaque", `${flow("M30 120h250")}${hatch(300, 40, 16, 160)}<path d="M300 112q70-8 110-60M300 128q70 8 110 60" fill="none" stroke="${PALETTE.water}" stroke-width="10"/>${drawVector(298, 120, -88, 0, "force", "F = ρQV")}${drawVector(40, 96, 80, 0, "velocity", `V = ${num(d.V)} m/s`)}${t(70, 210, `d = ${num(d.d)} mm`)}`)
    };
  },

  jetDeflect(d) {
    const th = ((+d.theta || 135) * Math.PI) / 180;
    const x2 = 290 + 130 * Math.cos(th), y2 = 120 - 130 * Math.sin(th);
    return {
      caption: "L’auget dévie le jet d’un angle θ sans changer |V|. La force suit |ΔV⃗| = 2V sin(θ/2).",
      svg: svg("Jet dévié par un auget", `${flow("M20 120h250")}<path d="M270 120L${x2} ${y2}" fill="none" stroke="${PALETTE.water}" stroke-width="14" stroke-linecap="round"/><path d="M268 92q40 28 40 28q0 0-40 28" fill="none" stroke="#334155" stroke-width="10"/>${drawVector(270, 120, -70, 55, "force", "F")}${t(40, 96, `V = ${num(d.V)} m/s`)}${t(300, 40, `θ = ${num(d.theta)}°`)}${t(160, 220, "force sur l’auget")}`)
    };
  },

  colebrook(d) {
    return moodyChart(d);
  },
  moodyRead(d) {
    return moodyChart(d);
  },

  minorLosses(d) {
    const stations = [
      { x: 40, egl: 70, hgl: 88 },
      { x: 90, egl: 70, hgl: 88 },
      { x: 100, egl: 86, hgl: 104 },
      { x: 230, egl: 86, hgl: 104 },
      { x: 240, egl: 104, hgl: 122 },
      { x: 330, egl: 104, hgl: 122 },
      { x: 340, egl: 122, hgl: 140 },
      { x: 470, egl: 122, hgl: 140 },
      { x: 490, egl: 148, hgl: 166 }
    ];
    return {
      caption: "Chaque singularité dissipe K V²/(2g). EGL (rouge) présente un cran à l’entrée, aux coudes, à la vanne et à la sortie ; HGL (bleu) reste sous EGL de V²/2g.",
      svg: svg("Pertes singulières", `<path d="M30 160h90l40-50h90l40 50h70l40-40h130" fill="none" stroke="#475569" stroke-width="16"/>${flow("M40 160h80l40-50h90l40 50h70l40-40h110")}${drawEnergyLines(stations, { gap: false })}${t(40, 200, "entrée")}${t(200, 90, `${num(d.nElbows)} coudes`)}${t(300, 200, "vanne")}${t(460, 90, "sortie")}${t(70, 58, "EGL", `fill="${PALETTE.egl}"`)}${t(70, 100, "HGL", `fill="${PALETTE.hgl}"`)}${t(160, 230, `D = ${num(d.D)} mm · Q = ${num(d.Q)} L/s`)}`)
    };
  },

  froudeSimilarity(d) {
    const N = Math.max(+d.N || 25, 2);
    const vis = Math.min(Math.sqrt(N), 3.2);
    const pw = 200, ph = 90, mw = pw / vis, mh = ph / vis;
    return {
      caption: "Même ouvrage, deux échelles. λL = N (schéma comprimé visuellement). Froude : λV = √N, λQ = N^(5/2).",
      svg: svg("Modèle et prototype", `<path d="M40 70h${pw}v${ph}H40z" fill="#e2e8f0" stroke="#334155" stroke-width="3"/>${drawWaterSurface(40, 70 + ph * 0.53, pw, ph * 0.47)}<path d="M90 70v${ph * 0.53}h40v-${ph * 0.53}" fill="#94a3b8"/><path d="M340 ${70 + ph - mh}h${mw}v${mh}H340z" fill="#e2e8f0" stroke="#334155" stroke-width="3"/>${drawWaterSurface(340, 70 + ph - mh * 0.47, mw, mh * 0.47)}${t(70, 58, "prototype")}${t(340, 62, `modèle 1/${num(d.N)}`)}${t(60, 220, "Vₚ, Qₚ")}${t(350, 220, `Vₘ = ${num(d.Vm)} m/s`)}`)
    };
  },

  manningChannel(d) {
    const ch = isoChannel({ b: d.b, y: d.y, z: 0 }, { L: 6.4, s: 19, ox: 40, oy: 224 });
    return {
      caption: "Prisme rectangulaire : A = b y, P = b + 2y (la surface libre n’entre pas dans P). Strickler sur la pente de fond.",
      svg: svg("Canal rectangulaire", `${ch.body}${t(36, 36, `y = ${num(d.y)} m · b = ${num(d.b)} m`)}${t(36, 56, `S = ${num(d.S)} ‰ · Kₛ = ${num(d.Ks)}`)}${t(320, 36, "P = b + 2y  ·  pas la surface")}`)
    };
  },

  jetMobile(d) {
    const Vrel = Math.max((+d.V || 20) - (+d.u || 8), 0);
    return {
      caption: "Auget en U : le jet ressort à 180°. Seule la vitesse relative V−u produit une force. P = F u est max pour u = V/3.",
      svg: svg("Auget mobile", `${flow("M20 120h210")}<path d="M230 78q70 0 70 42q0 42-70 42" fill="none" stroke="#334155" stroke-width="12"/><path d="M230 88q52 0 52 32q0 32-52 32" fill="none" stroke="${PALETTE.water}" stroke-width="10"/>${drawVector(300, 120, 90, 0, "velocity", `u = ${num(d.u)} m/s`)}${drawVector(40, 96, 70, 0, "velocity", `V = ${num(d.V)} m/s`)}${t(40, 130, `V − u = ${num(Vrel)} m/s`, `fill="${PALETTE.velocity}"`)}${t(40, 220, `${Number.isFinite(+d.d) ? `d = ${num(d.d)} mm` : `Q = ${num(d.Q)} L/s`} · u_opt = V/3`)}`)
    };
  },
  elbowForce(d) {
    const angle = Number.isFinite(+d.theta) ? +d.theta : 90;
    const th = (angle * Math.PI) / 180;
    const bis = th / 2;
    const fx = 330, fy = 100;
    const xF = fx + 70 * Math.cos(bis), yF = fy + 70 * Math.sin(bis);
    return {
      caption: `Coude à ${num(angle)}° : l’eau pousse vers l’extérieur. La résultante d’ancrage est sur la bissectrice extérieure θ/2.`,
      svg: svg(`Coude à ${num(angle)}°`, `<path d="M40 150h220q70 0 70-70V40" fill="none" stroke="#475569" stroke-width="28"/><path d="M40 150h220q48 0 48-48V40" fill="none" stroke="${PALETTE.water}" stroke-width="14"/>${flow("M50 150h180")}${drawVector(fx, fy, xF - fx, yF - fy, "force", "F")}${drawVector(fx, fy, 55, 0, "force", "Fₓ")}${drawVector(fx, fy, 0, 55, "force", "Fᵧ")}${t(50, 130, `p₁ = ${num(d.p1)} kPa`)}${t(50, 220, `D = ${num(d.D)} mm · θ = ${num(angle)}°`)}`)
    };
  },
  convergentForce(d) {
    return {
      caption: "Le fluide accélère, p diminue. L’effort axial sur le convergent vient des pressions de bride et de ρQ(V₂−V₁).",
      svg: svg("Convergent", `<path d="M40 70h200l120 40v30L240 180H40z" fill="${PALETTE.waterFill}" stroke="${PALETTE.water}" stroke-width="3"/>${flow("M50 125h280")}${t(60, 58, `D₁ = ${num(d.D1)} mm`)}${t(360, 58, `D₂ = ${num(d.D2)} mm`)}${t(60, 220, `p₁ = ${num(d.p1)} kPa · Q = ${num(d.Q)} L/s`)}${drawVector(200, 125, 0, 85, "force", "F vers l’aval")}`)
    };
  },
  jetReaction(d) {
    return {
      caption: "Le réservoir éjecte ṁV. La réaction F = ρQV s’applique sur la cuve (vers l’amont), pas sur le jet.",
      svg: svg("Réaction d’un jet", `${hatch(80, 200, 220, 14)}${drawWaterSurface(90, 70, 200, 130)}<circle cx="80" cy="205" r="10" fill="#475569"/><circle cx="300" cy="205" r="10" fill="#475569"/><path d="M290 150h90" fill="none" stroke="${PALETTE.water}" stroke-width="12"/>${flow("M300 150h90")}${drawVector(160, 120, -110, 0, "force", "F = ρQV")}${drawDimension(70, 70, 70, 150, `h = ${num(d.h)} m`)}${t(320, 130, "jet")}`)
    };
  },
  inclinedPlate(d) {
    const th = ((+d.theta || 60) * Math.PI) / 180;
    const Q = +d.Q || 20;
    const Qdown = Q * (1 + Math.cos(th)) / 2, Qup = Q * (1 - Math.cos(th)) / 2;
    const wDown = 6 + 16 * (Qdown / Math.max(Q, 1)), wUp = 6 + 16 * (Qup / Math.max(Q, 1));
    const x2 = 300 + 160 * Math.cos(th), y2 = 40 + 160 * Math.sin(th);
    return {
      caption: "Plaque lisse : réaction normale. Q₊ (vers l’aval) est plus épais que Q₋, proportionnellement à (1±cosθ)/2.",
      svg: svg("Plaque inclinée", `${flow("M20 120h240")}${line(260, 30, x2, y2, "#334155", 10)}<path d="M268 128l90 70" fill="none" stroke="${PALETTE.water}" stroke-width="${wDown}"/><path d="M268 112l70-55" fill="none" stroke="${PALETTE.velocity}" stroke-width="${wUp}"/>${drawVector(40, 96, 70, 0, "velocity", `V = ${num(d.V)} m/s`)}${t(300, 24, `θ = ${num(d.theta)}°`)}${t(40, 210, `Q₊ = ${num(Qdown)} L/s`)}${t(40, 230, `Q₋ = ${num(Qup)} L/s · Fₙ = ρQV sinθ`)}`)
    };
  },
  reynoldsRegime(d) {
    return {
      caption: "Re = VD/ν. Filet coloré net = laminaire ; dispersion dans toute la section = turbulent.",
      svg: svg("Expérience de Reynolds", `<path d="M50 90h460v60H50z" fill="${PALETTE.waterFill}" stroke="${PALETTE.water}" stroke-width="3"/>${flow("M70 120h400")}${t(60, 70, `D = ${num(d.D)} mm`)}${t(60, 220, `Q = ${num(d.Q)} L/s · ν = ${num(d.nu)}×10⁻⁶ m²/s`)}${t(200, 70, "laminaire < 2000 < transition < 4000 < turbulent")}`)
    };
  },
  hydraulicDiameter(d) {
    return {
      caption: "Gaine pleine : Dₕ = 4A/P = 2ab/(a+b). Le périmètre mouillé P = 2(a+b) est le contour complet (section fermée).",
      svg: svg("Gaine rectangulaire", `${hatch(90, 40, 380, 16)}${hatch(90, 190, 380, 16)}<path d="M110 56h340v134H110z" fill="${PALETTE.waterFill}" stroke="${PALETTE.water}" stroke-width="3"/><path d="M110 56h340v134H110z" fill="none" stroke="${PALETTE.force}" stroke-width="2.2" stroke-dasharray="6 4"/>${drawDimension(110, 230, 450, 230, `a = ${num(d.a)} mm`, { side: -1 })}${drawDimension(80, 56, 80, 190, `b = ${num(d.b)} mm`)}${t(200, 118, `A = ab`)}${t(200, 142, "P = 2(a+b)", `fill="${PALETTE.force}"`)}${t(200, 166, `V = ${num(d.V)} m/s`)}`)
    };
  },
  fallingFilm(d) {
    const alpha = ((+d.alpha || 30) * Math.PI) / 180;
    const c = Math.cos(alpha), s = Math.sin(alpha);
    const x0 = 92, y0 = 48, len = 196, ePx = 50, umax = 78;
    const x1 = x0 + len * c, y1 = y0 + len * s;
    const nx = -s, ny = -c;
    const ox = 0.42 * len * c, oy = 0.42 * len * s;
    const px = x0 + ox, py = y0 + oy;
    const p2x = px + ePx * nx + umax * c, p2y = py + ePx * ny + umax * s;
    const cx = px + 0.5 * ePx * nx + umax * c, cy = py + 0.5 * ePx * ny + umax * s;
    const film = `<path d="M${x0} ${y0}L${x1} ${y1}L${x1 + ePx * nx} ${y1 + ePx * ny}L${x0 + ePx * nx} ${y0 + ePx * ny}z" fill="${PALETTE.waterFill}" stroke="${PALETTE.water}" stroke-width="1.6"/>`;
    return {
      caption: "Demi-Poiseuille : u = 0 au parement, du/dy = 0 à la surface libre (tangente parallèle au mur). Valable si le film est laminaire.",
      svg: svg("Film ruisselant", `${hatch(68, 28, 18, 200)}${line(x0, y0, x1, y1, "#334155", 8)}${film}${drawParabola(px, py, cx, cy, p2x, p2y)}${drawVector(p2x, p2y, 36 * c, 36 * s, "velocity", "u_max")}${t(300, 70, `α = ${num(d.alpha)}°`)}${t(300, 100, `e = ${num(d.e)} mm`)}${t(300, 130, "u(e) max, τ = 0")}${t(120, 230, "parement · u = 0")}`)
    };
  },
  poiseuilleOil(d) {
    const yT = 78, yB = 152, yC = 115, x0 = 100, umax = 210;
    return {
      caption: "Profil parabolique laminaire : u_max = 2V̄ au centre. λ = 64/Re. Un profil plat serait turbulent.",
      svg: svg("Poiseuille", `<path d="M80 70h400v90H80z" fill="#fde68a" stroke="#b45309" stroke-width="3"/>${drawParabola(x0, yT, x0 + umax, yC, x0, yB)}${drawVector(x0 + umax - 8, yC, 48, 0, "velocity", "u_max = 2V̄")}${t(90, 56, `huile · D = ${num(d.D)} mm`)}${t(90, 220, `L = ${num(d.L)} m · Q = ${num(d.Q)} L/s`)}`)
    };
  },
  gravityPipe(d) {
    const g = iterateGravity(d, d.Ksum);
    const yPipe = 168, hMax = Math.max(g.H, 1);
    const Y = head => headY(head, hMax, yPipe, 110);
    const x0 = 166, x1 = 390;
    const stations = [
      { x: 50, egl: Y(g.H), hgl: Y(g.H) },
      { x: x0, egl: Y(g.H), hgl: Y(g.H) },
      { x: x0 + 20, egl: Y(g.H - 0.2 * g.hs), hgl: Y(g.H - 0.2 * g.hs - g.hv), mark: true },
      { x: x1, egl: Y(g.hv), hgl: Y(0), mark: true },
      { x: x1 + 24, egl: Y(0), hgl: Y(0) }
    ];
    return {
      caption: "H disponible = h_f + h_s. EGL part de la surface amont, pente Darcy, et aboutit à la surface aval. HGL est sous EGL de V²/2g.",
      svg: svg("Conduite gravitaire", `${drawWaterSurface(36, Y(g.H), 130, 46)}${drawWaterSurface(390, Y(0), 130, 46)}${hatch(36, Y(g.H) + 46, 130, 12)}${hatch(390, Y(0) + 46, 130, 12)}<path d="M166 ${Y(g.H) + 24}h224" fill="none" stroke="#475569" stroke-width="10"/>${flow(`M170 ${Y(g.H) + 24}h200`)}${drawEnergyLines(stations)}${t(50, Y(g.H) - 10, `H = ${num(d.H)} m`)}${t(200, Y(g.H) - 10, "EGL", `fill="${PALETTE.egl}"`)}${t(230, Y(g.H - g.hv) + 16, "HGL", `fill="${PALETTE.hgl}"`)}${t(180, 230, `D = ${num(d.D)} mm · L = ${num(d.L)} m · ΣK = ${num(d.Ksum)}`)}`)
    };
  },
  pipeSizing(d) {
    return {
      caption: "On teste les DN commerciaux croissants jusqu’à h_f ≤ H. On retient le plus petit qui passe, avec une vitesse raisonnable.",
      svg: svg("Dimensionnement", `${drawWaterSurface(30, 80, 100, 40)}${drawWaterSurface(430, 140, 100, 40)}<path d="M130 100h300" fill="none" stroke="#475569" stroke-width="12"/>${t(40, 64, `H = ${num(d.H)} m`)}${t(200, 80, `Q = ${num(d.Q)} L/s`)}${t(160, 220, "série 150 / 200 / 250 / 300 / 350 / 400 mm")}`)
    };
  },
  pumpStation(d) {
    const z1 = +d.z1 || 2, z2 = +d.z2 || 48;
    const Q = (+d.Q || 40) / 1000;
    const Ds = (+d.Ds || 200) / 1000, Dd = (+d.Dd || 150) / 1000;
    const hvs = Q ** 2 / (2 * Gfig * (Math.PI * Ds * Ds / 4) ** 2);
    const hvd = Q ** 2 / (2 * Gfig * (Math.PI * Dd * Dd / 4) ** 2);
    const hfs = ((+d.f || 0.02) * (+d.Ls || 15) / Ds + (+d.Ks || 4)) * hvs;
    const hfd = ((+d.f || 0.02) * (+d.Ld || 180) / Dd + (+d.Kd || 3.5)) * hvd;
    const HMT = (z2 - z1) + hfs + hfd;
    const yBed = 210, hMax = Math.max(z2, HMT, z1 + HMT, 1);
    const Y = h => headY(h, hMax, yBed, 155);
    const eglIn = z1 - hfs, eglOut = eglIn + HMT;
    const yLow = Y(z1), yHigh = Y(z2), yPump = (Y(eglIn) + Y(eglOut)) / 2;
    const hLow = Math.max(32, Math.min(yBed - yLow, 52));
    const hHigh = Math.max(28, Math.min(yBed - yHigh, 44));
    const stations = [
      { x: 50, egl: yLow, hgl: yLow },
      { x: 160, egl: yLow, hgl: yLow },
      { x: 250, egl: Y(eglIn), hgl: Y(eglIn - hvs) },
      { x: 250, egl: Y(eglOut), hgl: Y(eglOut - hvd) },
      { x: 310, egl: Y(eglOut), hgl: Y(eglOut - hvd), mark: true },
      { x: 400, egl: yHigh, hgl: yHigh },
      { x: 520, egl: yHigh, hgl: yHigh }
    ];
    return {
      caption: "HMT = Δz + pertes d’aspiration + pertes de refoulement. EGL saute de +HMT à la pompe.",
      svg: svg("Station de pompage", `${drawWaterSurface(30, yLow, 130, hLow)}${drawWaterSurface(400, yHigh, 130, hHigh)}<path d="M160 ${yLow + 20}h50V${yPump}H280" fill="none" stroke="#475569" stroke-width="8"/><path d="M280 ${yPump}h120" fill="none" stroke="#475569" stroke-width="8"/><circle cx="250" cy="${yPump}" r="20" fill="#075985"/>${t(243, yPump + 5, "P", 'fill="#fff"')}${drawEnergyLines(stations)}${t(40, yLow - 10, `z₁ = ${num(d.z1)} m`)}${t(410, yHigh - 10, `z₂ = ${num(d.z2)} m`)}${drawDimension(270, Y(eglOut), 270, Y(eglIn), `+HMT = ${num(HMT)} m`)}${t(70, Y(eglOut) - 8, "EGL", `fill="${PALETTE.egl}"`)}${t(318, Y(eglOut - hvd) + 14, "HGL", `fill="${PALETTE.hgl}"`)}${t(160, 236, `Q = ${num(d.Q)} L/s · η = ${num(d.eta)}`)}`)
    };
  },
  bordaCarnot(d) {
    const D1 = (+d.D1 || 150) / 1000, D2 = (+d.D2 || 250) / 1000, Q = (+d.Q || 40) / 1000;
    const V1 = Q / (Math.PI * D1 * D1 / 4), V2 = Q / (Math.PI * D2 * D2 / 4);
    const hs = (V1 - V2) ** 2 / (2 * Gfig), hv1 = V1 * V1 / (2 * Gfig), hv2 = V2 * V2 / (2 * Gfig);
    const yPipe = 200, hMax = Math.max(hv1 + 4, 6);
    const Y = h => headY(h, hMax, yPipe, 120);
    const EGL1 = 8, EGL2 = EGL1 - hs;
    return {
      caption: "Élargissement brusque : décollement dans les coins. EGL chute de hₛ = (V₁−V₂)²/2g ; HGL peut remonter (récupération partielle de p).",
      svg: svg("Élargissement brusque", `<path d="M40 90h200v70H40z" fill="${PALETTE.waterFill}" stroke="${PALETTE.water}" stroke-width="3"/><path d="M240 50h240v150H240z" fill="${PALETTE.waterFill}" stroke="${PALETTE.water}" stroke-width="3"/><path d="M248 58q18 20 14 40q8 22-10 36" fill="none" stroke="#64748b" stroke-width="1.6" stroke-dasharray="3 3"/><path d="M248 192q18-20 14-40q8-22-10-36" fill="none" stroke="#64748b" stroke-width="1.6" stroke-dasharray="3 3"/>${flow("M50 125h400")}${drawEnergyLines({ egl: [[60, Y(EGL1)], [240, Y(EGL1)], [260, Y(EGL2)], [500, Y(EGL2)]], hgl: [[60, Y(EGL1 - hv1)], [240, Y(EGL1 - hv1)], [260, Y(EGL2 - hv2)], [500, Y(EGL2 - hv2)]] })}${t(70, 80, `D₁ = ${num(d.D1)} mm`)}${t(320, 40, `D₂ = ${num(d.D2)} mm`)}${t(70, 40, "EGL", `fill="${PALETTE.egl}"`)}${t(180, 230, `hₛ = ${num(hs)} m · recirculation dans les coins`)}`)
    };
  },
  reynoldsDrag(d) {
    return {
      caption: "Même fluide, Re constant : le modèle doit aller N fois plus vite, et les forces sont identiques (Fₚ = Fₘ).",
      svg: svg("Pile de pont", `${drawWaterSurface(40, 130, 200, 60)}<rect x="120" y="70" width="36" height="120" fill="#94a3b8" stroke="#334155"/><rect x="370" y="100" width="18" height="70" fill="#94a3b8" stroke="#334155"/>${drawWaterSurface(330, 140, 140, 40)}${t(80, 58, "prototype")}${t(350, 88, `modèle 1/${num(d.N)}`)}${t(60, 220, `Fₘ = ${num(d.Fm)} N = Fₚ`)}`)
    };
  },
  froudeSpillway(d) {
    const N = Math.max(+d.N || 50, 2);
    const vis = Math.min(Math.sqrt(N), 3);
    return {
      caption: "Évacuateur au 1/N : λQ = N^(5/2), λV = λt = √N, λF = N³. Le modèle est dessiné plus petit (échelle visuelle).",
      svg: svg("Évacuateur", `<path d="M40 50h80l40 90h80V50h80v160H40z" fill="#cbd5e1" stroke="#334155"/><path d="M120 50l40 90h80V50" fill="${PALETTE.waterFill}" stroke="${PALETTE.water}"/><path d="M360 ${50 + 40 * (vis - 1)}h${80 / vis}l${20 / vis} ${50 / vis}h${40 / vis}V${50 + 40 * (vis - 1)}h${40 / vis}v${90 / vis}H360z" fill="#cbd5e1" stroke="#334155"/><path d="M${360 + 40 / vis} ${50 + 40 * (vis - 1)}l${20 / vis} ${50 / vis}h${40 / vis}V${50 + 40 * (vis - 1)}" fill="${PALETTE.waterFill}" stroke="${PALETTE.water}"/>${t(48, 40, "prototype")}${t(360, 40, `modèle 1/${num(d.N)}`)}${t(48, 230, `Qₚ = ${num(d.Qp)} m³/s`)}${t(300, 230, `Vₘ = ${num(d.Vm)} m/s`)}`)
    };
  },
  stokesViscosity(d) {
    return {
      caption: "À vitesse limite : poids = Archimède + 3πμdV. Stokes n’est valable que si Re ≲ 1.",
      svg: svg("Chute de bille", `<rect x="200" y="30" width="160" height="190" fill="#fde68a" stroke="#b45309" stroke-width="3"/><circle cx="280" cy="90" r="16" fill="#64748b"/>${drawVector(280, 110, 0, 60, "velocity", `V = ${num(d.V)} m/s`)}${t(300, 88, `d = ${num(d.d)} mm`)}${t(80, 80, "poids")}${t(80, 140, "Archimède")}${t(80, 200, "Stokes")}`)
    };
  },
  trapezoidalChannel(d) {
    const ch = isoChannel({ b: d.b, y: d.y, z: d.z }, { L: 6.2, s: 16.5, ox: 70, oy: 224 });
    return {
      caption: "Prisme trapézoïdal : A = (b+zy)y, P = b+2y√(1+z²). Fr utilise ȳ = A/T, pas y.",
      svg: svg("Canal trapézoïdal", `${ch.body}${t(36, 36, `b = ${num(d.b)} m · y = ${num(d.y)} m · z = ${num(d.z)}`)}${t(36, 56, `Kₛ = ${num(d.Ks)} · S = ${num(d.S)} ‰`)}`)
    };
  },
  normalDepth(d) {
    const ch = isoChannel({ b: d.b, y: 1.15, z: 0 }, { L: 6.4, s: 18, ox: 42, oy: 224 });
    return {
      caption: "yₙ est l’inconnue : on itère Q = A Kₛ R^(2/3)√S jusqu’à retrouver le débit imposé, puis on lit Fr.",
      svg: svg("Profondeur normale", `${ch.body}${t(36, 36, `Q = ${num(d.Q)} m³/s imposé`)}${t(36, 56, `b = ${num(d.b)} m · S = ${num(d.S)} ‰ · Kₛ = ${num(d.Ks)}`)}`)
    };
  },
  waveCelerity(d) {
    return {
      caption: "c = √(gy) par rapport à l’eau. En fluvial, un front remonte à c−V : l’aval commande, avec un délai L/(c−V).",
      svg: svg("Intumescence", `${hatch(40, 200, 480, 14)}${drawWaterSurface(40, 130, 480, 70)}<path d="M40 130c80-40 120-40 200 0s120 40 200 0 80-20 80-20" fill="none" stroke="${PALETTE.water}" stroke-width="3"/>${drawVector(70, 108, 90, 0, "velocity", "V+c")}${drawVector(480, 108, -90, 0, "velocity", "c−V")}${t(60, 70, `y = ${num(d.y)} m · V = ${num(d.V)} m/s`)}${t(200, 230, `L = ${num(d.Lkm)} km à l’amont`)}`)
    };
  },
  damBreakRitter(d) {
    const h0 = Math.max(+d.h0 || 12, 1);
    const bed = 200, y0 = 48, sc = (bed - y0) / h0;
    const yDam = bed - (4 / 9) * h0 * sc;
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const s = i / 24;
      const h = h0 * ((2 / 3) * (1 - s / 2)) ** 2;
      pts.push([120 + s * 360, bed - h * sc]);
    }
    pts.push([480, bed], [120, bed]);
    return {
      caption: "Ritter : profil paraboloïdal continu. Au barrage, h = 4h₀/9 ; le front est à 2√(gh₀) t, fond sec au-delà.",
      svg: svg("Rupture de barrage", `${hatch(40, bed, 480, 16)}<path d="M40 40h80v${bed - 40}H40z" fill="#94a3b8"/>${drawWaterSurface(40, y0, 80, bed - y0)}<path d="M${pts.map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`).join("")}" fill="${PALETTE.waterFill}" stroke="${PALETTE.water}" stroke-width="1.8"/>${line(120, 40, 120, bed, "#334155", 1.4, 'stroke-dasharray="5 4"')}${drawDimension(30, y0, 30, bed, `h₀ = ${num(d.h0)} m`)}${drawDimension(128, yDam, 128, bed, "4h₀/9", { side: -1 })}${t(300, 70, "front 2√(gh₀)")}${t(200, 230, `x = ${num(d.xKm)} km à l’aval`)}`)
    };
  },
  damSluice(d) {
    const hSill = Math.max(+d.hSill || 12, 1), H = Math.max(+d.H || 1.2, 0.2);
    const y0 = hSill - H, yc = y0 + H / 2, yp = yc + (H ** 2) / (12 * yc);
    const yFree = 40, bed = 210, sc = (bed - yFree) / hSill;
    const yTop = yFree + y0 * sc, yBot = bed, yP = yFree + yp * sc;
    const pScale = 70 / hSill, wTop = y0 * pScale, wBot = hSill * pScale;
    const gx = 120;
    return {
      caption: "Vanne de fond, aval sec : trapèze des pressions. F s’applique en P (yₚ sous ȳ), pas au centre géométrique du pertuis.",
      svg: svg("Vanne de chasse", `${hatch(80, 30, 24, 180)}${drawWaterSurface(104, yFree, 220, bed - yFree)}<rect x="104" y="${yTop}" width="16" height="${H * sc}" fill="#334155"/>${drawPressureDiagram(gx, yTop, H * sc, wTop, wBot)}${drawVector(gx + wBot * 0.42, yP, gx + 4 - (gx + wBot * 0.42), 0, "force", "P")}${drawDimension(70, yFree, 70, bed, `h = ${num(d.hSill)} m`, { side: -1 })}${drawDimension(360, yTop, 360, yBot, `H = ${num(d.H)} m`)}${t(340, 70, "amont")}${t(340, 190, "aval sec")}${t(140, 230, `μ = ${num(d.mu)} · W = ${num(d.W)} kN · yₚ = ${num(yp)} m`)}`)
    };
  },
  npshCavitation(d) {
    const z0 = +d.z0 || 0, ze = +d.ze || 4;
    const patm = ((+d.patm || 101.3) * 1000) / ((+d.rho || 1000) * Gfig);
    const pv = ((+d.pv || 2.3) * 1000) / ((+d.rho || 1000) * Gfig);
    const y0 = 176, sc = 22, yP = y0 - (ze - z0) * sc;
    const yAtm = 40, yPv = yAtm + 18;
    return {
      caption: "NPSH_d = pₐₜₘ/ρg − pᵥ/ρg − Hₛ − h_asp. La HGL d’aspiration ne doit pas descendre sous pᵥ/ρg.",
      svg: svg("Aspiration et NPSH", `${drawWaterSurface(40, 150, 160, 50)}${hatch(40, 200, 160, 12)}<path d="M200 176h40v-50h80" fill="none" stroke="#475569" stroke-width="8"/><circle cx="320" cy="126" r="22" fill="#075985"/>${t(312, 131, "P", 'fill="#fff"')}${line(36, yAtm, 500, yAtm, PALETTE.hgl, 1.4, 'stroke-dasharray="4 3"')}${line(36, yPv, 500, yPv, PALETTE.force, 1.6, 'stroke-dasharray="6 4"')}${drawEnergyLines({ egl: [[80, y0 - 14], [200, y0 - 14], [240, yP - 6], [300, yP - 14]], hgl: [[80, y0], [200, y0], [240, yP + 8], [300, yP]] }, { gap: false })}${t(50, 140, `z₀ = ${num(d.z0)} m`)}${t(300, 90, `zₑ = ${num(d.ze)} m`)}${t(360, 44, "pₐₜₘ/ρg")}${t(360, yPv + 14, "pᵥ/ρg", `fill="${PALETTE.force}"`)}${t(80, 230, `NPSHᵣ = ${num(d.NPSHr)} m`)}${t(90, y0 - 24, "EGL", `fill="${PALETTE.egl}"`)}${t(90, y0 + 16, "HGL", `fill="${PALETTE.hgl}"`)}`)
    };
  },
  waterCannon(d) {
    return {
      caption: "Deux volumes de contrôle : la lance (recul) et l’écran (F = ρQV). Ce ne sont pas la même force.",
      svg: svg("Lance et écran", `<path d="M40 100h160l80 20v10L200 150H40z" fill="${PALETTE.waterFill}" stroke="${PALETTE.water}" stroke-width="3"/>${flow("M220 125h160")}${hatch(400, 50, 16, 150)}${drawVector(398, 125, -80, 0, "force", "F écran")}${drawVector(90, 125, -70, 0, "force", "recul")}${t(50, 84, `p₁ = ${num(d.p1)} bar`)}${t(50, 220, `D₁ = ${num(d.D1)} mm → d = ${num(d.d)} mm`)}${t(300, 96, "jet")}${t(360, 220, "écran")}`)
    };
  },
  cofferdamBallast(d) {
    const W = (+d.W || 200) * 1000;
    const Te = W / (Math.max(+d.rho || 1000, 900) * Gfig * Math.max(+d.L || 12, 1) * Math.max(+d.B || 5, 1));
    const h = +d.immerse || 3.5, Hguess = Math.max(Te * 1.8, h, 2);
    const keel = 200, sc = 90 / Hguess;
    const yWL = keel - Te * sc, yH = keel - h * sc, yTop = keel - Hguess * sc;
    return {
      caption: "À gauche : flottaison, tirant Tₑ. À droite : posé, immersion h et ballast 𝒱_b distincts du tirant.",
      svg: svg("Batardeau", `${drawWaterSurface(40, yWL, 220, keel - yWL + 20)}<rect x="70" y="${yTop}" width="160" height="${keel - yTop}" fill="#cbd5e1" stroke="#334155" stroke-width="2"/>${drawDimension(40, yWL, 40, keel, `Tₑ = ${num(Te)} m`)}${drawWaterSurface(300, yH, 220, keel - yH + 20)}<rect x="330" y="${yTop}" width="160" height="${keel - yTop}" fill="#cbd5e1" stroke="#334155" stroke-width="2"/><rect x="350" y="${keel - 28}" width="120" height="22" fill="#78716c"/>${drawDimension(510, yH, 510, keel, `h = ${num(d.immerse)} m`, { side: -1 })}${t(80, yTop - 10, "remorquage")}${t(350, yTop - 10, "posé + ballast")}${t(80, 236, `W = ${num(d.W)} kN · L = ${num(d.L)} m · B = ${num(d.B)} m`)}`)
    };
  },
  oilSeason(d) {
    return {
      caption: "Même débit, deux viscosités. Re peut retraverser 2000 : λ et la puissance changent de loi.",
      svg: svg("Oléoduc saisonnier", `<path d="M40 90h480v50H40z" fill="#fde68a" stroke="#b45309" stroke-width="3"/>${flow("M60 115h420")}${t(50, 70, `été ν = ${num(d.nuS)} / hiver ν = ${num(d.nuW)} ×10⁻⁶`)}${t(50, 220, `L = ${num(d.Lkm)} km · D = ${num(d.D)} mm`)}`)
    };
  },
  retainingWall(d) {
    const H = Math.max(+d.H || 4, 0.5);
    const yFree = 70, bed = 210, yF = bed - (bed - yFree) / 3;
    return {
      caption: "Poussée ρgH²/2 à H/3 du pied (pas H/2). Le poids, bras t/2, s’oppose au renversement autour de l’arête aval.",
      svg: svg("Mur-poids", `${hatch(200, 40, 140, 170)}${drawWaterSurface(40, yFree, 160, bed - yFree)}${drawPressureDiagram(200, yFree, bed - yFree, 0, 70, { dir: -1 })}${drawDimension(30, yFree, 30, bed, `H = ${num(d.H)} m`)}${drawDimension(200, 230, 340, 230, `t = ${num(d.t)} m`, { side: -1 })}${drawVector(80, yF, 100, 0, "force", "F · H/3")}`)
    };
  },
  bearingLoss(d) {
    const y0 = 70, y1 = 132, xW = 374;
    return {
      caption: "Jeu radial = Couette : profil linéaire, u = 0 sur le stator, u = ωR sur le rotor. Le couple visqueux dissipe P = Cω.",
      svg: svg("Palier lisse", `<circle cx="200" cy="120" r="70" fill="none" stroke="#b45309" stroke-width="14"/><circle cx="200" cy="120" r="48" fill="#94a3b8" stroke="#334155"/><circle cx="200" cy="120" r="8" fill="#0f172a"/><rect x="360" y="48" width="90" height="100" fill="#fde68a" stroke="#b45309"/><rect x="360" y="48" width="14" height="100" fill="#e2e8f0"/><rect x="436" y="48" width="14" height="100" fill="#94a3b8"/>${line(xW, y0, xW + 72, y1, PALETTE.velocity, 2.3)}${drawVector(xW + 72, y1, 36, 0, "velocity", "U = ωR")}${t(320, 40, `e = ${num(d.gap)} mm`)}${t(40, 40, `N = ${num(d.rpm)} tr/min`)}${t(40, 220, `d = ${num(d.d)} mm · stator 0 → rotor U = ωR`)}`)
    };
  },
  pipeGage(d) {
    const z = Math.max(+d.z || 0.4, 0.05), hHg = Math.max(+d.hHg || 0.25, 0.05);
    const yPipe = 70, yHgTop = 130, yHgBot = yHgTop + 40;
    const yLow = yHgBot - 8, yHigh = yLow - hHg * 80;
    return {
      caption: "Le centre de conduite est plus haut que le ménisque bas : p = (ρₘ Δh − ρ z) g. Δh se cote entre les deux ménisques de mercure.",
      svg: svg("Manomètre sous conduite", `<path d="M80 70h160v40H80z" fill="${PALETTE.waterFill}" stroke="${PALETTE.water}" stroke-width="3"/><path d="M160 110v40h80v50H80v-50h80" fill="none" stroke="#475569" stroke-width="10"/><path d="M80 ${yLow}h80v${yHgBot - yLow}H80z" fill="#d97706"/><path d="M160 ${yHigh}h80v${yHgBot - yHigh}H160z" fill="#d97706"/>${t(90, 58, "conduite")}${drawDimension(280, 90, 280, yLow, `z = ${num(d.z)} m`, { side: -1 })}${drawDimension(320, yHigh, 320, yLow, `Δh = ${num(d.hHg)} m`, { side: -1 })}`)
    };
  },
  pressureUnits(d) {
    return {
      caption: "Toujours passer par le pascal, puis diviser par ρeau g pour des mCE. 1 bar ≈ 10,2 mCE.",
      svg: svg("Conversions", `${t(60, 80, `${num(d.bar)} bar`)}${t(220, 80, `${num(d.mmHg)} mmHg`)}${t(400, 80, `${num(d.psi)} psi`)}${t(60, 140, "→ Pa")}${t(220, 140, "→ Pa")}${t(400, 140, "→ Pa")}${t(180, 200, "puis ÷ ρeau g → mCE")}`)
    };
  },
  woodLog(d) {
    return {
      caption: "Fraction immergée = densité du bois. Masse = poids de l’eau déplacée.",
      svg: svg("Tronc flottant", `${drawWaterSurface(40, 130, 480, 80)}<ellipse cx="280" cy="130" rx="140" ry="40" fill="#b45309" stroke="#78350f" stroke-width="3"/>${t(160, 80, `d = ${num(d.s)} · D = ${num(d.D)} m`)}`)
    };
  },
  iceberg(d) {
    return {
      caption: "Archimède : 𝒱_imm/𝒱 = ρᵢ/ρₑ. En mer, environ 10 % émerge.",
      svg: svg("Iceberg", `${drawWaterSurface(40, 140, 480, 70)}<path d="M220 60l80 80H160z" fill="#e0f2fe" stroke="${PALETTE.water}" stroke-width="3"/><path d="M160 140h140l-30 60h-80z" fill="${PALETTE.waterFill}" stroke="${PALETTE.water}"/>${t(360, 90, `${num(d.rhoI)} / ${num(d.rhoW)}`)}`)
    };
  },
  idealGasTwo(d) {
    return {
      caption: "Deux états indépendants : ρ = p/(RT) après conversion en kelvin et pascals.",
      svg: svg("Air — deux états", `<rect x="40" y="50" width="200" height="130" rx="8" fill="#e0f2fe" stroke="#64748b" stroke-width="3"/><rect x="300" y="50" width="200" height="130" rx="8" fill="#e0f2fe" stroke="#64748b" stroke-width="3"/>${t(70, 90, `T₁ = ${num(d.temp1)} °C`)}${t(70, 120, `p₁ = ${num(d.p1)} bar`)}${t(70, 150, "état 1")}${t(330, 90, `T₂ = ${num(d.temp2)} °C`)}${t(330, 120, `p₂ = ${num(d.p2)} bar`)}${t(330, 150, "état 2")}${t(160, 220, `R = ${num(d.R)} J/(kg·K)`)}`)
    };
  },
  reynoldsTwo(d) {
    return {
      caption: "Re = VD/ν. On compare séparément l’eau et l’huile : le régime se lit sur Re, pas sur V.",
      svg: svg("Deux conduites", `<path d="M40 70h200v50H40z" fill="${PALETTE.waterFill}" stroke="${PALETTE.water}" stroke-width="3"/><path d="M300 70h200v50H300z" fill="#fde68a" stroke="#b45309" stroke-width="3"/>${flow("M50 95h170")}${t(50, 56, `eau · D₁ = ${num(d.D1)} mm`)}${t(50, 150, `V₁ = ${num(d.V1)} m/s`)}${t(310, 56, `huile · D₂ = ${num(d.D2)} mm`)}${t(310, 150, `V₂ = ${num(d.V2)} m/s`)}${t(50, 220, "laminaire < 2000 < transition < 4000 < turbulent")}`)
    };
  },
  kinematicField(d) {
    return {
      caption: "Champ plan u = kx², v = −2kxy. Divergence nulle partout ; rotationnel ω_z = −2ky au point (x, y).",
      svg: svg("Champ 2D", `${line(80, 200, 480, 200, "#334155", 1.4)}${line(80, 200, 80, 40, "#334155", 1.4)}${t(490, 204, "x")}${t(70, 36, "y")}<circle cx="260" cy="110" r="7" fill="${PALETTE.velocity}"/>${t(274, 106, `(x, y) = (${num(d.x)} ; ${num(d.y)}) m`)}${t(120, 70, `u = ${num(d.k)} x²`)}${t(120, 100, `v = −${num(2 * d.k)} x y`)}${t(120, 230, "div = 0 · ω_z = −2ky")}`)
    };
  },
  dimensionsMLT(d) {
    return {
      caption: "On lit les exposants M, L, T à partir d’une définition (P = FV, σ = F/A, …), sans calcul numérique.",
      svg: svg("Tableau MLT", `${t(60, 70, "P = F V")}${t(60, 100, "C = F ℓ")}${t(60, 130, "σ = F/A")}${t(60, 160, "ṁ = ρ Q")}${t(60, 190, "σ_s = F/ℓ")}${t(60, 220, "dp/dx")}${t(280, 70, "→ M L² T⁻³")}${t(280, 100, "→ M L² T⁻²")}${t(280, 130, "→ M L⁻¹ T⁻²")}${t(280, 160, "→ M T⁻¹")}${t(280, 190, "→ M T⁻²")}${t(280, 220, "→ M L⁻² T⁻²")}`)
    };
  },
  pendulumPi(d) {
    return {
      caption: "T = k Lᵃ gᵇ mᶜ. L’homogénéité impose a = 1/2, b = −1/2, c = 0 : T ∝ √(L/g).",
      svg: svg("Pendule simple", `${line(280, 30, 280, 50, "#334155", 4)}${line(280, 50, 340, 180, "#334155", 3)}<circle cx="340" cy="190" r="18" fill="#075985"/>${t(80, 80, "T = k Lᵃ gᵇ mᶜ")}${t(80, 120, "a = 1/2")}${t(80, 150, "b = −1/2")}${t(80, 180, "c = 0")}${drawDimension(352, 50, 352, 180, "L", { side: -1 })}${t(360, 220, "m n’intervient pas")}`)
    };
  },
  propellerPi(d) {
    return {
      caption: "P = k ρᵃ nᵇ Dᶜ donne P = ρ n³ D⁵ f(…). n est en tours par seconde.",
      svg: svg("Hélice", `<circle cx="220" cy="125" r="70" fill="${PALETTE.waterFill}" stroke="${PALETTE.water}" stroke-width="3"/><path d="M220 55q40 50 0 140q-40-50 0-140" fill="${PALETTE.waterFill}" stroke="${PALETTE.water}"/><path d="M150 125q50-40 140 0q-50 40-140 0" fill="${PALETTE.waterFill}" stroke="${PALETTE.water}"/>${t(320, 80, "P = k ρᵃ nᵇ Dᶜ")}${t(320, 120, "a = 1 · b = 3 · c = 5")}${t(320, 160, "P ∝ ρ n³ D⁵")}${t(80, 220, "n en s⁻¹")}`)
    };
  },
  twoFluidsShear(d) {
    const y0 = 88, y1 = 148, u = 78;
    const film = (x, fill, stroke) =>
      `<rect x="${x}" y="${y0}" width="220" height="60" fill="${fill}" stroke="${stroke}"/>${line(x + 24, y1, x + 24 + u, y0, PALETTE.velocity, 2.3)}${drawVector(x + 24 + u, y0, 22, 0, "velocity")}`;
    return {
      caption: "Même film, deux fluides : τ = μ U/e. Profil linéaire de Couette. Le rapport des efforts est celui des viscosités.",
      svg: svg("Deux fluides en Couette", `${hatch(40, 70, 220, 18)}${hatch(40, 148, 220, 18)}${film(40, "#fde68a", "#b45309")}${hatch(300, 70, 220, 18)}${hatch(300, 148, 220, 18)}${film(300, PALETTE.waterFill, PALETTE.water)}${t(60, 60, `U = ${num(d.U)} m/s`)}${drawDimension(40, y0, 40, y1, `e = ${num(d.e)} mm`, { side: -1 })}${t(60, 200, `μ_A = ${num(d.muA)} Pa·s`)}${t(320, 60, "même U, e, A")}${t(320, 124, `ρ_B = ${num(d.rhoB)} kg/m³`)}${t(320, 200, `μ_B = ${num(d.muB)} Pa·s`)}`)
    };
  },
  viscosityTemp(d) {
    const T1 = +d.T1 || 20, T2 = +d.T2 || 80, T = +d.T || 40, mu1 = +d.mu1 || 0.3, mu2 = +d.mu2 || 0.08;
    const muT = mu1 + (mu2 - mu1) * (T - T1) / (T2 - T1 || 1);
    const Tmin = Math.min(T1, T2, T) - 4, Tmax = Math.max(T1, T2, T) + 6;
    const muMax = Math.max(mu1, mu2, muT, 0.05) * 1.15;
    const x0 = 70, x1 = 500, y0 = 200, y1 = 46;
    const X = temp => x0 + ((temp - Tmin) / (Tmax - Tmin)) * (x1 - x0);
    const Y = mu => y0 - (mu / muMax) * (y0 - y1);
    const pts = [[X(T1), Y(mu1)], [X(T2), Y(mu2)]];
    return {
      caption: "μ interpolée linéairement entre les deux points du tableau, puis Couette à la température de service.",
      svg: svg("Viscosité et température", `${line(x0, y0, x1, y0, "#334155")}${line(x0, y0, x0, y1 - 8, "#334155")}${poly(pts, "#b45309", 2.4)}${line(X(T), y0, X(T), Y(muT), PALETTE.velocity, 1.5, 'stroke-dasharray="5 4"')}${line(x0, Y(muT), X(T), Y(muT), PALETTE.velocity, 1.2, 'stroke-dasharray="4 3"')}<circle cx="${X(T1)}" cy="${Y(mu1)}" r="5" fill="#b45309"/><circle cx="${X(T2)}" cy="${Y(mu2)}" r="5" fill="#b45309"/><circle cx="${X(T)}" cy="${Y(muT)}" r="5" fill="${PALETTE.velocity}"/>${t(510, 204, "T")}${t(40, 36, "μ")}${t(X(T1) - 8, Y(mu1) - 10, "1")}${t(X(T2) - 8, Y(mu2) - 10, "2")}${t(X(T) + 8, Y(muT) + 4, `μ(T) = ${num(muT)} Pa·s`, `fill="${PALETTE.velocity}"`)}${t(90, 230, `T₁ = ${num(d.T1)} °C · T = ${num(d.T)} °C · T₂ = ${num(d.T2)} °C`)}`)
    };
  },
  dualSideGate(d) {
    const y1 = Math.max(+d.y1 || 1, 0.2), y2 = Math.max(+d.y2 || 0.4, 0.1), a = Math.max(+d.a || 0.5, 0.1), b = +d.b || 1;
    const area = b * a, yc1 = y1 - a / 2, yc2 = y2 - a / 2, ig = b * a ** 3 / 12;
    const F1 = area * yc1, F2 = area * yc2, Fnet = F1 - F2;
    const yp1 = yc1 + ig / (area * yc1), z1 = y1 - yp1;
    const yp2 = yc2 + ig / (area * yc2), z2 = y2 - yp2;
    const zNet = Fnet === 0 ? a / 2 : (F1 * z1 - F2 * z2) / Fnet;
    const sill = 210, sc = 155 / Math.max(y1, y2, a);
    const yS1 = sill - y1 * sc, yS2 = sill - y2 * sc, yTop = sill - a * sc, yN = sill - zNet * sc;
    const gx = 268, gw = 18;
    const pScale = 56 / y1;
    return {
      caption: "Vanne noyée des deux côtés : trapèzes calés sur y₁ et y₂ depuis le seuil. Le net s’applique à z_net, pas à a/2.",
      svg: svg("Vanne à deux plans d’eau", `${hatch(40, sill, 480, 14)}${drawWaterSurface(40, yS1, gx - 40, sill - yS1)}${drawWaterSurface(gx + gw, yS2, 520 - gx - gw, sill - yS2)}<rect x="${gx}" y="${yTop}" width="${gw}" height="${a * sc}" fill="#cbd5e1" stroke="#334155" stroke-width="2"/>${drawPressureDiagram(gx, yTop, sill - yTop, (y1 - a) * pScale, y1 * pScale, { dir: -1 })}${drawPressureDiagram(gx + gw, yTop, sill - yTop, (y2 - a) * pScale, y2 * pScale)}${dot(gx + gw / 2, yN, PALETTE.force)}${t(gx + 24, yN, `z_net = ${num(zNet)} m`, `fill="${PALETTE.force}"`)}${drawDimension(32, yS1, 32, sill, `y₁ = ${num(d.y1)} m`)}${drawDimension(510, yS2, 510, sill, `y₂ = ${num(d.y2)} m`, { side: -1 })}${drawDimension(gx + gw + 8, yTop, gx + gw + 8, sill, `a = ${num(d.a)} m`, { side: -1 })}${t(70, yS1 - 8, "amont")}${t(340, yS2 - 8, "aval")}`)
    };
  },
  lockDoor(d) {
    const H = Math.max(+d.H || 1, 0.2), h = Math.max(+d.h || 0.2, 0.05);
    const sill = 210, sc = 155 / H;
    const yS1 = sill - H * sc, yS2 = sill - h * sc;
    const gx = 262, gw = 18, w1 = 88, w2 = 88 * (h / H);
    const yF1 = sill - (H / 3) * sc, yF2 = sill - (h / 3) * sc;
    return {
      caption: "Porte d’écluse affleurante : triangles de pression. Les poussées agissent à H/3 et h/3 du radier.",
      svg: svg("Porte d’écluse", `${hatch(40, sill, 480, 14)}${drawWaterSurface(50, yS1, gx - 50, sill - yS1)}${drawWaterSurface(gx + gw, yS2, 510 - gx - gw, sill - yS2)}<rect x="${gx}" y="${yS1 - 12}" width="${gw}" height="${sill - yS1 + 12}" fill="#94a3b8" stroke="#334155" stroke-width="2"/>${drawPressureDiagram(gx, yS1, sill - yS1, 0, w1, { dir: -1 })}${drawPressureDiagram(gx + gw, yS2, sill - yS2, 0, w2)}${drawVector(gx - w1 * 0.5, yF1, w1 * 0.48, 0, "force", "F₁ · H/3")}${drawVector(gx + gw + w2 * 0.5, yF2, -w2 * 0.48, 0, "force", "F₂ · h/3")}${drawDimension(40, yS1, 40, sill, `H = ${num(d.H)} m`, { side: -1 })}${drawDimension(510, yS2, 510, sill, `h = ${num(d.h)} m`)}${t(80, yS1 - 8, "bief amont")}${t(340, yS2 - 8, "bief aval")}${t(70, 236, `b = ${num(d.b)} m · F à H/3 et h/3 du palier`)}`)
    };
  },
  piezometricLine(d) {
    const D = (+d.D || 200) / 1000, Q = (+d.Q || 30) / 1000;
    const V = Q / (Math.PI * D * D / 4);
    const Re = V * D / ((+d.nu || 1) * 1e-6);
    const f = colebrookF(Re, ((+d.eps || 0.2) / 1000) / D);
    const hv = V * V / (2 * Gfig), hf = f * ((+d.L || 1) / D) * hv;
    const H = +d.H || 20, Ke = +d.Kentry || 0, Kv = +d.Kvalve || 0, Ks = +d.Kexit || 0;
    const HGLentry = H - Ke * hv - hv;
    const EGLbeforeV = H - Ke * hv - 0.5 * hf, HGLbeforeV = EGLbeforeV - hv;
    const HGLmid = H - Ke * hv - 0.5 * hf - Kv * hv - hv;
    const HGLend = H - (Ke + Kv + Ks) * hv - hf - hv;
    const yPipe = 198, hPx = 146, hMax = Math.max(H, 1);
    const Y = head => headY(head, hMax, yPipe, hPx);
    const x0 = 72, x1 = 118, xVa = 278, xVb = 302, x2 = 468;
    const stations = [
      { x: x0, egl: Y(H), hgl: Y(H) },
      { x: x1, egl: Y(HGLentry + hv), hgl: Y(HGLentry), mark: true },
      { x: xVa, egl: Y(EGLbeforeV), hgl: Y(HGLbeforeV) },
      { x: xVb, egl: Y(HGLmid + hv), hgl: Y(HGLmid) },
      { x: x2, egl: Y(HGLend + hv), hgl: Y(HGLend), mark: true }
    ];
    return {
      caption: "EGL (énergie) au-dessus de HGL (piézométrique) de V²/2g. Les K font des crans ; Darcy incline les deux lignes.",
      svg: svg("Lignes de charge", `${drawWaterSurface(36, Y(H), 36, yPipe - Y(H))}${hatch(36, yPipe, 36, 14)}${hatch(72, yPipe, 410, 14)}<path d="M72 ${yPipe - 5}h396" fill="none" stroke="#475569" stroke-width="8"/><rect x="284" y="${yPipe - 22}" width="12" height="28" fill="#64748b" stroke="#334155"/>${drawEnergyLines(stations)}${t(78, Y(H) - 8, `EGL · H = ${num(d.H)} m`, `fill="${PALETTE.egl}"`)}${t(130, Y(HGLentry) + 16, "HGL", `fill="${PALETTE.hgl}"`)}${t(108, yPipe + 28, "entrée")}${t(268, yPipe - 28, "vanne")}${t(430, yPipe + 28, "sortie")}${t(60, 236, `L = ${num(d.L)} m · D = ${num(d.D)} mm · HGL fin = ${num(HGLend)} m`)}`)
    };
  },
  diameterEconomy(d) {
    const Ds = [+d.D1 || 200, +d.D2 || 250, +d.D3 || 300];
    const Dmax = Math.max(...Ds);
    const Q = (+d.Q || 55) / 1000, L = +d.L || 1600, eps = (+d.eps || 0.15) / 1000, nu = (+d.nu || 1) * 1e-6;
    const pipes = Ds.map((Dmm, i) => {
      const D = Dmm / 1000, V = Q / (Math.PI * D * D / 4), f = colebrookF(V * D / nu, eps / D);
      const hf = f * (L / D) * V * V / (2 * Gfig), C = (+d.alpha || 4) * Dmm + (+d.beta || 80) * hf;
      const h = 22 + (Dmm / Dmax) * 56, y = 100 - h / 2, x = 40 + i * 170;
      return `<path d="M${x} ${y}h140v${h}H${x}z" fill="${PALETTE.waterFill}" stroke="${PALETTE.water}" stroke-width="3"/>${t(x + 30, y - 12, `DN ${num(Dmm)}`)}${t(x + 18, y + h + 18, `C = ${num(C)}`)}`;
    }).join("");
    return {
      caption: "Trois DN, même Q : h_f chute vite quand D augmente. C = αD + β h_f départage — annoté sous chaque conduite.",
      svg: svg("Trois diamètres", `${pipes}${t(50, 200, `Q = ${num(d.Q)} L/s · L = ${num(d.L)} m`)}${t(50, 228, "C = α D + β h_f")}`)
    };
  },
  pumpDutyPoint(d) {
    const D = (+d.D || 150) / 1000, A = Math.PI * D * D / 4;
    const eps = (+d.eps || 0.15) / 1000, nu = (+d.nu || 1) * 1e-6;
    const H0 = +d.H0 || 40, Hg = +d.Hg || 12, k = +d.k || 800;
    const L = +d.L || 200, Ksum = +d.Ksum || 8;
    let Q = 0.04, r = 0, H = H0;
    for (let i = 0; i < 20; i++) {
      const V = Q / A, Re = V * D / nu;
      const f = colebrookF(Re, eps / D);
      r = (f * L / D + Ksum) / (2 * Gfig * A * A);
      const den = k + r, nume = H0 - Hg;
      Q = den > 0 && nume > 0 ? Math.sqrt(nume / den) : 0;
      H = H0 - k * Q * Q;
    }
    const Qmax = Math.max(Q * 1.5, 0.015);
    const Hmax = Math.max(H0, Hg, H, 1) * 1.12;
    const x0 = 70, x1 = 500, y0 = 210, y1 = 40;
    const X = q => x0 + (q / Qmax) * (x1 - x0);
    const Y = h => y0 - (h / Hmax) * (y0 - y1);
    const pumpPts = [], netPts = [];
    for (let i = 0; i <= 28; i++) {
      const q = Qmax * i / 28;
      const hp = H0 - k * q * q;
      if (hp > 0) pumpPts.push([X(q), Y(hp)]);
      netPts.push([X(q), Y(Hg + r * q * q)]);
    }
    return {
      caption: "H_p = H₀ − k Q² descend ; H_n = H_g + r Q² monte. L’intersection, itérée avec Colebrook, est le point de fonctionnement.",
      svg: svg("Pompe et réseau", `${line(x0, y0, x1, y0, "#334155")}${line(x0, y0, x0, y1, "#334155")}${poly(pumpPts, PALETTE.hgl, 2.5)}${poly(netPts, PALETTE.force, 2.5)}${line(X(Q), y0, X(Q), Y(H), "#64748b", 1.2, 'stroke-dasharray="4 3"')}${line(x0, Y(H), X(Q), Y(H), "#64748b", 1.2, 'stroke-dasharray="4 3"')}<circle cx="${X(Q)}" cy="${Y(H)}" r="5" fill="#0f172a"/>${t(510, 214, "Q")}${t(40, 36, "H")}${t(X(Q * 0.35), Y(H0) + 18, "pompe", `fill="${PALETTE.hgl}"`)}${t(X(Q * 1.15) + 8, Y(Hg + r * (Q * 1.15) ** 2) - 8, "réseau", `fill="${PALETTE.force}"`)}${t(X(Q) + 8, Y(H) - 8, `(${num(Q * 1000)} L/s ; ${num(H)} m)`)}${t(90, 236, `H₀ = ${num(d.H0)} m · H_g = ${num(d.Hg)} m`)}`)
    };
  },
  thinWeir(d) {
    const h = Math.max(+d.h || 0.2, 0.02);
    const up = isoChannel({ b: Math.max(+d.L || 4, 2), y: Math.max(h + 0.6, 0.8), z: 0 }, { L: 2.6, s: 16, ox: 30, oy: 222, wall: 1.6 });
    const down = isoChannel({ b: Math.max(+d.L || 4, 2), y: 0.35, z: 0 }, { L: 2.4, s: 16, ox: 280, oy: 222, wall: 1.6 });
    return {
      caption: "Nappe au-dessus de la crête : Q = Cᵈ L √(2g) h^{3/2}. h se mesure en amont, au-dessus du seuil — pas depuis le fond.",
      svg: svg("Déversoir mince", `${up.body}${isoFace([[248, 150], [278, 138], [278, 210], [248, 222]], "#94a3b8")}${down.body}${t(36, 32, `h = ${num(d.h)} m · L = ${num(d.L)} m · Cᵈ = ${num(d.Cd)}`)}${t(36, 52, "amont")}${t(380, 52, "aval")}`)
    };
  },
  hydraulicJump(d) {
    const y1 = Math.max(+d.y1 || 0.3, 0.05), V1 = +d.V1 || 1;
    const Fr1 = V1 / Math.sqrt(Gfig * y1);
    const y2 = 0.5 * y1 * (-1 + Math.sqrt(1 + 8 * Fr1 ** 2));
    const dE = (y2 - y1) ** 3 / (4 * y1 * y2);
    const Lr = 6 * y2;
    const ch1 = isoChannel({ b: 4.2, y: y1, z: 0 }, { L: 2.4, s: 22, ox: 36, oy: 222, wall: Math.max(y2, y1) * 1.15 + 0.5 });
    const ch2 = isoChannel({ b: 4.2, y: y2, z: 0 }, { L: 3.4, s: 22, ox: 210, oy: 222, wall: Math.max(y2, y1) * 1.15 + 0.5 });
    return {
      caption: "Ressaut : transition turbulente de y₁ (torrentiel) à y₂ (fluvial). y₂ vient de Bélanger ; L_r ≈ 6 y₂ ; ΔE dans le rouleau.",
      svg: svg("Ressaut hydraulique", `${ch1.body}${ch2.body}${t(36, 32, `y₁ = ${num(d.y1)} m · V₁ = ${num(d.V1)} m/s · Fr₁ = ${num(Fr1)}`)}${t(300, 32, `y₂ = ${num(y2)} m · ΔE = ${num(dE)} m`)}${t(36, 52, `L_r ≈ ${num(Lr)} m`)}`)
    };
  },
  criticalRegime(d) {
    const y = Math.max(+d.y || 1, 0.1), b = +d.b || 1, Q = +d.Q || 1;
    const yc = (Q ** 2 / (Gfig * b * b)) ** (1 / 3);
    const Fr = (Q / (b * y)) / Math.sqrt(Gfig * y);
    const regime = Fr < 1 ? "fluvial (y > y_c)" : Fr > 1 ? "torrentiel (y < y_c)" : "critique";
    const ch = isoChannel({ b: d.b, y: d.y, z: 0 }, { L: 6.2, s: 17, ox: 48, oy: 224 });
    return {
      caption: "y_c = (Q²/(g b²))^{1/3}. y > y_c : fluvial ; y < y_c : torrentiel.",
      svg: svg("Régime d’un canal", `${ch.body}${t(36, 32, `y = ${num(d.y)} m · y_c = ${num(yc)} m · Fr = ${num(Fr)}`)}${t(36, 52, `Q = ${num(d.Q)} m³/s · b = ${num(d.b)} m · ${regime}`)}`)
    };
  },
  turbinePower(d) {
    const H = +d.H || 38, hv = Math.max(H * 0.06, 1.2);
    const yBed = 210, Y = h => headY(h, Math.max(H, 1), yBed, 150);
    const yHigh = Y(H), yLow = Y(0), yT = (yHigh + yLow) / 2;
    const hHigh = Math.max(28, Math.min(yBed - yHigh, 48));
    const hLow = Math.max(32, Math.min(yBed - yLow, 52));
    const stations = [
      { x: 50, egl: yHigh, hgl: yHigh },
      { x: 176, egl: yHigh, hgl: yHigh },
      { x: 250, egl: Y(H), hgl: Y(H - hv) },
      { x: 250, egl: Y(0), hgl: Y(-hv) },
      { x: 380, egl: yLow, hgl: yLow },
      { x: 500, egl: yLow, hgl: yLow }
    ];
    return {
      caption: "Turbine : l’eau descend. EGL chute d’un cran −H (chute nette) à la machine — l’inverse du saut +HMT d’une pompe.",
      svg: svg("Turbine entre deux plans d’eau", `${drawWaterSurface(36, yHigh, 140, hHigh)}${drawWaterSurface(380, yLow, 140, hLow)}${hatch(36, yHigh + hHigh, 140, 12)}${hatch(380, yLow + hLow, 140, 12)}<path d="M176 ${yHigh + 22}h50V${yT}H306" fill="none" stroke="#475569" stroke-width="9"/><circle cx="250" cy="${yT}" r="22" fill="#0f766e"/>${t(242, yT + 5, "T", 'fill="#fff"')}${drawEnergyLines(stations)}${drawDimension(268, yHigh, 268, yLow, `−H = ${num(d.H)} m`)}${t(50, yHigh - 10, "amont")}${t(390, yLow - 10, "aval")}${t(70, yHigh - 8, "EGL", `fill="${PALETTE.egl}"`)}${t(160, 236, `Q = ${num(d.Q)} m³/s · η = ${num(d.eta)}`)}`)
    };
  },
  gravityValve(d) {
    const g = iterateGravity(d, (+d.Kother || 2) + (+d.Kv0 || 2));
    const yPipe = 168, hMax = Math.max(g.H, 1);
    const Y = head => headY(head, hMax, yPipe, 110);
    const xV = 278;
    const egl = [[50, Y(g.H)], [166, Y(g.H)], [xV - 8, Y(g.H - 0.5 * g.hf)], [xV + 8, Y(g.H - 0.5 * g.hf - 0.5 * g.hs)], [390, Y(g.hv)]];
    const hgl = [[176, Y(g.H - g.hv)], [xV - 8, Y(g.H - 0.5 * g.hf - g.hv)], [xV + 8, Y(g.H - 0.5 * g.hf - 0.5 * g.hs - g.hv)], [390, Y(0)]];
    return {
      caption: "EGL part de la surface amont, pente h_f, et un cran vertical à la vanne (Kᵥ V²/2g). HGL reste sous EGL de V²/2g.",
      svg: svg("Conduite gravitaire et vanne", `${drawWaterSurface(36, 70, 130, 50)}${drawWaterSurface(390, 140, 130, 50)}${hatch(36, 120, 130, 12)}${hatch(390, 190, 130, 12)}<path d="M166 96h224" fill="none" stroke="#475569" stroke-width="10"/>${flow("M170 96h200")}<rect x="268" y="78" width="22" height="36" fill="#64748b" stroke="#334155"/>${drawEnergyLines({ egl: egl, hgl: hgl })}${t(50, 58, `H = ${num(d.H)} m`)}${t(70, Y(g.H) - 8, "EGL", `fill="${PALETTE.egl}"`)}${t(186, Y(g.H - g.hv) + 14, "HGL", `fill="${PALETTE.hgl}"`)}${t(248, 68, "vanne · Kᵥ")}${t(180, 236, `D = ${num(d.D)} mm · L = ${num(d.L)} m`)}`)
    };
  },
  channelDischarge(d) {
    const ch = isoChannel({ b: d.b, y: d.y, z: 0 }, { L: 6.4, s: 18, ox: 42, oy: 224 });
    return {
      caption: "Prisme rectangulaire : Q = b y V. Ici on ne cherche pas une pente ni un Strickler — seulement le débit.",
      svg: svg("Canal rectangulaire", `${ch.body}${t(36, 36, `y = ${num(d.y)} m · b = ${num(d.b)} m`)}${t(36, 56, `V = ${num(d.V)} m/s · Q = b y V`)}`)
    };
  },
  froudeForceTime(d) {
    return {
      caption: "Houle en similitude de Froude : λt = √N, λF = N³ (même fluide). Ce n’est pas un évacuateur.",
      svg: svg("Houle sur un ouvrage", `${drawWaterSurface(40, 130, 210, 70)}<path d="M40 130q35-28 70 0q35 28 70 0q35-28 70 0" fill="none" stroke="${PALETTE.water}" stroke-width="3"/><rect x="175" y="70" width="28" height="130" fill="#94a3b8" stroke="#334155"/>${drawWaterSurface(330, 155, 190, 45)}<path d="M330 155q24-16 48 0q24 16 48 0q24-16 48 0q24 16 46 0" fill="none" stroke="${PALETTE.water}" stroke-width="2"/><rect x="430" y="118" width="14" height="82" fill="#94a3b8" stroke="#334155"/>${t(60, 50, "prototype")}${t(350, 100, `modèle 1/${num(d.N)}`)}${t(50, 230, `Fₘ = ${num(d.Fm)} N · tₘ = ${num(d.tm)} s`)}`)
    };
  },
  pitotWater(d) {
    const h = Math.max(+d.h || 40, 5);
    const hPx = clamp(h * 1.2, 28, 90);
    return {
      caption: "Pitot ouvert à l’eau : pas de mercure. La colonne h mesure V²/2g, donc V = √(2gh).",
      svg: svg("Tube de Pitot à l’eau", `<path d="M20 80h360v50H20z" fill="${PALETTE.waterFill}" stroke="${PALETTE.water}" stroke-width="3"/>${flow("M40 105h100")}${drawVector(40, 88, 70, 0, "velocity", "V")}<path d="M200 105h90l20-20v-${hPx}" fill="none" stroke="#334155" stroke-width="7"/><path d="M308 ${85 - hPx}v${hPx + 20}" fill="none" stroke="${PALETTE.water}" stroke-width="5"/>${drawDimension(330, 85 - hPx, 330, 105, `h = ${num(d.h)} mm`, { side: -1 })}${t(30, 68, "écoulement")}${t(350, 68, "p₀ − p = ρgh · pas de Hg")}`)
    };
  },
  momentumHold(d) {
    return {
      caption: "Pour tenir le réservoir : F_maintien = ρQV vers l’amont, opposée à la réaction du jet. Ce n’est pas la force sur le fluide.",
      svg: svg("Maintien contre un jet", `${hatch(80, 200, 220, 14)}${drawWaterSurface(90, 70, 200, 130)}<path d="M290 150h90" fill="none" stroke="${PALETTE.water}" stroke-width="12"/>${flow("M300 150h90")}${drawVector(160, 110, -120, 0, "force", "F maintien")}${t(320, 130, `V = ${num(d.V)} m/s`)}${t(80, 230, `Q = ${num(d.Q)} L/s`)}`)
    };
  },
  reynoldsSpeed(d) {
    return {
      caption: "Re constant, même fluide en conduite : le modèle (plus petit) doit aller N fois plus vite. Ce n’est pas une traînée d’obstacle.",
      svg: svg("Similitude de Reynolds", `<path d="M40 80h220v50H40z" fill="${PALETTE.waterFill}" stroke="${PALETTE.water}" stroke-width="3"/><path d="M340 100h140v30H340z" fill="${PALETTE.waterFill}" stroke="${PALETTE.water}" stroke-width="3"/>${flow("M50 105h180")}${flow("M350 115h110")}${t(50, 68, "prototype · Vₚ = Vₘ/N")}${t(340, 88, `modèle 1/${num(d.N)}`)}${t(50, 170, `Vₘ = ${num(d.Vm)} m/s`)}${t(50, 220, "Reₘ = Reₚ  ⇒  Vₘ Lₘ = Vₚ Lₚ")}`)
    };
  },
  froudeScale(d) {
    return {
      caption: "Échelles de Froude pures : λV = √N, λQ = N^(5/2). On en déduit Qₘ = Qₚ/λQ, sans dessin d’évacuateur obligatoire.",
      svg: svg("Échelles de Froude", `${t(60, 70, `N = ${num(d.N)}`)}${t(60, 110, `λV = √N`)}${t(60, 140, `λQ = N^{5/2}`)}${t(60, 180, `Qₚ = ${num(d.Qp)} m³/s`)}${t(60, 210, `Vₘ = ${num(d.Vm)} m/s`)}<path d="M300 50h80l30 70h70V50h70v160H300z" fill="#cbd5e1" stroke="#334155"/><path d="M380 50l30 70h70V50" fill="${PALETTE.waterFill}" stroke="${PALETTE.water}"/>${t(310, 40, "prototype")}`)
    };
  },

  unknownDensityColumn(d) {
    const h = Math.max(+d.h || 1.06, 0.2);
    const hPx = clamp(h * 90, 70, 140);
    return {
      caption: "p_F = 0 (atmosphère). En descendant de A vers F dans le liquide B, la pression augmente de ρ_B g h. Donc ρ_B = −p_A /(g h) si p_A < 0.",
      svg: svg("Colonne du liquide B", `${isoTank(220, 210 - hPx, 70, hPx, "rgba(14,165,233,0.35)")}${t(310, 70, "A")}${t(310, 200, "F · p = 0")}${drawDimension(310, 210 - hPx, 310, 210, `h = ${num(d.h)} m`, { side: -1 })}${t(40, 40, `p_A = ${num(d.pA)} MPa`)}${t(40, 64, "liquide B · ρ inconnue")}`)
    };
  },
  threeFluidUTube(d) {
    return {
      caption: "Les deux branches sont à l’atmosphère. On chemine : huile puis mercure à gauche, mercure puis eau à droite. Z₁−Z₂, Z₄−Z₃ et Z₂+Z₃ ferment le système.",
      svg: svg("Tube en U à trois fluides", `<path d="M120 40v130q0 36 36 36h248q36 0 36-36V40" fill="none" stroke="#475569" stroke-width="22"/>
        <path d="M120 40v48" fill="none" stroke="#f59e0b" stroke-width="14"/>
        <path d="M120 88v82q0 28 28 28h100" fill="none" stroke="#d97706" stroke-width="14"/>
        <path d="M440 40v70" fill="none" stroke="${PALETTE.water}" stroke-width="14"/>
        <path d="M440 110v60q0 28-28 28H280" fill="none" stroke="#d97706" stroke-width="14"/>
        ${t(40, 48, "A · huile")}${t(40, 100, `Z₁`)}${t(40, 150, `Z₂ · Hg`)}${t(470, 48, "D · eau")}${t(470, 100, `Z₄`)}${t(470, 160, `Z₃ · Hg`)}
        ${t(80, 230, `Z₁−Z₂ = ${num((+d.d12 || 20))} cm · Z₄−Z₃ = ${num((+d.d43 || 9))} cm · Z₂+Z₃ = ${num((+d.s23 || 100))} cm`)}`)
    };
  },
  penstockNozzle(d) {
    const zR = +d.zR || 1700, z1 = +d.z1 || 1600, z2 = +d.z2 || 1300;
    return {
      caption: "Fluide parfait : Bernoulli entre le plan d’eau, l’entrée de la conduite forcée et la sortie de tuyère (p = pₐₜₘ).",
      svg: svg("Conduite forcée et tuyère", `${drawWaterSurface(30, 48, 130, 40)}${hatch(30, 88, 130, 14)}<path d="M160 78h200l80 70h80" fill="none" stroke="#475569" stroke-width="10"/>${flow("M170 78h180l80 70h60")}
        ${t(40, 40, `plan d’eau ${num(d.zR)} m`)}${t(170, 64, `départ ${num(d.z1)} m`)}${t(360, 130, `tuyère ${num(d.z2)} m`)}
        ${t(40, 220, `S = ${num(d.S)} m² · s_tuyère = ${num(d.sNoz)} m² · Δz = ${num(zR - z2)} m`)}`)
    };
  },
  darcyMoodyRe(d) {
    return figures.moodyRead({ Re: d.Re, epsRel: (+d.eps || 0.15) / Math.max(+d.D || 75, 1) });
  },
  gradualEnlargement(d) {
    return {
      caption: "Élargissement conique : K vient de l’angle (Crane). Ce n’est pas Borda, sauf si le cône est trop brusque.",
      svg: svg("Élargissement conique", `<path d="M40 100h180l160-50v120L220 220H40z" fill="${PALETTE.waterFill}" stroke="${PALETTE.water}" stroke-width="3"/>${flow("M50 160h360")}
        ${t(50, 80, `D₁ = ${num(d.D1)} mm`)}${t(340, 40, `D₂ = ${num(d.D2)} mm`)}${t(50, 236, `θ = ${num(d.theta)}° · Q = ${num(d.Q)} L/s`)}`)
    };
  },
  seriesConePipe(d) {
    return {
      caption: "Trois tronçons en série : pertes linéaires Darcy sur AB, CD, EF ; pertes de cône sur BC (contraction) et DE (élargissement).",
      svg: svg("Conduite à diamètre variable", `<path d="M20 120h140l70-28h90l70 28h140v36H390l-70-20H230l-70 20H20z" fill="${PALETTE.waterFill}" stroke="${PALETTE.water}" stroke-width="2.4"/>${flow("M30 138h480")}
        ${t(40, 100, "AB")}${t(230, 70, "CD")}${t(420, 100, "EF")}${t(40, 220, `Q = ${num(d.Q)} L/s · H_A = ${num(d.HA)} m`)}`)
    };
  },
  hazenWilliams(d) {
    return {
      caption: "Hazen–Williams : formule empirique d’AEP, J = 10,67 Q^{1,852}/(C^{1,852} D^{4,87}). Ce n’est pas Colebrook.",
      svg: svg("Hazen–Williams", `<path d="M40 130h480" stroke="#475569" stroke-width="16"/>${flow("M50 130h400")}${t(40, 70, `C = ${num(d.C)}`)}${t(40, 100, `D = ${num(d.D)} cm · L = ${num(d.L)} m`)}${t(40, 210, Number.isFinite(+d.hf) ? `J donnée → Q` : `Q donné → h_f`)}`)
    };
  },
  pipeABPressure(d) {
    return {
      caption: "Conduite horizontale : Bernoulli avec h_f (et h_s s’il y en a). p_B = p_A − ρg (h_f + h_s).",
      svg: svg("Pression entre A et B", `<path d="M60 130h440" stroke="#475569" stroke-width="14"/>${flow("M70 130h360")}${t(70, 100, "A")}${t(460, 100, "B")}${t(40, 210, `D = ${num(d.D)} cm · Q = ${num(d.Q)} m³/h · L = ${num(d.L)} m`)}`)
    };
  },
  hazenParallelNetwork(d) {
    return {
      caption: "A₁ et A₂ en parallèle jusqu’à C (même ΔH). Puis CB et CD. Hazen–Williams sur chaque tronçon.",
      svg: svg("Réseau Hazen–Williams", `<path d="M40 80h80" stroke="#475569" stroke-width="10"/>
        <path d="M120 80q80-40 160 0" fill="none" stroke="#475569" stroke-width="8"/>
        <path d="M120 80q80 40 160 0" fill="none" stroke="#475569" stroke-width="8"/>
        <path d="M280 80h80" stroke="#475569" stroke-width="10"/>
        <path d="M360 80h80v50" fill="none" stroke="#475569" stroke-width="8"/>
        <path d="M360 80h120" stroke="#475569" stroke-width="8"/>
        ${t(36, 70, "A")}${t(200, 36, "(1)")}${t(200, 140, "(2)")}${t(300, 66, "C")}${t(500, 70, "D")}${t(420, 150, "B")}
        ${t(40, 210, `Q_A = ${num(d.QA)} L/s · C = ${num(d.C)}`)}`)
    };
  },
  seriesPipeHGL(d) {
    const D1 = (+d.D1 || 30) / 100, D2 = (+d.D2 || 15) / 100, V1 = +d.V || 2.41;
    const V2 = V1 * (D1 / D2) ** 2;
    const hv1 = V1 * V1 / (2 * Gfig), hv2 = V2 * V2 / (2 * Gfig);
    const f1 = +d.f1 || 0.02, f2 = +d.f2 || 0.015, f3 = +d.f3 || 0.02;
    const L1 = +d.L1 || 60, L2 = +d.L2 || 30, L3 = +d.L3 || 30;
    const Kc = +d.K || 0.37;
    const hf1 = f1 * (L1 / D1) * hv1, hf2 = f2 * (L2 / D2) * hv2, hf3 = f3 * (L3 / D1) * hv1;
    const hsC = Kc * hv2, hsE = (V2 - V1) ** 2 / (2 * Gfig);
    const HpiezA = +d.Hp || 60;
    const HA = HpiezA + hv1;
    const egl = [HA, HA - hf1, HA - hf1 - hsC, HA - hf1 - hsC - hf2, HA - hf1 - hsC - hf2 - hsE, HA - hf1 - hsC - hf2 - hsE - hf3];
    const hgl = [HpiezA, egl[1] - hv1, egl[2] - hv2, egl[3] - hv2, egl[4] - hv1, egl[5] - hv1];
    const xs = [40, 160, 175, 320, 335, 500];
    const hMax = Math.max(...egl, 1);
    const Y = h => headY(h, hMax, 200, 140);
    const stations = xs.map((x, i) => ({ x, egl: Y(egl[i]), hgl: Y(hgl[i]), mark: i === 2 || i === 4 }));
    return {
      caption: "Conduite horizontale 30-15-30 cm. EGL chute de h_f et des singularités ; HGL = EGL − V²/2g (plus basse dans le 15 cm).",
      svg: svg("Lignes de charge en série", `<path d="M40 168h120v0h20l0-18h130v18h20v0h150" fill="none" stroke="#475569" stroke-width="10"/>
        ${drawEnergyLines(stations)}
        ${t(36, 36, "EGL", `fill="${PALETTE.egl}"`)}${t(90, 36, "HGL", `fill="${PALETTE.hgl}"`)}
        ${t(50, 156, "A")}${t(175, 130, "15 cm")}${t(480, 156, "F")}
        ${t(40, 230, `V₃₀ = ${num(d.V)} m/s · H_piéz A = ${num(d.Hp)} m`)}`)
    };
  },
  canalThreeReaches(d) {
    const a = isoChannel({ b: d.b, y: d.yA, z: d.z }, { L: 2.2, s: 14, ox: 28, oy: 222, wall: 2.2 });
    const bch = isoChannel({ b: d.b, y: 1.84, z: 0 }, { L: 2.2, s: 14, ox: 200, oy: 222, wall: 2.2 });
    const c = isoChannel({ b: d.b, y: d.yC, z: 0 }, { L: 2.2, s: 14, ox: 370, oy: 222, wall: 2.2 });
    return {
      caption: "Trois biefs prismatiques : A trapèze (Manning), B rectangle (Chézy), C rectangle plus mince. On lit le régime par y ≷ y_c.",
      svg: svg("Canal à trois tronçons", `${a.body}${bch.body}${c.body}${t(40, 32, "A trapèze")}${t(210, 32, "B rectangle")}${t(390, 32, "C")}${t(40, 52, `Q = ${num(d.Q)} m³/s · n = ${num(d.n)} · C = ${num(d.C)}`)}`)
    };
  },
  triangularTwoSlopes(d) {
    const a = isoChannel({ b: 0.05, y: 0.46, z: 1 }, { L: 3.2, s: 22, ox: 50, oy: 222, wall: 1.5 });
    const bch = isoChannel({ b: 0.05, y: 1, z: 1 }, { L: 3.2, s: 22, ox: 280, oy: 222, wall: 1.5 });
    return {
      caption: "Triangle isocèle (berges 1:1). Deux pentes assez longues pour y_n de part et d’autre. Allure : torrentiel puis fluvial.",
      svg: svg("Canal triangulaire à deux pentes", `${a.body}${bch.body}${t(40, 32, `i₁ = 1/${num(d.i1inv || 12)}`)}${t(300, 32, `y₂ = ${num(d.y2)} m`)}${t(40, 52, `Q = ${num(d.Q)} m³/s · n = ${num(d.n)}`)}`)
    };
  },
  specificEnergyStep(d) {
    const up = isoChannel({ b: d.b, y: d.y1, z: 0 }, { L: 2.8, s: 12, ox: 30, oy: 222, wall: Math.max(+d.y1 || 2, 1) * 1.1 });
    const down = isoChannel({ b: d.b, y: Math.max((+d.y1 || 2) - (+d.z || 0.5) * 0.4, 0.4), z: 0 }, { L: 2.6, s: 12, ox: 280, oy: 206, wall: Math.max(+d.y1 || 2, 1) * 1.1 });
    return {
      caption: "Seuil / marche : E₂ = E₁ − z. On résout y + q²/(2g y²) = E₂ et on garde la racine du même régime (en général la plus grande en fluvial).",
      svg: svg("Charge spécifique sur un seuil", `${up.body}${down.body}${t(36, 32, `y₁ = ${num(d.y1)} m · z = ${num(d.z)} m`)}${t(36, 52, `Q = ${num(d.Q)} m³/s · b = ${num(d.b)} m`)}`)
    };
  },
  canalSlopeBreak(d) {
    const a = isoChannel({ b: d.b1, y: 0.38, z: 0 }, { L: 2.4, s: 16, ox: 28, oy: 222, wall: 1.6 });
    const bch = isoChannel({ b: d.b1, y: 0.82, z: 0 }, { L: 2.4, s: 16, ox: 200, oy: 222, wall: 1.6 });
    const c = isoChannel({ b: d.b3, y: d.y3, z: 0 }, { L: 2.2, s: 16, ox: 370, oy: 222, wall: 1.6 });
    return {
      caption: "Rupture de pente puis rétrécissement. y_n de Manning sur (1) et (2) ; un ressaut raccorde souvent le torrentiel au fluvial.",
      svg: svg("Rupture de pente", `${a.body}${bch.body}${c.body}${t(36, 32, `i₁ = ${num(d.i1)}`)}${t(210, 32, `i₂ = ${num(d.i2)}`)}${t(380, 32, `b₃ = ${num(d.b3)} m`)}${t(36, 52, `Q = ${num(d.Q)} m³/s · n = ${num(d.n)}`)}`)
    };
  }
};

export { moodyChart, moodyPoint };

export function drawFigure(type, data) {
  const figure = figures[type];
  if (!figure) {
    return {
      caption: "Repérer les sections, les cotes et le sens de l’écoulement avant d’écrire les bilans.",
      svg: svg("Schéma", `${t(40, 120, "Schéma non disponible pour ce type.")}`)
    };
  }
  return figure(data);
}
