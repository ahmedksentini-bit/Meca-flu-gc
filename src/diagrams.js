const esc = value => String(value ?? "").replace(/[&<>'"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c]));
const num = (value, digits = 3) => Number.isFinite(+value) ? Number(value).toLocaleString("fr-FR", { maximumSignificantDigits: digits }) : "—";

function svg(label, body) {
  return `<svg viewBox="0 0 560 250" role="img" aria-label="${esc(label)}"><defs>
    <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0v6" stroke="#94a3b8" stroke-width="1"/></pattern>
    <marker id="ar" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="#0f172a"/></marker>
    <marker id="arb" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="#0369a1"/></marker>
    <marker id="arr" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="#b91c1c"/></marker>
    <style>text{font-family:Inter,system-ui,sans-serif;font-size:12.5px;font-weight:700;fill:#0f172a}</style>
  </defs>${body}</svg>`;
}

const t = (x, y, text, extra = "") => `<text x="${x}" y="${y}" ${extra}>${text}</text>`;
const line = (x1, y1, x2, y2, color = "#0f172a", width = 1.6, extra = "") =>
  `<path d="M${x1} ${y1}L${x2} ${y2}" fill="none" stroke="${color}" stroke-width="${width}" ${extra}/>`;
const hatch = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#hatch)" stroke="#334155" stroke-width="1.4"/>`;
const water = (d, extra = "") => `<path d="${d}" fill="#bae6fd" stroke="#0284c7" stroke-width="1.6" ${extra}/>`;
const oil = d => `<path d="${d}" fill="#fde68a" stroke="#b45309" stroke-width="1.4"/>`;
const flow = d => `<path class="flow-animate" d="${d}" fill="none" stroke="#0284c7" stroke-width="3.2" stroke-dasharray="12 8" marker-end="url(#arb)"/>`;

function dimV(x, y1, y2, label, side = 1) {
  const mid = (y1 + y2) / 2, s = side >= 0 ? 1 : -1;
  return `${line(x, y1, x, y2, "#b91c1c", 1.3)}${line(x - 5, y1, x + 5, y1, "#b91c1c", 1.3)}${line(x - 5, y2, x + 5, y2, "#b91c1c", 1.3)}${t(x + s * 8, mid + 4, label, `fill="#b91c1c" ${s < 0 ? 'text-anchor="end"' : ""}`)}`;
}
function dimH(y, x1, x2, label, side = -1) {
  const mid = (x1 + x2) / 2;
  return `${line(x1, y, x2, y, "#b91c1c", 1.3)}${line(x1, y - 5, x1, y + 5, "#b91c1c", 1.3)}${line(x2, y - 5, x2, y + 5, "#b91c1c", 1.3)}${t(mid, y + (side < 0 ? -6 : 16), label, 'text-anchor="middle" fill="#b91c1c"')}`;
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
    const arrows = [0, 1, 2, 3, 4].map(i => {
      const y = 168 - i * 18, len = 18 + i * 28;
      return `${line(70, y, 70 + len, y, "#0369a1", 2, 'marker-end="url(#arb)"')}`;
    }).join("");
    const forceOrMu = Number.isFinite(d.F) ? `F = ${num(d.F)} N` : `μ = ${num(d.mu)} Pa·s`;
    return {
      caption: "Écoulement de Couette : le fluide adhère aux deux plaques. Le profil de vitesse est linéaire, donc τ = μU/e.",
      svg: svg("Couette plan", `${hatch(40, 36, 360, 16)}${water("M40 52h360v120H40z")}${hatch(40, 172, 360, 16)}${arrows}${line(70, 168, 182, 96, "#0369a1", 1.4, 'stroke-dasharray="4 3"')}${line(80, 28, 250, 28, "#b91c1c", 2.2, 'marker-end="url(#arr)"')}${t(255, 24, `U = ${num(d.U)} m/s`, 'fill="#b91c1c"')}${t(255, 44, forceOrMu, 'fill="#b91c1c"')}${dimV(420, 52, 172, `e = ${num(d.e)} mm`)}${t(48, 228, "plaque fixe · u = 0")}${t(250, 228, `A = ${num(d.A)} m²`)}`)
    };
  },

  density(d) {
    if (Number.isFinite(d.D) && Number.isFinite(d.h)) {
      return {
        caption: "Réservoir cylindrique : 𝒱 = πD²h/4, puis ρ = m/𝒱, γ = ρg et d = ρ/ρeau.",
        svg: svg("Réservoir cylindrique d’huile", `${hatch(150, 200, 220, 18)}${oil("M168 58h184v142H168z")}${line(168, 58, 352, 58, "#b45309", 3)}${dimV(140, 58, 200, `h = ${num(d.h)} m`, -1)}${dimH(218, 168, 352, `D = ${num(d.D)} m`)}${t(200, 48, `huile · m = ${num(d.mass)} kg`)}${t(175, 188, "réservoir")}`)
      };
    }
    return {
      caption: "Le poids W est une force verticale. On en déduit m = W/g, puis ρ = m/𝒱.",
      svg: svg("Réservoir d’huile", `${hatch(150, 200, 220, 18)}${oil("M168 58h184v142H168z")}${line(168, 58, 352, 58, "#b45309", 3)}${t(200, 48, `huile · 𝒱 = ${num(d.volume)} m³`)}${line(260, 88, 260, 168, "#b91c1c", 2.2, 'marker-end="url(#arr)"')}${t(272, 132, `W = ${num(d.W)} kN`, 'fill="#b91c1c"')}${t(175, 188, "réservoir")}`)
    };
  },

  compressibility(d) {
    return {
      caption: "Piston-cylindre fermé : la masse d’eau se conserve, seul le volume diminue quand p augmente.",
      svg: svg("Compression d’un volume d’eau", `${hatch(70, 70, 28, 110)}<rect x="98" y="78" width="250" height="94" fill="#bae6fd" stroke="#0369a1" stroke-width="3"/>${hatch(348, 70, 22, 110)}${line(30, 125, 70, 125, "#b91c1c", 3, 'marker-end="url(#arr)"')}${t(28, 60, `p₁ = ${num(d.p1)} bar → p₂ = ${num(d.p2)} bar`)}${t(150, 130, `𝒱₁ = ${num(d.volume)} m³`)}${t(145, 155, `K = ${num(d.K)} GPa`)}${t(120, 220, "eau — compression isotherme")}`)
    };
  },

  coaxialViscometer(d) {
    return {
      caption: "Coupe : le cylindre intérieur tourne, l’extérieur est fixe. L’entrefer mince e = Rₑ − Rᵢ est un Couette enroulé.",
      svg: svg("Viscosimètre coaxial", `<rect x="120" y="36" width="88" height="168" fill="#e2e8f0" stroke="#334155" stroke-width="7"/><rect x="142" y="52" width="44" height="136" fill="#bae6fd" stroke="#075985" stroke-width="5"/>${t(250, 58, `N = ${num(d.rpm)} tr/min`)}${t(250, 86, `Rᵢ = ${num(d.ri)} mm`)}${t(250, 114, `Rₑ = ${num(d.ro)} mm`)}${t(250, 142, `L = ${num(d.L)} mm`)}${t(250, 170, `C = ${num(d.torque)} N·m`)}${line(210, 70, 248, 48, "#b91c1c", 1.8, 'marker-end="url(#arr)"')}${t(130, 228, "fixe")} ${t(155, 28, "ω")}`)
    };
  },

  capillary(d) {
    return {
      caption: "Loi de Jurin : la composante verticale de σ équilibre le poids de la colonne. Un liquide mouillant (θ < 90°) monte.",
      svg: svg("Ascension capillaire", `${water("M40 150h200v60H40z")}${hatch(40, 210, 200, 14)}<path d="M128 28v182" fill="none" stroke="#334155" stroke-width="14"/><path d="M137 208V78q0-16 11-16t11 16v130" fill="#7dd3fc" stroke="#0284c7" stroke-width="1"/>${dimV(175, 78, 150, `h`)}${t(250, 80, `d = ${num(d.d)} mm`)}${t(250, 108, `θ = ${num(d.theta)}°`)}${t(250, 136, `σ = ${num(d.sigma)} N/m`)}${t(48, 142, "surface libre")}`)
    };
  },

  laplace(d) {
    const bubble = +d.factor === 4;
    return {
      caption: bubble ? "Bulle de savon : deux interfaces, Δp = 4σ/R." : "Goutte : une seule interface, Δp = 2σ/R. Plus R est petit, plus la surpression est grande.",
      svg: svg(bubble ? "Bulle de savon" : "Goutte", `<circle cx="200" cy="120" r="62" fill="#e0f2fe" stroke="#0284c7" stroke-width="3"/>${bubble ? '<circle cx="200" cy="120" r="52" fill="none" stroke="#7dd3fc" stroke-width="2"/>' : ""}${line(200, 120, 262, 120, "#b91c1c", 1.5)}${t(208, 112, `R = ${num(d.radius)} µm`, 'fill="#b91c1c"')}${t(330, 90, "p + Δp")}${t(330, 120, bubble ? "2 interfaces" : "1 interface")}${t(330, 150, `Δp = ${d.factor}σ/R`)}`)
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
      svg: svg("Récipient de gaz", `<rect x="90" y="50" width="200" height="130" rx="8" fill="#e0f2fe" stroke="#0369a1" stroke-width="3.5"/><circle cx="290" cy="70" r="18" fill="#fff" stroke="#b91c1c" stroke-width="2"/>${t(282, 75, "p", 'fill="#b91c1c"')}<rect x="168" y="36" width="44" height="18" fill="#fff" stroke="#0369a1" stroke-width="2"/>${t(176, 50, "T")}${t(330, 90, `T = ${num(d.temp)} °C`)}${t(330, 120, `p = ${num(d.pressure)} bar`)}${t(330, 150, `R = ${num(d.R)} J/(kg·K)`)}${extra}${t(120, 210, "air — équation d’état")}`)
    };
  },

  pressureDepth(d) {
    return {
      caption: "Hydrostatique : en descendant de h, la pression relative augmente de ρgh. L’absolue ajoute pₐₜₘ.",
      svg: svg("Plongeur en profondeur", `${water("M40 48h360v150H40z")}${line(40, 48, 400, 48, "#0369a1", 3)}${t(48, 38, "surface libre · pₐₜₘ")}<circle cx="230" cy="168" r="13" fill="#ea580c"/>${dimV(250, 48, 168, `h = ${num(d.h)} m`)}${t(270, 175, "plongeur · p")}${t(420, 80, `ρ = ${num(d.rho)} kg/m³`)}`)
    };
  },

  layeredPressure(d) {
    const oilH = 46, waterH = Math.max(50, 46 * ((+d.hWater || 3) / (+d.hOil || 2)));
    const yOil = 48, yWater = yOil + oilH;
    return {
      caption: "Deux fluides non miscibles : on ajoute ρgh couche par couche. La pression est continue à l’interface.",
      svg: svg("Réservoir à deux couches", `${hatch(118, 28, 14, 190)}<path d="M132 28v190h230" fill="none" stroke="#334155" stroke-width="6"/>${oil(`M132 ${yOil}h230v${oilH}H132z`)}${water(`M132 ${yWater}h230v${waterH}H132z`)}${dimV(380, yOil, yWater, `huile ${num(d.hOil)} m`)}${dimV(380, yWater, yWater + waterH, `eau ${num(d.hWater)} m`)}${t(150, yOil + 28, "interface · pᵢ")}${t(150, yWater + waterH - 10, "fond · p_f")}`)
    };
  },

  manometer(d) {
    if (Number.isFinite(d.zConnect)) {
      return {
        caption: "Les axes A et B ne sont pas à la même cote. On chemine : descente dans l’eau, montée dans le mercure, remontée vers B.",
        svg: svg("Manomètre différentiel décalé", `<path d="M90 36v24h70" fill="none" stroke="#64748b" stroke-width="10"/><path d="M430 20v40h-70" fill="none" stroke="#64748b" stroke-width="10"/><path d="M160 60v80q0 28 28 28h184q28 0 28-28V60" fill="none" stroke="#475569" stroke-width="16"/><path d="M168 128v20q0 16 18 16h184q18 0 18-16V92" fill="none" stroke="#d97706" stroke-width="10"/>${dimV(40, 36, 60, `A`)}${dimV(500, 20, 60, `B +${num(d.dzAB)} m`)}${dimV(455, 92, 148, `Δh = ${num(d.h)} m`)}${t(48, 28, "p_A")}${t(400, 16, "p_B")}${t(240, 188, "mercure")}${t(150, 230, `raccord A : ${num(d.zConnect)} m`)}`)
      };
    }
    return {
      caption: "Manomètre en U à la même cote : p₁ − p₂ = (ρₘ − ρ)gΔh. Le mercure est plus bas du côté de la plus forte pression.",
      svg: svg("Manomètre différentiel", `<path d="M70 40v20h80" fill="none" stroke="#64748b" stroke-width="10"/><path d="M410 40v20h-80" fill="none" stroke="#64748b" stroke-width="10"/><path d="M150 60v70q0 28 28 28h204q28 0 28-28V60" fill="none" stroke="#475569" stroke-width="16"/><path d="M158 118v16q0 18 20 18h204q20 0 20-18V86" fill="none" stroke="#d97706" stroke-width="10"/>${dimV(430, 86, 134, `Δh = ${num(d.h)} mm`)}${t(40, 32, "prise 1 · p₁")}${t(400, 32, "prise 2 · p₂")}${t(240, 175, "mercure")}${t(200, 220, "eau")}`)
    };
  },

  hydraulicPress(d) {
    return {
      caption: "Principe de Pascal : F₁/A₁ = F₂/A₂. Le volume chassé se conserve, donc le petit piston a une plus grande course.",
      svg: svg("Presse hydraulique", `${water("M80 150h400v40H80z")}<rect x="118" y="70" width="36" height="80" fill="#64748b" stroke="#0f172a" stroke-width="2"/><rect x="350" y="48" width="90" height="102" fill="#475569" stroke="#0f172a" stroke-width="2"/>${line(136, 48, 136, 28, "#b91c1c", 2, 'marker-end="url(#arr)"')}${t(88, 24, `F₁ · d = ${num(d.dSmall)} mm`)}${line(395, 28, 395, 12, "#b91c1c", 2.4)}${t(330, 24, `F₂ = ${num(d.load)} N`)}${t(200, 220, `D₂ = ${num(d.dBig)} mm`)}`)
    };
  },

  bargeStability(d) {
    const draft = Math.max(0.4, +d.draft || 1.2), zG = +d.zG || 1.5;
    const hull = 92, waterY = 70 + hull * (1 - 0.45);
    const bottom = waterY + 52;
    const zB = draft / 2, volume = (+d.L || 14) * (+d.B || 6) * draft;
    const BM = ((+d.L || 14) * ((+d.B || 6) ** 3) / 12) / volume;
    const scale = 52 / draft;
    const yB = bottom - zB * scale, yG = bottom - zG * scale, yM = bottom - (zB + BM) * scale;
    return {
      caption: "Stabilité initiale au roulis : on place B (Te/2), G, puis M = B + I/∇. Stable si GM > 0, c’est-à-dire si M est au-dessus de G.",
      svg: svg("Stabilité d’une barge", `${water("M40 148h480v70H40z")}<rect x="130" y="70" width="280" height="92" fill="#cbd5e1" stroke="#334155" stroke-width="3"/>${line(40, 148, 520, 148, "#0369a1", 2.4)}${line(270, 60, 270, 200, "#64748b", 1.2, 'stroke-dasharray="4 3"')}<circle cx="270" cy="${yB}" r="4" fill="#0369a1"/>${t(280, yB + 4, "B")}<circle cx="270" cy="${yG}" r="4" fill="#b91c1c"/>${t(280, yG + 4, "G")}<circle cx="270" cy="${yM}" r="4" fill="#15803d"/>${t(280, yM + 4, "M")}${t(140, 58, `L = ${num(d.L)} m · B = ${num(d.B)} m`)}${t(140, 230, `Tₑ = ${num(d.draft)} m · z_G = ${num(d.zG)} m`)}`)
    };
  },

  planeForce(d) {
    return {
      caption: "Mur affleurant : diagramme triangulaire. La poussée F = ½ ρg H² b s’applique à H/3 du pied.",
      svg: svg("Mur de réservoir", `${water("M70 40h250v160H70z")}${hatch(320, 28, 22, 184)}${line(70, 40, 320, 40, "#0369a1", 3)}<path d="M320 40L200 200H320z" fill="#2563eb55" stroke="#1d4ed8" stroke-width="1.5"/>${dimV(400, 40, 200, `H = ${num(d.H)} m`)}${line(210, 147, 318, 147, "#b91c1c", 2.4, 'marker-end="url(#arr)"')}${t(188, 143, "F", 'fill="#b91c1c"')}${t(80, 32, "surface libre")}${t(80, 230, `b = ${num(d.b)} m · M = F H/3 au pied`)}`)
    };
  },

  submergedGate(d) {
    return {
      caption: "Vanne entièrement immergée : le trapèze des pressions a son centre sous le centre géométrique. ȳ = y₀ + H/2.",
      svg: svg("Vanne immergée", `${water("M50 36h280v180H50z")}${hatch(330, 36, 20, 180)}${line(50, 36, 330, 36, "#0369a1", 3)}<rect x="318" y="88" width="24" height="86" fill="#475569" stroke="#0f172a" stroke-width="2"/><path d="M318 88l-70 0 70 86z" fill="#2563eb44" stroke="#1d4ed8" stroke-width="1.4"/>${dimV(370, 36, 88, `y₀ = ${num(d.y0)} m`)}${dimV(400, 88, 174, `H = ${num(d.H)} m`)}${t(230, 128, "F")}${t(60, 28, "surface libre")}`)
    };
  },

  circularGate(d) {
    return {
      caption: "Disque vertical immergé : F = ρgAȳ passe par le centre de poussée, légèrement sous le centre géométrique.",
      svg: svg("Vanne circulaire", `${water("M40 36h300v180H40z")}${hatch(340, 28, 22, 196)}${line(40, 36, 340, 36, "#0369a1", 3)}<circle cx="250" cy="148" r="40" fill="#64748b" stroke="#0f172a" stroke-width="3"/>${dimV(370, 36, 148, `ȳ = ${num(d.yc)} m`)}${t(400, 175, `D = ${num(d.D)} m`)}${t(50, 28, "surface libre")}${t(232, 152, "G", 'fill="#fff"')}`)
    };
  },
  inclinedCircularGate(d) {
    return {
      caption: "Paroi inclinée : F = ρg A h_G. L’écart y_C − y_G se mesure le long de la paroi, avec y_G = h_G / sin α.",
      svg: svg("Vanne circulaire inclinée", `${water("M40 36h280v180H40z")}${line(40, 36, 320, 36, "#0369a1", 3)}<path d="M200 36L360 210" stroke="#334155" stroke-width="18"/> <circle cx="300" cy="140" r="36" fill="#64748b" stroke="#0f172a" stroke-width="3"/>${dimV(120, 36, 140, `h_G = ${num(d.hG)} m`)}${t(380, 90, `α = ${num(d.alpha)}°`)}${t(380, 120, `D = ${num(d.D)} m`)}${t(50, 28, "surface libre")}`)
    };
  },
  quarterCylinder(d) {
    return {
      caption: "F_H = poussée sur la projection verticale ; F_V = poids du volume d’eau au-dessus de la vanne (carré − quart de cercle).",
      svg: svg("Vanne quart de cylindre", `${water("M80 40h200v140H80z")}<path d="M280 40A140 140 0 0 1 140 180H80V40z" fill="#7dd3fc" stroke="#0369a1" stroke-width="3"/>${hatch(80, 180, 200, 18)}${t(300, 70, `R = ${num(d.R)} m`)}${t(300, 100, `b = ${num(d.b)} m`)}${t(300, 140, "F_H →")}${t(160, 30, "F_V ↓")}${t(90, 230, "eau du côté concave · surface libre en haut")}`)
    };
  },
  archimedesCaisson(d) {
    return {
      caption: "Archimède : le bloc immergé a un poids apparent (ρ_b − ρ)g𝒱. Le caisson flotte si F_A,max > W, avec Tₑ = W/(ρgLB).",
      svg: svg("Bloc immergé et caisson", `${water("M40 70h220v140H40z")}<rect x="110" y="110" width="70" height="50" fill="#94a3b8" stroke="#334155" stroke-width="2"/>${t(100, 100, "bloc")}${water("M300 130h220v80H300z")}<rect x="330" y="90" width="160" height="120" fill="#cbd5e1" stroke="#334155" stroke-width="3"/>${line(300, 148, 520, 148, "#0369a1", 2)}${t(340, 80, `L×B×H = ${num(d.L)}×${num(d.B)}×${num(d.Hbox)} m`)}${t(48, 58, "eau douce")}${t(310, 230, "eau de mer")}`)
    };
  },

  pipeContinuity(d) {
    return {
      caption: "Une seule conduite actuelle : on calcule V = Q/A, puis le diamètre qui donnerait la vitesse cible. Ce n’est pas un réducteur.",
      svg: svg("Conduite circulaire", `<path d="M40 90h300v70H40z" fill="#bae6fd" stroke="#0369a1" stroke-width="4"/>${flow("M60 125h250")}${t(50, 78, `D = ${num(d.D)} mm`)}${t(50, 188, `Q = ${num(d.Q)} L/s`)}<circle cx="450" cy="125" r="38" fill="none" stroke="#b91c1c" stroke-width="2.4" stroke-dasharray="7 5"/>${t(400, 78, `D cible`, 'fill="#b91c1c"')}${t(392, 188, `V = ${num(d.targetV)} m/s`, 'fill="#b91c1c"')}`)
    };
  },

  twoSectionContinuity(d) {
    return {
      caption: "Tube de courant : Q = A₁V₁ = A₂V₂. Diviser le diamètre par 2 multiplie la vitesse par 4.",
      svg: svg("Continuité entre deux sections", `<path d="M30 70h190l90 28h220v54H310l-90 28H30z" fill="#bae6fd" stroke="#0369a1" stroke-width="3.5"/>${flow("M50 125h430")}${t(50, 58, `1 · D₁ = ${num(d.D1)} mm`)}${t(340, 58, `2 · D₂ = ${num(d.D2)} mm`)}${t(190, 210, `Q = ${num(d.Q)} L/s  ·  A₁V₁ = A₂V₂`)}`)
    };
  },

  networkNode(d) {
    return {
      caption: "Loi des nœuds : aucun stockage. Q₁ + Q₂ = Q₃ + Qᵦ.",
      svg: svg("Nœud de réseau", `${line(30, 70, 250, 120, "#0369a1", 14)}${line(30, 180, 250, 130, "#0369a1", 14)}${line(270, 125, 520, 70, "#0369a1", 14)}${line(270, 130, 400, 210, "#0369a1", 12)}<circle cx="260" cy="125" r="16" fill="#075985"/>${t(40, 58, "Q₁")}${t(40, 210, "Q₂")}${t(470, 58, "Q₃")}${t(410, 230, `Qᵦ = ${num(d.Qbranch)} L/s`)}${t(200, 40, `D₁ = ${num(d.D1)} mm`)}`)
    };
  },

  convectiveAcceleration(d) {
    return {
      caption: "Régime permanent : ∂V/∂t = 0, mais la particule accélère dans le convergent (terme convectif V dV/dx).",
      svg: svg("Convergent", `<path d="M30 48h170l210 36h120v50H410l-210 36H30z" fill="#bae6fd" stroke="#0369a1" stroke-width="3.5"/>${flow("M50 110h430")}${t(40, 36, `V₁ = ${num(d.V1)} m/s`)}${t(400, 36, `V₂ = ${num(d.V2)} m/s`)}${dimH(200, 30, 530, `L = ${num(d.L)} m`)}${t(210, 230, "a = V · dV/dx")}`)
    };
  },

  reservoirRise(d) {
    return {
      caption: "Bilan de volume sur le réservoir : A dh/dt = Qₑ − Qₛ. La surface libre monte si l’alimentation dépasse la vidange.",
      svg: svg("Remplissage d’un réservoir", `${hatch(88, 28, 16, 190)}<path d="M104 28v190h220V28" fill="none" stroke="#334155" stroke-width="6"/>${water("M104 92h220v126H104z")}<path d="M104 68h220" stroke="#7dd3fc" stroke-width="2" stroke-dasharray="6 4"/>${flow("M30 70h74")}${flow("M324 190h90")}${dimV(350, 68, 92, "Δh")}${t(36, 58, "Qₑ")}${t(420, 186, "Qₛ")}${t(120, 230, `D = ${num(d.D)} m`)}`)
    };
  },

  tankFilling(d) {
    return {
      caption: "On impose un temps de remplissage et une vitesse maximale dans la conduite d’amenée — il n’y a pas de vidange ici.",
      svg: svg("Conduite de remplissage", `${hatch(200, 36, 16, 180)}<path d="M216 36v180h200V36" fill="none" stroke="#334155" stroke-width="6"/>${water("M216 100h200v116H216z")}${flow("M40 150h176")}${t(48, 130, `conduite`)}${t(48, 230, `𝒱 = ${num(d.volume)} m³ en ${num(d.hours)} h`)}${t(250, 88, `V ≤ ${num(d.maxV)} m/s`)}`)
    };
  },

  distributedFlow(d) {
    return {
      caption: "Service en route : le débit décroît linéairement, Q(x) = Qₑ − qx. À mi-longueur, la moitié du prélèvement a déjà eu lieu.",
      svg: svg("Conduite à débit réparti", `<path d="M40 90h480" stroke="#475569" stroke-width="18"/>${flow("M50 90h430")}${[90, 180, 270, 360, 450].map((x, i) => line(x, 90, x, 120 + i * 8, "#0284c7", 3)).join("")}${t(40, 70, `Qₑ = ${num(d.Qin)} L/s`)}${t(400, 70, `Qₛ = ${num(d.Qout)} L/s`)}${dimH(210, 40, 520, `L = ${num(d.L)} m`)}${t(200, 240, "q uniforme")}`)
    };
  },

  venturi(d) {
    const byPressure = Number.isFinite(+d.dpK);
    return {
      caption: byPressure
        ? "Venturi horizontal : le col accélère le fluide et abaisse p₂. Ici p₁ − p₂ est donné directement."
        : "Venturi horizontal : le col accélère le fluide et abaisse p₂. Le U au mercure mesure p₁ − p₂.",
      svg: svg("Tube de Venturi", `<path d="M20 40h150l70 32h70l70-32h150v64H380l-70 32h-70l-70-32H20z" fill="#bae6fd" stroke="#0369a1" stroke-width="3"/>${flow("M40 72h460")}${t(30, 30, `1 · D₁ = ${num(d.D1)} mm`)}${t(230, 86, `2 · D₂ = ${num(d.D2)} mm`)}${byPressure ? `${t(160, 230, `p₁ − p₂ = ${num(d.dpK)} kPa`)}` : `<path d="M90 104v36h260v-20" fill="none" stroke="#475569" stroke-width="8"/><path d="M98 132h140v8H98z" fill="#d97706"/><path d="M250 116h92v24H250z" fill="#d97706"/>${dimV(400, 116, 140, `Δh = ${num(d.h)} mm`)}${t(160, 230, "mercure")}`}`)
    };
  },

  torricelli(d) {
    return {
      caption: "Grande section, orifice à l’air libre : Bernoulli se réduit à Torricelli. Cᵈ corrige la contraction du jet.",
      svg: svg("Vidange par orifice", `${hatch(48, 28, 16, 180)}<path d="M64 28v180h200V28" fill="none" stroke="#334155" stroke-width="6"/>${water("M64 56h200v152H64z")}<path d="M264 168q80 8 180 48" fill="none" stroke="#0284c7" stroke-width="7"/>${dimV(280, 56, 168, `h = ${num(d.h)} m`)}${t(300, 160, `V = Cᵈ√(2gh)`)}${t(300, 230, `d = ${num(d.d)} mm · Cᵈ = ${num(d.Cd)}`)}`)
    };
  },

  bernoulliSections(d) {
    const up = (+d.z2 || 0) >= (+d.z1 || 0);
    return {
      caption: "Bernoulli le long d’une ligne de courant : la pression baisse si on s’élève ou si le fluide accélère.",
      svg: svg("Conduite avec dénivelée", `<path d="M24 150h170l90-50h250v48H284l-90 50H24z" fill="#bae6fd" stroke="#0369a1" stroke-width="3.2"/>${flow("M40 174h190l90-50h200")}${t(30, 130, `1 · z₁ = ${num(d.z1)} m`)}${t(30, 230, `p₁ = ${num(d.p1)} kPa · D₁ = ${num(d.D1)} mm`)}${t(340, 70, `2 · z₂ = ${num(d.z2)} m`)}${t(340, 230, `D₂ = ${num(d.D2)} mm`)}${t(200, 40, up ? "la conduite s’élève" : "la conduite descend")}`)
    };
  },

  drainTime(d) {
    return {
      caption: "Niveau variable : on intègre −A dh/dt = Cᵈ a √(2gh) entre h₁ et h₂. Le débit diminue à mesure que la charge baisse.",
      svg: svg("Temps de vidange", `${hatch(70, 24, 16, 190)}<path d="M86 24v190h200V24" fill="none" stroke="#334155" stroke-width="6"/>${water("M86 100h200v114H86z")}<path d="M86 58h200" stroke="#7dd3fc" stroke-width="2" stroke-dasharray="6 4"/>${flow("M286 190h140")}${dimV(310, 58, 100, "h₁ → h₂")}${t(330, 170, `orifice ${num(d.orificeD)} mm`)}${t(100, 48, "h₁")}${t(100, 92, "h₂")}`)
    };
  },

  pitot(d) {
    return {
      caption: "Tube de Pitot-statique : le fluide est arrêté au point d’arrêt. Le mercure mesure p₀ − p, donc V = √(2Δp/ρ).",
      svg: svg("Tube de Pitot", `<path d="M20 70h520v50H20z" fill="#bae6fd" stroke="#0369a1" stroke-width="3"/>${flow("M40 95h120")}<path d="M200 95h130l36-36h70" fill="none" stroke="#334155" stroke-width="7"/><path d="M200 108h40" stroke="#334155" stroke-width="3"/>${t(30, 58, "écoulement · p, V")}${t(330, 48, "point d’arrêt · p₀")}<path d="M436 59v70h70" fill="none" stroke="#d97706" stroke-width="7"/>${t(430, 160, `Hg · Δh = ${num(d.h)} mm`)}`)
    };
  },

  siphon(d) {
    return {
      caption: "Points A (surface), C (sommet) et S (sortie à l’air). La dépression en C vaut ρg(z_C + V²/2g) ; c’est là que la cavitation menace.",
      svg: svg("Siphon", `${hatch(36, 70, 14, 140)}<path d="M50 70v140h150V90" fill="none" stroke="#334155" stroke-width="5"/>${water("M50 100h150v110H50z")}<path d="M170 108c70-70 150-70 170 8v84" fill="none" stroke="#475569" stroke-width="12"/>${flow("M170 108c70-70 150-70 170 8v70")}${t(70, 92, "A")}${t(300, 28, `C · z_C = ${num(d.rise)} m`)}${t(400, 220, `S · Δz = ${num(d.drop)} m`)}${t(60, 230, "réservoir")}`)
    };
  },

  hydraulicPower(d) {
    return {
      caption: "Bernoulli généralisé entre deux surfaces libres : HMT = H_g + pertes. La pompe fournit Pₕ = ρgQH.",
      svg: svg("Pompage entre réservoirs", `${water("M36 150h140v60H36z")}${water("M380 48h140v50H380z")}${hatch(36, 210, 140, 12)}${hatch(380, 98, 140, 12)}<path d="M176 176h50v-70h80" fill="none" stroke="#475569" stroke-width="9"/><circle cx="250" cy="106" r="20" fill="#075985"/>${t(243, 111, "P", 'fill="#fff"')}${t(50, 140, "puits")}${t(390, 38, `H_g = ${num(d.head)} m`)}${t(200, 230, `Q = ${num(d.Q)} L/s · η = ${num(d.efficiency)}`)}`)
    };
  },

  jetPlate(d) {
    return {
      caption: "Plaque fixe normale au jet : après l’impact, la composante axiale de V s’annule. F = ρQV sur la plaque.",
      svg: svg("Jet sur plaque", `${flow("M30 120h250")}${hatch(300, 40, 16, 160)}<path d="M300 112q70-8 110-60M300 128q70 8 110 60" fill="none" stroke="#7dd3fc" stroke-width="10"/>${line(298, 120, 210, 120, "#b91c1c", 2.4, 'marker-end="url(#arr)"')}${t(70, 96, `V = ${num(d.V)} m/s`)}${t(70, 210, `d = ${num(d.d)} mm`)}${t(180, 150, "F = ρQV", 'fill="#b91c1c"')}`)
    };
  },

  jetDeflect(d) {
    const th = ((+d.theta || 135) * Math.PI) / 180;
    const x2 = 290 + 130 * Math.cos(th), y2 = 120 - 130 * Math.sin(th);
    return {
      caption: "L’auget dévie le jet d’un angle θ sans changer |V|. La force suit |ΔV⃗| = 2V sin(θ/2).",
      svg: svg("Jet dévié par un auget", `${flow("M20 120h250")}<path d="M270 120L${x2} ${y2}" fill="none" stroke="#38bdf8" stroke-width="14" stroke-linecap="round"/><path d="M268 92q40 28 40 28q0 0-40 28" fill="none" stroke="#334155" stroke-width="10"/>${line(270, 120, 200, 175, "#b91c1c", 2.2, 'marker-end="url(#arr)"')}${t(40, 96, `V = ${num(d.V)} m/s`)}${t(300, 40, `θ = ${num(d.theta)}°`)}${t(160, 220, "force sur l’auget")}`)
    };
  },

  colebrook(d) {
    return moodyChart(d);
  },
  moodyRead(d) {
    return moodyChart(d);
  },

  minorLosses(d) {
    return {
      caption: "Chaque singularité dissipe K V²/(2g). On additionne K entrée, n coudes, vanne et sortie — à la même vitesse de référence.",
      svg: svg("Pertes singulières", `<path d="M30 130h90l40-50h90l40 50h70l40-40h130" fill="none" stroke="#475569" stroke-width="16"/>${flow("M40 130h80l40-50h90l40 50h70l40-40h110")}${t(40, 170, "entrée")}${t(200, 60, `${num(d.nElbows)} coudes`)}${t(300, 170, "vanne")}${t(460, 70, "sortie")}${t(160, 230, `D = ${num(d.D)} mm · Q = ${num(d.Q)} L/s`)}`)
    };
  },

  froudeSimilarity(d) {
    return {
      caption: "Même ouvrage, deux échelles. La similitude de Froude impose λV = √λL et λQ = λL^(5/2), avec λL = N.",
      svg: svg("Modèle et prototype", `<path d="M40 70h200v90H40z" fill="#e2e8f0" stroke="#334155" stroke-width="3"/>${water("M40 118h200v42H40z")}<path d="M90 70v48h40v-48" fill="#94a3b8"/><path d="M340 120h140v50H340z" fill="#e2e8f0" stroke="#334155" stroke-width="3"/>${water("M340 148h140v22H340z")}<path d="M372 120v28h24v-28" fill="#94a3b8"/>${t(70, 58, "prototype")}${t(360, 108, `modèle 1/${num(d.N)}`)}${t(60, 220, "Vₚ, Qₚ")}${t(350, 220, `Vₘ = ${num(d.Vm)} m/s`)}`)
    };
  },

  manningChannel(d) {
    return {
      caption: "Section rectangulaire — pas trapézoïdale. Le périmètre mouillé est b + 2y : la surface libre ne fait pas partie de P.",
      svg: svg("Canal rectangulaire", `${hatch(90, 200, 380, 16)}<path d="M120 40v160h320V40" fill="none" stroke="#334155" stroke-width="8"/>${water("M124 110h312v90H124z")}${t(220, 158, "écoulement ⊙")}${dimV(90, 110, 200, `y = ${num(d.y)} m`, -1)}${dimH(230, 124, 436, `b = ${num(d.b)} m`)}${t(250, 96, `S = ${num(d.S)} ‰ · Kₛ = ${num(d.Ks)}`)}`)
    };
  },

  jetMobile(d) {
    return {
      caption: "Auget en U : le jet ressort à 180°. S’il avance à u, seule V−u produit une force. P = F u est max pour u = V/3.",
      svg: svg("Auget mobile", `${flow("M20 120h210")}<path d="M230 78q70 0 70 42q0 42-70 42" fill="none" stroke="#334155" stroke-width="12"/><path d="M230 88q52 0 52 32q0 32-52 32" fill="none" stroke="#38bdf8" stroke-width="10"/>${line(300, 120, 390, 120, "#b91c1c", 2.2, 'marker-end="url(#arr)"')}${t(40, 96, `V = ${num(d.V)} m/s`)}${t(310, 108, `u = ${num(d.u)} m/s`, 'fill="#b91c1c"')}${t(40, 220, `${Number.isFinite(+d.d) ? `d = ${num(d.d)} mm` : `Q = ${num(d.Q)} L/s`} · u_opt = V/3`)}`)
    };
  },
  elbowForce(d) {
    const angle = Number.isFinite(+d.theta) ? +d.theta : 90;
    return {
      caption: `Coude à ${num(angle)}° : l’eau pousse vers l’extérieur. F = 2(pA+ρQV) sin(θ/2), portée par la bissectrice.`,
      svg: svg(`Coude à ${num(angle)}°`, `<path d="M40 150h220q70 0 70-70V40" fill="none" stroke="#475569" stroke-width="28"/><path d="M40 150h220q48 0 48-48V40" fill="none" stroke="#7dd3fc" stroke-width="14"/>${flow("M50 150h180")}${line(330, 80, 330, 30, "#0369a1", 2, 'marker-end="url(#arb)"')}${line(260, 150, 200, 200, "#b91c1c", 2.2, 'marker-end="url(#arr)"')}${line(330, 80, 400, 130, "#b91c1c", 2.2, 'marker-end="url(#arr)"')}${t(50, 130, `p₁ = ${num(d.p1)} kPa`)}${t(50, 220, `D = ${num(d.D)} mm · θ = ${num(angle)}°`)}${t(360, 170, "Fₓ, Fᵧ", 'fill="#b91c1c"')}`)
    };
  },
  convergentForce(d) {
    return {
      caption: "Le fluide accélère, p diminue. L’effort axial sur le convergent vient des pressions de bride et de ρQ(V₂−V₁).",
      svg: svg("Convergent", `<path d="M40 70h200l120 40v30L240 180H40z" fill="#bae6fd" stroke="#0369a1" stroke-width="3"/>${flow("M50 125h280")}${t(60, 58, `D₁ = ${num(d.D1)} mm`)}${t(360, 58, `D₂ = ${num(d.D2)} mm`)}${t(60, 220, `p₁ = ${num(d.p1)} kPa · Q = ${num(d.Q)} L/s`)}${line(200, 125, 200, 210, "#b91c1c", 2.2, 'marker-end="url(#arr)"')}${t(210, 230, "F vers l’aval", 'fill="#b91c1c"')}`)
    };
  },
  jetReaction(d) {
    return {
      caption: "Le réservoir éjecte ṁV. Pour rester immobile : F = ρQV = 2ρghA, le double de la poussée sur un bouchon.",
      svg: svg("Réaction d’un jet", `${hatch(80, 200, 220, 14)}${water("M90 70h200v130H90z")}<circle cx="80" cy="205" r="10" fill="#475569"/><circle cx="300" cy="205" r="10" fill="#475569"/><path d="M290 150h90" fill="none" stroke="#38bdf8" stroke-width="12"/>${flow("M300 150h90")}${line(80, 150, 30, 150, "#b91c1c", 2.4, 'marker-end="url(#arr)"')}${dimV(70, 70, 150, `h = ${num(d.h)} m`, -1)}${t(320, 130, "jet")}${t(40, 130, "F", 'fill="#b91c1c"')}`)
    };
  },
  inclinedPlate(d) {
    const th = ((+d.theta || 60) * Math.PI) / 180;
    const x2 = 300 + 160 * Math.cos(th), y2 = 40 + 160 * Math.sin(th);
    return {
      caption: "Plaque lisse : réaction normale. Le débit se partage : Q₊ = Q(1+cosθ)/2 vers l’aval, Q₋ vers l’amont.",
      svg: svg("Plaque inclinée", `${flow("M20 120h240")}${line(260, 30, x2, y2, "#334155", 10)}${t(40, 96, `V = ${num(d.V)} m/s`)}${t(300, 24, `θ = ${num(d.theta)}°`)}${t(40, 220, `Q = ${num(d.Q)} L/s · Fₙ = ρQV sinθ`)}`)
    };
  },
  reynoldsRegime(d) {
    return {
      caption: "Re = VD/ν. Filet coloré net = laminaire ; dispersion dans toute la section = turbulent.",
      svg: svg("Expérience de Reynolds", `<path d="M50 90h460v60H50z" fill="#e0f2fe" stroke="#0369a1" stroke-width="3"/>${flow("M70 120h400")}${t(60, 70, `D = ${num(d.D)} mm`)}${t(60, 220, `Q = ${num(d.Q)} L/s · ν = ${num(d.nu)}×10⁻⁶ m²/s`)}${t(200, 70, "laminaire < 2000 < transition < 4000 < turbulent")}`)
    };
  },
  hydraulicDiameter(d) {
    return {
      caption: "Gaine pleine : Dₕ = 4A/P = 2ab/(a+b). On l’utilise à la place de D dans Re et Darcy.",
      svg: svg("Gaine rectangulaire", `${hatch(90, 40, 380, 16)}${hatch(90, 190, 380, 16)}<path d="M110 56h340v134H110z" fill="#bae6fd" stroke="#0369a1" stroke-width="3"/>${dimH(230, 110, 450, `a = ${num(d.a)} mm`)}${dimV(80, 56, 190, `b = ${num(d.b)} mm`, -1)}${t(200, 130, `V = ${num(d.V)} m/s`)}`)
    };
  },
  fallingFilm(d) {
    return {
      caption: "Demi-Poiseuille : u = 0 au parement, du/dy = 0 à la surface libre. Valable seulement si le film est vraiment laminaire.",
      svg: svg("Film ruisselant", `${hatch(80, 30, 18, 190)}<path d="M98 40l160 160H98z" fill="#bae6fd" stroke="#0284c7" stroke-width="2"/>${[0, 1, 2, 3].map(i => line(110 + i * 12, 50 + i * 36, 170 + i * 28, 50 + i * 36, "#0369a1", 2, 'marker-end="url(#arb)"')).join("")}${t(300, 70, `α = ${num(d.alpha)}°`)}${t(300, 100, `e = ${num(d.e)} mm`)}${t(120, 230, "parement · u = 0")}`)
    };
  },
  poiseuilleOil(d) {
    return {
      caption: "Profil parabolique laminaire. λ = 64/Re est exact. La puissance dissipée P = QΔp coûte cher dès que μ est grand.",
      svg: svg("Poiseuille", `<path d="M80 70h400v90H80z" fill="#fde68a" stroke="#b45309" stroke-width="3"/>${[0, 1, 2, 3, 4].map(i => { const y = 85 + i * 14, len = 80 + (2 - Math.abs(i - 2)) * 50; return line(100, y, 100 + len, y, "#b45309", 2, 'marker-end="url(#arr)"'); }).join("")}${t(90, 56, `huile · D = ${num(d.D)} mm`)}${t(90, 220, `L = ${num(d.L)} m · Q = ${num(d.Q)} L/s`)}`)
    };
  },
  gravityPipe(d) {
    return {
      caption: "H disponible = pertes linéaires + singulières. λ dépend de V : on itère Colebrook jusqu’à converger sur Q.",
      svg: svg("Conduite gravitaire", `${water("M36 70h130v50H36z")}${water("M390 140h130v50H390z")}${hatch(36, 120, 130, 12)}${hatch(390, 190, 130, 12)}<path d="M166 96h224" fill="none" stroke="#475569" stroke-width="10"/>${flow("M170 96h200")}${t(50, 58, `H = ${num(d.H)} m`)}${t(200, 80, `L = ${num(d.L)} m`)}${t(200, 230, `D = ${num(d.D)} mm · ΣK = ${num(d.Ksum)}`)}`)
    };
  },
  pipeSizing(d) {
    return {
      caption: "On teste les DN commerciaux croissants jusqu’à h_f ≤ H. On retient le plus petit qui passe, avec une vitesse raisonnable.",
      svg: svg("Dimensionnement", `${water("M30 80h100v40H30z")}${water("M430 140h100v40H430z")}<path d="M130 100h300" fill="none" stroke="#475569" stroke-width="12"/>${t(40, 64, `H = ${num(d.H)} m`)}${t(200, 80, `Q = ${num(d.Q)} L/s`)}${t(160, 220, "série 150 / 200 / 250 / 300 / 350 / 400 mm")}`)
    };
  },
  pumpStation(d) {
    return {
      caption: "HMT = Δz + pertes d’aspiration + pertes de refoulement. Chaque côté a sa propre vitesse.",
      svg: svg("Station de pompage", `${water("M30 160h130v50H30z")}${water("M400 40h130v45H400z")}<path d="M160 186h50v-70h70" fill="none" stroke="#475569" stroke-width="8"/><path d="M280 116h120" fill="none" stroke="#475569" stroke-width="8"/><circle cx="250" cy="116" r="20" fill="#075985"/>${t(243, 121, "P", 'fill="#fff"')}${t(40, 148, `z₁ = ${num(d.z1)} m`)}${t(410, 30, `z₂ = ${num(d.z2)} m`)}${t(160, 230, `Q = ${num(d.Q)} L/s · η = ${num(d.eta)}`)}`)
    };
  },
  bordaCarnot(d) {
    return {
      caption: "Élargissement brusque : hₛ = (V₁−V₂)²/2g. La pression remonte, mais moins qu’en fluide parfait.",
      svg: svg("Élargissement brusque", `<path d="M40 90h200v70H40z" fill="#bae6fd" stroke="#0369a1" stroke-width="3"/><path d="M240 50h240v150H240z" fill="#bae6fd" stroke="#0369a1" stroke-width="3"/>${flow("M50 125h400")}${t(70, 80, `D₁ = ${num(d.D1)} mm`)}${t(320, 40, `D₂ = ${num(d.D2)} mm`)}${t(180, 230, "V₁ > V₂ · récupération partielle de pression")}`)
    };
  },
  reynoldsDrag(d) {
    return {
      caption: "Même fluide, Re constant : le modèle doit aller N fois plus vite, et les forces sont identiques (Fₚ = Fₘ).",
      svg: svg("Pile de pont", `${water("M40 130h200v60H40z")}<rect x="120" y="70" width="36" height="120" fill="#94a3b8" stroke="#334155"/><rect x="370" y="100" width="18" height="70" fill="#94a3b8" stroke="#334155"/>${water("M330 140h140v40H330z")}${t(80, 58, "prototype")}${t(350, 88, `modèle 1/${num(d.N)}`)}${t(60, 220, `Fₘ = ${num(d.Fm)} N = Fₚ`)}`)
    };
  },
  froudeSpillway(d) {
    return {
      caption: "Évacuateur au 1/N : λQ = N^(5/2), λV = λt = √N, λF = N³. Le débit de labo doit rester praticable.",
      svg: svg("Évacuateur", `<path d="M40 50h80l40 90h80V50h80v160H40z" fill="#cbd5e1" stroke="#334155"/><path d="M120 50l40 90h80V50" fill="#7dd3fc"/>${t(48, 40, "prototype")}${t(320, 80, `N = ${num(d.N)}`)}${t(48, 230, `Qₚ = ${num(d.Qp)} m³/s`)}${t(280, 230, `Vₘ = ${num(d.Vm)} m/s`)}`)
    };
  },
  stokesViscosity(d) {
    return {
      caption: "À vitesse limite : poids = Archimède + 3πμdV. Stokes n’est valable que si Re ≲ 1.",
      svg: svg("Chute de bille", `<rect x="200" y="30" width="160" height="190" fill="#fde68a" stroke="#b45309" stroke-width="3"/><circle cx="280" cy="90" r="16" fill="#64748b"/>${line(280, 110, 280, 170, "#b91c1c", 2, 'marker-end="url(#arr)"')}${t(300, 88, `d = ${num(d.d)} mm`)}${t(300, 180, `V = ${num(d.V)} m/s`)}${t(80, 80, "poids")}${t(80, 140, "Archimède")}${t(80, 200, "Stokes")}`)
    };
  },
  trapezoidalChannel(d) {
    return {
      caption: "Trapèze : A = (b+zy)y, P = b+2y√(1+z²). La surface libre n’entre pas dans P. Fr utilise ȳ = A/T.",
      svg: svg("Canal trapézoïdal", `${hatch(60, 200, 440, 16)}<path d="M90 40l70 160h240L470 40" fill="none" stroke="#334155" stroke-width="7"/>${water("M175 110h210L440 200H120z")}${dimH(230, 160, 400, `b = ${num(d.b)} m`)}${dimV(80, 110, 200, `y = ${num(d.y)} m`, -1)}${t(220, 90, `z = ${num(d.z)} · Kₛ = ${num(d.Ks)}`)}`)
    };
  },
  normalDepth(d) {
    return {
      caption: "yₙ est l’inconnue : on itère Q = A Kₛ R^(2/3)√S jusqu’à retrouver le débit imposé, puis on lit Fr.",
      svg: svg("Profondeur normale", `${hatch(90, 200, 380, 16)}<path d="M120 40v160h320V40" fill="none" stroke="#334155" stroke-width="8"/>${water("M124 100h312v100H124z")}${t(200, 80, `Q = ${num(d.Q)} m³/s imposé`)}${t(200, 230, `b = ${num(d.b)} m · S = ${num(d.S)} ‰`)}`)
    };
  },
  waveCelerity(d) {
    return {
      caption: "c = √(gy) par rapport à l’eau. En fluvial, un front remonte à c−V : l’aval commande, avec un délai L/(c−V).",
      svg: svg("Intumescence", `${hatch(40, 200, 480, 14)}${water("M40 130h480v70H40z")}<path d="M40 130c80-40 120-40 200 0s120 40 200 0 80-20 80-20" fill="none" stroke="#0369a1" stroke-width="3"/>${t(60, 70, `y = ${num(d.y)} m · V = ${num(d.V)} m/s`)}${t(60, 100, "V+c →")}${t(380, 100, "← c−V")}${t(200, 230, `L = ${num(d.Lkm)} km à l’amont`)}`)
    };
  },
  damBreakRitter(d) {
    return {
      caption: "Ritter : front à 2√(gh₀) sur fond sec. Au barrage, h = 4h₀/9 et V = 2√(gh₀)/3. Majorant sans frottement.",
      svg: svg("Rupture de barrage", `${hatch(40, 180, 480, 16)}<path d="M40 40h80v140H40z" fill="#94a3b8"/><path d="M120 80c80 20 160 40 280 80H120z" fill="#7dd3fc" stroke="#0369a1"/>${t(48, 30, `h₀ = ${num(d.h0)} m`)}${t(300, 70, `front 2√(gh₀)`)}${t(200, 230, `x = ${num(d.xKm)} km à l’aval`)}`)
    };
  },
  damSluice(d) {
    return {
      caption: "Vanne profonde : F = ρgAȳ, T = W + μF au décollement, puis Q = CᵈA√(2gȳ) une fois ouverte.",
      svg: svg("Vanne de chasse", `${hatch(80, 30, 24, 180)}${water("M104 50h220v160H104z")}<rect x="104" y="140" width="14" height="70" fill="#334155"/>${dimV(70, 50, 210, `h = ${num(d.hSill)} m`, -1)}${t(340, 70, "amont")}${t(340, 160, `H = ${num(d.H)} m`)}${t(340, 190, "aval sec")}${t(140, 230, `μ = ${num(d.mu)} · W = ${num(d.W)} kN`)}`)
    };
  },
  npshCavitation(d) {
    return {
      caption: "NPSH_d = pₐₜₘ/ρg − pᵥ/ρg − Hₛ − h_asp. L’axe trop haut, ou une crépine encrassée, mène à la cavitation.",
      svg: svg("Aspiration et NPSH", `${water("M40 150h160v50H40z")}${hatch(40, 200, 160, 12)}<path d="M200 176h40v-50h80" fill="none" stroke="#475569" stroke-width="8"/><circle cx="320" cy="126" r="22" fill="#075985"/>${t(312, 131, "P", 'fill="#fff"')}${t(50, 140, `z₀ = ${num(d.z0)} m`)}${t(300, 90, `zₑ = ${num(d.ze)} m`)}${t(80, 230, `NPSHᵣ = ${num(d.NPSHr)} m`)}`)
    };
  },
  waterCannon(d) {
    return {
      caption: "Deux volumes de contrôle : la lance (recul) et l’écran (F = ρQV). Ce ne sont pas la même force.",
      svg: svg("Lance et écran", `<path d="M40 100h160l80 20v10L200 150H40z" fill="#bae6fd" stroke="#0369a1" stroke-width="3"/>${flow("M220 125h160")}${hatch(400, 50, 16, 150)}${t(50, 84, `p₁ = ${num(d.p1)} bar`)}${t(50, 220, `D₁ = ${num(d.D1)} mm → d = ${num(d.d)} mm`)}${t(300, 96, "jet")}${t(360, 220, "écran")}`)
    };
  },
  cofferdamBallast(d) {
    return {
      caption: "À vide : tirant Tₑ et GM. Posé : il faut lester contre la poussée ρgLBh, plus une réaction d’appui.",
      svg: svg("Batardeau", `${water("M40 130h480v70H40z")}<rect x="160" y="70" width="240" height="130" fill="#cbd5e1" stroke="#334155" stroke-width="3"/>${t(180, 60, `L = ${num(d.L)} m · B = ${num(d.B)} m`)}${t(180, 220, `W = ${num(d.W)} kN · h = ${num(d.immerse)} m`)}`)
    };
  },
  oilSeason(d) {
    return {
      caption: "Même débit, deux viscosités. Re peut retraverser 2000 : λ et la puissance changent de loi.",
      svg: svg("Oléoduc saisonnier", `<path d="M40 90h480v50H40z" fill="#fde68a" stroke="#b45309" stroke-width="3"/>${flow("M60 115h420")}${t(50, 70, `été ν = ${num(d.nuS)} / hiver ν = ${num(d.nuW)} ×10⁻⁶`)}${t(50, 220, `L = ${num(d.Lkm)} km · D = ${num(d.D)} mm`)}`)
    };
  },
  retainingWall(d) {
    return {
      caption: "Poussée ρgH²/2 à H/3 du pied. Le poids, bras t/2, s’oppose au renversement autour de l’arête aval.",
      svg: svg("Mur-poids", `${hatch(200, 40, 140, 170)}${water("M40 70h160v140H40z")}${dimV(30, 70, 210, `H = ${num(d.H)} m`, -1)}${dimH(230, 200, 340, `t = ${num(d.t)} m`)}${line(80, 160, 180, 160, "#b91c1c", 2.2, 'marker-end="url(#arr)"')}${t(90, 150, "F", 'fill="#b91c1c"')}`)
    };
  },
  bearingLoss(d) {
    return {
      caption: "Jeu radial = Couette. Le couple visqueux dissipe P = Cω dans le palier.",
      svg: svg("Palier lisse", `<circle cx="220" cy="120" r="70" fill="none" stroke="#b45309" stroke-width="14"/><circle cx="220" cy="120" r="48" fill="#94a3b8" stroke="#334155"/><circle cx="220" cy="120" r="8" fill="#0f172a"/>${t(320, 80, `N = ${num(d.rpm)} tr/min`)}${t(320, 110, `e = ${num(d.gap)} mm`)}${t(320, 180, `d = ${num(d.d)} mm`)}`)
    };
  },
  pressureUnits(d) {
    return {
      caption: "Toujours passer par le pascal, puis diviser par ρeau g pour des mCE. 1 bar ≈ 10,2 mCE.",
      svg: svg("Conversions", `${t(60, 80, `${num(d.bar)} bar`)}${t(220, 80, `${num(d.mmHg)} mmHg`)}${t(400, 80, `${num(d.psi)} psi`)}${t(60, 140, "→ Pa")}${t(220, 140, "→ Pa")}${t(400, 140, "→ Pa")}${t(180, 200, "puis ÷ ρeau g → mCE")}`)
    };
  },
  pipeGage(d) {
    return {
      caption: "Le centre est plus haut que le ménisque bas : p = (ρₘ Δh − ρ z) g, pas seulement (ρₘ−ρ)gΔh.",
      svg: svg("Manomètre sous conduite", `<path d="M80 70h160v40H80z" fill="#bae6fd" stroke="#0369a1" stroke-width="3"/><path d="M160 110v40h80v50H80v-50h80" fill="none" stroke="#475569" stroke-width="10"/>${oil("M80 175h80v25H80z")}${t(90, 58, "conduite")}${dimV(280, 90, 175, `z = ${num(d.z)} m`)}${t(300, 200, `Δh = ${num(d.hHg)} m`)}`)
    };
  },
  woodLog(d) {
    return {
      caption: "Fraction immergée = densité du bois. Masse = poids de l’eau déplacée.",
      svg: svg("Tronc flottant", `${water("M40 130h480v80H40z")}<ellipse cx="280" cy="130" rx="140" ry="40" fill="#b45309" stroke="#78350f" stroke-width="3"/>${t(160, 80, `d = ${num(d.s)} · D = ${num(d.D)} m`)}`)
    };
  },
  iceberg(d) {
    return {
      caption: "Archimède : 𝒱_imm/𝒱 = ρᵢ/ρₑ. En mer, environ 10 % émerge.",
      svg: svg("Iceberg", `${water("M40 140h480v70H40z")}<path d="M220 60l80 80H160z" fill="#e0f2fe" stroke="#0369a1" stroke-width="3"/><path d="M160 140h140l-30 60h-80z" fill="#bae6fd" stroke="#0369a1"/>${t(360, 90, `${num(d.rhoI)} / ${num(d.rhoW)}`)}`)
    };
  },
  idealGasTwo(d) {
    return {
      caption: "Deux états indépendants : ρ = p/(RT) après conversion en kelvin et pascals.",
      svg: svg("Air — deux états", `<rect x="40" y="50" width="200" height="130" rx="8" fill="#e0f2fe" stroke="#0369a1" stroke-width="3"/><rect x="300" y="50" width="200" height="130" rx="8" fill="#e0f2fe" stroke="#0369a1" stroke-width="3"/>${t(70, 90, `T₁ = ${num(d.temp1)} °C`)}${t(70, 120, `p₁ = ${num(d.p1)} bar`)}${t(70, 150, "état 1")}${t(330, 90, `T₂ = ${num(d.temp2)} °C`)}${t(330, 120, `p₂ = ${num(d.p2)} bar`)}${t(330, 150, "état 2")}${t(160, 220, `R = ${num(d.R)} J/(kg·K)`)}`)
    };
  },
  reynoldsTwo(d) {
    return {
      caption: "Re = VD/ν. On compare séparément l’eau et l’huile : le régime se lit sur Re, pas sur V.",
      svg: svg("Deux conduites", `<path d="M40 70h200v50H40z" fill="#e0f2fe" stroke="#0369a1" stroke-width="3"/><path d="M300 70h200v50H300z" fill="#fde68a" stroke="#b45309" stroke-width="3"/>${flow("M50 95h170")}${t(50, 56, `eau · D₁ = ${num(d.D1)} mm`)}${t(50, 150, `V₁ = ${num(d.V1)} m/s`)}${t(310, 56, `huile · D₂ = ${num(d.D2)} mm`)}${t(310, 150, `V₂ = ${num(d.V2)} m/s`)}${t(50, 220, "laminaire < 2000 < transition < 4000 < turbulent")}`)
    };
  },
  kinematicField(d) {
    return {
      caption: "Champ plan u = kx², v = −2kxy. Divergence nulle partout ; rotationnel ω_z = −2ky au point (x, y).",
      svg: svg("Champ 2D", `${line(80, 200, 480, 200, "#334155", 1.4)}${line(80, 200, 80, 40, "#334155", 1.4)}${t(490, 204, "x")}${t(70, 36, "y")}<circle cx="260" cy="110" r="7" fill="#ea580c"/>${t(274, 106, `(x, y) = (${num(d.x)} ; ${num(d.y)}) m`)}${t(120, 70, `u = ${num(d.k)} x²`)}${t(120, 100, `v = −${num(2 * d.k)} x y`)}${t(120, 230, "div = 0 · ω_z = −2ky")}`)
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
      svg: svg("Pendule simple", `${line(280, 30, 280, 50, "#334155", 4)}${line(280, 50, 340, 180, "#334155", 3)}<circle cx="340" cy="190" r="18" fill="#075985"/>${t(80, 80, "T = k Lᵃ gᵇ mᶜ")}${t(80, 120, "a = 1/2")}${t(80, 150, "b = −1/2")}${t(80, 180, "c = 0")}${t(360, 90, "L")}${t(360, 220, "m n’intervient pas")}`)
    };
  },
  propellerPi(d) {
    return {
      caption: "P = k ρᵃ nᵇ Dᶜ donne P = ρ n³ D⁵ f(…). n est en tours par seconde.",
      svg: svg("Hélice", `<circle cx="220" cy="125" r="70" fill="#e0f2fe" stroke="#0369a1" stroke-width="3"/><path d="M220 55q40 50 0 140q-40-50 0-140" fill="#7dd3fc" stroke="#0369a1"/><path d="M150 125q50-40 140 0q-50 40-140 0" fill="#bae6fd" stroke="#0369a1"/>${t(320, 80, "P = k ρᵃ nᵇ Dᶜ")}${t(320, 120, "a = 1 · b = 3 · c = 5")}${t(320, 160, "P ∝ ρ n³ D⁵")}${t(80, 220, "n en s⁻¹")}`)
    };
  }
};

const aliases = {
  viscosityForce: "viscosity",
  pitotWater: "pitot",
  turbinePower: "hydraulicPower",
  momentumHold: "jetReaction",
  channelDischarge: "manningChannel",
  gravityValve: "gravityPipe",
  froudeForceTime: "froudeSimilarity",
  froudeScale: "froudeSpillway",
  reynoldsSpeed: "reynoldsDrag"
};

export { moodyChart, moodyPoint };

export function drawFigure(type, data) {
  const figure = figures[type] || figures[aliases[type]];
  if (!figure) {
    return {
      caption: "Repérer les sections, les cotes et le sens de l’écoulement avant d’écrire les bilans.",
      svg: svg("Schéma", `${t(40, 120, "Schéma non disponible pour ce type.")}`)
    };
  }
  return figure(data);
}
