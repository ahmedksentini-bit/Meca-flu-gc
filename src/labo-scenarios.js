// Laboratoire virtuel : expériences guidées des chapitres 1 et 2. Chaque
// scénario reproduit une situation du cours (exercice résolu ou paragraphe) ;
// les valeurs attendues figurent dans la consigne et sont vérifiées par les tests.
import { sceneVide, couchesDepuisHauteurs, contexte, calerGaz } from './labo-physique.js';

function reservoir(id, o) {
  const r = { id, type: 'reservoir', nom: o.nom || '', x: o.x || 0, z: o.z || 0, w: o.w || 1.5, H: o.H || 3, b: o.b || 1,
    alpha: o.alpha || 90, ferme: !!o.ferme, diagramme: o.diagramme || 'aucune',
    constant: !!o.constant, aspect: o.aspect || 'liquide',
    ciel: { mode: o.mode || 'impose', p: o.p || 0, n: 0 }, couches: [] };
  r.couches = couchesDepuisHauteurs(r, o.couches || []);
  if (r.constant) r.hc = (o.couches || []).reduce((t, c) => t + c.h, 0);
  return r;
}
const caisson = (id, o) => ({ id, type: 'flotteur', reservoir: o.reservoir, x: o.x, l: o.l, h: o.h, b: o.b, m: o.m, zG: o.zG, gite: 0,
  creux: true, e: o.e ?? 0.03, ballast: o.ballast || 0, ballastFluide: o.ballastFluide || 'eau' });
const piezo = (id, el, port, Ht, o = {}) => ({ id, type: 'piezometre', piquage: { el, port }, Ht, d: o.d ?? 12, ox: o.ox ?? 0.35 });
const mano = (id, el, port, o = {}) => ({ id, type: 'manometre', piquage: { el, port }, mode: o.mode || 'relatif', ox: o.ox ?? 0.35 });
const tubeU = (id, el, port, fluideM, o = {}) => ({ id, type: 'tubeU', piquage: { el, port }, piquage2: o.b || null, fluideM, L: o.L ?? 1, ox: o.ox ?? 0.6, oz: o.oz ?? -0.6 });
const conduite = (id, a, b, o = {}) => ({ id, type: 'conduite', a, b, zr: o.zr ?? null, D: o.D ?? 0.1 });

