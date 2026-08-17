export const G = 9.81;
const COMMERCIAL_DN = [150, 200, 250, 300, 350, 400];

const steps = (values, solutionSteps) => ({ values, steps: solutionSteps });
const n = (x, digits = 4) => Number(x).toLocaleString("fr-FR", { maximumSignificantDigits: digits });
const circle = D => Math.PI * D ** 2 / 4;

function colebrookSolve(Re, epsRel, f0 = 0.02) {
  if (Re < 2000) return { f: 64 / Math.max(Re, 1e-9), history: [] };
  const history = [];
  let f = f0;
  for (let i = 1; i <= 15; i++) {
    const arg = epsRel / 3.7 + 2.51 / (Re * Math.sqrt(Math.max(f, 1e-12)));
    const next = 1 / (-2 * Math.log10(arg)) ** 2;
    history.push({ i, f, arg, next });
    if (i >= 2 && Math.abs(next - f) < 1e-7) {
      f = next;
      break;
    }
    f = next;
  }
  return { f, history };
}

function darcyFriction(Re, epsRel) {
  return colebrookSolve(Re, epsRel).f;
}

function colebrookIterationText(history) {
  const nf = x => Number(x).toLocaleString("fr-FR", { maximumSignificantDigits: 6 });
  const lines = [
    "Formule implicite : 1/√λ = −2 log₁₀[ ε/(3,7D) + 2,51/(Re√λ) ].",
    `Initialisation : λ₀ = ${nf(history[0].f)} (ordre de grandeur turbulent).`
  ];
  for (const row of history) {
    lines.push(`Itération ${row.i} : λ = ${nf(row.f)} → terme = ${nf(row.arg)} → λ' = ${nf(row.next)}`);
  }
  const last = history[history.length - 1];
  lines.push(`Convergence en ${history.length} itération${history.length > 1 ? "s" : ""} (|λ' − λ| < 10⁻⁷) → λ = ${nf(last.next)}.`);
  return lines.join("\n");
}

