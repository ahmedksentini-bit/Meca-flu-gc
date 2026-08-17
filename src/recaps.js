const recaps = {
  density: {
    title: "Masse volumique, poids volumique, densité",
    lead: "Trois grandeurs décrivent « combien de matière » contient un volume, mais elles ne sont pas interchangeables. On part du volume (souvent un cylindre) et de la masse, ou du poids.",
    points: [
      "Cylindre : 𝒱 = πD²h/4. Sinon le volume est donné.",
      "Masse volumique ρ = m/𝒱 (kg/m³) ; poids volumique γ = ρg (N/m³ ou kN/m³).",
      "La densité d = ρ/ρeau est un rapport sans dimension. Pour l’eau, ρeau = 1000 kg/m³."
    ],
    watch: "Ne pas confondre masse (kg) et poids (N). Une huile a presque toujours d < 1."
  },
  viscosity: {
    title: "Viscosité et écoulement de Couette",
    lead: "Un fluide newtonien relie la contrainte de cisaillement au gradient de vitesse. Entre deux plaques, le profil est linéaire : c’est le modèle de Couette du chapitre 1.",
    points: [
      "Adhérence : le fluide a la vitesse de la paroi (U en haut, 0 en bas).",
      "Loi de Newton : τ = μ (du/dy) = μ U/e.",
      "ν = μ/ρ compare les effets visqueux à l’inertie volumique (unité m²/s)."
    ],
    watch: "Convertir e en mètres avant le calcul. τ = F/A n’est pas encore la viscosité."
  },
  compressibility: {
    title: "Compressibilité et module K",
    lead: "L’eau n’est pas incompressible au sens strict : une forte hausse de pression réduit très légèrement le volume. Le module d’élasticité volumique K mesure cette raideur.",
    points: [
      "Définition : K = −Δp / (Δ𝒱/𝒱). Le signe « − » dit qu’une compression diminue le volume.",
      "Δp = p₂ − p₁ doit être en pascals (1 bar = 10⁵ Pa ; 1 GPa = 10⁹ Pa).",
      "Pour l’eau, K ≈ 2,2 GPa : même à 100 bar, la variation de volume reste inférieure à 1 %."
    ],
    watch: "Ne pas oublier le facteur 100 entre bar et 10⁵ Pa, ni le G de GPa."
  },
  coaxialViscometer: {
    title: "Viscosimètre de Couette cylindrique",
    lead: "Si l’entrefer est mince devant le rayon, l’écoulement entre deux cylindres se ramène localement à un Couette plan. Le couple mesuré donne alors μ.",
    points: [
      "Vitesse angulaire ω = 2πN/60, puis vitesse périphérique U = ω Rᵢ.",
      "Gradient ≈ U/e avec e = Rₑ − Rᵢ.",
      "Le couple équilibre le moment de τ sur le cylindre intérieur : C = τ (2π Rᵢ L) Rᵢ."
    ],
    watch: "Un entrefer trop grand invalide l’approximation plane. N est en tr/min, pas en rad/s."
  },
  capillary: {
    title: "Capillarité et loi de Jurin",
    lead: "Dans un tube fin, la tension superficielle peut faire monter (ou descendre) une colonne liquide jusqu’à l’équilibre avec le poids.",
    points: [
      "La composante verticale de la tension, πd σ cosθ, équilibre le poids ρg (πd²/4) h.",
      "Loi de Jurin : h = 4σ cosθ / (ρ g d).",
      "θ < 90° (eau/verre) : montée. θ > 90° (mercure) : dépression capillaire.",
      "Un piézomètre trop fin fausse la lecture : D_min = 4σ/(ρg h_max)."
    ],
    watch: "h diminue si d augmente. Convertir d en mètres et σ en N/m. Le cas 0,5 mm du polycopié n’est pas le 0,05 mm du TD sol."
  },
  laplace: {
    title: "Loi de Laplace",
    lead: "Une interface courbe crée une surpression. Plus le rayon est petit, plus Δp est grand — d’où la fragilité des petites bulles et le rôle de la capillarité à petite échelle.",
    points: [
      "Goutte (une interface) : Δp = 2σ/R.",
      "Bulle de savon (deux interfaces) : Δp = 4σ/R.",
      "R doit être en mètres (souvent donné en µm)."
    ],
    watch: "Ne pas appliquer 2σ/R à une bulle de savon : elle a deux surfaces."
  },
  idealGas: {
    title: "Gaz parfait",
    lead: "Pour l’air, la masse volumique dépend fortement de la pression et de la température absolues. L’équation d’état p = ρ R T relie les trois.",
    points: [
      "Température en kelvin : T(K) = T(°C) + 273,15.",
      "Pression absolue en pascals (1 bar = 10⁵ Pa).",
      "m = ρ𝒱. À T constante, 𝒱₂ = 𝒱₁ p₁/p₂."
    ],
    watch: "Ne jamais laisser T en °C dans p = ρRT. 𝒱 de la bouteille est souvent en litres : 50 L = 0,050 m³."
  },
  pressureDepth: {
    title: "Relation fondamentale de l’hydrostatique",
    lead: "Au repos, la pression n’augmente qu’avec la profondeur. C’est l’équation dp/dz = −ρg, intégrée à ρ constant.",
    points: [
      "Pression relative : p − pₐₜₘ = ρ g h.",
      "Pression absolue : pabs = pₐₜₘ + ρ g h.",
      "g = 9,81 m/s² ; h est la profondeur verticale sous la surface libre."
    ],
    watch: "pₐₜₘ est souvent en kPa : 101,3 kPa = 101 300 Pa. Ne pas l’ajouter deux fois."
  },
  layeredPressure: {
    title: "Pressions par couches",
    lead: "Dans un réservoir à fluides non miscibles, on additionne les accroissements ρ g h de chaque couche. La pression est continue à l’interface.",
    points: [
      "On chemine du haut vers le bas : chaque couche ajoute ρᵢ g hᵢ.",
      "À l’interface, la pression de l’huile est celle que « voit » le sommet de l’eau.",
      "La hauteur équivalente en mCE vaut p_fond / (ρeau g)."
    ],
    watch: "Ne pas utiliser une seule ρ « moyenne ». Chaque couche a sa propre masse volumique."
  },
  manometer: {
    title: "Manomètre différentiel",
    lead: "On relie deux prises en cheminant dans le tube : +ρgΔz en descendant, −ρgΔz en montant. Les colonnes identiques se compensent.",
    points: [
      "Pour deux prises à la même cote : p₁ − p₂ = (ρₘ − ρ) g Δh.",
      "Le fluide manométrique (Hg, ρ ≈ 13 600 kg/m³) amplifie la lecture.",
      "Diviser par ρeau g convertit Δp en mètres de colonne d’eau."
    ],
    watch: "Le côté où le mercure est le plus bas est le côté de plus haute pression."
  },
  hydraulicPress: {
    title: "Principe de Pascal",
    lead: "Une pression appliquée à un liquide au repos se transmet intégralement. D’où le multiplicateur de force de la presse hydraulique.",
    points: [
      "Même pression : F₁/A₁ = F₂/A₂, donc F₂/F₁ = (D₂/D₁)².",
      "Le volume se conserve : A₁ x₁ = A₂ x₂.",
      "On gagne en force ce que l’on perd en course."
    ],
    watch: "Le rapport des forces est le carré du rapport des diamètres, pas le rapport simple."
  },
  planeForce: {
    title: "Mur de réservoir — diagramme des pressions",
    lead: "Sur une paroi verticale affleurante, le diagramme des pressions est un triangle. La poussée est l’aire de ce triangle, appliquée à H/3 du pied.",
    points: [
      "p_max = ρgH au pied ; F = ½ ρg H² b.",
      "Point d’application : z_C = H/3 depuis le pied (yₚ = 2H/3 sous la surface).",
      "Moment de renversement au pied : M = F × H/3."
    ],
    watch: "F n’est pas ρgAH (pression au fond × aire). Le mur du polycopié a H = 3,50 m et b = 1 m."
  },
  submergedGate: {
    title: "Vanne plane immergée",
    lead: "Même théorème que pour la paroi affleurante, mais le centre de gravité n’est plus à H/2 sous la surface : il est à y₀ + H/2.",
    points: [
      "ȳ = y₀ + H/2, puis F = ρ g A ȳ.",
      "Iᴳ reste b H³/12 (inertie de la vanne autour de son propre centre).",
      "yₚ = ȳ + Iᴳ/(A ȳ) reste sous ȳ, à l’intérieur de la vanne."
    ],
    watch: "y₀ est la profondeur de l’arête haute, pas celle du centre. Plus la vanne est profonde, plus yₚ se rapproche de ȳ."
  },
  circularGate: {
    title: "Vanne circulaire",
    lead: "Le théorème F = ρ g A ȳ s’applique à toute forme plane. Seules changent l’aire et le moment quadratique du disque.",
    points: [
      "A = π D²/4 et Iᴳ = π D⁴/64.",
      "ȳ est la profondeur du centre du disque.",
      "yₚ = ȳ + Iᴳ/(A ȳ) > ȳ."
    ],
    watch: "Ne pas utiliser les formules du rectangle (bH³/12) pour un disque."
  },
  bargeStability: {
    title: "Stabilité d’un caisson flottant",
    lead: "À l’équilibre, le poids égale la poussée d’Archimède. La stabilité au roulis se lit sur la hauteur métacentrique GM.",
    points: [
      "Volume déplacé ∇ = L B Tₑ ; centre de carène KB = Tₑ/2.",
      "Au roulis, I = L B³/12 (B = largeur). BM = I/∇.",
      "GM = KB + BM − KG. Stable si GM > 0."
    ],
    watch: "I est l’inertie de la flottaison, pas celle du volume. Pour le caisson 6×4 m, B = 4 m va au cube."
  },
  inclinedCircularGate: {
    title: "Vanne circulaire inclinée",
    lead: "La poussée ne dépend que de la profondeur du centre. L’écart centre de poussée se mesure le long de la paroi.",
    points: [
      "F = ρ g A h_G, A = πD²/4.",
      "y_G = h_G / sin α le long de la paroi.",
      "y_C − y_G = Iᴳ/(y_G A) avec Iᴳ = πD⁴/64."
    ],
    watch: "Ne pas remplacer h_G par y_G dans F = ρgAȳ : ȳ est une profondeur verticale."
  },
  quarterCylinder: {
    title: "Paroi courbe — quart de cylindre",
    lead: "Sur une paroi courbe, on sépare horizontale (projection verticale) et verticale (poids du fluide au-dessus de la face).",
    points: [
      "F_H = ½ ρg R² b, appliquée à 2R/3 sous la surface.",
      "F_V = ρg R²(1 − π/4)b vers le bas (carré moins quart de cercle).",
      "F = √(F_H² + F_V²) ; tan β = F_V/F_H. La résultante passe par l’axe."
    ],
    watch: "Le volume n’est pas le quart de cylindre plein : l’eau est au-dessus de la vanne, côté concave."
  },
  archimedesCaisson: {
    title: "Archimède : poids apparent et flottaison",
    lead: "Un corps immergé perd le poids du fluide déplacé. Un caisson flotte si la poussée à immersion totale dépasse son poids.",
    points: [
      "Tension du câble T = (ρ_béton − ρ_eau) g 𝒱.",
      "F_A,max = ρ_mer g L B H. Flotte si F_A,max > W.",
      "Tirant Tₑ = W /(ρ g L B) ; franc-bord = H − Tₑ."
    ],
    watch: "W est un poids (kN), pas une masse. L’eau du bloc (douce) n’est pas celle du caisson (mer)."
  },
  pipeContinuity: {
    title: "Débit et vitesse moyenne",
    lead: "Pour un fluide incompressible en régime permanent, le débit volumique Q = A V est le même tout le long d’une conduite pleine. La vitesse moyenne est un débit divisé par une section.",
    points: [
      "Section circulaire : A = π D²/4, avec D en mètres.",
      "V = Q/A. En AEP, on vise souvent 0,5 à 1,5 m/s.",
      "Inverser : D = √(4Q / π V) pour imposer une vitesse cible."
    ],
    watch: "Q en L/s doit passer en m³/s (÷ 1000) avant d’être combiné à A en m²."
  },
  twoSectionContinuity: {
    title: "Équation de continuité",
    lead: "Sans accumulation ni fuite, le débit se conserve : A₁ V₁ = A₂ V₂. Réduire le diamètre accélère fortement l’écoulement.",
    points: [
      "Q = A V dans chaque section, avec le même Q.",
      "V₂/V₁ = (D₁/D₂)² : diviser D par 2 multiplie V par 4.",
      "Une vitesse aval > 3 m/s est souvent excessive en réseau."
    ],
    watch: "Ce n’est pas V₂/V₁ = D₁/D₂. Le rapport porte sur les aires, donc sur D²."
  },
  networkNode: {
    title: "Bilan de débit à un nœud",
    lead: "Un nœud ne stocke pas : la somme des débits entrants égale la somme des débits sortants. C’est la continuité écrite en réseau.",
    points: [
      "Chaque branche : Q = A V.",
      "Loi des nœuds : Σ Qₑ = Σ Qₛ.",
      "Le débit restant fixe la vitesse de la conduite aval."
    ],
    watch: "Convertir toutes les branches dans la même unité (L/s ou m³/s) avant d’additionner."
  },
  convectiveAcceleration: {
    title: "Accélération d’une particule",
    lead: "Même en régime permanent, une particule accélère si la section se resserre. Il reste le terme convectif V · dV/dx.",
    points: [
      "Dérivée particulaire : a = ∂V/∂t + V dV/dx.",
      "Permanent : ∂V/∂t = 0, donc a = V dV/dx.",
      "Si V varie linéairement, dV/dx = (V₂ − V₁)/L et V au milieu est la moyenne."
    ],
    watch: "« Permanent » ne veut pas dire « sans accélération ». Ne pas oublier le facteur V devant dV/dx."
  },
  reservoirRise: {
    title: "Bilan de volume à surface libre",
    lead: "La variation de niveau d’un réservoir est le débit net divisé par l’aire du plan d’eau. C’est encore la continuité, écrite sur un volume qui change.",
    points: [
      "A dh/dt = Qₑ − Qₛ.",
      "Temps pour une montée Δh : t = A Δh / (Qₑ − Qₛ).",
      "Un grand diamètre de bassin ralentit fortement dh/dt."
    ],
    watch: "Si Qₑ < Qₛ le niveau baisse. A est l’aire du plan d’eau, pas celle de la conduite."
  },
  tankFilling: {
    title: "Dimensionnement par le débit",
    lead: "Livrer un volume en un temps donné fixe le débit. La vitesse maximale admissible fixe ensuite la section minimale, donc le diamètre.",
    points: [
      "Q = 𝒱 / t, avec t en secondes.",
      "A_min = Q / V_max, puis D = √(4A/π).",
      "On arrondit ensuite au diamètre commercial supérieur."
    ],
    watch: "Ne pas laisser t en heures dans Q = 𝒱/t."
  },
  distributedFlow: {
    title: "Prélèvement réparti",
    lead: "Le long d’une conduite de distribution, le débit diminue. Si le prélèvement est uniforme, Q(x) est une droite entre Qₑ et Qₛ.",
    points: [
      "Débit linéique q = (Qₑ − Qₛ) / L.",
      "Q(x) = Qₑ − q x.",
      "À mi-parcours, la moitié du prélèvement a déjà eu lieu."
    ],
    watch: "Q(x) n’est pas constant. On ne peut pas prendre Qₑ partout dans V = Q/A."
  },
  venturi: {
    title: "Venturi et Bernoulli",
    lead: "Au col, la section diminue : la vitesse augmente et la pression chute. Le manomètre mesure cette chute ; continuité + Bernoulli donnent le débit.",
    points: [
      "Continuité : Q = S₁ V₁ = S₂ V₂.",
      "Bernoulli horizontal, fluide parfait : p + ½ρV² = cte.",
      "Manomètre : p₁ − p₂ = (ρₘ − ρ) g Δh, puis on isole Q."
    ],
    watch: "V₂/V₁ = (D₁/D₂)². Un Venturi n’est pas un tube de Pitot : on mesure un débit, pas une vitesse locale."
  },
  torricelli: {
    title: "Théorème de Torricelli",
    lead: "Un orifice sous une charge h se comporte comme une chute libre : la vitesse idéale est √(2gh). Le coefficient Cᵈ corrige contraction et pertes.",
    points: [
      "Grande section amont : vitesse de surface négligeable.",
      "V_idéale = √(2 g h), V_réelle = Cᵈ √(2 g h).",
      "Q = S V_réelle. Cᵈ ≈ 0,60–0,65 pour un orifice en mince paroi."
    ],
    watch: "Oublier Cᵈ surestime le débit d’environ 60 %. h est la charge sur l’orifice, pas la hauteur du réservoir si l’orifice n’est pas au fond."
  },
  bernoulliSections: {
    title: "Bernoulli entre deux sections",
    lead: "Le long d’une ligne de courant, la somme hauteur de pression + hauteur cinétique + cote se conserve (fluide parfait, pas de machine).",
    points: [
      "p/ρg + V²/2g + z = constante.",
      "Les vitesses viennent de la continuité : V = Q/A.",
      "La pression chute si on s’élève ou si le fluide accélère."
    ],
    watch: "Ne pas oublier le terme de cote. p₂ peut devenir négative en relatif : risque de cavitation."
  },
  drainTime: {
    title: "Temps de vidange",
    lead: "La charge diminue en vidant : le débit n’est pas constant. On écrit le bilan −A dh/dt = Cᵈ a √(2gh) et on sépare les variables.",
    points: [
      "A est la section du réservoir, a celle de l’orifice.",
      "Intégration : t = 2A (√h₁ − √h₂) / (Cᵈ a √(2g)).",
      "Vidanger jusqu’à h = 0 dure deux fois plus longtemps qu’à débit initial constant."
    ],
    watch: "On n’a pas le droit d’utiliser Q(h₁) × volume. Le débit diminue avec √h."
  },
  pitot: {
    title: "Tube de Pitot",
    lead: "Au point d’arrêt, la vitesse s’annule et l’énergie cinétique se convertit en pression. La différence p₀ − p donne la vitesse locale.",
    points: [
      "Bernoulli : p + ½ρV² = p₀, donc V = √(2 Δp / ρ).",
      "Manomètre : Δp = (ρₘ − ρ) g Δh.",
      "C’est une vitesse locale (souvent maximale à l’axe), pas un débit."
    ],
    watch: "Un Pitot n’est pas un Venturi. Pour avoir Q, il faudrait un coefficient de profil."
  },
  siphon: {
    title: "Siphon",
    lead: "Le siphon démarre dès que la sortie est plus basse que la surface libre. Au point haut, une partie de la charge se paie en dépression.",
    points: [
      "Entre surface et sortie : V = √(2 g Δz) (diamètre constant, pₐₜₘ aux deux bouts).",
      "Au sommet C : p_C = pₐₜₘ − ρg (z_C + V²/2g).",
      "p_C doit rester au-dessus de la pression de vapeur (~2,3 kPa à 20 °C)."
    ],
    watch: "Ce n’est pas la hauteur du point haut qui donne V, c’est la dénivelée totale surface–sortie."
  },
  hydraulicPower: {
    title: "Bernoulli généralisé et puissance",
    lead: "Une pompe ajoute une hauteur H à la charge. Entre deux surfaces libres, HMT = hauteur géométrique + pertes. La puissance hydraulique est ρ g Q H.",
    points: [
      "HMT = H_g + h_pertes.",
      "Pₕ = ρ g Q H (watts si Q en m³/s et H en m).",
      "Puissance absorbée : P_abs = Pₕ / η."
    ],
    watch: "Q en L/s → m³/s. η est inférieur à 1 : P_abs > Pₕ."
  },
  jetPlate: {
    title: "Théorème d’Euler — jet sur plaque",
    lead: "La force n’est pas une « pression du jet » : c’est la variation de quantité de mouvement à travers un volume de contrôle. Sur une plaque normale fixe, la composante axiale de V s’annule.",
    points: [
      "Σ F⃗ = ṁ (V⃗₂ − V⃗₁), avec ṁ = ρ Q.",
      "Plaque normale fixe : F = ρ Q V = ρ S V².",
      "L’effort varie comme V² : doubler V multiplie F par 4."
    ],
    watch: "On ne calcule pas F = p S avec une pression fictive. Le bilan est sur les flux de quantité de mouvement."
  },
  jetDeflect: {
    title: "Jet dévié par un auget",
    lead: "Si l’auget ne change que la direction, |V| se conserve. La force vient de la différence vectorielle V⃗₂ − V⃗₁.",
    points: [
      "ṁ = ρ Q = ρ S V.",
      "|ΔV⃗| = 2 V sin(θ/2), donc F = 2 ρ Q V sin(θ/2).",
      "θ = 0 → F = 0 ; θ = 180° → F = 2 ρ Q V."
    ],
    watch: "θ est l’angle de déviation du jet, pas l’angle d’attaque de la plaque. Ne pas oublier le facteur 2."
  },
  colebrook: {
    title: "Pertes linéaires — Darcy, Colebrook et Moody",
    lead: "Dans un fluide réel, la charge diminue le long de la conduite. On passe par le Reynolds (régime), le coefficient λ lu sur le diagramme de Moody (ou calculé par Colebrook), puis Darcy–Weisbach.",
    points: [
      "Re = V D / ν. Laminaire si Re < 2000 ; turbulent au-delà de 4000.",
      "Le diagramme de Moody est le graphe de Colebrook : λ = λ(Re, ε/D). En calcul, on itère depuis λ₀ = 0,02.",
      "h_f = λ (L/D) V² / (2g). Laminaire : λ = 64/Re."
    ],
    watch: "ε et D doivent être dans la même unité pour ε/D. ν de l’eau à 20 °C ≈ 10⁻⁶ m²/s."
  },
  moodyRead: {
    title: "Diagramme de Moody",
    lead: "Moody (1944) trace λ en fonction de Re pour une famille de rugosités relatives ε/D. C’est la lecture graphique de Colebrook–White, exigée au §6.4.3 du cours.",
    points: [
      "Abscisse log Re, ordonnée log λ. Courbe unique à gauche : λ = 64/Re (laminaire).",
      "Bande hachurée : transition (2000–4000), lecture incertaine.",
      "Famille de courbes turbulentes. À droite de la ligne tiretée, régime rugueux : λ = λ(ε/D) seulement.",
      "Ordres de ε : PVC 0,01 mm ; acier neuf 0,05–0,1 mm ; fonte incrustée 1–3 mm ; béton 0,3–3 mm."
    ],
    watch: "Ne pas lire une courbe d’ε/D trop loin du point. En turbulent lisse (ε/D → 0), λ continue de baisser avec Re."
  },
  minorLosses: {
    title: "Pertes singulières",
    lead: "Chaque accident de parcours (entrée, coude, vanne, sortie) dissipe une fraction de l’énergie cinétique. Sur un réseau court, ces pertes peuvent dépasser les pertes linéaires.",
    points: [
      "hₛ = K V² / (2g) par singularité, à la vitesse de référence indiquée.",
      "Les K s’additionnent s’ils sont rapportés à la même V.",
      "Sortie en réservoir : K = 1 (toute l’énergie cinétique est perdue)."
    ],
    watch: "Ne pas mélanger des K écrits avec des vitesses différentes (amont/aval d’un élargissement)."
  },
  froudeSimilarity: {
    title: "Similitude de Froude",
    lead: "Sur un modèle à surface libre, on égale les nombres de Froude. Avec la même gravité, les échelles se déduisent de l’échelle géométrique N = Lₚ/Lₘ.",
    points: [
      "Fr = V / √(g L). λV = √λL = √N.",
      "Débit : λQ = λL² λV = N^(5/2).",
      "On ne peut pas imposer en même temps Re et Fr avec le même fluide."
    ],
    watch: "N = prototype / modèle, donc Vₚ = Vₘ √N > Vₘ. Ne pas inverser le rapport."
  },
  manningChannel: {
    title: "Régime uniforme — Manning–Strickler",
    lead: "Dans un canal prismatique à pente constante, le poids moteur équilibre le frottement. La profondeur est alors constante (profondeur normale) et V suit Strickler.",
    points: [
      "Périmètre mouillé : parois seulement, jamais la surface libre. Rectangle : P = b + 2y.",
      "R = A/P, puis V = Kₛ R^(2/3) √S et Q = A V.",
      "Fr = V / √(g y) : fluvial si Fr < 1, torrentiel si Fr > 1."
    ],
    watch: "S est souvent en ‰ : 1,5 ‰ = 0,0015. Ne pas mettre S = 1,5 dans √S."
  },
  jetMobile: {
    title: "Auget mobile — puissance d’un jet",
    lead: "Un auget en U inverse le jet. S’il est fixe, F = 2ρQV. S’il avance à u, seule la vitesse relative compte. La puissance P = Fu est maximale pour u = V/3.",
    points: [
      "Référentiel de l’auget : V_rel = V − u, puis F = 2ρA V_rel².",
      "P(u) = 2ρA(V − u)² u. Dériver : u_opt = V/3.",
      "L’auget isolé récupère au plus 8/27 de la puissance cinétique du jet."
    ],
    watch: "Ne pas utiliser V au lieu de V−u sur l’auget mobile. Si u ≥ V, plus de jet relatif."
  },
  elbowForce: {
    title: "Ancrage d’un coude",
    lead: "L’eau change de direction : il faut un massif d’ancrage. La force a deux origines : la pression sur les sections et la variation de quantité de mouvement.",
    points: [
      "Coude 90°, D constant, fluide parfait : p et V se conservent.",
      "Fₓ = Fᵧ = pA + ρQV, résultante à 45° vers l’extérieur.",
      "En AEP, pA domine largement ρQV : on bute aussi pour l’épreuve en pression."
    ],
    watch: "Le poids de l’eau n’entre pas dans le plan horizontal. p est une pression relative en pascals."
  },
  convergentForce: {
    title: "Effort sur un convergent",
    lead: "Bernoulli donne p₂ ; Euler donne l’effort axial. L’eau accélère et la pression chute : le convergent est souvent « tiré » vers l’aval.",
    points: [
      "V₂/V₁ = (D₁/D₂)², puis p₂ = p₁ + ½ρ(V₁² − V₂²).",
      "F = p₁A₁ − p₂A₂ − ρQ(V₂ − V₁), positive vers l’aval.",
      "Les brides ou le massif doivent reprendre cet effort de traction."
    ],
    watch: "Oublier le terme de pression (ne garder que ρQΔV) sous-estime F d’un facteur 10."
  },
  jetReaction: {
    title: "Propulsion par réaction",
    lead: "Le réservoir éjecte de la quantité de mouvement. Pour rester immobile, une force extérieure F = ρQV doit l’équilibrer. Elle vaut 2ρghA.",
    points: [
      "V = √(2gh) (orifice profilé, Cᵈ = 1).",
      "Volume de contrôle = réservoir entier : entrée à V = 0, sortie à V.",
      "F = 2 × (poussée hydrostatique sur un bouchon)."
    ],
    watch: "Ce n’est pas la pression sur l’orifice qui « pousse » le réservoir. C’est le flux sortant de quantité de mouvement."
  },
  inclinedPlate: {
    title: "Jet sur plaque inclinée",
    lead: "Plaque lisse : la réaction est normale. Le bilan tangentiel partage le débit entre une nappe aval et une nappe qui remonte.",
    points: [
      "Fₙ = ρ Q V sinθ.",
      "Q₊ = Q(1+cosθ)/2 vers l’aval, Q₋ = Q(1−cosθ)/2 vers l’amont.",
      "À 60°, 75 % du débit part vers l’aval."
    ],
    watch: "θ est l’angle entre le jet et la plaque, pas l’angle avec la normale. Ne pas oublier de partager Q."
  },
  reynoldsRegime: {
    title: "Nombre de Reynolds",
    lead: "Re = VD/ν décide du régime. En conduite circulaire : laminaire sous 2000, turbulent au-delà de 4000. L’hydraulique urbaine est presque toujours turbulente.",
    points: [
      "V = Q/A d’abord, avec D en mètres.",
      "νeau(20 °C) ≈ 10⁻⁶ m²/s.",
      "Une huile (ν grand) peut rester laminaire au même débit."
    ],
    watch: "ν est en m²/s, pas en Pa·s. Si ν est donnée en 10⁻⁶ m²/s, multiplier par 10⁻⁶."
  },
  hydraulicDiameter: {
    title: "Diamètre hydraulique",
    lead: "Pour une section non circulaire, on remplace D par Dₕ = 4A/P dans Reynolds et Darcy. P est le périmètre mouillé (parois seulement).",
    points: [
      "Gaine pleine : Dₕ = 2ab/(a+b).",
      "Cercle : Dₕ = D, contrôle de cohérence.",
      "Re = V Dₕ / ν."
    ],
    watch: "Ne pas prendre P = 2(a+b) + surface libre : ici la gaine est pleine, il n’y a pas de surface libre."
  },
  fallingFilm: {
    title: "Film ruisselant — solution exacte NS",
    lead: "Sur un parement incliné, Navier–Stokes se réduit à un équilibre pesanteur/viscosité. Le profil est un demi-Poiseuille. Encore faut-il que le film soit vraiment laminaire.",
    points: [
      "u(y) = (ρg sinα / 2μ) (2ey − y²), u(e) = ρge²sinα/(2μ).",
      "q = ρge³sinα/(3μ) par mètre de largeur.",
      "Contrôler Re a posteriori : sinon le calcul surestime fortement V."
    ],
    watch: "Un film d’eau de 2 mm à 30° n’est pas laminaire. Le même modèle est correct pour une huile."
  },
  poiseuilleOil: {
    title: "Hagen–Poiseuille",
    lead: "En laminaire, λ = 64/Re n’est pas empirique : c’est la solution exacte de Navier–Stokes en conduite. La perte est proportionnelle à V, pas à V².",
    points: [
      "Vérifier Re < 2000 avant d’appliquer λ = 64/Re.",
      "h_f = λ(L/D)V²/(2g) reste valable (et se réduit à une loi linéaire en V).",
      "P = Q Δp est la puissance à fournir contre le frottement."
    ],
    watch: "Ne pas utiliser Colebrook en laminaire. μ est en Pa·s, pas ν."
  },
  gravityPipe: {
    title: "Débitance d’une conduite gravitaire",
    lead: "Entre deux réservoirs, H est connue et Q est l’inconnue. λ dépend de V donc de Q : il faut itérer (Colebrook).",
    points: [
      "Bernoulli : H = (λL/D + ΣK) V²/(2g).",
      "On part d’un λ rugueux, on recalcule Re, puis λ, puis V.",
      "Q = AV une fois V convergé."
    ],
    watch: "Ce n’est pas un calcul direct. Initialiser λ ≈ 0,02 puis itérer. Sur une longue conduite, ΣK est souvent négligeable."
  },
  pipeSizing: {
    title: "Choix d’un diamètre commercial",
    lead: "On connaît Q et H disponible. On teste les DN de la série 150, 200, 250, 300, 350, 400 mm et on retient le plus petit tel que h_f ≤ H.",
    points: [
      "Pour chaque D : V = Q/A, λ(Colebrook), h_f = λ(L/D)V²/(2g).",
      "Arrondir au commercial supérieur, jamais inférieur.",
      "Vérifier que V reste dans 0,5–1,5 m/s en distribution."
    ],
    watch: "Le DN retenu est en millimètres (250, pas 0,25). Un DN trop juste ne laisse aucune réserve de vieillissement."
  },
  pumpStation: {
    title: "Hauteur manométrique totale",
    lead: "La pompe doit vaincre la dénivelée et toutes les pertes d’aspiration et de refoulement. HMT = Δz + h_asp + h_ref, puis Pₕ = ρgQH.",
    points: [
      "Chaque côté a sa vitesse : ne pas prendre le même V partout.",
      "h = (λL/D + K) V²/(2g) de chaque côté.",
      "P_abs = Pₕ/η : le rendement est inférieur à 1."
    ],
    watch: "Oublier les pertes d’un côté sous-estime la HMT. Q en L/s → m³/s avant P = ρgQH."
  },
  bordaCarnot: {
    title: "Élargissement brusque",
    lead: "Le théorème d’Euler appliqué à un élargissement donne la perte de Borda–Carnot. La pression remonte, mais moins qu’en fluide parfait.",
    points: [
      "hₛ = (V₁ − V₂)² / (2g).",
      "Sortie en réservoir : V₂ = 0 donc hₛ = V₁²/2g (K = 1).",
      "p₂ − p₁ = ½ρ(V₁² − V₂²) − ρg hₛ."
    ],
    watch: "La pression augmente (ralentissement) : le signe de p₂−p₁ est positif. Un divergent lent dissipe beaucoup moins."
  },
  reynoldsDrag: {
    title: "Similitude de Reynolds",
    lead: "En charge, sans surface libre, on égale les Reynolds. Avec le même fluide, les forces modèle et prototype sont identiques — mais le modèle doit aller N fois plus vite.",
    points: [
      "Reₘ = Reₚ et ν identique ⟹ Vₘ = N Vₚ.",
      "F ~ ρV²L² ⟹ Fₚ = Fₘ.",
      "Cette vitesse d’essai est souvent irréalisable : d’où la similitude automatique en turbulent rugueux."
    ],
    watch: "Ne pas appliquer les échelles de Froude (√N, N³) à un essai de Reynolds."
  },
  froudeSpillway: {
    title: "Échelles de Froude",
    lead: "Un évacuateur se calque à Fr constant. Chaque grandeur se transpose par une puissance de N = Lₚ/Lₘ.",
    points: [
      "λV = λt = √N, λQ = N^(5/2), λF = N³ (même fluide).",
      "Qₘ = Qₚ / N^(5/2) doit rester praticable en labo.",
      "On vérifie a posteriori que Re et la capillarité restent acceptables sur le modèle."
    ],
    watch: "Le temps modèle est plus court : tₚ = tₘ √N. Ne pas oublier de convertir les minutes en secondes."
  },
  stokesViscosity: {
    title: "Loi de Stokes",
    lead: "À vitesse limite, poids, Archimède et traînée 3πμdV s’équilibrent. C’est le viscosimètre à chute de bille — à condition que Re ≲ 1.",
    points: [
      "μ = (ρₛ − ρ) g d² / (18 V).",
      "Re = ρ V d / μ à contrôler ensuite.",
      "Si Re ≈ 1, une correction d’Oseen serait justifiée pour une mesure précise."
    ],
    watch: "d en mètres (2 mm = 0,002 m). Oublier Archimède surestime μ."
  },
  trapezoidalChannel: {
    title: "Section trapézoïdale",
    lead: "A = (b + z y) y et P = b + 2y√(1+z²). Le fruit z est le rapport horizontal/vertical des talus (3H/2V ⟹ z = 1,5).",
    points: [
      "La surface libre n’entre pas dans P.",
      "Fr s’écrit avec la profondeur moyenne ȳ = A/T, T = b + 2 z y.",
      "S en ‰ : 0,8 ‰ = 0,0008."
    ],
    watch: "Ne pas traiter le trapèze comme un rectangle de largeur b. z n’est pas un angle en degrés."
  },
  normalDepth: {
    title: "Profondeur normale",
    lead: "yₙ est la profondeur qui s’établit en régime uniforme pour un débit donné. L’équation Q = A Kₛ R^(2/3) √S est implicite en y : on itère.",
    points: [
      "Rectangle : A = b y, R = by/(b+2y).",
      "On cherche y tel que Q_calc(y) = Q_donné.",
      "Puis Fr = V/√(g y) classe le régime."
    ],
    watch: "Ce n’est pas y = Q/(b Kₛ √S). R dépend de y. Proche du critique, le résultat est sensible."
  },
  waveCelerity: {
    title: "Célérité et caractéristiques",
    lead: "Une perturbation de surface se propage à c = √(gy) par rapport à l’eau. En fluvial, une onde remonte : l’aval commande. C’est la structure des équations de Saint-Venant.",
    points: [
      "Fronts absolus : V+c (aval) et V−c (amont, soit c−V en valeur).",
      "Temps pour atteindre L en amont : t = L/(c−V).",
      "Si Fr > 1, aucune information ne remonte."
    ],
    watch: "L est souvent en km. c n’est pas V. En fluvial, c > V."
  },
  damBreakRitter: {
    title: "Solution de Ritter",
    lead: "Rupture instantanée sur fond sec, sans frottement : le front part à 2√(gh₀). Au droit du barrage, h et V restent constants. C’est un majorant d’étude d’onde de submersion.",
    points: [
      "c_f = 2√(gh₀) — plus rapide qu’une voiture en ville pour h₀ = 20 m.",
      "h_barrage = 4h₀/9, V_barrage = 2√(gh₀)/3.",
      "t = x / c_f. En réalité, frottement et vallée ralentissent le front."
    ],
    watch: "Ce n’est pas c = √(gh₀). Le facteur 2 vient de la détente sur fond sec."
  },
  damSluice: {
    title: "Vanne de fond — poussée, levage, débit",
    lead: "Trois chapitres en un : hydrostatique (F, yₚ), frottement de glissière (T = W + μF), puis orifice (Torricelli) une fois la vanne ouverte.",
    points: [
      "ȳ = h_seuil − H/2 : la vanne est profonde, yₚ ≈ ȳ.",
      "Le frottement μF dimensionne souvent le treuil, pas le poids propre.",
      "Ouverte : Q = Cᵈ A √(2g ȳ) sous la charge au centre du pertuis."
    ],
    watch: "h est mesuré depuis le seuil, pas depuis le centre. W est en kN → N. Ne pas oublier μF dans T."
  },
  npshCavitation: {
    title: "NPSH et cavitation",
    lead: "Une pompe en aspiration travaille souvent en dépression. Le NPSH disponible doit rester supérieur au NPSH requis, sinon la veine se vaporise à l’entrée.",
    points: [
      "NPSH_d = pₐₜₘ/ρg − pᵥ/ρg − Hₛ − h_asp.",
      "Hₛ = z_axe − z_eau. h_asp contient λL/D et les K (crépine, coude).",
      "On limite z_axe pour garder une marge (souvent 0,5 m)."
    ],
    watch: "pₐₜₘ et pᵥ sont des pressions absolues. Oublier h_asp surestime le NPSH_d."
  },
  waterCannon: {
    title: "Lance, jet et recul",
    lead: "Bernoulli donne la vitesse du jet ; Euler donne deux forces différentes : celle sur l’écran (ρQV) et le recul de la lance (pressions de bride moins variation de quantité de mouvement).",
    points: [
      "Sortie à l’air libre : p₂ = 0 relatif.",
      "Écran normal : F = ρ Q V₂.",
      "La lance est poussée vers l’amont : c’est l’effort que reprend l’opérateur."
    ],
    watch: "Ne pas confondre force sur l’écran et recul de la lance : ce ne sont pas les mêmes volumes de contrôle."
  },
  cofferdamBallast: {
    title: "Flottaison puis lestage",
    lead: "On dimensionne d’abord le tirant et la stabilité à vide, puis le ballast qui garantit l’appui une fois le caisson posé sous l’eau — les sous-pressions sont énormes.",
    points: [
      "Tₑ = W / (ρ g L B).",
      "GM = Tₑ/2 + I/∇ − z_G, I = L B³/12.",
      "Posé : W + W_ballast + R = poussée sur le volume immergé."
    ],
    watch: "La poussée posée n’est pas celle du remorquage. R est une réaction d’appui, pas un poids."
  },
  oilSeason: {
    title: "Laminaire contre turbulent",
    lead: "Quand ν double, Re peut retraverser 2000. λ = 64/Re en laminaire, Colebrook en turbulent. La puissance ne varie pas toujours dans le sens attendu près de la transition.",
    points: [
      "Même V, deux ν, deux Re, deux λ.",
      "P_abs = ρ g Q h_f / η.",
      "Un dimensionnement industriel s’écarte de la zone de transition."
    ],
    watch: "Ne pas garder le λ d’été en hiver. ν est en 10⁻⁶ m²/s dans l’énoncé."
  },
  retainingWall: {
    title: "Mur-poids, renversement",
    lead: "La poussée sur un parement vertical vaut ρgH²/2 par mètre et s’applique à H/3 du pied. Le poids du mur, déporté vers l’aval, fournit le moment stabilisateur.",
    points: [
      "F = ρ g H² / 2, bras = H/3.",
      "W = ρ_c g t H_mur, bras = t/2 par rapport à l’arête aval.",
      "FS = M_stab / M_renv. On vise souvent FS ≥ 1,5."
    ],
    watch: "F n’est pas ρgH² (pression au fond × hauteur). Les sous-pressions, absentes ici, réduisent FS."
  },
  gravityValve: {
    title: "Réglage par vanne",
    lead: "H est fixe. Diminuer Q de moitié divise V² par 4 : pour consommer la même charge, il faut un Kᵥ énorme. D’où la raideur du réglage en fin de course.",
    points: [
      "On itère d’abord le débit actuel.",
      "À V/2 on recalcule λ (Colebrook).",
      "Kᵥ = 2gH/V'² − λ'L/D − K_autres."
    ],
    watch: "On n’a pas Kᵥ(Q/2) = 4 Kᵥ(Q) : λ change, et K_autres reste."
  },
  viscosityForce: {
    title: "Loi de Newton : plaque mobile",
    lead: "μ est donnée. Le profil linéaire dans le film fixe le gradient U/e, donc τ, puis la force de traction et la puissance dissipée.",
    points: ["τ = μ U/e.", "F = τ A.", "P = F U (chaleur dans le film).", "e en mètres."],
    watch: "Ne pas recalculer μ : c’est une donnée. Convertir e en mètres avant U/e."
  },
  bearingLoss: {
    title: "Palier lisse",
    lead: "Le jeu d’un palier est un Couette cylindrique. Le couple visqueux dissipe P = Cω, souvent non négligeable à grand régime.",
    points: ["U = ω R, ω = 2πN/60.", "C = μ (2π R³ L / e) ω.", "P = C ω."],
    watch: "N en tr/min, e en mm. Oublier le 2π du périmètre sous-estime C."
  },
  pressureUnits: {
    title: "Unités de pression",
    lead: "Bar, mmHg, psi et mCE mesurent la même grandeur. On passe toujours par le pascal, puis on divise par ρeau g.",
    points: ["1 bar = 10⁵ Pa ≈ 10,2 mCE.", "760 mmHg ≈ 101,3 kPa.", "1 psi ≈ 6895 Pa."],
    watch: "mCE utilise ρ = 1000 kg/m³, pas ρHg. Ne pas traiter les mmHg comme des mm d’eau."
  },
  pipeGage: {
    title: "Manomètre sous conduite",
    lead: "Le centre n’est pas à la cote des ménisques. On retranche la colonne d’eau z et l’on ajoute la colonne de mercure Δh.",
    points: ["p = (ρₘ Δh − ρ z) g.", "z est la distance verticale centre → ménisque bas.", "Résultat en pascals relatifs."],
    watch: "Oublier z revient à placer la prise au niveau du mercure et surestime p."
  },
  woodLog: {
    title: "Flottaison d’un tronc",
    lead: "La densité d fixe la fraction immergée. La masse est celle du bois, égale au poids de l’eau déplacée.",
    points: ["𝒱_imm = d 𝒱.", "m = d ρeau 𝒱.", "d < 1 pour flotter."],
    watch: "d n’est pas la masse volumique en kg/m³ : c’est le rapport à l’eau."
  },
  iceberg: {
    title: "Iceberg",
    lead: "Archimède : la fraction immergée égale le rapport des masses volumiques. En mer, environ 90 % est sous l’eau.",
    points: ["ρᵢ 𝒱 = ρₑ 𝒱_imm.", "Émergé = 1 − ρᵢ/ρₑ."],
    watch: "En eau douce (1000 kg/m³) l’iceberg émerge moins qu’en mer."
  },
  channelDischarge: {
    title: "Débit d’un canal",
    lead: "Sans frottement à calculer : Q = A V avec A = b y. Penser à convertir en m³/h si demandé.",
    points: ["A = b y.", "Q = A V.", "1 m³/s = 3600 m³/h."],
    watch: "Ce n’est pas encore Manning : V est donnée, on ne la calcule pas."
  },
  pitotWater: {
    title: "Pitot en hauteur d’eau",
    lead: "Si le tube donne directement une hauteur dynamique en mm d’eau, Bernoulli se réduit à V = √(2gh).",
    points: ["h = V²/2g.", "Convertir mm → m avant de prendre la racine."],
    watch: "Ce n’est pas un manomètre à mercure : on ne multiplie pas par (ρₘ−ρ)."
  },
  turbinePower: {
    title: "Puissance d’une turbine",
    lead: "Même formule que la pompe, avec le rendement du côté production : P = η ρ g Q H.",
    points: ["H est la chute nette.", "Q déjà en m³/s.", "P en watts ; diviser par 1000 pour des kW."],
    watch: "Pour une turbine η multiplie Pₕ ; pour une pompe il la divise."
  },
  momentumHold: {
    title: "Réaction d’un jet connu",
    lead: "Si Q et V sont donnés, F = ρ Q V. Pas besoin de Torricelli ni de section.",
    points: ["ṁ = ρ Q.", "F = ṁ V = ρ Q V."],
    watch: "Q en L/s → m³/s. Ne pas recalculer V par √(2gh) si V est déjà donnée."
  },
  froudeForceTime: {
    title: "Échelles de force et de temps",
    lead: "En Froude, même fluide : les temps suivent √N, les forces suivent N³.",
    points: ["tₚ = tₘ √N.", "Fₚ = Fₘ N³."],
    watch: "La période modèle est en secondes, pas en minutes. N³ croît très vite."
  },
  froudeScale: {
    title: "Débit de modèle",
    lead: "λQ = N^(5/2) permet de ramener un débit de crue à un débit de laboratoire.",
    points: ["λV = √N.", "Qₘ = Qₚ / N^(5/2)."],
    watch: "Qₘ sort en m³/s : 0,094 m³/s = 94 L/s."
  },
  reynoldsSpeed: {
    title: "Vitesse en similitude de Reynolds",
    lead: "Même fluide : le modèle doit aller N fois plus vite que le prototype. Inversement, Vₚ = Vₘ / N.",
    points: ["Reₘ = Reₚ ⟹ Vₘ = N Vₚ.", "Vₚ = Vₘ / N."],
    watch: "Ne pas appliquer √N (Froude) à un essai de conduite en charge."
  },
  idealGasTwo: {
    title: "Gaz parfait : deux états",
    lead: "Chaque état (p, T) fixe sa propre masse volumique. On convertit d’abord en unités absolues, puis ρ = p/(RT).",
    points: [
      "T(K) = T(°C) + 273,15 ; p(Pa) = p(bar) × 10⁵.",
      "R_air = 287 J/(kg·K) dans le polycopié.",
      "Les deux calculs sont indépendants : on ne « enchaîne » pas les états."
    ],
    watch: "Ne jamais laisser T en °C. À 0 °C / 1,013 bar, ρ ≈ 1,29 kg/m³."
  },
  reynoldsTwo: {
    title: "Nombre de Reynolds et régime",
    lead: "Re = VD/ν compare inertie et viscosité. Le régime se lit sur Re, pas sur la vitesse seule.",
    points: [
      "Convertir D en mètres et ν en m²/s (souvent donnée en 10⁻⁶ m²/s).",
      "Seuils usuels : laminaire < 2000, transition, turbulent > 4000.",
      "Une huile visqueuse reste souvent laminaire là où l’eau serait déjà turbulente."
    ],
    watch: "ν_eau ≈ 10⁻⁶ m²/s à 20 °C. ν_huile = 400×10⁻⁶ m²/s est 400 fois plus grand."
  },
  kinematicField: {
    title: "Champ 2D : continuité et rotationnel",
    lead: "Un champ plan est incompressible si div V⃗ = 0. Il est irrotationnel si ω_z = 0 en tout point.",
    points: [
      "div V⃗ = ∂u/∂x + ∂v/∂y.",
      "ω_z = ∂v/∂x − ∂u/∂y (composante normale au plan).",
      "Pour u = kx², v = −2kxy : div = 0 partout, mais ω_z = −2ky."
    ],
    watch: "Incompressible ≠ irrotationnel. Ici le champ n’est irrotationnel que sur l’axe y = 0."
  },
  dimensionsMLT: {
    title: "Équations aux dimensions",
    lead: "Toute grandeur mécanique s’écrit Mᵅ Lᵝ Tᵞ. On part d’une définition, on remplace F = MLT⁻², et on lit les exposants.",
    points: [
      "Puissance P = F V → M L² T⁻³.",
      "Couple C = F ℓ → M L² T⁻² (même dimension qu’une énergie).",
      "Contrainte F/A → M L⁻¹ T⁻² ; ṁ = ρQ → M T⁻¹ ; σ_s = F/ℓ → M T⁻² ; dp/dx → M L⁻² T⁻²."
    ],
    watch: "Ne pas confondre puissance (T⁻³) et couple (T⁻²). La tension superficielle n’a pas de L."
  },
  pendulumPi: {
    title: "Théorème des π : pendule",
    lead: "Si T = k Lᵃ gᵇ mᶜ, l’homogénéité impose les exposants. La masse disparaît : c’est déjà un résultat physique.",
    points: [
      "[T] = T = Lᵃ (L T⁻²)ᵇ Mᶜ.",
      "c = 0 ; a + b = 0 ; −2b = 1 → a = 1/2, b = −1/2.",
      "Donc T ∝ √(L/g), forme de Galilée."
    ],
    watch: "k est sans dimension. On ne « devine » pas les exposants : on les identifie."
  },
  propellerPi: {
    title: "Théorème des π : hélice",
    lead: "La puissance d’une hélice s’écrit P = k ρᵃ nᵇ Dᶜ. L’identification donne la forme P = ρ n³ D⁵ f(…).",
    points: [
      "M L² T⁻³ = (M L⁻³)ᵃ (T⁻¹)ᵇ Lᶜ.",
      "a = 1, b = 3, c = 5.",
      "n est en tours par seconde (s⁻¹), pas en tr/min."
    ],
    watch: "Oublier de convertir n en s⁻¹ casse l’homogénéité. D⁵ croît très vite avec le diamètre."
  }
};

const fallback = {
  title: "Méthode générale",
  lead: "On convertit d’abord toutes les données en unités SI, on écrit le bilan littéral (masse, énergie ou quantité de mouvement), puis seulement on remplace les nombres.",
  points: [
    "Schéma coté : sections, cotes, sens de l’écoulement.",
    "Hypothèses : permanent ? incompressible ? fluide parfait ?",
    "Contrôle final : unités, signe, ordre de grandeur."
  ],
  watch: "Un résultat sans unité, ou hors de l’ordre de grandeur attendu, est presque toujours une conversion oubliée."
};

export function courseRecap(solver) {
  return recaps[solver] || fallback;
}