const fabriques = {
  vases(s) {
    s.elements.push(
      reservoir('R1', { nom: 'Château d’eau', x: 0, w: 1.2, H: 4, couches: [{ fluide: 'eau', h: 3.5 }] }),
      reservoir('R2', { nom: 'Bassin', x: 3.4, w: 2.4, H: 3, couches: [{ fluide: 'eau', h: 0.75 }] }),
      conduite('C1', { el: 'R1', port: 'f:0.60' }, { el: 'R2', port: 'f:0.60' }, { zr: -0.6 }),
      { id: 'V1', type: 'vanne', conduite: 'C1', t: 0.55, ouverte: false },
      piezo('P1', 'C1', 't:0.35', 4.4),
      piezo('P2', 'C1', 't:0.65', 4.4),
      mano('M1', 'R1', 'g:0.25'));
  },
  piezometres(s) {
    s.elements.push(
      reservoir('R1', { nom: 'Réservoir', x: 0, w: 2, H: 3.5, couches: [{ fluide: 'eau', h: 2.5 }] }),
      piezo('P1', 'R1', 'd:0.50', 3, { ox: 0.35 }),
      piezo('P2', 'R1', 'd:1.50', 2, { ox: 0.8 }),
      piezo('P3', 'R1', 'd:2.25', 1.25, { ox: 1.25 }),
      mano('M1', 'R1', 'g:0.25'), mano('M2', 'R1', 'g:1.50'));
  },
  bicouche(s) {
    s.elements.push(
      reservoir('R1', { nom: 'Bac huile sur eau', x: 0, w: 2, H: 5.5, diagramme: 'g', couches: [{ fluide: 'eau', h: 3 }, { fluide: 'huile', h: 2 }] }),
      piezo('P1', 'R1', 'd:1.00', 4.5, { ox: 0.35 }),
      piezo('P2', 'R1', 'd:4.00', 1.75, { ox: 0.85 }),
      mano('M1', 'R1', 'f:1.00'));
  },
  pressurise(s) {
    s.elements.push(
      reservoir('R1', { nom: 'Cuve pressurisée', x: 0, w: 2, H: 3, ferme: true, p: 20000, couches: [{ fluide: 'eau', h: 2 }] }),
      piezo('P1', 'R1', 'd:0.50', 4.25),
      mano('M1', 'R1', 'h:1.50'),
      mano('M2', 'R1', 'f:1.00'),
      tubeU('U1', 'R1', 'g:1.00', 'mercure', { ox: -0.7, oz: -0.7 }));
  },
  'tube-u'(s) {
    s.elements.push(
      reservoir('R1', { nom: 'Enceinte', x: 0, w: 1.6, H: 2.5, ferme: true, p: 5000, couches: [{ fluide: 'eau', h: 1.5 }] }),
      tubeU('U1', 'R1', 'd:0.50', 'mercure', { ox: 0.6, oz: -0.6 }),
      tubeU('U2', 'R1', 'g:0.50', 'tetra', { ox: -0.6, oz: -0.2, L: 2 }),
      mano('M1', 'R1', 'h:1.20'));
  },
  differentiel(s) {
    const pA = 40000, pB = pA - 27664;
    s.elements.push(
      reservoir('RA', { nom: 'Conduite A', x: 0, w: 1.2, H: 2, ferme: true, p: pA - 9810 * 0.5, couches: [{ fluide: 'eau', h: 1.5 }] }),
      reservoir('RB', { nom: 'Conduite B', x: 2.6, w: 1.2, H: 2, ferme: true, p: pB - 9810 * 0.2, couches: [{ fluide: 'eau', h: 1.5 }] }),
      tubeU('U1', 'RA', 'd:1.00', 'mercure', { b: { el: 'RB', port: 'g:1.30' }, ox: 0.6, oz: -0.5 }),
      mano('M1', 'RA', 'h:0.90'), mano('M2', 'RB', 'h:0.90'));
  },
  'deux-liquides'(s) {
    s.elements.push(
      reservoir('R1', { nom: 'Eau', x: 0, w: 1, H: 3, couches: [{ fluide: 'eau', h: 2 }] }),
      reservoir('R2', { nom: 'Huile', x: 2.4, w: 1, H: 3, couches: [{ fluide: 'huile', h: 2 }] }),
      conduite('C1', { el: 'R1', port: 'f:0.50' }, { el: 'R2', port: 'f:0.50' }, { zr: -0.5 }),
      { id: 'V1', type: 'vanne', conduite: 'C1', t: 0.5, ouverte: false },
      mano('M1', 'R1', 'g:0.25'), mano('M2', 'R2', 'd:0.25'));
  },
  pascal(s) {
    s.elements.push(
      reservoir('R1', { nom: 'Évasé', x: 0, w: 1, H: 3, alpha: 55, couches: [{ fluide: 'eau', h: 2 }] }),
      reservoir('R2', { nom: 'Droit', x: 3.6, w: 0.6, H: 3, couches: [{ fluide: 'eau', h: 2 }] }),
      reservoir('R3', { nom: 'En surplomb', x: 5.4, w: 2.6, H: 3, alpha: 115, couches: [{ fluide: 'eau', h: 2 }] }),
      conduite('C1', { el: 'R1', port: 'f:0.50' }, { el: 'R2', port: 'f:0.30' }, { zr: -0.5 }),
      conduite('C2', { el: 'R2', port: 'f:0.15' }, { el: 'R3', port: 'f:0.50' }, { zr: -0.8 }),
      mano('M1', 'R1', 'g:0.25'), mano('M2', 'R2', 'g:0.25', { ox: 0.3 }), mano('M3', 'R3', 'g:0.25', { ox: 0.3 }));
  },
  'vanne-verticale'(s) {
    s.elements.push(
      reservoir('R1', { nom: 'Canal (largeur 2,50 m)', x: 0, w: 3, H: 4, b: 2.5, couches: [{ fluide: 'eau', h: 3 }] }),
      { id: 'VP1', type: 'vannePlane', reservoir: 'R1', paroi: 'd', s: 0.9, forme: 'rect', a: 1.8, l: 2.5, charniere: 'haut' });
  },
  mur(s) {
    s.elements.push(reservoir('R1', { nom: 'Réservoir (tranche de 1 m)', x: 0, w: 2.5, H: 4, b: 1, diagramme: 'd', couches: [{ fluide: 'eau', h: 3.5 }] }));
  },
  'vanne-inclinee'(s) {
    s.elements.push(
      reservoir('R1', { nom: 'Bassin à paroi inclinée', x: 0, w: 2.5, H: 4.5, b: 3, alpha: 60, couches: [{ fluide: 'eau', h: 3.5 }] }),
      { id: 'VP1', type: 'vannePlane', reservoir: 'R1', paroi: 'd', s: 1.1 / Math.sin(Math.PI / 3), forme: 'cercle', a: 1.2, l: 1.2, charniere: 'aucune' });
  },
  caisson(s) {
    s.elements.push(
      reservoir('R1', { nom: 'Darse (eau de mer)', x: 0, w: 10, H: 4.5, b: 8, couches: [{ fluide: 'mer', h: 3.5 }] }),
      { id: 'F1', type: 'flotteur', reservoir: 'R1', x: 6.2, l: 4, h: 3, b: 6, m: 500000 / 9.81, zG: 1.4, gite: 0 },
      { id: 'F2', type: 'flotteur', reservoir: 'R1', x: 1.6, l: 1, h: 0.8, b: 1, m: 1920, zG: 0.4, gite: 0 });
  },
  capillarite(s) {
    s.elements.push(
      reservoir('R1', { nom: 'Eau', x: 0, w: 1.4, H: 2, couches: [{ fluide: 'eau', h: 1.25 }] }),
      piezo('P1', 'R1', 'd:0.50', 1.5, { d: 2, ox: 0.35 }),
      piezo('P2', 'R1', 'd:0.50', 1.5, { d: 5, ox: 0.85 }),
      piezo('P3', 'R1', 'd:0.50', 1.5, { d: 15, ox: 1.35 }),
      reservoir('R2', { nom: 'Mercure', x: 4.2, w: 1, H: 1, couches: [{ fluide: 'mercure', h: 0.5 }] }),
      piezo('P4', 'R2', 'd:0.25', 0.75, { d: 2, ox: 0.35 }),
      piezo('P5', 'R2', 'd:0.25', 0.75, { d: 15, ox: 0.85 }));
  },
  'vanne-chasse'(s) {
    s.elements.push(
      reservoir('R1', { nom: 'Retenue du barrage', x: 0, w: 5, H: 13, b: 1.5, couches: [{ fluide: 'eau', h: 12 }] }),
      { id: 'VP1', type: 'vannePlane', reservoir: 'R1', paroi: 'd', s: 0.5, forme: 'rect', a: 1, l: 1.5, charniere: 'glissieres', f: 0.25, poids: 8000 },
      mano('M1', 'R1', 'd:3.00', { ox: 0.5 }));
  },
  batardeau(s) {
    s.elements.push(
      reservoir('R1', { nom: 'Mer (niveau constant)', x: 0, z: -3.6, w: 14, H: 5, b: 16, constant: true, couches: [{ fluide: 'mer', h: 3.6 }] }),
      caisson('F1', { reservoir: 'R1', x: 7, l: 5, h: 4, b: 12, m: 720000 / 9.81, zG: 1.8, e: 0.03, ballastFluide: 'mer' }));
  },
  nappe(s) {
    s.elements.push(
      reservoir('R1', { nom: 'Terrain, nappe phréatique', x: 0, z: -4.5, w: 12, H: 4.5, b: 12, constant: true, aspect: 'sol', couches: [{ fluide: 'eau', h: 2 }] }),
      caisson('F1', { reservoir: 'R1', x: 6, l: 6, h: 4, b: 10, m: 2500 * (6 * 10 * 4 - 5.4 * 9.4 * 3.4), zG: 1.75, e: 0.3 }),
      piezo('P1', 'R1', 'g:0.50', 5, { ox: 0.5 }));
  },
  cavitation(s) {
    s.elements.push(
      reservoir('R1', { nom: 'Cuve sous vide', x: 0, w: 1.6, H: 2.5, ferme: true, p: -60000, couches: [{ fluide: 'essence', h: 1.5 }] }),
      mano('M1', 'R1', 'h:0.80', { mode: 'absolu' }),
      mano('M2', 'R1', 'g:0.25', { mode: 'relatif' }),
      tubeU('U1', 'R1', 'd:1.75', 'mercure', { ox: 0.6, oz: -1.1, L: 1.4 }),
      piezo('P1', 'R1', 'g:1.00', 1.5, { ox: 0.9 }));
  }
};