export const solvers = {
  density(d) {
    const fromGeom = Number.isFinite(d.D) && Number.isFinite(d.h) && !Number.isFinite(d.volume);
    const volume = Number.isFinite(d.volume) ? d.volume : Math.PI * (d.D ** 2) / 4 * d.h;
    const mass = Number.isFinite(d.mass) ? d.mass : d.W * 1000 / G;
    const WkN = Number.isFinite(d.W) ? d.W : mass * G / 1000;
    const rho = mass / volume;
    const gamma = WkN / volume;
    const relative = rho / 1000;
    const solution = fromGeom
      ? [
          ["Volume d’huile", `𝒱 = πD²/4 · h = π×${n(d.D)}²/4 × ${n(d.h)} = ${n(volume)} m³`],
          ["Masse volumique", `ρ = m/𝒱 = ${n(mass)}/${n(volume)} = ${n(rho)} kg/m³`],
          ["Poids volumique", `γ = ρg = ${n(rho)} × 9,81 = ${n(gamma * 1000)} N/m³ ≈ ${n(gamma)} kN/m³`],
          ["Densité", `d = ρ/ρeau = ${n(rho)}/1000 = ${n(relative)}`]
        ]
      : [
          ["Poids et masse", `m = W/g = ${n(mass)} kg`],
          ["Masse volumique", `ρ = m/𝒱 = ${n(rho)} kg/m³`],
          ["Poids volumique", `γ = W/𝒱 = ${n(gamma)} kN/m³`],
          ["Densité", `d = ρ/ρeau = ${n(relative)}`]
        ];
    return steps({ volume, mass, rho, gamma, relative }, solution);
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
    const rho0 = d.rho0 ?? 1000;
    const rhoFinal = rho0 * d.volume / finalVolume;
    return steps({ dp, ratio: ratio * 100, deltaV, finalVolume, rhoFinal }, [
      ["Variation de pression", `Δp = (${n(d.p2)} − ${n(d.p1)}) bar = ${n(dp)} Pa`],
      ["Module d’élasticité", `K = −Δp/(Δ𝒱/𝒱) ⟹ diminution relative = Δp/K = ${n(ratio * 100)} %`],
      ["Variation de volume", `|Δ𝒱| = 𝒱Δp/K = ${n(deltaV)} m³`],
      ["Volume final", `𝒱₂ = 𝒱₁ − |Δ𝒱| = ${n(finalVolume)} m³`],
      ["Masse volumique finale", `ρ = m/𝒱₂ = ${n(rho0)} × 𝒱₁/𝒱₂ = ${n(rhoFinal)} kg/m³`]
    ]);
  },
  layeredPressure(d) {
    const interfaceP = d.rhoOil * G * d.hOil;
    const bottomP = interfaceP + d.rhoWater * G * d.hWater;
    const head = bottomP / (d.rhoWater * G);
    const pBar = bottomP / 1e5;
    return steps({ interfaceP, bottomP, head, pBar }, [
      ["Interface huile–eau", `pᵢ = ρhuile·g·hhuile = ${n(interfaceP)} Pa`],
      ["Fond du réservoir", `p_f = ρhuile·g·hhuile + ρeau·g·heau = ${n(bottomP)} Pa`],
      ["Hauteur d’eau", `H = p_f/(ρeau g) = ${n(head)} mCE`],
      ["En bar", `p_f = ${n(pBar)} bar`]
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
  pipeContinuity(d) {
    const D = d.D / 1000, Q = d.Q / 1000, A = Math.PI * D ** 2 / 4, V = Q / A;
    const Dtarget = Math.sqrt(4 * Q / (Math.PI * d.targetV));
    return steps({ A, V, Dtarget }, [
      ["Section", `A = πD²/4 = ${n(A)} m²`],
      ["Vitesse moyenne", `V = Q/A = ${n(V)} m/s`],
      ["Diamètre cible", `D = √(4Q/πV) = ${n(Dtarget)} m`]
    ]);
  },
  twoSectionContinuity(d) {
    const D1 = d.D1 / 1000, D2 = d.D2 / 1000, Q = d.Q / 1000;
    const A1 = Math.PI * D1 ** 2 / 4, A2 = Math.PI * D2 ** 2 / 4;
    const V1 = Q / A1, V2 = Q / A2;
    return steps({ A1, V1, A2, V2 }, [
      ["Sections", `A₁ = πD₁²/4 = ${n(A1)} m² ; A₂ = ${n(A2)} m²`],
      ["Vitesse amont", `V₁ = Q/A₁ = ${n(V1)} m/s`],
      ["Vitesse aval", `V₂ = Q/A₂ = ${n(V2)} m/s`],
      ["Contrôle", `A₁V₁ = A₂V₂ = ${n(Q)} m³/s`]
    ]);
  },
  networkNode(d) {
    const A1 = Math.PI * (d.D1 / 1000) ** 2 / 4, A2 = Math.PI * (d.D2 / 1000) ** 2 / 4;
    const A3 = Math.PI * (d.D3 / 1000) ** 2 / 4;
    const Q1 = A1 * d.V1 * 1000, Q2 = A2 * d.V2 * 1000, Q3 = Q1 + Q2 - d.Qbranch;
    const V3 = (Q3 / 1000) / A3;
    return steps({ Q1, Q2, Q3, V3 }, [
      ["Débits entrants", `Q₁ = A₁V₁ = ${n(Q1)} L/s ; Q₂ = A₂V₂ = ${n(Q2)} L/s`],
      ["Loi des nœuds", `ΣQ = 0 ⟹ Q₃ = Q₁ + Q₂ − Qᵦ = ${n(Q3)} L/s`],
      ["Vitesse aval", `V₃ = Q₃/A₃ = ${n(V3)} m/s`]
    ]);
  },
  convectiveAcceleration(d) {
    const gradient = (d.V2 - d.V1) / d.L, Vmid = (d.V1 + d.V2) / 2, acceleration = Vmid * gradient;
    return steps({ gradient, Vmid, acceleration }, [
      ["Gradient uniforme", `dV/dx = (V₂ − V₁)/L = ${n(gradient)} s⁻¹`],
      ["Vitesse à mi-parcours", `Vₘ = (V₁ + V₂)/2 = ${n(Vmid)} m/s`],
      ["Accélération convective", `a = V·dV/dx = ${n(acceleration)} m/s²`]
    ]);
  },
  reservoirRise(d) {
    const area = Math.PI * d.D ** 2 / 4, dQ = (d.Qin - d.Qout) / 1000, riseRate = dQ / area, time = d.deltaH / riseRate;
    return steps({ dQ, riseRate, time }, [
      ["Bilan de volume", `A dh/dt = Qₑ − Qₛ ; A = πD²/4 = ${n(area)} m²`],
      ["Débit net", `Qₑ − Qₛ = ${n(dQ)} m³/s`],
      ["Vitesse de montée", `dh/dt = (Qₑ − Qₛ)/A = ${n(riseRate)} m/s`],
      ["Temps de montée", `t = Δh/(dh/dt) = ${n(time)} s`]
    ]);
  },
  tankFilling(d) {
    const time = d.hours * 3600, Q = d.volume / time, A = Q / d.maxV, D = Math.sqrt(4 * A / Math.PI);
    return steps({ Q, Qls: Q * 1000, D, Dmm: D * 1000 }, [
      ["Débit requis", `Q = 𝒱/t = ${n(Q)} m³/s`],
      ["Section minimale", `A = Q/Vmax = ${n(A)} m²`],
      ["Diamètre minimal", `D = √(4A/π) = ${n(D)} m`]
    ]);
  },
  distributedFlow(d) {
    const loss = d.Qin - d.Qout, rate = loss / d.L, Qmid = d.Qin - rate * d.L / 2;
    return steps({ loss, rate, Qmid }, [
      ["Bilan global", `Qprélevé = Qentrée − Qsortie = ${n(loss)} L/s`],
      ["Prélèvement linéique", `q = Qprélevé/L = ${n(rate)} L/(s·m)`],
      ["Débit à mi-longueur", `Q(L/2) = Qentrée − qL/2 = ${n(Qmid)} L/s`]
    ]);
  },
  bernoulliSections(d) {
    const D1 = d.D1 / 1000, D2 = d.D2 / 1000, Q = d.Q / 1000;
    const A1 = Math.PI * D1 ** 2 / 4, A2 = Math.PI * D2 ** 2 / 4, V1 = Q / A1, V2 = Q / A2;
    const p2 = d.p1 * 1000 + d.rho * G * (d.z1 - d.z2) + 0.5 * d.rho * (V1 ** 2 - V2 ** 2);
    return steps({ V1, V2, p2 }, [
      ["Continuité", `V₁ = Q/A₁ = ${n(V1)} m/s ; V₂ = ${n(V2)} m/s`],
      ["Bernoulli", `p₂ = p₁ + ρg(z₁ − z₂) + ρ(V₁² − V₂²)/2`],
      ["Pression", `p₂ = ${n(p2)} Pa`]
    ]);
  },
  drainTime(d) {
    const tankA = Math.PI * d.tankD ** 2 / 4, orificeA = Math.PI * (d.orificeD / 1000) ** 2 / 4;
    const t = 2 * tankA * (Math.sqrt(d.h1) - Math.sqrt(d.h2)) / (d.Cd * orificeA * Math.sqrt(2 * G));
    return steps({ tankA, orificeA, t }, [
      ["Sections", `A = ${n(tankA)} m² ; a = ${n(orificeA)} m²`],
      ["Bilan non permanent", "−A dh/dt = Cᵈ a √(2gh)"],
      ["Intégration", `t = 2A(√h₁ − √h₂)/(Cᵈ a √(2g)) = ${n(t)} s`]
    ]);
  },
  pitot(d) {
    const h = d.h / 1000;
    const dynamic = d.rhoM ? (d.rhoM - d.rho) * G * h : d.rho * G * h;
    const V = Math.sqrt(2 * dynamic / d.rho);
    return steps({ dynamic, V }, [
      ["Manomètre", d.rhoM ? `Δp = (ρₘ − ρ)gΔh = ${n(dynamic)} Pa` : `Δp = ρgh = ${n(dynamic)} Pa`],
      ["Point d’arrêt", `V = √(2Δp/ρ) = ${n(V)} m/s`]
    ]);
  },
  siphon(d) {
    const D = d.D / 1000, V = Math.sqrt(2 * G * d.drop), Q = Math.PI * D ** 2 / 4 * V;
    const pHigh = (d.patm || 101.3) * 1000 - d.rho * G * (d.rise + V ** 2 / (2 * G));
    const pRel = pHigh - (d.patm || 101.3) * 1000;
    return steps({ V, Q, Qls: Q * 1000, pHigh, pRel }, [
      ["Surface vers sortie", `V = √(2gΔz) = ${n(V)} m/s`],
      ["Débit", `Q = πD²V/4 = ${n(Q)} m³/s`],
      ["Surface vers point haut", `p_C = pₐₜₘ − ρg(z_C + V²/2g) = ${n(pHigh)} Pa`]
    ]);
  },
  hydraulicPower(d) {
    const Q = d.Q / 1000, H = d.head + d.losses, waterPower = d.rho * G * Q * H, inputPower = waterPower / d.efficiency;
    return steps({ H, waterPower, inputPower }, [
      ["Hauteur manométrique", `HMT = H_g + h_pertes = ${n(H)} m`],
      ["Puissance hydraulique", `Pₕ = ρgQH = ${n(waterPower)} W`],
      ["Puissance absorbée", `P_abs = Pₕ/η = ${n(inputPower)} W`]
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
  coaxialViscometer(d) {
    const ri=d.ri/1000, ro=d.ro/1000, L=d.L/1000, omega=2*Math.PI*d.rpm/60, gap=ro-ri;
    const mu=d.torque*gap/(2*Math.PI*omega*L*ri**3), U=omega*ri, tau=mu*U/gap;
    return steps({omega,U,gap,mu,tau},[["Vitesse angulaire",`ω=2πN/60=${n(omega)} rad/s`],["Vitesse périphérique",`U=ωRᵢ=${n(U)} m/s`],["Entrefer",`e=Rₑ−Rᵢ=${n(gap)} m`],["Bilan du couple",`C=τ(2πRᵢL)Rᵢ et τ=μU/e`],["Viscosité",`μ=Ce/(2πωLRᵢ³)=${n(mu)} Pa·s`],["Contrainte",`τ=μU/e=${n(tau)} Pa`]]);
  },
  capillary(d) {
    const diameter=d.d/1000, theta=d.theta*Math.PI/180, h=4*d.sigma*Math.cos(theta)/(d.rho*G*diameter);
    const values = { h };
    const solution = [
      ["Équilibre vertical","La composante verticale de la tension superficielle équilibre le poids de la colonne."],
      ["Loi de Jurin",`h=4σcosθ/(ρgd)=${n(h)} m`]
    ];
    if (Number.isFinite(d.hMax)) {
      const dMin = 4 * d.sigma * Math.cos(theta) / (d.rho * G * (d.hMax / 1000)) * 1000;
      values.dMin = dMin;
      solution.push(["Diamètre minimal du piézomètre", `h ≤ ${n(d.hMax)} mm ⟹ D ≥ 4σ/(ρgh) = ${n(dMin)} mm`]);
    }
    return steps(values, solution);
  },
  laplace(d) {
    const radius=d.radius/1e6, dp=d.factor*d.sigma/radius;
    return steps({dp},[["Rayon en SI",`R=${n(radius)} m`],["Loi de Laplace",`Δp=${d.factor}σ/R=${n(dp)} Pa`]]);
  },
  idealGas(d) {
    const T=d.temp+273.15, p=d.pressure*1e5, rho=p/(d.R*T);
    const values = { T, p, rho };
    const solution = [
      ["Température absolue",`T=${d.temp}+273,15=${n(T)} K`],
      ["Pression absolue",`p=${n(p)} Pa`],
      ["Gaz parfait",`ρ=p/(RT)=${n(rho)} kg/m³`]
    ];
    if (Number.isFinite(d.volumeL)) {
      const volume = d.volumeL / 1000;
      const mass = rho * volume;
      values.mass = mass;
      solution.push(["Masse d’air", `m = ρ𝒱 = ${n(rho)} × ${n(volume)} = ${n(mass)} kg`]);
      if (Number.isFinite(d.pAtm)) {
        const V2 = volume * d.pressure / d.pAtm;
        values.V2 = V2;
        solution.push(["Volume à pₐₜₘ", `𝒱₂ = 𝒱₁ p₁/p₂ = ${n(volume)} × ${n(d.pressure)}/${n(d.pAtm)} = ${n(V2)} m³`]);
      }
    }
    return steps(values, solution);
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
  hydraulicPress(d) {
    const ratio=(d.dBig/d.dSmall)**2, smallForce=d.load/ratio, smallTravel=d.bigTravel*ratio;
    return steps({ratio,smallForce,smallTravel},[["Rapport des surfaces",`A₂/A₁=(D₂/D₁)²=${n(ratio)}`],["Principe de Pascal",`F₁/A₁=F₂/A₂ ⟹ F₁=${n(smallForce)} N`],["Conservation du volume",`A₁x₁=A₂x₂ ⟹ x₁=${n(smallTravel)} mm`]]);
  },
  circularGate(d) {
    const D=d.D, area=Math.PI*D**2/4, ig=Math.PI*D**4/64, force=d.rho*G*area*d.yc, yp=d.yc+ig/(area*d.yc);
    return steps({area,force,yp},[["Aire",`A=πD²/4=${n(area)} m²`],["Poussée",`F=ρgAȳ=${n(force)} N`],["Inertie centrale",`Iᴳ=πD⁴/64=${n(ig)} m⁴`],["Centre de poussée",`yₚ=ȳ+Iᴳ/(Aȳ)=${n(yp)} m`]]);
  },
  bargeStability(d) {
    const volume=d.L*d.B*d.draft, mass=d.rho*volume, zB=d.draft/2, inertia=d.L*d.B**3/12, BM=inertia/volume, GM=zB+BM-d.zG;
    return steps({volume,mass,zB,BM,GM},[["Volume déplacé",`∇=LBTe=${n(volume)} m³`],["Équilibre de flottaison",`m=ρ∇=${n(mass)} kg`],["Centre de carène",`zB=Te/2=${n(zB)} m`],["Rayon métacentrique",`BM=I/∇=${n(BM)} m`],["Hauteur métacentrique",`GM=zB+BM−zG=${n(GM)} m : ${GM>0?"stable":"instable"}`]]);
  },
  manometer(d) {
    if (Number.isFinite(d.zConnect) && Number.isFinite(d.dzAB)) {
      const dh = d.h, hAM = d.zConnect, hNB = hAM - dh + d.dzAB;
      const dp = d.rho * G * (-hAM + hNB) + d.rhoM * G * dh;
      const head = dp / (d.rho * G);
      return steps({ dp, head }, [
        ["Cheminement A → B", `Descente eau ${n(hAM)} m jusqu’au mercure, montée Hg ${n(dh)} m, puis montée eau ${n(hNB)} m jusqu’à B.`],
        ["Bilan hydrostatique", `p_A − p_B = ρg(−h_AM + h_NB) + ρ_Hg g Δh = ${n(dp)} Pa`],
        ["Hauteur d’eau équivalente", `(p_A − p_B)/(ρg) = ${n(head)} mCE`]
      ]);
    }
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
    const zC = d.H / 3;
    const Mrev = force * zC;
    return steps({ yc, force, yp, zC, Mrev }, [
      ["Diagramme des pressions", `p_max = ρgH = ${n(d.rho * G * d.H)} Pa ; triangle de hauteur H.`],
      ["Poussée", `F = ½ ρg H² b = ${n(force)} N`],
      ["Point d’application", `z_C = H/3 = ${n(zC)} m depuis le pied (yₚ = 2H/3 = ${n(yp)} m sous la surface)`],
      ["Moment au pied", `M = F × H/3 = ${n(Mrev)} N·m`]
    ]);
  },
  venturi(d) {
    const D1 = d.D1 / 1000, D2 = d.D2 / 1000, h = (d.h || 0) / 1000;
    const S1 = Math.PI * D1 ** 2 / 4, S2 = Math.PI * D2 ** 2 / 4;
    const dp = Number.isFinite(d.dpK) ? d.dpK * 1000 : (d.rhoM - d.rho) * G * h;
    const Q = Math.sqrt((2 * dp / d.rho) / (1 / S2 ** 2 - 1 / S1 ** 2));
    const V1 = Q / S1, V2 = Q / S2;
    return steps({ S1, S2, dp, Q, V1, V2 }, [
      ["Sections", `S₁ = πD₁²/4 = ${n(S1)} m² ; S₂ = ${n(S2)} m²`],
      ["Différence de pression", Number.isFinite(d.dpK) ? `p₁ − p₂ = ${n(d.dpK)} kPa = ${n(dp)} Pa` : `p₁ − p₂ = (ρHg − ρ)gΔh = ${n(dp)} Pa`],
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
    const { f, history } = colebrookSolve(Re, eps / D);
    const hf = f * (d.L / D) * V ** 2 / (2 * G);
    const regime = Re < 2000 ? "laminaire" : Re < 4000 ? "transition (résultat indicatif)" : "turbulent";
    const colebrookStep = Re < 2000
      ? ["Loi laminaire", `λ = 64/Re = ${n(f)}`]
      : ["Itérations de Colebrook–White", colebrookIterationText(history)];
    return steps({ V, Re, f, hf }, [
      ["Conversions et vitesse", `D = ${n(D)} m ; Q = ${n(Q)} m³/s ; V = Q/S = ${n(V)} m/s`],
      ["Nombre de Reynolds", `Re = VD/ν = ${n(Re)} : régime ${regime}`],
      colebrookStep,
      ["Darcy-Weisbach", `h_f = λ(L/D)V²/(2g) = ${n(hf)} m`]
    ]);
  },
  moodyRead(d) {
    const Re = d.Re, epsRel = d.epsRel, { f, history } = colebrookSolve(Re, epsRel);
    const fInf = epsRel > 0 ? 1 / (-2 * Math.log10(epsRel / 3.7)) ** 2 : 0;
    const rough = epsRel > 0 && Re > 200 / (epsRel * Math.sqrt(f));
    const zone = Re < 2000 ? "laminaire" : Re < 4000 ? "transition" : rough ? "turbulent rugueux" : "turbulent de transition";
    return steps({ f, fInf, epsRel }, [
      ["Lecture du Moody", "Entrer par Re en abscisse (échelle log), suivre la courbe ε/D, lire λ en ordonnée (échelle log)."],
      ["Rugosité relative", `ε/D = ${n(epsRel)}`],
      history.length ? ["Itérations de Colebrook–White", colebrookIterationText(history)] : ["Loi laminaire", `λ = 64/Re = ${n(f)}`],
      ["Facteur lu / Colebrook", `λ = ${n(f)} — zone ${zone}`],
      ["Limite rugueuse", epsRel > 0 ? `À droite de la ligne tiretée, λ → λ∞ = [−2 log₁₀(ε/3,7D)]⁻² = ${n(fInf)}` : "Conduite hydrauliquement lisse : λ continue de baisser quand Re augmente."]
    ]);
  },
  jetMobile(d) {
    const A = d.d ? circle(d.d / 1000) : (d.Q / 1000) / d.V, Q = A * d.V, Vrel = Math.max(d.V - d.u, 0);
    const Ffixed = 2 * d.rho * Q * d.V, Fmoving = 2 * d.rho * A * Vrel ** 2;
    const power = Fmoving * d.u, uOpt = d.V / 3;
    return steps({ Ffixed, Fmoving, power, uOpt }, [
      ["Auget fixe à 180°", `F_fixe = 2ρQV = ${n(Ffixed)} N`],
      ["Vitesse relative", `V − u = ${n(Vrel)} m/s`],
      ["Auget mobile", `F = 2ρA(V − u)² = ${n(Fmoving)} N`],
      ["Puissance recueillie", `P = F u = ${n(power)} W`],
      ["Optimum", `dP/du = 0 ⟹ u_opt = V/3 = ${n(uOpt)} m/s`]
    ]);
  },
  elbowForce(d) {
    const A = circle(d.D / 1000), Q = d.Q / 1000, V = Q / A, p = d.p1 * 1000;
    const th = ((d.theta ?? 90) * Math.PI) / 180, pack = p * A + d.rho * Q * V;
    const Fx = pack * (1 - Math.cos(th)), Fy = pack * Math.sin(th), F = 2 * pack * Math.sin(th / 2);
    return steps({ V, Fx, Fy, F }, [
      ["Section et vitesse", `A = ${n(A)} m² ; V = Q/A = ${n(V)} m/s`],
      ["Paquet pression + quantité de mouvement", `pA + ρQV = ${n(pack)} N`],
      ["Composante axiale", `Fₓ = (pA+ρQV)(1 − cosθ) = ${n(Fx)} N`],
      ["Composante transversale", `Fᵧ = (pA+ρQV) sinθ = ${n(Fy)} N`],
      ["Résultante d’ancrage", `F = 2(pA+ρQV) sin(θ/2) = ${n(F)} N, bissectrice extérieure`]
    ]);
  },
  convergentForce(d) {
    const A1 = circle(d.D1 / 1000), A2 = circle(d.D2 / 1000), Q = d.Q / 1000;
    const V1 = Q / A1, V2 = Q / A2, p1 = d.p1 * 1000;
    const p2 = p1 + 0.5 * d.rho * (V1 ** 2 - V2 ** 2);
    const F = p1 * A1 - p2 * A2 - d.rho * Q * (V2 - V1);
    return steps({ V1, V2, p2, F }, [
      ["Vitesses", `V₁ = ${n(V1)} m/s ; V₂ = ${n(V2)} m/s`],
      ["Bernoulli horizontal", `p₂ = p₁ + ½ρ(V₁² − V₂²) = ${n(p2)} Pa`],
      ["Euler axial", "R_eau→pièce = p₁A₁ − p₂A₂ − ρQ(V₂ − V₁)"],
      ["Effort sur le convergent", `F = ${n(F)} N (positif vers l’aval)`]
    ]);
  },
  jetReaction(d) {
    const A = d.A / 1e4, V = Math.sqrt(2 * G * d.h), Q = A * V, F = d.rho * Q * V;
    return steps({ V, Q, F }, [
      ["Torricelli", `V = √(2gh) = ${n(V)} m/s`],
      ["Débit", `Q = AV = ${n(Q)} m³/s`],
      ["Réaction du réservoir", `F = ρQV = 2ρghA = ${n(F)} N`],
      ["Lecture", "La poussée vaut le double de la force hydrostatique sur un bouchon fermant l’orifice."]
    ]);
  },
  inclinedPlate(d) {
    const th = d.theta * Math.PI / 180, Q = d.Q / 1000;
    const Fn = d.rho * Q * d.V * Math.sin(th);
    const Qdown = d.Q * (1 + Math.cos(th)) / 2, Qup = d.Q * (1 - Math.cos(th)) / 2;
    return steps({ Fn, Qdown, Qup }, [
      ["Plaque lisse", "La réaction est purement normale : aucune force tangentielle."],
      ["Force normale", `Fₙ = ρQV sinθ = ${n(Fn)} N`],
      ["Répartition du débit", `Q₊ = Q(1+cosθ)/2 = ${n(Qdown)} L/s ; Q₋ = ${n(Qup)} L/s`]
    ]);
  },
  reynoldsRegime(d) {
    const D = d.D / 1000, Q = d.Q / 1000, nu = d.nu * 1e-6, V = Q / circle(D), Re = V * D / nu;
    return steps({ V, Re }, [
      ["Vitesse moyenne", `V = Q/A = ${n(V)} m/s`],
      ["Nombre de Reynolds", `Re = VD/ν = ${n(Re)}`],
      ["Régime", Re < 2000 ? "laminaire (Re < 2000)" : Re < 4000 ? "transition (2000–4000)" : "turbulent (Re > 4000)"]
    ]);
  },
  hydraulicDiameter(d) {
    const a = d.a / 1000, b = d.b / 1000, nu = d.nu * 1e-6;
    const Dh = 2 * a * b / (a + b), Re = d.V * Dh / nu;
    return steps({ Dh, Re }, [
      ["Section pleine", `A = ab ; P = 2(a+b)`],
      ["Diamètre hydraulique", `Dₕ = 4A/P = 2ab/(a+b) = ${n(Dh)} m`],
      ["Reynolds", `Re = V Dₕ/ν = ${n(Re)}`]
    ]);
  },
  fallingFilm(d) {
    const e = d.e / 1000, sina = Math.sin(d.alpha * Math.PI / 180);
    const uSurface = d.rho * G * e ** 2 * sina / (2 * d.mu);
    const q = d.rho * G * e ** 3 * sina / (3 * d.mu);
    const uMean = (2 / 3) * uSurface, Re = d.rho * uMean * e / d.mu;
    return steps({ uSurface, q, Re }, [
      ["Équilibre NS", "pesanteur motrice = viscosité ; adhérence au parement, τ = 0 à la surface libre"],
      ["Profil demi-Poiseuille", `u(e) = ρge²sinα/(2μ) = ${n(uSurface)} m/s`],
      ["Débit linéique", `q = ρge³sinα/(3μ) = ${n(q)} m²/s`],
      ["Contrôle a posteriori", `Re = ρūe/μ = ${n(Re)} — laminaire seulement si Re ≲ 500`]
    ]);
  },
  poiseuilleOil(d) {
    const D = d.D / 1000, Q = d.Q / 1000, V = Q / circle(D), Re = d.rho * V * D / d.mu;
    const f = 64 / Re, hf = f * (d.L / D) * V ** 2 / (2 * G), dp = d.rho * G * hf, power = Q * dp;
    return steps({ V, Re, f, hf, dp, power }, [
      ["Vitesse et Reynolds", `V = ${n(V)} m/s ; Re = ${n(Re)}`],
      ["Loi laminaire", `λ = 64/Re = ${n(f)}`],
      ["Perte de charge", `h_f = λ(L/D)V²/(2g) = ${n(hf)} m`],
      ["Chute de pression", `Δp = ρgh_f = ${n(dp)} Pa`],
      ["Puissance dissipée", `P = QΔp = ${n(power)} W`]
    ]);
  },
  gravityPipe(d) {
    const D = d.D / 1000, eps = d.eps / 1000, nu = d.nu * 1e-6;
    let V = Math.sqrt(2 * G * d.H / (0.02 * d.L / D + d.Ksum)), f = 0.02, Re = 0;
    const outer = [];
    for (let i = 0; i < 16; i++) {
      Re = V * D / nu;
      const solved = colebrookSolve(Re, eps / D, f);
      f = solved.f;
      const nextV = Math.sqrt(2 * G * d.H / (f * d.L / D + d.Ksum));
      outer.push({ i: i + 1, V, Re, f, nextV });
      if (i >= 2 && Math.abs(nextV - V) < 1e-6) {
        V = nextV;
        break;
      }
      V = nextV;
    }
    const Q = circle(D) * V * 1000, hf = f * (d.L / D) * V ** 2 / (2 * G);
    const nf = x => Number(x).toLocaleString("fr-FR", { maximumSignificantDigits: 5 });
    const outerText = [
      "H est connue, Q (donc V et λ) est inconnue : on itère V ↔ Colebrook.",
      ...outer.map(row => `Itération ${row.i} : V = ${nf(row.V)} m/s → Re = ${nf(row.Re)} → λ = ${nf(row.f)} → V' = ${nf(row.nextV)} m/s`)
    ].join("\n");
    return steps({ V, f, Q, hf }, [
      ["Bernoulli entre surfaces libres", `H = (λL/D + ΣK) V²/(2g)`],
      ["Itérations V + Colebrook", outerText],
      ["Vitesse", `V = ${n(V)} m/s`],
      ["Débit", `Q = AV = ${n(Q)} L/s`]
    ]);
  },
  pipeSizing(d) {
    const Q = d.Q / 1000, eps = d.eps / 1000, nu = d.nu * 1e-6;
    const rows = COMMERCIAL_DN.map(Dmm => {
      const D = Dmm / 1000, V = Q / circle(D), Re = V * D / nu, f = darcyFriction(Re, eps / D);
      const hf = f * (d.L / D) * V ** 2 / (2 * G);
      return { Dmm, V, hf, ok: hf <= d.H };
    });
    const chosen = rows.find(r => r.ok) || rows[rows.length - 1];
    return steps({ Dmm: chosen.Dmm, V: chosen.V, hf: chosen.hf }, [
      ["Charge disponible", `H = ${n(d.H)} m à consommer en pertes linéaires`],
      ["Série commerciale", COMMERCIAL_DN.map(D => `${D}`).join(" / ") + " mm"],
      ["Diamètre retenu", `DN ${chosen.Dmm} : h_f = ${n(chosen.hf)} m ${chosen.ok ? "≤" : ">"} ${n(d.H)} m`],
      ["Vitesse", `V = ${n(chosen.V)} m/s`]
    ]);
  },
  pumpStation(d) {
    const Q = d.Q / 1000, Ds = d.Ds / 1000, Dd = d.Dd / 1000;
    const Vs = Q / circle(Ds), Vd = Q / circle(Dd);
    const hfs = (d.f * d.Ls / Ds + d.Ks) * Vs ** 2 / (2 * G);
    const hfd = (d.f * d.Ld / Dd + d.Kd) * Vd ** 2 / (2 * G);
    const HMT = (d.z2 - d.z1) + hfs + hfd;
    const waterPower = d.rho * G * Q * HMT, inputPower = waterPower / d.eta;
    return steps({ HMT, hfs, hfd, waterPower, inputPower }, [
      ["Vitesses", `V_asp = ${n(Vs)} m/s ; V_ref = ${n(Vd)} m/s`],
      ["Pertes aspiration", `h_asp = ${n(hfs)} m`],
      ["Pertes refoulement", `h_ref = ${n(hfd)} m`],
      ["Hauteur manométrique", `HMT = Δz + h_asp + h_ref = ${n(HMT)} m`],
      ["Puissances", `Pₕ = ${n(waterPower)} W ; P_abs = Pₕ/η = ${n(inputPower)} W`]
    ]);
  },
  bordaCarnot(d) {
    const A1 = circle(d.D1 / 1000), A2 = circle(d.D2 / 1000), Q = d.Q / 1000;
    const V1 = Q / A1, V2 = Q / A2, hs = (V1 - V2) ** 2 / (2 * G);
    const dp = 0.5 * d.rho * (V1 ** 2 - V2 ** 2) - d.rho * G * hs;
    return steps({ V1, V2, hs, dp }, [
      ["Vitesses", `V₁ = ${n(V1)} m/s ; V₂ = ${n(V2)} m/s`],
      ["Borda–Carnot", `hₛ = (V₁ − V₂)²/(2g) = ${n(hs)} m`],
      ["Bernoulli généralisé", `p₂ − p₁ = ½ρ(V₁² − V₂²) − ρghₛ = ${n(dp)} Pa`],
      ["Lecture", "La pression remonte, mais moins qu’en fluide parfait : le diffuseur brusque dissipe une partie de l’énergie cinétique."]
    ]);
  },
  reynoldsDrag(d) {
    const velScale = 1 / d.N, Fp = d.Fm;
    return steps({ velScale, Fp }, [
      ["Similitude de Reynolds", "Même fluide : Vₘ Lₘ = Vₚ Lₚ ⟹ Vₘ/Vₚ = N"],
      ["Échelle des vitesses", `λV = 1/N = ${n(velScale)} — le modèle doit aller N fois plus vite`],
      ["Échelle des forces", `F ~ ρV²L² ⟹ Fₚ/Fₘ = 1`],
      ["Force prototype", `Fₚ = Fₘ = ${n(Fp)} N`]
    ]);
  },
  froudeSpillway(d) {
    const Qm = d.Qp / d.N ** 2.5, Vp = d.Vm * Math.sqrt(d.N);
    const tp = d.tMin * 60 * Math.sqrt(d.N), Fp = d.Fm * d.N ** 3;
    return steps({ Qm, Vp, tp, Fp }, [
      ["Échelle des débits", `λQ = N^(5/2) ⟹ Qₘ = Qₚ/λQ = ${n(Qm)} m³/s`],
      ["Vitesse prototype", `Vₚ = Vₘ√N = ${n(Vp)} m/s`],
      ["Temps prototype", `tₚ = tₘ√N = ${n(tp)} s`],
      ["Force prototype", `λF = N³ ⟹ Fₚ = ${n(Fp)} N`]
    ]);
  },
  stokesViscosity(d) {
    const diam = d.d / 1000, mu = (d.rhoS - d.rhoF) * G * diam ** 2 / (18 * d.V);
    const Re = d.rhoF * d.V * diam / mu;
    return steps({ mu, Re }, [
      ["Équilibre à vitesse limite", "poids = Archimède + traînée de Stokes 3πμdV"],
      ["Viscosité", `μ = (ρₛ − ρ)gd²/(18V) = ${n(mu)} Pa·s`],
      ["Contrôle", `Re = ρVd/μ = ${n(Re)} — Stokes valable si Re ≲ 1`]
    ]);
  },
  trapezoidalChannel(d) {
    const slope = d.S / 1000, A = (d.b + d.z * d.y) * d.y, P = d.b + 2 * d.y * Math.sqrt(1 + d.z ** 2);
    const R = A / P, V = d.Ks * R ** (2 / 3) * Math.sqrt(slope), Q = A * V;
    const T = d.b + 2 * d.z * d.y, ym = A / T, Fr = V / Math.sqrt(G * ym);
    return steps({ R, V, Q, Fr }, [
      ["Géométrie trapézoïdale", `A = (b + zy)y = ${n(A)} m² ; P = b + 2y√(1+z²) = ${n(P)} m`],
      ["Rayon hydraulique", `R = A/P = ${n(R)} m`],
      ["Strickler", `V = Kₛ R^(2/3)√S = ${n(V)} m/s ; Q = ${n(Q)} m³/s`],
      ["Froude", `Fr = V/√(gȳ) = ${n(Fr)} avec ȳ = A/T = ${n(ym)} m`]
    ]);
  },
  normalDepth(d) {
    const slope = d.S / 1000, manningQ = y => {
      const A = d.b * y, R = A / (d.b + 2 * y);
      return A * d.Ks * R ** (2 / 3) * Math.sqrt(slope);
    };
    let lo = 0.02, hi = 8;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (manningQ(mid) < d.Q) lo = mid; else hi = mid;
    }
    const y = (lo + hi) / 2, A = d.b * y, V = d.Q / A, Fr = V / Math.sqrt(G * y);
    return steps({ y, V, Fr }, [
      ["Équation à résoudre", "Q = A Kₛ R^(2/3) √S avec A = by et R = A/(b+2y)"],
      ["Profondeur normale", `yₙ = ${n(y)} m`],
      ["Vitesse", `V = Q/A = ${n(V)} m/s`],
      ["Régime", `Fr = ${n(Fr)} : ${Fr < 1 ? "fluvial" : Fr > 1 ? "torrentiel" : "critique"}`]
    ]);
  },
  waveCelerity(d) {
    const c = Math.sqrt(G * d.y), cDown = d.V + c, cUp = c - d.V, tUp = d.Lkm * 1000 / cUp;
    return steps({ c, cDown, cUp, tUp }, [
      ["Célérité relative", `c = √(gy) = ${n(c)} m/s`],
      ["Front aval", `V + c = ${n(cDown)} m/s`],
      ["Front amont", `c − V = ${n(cUp)} m/s (remonte si Fr < 1)`],
      ["Délai vers l’amont", `t = L/(c − V) = ${n(tUp)} s`]
    ]);
  },
  damBreakRitter(d) {
    const cFront = 2 * Math.sqrt(G * d.h0), hDam = 4 / 9 * d.h0;
    const vDam = (2 / 3) * Math.sqrt(G * d.h0), t = d.xKm * 1000 / cFront;
    return steps({ cFront, hDam, vDam, t }, [
      ["Front sur fond sec", `c_f = 2√(gh₀) = ${n(cFront)} m/s`],
      ["Au droit du barrage", `h = 4h₀/9 = ${n(hDam)} m ; V = 2√(gh₀)/3 = ${n(vDam)} m/s`],
      ["Temps d’arrivée", `t = x/c_f = ${n(t)} s`],
      ["Lecture", "Ritter est un majorant sans frottement : les études réelles résolvent Saint-Venant complet."]
    ]);
  },
  damSluice(d) {
    const y0 = d.hSill - d.H, yc = y0 + d.H / 2, A = d.b * d.H;
    const force = d.rho * G * A * yc, ig = d.b * d.H ** 3 / 12, yp = yc + ig / (A * yc);
    const lift = d.W * 1000 + d.mu * force, Q = d.Cd * A * Math.sqrt(2 * G * yc);
    return steps({ force, yp, lift, Q }, [
      ["Centre de gravité", `ȳ = h_seuil − H/2 = ${n(yc)} m`],
      ["Poussée fermée", `F = ρgAȳ = ${n(force)} N`],
      ["Centre de poussée", `yₚ = ȳ + Iᴳ/(Aȳ) = ${n(yp)} m`],
      ["Effort de levage", `T = W + μF = ${n(lift)} N`],
      ["Débit vanne ouverte", `Q = Cᵈ A √(2gȳ) = ${n(Q)} m³/s`]
    ]);
  },
  npshCavitation(d) {
    const Q = d.Q / 1000, D = d.D / 1000, V = Q / circle(D);
    const hf = (d.f * d.L / D + d.K) * V ** 2 / (2 * G);
    const patm = d.patm * 1000 / (d.rho * G), pv = d.pv * 1000 / (d.rho * G), Hs = d.ze - d.z0;
    const NPSHd = patm - pv - Hs - hf;
    const pe = (patm - Hs - V ** 2 / (2 * G) - hf) * d.rho * G;
    const zMax = d.z0 + (patm - pv - d.NPSHr - d.margin - hf);
    return steps({ V, hf, pe, NPSHd, zMax }, [
      ["Aspiration", `V = ${n(V)} m/s ; h_asp = (λL/D+K)V²/(2g) = ${n(hf)} m`],
      ["Pression à l’entrée", `pₑ = pₐₜₘ + ρg(z₀−zₑ) − ρV²/2 − ρgh_asp = ${n(pe)} Pa abs.`],
      ["NPSH disponible", `NPSH_d = pₐₜₘ/ρg − pᵥ/ρg − Hₛ − h_asp = ${n(NPSHd)} m`],
      ["Cote max. de l’axe", `z_max = z₀ + (pₐₜₘ−pᵥ)/ρg − NPSHᵣ − marge − h_asp = ${n(zMax)} m`],
      ["Conclusion", NPSHd > d.NPSHr ? `NPSH_d > NPSHᵣ (${n(d.NPSHr)} m) : pas de cavitation.` : `NPSH_d < NPSHᵣ : risque de cavitation.`]
    ]);
  },
  waterCannon(d) {
    const A1 = circle(d.D1 / 1000), A2 = circle(d.d / 1000), p1 = d.p1 * 1e5, beta = A2 / A1;
    const V2 = Math.sqrt((2 * p1 / d.rho) / (1 - beta ** 2)), V1 = V2 * beta, Q = A2 * V2;
    const Fplate = d.rho * Q * V2, Frecoil = p1 * A1 - d.rho * Q * (V2 - V1);
    return steps({ V2, Q, Fplate, Frecoil }, [
      ["Bernoulli + continuité", `V₂² − V₁² = 2p₁/ρ et V₁ = V₂ (d/D₁)²`],
      ["Jet", `V₂ = ${n(V2)} m/s ; Q = ${n(Q)} m³/s`],
      ["Écran perpendiculaire", `F = ρQV₂ = ${n(Fplate)} N`],
      ["Recul de la lance", `F_recul = p₁A₁ − ρQ(V₂−V₁) = ${n(Frecoil)} N vers l’amont`]
    ]);
  },
  cofferdamBallast(d) {
    const W = d.W * 1000, Te = W / (d.rho * G * d.L * d.B), vol = d.L * d.B * Te;
    const KB = Te / 2, BM = (d.L * d.B ** 3 / 12) / vol, GM = KB + BM - d.zG;
    const Farch = d.rho * G * d.L * d.B * d.immerse, Wballast = Farch - W - d.Rmin * 1000;
    const Vballast = Wballast / (d.rho * G);
    return steps({ Te, GM, Vballast }, [
      ["Tirant au remorquage", `Tₑ = W/(ρgLB) = ${n(Te)} m`],
      ["Stabilité transversale", `GM = KB + BM − KG = ${n(GM)} m : ${GM > 0 ? "stable" : "instable"}`],
      ["Poussée posée", `Π = ρg L B h = ${n(Farch)} N sur h = ${n(d.immerse)} m`],
      ["Ballast", `W + W_b + R = Π ⟹ 𝒱_b = ${n(Vballast)} m³`]
    ]);
  },
  oilSeason(d) {
    const D = d.D / 1000, L = d.Lkm * 1000, Q = d.Q / 1000, V = Q / circle(D);
    const run = nu6 => {
      const nu = nu6 * 1e-6, Re = V * D / nu, f = darcyFriction(Re, 0), hf = f * (L / D) * V ** 2 / (2 * G);
      return { Re, f, hf, P: d.rho * G * Q * hf / d.eta };
    };
    const s = run(d.nuS), w = run(d.nuW);
    return steps({ ReS: s.Re, hfS: s.hf, PS: s.P, ReW: w.Re, hfW: w.hf, PW: w.P }, [
      ["Vitesse", `V = ${n(V)} m/s sur L = ${n(L)} m`],
      ["Été", `Re = ${n(s.Re)} ; λ = ${n(s.f)} ; h_f = ${n(s.hf)} m ; P_abs = ${n(s.P)} W`],
      ["Hiver (ν double)", `Re = ${n(w.Re)} ; λ = ${n(w.f)} ; h_f = ${n(w.hf)} m ; P_abs = ${n(w.P)} W`],
      ["Comparaison", w.P < s.P ? "Ici le laminaire d’hiver dissipe moins — proche de la transition, rester prudent." : "L’hiver, plus visqueux, coûte davantage en pompage."]
    ]);
  },
  retainingWall(d) {
    const F = d.rho * G * d.H ** 2 / 2, yp = d.H / 3, W = d.rhoC * G * d.t * d.Hwall;
    const Mstab = W * (d.t / 2), Mrev = F * yp, FS = Mstab / Mrev;
    return steps({ F, yp, W, Mrev, FS }, [
      ["Poussée par mètre", `F = ρgH²/2 = ${n(F)} N/m, appliquée à H/3 = ${n(yp)} m du pied`],
      ["Poids du mur", `W = ρ_c g t H_mur = ${n(W)} N/m`],
      ["Moments au pied aval", `M_stab = W·t/2 = ${n(Mstab)} N·m/m ; M_renv = F·H/3 = ${n(Mrev)} N·m/m`],
      ["Sécurité au renversement", `FS = M_stab/M_renv = ${n(FS)}`]
    ]);
  },
  gravityValve(d) {
    const D = d.D / 1000, eps = d.eps / 1000, nu = d.nu * 1e-6;
    const iterate = Ksum => {
      let V = Math.sqrt(2 * G * d.H / (0.02 * d.L / D + Ksum)), f = 0.02, Re = 0;
      for (let i = 0; i < 16; i++) {
        Re = V * D / nu;
        f = darcyFriction(Re, eps / D);
        V = Math.sqrt(2 * G * d.H / (f * d.L / D + Ksum));
      }
      return { V, f, Re, Q: circle(D) * V * 1000 };
    };
    const full = iterate(d.Kother + d.Kv0);
    const V2 = full.V / 2, Re2 = V2 * D / nu, f2 = darcyFriction(Re2, eps / D);
    const Kvalve = 2 * G * d.H / V2 ** 2 - f2 * d.L / D - d.Kother;
    return steps({ V: full.V, Q: full.Q, Kvalve }, [
      ["Bernoulli", `H = (λL/D + ΣK) V²/(2g)`],
      ["Ouverture actuelle", `V = ${n(full.V)} m/s ; Q = ${n(full.Q)} L/s ; λ = ${n(full.f)}`],
      ["Demi-débit", `V' = V/2 = ${n(V2)} m/s ; λ' = ${n(f2)}`],
      ["K vanne requis", `Kᵥ = 2gH/V'² − λ'L/D − K_autres = ${n(Kvalve)}`]
    ]);
  },
  viscosityForce(d) {
    const e = d.e / 1000, tau = d.mu * d.U / e, F = tau * d.A, P = F * d.U;
    return steps({ tau, F, P }, [
      ["Gradient", `du/dy = U/e = ${n(d.U / e)} s⁻¹`],
      ["Loi de Newton", `τ = μU/e = ${n(tau)} Pa`],
      ["Force de traction", `F = τA = ${n(F)} N`],
      ["Puissance dissipée", `P = FU = ${n(P)} W`]
    ]);
  },
  bearingLoss(d) {
    const R = d.d / 2000, e = d.gap / 1000, L = d.L / 1000, omega = 2 * Math.PI * d.rpm / 60;
    const U = omega * R, tau = d.mu * U / e, C = tau * (2 * Math.PI * R * L) * R, P = C * omega;
    return steps({ C, P }, [
      ["Cinématique", `ω = ${n(omega)} rad/s ; U = ωR = ${n(U)} m/s`],
      ["Couette du jeu", `τ = μU/e = ${n(tau)} Pa`],
      ["Couple", `C = τ(2πRL)R = ${n(C)} N·m`],
      ["Puissance dissipée", `P = Cω = ${n(P)} W`]
    ]);
  },
  pressureUnits(d) {
    const pBar = d.bar * 1e5, hBar = pBar / (1000 * G);
    const pHg = (d.mmHg / 1000) * 13600 * G, hHg = pHg / (1000 * G);
    const pPsi = d.psi * 6894.757, hPsi = pPsi / (1000 * G);
    return steps({ pBar, hBar, pHg, hHg, pPsi, hPsi }, [
      ["Bar", `${n(d.bar)} bar = ${n(pBar)} Pa = ${n(hBar)} mCE`],
      ["Mercure", `${n(d.mmHg)} mmHg = ${n(pHg)} Pa = ${n(hHg)} mCE`],
      ["PSI", `${n(d.psi)} psi = ${n(pPsi)} Pa = ${n(hPsi)} mCE`]
    ]);
  },
  pipeGage(d) {
    const p = (d.rhoM * d.hHg - d.rho * d.z) * G;
    return steps({ p }, [
      ["Cheminement", "Du centre : on descend dans l’eau jusqu’au ménisque bas, puis on remonte dans le mercure jusqu’à l’atmosphère."],
      ["Pression relative", `p = (ρₘ Δh − ρ z) g = ${n(p)} Pa`]
    ]);
  },
  woodLog(d) {
    const V = circle(d.D) * d.L, mass = d.s * 1000 * V, Vimm = d.s * V;
    return steps({ Vimm, mass }, [
      ["Volume du tronc", `𝒱 = πD²L/4 = ${n(V)} m³`],
      ["Flottaison", `𝒱_imm / 𝒱 = d = ${n(d.s)} ⟹ 𝒱_imm = ${n(Vimm)} m³`],
      ["Masse", `m = d ρeau 𝒱 = ${n(mass)} kg`]
    ]);
  },
  iceberg(d) {
    const emerge = (1 - d.rhoI / d.rhoW) * 100;
    return steps({ emerge }, [
      ["Archimède", "Le poids égale la poussée : ρᵢ 𝒱 g = ρₑ 𝒱_imm g"],
      ["Fraction immergée", `𝒱_imm/𝒱 = ρᵢ/ρₑ = ${n(d.rhoI / d.rhoW)}`],
      ["Fraction émergée", `1 − ρᵢ/ρₑ = ${n(emerge)} %`]
    ]);
  },
  channelDischarge(d) {
    const Q = d.b * d.y * d.V, Qh = Q * 3600;
    return steps({ Q, Qh }, [
      ["Section mouillée", `A = by = ${n(d.b * d.y)} m²`],
      ["Débit", `Q = AV = ${n(Q)} m³/s = ${n(Qh)} m³/h`]
    ]);
  },
  pitotWater(d) {
    const h = d.h / 1000, V = Math.sqrt(2 * G * h);
    return steps({ V }, [
      ["Hauteur dynamique", `h = V²/2g = ${n(h)} mCE`],
      ["Vitesse locale", `V = √(2gh) = ${n(V)} m/s`]
    ]);
  },
  turbinePower(d) {
    const P = d.eta * d.rho * G * d.Q * d.H;
    return steps({ P }, [
      ["Puissance hydraulique", `Pₕ = ρgQH = ${n(d.rho * G * d.Q * d.H)} W`],
      ["Puissance électrique", `P = η Pₕ = ${n(P)} W`]
    ]);
  },
  momentumHold(d) {
    const Q = d.Q / 1000, F = d.rho * Q * d.V;
    return steps({ F }, [
      ["Débit massique", `ṁ = ρQ = ${n(d.rho * Q)} kg/s`],
      ["Réaction", `F = ρQV = ${n(F)} N`]
    ]);
  },
  froudeForceTime(d) {
    const tp = d.tm * Math.sqrt(d.N), Fp = d.Fm * d.N ** 3;
    return steps({ tp, Fp }, [
      ["Échelles de Froude", `λt = √N ; λF = N³ (même fluide)`],
      ["Période prototype", `tₚ = tₘ√N = ${n(tp)} s`],
      ["Force prototype", `Fₚ = Fₘ N³ = ${n(Fp)} N`]
    ]);
  },
  froudeScale(d) {
    const velocityScale = Math.sqrt(d.N), Qm = d.Qp / d.N ** 2.5;
    return steps({ velocityScale, Qm }, [
      ["Échelle des vitesses", `λV = √N = ${n(velocityScale)}`],
      ["Échelle des débits", `λQ = N^(5/2) = ${n(d.N ** 2.5)}`],
      ["Débit modèle", `Qₘ = Qₚ/λQ = ${n(Qm)} m³/s`]
    ]);
  },
  reynoldsSpeed(d) {
    const Vp = d.Vm / d.N;
    return steps({ Vp }, [
      ["Similitude de Reynolds, même fluide", "Vₘ Lₘ = Vₚ Lₚ"],
      ["Vitesse prototype", `Vₚ = Vₘ/N = ${n(Vp)} m/s`]
    ]);
  },
  idealGasTwo(d) {
    const T1 = d.temp1 + 273.15, T2 = d.temp2 + 273.15;
    const p1 = d.p1 * 1e5, p2 = d.p2 * 1e5;
    const rho1 = p1 / (d.R * T1), rho2 = p2 / (d.R * T2);
    return steps({ rho1, rho2 }, [
      ["État 1", `T₁ = ${n(T1)} K ; p₁ = ${n(p1)} Pa ; ρ₁ = p₁/(RT₁) = ${n(rho1)} kg/m³`],
      ["État 2", `T₂ = ${n(T2)} K ; p₂ = ${n(p2)} Pa ; ρ₂ = p₂/(RT₂) = ${n(rho2)} kg/m³`]
    ]);
  },
  reynoldsTwo(d) {
    const Re1 = d.V1 * (d.D1 / 1000) / (d.nu1 * 1e-6);
    const Re2 = d.V2 * (d.D2 / 1000) / (d.nu2 * 1e-6);
    return steps({ Re1, Re2 }, [
      ["Cas 1", `Re₁ = V₁D₁/ν₁ = ${n(Re1)}`],
      ["Cas 2", `Re₂ = V₂D₂/ν₂ = ${n(Re2)}`],
      ["Régimes", `${Re1 < 2000 ? "1 laminaire" : Re1 < 4000 ? "1 transition" : "1 turbulent"} ; ${Re2 < 2000 ? "2 laminaire" : Re2 < 4000 ? "2 transition" : "2 turbulent"}`]
    ]);
  },
  kinematicField(d) {
    const div = 0, rot = -2 * d.k * d.y;
    return steps({ div, rot }, [
      ["Champ", `u = ${n(d.k)} x² ; v = −${n(2 * d.k)} x y`],
      ["Incompressibilité", `div V⃗ = ∂u/∂x + ∂v/∂y = 2kx − 2kx = ${n(div)}`],
      ["Rotationnel", `ω_z = ∂v/∂x − ∂u/∂y = −2k y = ${n(rot)} au point y = ${n(d.y)} m`],
      ["Lecture", "div = 0 partout ; irrotationnel seulement sur y = 0."]
    ]);
  },
  dimensionsMLT(d) {
    return steps({
      pM: 1, pL: 2, pT: -3, cM: 1, cL: 2, cT: -2, sM: 1, sL: -1, sT: -2,
      mM: 1, mL: 0, mT: -1, tM: 1, tL: 0, tT: -2, gM: 1, gL: -2, gT: -2
    }, [
      ["Rappel", "Toute grandeur mécanique s’écrit Mᵅ Lᵝ Tᵞ. On lit le tableau du cours §7.1."],
      ["Puissance", "P = F V → M L² T⁻³"],
      ["Couple", "C = F ℓ → M L² T⁻²"],
      ["Contrainte", "σ = F/A → M L⁻¹ T⁻²"],
      ["Débit massique", "ṁ = ρ Q → M T⁻¹"],
      ["Tension superficielle", "σ = F/ℓ → M T⁻²"],
      ["Gradient de pression", "dp/dx → M L⁻² T⁻²"]
    ]);
  },
  pendulumPi(d) {
    return steps({ a: 0.5, b: -0.5, c: 0 }, [
      ["Grandeurs", "T = k Lᵃ gᵇ mᶜ ; dimensions M, L, T."],
      ["Équation aux dimensions", "[T] = T = Lᵃ (L T⁻²)ᵇ Mᶜ"],
      ["Identification", "c = 0 (la masse n’apparaît pas) ; a + b = 0 ; −2b = 1"],
      ["Exposants", `a = ${n(0.5)} ; b = ${n(-0.5)} ; c = 0 ⟹ T ∝ √(L/g)`]
    ]);
  },
  propellerPi(d) {
    return steps({ a: 1, b: 3, c: 5 }, [
      ["Grandeurs", "P = k ρᵃ nᵇ Dᶜ"],
      ["Dimensions", "M L² T⁻³ = (M L⁻³)ᵃ (T⁻¹)ᵇ Lᶜ"],
      ["Identification", "a = 1 ; −3a + c = 2 ; −b = −3"],
      ["Forme", `P = ρ n³ D⁵ f(…) ; a = 1, b = 3, c = 5`]
    ]);
  },
  inclinedCircularGate(d) {
    const area = Math.PI * d.D ** 2 / 4, ig = Math.PI * d.D ** 4 / 64;
    const force = d.rho * G * area * d.hG;
    const yG = d.hG / Math.sin(d.alpha * Math.PI / 180);
    const dy = ig / (yG * area);
    return steps({ area, force, yG, dy }, [
      ["Aire", `A = πD²/4 = ${n(area)} m²`],
      ["Poussée", `F = ρg A h_G = ${n(force)} N`],
      ["Abscisse sur la paroi", `y_G = h_G / sin α = ${n(yG)} m`],
      ["Écart centre de poussée", `y_C − y_G = Iᴳ/(y_G A) = ${n(dy)} m`]
    ]);
  },
  quarterCylinder(d) {
    const FH = 0.5 * d.rho * G * d.R ** 2 * d.b;
    const volume = d.R ** 2 * (1 - Math.PI / 4) * d.b;
    const FV = d.rho * G * volume;
    const F = Math.hypot(FH, FV);
    const beta = Math.atan2(FV, FH) * 180 / Math.PI;
    return steps({ FH, FV, F, beta }, [
      ["Composante horizontale", `F_H = ½ ρg R² b = ${n(FH)} N (projection verticale R×b)`],
      ["Volume au-dessus de la vanne", `𝒱 = R²(1 − π/4)b = ${n(volume)} m³`],
      ["Composante verticale", `F_V = ρg𝒱 = ${n(FV)} N vers le bas`],
      ["Résultante", `F = √(F_H² + F_V²) = ${n(F)} N ; β = arctan(F_V/F_H) = ${n(beta)}°`]
    ]);
  },
  archimedesCaisson(d) {
    const P = d.rhoB * G * d.volBlock, FA = 1000 * G * d.volBlock, T = P - FA;
    const FAmax = d.rho * G * d.L * d.B * d.Hbox;
    const Te = d.W * 1000 / (d.rho * G * d.L * d.B);
    const freeboard = d.Hbox - Te;
    return steps({ T, FAmax, Te, freeboard }, [
      ["Bloc immergé", `T = (ρ_béton − ρ_eau) g 𝒱 = ${n(T)} N`],
      ["Poussée maximale du caisson", `F_A,max = ρ g L B H = ${n(FAmax)} N`],
      ["Tirant d’eau", `Tₑ = W /(ρ g L B) = ${n(Te)} m`],
      ["Franc-bord", `H − Tₑ = ${n(freeboard)} m`]
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
