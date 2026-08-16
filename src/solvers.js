export const G = 9.81;

const steps = (values, solutionSteps) => ({ values, steps: solutionSteps });
const n = (x, digits = 4) => Number(x).toLocaleString("fr-FR", { maximumSignificantDigits: digits });

export const solvers = {
  density(d) {
    const mass = d.W * 1000 / G;
    const rho = mass / d.volume;
    const gamma = d.W / d.volume;
    const relative = rho / 1000;
    return steps({ mass, rho, gamma, relative }, [
      ["Poids et masse", `m = W/g = ${n(mass)} kg`],
      ["Masse volumique", `ρ = m/𝒱 = ${n(rho)} kg/m³`],
      ["Poids volumique", `γ = W/𝒱 = ${n(gamma)} kN/m³`],
      ["Densité", `d = ρ/ρeau = ${n(relative)}`]
    ]);
  },
  pressureDepth(d) {
    const relative = d.rho * G * d.h;
    const absolute = relative + d.patm * 1000;
    return steps({ relative, absolute }, [
      ["Pression relative", `p − pₐₜₘ = ρgh = ${n(relative)} Pa`],
      ["Pression absolue", `p_abs = pₐₜₘ + ρgh = ${n(absolute)} Pa`]
    ]);
  },
  compressibility(d) {
    const dp = (d.p2 - d.p1) * 1e5;
    const ratio = dp / (d.K * 1e9);
    const deltaV = d.volume * ratio;
    const finalVolume = d.volume - deltaV;
    return steps({ dp, ratio: ratio * 100, deltaV, finalVolume }, [
      ["Variation de pression", `Δp = (${n(d.p2)} − ${n(d.p1)}) bar = ${n(dp)} Pa`],
      ["Module d’élasticité", `K = −Δp/(Δ𝒱/𝒱) ⟹ diminution relative = Δp/K = ${n(ratio * 100)} %`],
      ["Variation de volume", `|Δ𝒱| = 𝒱Δp/K = ${n(deltaV)} m³`],
      ["Volume final", `𝒱₂ = 𝒱₁ − |Δ𝒱| = ${n(finalVolume)} m³`]
    ]);
  },
  layeredPressure(d) {
    const interfaceP = d.rhoOil * G * d.hOil;
    const bottomP = interfaceP + d.rhoWater * G * d.hWater;
    const head = bottomP / (d.rhoWater * G);
    return steps({ interfaceP, bottomP, head }, [
      ["Interface huile–eau", `pᵢ = ρhuile·g·hhuile = ${n(interfaceP)} Pa`],
      ["Fond du réservoir", `p_f = ρhuile·g·hhuile + ρeau·g·heau = ${n(bottomP)} Pa`],
      ["Hauteur d’eau", `H = p_f/(ρeau g) = ${n(head)} mCE`]
    ]);
  },
  submergedGate(d) {
    const area = d.b * d.H, yc = d.y0 + d.H / 2;
    const force = d.rho * G * area * yc, ig = d.b * d.H ** 3 / 12;
    const yp = yc + ig / (area * yc);
    return steps({ yc, force, yp }, [
      ["Centre de gravité", `ȳ = y₀ + H/2 = ${n(yc)} m`],
      ["Poussée", `F = ρgAȳ = ${n(force)} N`],
      ["Centre de poussée", `yₚ = ȳ + Iᴳ/(Aȳ) = ${n(yp)} m`]
    ]);
  },
  torricelli(d) {
    const diameter = d.d / 1000, area = Math.PI * diameter ** 2 / 4;
    const V = d.Cd * Math.sqrt(2 * G * d.h), Q = area * V;
    return steps({ area, V, Q }, [
      ["Section de l’orifice", `S = πd²/4 = ${n(area)} m²`],
      ["Torricelli corrigé", `V = Cᵈ√(2gh) = ${n(V)} m/s`],
      ["Débit", `Q = SV = ${n(Q)} m³/s = ${n(Q * 1000)} L/s`]
    ]);
  },
  jetDeflect(d) {
    const diameter = d.d / 1000, area = Math.PI * diameter ** 2 / 4;
    const Q = area * d.V, theta = d.theta * Math.PI / 180;
    const force = 2 * d.rho * Q * d.V * Math.sin(theta / 2);
    return steps({ Q, force }, [
      ["Débit massique", `Q = πd²V/4 = ${n(Q)} m³/s ; ṁ = ρQ`],
      ["Variation de quantité de mouvement", `|F| = 2ρQV sin(θ/2)`],
      ["Résultante sur l’auget", `F = ${n(force)} N`]
    ]);
  },
  minorLosses(d) {
    const D = d.D / 1000, Q = d.Q / 1000, area = Math.PI * D ** 2 / 4;
    const V = Q / area, Ksum = d.Kentry + d.Kelbows * d.nElbows + d.Kvalve + d.Kexit;
    const hf = Ksum * V ** 2 / (2 * G);
    return steps({ V, Ksum, hf }, [
      ["Vitesse", `V = Q/S = ${n(V)} m/s`],
      ["Somme des coefficients", `ΣK = Kₑ + nKc + Kv + Ks = ${n(Ksum)}`],
      ["Pertes singulières", `hₛ = ΣK·V²/(2g) = ${n(hf)} m`]
    ]);
  },
  froudeSimilarity(d) {
    const velocityScale = Math.sqrt(d.N), Vp = d.Vm * velocityScale;
    const flowScale = d.N ** 2.5, Qp = d.Qm / 1000 * flowScale;
    return steps({ velocityScale, Vp, flowScale, Qp }, [
      ["Similitude de Froude", "Frₘ = Frₚ : les rapports inertie/pesanteur sont identiques"],
      ["Échelle des vitesses", `λV = √λL = √${n(d.N)} = ${n(velocityScale)}`],
      ["Vitesse prototype", `Vₚ = VₘλV = ${n(Vp)} m/s`],
      ["Échelle des débits", `λQ = λL²λV = λL^(5/2) = ${n(flowScale)}`],
      ["Débit prototype", `Qₚ = QₘλQ = ${n(Qp)} m³/s`]
    ]);
  },
  manningChannel(d) {
    const slope = d.S / 1000, area = d.b * d.y, perimeter = d.b + 2 * d.y;
    const R = area / perimeter, V = d.Ks * R ** (2/3) * Math.sqrt(slope);
    const Q = area * V, Fr = V / Math.sqrt(G * d.y);
    return steps({ R, V, Q, Fr }, [
      ["Géométrie mouillée", `A = by = ${n(area)} m² ; P = b + 2y = ${n(perimeter)} m`],
      ["Rayon hydraulique", `R = A/P = ${n(R)} m`],
      ["Manning-Strickler", `V = KₛR^(2/3)√S = ${n(V)} m/s`],
      ["Débit", `Q = AV = ${n(Q)} m³/s`],
      ["Régime", `Fr = V/√(gy) = ${n(Fr)} : ${Fr < 1 ? "fluvial" : Fr > 1 ? "torrentiel" : "critique"}`]
    ]);
  },
  viscosity(d) {
    const e = d.e / 1000;
    const tau = d.F / d.A;
    const mu = tau * e / d.U;
    const nu = mu / d.rho;
    return steps({ tau, mu, nu }, [
      ["Conversion en SI", `e = ${n(d.e)} mm = ${n(e)} m`],
      ["Contrainte de cisaillement", `τ = F/A = ${n(d.F)}/${n(d.A)} = ${n(tau)} Pa`],
      ["Loi de Newton", `τ = μ·U/e ⟹ μ = τe/U = ${n(mu)} Pa·s`],
      ["Viscosité cinématique", `ν = μ/ρ = ${n(nu)} m²/s`]
    ]);
  },
  manometer(d) {
    const h = d.h / 1000;
    const dp = (d.rhoM - d.rho) * G * h;
    const head = dp / (d.rho * G);
    return steps({ dp, head }, [
      ["Cheminement hydrostatique", "On ajoute ρgΔz en descendant et on le retranche en montant."],
      ["Manomètre différentiel horizontal", `p₁ − p₂ = (ρₘ − ρ)gΔh = ${n(dp)} Pa`],
      ["Hauteur d’eau équivalente", `(p₁ − p₂)/(ρg) = ${n(head)} mCE`]
    ]);
  },
  planeForce(d) {
    const yc = d.H / 2;
    const area = d.b * d.H;
    const force = d.rho * G * area * yc;
    const ig = d.b * d.H ** 3 / 12;
    const yp = yc + ig / (area * yc);
    return steps({ yc, force, yp }, [
      ["Géométrie", `A = bH = ${n(area)} m² et ȳ = H/2 = ${n(yc)} m`],
      ["Résultante", `F = ρgAȳ = ${n(force)} N`],
      ["Moment quadratique", `Iᴳ = bH³/12 = ${n(ig)} m⁴`],
      ["Centre de poussée", `yₚ = ȳ + Iᴳ/(Aȳ) = ${n(yp)} m = 2H/3`]
    ]);
  },
  venturi(d) {
    const D1 = d.D1 / 1000, D2 = d.D2 / 1000, h = d.h / 1000;
    const S1 = Math.PI * D1 ** 2 / 4, S2 = Math.PI * D2 ** 2 / 4;
    const dp = (d.rhoM - d.rho) * G * h;
    const Q = Math.sqrt((2 * dp / d.rho) / (1 / S2 ** 2 - 1 / S1 ** 2));
    const V1 = Q / S1, V2 = Q / S2;
    return steps({ S1, S2, dp, Q, V1, V2 }, [
      ["Sections", `S₁ = πD₁²/4 = ${n(S1)} m² ; S₂ = ${n(S2)} m²`],
      ["Manomètre", `p₁ − p₂ = (ρHg − ρ)gΔh = ${n(dp)} Pa`],
      ["Continuité", "Q = S₁V₁ = S₂V₂"],
      ["Bernoulli horizontal", "p₁ + ½ρV₁² = p₂ + ½ρV₂²"],
      ["Débit", `Q = √[(2Δp/ρ)/(1/S₂² − 1/S₁²)] = ${n(Q)} m³/s`],
      ["Vitesses", `V₁ = ${n(V1)} m/s ; V₂ = ${n(V2)} m/s`]
    ]);
  },
  jetPlate(d) {
    const diameter = d.d / 1000;
    const area = Math.PI * diameter ** 2 / 4;
    const Q = area * d.V;
    const force = d.rho * Q * d.V;
    return steps({ area, Q, force }, [
      ["Section du jet", `S = πd²/4 = ${n(area)} m²`],
      ["Débit", `Q = SV = ${n(Q)} m³/s`],
      ["Quantité de mouvement", "La vitesse de sortie projetée sur l’axe du jet est nulle."],
      ["Effort sur la plaque", `F = ρQ(V − 0) = ρSV² = ${n(force)} N`]
    ]);
  },
  colebrook(d) {
    const D = d.D / 1000, Q = d.Q / 1000, eps = d.eps / 1000, nu = d.nu * 1e-6;
    const area = Math.PI * D ** 2 / 4, V = Q / area, Re = V * D / nu;
    let f = Re < 2000 ? 64 / Re : 0.02;
    if (Re >= 2000) for (let i = 0; i < 20; i++) f = 1 / (-2 * Math.log10(eps / (3.7 * D) + 2.51 / (Re * Math.sqrt(f)))) ** 2;
    const hf = f * (d.L / D) * V ** 2 / (2 * G);
    const regime = Re < 2000 ? "laminaire" : Re < 4000 ? "transition (résultat indicatif)" : "turbulent";
    return steps({ V, Re, f, hf }, [
      ["Conversions et vitesse", `D = ${n(D)} m ; Q = ${n(Q)} m³/s ; V = Q/S = ${n(V)} m/s`],
      ["Nombre de Reynolds", `Re = VD/ν = ${n(Re)} : régime ${regime}`],
      [Re < 2000 ? "Loi laminaire" : "Colebrook-White", Re < 2000 ? `λ = 64/Re = ${n(f)}` : `1/√λ = −2 log₁₀[ε/(3,7D) + 2,51/(Re√λ)] ⟹ λ = ${n(f)}`],
      ["Darcy-Weisbach", `h_f = λ(L/D)V²/(2g) = ${n(hf)} m`]
    ]);
  }
};

export function solve(exercise, data) {
  const solver = solvers[exercise.solver];
  if (!solver) throw new Error(`Solveur inconnu : ${exercise.solver}`);
  return solver(data);
}

export function isClose(value, target, relativeTolerance = 0.025, absoluteTolerance = 1e-8) {
  return Number.isFinite(value) && Math.abs(value - target) <= Math.max(absoluteTolerance, Math.abs(target) * relativeTolerance);
}
