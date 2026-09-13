import { G, darcyFriction } from './solvers.js';

export function defaultInstallation() {
  return { version: 1, name: 'Adduction entre deux réservoirs', mode: 'head', flow: 10,
    zA: 0, zB: 20, rho: 998, nu: 1.004, efficiency: 0.75, pump: true, h0: 45, k: 0.06,
    sections: [
      { name: 'Aspiration', length: 6, diameter: 150, roughness: 0.05, accessories: [{ name: 'Entrée (exemple)', count: 1, k: 0.5 }] },
      { name: 'Refoulement', length: 200, diameter: 100, roughness: 0.05, accessories: [{ name: 'Coude (exemple)', count: 2, k: 0.5 }, { name: 'Sortie vers réservoir', count: 1, k: 1 }] }
    ] };
}

export function validateInstallation(p) {
  if (!p || p.version !== 1 || !['head', 'flow'].includes(p.mode)) throw Error('Format du projet non reconnu.');
  if (typeof p.name !== 'string' || p.name.length > 120 || typeof p.pump !== 'boolean') throw Error('Nom ou option de pompe invalide.');
  const finite = (v, label, min, max) => { if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) throw Error(`${label} : valeur attendue entre ${min} et ${max}.`); };
  finite(p.zA, 'Cote amont', -10000, 10000); finite(p.zB, 'Cote aval', -10000, 10000);
  finite(p.flow, 'Débit (L/s)', 0, 100000); finite(p.rho, 'Masse volumique', 0.01, 30000);
  finite(p.nu, 'Viscosité cinématique (10⁻⁶ m²/s)', 0.001, 1000000);
  finite(p.efficiency, 'Rendement', 0.01, 1); finite(p.h0, 'Hauteur à débit nul', 0, 10000); finite(p.k, 'Coefficient de pompe', 0.000001, 10000);
  if (!Array.isArray(p.sections) || !p.sections.length || p.sections.length > 30) throw Error('Le projet doit comporter 1 à 30 tronçons.');
  p.sections.forEach((s, i) => {
    if (typeof s.name !== 'string' || s.name.length > 80) throw Error(`Nom du tronçon ${i + 1} invalide.`);
    finite(s.length, `Longueur T${i + 1}`, 0.001, 100000); finite(s.diameter, `Diamètre intérieur T${i + 1} (mm)`, 1, 20000);
    finite(s.roughness, `Rugosité T${i + 1} (mm)`, 0, s.diameter * 0.05);
    if (!Array.isArray(s.accessories) || s.accessories.length > 50) throw Error('Maximum 50 accessoires par tronçon.');
    s.accessories.forEach(a => {
      if (typeof a.name !== 'string' || a.name.length > 80) throw Error('Nom d’accessoire invalide.');
      finite(a.count, 'Nombre d’accessoires', 0, 1000); if (!Number.isInteger(a.count)) throw Error('Le nombre d’accessoires doit être entier.');
      finite(a.k, 'Coefficient K', 0, 100000);
    });
  });
  return p;
}

// Positive flow is from A to B. SI internally; the UI and pump curve use L/s.
export function installationLosses(p, flow) {
  const Q = flow / 1000, nu = p.nu * 1e-6;
  const rows = p.sections.map(s => {
    const D = s.diameter / 1000, V = Q / (Math.PI * D * D / 4), Re = V * D / nu;
    const lambda = flow === 0 ? 0 : darcyFriction(Re, s.roughness / s.diameter);
    const regular = lambda * s.length / D * V * V / (2 * G);
    const accessories = s.accessories.map(a => ({ ...a, loss: a.count * a.k * V * V / (2 * G) }));
    const singular = accessories.reduce((sum, a) => sum + a.loss, 0);
    return { name: s.name, V, Re, lambda, regular, singular, total: regular + singular, accessories };
  });
  const regular = rows.reduce((sum, r) => sum + r.regular, 0), singular = rows.reduce((sum, r) => sum + r.singular, 0);
  return { rows, regular, singular, total: regular + singular };
}

export const pumpHead = (p, flow) => p.h0 - p.k * flow * flow;

export function solveInstallation(p) {
  validateInstallation(p);
  const staticHead = p.zB - p.zA, warnings = [];
  let flow = p.flow, residual = null, converged = true;
  if (p.mode === 'flow') {
    const residualAt = q => (p.pump ? pumpHead(p, q) : 0) - staticHead - installationLosses(p, q).total;
    if (residualAt(0) <= 0) {
      flow = 0; converged = false;
      warnings.push('Aucun débit positif de A vers B : la charge motrice est insuffisante. Un éventuel écoulement inverse n’est pas modélisé.');
    } else {
      let lo = 0, hi = p.pump ? Math.sqrt(p.h0 / p.k) : 1;
      if (!p.pump) while (residualAt(hi) > 0 && hi < 1000000) hi *= 2;
      if (residualAt(hi) > 0) throw Error('Impossible d’encadrer le débit dans le domaine de calcul.');
      for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; if (residualAt(mid) > 0) lo = mid; else hi = mid; }
      flow = (lo + hi) / 2; residual = residualAt(flow); converged = Math.abs(residual) < 1e-5;
      if (!converged) warnings.push('Bilan non convergé au seuil de 10⁻⁵ m, notamment possible près de la transition laminaire/turbulent.');
    }
  }
  const losses = installationLosses(p, flow), requiredHead = staticHead + losses.total;
  const dutyHead = p.mode === 'flow' && p.pump ? pumpHead(p, flow) : Math.max(0, requiredHead);
  const hydraulicPower = p.rho * G * flow / 1000 * dutyHead / 1000;
  if (p.mode === 'head' && requiredHead < 0) warnings.push('La gravité fournit plus de charge que nécessaire à ce débit : une régulation ou une récupération d’énergie est nécessaire.');
  if (p.mode === 'head' && !p.pump && requiredHead > 1e-5) warnings.push('La gravité seule ne peut pas fournir le débit imposé. La hauteur supplémentaire indiquée est nécessaire.');
  if (p.mode === 'head' && p.pump && Math.abs(pumpHead(p, flow) - requiredHead) > 0.01) warnings.push('Le débit imposé n’est pas le point de fonctionnement de la pompe saisie. Passez en « Débit obtenu » pour calculer l’intersection.');
  losses.rows.forEach((r, i) => {
    if (r.Re >= 2000 && r.Re < 4000) warnings.push(`T${i + 1} : régime de transition (Re ${Math.round(r.Re)}), perte de charge indicative.`);
    if (r.V > 3) warnings.push(`T${i + 1} : vitesse supérieure à 3 m/s ; vérifier le choix du diamètre et les transitoires.`);
  });
  if (!Object.values({ flow, requiredHead, hydraulicPower, total: losses.total }).every(Number.isFinite)) throw Error('Résultat non fini : vérifier les données.');
  return { flow, staticHead, requiredHead, dutyHead, hydraulicPower, shaftPower: hydraulicPower / p.efficiency, losses, warnings, residual, converged };
}