export const SCENARIOS = [
  { id: 'vases', titre: 'Vases communicants', ref: '§ 2.2.2', ancre: 's-cas-du-liquide-incompressible',
    consigne: 'Ouvrez la vanne V1 (clic) : le liquide passe du château d’eau au bassin jusqu’à l’égalité des surfaces libres. Le volume se conserve : le niveau commun vaut Σ(hᵢSᵢ)/ΣSᵢ. Les piézomètres de la conduite suivent la charge.' },
  { id: 'piezometres', titre: 'Piézomètres et charge piézométrique', ref: '§ 2.2 – 2.3', ancre: 's-piézomètre',
    consigne: 'Les trois piézomètres affleurent la surface libre : z + p/ρg est constant dans un liquide au repos. Faites glisser la surface libre du réservoir et observez les colonnes et les manomètres.' },
  { id: 'bicouche', titre: 'Ex. 2.1 — Huile sur eau', ref: 'Ex. 2.1', ancre: 's-exercice-2.1-pressions-dans-un-réservoir',
    consigne: 'Pression à l’interface : 16,7 kPa ; au fond : 46,1 kPa = 4,70 mCE. Le piézomètre branché dans l’eau s’arrête 30 cm sous la surface de l’huile ; le diagramme des pressions sur la paroi gauche présente un coude à l’interface.' },
  { id: 'pressurise', titre: 'Réservoir fermé sous pression', ref: '§ 2.1.3 – 2.3', ancre: 's-pression-absolue-pression-relative',
    consigne: 'Le ciel gazeux à 20 kPa relève toutes les pressions : le piézomètre monte de p₀/ρg = 2,04 m au-dessus de la surface. Passez l’affichage en pression absolue, ou réglez p₀ négatif (dépression).' },
  { id: 'tube-u', titre: 'Manomètres en U', ref: '§ 2.3.3', ancre: 's-manomètre-en-u',
    consigne: 'Même pression mesurée par deux tubes en U : le mercure (d = 13,6) donne une petite dénivellation, le tétrachlorure (d = 1,59) l’amplifie. Sélectionnez un tube pour suivre le calcul de proche en proche.' },
  { id: 'differentiel', titre: 'Ex. 2.2 — Manomètre différentiel', ref: 'Ex. 2.2', ancre: 's-exercice-2.2-manomètre-différentiel-au-mercure',
    consigne: 'B est 30 cm plus haut que A ; le mercure se dénivelle de 20 cm, le ménisque côté A est 60 cm sous A : pA − pB = 27,7 kPa. Modifiez les pressions des deux enceintes pour voir Δh changer.' },
  { id: 'deux-liquides', titre: 'Deux liquides non miscibles', ref: '§ 1.3 – 2.2', ancre: 's-densité',
    consigne: 'Ouvrez la vanne : l’eau, plus dense, passe sous l’huile. À l’équilibre, la pression est la même au fond des deux branches et les colonnes au-dessus de l’interface sont en raison inverse des densités.' },
  { id: 'pascal', titre: 'Paradoxe de l’hydrostatique', ref: '§ 2.2.2', ancre: 's-cas-du-liquide-incompressible',
    consigne: 'Trois récipients de formes différentes, reliés par le fond : même surface libre, même pression au fond (lisez les manomètres), quelle que soit la quantité de liquide au-dessus.' },
  { id: 'vanne-verticale', titre: 'Ex. 2.4 — Vanne rectangulaire verticale', ref: 'Ex. 2.4', ancre: 's-exercice-2.4-poussée-sur-une-vanne-rectangulaire-verticale',
    consigne: 'Vanne 2,50 × 1,80 m, arête supérieure à 1,20 m sous la surface : F = 92,7 kN, centre de poussée 12,9 cm sous G. Faites glisser la vanne le long de la paroi : C se rapproche de G en profondeur.' },
  { id: 'mur', titre: 'Ex. 2.5 — Mur de réservoir', ref: 'Ex. 2.5', ancre: 's-exercice-2.5-mur-de-réservoir-diagramme-des-pressions',
    consigne: 'Diagramme triangulaire : F = ½ρgbH² = 60,1 kN à H/3 = 1,17 m du pied, moment de renversement 70,1 kN·m. Faites varier le niveau : le moment croît comme H³.' },
  { id: 'vanne-inclinee', titre: 'Ex. 2.6 — Vanne circulaire inclinée', ref: 'Ex. 2.6', ancre: 's-exercice-2.6-vanne-circulaire-inclinée',
    consigne: 'Paroi à 60°, D = 1,20 m, centre à 2,40 m sous la surface : F = 26,6 kN, C à 3,25 cm sous G le long de la paroi. La paroi évasée porte de l’eau : F a une composante verticale vers le bas.' },
  { id: 'caisson', titre: 'Ex. 2.8 – 2.9 — Caisson flottant', ref: 'Ex. 2.8 – 2.9', ancre: 's-exercice-2.9-stabilité-dun-caisson-flottant',
    consigne: 'Caisson 6 × 4 × 3 m de 500 kN : tirant d’eau 2,07 m, GM = 0,28 m (stable). Montez son centre de gravité ou inclinez-le (gîte) pour voir le couple changer de signe. Le bloc de béton (d = 2,4) repose au fond.' },
  { id: 'capillarite', titre: 'Capillarité des tubes piézométriques', ref: '§ 1.6.2', ancre: 's-capillarité-loi-de-jurin',
    consigne: 'Loi de Jurin h = 4σ cos θ/(ρ g d) : dans l’eau, les tubes fins lisent trop haut ; dans le mercure (θ = 130°), trop bas. D’où la règle d ≥ 10 mm pour les piézomètres.' },
  { id: 'vanne-chasse', titre: 'S.1 — Vanne de chasse d’un barrage', ref: 'Problème S.1', ancre: 's-problème-s.1-vanne-de-chasse-dun-barrage-et-butée',
    consigne: 'Pertuis de fond 1,50 × 1,00 m sous 12 m d’eau : F = 169 kN, et C n’est qu’à 7 mm sous G (pression quasi uniforme en grande profondeur). Vanne levante en glissières (f = 0,25, poids 8 kN) : effort de levage 50,3 kN, dont 84 % dus au frottement. Abaissez la retenue pour voir l’effort chuter. La question 3 (débit d’orifice) relève du chapitre 4.' },
  { id: 'batardeau', titre: 'S.6 — Batardeau flottant ballasté', ref: 'Problème S.6', ancre: 's-problème-s.6-batardeau-flottant-échoué-puis-ballasté',
    consigne: 'Caisson acier 12 × 5 × 4 m de 720 kN en mer (niveau constant) : au remorquage, tirant d’eau 1,19 m et GM = 0,54 m. Augmentez le ballast : le caisson s’enfonce, touche le fond à 3,60 m (≈ 144 m³), puis la réaction d’appui croît ; il faut 164 m³ pour R ≥ 200 kN. Tant qu’il flotte, la surface libre du ballast ruine la stabilité (GM < 0 dès 60 m³ avec une seule cuve) : cloisonnez le ballast en 3 compartiments, comme sur chantier, pour la retrouver.' },
  { id: 'nappe', titre: 'Réservoir enterré et remontée de nappe', ref: '§ 2.6.2', ancre: 's-équilibre-des-corps-immergés-et-flottants',
    consigne: 'Bassin enterré vide en béton (1 653 kN) posé sur son radier : nappe à 2,00 m au-dessus du radier, F_A = 1 177 kN, sécurité au soulèvement F_s = 1,40. Remontez la nappe (tirez sa surface) : au-delà de 2,81 m, la poussée l’emporte et l’ouvrage se soulève. Remèdes : lester (ballast, radier épaissi) ou ancrer. Le poids des terres et le frottement latéral, favorables, sont négligés.' },
  { id: 'cavitation', titre: 'Dépression et vaporisation', ref: '§ 1.7 – 2.1.3', ancre: 's-pression-de-vapeur-saturante-et-cavitation',
    consigne: 'Ciel à −60 kPa : la pression absolue en surface tombe à 41 kPa, sous la pression de vapeur de l’essence (55 kPa) : le liquide se vaporise. Remplacez l’essence par de l’eau (pv = 2,3 kPa) et l’alerte disparaît. Le piézomètre ne peut pas mesurer une dépression ; le tube en U, si.' }
];

export function creerScenario(id) {
  const meta = SCENARIOS.find(k => k.id === id);
  const s = sceneVide(meta ? meta.titre : 'Nouvelle expérience');
  if (meta && fabriques[id]) fabriques[id](s);
  const ctx = contexte(s);
  for (const e of s.elements) if (e.type === 'reservoir') calerGaz(e, ctx, s);
  if (id === 'caisson') s.env.vues.champ = false;
  return s;
}
