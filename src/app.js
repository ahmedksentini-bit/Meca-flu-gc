import { solve, isClose } from "./solvers.js";
import { drawFigure, moodyChart, moodyPoint } from "./diagrams.js";
import { courseRecap } from "./recaps.js";
import { warmups } from "./warmups.js";

const app = document.querySelector("#app");
const state = { catalog: null, exercise: null, mode: "learn", data: {}, attempts: {}, warmup: {}, timer: null, seconds: 0, installPrompt: null };
const modes = { learn: "Apprentissage", train: "Entraînement", exam: "Examen" };
const pedagogy = {
  density:{hypotheses:"Fluide homogène ; g = 9,81 m/s² ; la densité est définie par rapport à l’eau à ρeau = 1000 kg/m³.",why:["Le volume du cylindre est 𝒱 = πD²h/4, ou 𝒱 est donné. La masse est donnée, ou déduite de W = mg.","La masse volumique mesure la masse contenue par unité de volume.","Le poids volumique est γ = ρg ; on l’exprime ici en kN/m³.","La densité est un rapport de deux masses volumiques : elle n’a donc pas d’unité."],check:"Pour une huile, on attend généralement ρ < 1000 kg/m³ et d < 1."},
  viscosity:{hypotheses:"Fluide newtonien ; écoulement de Couette permanent ; adhérence aux deux plaques ; profil de vitesse linéaire.",why:["Toutes les longueurs doivent être en mètres avant d’utiliser les unités SI.","La contrainte est la force tangentielle rapportée à la surface sollicitée.","Le profil étant linéaire, le gradient de vitesse vaut U/e. La loi de Newton relie ce gradient à τ.","La viscosité cinématique compare les effets visqueux à l’inertie volumique du fluide."],check:"μ doit être positive et ν = μ/ρ doit avoir l’unité m²/s."},
  compressibility:{hypotheses:"Compression isotherme, masse d’eau conservée et module d’élasticité K supposé constant sur l’intervalle de pression.",why:["Le module utilise une variation de pression : il faut donc soustraire la pression initiale à la pression finale.","Le signe négatif de ΔV traduit une diminution. On présente ici sa valeur absolue pour éviter toute ambiguïté.","On applique la diminution relative au volume initial.","Le volume final doit être légèrement inférieur au volume initial, car l’eau est peu compressible.","La masse se conserve : ρ₂ = ρ₀ 𝒱₁/𝒱₂."],check:"Même sous plusieurs dizaines de bars, la variation de volume de l’eau reste généralement inférieure à quelques pourcents."},
  pressureDepth:{hypotheses:"Fluide au repos, masse volumique constante, axe vertical et pression atmosphérique uniforme à la surface.",why:["La relation fondamentale de l’hydrostatique donne une augmentation ρgh lorsqu’on descend.","La pression absolue est mesurée depuis le vide ; elle est égale à la pression relative plus la pression atmosphérique."],check:"La pression absolue doit être supérieure à la pression atmosphérique et à la pression relative."},
  layeredPressure:{hypotheses:"Deux fluides non miscibles au repos ; réservoir ouvert ; pression continue à l’interface.",why:["En descendant dans l’huile, la pression augmente de ρhuileghhuile.","La pression est continue à l’interface ; on ajoute ensuite l’accroissement dans l’eau.","La hauteur équivalente exprime la pression totale comme une colonne d’eau fictive.","1 bar = 10⁵ Pa."],check:"La contribution de chaque couche doit être positive et proportionnelle à sa masse volumique et à son épaisseur."},
  manometer:{hypotheses:"Fluides au repos ; eau et mercure non miscibles ; effets capillaires négligés. Les axes A et B peuvent être à des cotes différentes.",why:["On chemine de A vers B : la pression augmente en descendant et diminue en montant.","Le terme dominant est (ρ_Hg − ρ)gΔh, corrigé de la dénivellation des axes.","Diviser par ρeaug convertit la différence de pression en mètres de colonne d’eau."],check:"Le côté où le mercure est le plus bas correspond à la pression la plus élevée."},
  planeForce:{hypotheses:"Paroi verticale plane affleurante, surface libre à pression atmosphérique, eau au repos, pression relative.",why:["Le diagramme des pressions est un triangle : p = 0 en surface, p = ρgH au pied.","La poussée est l’aire du triangle multipliée par la largeur : F = ½ ρg H² b.","Le centre de poussée est au tiers de la hauteur mouillée depuis le pied.","Le moment de renversement au pied vaut F × H/3."],check:"Pour une paroi rectangulaire affleurante, yₚ = 2H/3 sous la surface, soit H/3 au-dessus du pied."},
  submergedGate:{hypotheses:"Vanne verticale plane entièrement immergée ; liquide au repos ; pression atmosphérique identique des deux côtés hors liquide.",why:["La profondeur moyenne est celle du centre de gravité de la vanne.","On intègre la pression hydrostatique sur l’aire, ce qui donne F = ρgAȳ.","La position résulte de l’égalité des moments de la distribution de pression et de la résultante."],check:"Le centre de poussée doit être sous le centre de gravité, mais rester à l’intérieur de la vanne."},
  venturi:{hypotheses:"Écoulement permanent, eau incompressible, Venturi horizontal, fluide parfait et pertes négligées.",why:["On convertit les diamètres en mètres avant de calculer les sections circulaires.","Le manomètre fournit directement la différence de pression entre l’entrée et le col.","La conservation de la masse impose le même débit dans les deux sections.","Bernoulli traduit la conservation de l’énergie mécanique entre 1 et 2.","On remplace V₁ et V₂ par Q/S puis on isole Q dans l’équation obtenue.","La section du col étant plus petite, sa vitesse doit être plus grande."],check:"V₂/V₁ doit être égal à S₁/S₂ = (D₁/D₂)² et p₂ doit être inférieur à p₁."},
  torricelli:{hypotheses:"Réservoir de grande section, surface et orifice à pression atmosphérique, vitesse de surface négligeable.",why:["L’aire de l’orifice est calculée après conversion du diamètre en mètres.","Bernoulli donne √(2gh) ; le coefficient Cᵈ corrige la contraction et les pertes réelles.","Le débit volumique est le produit de la section par la vitesse moyenne réelle."],check:"Cᵈ < 1 implique une vitesse et un débit réels inférieurs aux valeurs idéales."},
  jetPlate:{hypotheses:"Régime permanent ; jet libre à pression atmosphérique ; plaque fixe ; pertes dans l’impact négligées pour le bilan axial.",why:["La section du jet se calcule avec son diamètre en mètres.","Le débit est constant jusqu’à l’impact.","Après déviation tangentielle, la composante de vitesse normale à la plaque devient nulle.","Le théorème de quantité de mouvement donne l’effort F = ρQV."],check:"L’effort varie comme V² : doubler la vitesse multiplie la force par quatre."},
  jetDeflect:{hypotheses:"Auget fixe, jet libre, norme de la vitesse conservée et pression atmosphérique à l’entrée comme à la sortie.",why:["Le débit permet d’obtenir le débit massique ṁ = ρQ.","La force est liée à la différence vectorielle entre les vitesses d’entrée et de sortie.","La géométrie du triangle des vitesses donne |ΔV| = 2V sin(θ/2)."],check:"À θ = 0°, la force tend vers zéro ; à θ = 180°, elle tend vers 2ρQV."},
  colebrook:{hypotheses:"Écoulement permanent établi dans une conduite circulaire pleine ; eau incompressible ; facteur de Darcy utilisé.",why:["On convertit D, Q, ε et ν en SI puis on déduit la vitesse moyenne.","Re compare l’inertie aux effets visqueux et détermine le régime.","Colebrook est implicite : on part de λ₀ = 0,02, on recalcule le terme puis λ, jusqu’à ce que ça ne bouge plus. C’est le même λ que sur Moody.","Darcy–Weisbach transforme le frottement réparti en perte de charge."],check:"λ est généralement compris entre 0,01 et 0,08 en conduite ; h_f doit être positive. Deux ou trois itérations suffisent presque toujours."},
  moodyRead:{hypotheses:"Le diagramme de Moody est la représentation graphique de Colebrook–White : λ = λ(Re, ε/D).",why:["On entre par Re en abscisse (échelle logarithmique).","On suit la courbe de rugosité relative ε/D.","On lit λ en ordonnée (échelle logarithmique).","À droite de la ligne tiretée (turbulent rugueux), λ ne dépend plus que de ε/D."],check:"Vérifier la zone : laminaire (64/Re), transition hachurée, turbulent lisse ou rugueux."},
  minorLosses:{hypotheses:"Écoulement permanent ; même diamètre et même vitesse de référence dans toutes les singularités.",why:["La vitesse moyenne se déduit du débit et de la section.","Les pertes locales s’additionnent lorsque les coefficients utilisent la même vitesse de référence.","Chaque singularité dissipe K·V²/(2g) ; la somme donne la perte totale."],check:"Les pertes varient comme V² : une réduction du débit est très efficace pour les diminuer."},
  coaxialViscometer:{hypotheses:"Entrefer mince ; fluide newtonien ; le cylindre intérieur tourne, l’extérieur est fixe ; profil de Couette localement plan.",why:["La vitesse angulaire convertit N en rad/s.","La vitesse périphérique est celle de la paroi intérieure.","L’entrefer est la différence des deux rayons.","Le couple mesuré équilibre le moment de la contrainte visqueuse.","On isole μ à partir de C = τ(2πRᵢL)Rᵢ et τ = μU/e."],check:"μ doit être positive. Un entrefer trop grand invalide l’approximation de Couette plan."},
  capillary:{hypotheses:"Tube circulaire fin ; équilibre statique ; tension superficielle uniforme ; pesanteur constante.",why:["La composante verticale de la tension superficielle équilibre le poids de la colonne.","La loi de Jurin donne h = 4σ cosθ /(ρgd).","Inverser Jurin avec h_max fixe le diamètre minimal d’un piézomètre."],check:"Un liquide mouillant (θ < 90°) monte ; le mercure (θ > 90°) descend. h diminue si d augmente."},
  laplace:{hypotheses:"Interface sphérique unique (goutte) ou double (bulle de savon) ; tension superficielle constante.",why:["Le rayon doit être exprimé en mètres.","La loi de Laplace relie la surpression au rayon de courbure : Δp = nσ/R."],check:"Plus la goutte est petite, plus la surpression est grande. Une bulle de savon a deux interfaces."},
  idealGas:{hypotheses:"Air assimilé à un gaz parfait ; pression et température absolues ; transformation isotherme pour le volume à pₐₜₘ.",why:["La température Celsius est convertie en kelvin.","La pression est convertie en pascals.","ρ = p/(RT) pour un gaz parfait.","La masse se déduit de m = ρ𝒱.","À T constante, p𝒱 = cte donc 𝒱₂ = 𝒱₁ p₁/p₂."],check:"À 20 °C et 1 bar, on attend ρ ≈ 1,2 kg/m³ pour l’air. Ici la bouteille est à 200 bar : ρ est de l’ordre de 200 kg/m³."},
  hydraulicPress:{hypotheses:"Liquide incompressible au repos ; principe de Pascal ; conservation du volume déplacé.",why:["Le rapport des surfaces vaut le carré du rapport des diamètres.","Pascal : F₁/A₁ = F₂/A₂.","Le volume chassé se conserve : A₁x₁ = A₂x₂."],check:"Le petit piston parcourt une course beaucoup plus grande que le grand."},
  circularGate:{hypotheses:"Vanne circulaire verticale entièrement immergée ; fluide au repos ; pression relative.",why:["L’aire d’un disque est πD²/4.","La résultante est ρgAȳ.","Iᴳ = πD⁴/64 pour un disque.","Le centre de poussée est sous le centre géométrique."],check:"yₚ > ȳ et l’écart diminue quand la vanne est très profonde."},
  bargeStability:{hypotheses:"Caisson parallélépipédique ; petites inclinaisons ; pas de surfaces libres internes.",why:["Le volume déplacé est le volume immergé.","À l’équilibre, le poids égale la poussée d’Archimède.","Le centre de carène d’un ponton rectangulaire est à Te/2.","BM = I/∇ avec I = LB³/12 (B = largeur au roulis).","GM = KB + BM − KG."],check:"GM > 0 : stable ; GM < 0 : instable au roulis. Le polycopié donne GM ≈ 0,28 m."},
  pipeContinuity:{hypotheses:"Fluide incompressible ; régime permanent ; section circulaire pleine.",why:["La section se calcule après conversion du diamètre en mètres.","La vitesse moyenne est le débit divisé par la section.","Inverser Q = V·πD²/4 donne le diamètre qui réalise une vitesse cible."],check:"En AEP, on vise souvent 0,5 à 1,5 m/s. Une vitesse trop grande signale un diamètre insuffisant."},
  twoSectionContinuity:{hypotheses:"Fluide incompressible ; régime permanent ; un seul tube de courant, sans fuite latérale.",why:["Chaque section circulaire se calcule avec son diamètre.","La conservation du débit impose Q = A₁V₁ = A₂V₂.","Si le diamètre est divisé par 2, la vitesse est multipliée par 4."],check:"V₂/V₁ doit valoir (D₁/D₂)². Une vitesse aval > 3 m/s est souvent excessive en réseau."},
  networkNode:{hypotheses:"Fluide incompressible ; régime permanent ; nœud sans accumulation.",why:["Les débits entrants se déduisent de Q = AV.","La loi des nœuds impose ΣQ = 0.","Le débit restant traverse la conduite 3 et fixe sa vitesse."],check:"Q₃ doit rester positif. Une vitesse trop faible dans D₃ indique un diamètre surdimensionné."},
  convectiveAcceleration:{hypotheses:"Régime permanent ; vitesse unidimensionnelle variant linéairement le long du convergent.",why:["L’accélération locale ∂V/∂t est nulle.","Il reste le terme convectif V·dV/dx.","Au milieu, V est la moyenne des deux extrémités."],check:"Même en régime permanent, a peut atteindre plusieurs g dans un convergent court."},
  reservoirRise:{hypotheses:"Fluide incompressible ; débits constants ; surface libre horizontale ; section du réservoir constante.",why:["Le bilan de volume relie la montée du plan d’eau au débit net.","dh/dt = (Qₑ − Qₛ)/A.","Le temps est Δh divisé par cette vitesse de montée."],check:"Si Qₑ < Qₛ le niveau baisse. Un grand diamètre ralentit fortement la variation de niveau."},
  tankFilling:{hypotheses:"Débit constant ; conduite circulaire pleine ; vitesse limitée par une consigne de réseau.",why:["Le débit est le volume à livrer divisé par la durée.","La section minimale est Q/Vmax.","On en déduit le plus petit diamètre acceptable."],check:"On arrondit ensuite D au diamètre commercial supérieur."},
  distributedFlow:{hypotheses:"Prélèvement uniformément réparti ; régime permanent ; fluide incompressible.",why:["Le débit prélevé est la différence entre l’entrée et la sortie.","Le débit linéique est ce volume divisé par la longueur.","À mi-parcours, la moitié du prélèvement a déjà eu lieu."],check:"Si tout le débit est distribué, Qₛ = 0 et Q(L) = 0."},
  bernoulliSections:{hypotheses:"Fluide parfait incompressible ; régime permanent ; une ligne de courant ; pas de machine entre 1 et 2.",why:["Les vitesses viennent de la continuité.","Bernoulli convertit cote, pression et énergie cinétique.","La pression chute si on s’élève ou si le fluide accélère."],check:"p₂ doit rester positive en relatif si la conduite n’est pas en dépression."},
  drainTime:{hypotheses:"Réservoir cylindrique ; orifice en mince paroi ; régime quasi permanent ; Cᵈ constant.",why:["On calcule d’abord les deux sections.","Le bilan −A dh/dt = Cᵈ a √(2gh) se sépare.","L’intégration entre h₁ et h₂ donne le temps."],check:"La vidange totale (h₂ = 0) dure deux fois plus longtemps qu’à débit initial constant."},
  pitot:{hypotheses:"Point d’arrêt ; même cote ; fluide parfait ; le manomètre mesure p₀ − p.",why:["Le mercure convertit la dénivellation en Δp = (ρₘ − ρ)gΔh.","Bernoulli entre l’écoulement et le point d’arrêt donne V = √(2Δp/ρ)."],check:"C’est une vitesse locale, en général maximale à l’axe. Le débit demande un coefficient de profil."},
  siphon:{hypotheses:"Fluide parfait ; diamètre constant ; réservoir de grande section ; surfaces libre et sortie à pₐₜₘ.",why:["Entre surface et sortie, Bernoulli se réduit à V = √(2gΔz).","Le débit suit de la section.","Au point haut, la hauteur cinétique et z_C se paient en dépression."],check:"p_C doit rester nettement au-dessus de la pression de vapeur (~2,3 kPa à 20 °C), sinon cavitation."},
  hydraulicPower:{hypotheses:"Surfaces libres à l’atmosphère et de grande section ; Bernoulli généralisé entre les deux plans d’eau.",why:["HMT = hauteur géométrique + pertes déjà estimées.","La puissance hydraulique est ρgQH.","La puissance absorbée se déduit par le rendement."],check:"Sans pertes, HMT = H_g. Les pertes du chapitre 6 augmenteront Pₕ et P_abs."},
  froudeSimilarity:{hypotheses:"Similitude géométrique complète, même pesanteur sur le modèle et le prototype, écoulement à surface libre dominé par inertie et gravité.",why:["La similitude de Froude conserve le rapport entre forces d’inertie et de pesanteur.","Avec la même gravité, l’échelle des vitesses est la racine carrée de l’échelle des longueurs.","On applique cette échelle à la vitesse mesurée sur le modèle.","Un débit est une vitesse multipliée par une aire : λQ = λVλL².","Le débit modèle est d’abord converti de L/s en m³/s."],check:"Le prototype est plus grand : ses échelles de vitesse et de débit doivent être supérieures à 1."},
  manningChannel:{hypotheses:"Écoulement permanent uniforme, canal prismatique rectangulaire, pente faible et profondeur constante.",why:["Seules les parois en contact avec l’eau forment le périmètre mouillé ; la surface libre n’en fait pas partie.","Le rayon hydraulique représente l’efficacité hydraulique de la section.","En régime uniforme, la pente de fond égale la pente de la ligne d’énergie.","Le débit est la vitesse moyenne multipliée par la section mouillée.","Froude compare la vitesse de l’écoulement à la célérité des ondes de gravité."],check:"Fr < 1 indique un régime fluvial ; Fr > 1 un régime torrentiel ; Fr = 1 le régime critique."},
  jetMobile:{hypotheses:"Jet libre ; auget en U qui retourne le jet à 180° ; |V| conservée dans le référentiel de l’auget ; frottements négligés.",why:["Sur l’auget fixe, ΔV axial = 2V donc F = 2ρQV.","Dès que l’auget avance, seule la vitesse relative V−u compte.","La force mobile est 2ρA(V−u)².","La puissance mécanique est le produit F·u.","Maximiser P(u) donne u = V/3 ; l’auget isolé récupère au plus 8/27 de la puissance cinétique du jet."],check:"Si u = V/3, F_mobile = 8ρAV²/9. Si u ≥ V la force et la puissance s’annulent."},
  elbowForce:{hypotheses:"Coude horizontal à 90°, diamètre constant, fluide parfait : p et V se conservent. Le poids de l’eau n’intervient pas dans le plan horizontal.",why:["La section et la vitesse se calculent avec D en mètres et Q en m³/s.","Le terme de pression pA est en général dominant.","Le terme ρQV est la variation de quantité de mouvement.","Les deux composantes sont égales : l’eau pousse le coude vers l’extérieur.","La résultante vaut √2(pA+ρQV) et oriente le massif d’ancrage."],check:"Même à l’arrêt (V = 0), le coude sous pression pousse sur sa butée. pA >> ρQV aux vitesses d’AEP."},
  convergentForce:{hypotheses:"Convergent horizontal, fluide parfait, régime permanent. p₂ vient de Bernoulli ; l’effort vient d’Euler.",why:["Continuité : V₂/V₁ = (D₁/D₂)².","Bernoulli horizontal donne p₂ < p₁.","Le bilan axial compte pressions et flux de quantité de mouvement.","F > 0 signifie que l’eau pousse le convergent vers l’aval : les brides travaillent en traction."],check:"p₂ doit rester positive. F est souvent de l’ordre de quelques kN."},
  jetReaction:{hypotheses:"Orifice latéral profilé (Cᵈ = 1) ; réservoir de grande section ; frottement des rouleaux négligé.",why:["Torricelli fixe V = √(2gh).","Le débit est AV.","Le volume de contrôle « réservoir » : la quantité de mouvement sort à V, d’où F = ρQV = 2ρghA."],check:"F vaut le double de la poussée hydrostatique sur un bouchon. C’est le principe de la propulsion par réaction."},
  inclinedPlate:{hypotheses:"Plaque lisse ; pesanteur négligée ; |V| conservée le long de la plaque ; réaction purement normale.",why:["Aucune force tangentielle : le flux tangentiel de quantité de mouvement se conserve.","La projection normale donne Fₙ = ρQV sinθ.","La continuité et le bilan tangentiel partagent le débit : Q₊ = Q(1+cosθ)/2."],check:"À θ = 60°, les trois quarts du débit partent vers l’aval. À θ = 90° on retrouve F = ρQV et Q₊ = Q₋."},
  reynoldsRegime:{hypotheses:"Conduite circulaire pleine ; ν constante ; régime lu sur Re = VD/ν.",why:["V = Q/A après conversion en SI.","Re compare inertie et viscosité.","Seuils usuels : laminaire < 2000, turbulent > 4000."],check:"L’eau en réseau urbain est presque toujours turbulente. Une huile visqueuse peut rester laminaire."},
  hydraulicDiameter:{hypotheses:"Gaine rectangulaire pleine ; Dₕ = 4A/P remplace D dans Re.",why:["A = ab et P = 2(a+b) pour une section fermée.","Dₕ = 2ab/(a+b).","Re = V Dₕ/ν."],check:"Pour un cercle, Dₕ = D. Une section très aplatie a un Dₕ proche de 2b."},
  fallingFilm:{hypotheses:"Film laminaire permanent ; pression atmosphérique uniforme ; adhérence au parement ; contrainte nulle à la surface libre.",why:["Navier–Stokes se réduit à l’équilibre pesanteur/viscosité.","Le profil est un demi-Poiseuille : sommet à la surface libre.","q s’obtient en intégrant u(y).","Le Reynolds du film doit être contrôlé a posteriori : sinon le calcul laminaire n’est pas valable."],check:"Un film d’eau de 2 mm sur 30° est en réalité turbulent. Le même calcul est correct pour une huile visqueuse."},
  poiseuilleOil:{hypotheses:"Écoulement laminaire établi, conduite circulaire horizontale, fluide newtonien.",why:["On calcule V puis Re pour confirmer le laminaire.","λ = 64/Re est exact (solution de Poiseuille).","Darcy–Weisbach donne h_f, puis Δp = ρgh_f.","La puissance dissipée est QΔp."],check:"Re doit rester < 2000. Les fluides visqueux coûtent cher à transporter : P peut dépasser 500 W pour 1 L/s."},
  gravityPipe:{hypotheses:"Deux surfaces libres à pₐₜₘ ; H entièrement consommée par λL/D et ΣK ; λ par Colebrook.",why:["Bernoulli entre plans d’eau : H = (λL/D+ΣK)V²/(2g).","λ dépend de V : on itère.","La vitesse convergée donne Q = AV."],check:"Sur une conduite longue, ΣK est souvent quelques pourcents de λL/D. V doit rester dans 0,5–2 m/s."},
  pipeSizing:{hypotheses:"Pertes singulières négligées ; série commerciale 150–400 mm ; λ par Colebrook.",why:["La charge H doit rester ≥ h_f.","On teste les DN croissants.","On retient le plus petit DN admissible et sa vitesse."],check:"V trop grande (DN trop petit) impose une pompe. V trop faible (surdimensionnement) coûte cher et favorise les dépôts."},
  pumpStation:{hypotheses:"Bernoulli généralisé entre deux plans d’eau ; λ donné et identique à l’aspiration et au refoulement.",why:["Chaque côté a sa propre vitesse V = Q/A.","Les pertes sont (λL/D+K)V²/(2g).","HMT = Δz + h_asp + h_ref.","Pₕ = ρgQHMT et P_abs = Pₕ/η."],check:"Les pertes peuvent représenter un tiers de la HMT. Agrandir le refoulement réduit souvent P_abs plus que l’aspiration."},
  bordaCarnot:{hypotheses:"Élargissement brusque ; théorème d’Euler + Bernoulli généralisé ; conduite horizontale.",why:["Les vitesses suivent la continuité.","hₛ = (V₁−V₂)²/(2g).","p₂ − p₁ = ½ρ(V₁²−V₂²) − ρghₛ : récupération partielle."],check:"p₂ > p₁ (ralentissement) mais moins qu’en fluide parfait. Un divergent lent récupérerait presque tout."},
  reynoldsDrag:{hypotheses:"Similitude de Reynolds, même fluide sur modèle et prototype.",why:["Reₘ = Reₚ impose Vₘ = N Vₚ.","F ~ ρV²L² donne alors Fₚ = Fₘ.","Le prix à payer est une vitesse d’essai N fois plus grande."],check:"Fₚ = Fₘ n’est vrai que si le fluide est le même. En pratique on préfère souvent la similitude automatique en turbulent rugueux."},
  froudeSpillway:{hypotheses:"Similitude de Froude, même fluide, même g. N = Lₚ/Lₘ.",why:["λQ = N^(5/2) donc Qₘ = Qₚ/N^(5/2).","λV = λt = √N.","λF = N³ (même fluide)."],check:"Qₘ doit rester praticable en laboratoire (quelques L/s à quelques m³/s). Ne pas inverser N."},
  stokesViscosity:{hypotheses:"Vitesse limite ; régime de Stokes (Re ≲ 1) ; traînée 3πμdV.",why:["Poids − Archimède = traînée.","On isole μ = (ρₛ−ρ)gd²/(18V).","On calcule Re a posteriori."],check:"Si Re > 1, Stokes n’est plus valable (correction d’Oseen). C’est le principe du viscosimètre à chute de bille."},
  trapezoidalChannel:{hypotheses:"Régime permanent uniforme ; section trapézoïdale ; pente faible.",why:["A = (b+zy)y et P = b+2y√(1+z²).","R = A/P puis V = KₛR^(2/3)√S.","Fr utilise la profondeur moyenne A/T, pas y."],check:"S est en ‰. Fr < 1 : le canal est commandé par l’aval."},
  normalDepth:{hypotheses:"Canal rectangulaire prismatique ; Q, S et Kₛ connus ; yₙ inconnue.",why:["Q = by · Kₛ · [by/(b+2y)]^(2/3) · √S.","On résout par dichotomie.","V = Q/A et Fr = V/√(gy) classent le régime."],check:"Proche de Fr = 1, un petit changement de section peut basculer en torrentiel."},
  waveCelerity:{hypotheses:"Petite intumescence ; canal large ; c = √(gy) ; structure en caractéristiques de Saint-Venant.",why:["c = √(gy) est la célérité relative à l’eau.","Les fronts avancent à V+c et reculent à c−V.","Le temps amont est L/(c−V)."],check:"Si Fr > 1, c−V < 0 : aucune information ne remonte. En fluvial, toute manœuvre se sent à l’amont."},
  damBreakRitter:{hypotheses:"Rupture instantanée ; fond horizontal sec ; Saint-Venant sans frottement (solution de Ritter).",why:["Le front dévale à 2√(gh₀).","Au droit du barrage, h = 4h₀/9 et V = 2√(gh₀)/3.","t = x/c_f."],check:"Ritter est un majorant pédagogique. Le frottement et la vallée réelle ralentissent le front."},
  damSluice:{hypotheses:"Vanne plane verticale ; aval à sec ; frottement de glissière μ ; orifice sous la charge au centre une fois ouverte.",why:["ȳ = h_seuil − H/2.","F = ρgAȳ, yₚ = ȳ + Iᴳ/(Aȳ).","T = W + μF au décollement.","Q = CᵈA√(2gȳ)."],check:"À grande profondeur relative, yₚ ≈ ȳ. Le frottement dû à F dimensionne souvent le treuil, pas le poids propre."},
  npshCavitation:{hypotheses:"Bernoulli en pressions absolues entre le plan d’eau et l’entrée de pompe ; NPSH_d à comparer à NPSHᵣ.",why:["V et h_asp se calculent sur la conduite d’aspiration.","pₑ vient de Bernoulli (dépression fréquente en aspiration).","NPSH_d = pₐₜₘ/ρg − pᵥ/ρg − Hₛ − h_asp.","z_max impose la marge demandée."],check:"NPSH_d doit dépasser NPSHᵣ. Une crépine encrassée ou un plan d’eau plus bas réduit la marge."},
  waterCannon:{hypotheses:"Fluide parfait, lance horizontale, sortie à l’air libre. Continuité + Bernoulli, puis Euler sur la lance et sur l’écran.",why:["V₂² − V₁² = 2p₁/ρ avec V₁/V₂ = (d/D₁)².","Écran normal : F = ρQV₂.","Le recul est p₁A₁ − ρQ(V₂−V₁), vers l’amont."],check:"V₂ est de l’ordre de √(2p/ρ) : 8 bar → environ 40 m/s. Le recul se compte en kN."},
  cofferdamBallast:{hypotheses:"Caisson étanche ; flottaison à vide puis pose sur fond ; eau de mer.",why:["Tₑ = W/(ρgLB).","GM = KB+BM−KG avec I = LB³/12.","Posé : Π = ρgLBh. Le ballast complète W+R=Π."],check:"GM > 0 au remorquage. 𝒱_b doit rester inférieur au volume interne du caisson."},
  oilSeason:{hypotheses:"Même Q été et hiver ; conduite lisse (ε≈0) ; λ par Colebrook ou 64/Re.",why:["On calcule V une fois.","Chaque saison a son Re, son λ et sa h_f.","P_abs = ρgQh_f/η."],check:"Près de Re = 2000 le régime est instable. Un passage au laminaire peut paradoxalement diminuer P."},
  retainingWall:{hypotheses:"Parement vertical ; poussée relative ; moment au pied aval ; pas de sous-pression ici.",why:["F = ρgH²/2 par mètre, à H/3 du pied.","W = ρ_c g t H_mur.","FS = (W t/2)/(F H/3)."],check:"FS > 1,5 est souvent exigé. Il resterait à vérifier glissement et sous-pressions."},
  gravityValve:{hypotheses:"H constante ; λ par Colebrook ; à demi-débit on recalcule λ puis on isole Kᵥ.",why:["D’abord le débit actuel avec ΣK = K_autres+Kᵥ₀.","V' = V/2, nouveau λ'.","Kᵥ = 2gH/V'² − λ'L/D − K_autres."],check:"Réduire Q de moitié exige un Kᵥ très grand : le réglage par vanne est raide en fin de course."},
  viscosityForce:{hypotheses:"Couette plan, fluide newtonien, profil linéaire, vitesse constante.",why:["Le gradient de vitesse est constant : du/dy = U/e.","τ = μU/e.","F = τA est la force de traction qui équilibre le frottement.","La puissance dissipée P = FU est transformée en chaleur dans le film."],check:"e en mètres. τ, F et P doivent être positifs."},
  inclinedCircularGate:{hypotheses:"Disque plan dans une paroi inclinée ; fluide au repos ; pression relative.",why:["La poussée ne dépend que de la profondeur du centre : F = ρg A h_G.","Sur la paroi, y_G = h_G / sin α.","Iᴳ = πD⁴/64 pour un disque.","y_C − y_G = Iᴳ/(y_G A) ; l’écart diminue si h_G augmente."],check:"À α = 90° on retrouve la vanne verticale. dy doit rester petit devant D."},
  quarterCylinder:{hypotheses:"Quart de cylindre ; surface libre affleurant la génératrice haute ; eau du côté concave.",why:["F_H est la poussée sur la projection verticale (rectangle R×b), soit ½ ρg R² b.","F_V est le poids du volume d’eau réellement au-dessus de la vanne (carré moins quart de cercle).","La résultante est √(F_H²+F_V²).","Toutes les forces élémentaires sont radiales : la résultante passe par l’axe."],check:"F_V < F_H ici : β d’environ 23°. F_V est dirigée vers le bas."},
  archimedesCaisson:{hypotheses:"Archimède ; eau douce pour le bloc, eau de mer pour le caisson ; caisson étanche.",why:["Tension du câble = poids apparent = (ρ_béton − ρ_eau) g 𝒱.","Le caisson flotte si F_A,max > W.","Tₑ = W /(ρ g L B).","Le franc-bord est H − Tₑ."],check:"Tₑ < H sinon le caisson est complètement immergé et ne flotte plus."},
  bearingLoss:{hypotheses:"Jeu mince assimilé à un Couette cylindrique déroulé.",why:["U = ωR avec ω = 2πN/60.","τ = μU/e.","C = τ(2πRL)R et P = Cω."],check:"N est en tr/min. Un jeu trop grand invalide l’approximation."},
  pressureUnits:{hypotheses:"g = 9,81 m/s² ; ρeau = 1000 kg/m³ ; ρHg = 13600 kg/m³ ; 1 psi = 6894,757 Pa.",why:["1 bar = 10⁵ Pa.","p = ρₘ g h pour une colonne de mercure.","On divise par ρeau g pour obtenir des mCE."],check:"2,5 bar ≈ 25,5 mCE. 760 mmHg ≈ 10,3 mCE."},
  pipeGage:{hypotheses:"Prise au centre de la conduite ; ménisque bas = côté mercure du côté conduite ; l’autre branche à l’atmosphère.",why:["On chemine : +ρgz en descendant, −ρₘgΔh en remontant le mercure.","p = (ρₘ Δh − ρ z) g."],check:"Si z est trop grand devant Δh, p peut devenir petite, voire négative (incohérent pour ce montage)."},
  woodLog:{hypotheses:"Bois homogène ; eau douce ; flottaison d’équilibre.",why:["𝒱 = πD²L/4.","𝒱_imm = d 𝒱.","m = d ρeau 𝒱."],check:"d < 1 sinon le tronc coule. 𝒱_imm < 𝒱."},
  iceberg:{hypotheses:"Archimède ; densités constantes.",why:["ρᵢ 𝒱 = ρₑ 𝒱_imm.","Fraction émergée = 1 − ρᵢ/ρₑ."],check:"On attend environ 10 % émergé en eau de mer."},
  channelDischarge:{hypotheses:"Section rectangulaire pleine à la profondeur y ; vitesse moyenne donnée.",why:["A = by.","Q = AV, puis ×3600 pour m³/h."],check:"Q en m³/h est 3600 fois Q en m³/s."},
  pitotWater:{hypotheses:"Hauteur dynamique déjà exprimée en mm d’eau ; point d’arrêt.",why:["h = V²/2g.","V = √(2gh) après conversion en mètres."],check:"95 mm d’eau → V ≈ 1,4 m/s, plausible en rivière."},
  turbinePower:{hypotheses:"Chute nette déjà corrigée des pertes ; rendement global.",why:["Pₕ = ρgQH.","P = η Pₕ."],check:"Q est déjà en m³/s. 2,4 m³/s sous 38 m et η=0,88 → environ 800 kW."},
  momentumHold:{hypotheses:"Jet libre horizontal ; chariot sans frottement.",why:["ṁ = ρQ.","F = ρQV pour retenir le chariot."],check:"15 L/s à 12 m/s → F = 180 N."},
  froudeForceTime:{hypotheses:"Similitude de Froude, même fluide.",why:["λt = √N.","λF = N³."],check:"N=25, tₘ=1,6 s → tₚ=8 s ; Fₚ = 46×15625 ≈ 719 kN."},
  froudeScale:{hypotheses:"Similitude de Froude ; N = Lₚ/Lₘ.",why:["λV = √N.","Qₘ = Qₚ / N^(5/2)."],check:"N=40, Qₚ=950 m³/s → Qₘ ≈ 94 L/s, praticable en labo."},
  reynoldsSpeed:{hypotheses:"Même fluide, Reₘ = Reₚ.",why:["Vₘ Lₘ = Vₚ Lₚ.","Vₚ = Vₘ/N."],check:"Le prototype est plus lent : 15 m/s au 1/10 représentent 1,5 m/s en vraie grandeur."},
  idealGasTwo:{hypotheses:"Air assimilé à un gaz parfait ; p et T absolues ; R de l’air = 287 J/(kg·K).",why:["Chaque état a sa propre température en kelvin.","Chaque pression est convertie en pascals.","ρ = p/(RT) s’applique indépendamment aux deux états."],check:"À 0 °C et 1,013 bar on attend ρ ≈ 1,29 kg/m³. Plus T augmente, plus ρ diminue."},
  reynoldsTwo:{hypotheses:"Conduite circulaire pleine ; ν constante dans chaque cas ; seuils 2000 / 4000.",why:["Re = VD/ν après conversion de D en mètres et de ν en m²/s.","On calcule séparément le cas eau et le cas huile.","On lit le régime sur Re, pas sur la vitesse seule."],check:"L’eau lente dans un petit tube peut être laminaire ; une huile visqueuse l’est souvent même à 1 m/s."},
  kinematicField:{hypotheses:"Écoulement plan bidimensionnel ; u = kx², v = −2kxy ; on évalue la cinématique locale.",why:["Incompressibilité 2D : ∂u/∂x + ∂v/∂y = 0.","Le rotationnel plan est ω_z = ∂v/∂x − ∂u/∂y.","Ici div = 0 partout, mais ω_z = −2ky n’est nul que sur y = 0."],check:"Un champ incompressible n’est pas forcément irrotationnel. Le rotationnel dépend du point."},
  dimensionsMLT:{hypotheses:"Système M, L, T du cours ; chaque grandeur mécanique s’écrit Mᵅ Lᵝ Tᵞ.",why:["On part d’une définition (P = FV, σ = F/A, …).","On remplace F = MLT⁻² et on collecte les exposants.","Le tableau du §7.1 se relit ainsi, sans calcul numérique."],check:"La puissance est M L² T⁻³, pas M L T⁻² (qui est une force). Le couple a la dimension d’une énergie."},
  pendulumPi:{hypotheses:"T = k Lᵃ gᵇ mᶜ ; k sans dimension ; g a la dimension L T⁻².",why:["[T] = T doit égaler Lᵃ (L T⁻²)ᵇ Mᶜ.","La masse n’apparaît pas : c = 0.","a + b = 0 et −2b = 1 donnent a = 1/2, b = −1/2."],check:"T ∝ √(L/g). La période d’un pendule simple ne dépend pas de la masse."},
  propellerPi:{hypotheses:"P = k ρᵃ nᵇ Dᶜ ; n en s⁻¹ (tours par seconde), pas en tr/min.",why:["[P] = M L² T⁻³ et [ρ] = M L⁻³, [n] = T⁻¹, [D] = L.","Identification : a = 1, b = 3, c = 5.","On retrouve P = ρ n³ D⁵ f(…), forme classique des hélices."],check:"n doit être en s⁻¹. Confondre avec tr/min fausse toute l’homogénéité."},
  twoFluidsShear:{hypotheses:"Même Couette plan pour les deux fluides newtoniens ; adhérence ; U et e identiques.",why:["Le gradient U/e est commun.","Le fluide A suit τ = μ U/e.","Le fluide B aussi, avec sa propre viscosité.","Le rapport des forces égale le rapport des μ : ρ n’entre pas dans τ."],check:"ν = μ/ρ sert au Reynolds, pas à l’effort de traction. Un fluide plus visqueux « accroche » plus, même s’il est plus léger."},
  viscosityTemp:{hypotheses:"μ interpolée linéairement entre deux points de tableau ; Couette plan à la température de service.",why:["Entre T₁ et T₂, μ(T) est pris linéaire.","τ = μ(T) U/e.","F = τA.","Le rapport μ/μ(T₁) mesure l’effet de la température."],check:"Hors de [T₁, T₂] l’interpolation n’est qu’indicative. Pour l’eau et les huiles, μ diminue quand T augmente."},
  dualSideGate:{hypotheses:"Vanne verticale entièrement mouillée des deux côtés (y₁ et y₂ plus grands que a) ; pressions relatives ; fluide au repos.",why:["Les centres de gravité sont à a/2 sous chaque plan d’eau.","F₁ = ρgAȳ₁.","F₂ = ρgAȳ₂.","Le net vaut ρgA(y₁−y₂).","Le bras du net se déduit des moments des deux poussées."],check:"Si y₁ = y₂, F = 0. Le centre de poussée net n’est pas au milieu de la vanne dès que y₁ ≠ y₂."},
  lockDoor:{hypotheses:"Porte d’écluse plane verticale affleurant le radier ; triangles de pression amont et aval ; articulations haut et bas.",why:["Amont : F₁ = ½ρgH²b à H/3 du radier.","Aval : même formule avec h.","L’effort net pousse vers le bief aval.","Le moment au palier bas dimensionne la butée et le vérin."],check:"H = h ⇒ F = 0 et M = 0. Une dénivelée même modeste crée un moment important sur une porte large."},
  piezometricLine:{hypotheses:"Conduite horizontale d’axe z = 0 ; charge H au plan d’eau amont ; Darcy + K d’entrée, de vanne (à mi-parcours) et de sortie.",why:["V et λ viennent de Q, D et Colebrook.","h_f et h_s se calculent avec V²/2g.","Juste après l’entrée, on a déjà perdu K_e V²/2g et il reste V²/2g sur l’EGL.","À mi-parcours : moitié de h_f plus K_v.","En bout de conduite, HGL = H − Σ pertes − V²/2g."],check:"HGL doit rester positive le long de l’axe. Une HGL négative signifie dépression ou débit trop fort pour H."},
  diameterEconomy:{hypotheses:"Trois DN imposés ; même Q et L ; λ par Colebrook ; coût réduit C = αD + β h_f.",why:["On calcule V, λ et h_f pour chaque DN.","C combine un terme proportionnel au diamètre (tube) et un terme aux pertes.","On compare les trois C.","Le plus petit C est retenu."],check:"α et β sont des poids pédagogiques, pas un devis. Un DN trop petit fait exploser h_f ; trop grand coûte du tube pour peu de gain."},
  pumpDutyPoint:{hypotheses:"Pompe H = H₀ − kQ² ; réseau H = H_g + (λL/D+ΣK)V²/2g ; λ par Colebrook, itéré avec Q.",why:["La pompe chute quand Q augmente.","Le réseau monte comme Q².","On égalise et on itère λ(Q).","V = Q/A contrôle le calage."],check:"Si H₀ < H_g la pompe ne démarre pas. k trop grand (pompe « molle ») donne un petit débit."},
  thinWeir:{hypotheses:"Seuil mince, nappe aérée, approche négligée dans Cᵈ ; charge h mesurée au-dessus de la crête.",why:["h est la charge sur le seuil.","L’intégration de Torricelli sur la lame donne Q ∝ L h^{3/2}.","q = Q/L compare des seuils de longueurs différentes."],check:"Q varie comme h^{3/2} : doubler h multiplie Q par 2√2 ≈ 2,8, pas par 2. Cᵈ < 1."},
  hydraulicJump:{hypotheses:"Canal rectangulaire horizontal ; ressaut stationnaire ; frottement de paroi négligé entre les deux sections conjuguées.",why:["Fr₁ = V₁/√(gy₁) doit être > 1.","La conjugaison vient d’Euler + continuité.","ΔE est dissipée en turbulence.","L_r ≈ 6 y₂ est une longueur d’ordre de grandeur."],check:"Pas de ressaut si Fr₁ < 1. y₂ > y₁. ΔE croît très vite avec Fr₁."},
  criticalRegime:{hypotheses:"Canal rectangulaire large ; écoulement permanent ; y_c = (Q²/(gb²))^{1/3}.",why:["V = Q/(by).","y_c est la profondeur qui minimise E.","Fr ≶ 1 classe fluvial / torrentiel.","On compare E à E_c = 3y_c/2."],check:"y > y_c ⇔ Fr < 1 (fluvial). Au voisinage de y_c, E est minimale : un petit seuil peut faire basculer le régime."}
};

const equationSheets={density:["𝒱 = πD²h/4 (cylindre)","m = W/g","ρ = m/𝒱","γ = ρg","d = ρ/ρeau"],viscosity:["τ = F/A","τ = μU/e","ν = μ/ρ"],coaxialViscometer:["ω = 2πN/60","U = ωRᵢ","τ = μU/e","C = τ(2πRᵢL)Rᵢ"],compressibility:["K = −Δp/(Δ𝒱/𝒱)","Δp = p₂−p₁","ρ₂ = ρ₀ 𝒱₁/𝒱₂"],capillary:["h = 4σcosθ/(ρgd)","D_min = 4σ/(ρg h_max)"],laplace:["Goutte : Δp = 2σ/R","Bulle : Δp = 4σ/R"],idealGas:["p = ρRT","T(K) = T(°C)+273,15","m = ρ𝒱","𝒱₂ = 𝒱₁ p₁/p₂"],pressureDepth:["p−pₐₜₘ = ρgh","pabs = pₐₜₘ+ρgh"],layeredPressure:["Δp = ρgΔh","p_fond = Σρᵢghᵢ","1 bar = 10⁵ Pa"],manometer:["Descente : +ρgΔz","Montée : −ρgΔz"],hydraulicPress:["F₁/A₁ = F₂/A₂","A₁x₁ = A₂x₂"],planeForce:["F = ½ρgH²b","z_C = H/3","M = F H/3"],submergedGate:["ȳ = y₀+H/2","F = ρgAȳ","yₚ = ȳ+Iᴳ/(Aȳ)"],circularGate:["A = πD²/4","Iᴳ = πD⁴/64","F = ρgAȳ"],bargeStability:["BM = I/∇","GM = KB+BM−KG","Stable si GM > 0"],venturi:["Q = S₁V₁ = S₂V₂","p/ρg+V²/2g+z = cte","Δp = (ρm−ρ)gΔh"],torricelli:["V = Cᵈ√(2gh)","Q = SV"],jetPlate:["ΣF⃗ = ṁ(V⃗₂−V⃗₁)","F = ρQV"],jetDeflect:["F = 2ρQVsin(θ/2)"],colebrook:["Re = VD/ν","Moody : λ = λ(Re, ε/D)","1/√λ = −2log₁₀[ε/(3,7D)+2,51/(Re√λ)]","h_f = λ(L/D)V²/(2g)"],minorLosses:["h_s = ΣK·V²/(2g)"],froudeSimilarity:["Fr = V/√(gL)","λV = √λL","λQ = λL^(5/2)"],manningChannel:["R = A/P","V = KₛR^(2/3)√S","Fr = V/√(gy)"],pipeContinuity:["Q = AV","A = πD²/4","D = √(4Q/πV)"],twoSectionContinuity:["Q = A₁V₁ = A₂V₂","A = πD²/4","V₂/V₁ = (D₁/D₂)²"],networkNode:["Q = AV","ΣQₑ = ΣQₛ","V₃ = Q₃/A₃"],convectiveAcceleration:["a = ∂V/∂t + V·dV/dx","permanent : a = V dV/dx"],reservoirRise:["A dh/dt = Qₑ − Qₛ","t = AΔh/(Qₑ − Qₛ)"],tankFilling:["Q = 𝒱/t","A = Q/V","D = √(4A/π)"],distributedFlow:["Q(x) = Qₑ − qx","q = (Qₑ − Qₛ)/L"],bernoulliSections:["Q = A₁V₁ = A₂V₂","p/ρg + V²/2g + z = cte"],drainTime:["−A dh/dt = Cᵈa√(2gh)","t = 2A(√h₁−√h₂)/(Cᵈa√(2g))"],pitot:["Δp = (ρₘ − ρ)gΔh","V = √(2Δp/ρ)"],siphon:["V = √(2gΔz)","p_C = pₐₜₘ − ρg(z_C + V²/2g)"],hydraulicPower:["HMT = H_g + h_pertes","Pₕ = ρgQH","P_abs = Pₕ/η"],jetMobile:["F_fixe = 2ρQV","F = 2ρA(V−u)²","P = Fu","u_opt = V/3"],elbowForce:["Fₓ = Fᵧ = pA+ρQV","F = √2(pA+ρQV)"],convergentForce:["p+½ρV² = cte","F = p₁A₁−p₂A₂−ρQ(V₂−V₁)"],jetReaction:["V = √(2gh)","F = ρQV = 2ρghA"],inclinedPlate:["Fₙ = ρQV sinθ","Q₊ = Q(1+cosθ)/2"],reynoldsRegime:["V = Q/A","Re = VD/ν"],hydraulicDiameter:["Dₕ = 4A/P","Re = VDₕ/ν"],fallingFilm:["u(e) = ρge²sinα/(2μ)","q = ρge³sinα/(3μ)"],poiseuilleOil:["λ = 64/Re","h_f = λ(L/D)V²/(2g)","P = QΔp"],gravityPipe:["H = (λL/D+ΣK)V²/(2g)","Q = AV"],pipeSizing:["h_f = λ(L/D)V²/(2g)","retenir min DN avec h_f ≤ H"],pumpStation:["HMT = Δz+h_asp+h_ref","Pₕ = ρgQH","P_abs = Pₕ/η"],bordaCarnot:["hₛ = (V₁−V₂)²/(2g)","p₂−p₁ = ½ρ(V₁²−V₂²)−ρghₛ"],reynoldsDrag:["Reₘ = Reₚ","Fₚ = Fₘ (même fluide)"],froudeSpillway:["λQ = N^(5/2)","λV = λt = √N","λF = N³"],stokesViscosity:["μ = (ρₛ−ρ)gd²/(18V)","Re = ρVd/μ"],trapezoidalChannel:["A = (b+zy)y","P = b+2y√(1+z²)","V = KₛR^(2/3)√S"],normalDepth:["Q = A Kₛ R^(2/3)√S","Fr = V/√(gy)"],waveCelerity:["c = √(gy)","t = L/(c−V)"],damBreakRitter:["c_f = 2√(gh₀)","h = 4h₀/9","V = 2√(gh₀)/3"],damSluice:["F = ρgAȳ","T = W+μF","Q = CᵈA√(2gȳ)"],npshCavitation:["NPSH_d = pₐₜₘ/ρg−pᵥ/ρg−Hₛ−h_asp","h_asp=(λL/D+K)V²/(2g)"],waterCannon:["V₂²−V₁²=2p₁/ρ","F=ρQV₂","F_recul=p₁A₁−ρQ(V₂−V₁)"],cofferdamBallast:["Tₑ=W/(ρgLB)","GM=KB+BM−KG","W+W_b+R=Π"],oilSeason:["Re=VD/ν","h_f=λ(L/D)V²/(2g)","P=ρgQh_f/η"],retainingWall:["F=ρgH²/2","y=H/3","FS=(Wt/2)/(FH/3)"],gravityValve:["H=(λL/D+ΣK)V²/(2g)","Kᵥ=2gH/V'²−λ'L/D−K_autres"],viscosityForce:["τ=μU/e","F=τA","P=FU"],inclinedCircularGate:["F=ρgAh_G","y_G=h_G/sinα","y_C−y_G=Iᴳ/(y_G A)"],quarterCylinder:["F_H=½ρgR²b","F_V=ρgR²(1−π/4)b","F=√(F_H²+F_V²)"],archimedesCaisson:["T=(ρ_b−ρ)g𝒱","Tₑ=W/(ρgLB)"],bearingLoss:["τ=μU/e","C=τ(2πRL)R","P=Cω"],pressureUnits:["1 bar=10⁵ Pa","p=ρgh","h=p/(ρeau g)"],pipeGage:["p=(ρₘΔh−ρz)g"],woodLog:["𝒱_imm=d𝒱","m=dρ𝒱"],iceberg:["émergé=1−ρᵢ/ρₑ"],channelDischarge:["Q=byV"],pitotWater:["V=√(2gh)"],turbinePower:["P=ηρgQH"],momentumHold:["F=ρQV"],froudeForceTime:["tₚ=tₘ√N","Fₚ=FₘN³"],froudeScale:["λV=√N","Qₘ=Qₚ/N^(5/2)"],reynoldsSpeed:["Vₚ=Vₘ/N"],idealGasTwo:["T(K)=T(°C)+273,15","ρ=p/(RT)"],reynoldsTwo:["Re=VD/ν","laminaire < 2000 < transition < 4000 < turbulent"],kinematicField:["div V⃗=∂u/∂x+∂v/∂y","ω_z=∂v/∂x−∂u/∂y"],dimensionsMLT:["[P]=ML²T⁻³","[C]=ML²T⁻²","[σ]=ML⁻¹T⁻²","[ṁ]=MT⁻¹","[σ_s]=MT⁻²","[dp/dx]=ML⁻²T⁻²"],pendulumPi:["T=k Lᵃ gᵇ mᶜ","T∝√(L/g)"],propellerPi:["P=k ρᵃ nᵇ Dᶜ","P=ρ n³ D⁵ f(…)"],moodyRead:["Moody : λ=λ(Re, ε/D)","1/√λ=−2log₁₀[ε/(3,7D)+2,51/(Re√λ)]","rugueux : 1/√λ=−2log₁₀(ε/3,7D)"],twoFluidsShear:["τ=μU/e","F=τA","ν=μ/ρ","F_B/F_A=μ_B/μ_A"],viscosityTemp:["μ(T) interpolé","τ=μU/e","F=τA"],dualSideGate:["F=ρgAȳ","F_net=ρgA(y₁−y₂)"],lockDoor:["F=½ρgH²b","M=F₁H/3−F₂h/3"],piezometricLine:["HGL=p/ρg+z","EGL=HGL+V²/2g","h_f=λ(L/D)V²/2g"],diameterEconomy:["h_f=λ(L/D)V²/2g","C=αD+β h_f"],pumpDutyPoint:["H_p=H₀−kQ²","H_n=H_g+rQ²"],thinWeir:["Q=Cᵈ L √(2g) h^{3/2}"],hydraulicJump:["Fr=V/√(gy)","y₂/y₁=½(−1+√(1+8Fr₁²))","ΔE=(y₂−y₁)³/(4y₁y₂)"],criticalRegime:["y_c=(Q²/(gb²))^{1/3}","Fr=V/√(gy)","E=y+V²/2g"]};
const esc = value => String(value).replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
const parse = value => Number(String(value).trim().replace(",", ".").replace(/\s/g, ""));
const randomValue = v => Number((Math.round((v.min + Math.random() * (v.max - v.min)) / v.step) * v.step).toFixed(8));
const formatTime = seconds => `${String(Math.floor(seconds / 60)).padStart(2,"0")}:${String(seconds % 60).padStart(2,"0")}`;
const toast = text => { const el = document.querySelector("#toast"); el.textContent = text; el.classList.add("show"); setTimeout(() => el.classList.remove("show"), 1800); };

const chapterOrder = {
  properties: ["PROP_DENSITY_01", "PROP_COMPRESS_01", "PROP_VISC_01", "PROP_VISCOMETER_02", "PROP_CAPILLARY_03", "PROP_LAPLACE_04", "PROP_GAS_05", "COMP_TWOFLUID_01", "COMP_VISCTEMP_01"],
  hydrostatics: ["HYDRO_LAYERS_01", "HYDRO_MANO_01", "HYDRO_PRESS_03", "FORCE_GATE_02", "FORCE_PLANE_01", "HYDRO_INCLINED_06", "HYDRO_CURVED_07", "HYDRO_ARCHIMEDE_08", "HYDRO_STABILITY_04", "COMP_DUALGATE_01", "COMP_LOCKDOOR_01"],
  forces: ["FORCE_GATE_02", "FORCE_PLANE_01", "HYDRO_INCLINED_06", "HYDRO_CURVED_07", "COMP_DUALGATE_01", "COMP_LOCKDOOR_01"],
  kinematics: ["KIN_TWO_02", "KIN_NODE_03", "KIN_ACCEL_04", "KIN_RISE_05", "KIN_DIST_07"],
  bernoulli: ["BERN_SECTIONS_03", "BERNOULLI_TORRICELLI_02", "BERN_DRAIN_06", "BERN_PITOT_05", "BERNOULLI_VENTURI_01", "BERN_SIPHON_07", "BERN_PUMP_08"],
  momentum: ["MOMENTUM_JET_01", "MOM_BUCKET_03", "MOM_ELBOW_04", "MOM_CONV_05", "MOM_REACT_06", "MOM_INCLINE_07"],
  losses: ["LOSS_RE_01", "LOSS_LAM_04", "LOSSES_COLEBROOK_01", "LOSS_GRAV_05", "LOSS_SIZE_06", "LOSS_PUMP_07", "LOSS_BORDA_08", "LOSS_MOODY_03", "LOSS_DH_02", "LOSS_FILM_03", "LOSSES_MINOR_02", "COMP_HGL_01", "COMP_ECON_01"],
  similarity: ["SIM_REYNOLDS_02", "SIM_SPILL_03", "SIM_STOKES_04", "SIM_FROUDE_01"],
  freeSurface: ["FS_TRAP_02", "FS_NORMAL_03", "FS_WAVE_04", "FS_RITTER_05", "CHANNEL_MANNING_01", "COMP_DITCH_01", "COMP_FROUDE_01", "COMP_WEIR_01", "COMP_JUMP_01"],
  pumping: ["COMP_PUMPCURVE_01", "LOSS_PUMP_07", "SYN_NPSH_03"]
};

function exercisesForChapter(chapterId) {
  const seen = new Set();
  const listed = (chapterOrder[chapterId] || []).map(id => state.catalog.exercises.find(e => e.id === id)).filter(Boolean);
  listed.forEach(e => seen.add(e.id));
  const rest = state.catalog.exercises.filter(e => e.chapter === chapterId && !seen.has(e.id));
  if (chapterOrder[chapterId]) return [...listed, ...rest];
  return rest;
}

function exerciseRef(exercise) {
  const title = exercise.title || "";
  const numbered = title.match(/^(Exercice|TD)\s+(\d+\.\d+)/i);
  if (numbered) return numbered[2];
  if (/^Examen/i.test(title)) return "Ex";
  return "App.";
}

function home() {
  closeMoodyReader();
  stopTimer(); state.exercise = null;
  const total = state.catalog.exercises.length;
  app.innerHTML = `<section class="hero"><p class="eyebrow">Mécanique des fluides · Génie civil</p><h1>Comprendre, calculer, vérifier.</h1><p>Des exercices paramétriques fidèles au polycopié, avec unités, validation tolérante et correction raisonnée.</p><div class="signature">École Nationale d’Ingénieurs de Sfax<br><strong>Dr Ahmed Ksentini</strong></div></section><div class="section-title"><div><h2>Choisir un chapitre</h2><p>${total} exercices paramétriques, alignés sur le polycopié du S1.</p></div></div><section class="chapter-grid">${state.catalog.chapters.map(ch => { const count = exercisesForChapter(ch.id).length; return `<button class="chapter" data-chapter="${ch.id}"><span class="num">${ch.number}</span><h3>${esc(ch.title)}</h3><p>${esc(ch.description)}</p><span class="count">${count} exercice${count>1?"s":""} →</span></button>`; }).join("")}</section>`;
  document.querySelectorAll("[data-chapter]").forEach(button => button.addEventListener("click", () => chapterPage(button.dataset.chapter)));
  history.replaceState({}, "", location.pathname);
}

function chapterPage(chapterId) {
  const chapter = state.catalog.chapters.find(c => c.id === chapterId);
  const exercises = exercisesForChapter(chapterId);
  app.innerHTML = `<button class="back" id="backHome">← Tous les chapitres</button><section class="chapter-banner"><span class="num">${chapter.number}</span><div><h1>${esc(chapter.title)}</h1><p>${esc(chapter.description)}</p></div></section><div class="section-title"><div><h2>Exercices</h2><p>Choisissez une situation puis un mode de travail.</p></div></div><section class="exercise-list">${exercises.map(e=>`<button class="exercise-card" data-exercise="${e.id}"><span class="exercise-index">${esc(exerciseRef(e))}</span><span><strong>${esc(e.title)}</strong><small>Niveau ${e.difficulty} · données paramétriques</small></span><span class="arrow">→</span></button>`).join("")}</section>`;
  document.querySelector("#backHome").addEventListener("click", home);
  document.querySelectorAll("[data-exercise]").forEach(b => b.addEventListener("click",()=>openExercise(state.catalog.exercises.find(e=>e.id===b.dataset.exercise))));
}

function openExercise(exercise, mode = state.mode) {
  closeMoodyReader();
  stopTimer(); state.exercise = exercise; state.mode = mode; state.attempts = {}; state.warmup = {};
  state.data = Object.fromEntries(exercise.variables.map(v => [v.key, mode === "learn" ? v.value : randomValue(v)]));
  renderExercise();
  if (mode === "exam") startTimer();
  history.replaceState({}, "", `#${exercise.id}`);
}

function renderExercise() {
  const e = state.exercise, chapter = state.catalog.chapters.find(c => c.id === e.chapter);
  const recap = courseRecap(e.solver);
  const ref = exerciseRef(e);
  const refLabel = ref === "App." ? "Application" : ref === "Ex" ? "Examen" : `n° ${ref}`;
  const recapHtml = state.mode === "exam" ? "" : `<article class="card recap-card"><p class="recap-kicker">Rappel de cours</p><h2>${esc(recap.title)}</h2><p class="recap-lead">${esc(recap.lead)}</p><ul class="recap-points">${recap.points.map(p => `<li>${esc(p)}</li>`).join("")}</ul><p class="recap-watch"><strong>Piège fréquent.</strong> ${esc(recap.watch)}</p></article>`;
  app.innerHTML = `<section class="exercise-head"><div><button class="back" id="back">← Exercices du chapitre</button><h1>${esc(e.title)}</h1><p>Chapitre ${chapter.number} · ${esc(refLabel)} · Niveau ${e.difficulty}</p></div><div><div class="mode-switch" aria-label="Mode de travail">${Object.entries(modes).map(([key,label]) => `<button data-mode="${key}" class="${state.mode===key?"active":""}">${label}</button>`).join("")}</div><div id="clock" class="exam-clock">${state.mode === "exam" ? "Temps 00:00" : ""}</div></div></section><section class="workspace"><div><article class="card"><h2>Schéma de l’exercice</h2><div class="diagram" id="diagram"></div><p class="diagram-note" id="diagramNote"></p></article>${recapHtml}<article class="card"><h2>Énoncé</h2><p class="statement">${esc(e.statement)}</p><div class="data-grid">${e.variables.map(v => `<div class="field"><label for="v_${v.key}">${esc(v.label)}</label><div class="input-wrap"><input id="v_${v.key}" data-variable="${v.key}" type="number" step="any" value="${state.data[v.key]}" ${state.mode === "exam" ? "readonly" : ""}><span class="unit">${v.unit}</span></div></div>`).join("")}</div><div class="actions">${state.mode !== "learn" ? `<button class="secondary" id="randomize">↻ Nouvelles données</button>` : ""}</div></article></div><div><article class="card" id="guidedCard"><h2>${state.mode === "exam" ? "Votre copie" : "Résolution guidée"}</h2><div id="questions">${e.questions.map((q,i) => question(q,i)).join("")}</div><div class="actions"><button class="primary" id="submitAll">${state.mode === "exam" ? "Rendre la copie" : "Tout vérifier"}</button>${state.mode !== "exam" ? `<button class="secondary" id="showCorrection">Voir la correction</button>` : ""}</div><div id="score"></div></article><article class="card correction" id="correction" hidden></article></div></section>`;
  const formulas=equationSheets[e.solver]||["Consulter les hypothèses et établir le bilan fondamental."];
  const rightCol = app.querySelector(".workspace > div:nth-child(2)");
  const items = state.mode === "learn" ? warmups[e.id] : null;
  if (items) rightCol.insertAdjacentHTML("afterbegin", warmupCard(items));
  rightCol.querySelector("#guidedCard").insertAdjacentHTML("beforebegin", `<article class="card equation-card" id="equationCard"><h2>Équations utiles</h2><p class="equation-intro">Rappel littéral — identifiez chaque grandeur avant de remplacer les valeurs.</p>${formulas.map(f=>`<div class="equation-line">${esc(f)}</div>`).join("")}</article>`);
  applyWarmupGate(items);
  bindExerciseEvents();
  refreshDiagram();
}

function warmupCard(items) {
  return `<article class="card warmup-card"><p class="warmup-kicker">Avant de calculer</p><h2>Se faire une idée du phénomène</h2><p class="warmup-intro">Répondez d’abord avec le schéma et ce que vous savez déjà — sans chercher la formule.</p>${items.map((q, i) => warmupQuestion(q, i)).join("")}</article>`;
}

function warmupQuestion(q, i) {
  const picked = state.warmup[i];
  const answered = picked != null;
  const ok = answered && picked === q.correct;
  const choices = q.choices.map(c => {
    let klass = "warmup-choice";
    let mark = "";
    if (answered) {
      if (c.id === q.correct) {
        klass += " is-correct";
        mark = `<span class="warmup-mark" aria-hidden="true">✓</span>`;
      } else if (c.id === picked) {
        klass += " is-wrong";
        mark = `<span class="warmup-mark" aria-hidden="true">✕</span>`;
      } else {
        klass += " is-muted";
      }
    }
    return `<button type="button" class="${klass}" data-warmup="${i}" data-choice="${c.id}" ${answered ? "disabled" : ""}>${mark}${esc(c.label)}</button>`;
  }).join("");
  const verdict = !answered ? "" : ok
    ? `<p class="warmup-verdict is-good">✓ Bravo</p>`
    : `<p class="warmup-verdict is-bad">✕ Pas tout à fait — la bonne réponse est surlignée.</p>`;
  const explain = answered ? `<p class="warmup-explain">${esc(q.explain)}</p>` : "";
  return `<div class="warmup-item" id="warmup_${i}"><p class="warmup-prompt">${esc(q.prompt)}</p><div class="warmup-choices">${choices}</div>${verdict}${explain}</div>`;
}

function warmupReady(items) {
  return items && items.every((_, i) => state.warmup[i] != null);
}

function applyWarmupGate(items) {
  if (!items) return;
  const ready = warmupReady(items);
  document.querySelector("#equationCard").hidden = !ready;
  document.querySelector("#guidedCard").hidden = !ready;
}

function answerWarmup(index, choice) {
  if (state.warmup[index] != null) return;
  state.warmup[index] = choice;
  const items = warmups[state.exercise.id];
  const block = document.querySelector(`#warmup_${index}`);
  if (block) block.outerHTML = warmupQuestion(items[index], index);
  applyWarmupGate(items);
}

function question(q, i) { return `<div class="question"><div class="question-title">${i+1}. ${esc(q.label)}</div><div class="answer-row"><div class="input-wrap"><input id="a_${q.key}" data-answer="${q.key}" inputmode="decimal" autocomplete="off" placeholder="Votre réponse"><span class="unit">${q.unit}</span></div>${state.mode !== "exam" ? `<button class="ghost" data-check="${q.key}">Vérifier</button>` : ""}</div><p class="feedback" id="f_${q.key}"></p></div>`; }

function readData() { state.exercise.variables.forEach(v => state.data[v.key] = parse(document.querySelector(`#v_${v.key}`).value)); }
function check(key) {
  readData(); const target = solve(state.exercise, state.data).values[key], input = document.querySelector(`#a_${key}`), value = parse(input.value), feedback = document.querySelector(`#f_${key}`);
  state.attempts[key] = (state.attempts[key] || 0) + 1;
  const correct = isClose(value, target); feedback.className = `feedback ${correct ? "good" : "bad"}`;
  feedback.innerHTML = correct ? "✓ Correct — unité et ordre de grandeur cohérents." : `✕ À revoir.${state.mode === "learn" && state.attempts[key] > 1 ? `<span class="hint">Indice : commencez par convertir toutes les données en SI et écrivez la relation littérale.</span>` : ""}`;
  return correct;
}
function submitAll() {
  const correct = state.exercise.questions.filter(q => check(q.key)).length, total = state.exercise.questions.length, score = 20 * correct / total;
  document.querySelector("#score").innerHTML = `<p class="score">Résultat : ${correct}/${total} — ${score.toLocaleString("fr-FR",{maximumFractionDigits:1})}/20</p>`;
  if (state.mode === "exam") { stopTimer(); showCorrection(); document.querySelector("#showCorrection")?.remove(); }
}
function showCorrection() {
  readData(); const result = solve(state.exercise, state.data), box = document.querySelector("#correction");
  const guide = pedagogy[state.exercise.solver] || {hypotheses:"Grandeurs exprimées dans le Système International.",why:[],check:"Vérifier les unités et l’ordre de grandeur."};
  box.hidden = false; box.innerHTML = `<h2>Correction détaillée</h2><section class="reasoning"><h3>1. Hypothèses et modèle physique</h3><p>${esc(guide.hypotheses)}</p></section><section class="given-data"><h3>2. Données de l’énoncé</h3><div class="data-summary">${state.exercise.variables.map(v=>`<span><small>${esc(v.label)}</small><strong>${esc(state.data[v.key])} ${v.unit}</strong></span>`).join("")}</div><p class="method-note">Avant tout calcul, les millimètres, litres, bars et kilopascals sont convertis en unités SI. Le calcul littéral est écrit avant le remplacement numérique.</p></section><h3>3. Résolution raisonnée</h3>${result.steps.map((s,i) => `<div class="solution-step" data-step="${i+1}"><h3>${esc(s[0])}</h3>${guide.why[i]?`<p class="explanation">${esc(guide.why[i])}</p>`:""}<p class="formula">${esc(s[1]).replace(/\n/g, "<br>")}</p></div>`).join("")}<div class="final-result"><strong>4. Résultats numériques</strong><br>${state.exercise.questions.map(q => `${esc(q.label)} = <strong>${Number(result.values[q.key]).toLocaleString("fr-FR",{maximumSignificantDigits:5})} ${q.unit}</strong>`).join("<br>")}</div><section class="sanity-check"><h3>5. Interprétation et contrôle</h3><p>${esc(guide.check)}</p><p>Contrôle d’unités : chaque résultat est donné dans l’unité demandée. Il faut toujours conserver davantage de chiffres pendant le calcul et n’arrondir qu’à la fin.</p></section>`; box.scrollIntoView({behavior:"smooth",block:"start"});
}
function bindExerciseEvents() {
  document.querySelector("#back").addEventListener("click", () => chapterPage(state.exercise.chapter));
  document.querySelectorAll("[data-mode]").forEach(b => b.addEventListener("click", () => openExercise(state.exercise, b.dataset.mode)));
  document.querySelectorAll("[data-variable]").forEach(input => input.addEventListener("input", () => { readData(); refreshDiagram(); document.querySelector("#correction").hidden = true; }));
  document.querySelectorAll("[data-check]").forEach(b => b.addEventListener("click", () => check(b.dataset.check)));
  document.querySelector("#submitAll").addEventListener("click", submitAll);
  document.querySelector("#showCorrection")?.addEventListener("click", showCorrection);
  document.querySelector("#randomize")?.addEventListener("click", () => openExercise(state.exercise, state.mode));
  document.querySelector(".warmup-card")?.addEventListener("click", event => {
    const b = event.target.closest("[data-warmup]");
    if (!b || b.disabled) return;
    answerWarmup(Number(b.dataset.warmup), b.dataset.choice);
  });
}

function formatRe(value) {
  return Number(value).toLocaleString("fr-FR", { maximumSignificantDigits: 3 });
}
function formatEpsRel(value) {
  if (!(value > 0)) return "lisse (0)";
  return Number(value).toLocaleString("fr-FR", { maximumSignificantDigits: 3 });
}
function sliderFromLog(value, min, max) {
  const v = Math.min(Math.max(value, min), max);
  return Math.round(1000 * (Math.log10(v) - Math.log10(min)) / (Math.log10(max) - Math.log10(min)));
}
function logFromSlider(pos, min, max) {
  return 10 ** (Math.log10(min) + (Math.log10(max) - Math.log10(min)) * pos / 1000);
}

function closeMoodyReader() {
  document.querySelector("#moodyOverlay")?.remove();
}

function openMoodyReader() {
  closeMoodyReader();
  const point = moodyPoint(state.data);
  document.body.insertAdjacentHTML("beforeend", `<div class="moody-overlay" id="moodyOverlay" role="dialog" aria-modal="true" aria-label="Diagramme de Moody agrandi">
    <div class="moody-dialog">
      <header class="moody-head"><h2>Diagramme de Moody</h2><button type="button" class="ghost" id="moodyClose">Fermer</button></header>
      <div class="moody-big" id="moodyBig"></div>
      <div class="moody-cursors">
        <label>Curseur Re <input id="moodyRe" type="range" min="0" max="1000" step="1"><output id="moodyReOut"></output></label>
        <label>Curseur ε/D <input id="moodyEr" type="range" min="0" max="1000" step="1"><output id="moodyErOut"></output></label>
        <p class="moody-readout">λ lu = <strong id="moodyLambda"></strong></p>
      </div>
    </div>
  </div>`);
  const reInput = document.querySelector("#moodyRe");
  const erInput = document.querySelector("#moodyEr");
  reInput.value = sliderFromLog(point.Re, 500, 1e8);
  erInput.value = point.epsRel > 0 ? sliderFromLog(point.epsRel, 1e-6, 0.05) : 0;
  const paint = () => {
    const Re = logFromSlider(+reInput.value, 500, 1e8);
    const epsRel = +erInput.value === 0 ? 0 : logFromSlider(+erInput.value, 1e-6, 0.05);
    const figure = moodyChart({ Re, epsRel }, { hatchId: "moodyHatchZoom" });
    document.querySelector("#moodyBig").innerHTML = figure.svg;
    document.querySelector("#moodyReOut").textContent = formatRe(Re);
    document.querySelector("#moodyErOut").textContent = formatEpsRel(epsRel);
    document.querySelector("#moodyLambda").textContent = formatRe(moodyPoint({ Re, epsRel }).f);
    if (state.exercise?.solver === "moodyRead") {
      state.data.Re = Re;
      state.data.epsRel = epsRel;
      const reField = document.querySelector("#v_Re");
      const erField = document.querySelector("#v_epsRel");
      if (reField) reField.value = String(Math.round(Re));
      if (erField) erField.value = String(Number(epsRel.toPrecision(4)));
    }
  };
  reInput.addEventListener("input", paint);
  erInput.addEventListener("input", paint);
  document.querySelector("#moodyClose").addEventListener("click", closeMoodyReader);
  document.querySelector("#moodyOverlay").addEventListener("click", event => { if (event.target.id === "moodyOverlay") closeMoodyReader(); });
  paint();
}

function refreshDiagram() {
  if (!state.exercise) return;
  const figure = drawFigure(state.exercise.solver, state.data);
  const box = document.querySelector("#diagram");
  const note = document.querySelector("#diagramNote");
  if (box) box.innerHTML = figure.svg;
  if (note) note.textContent = figure.caption;
  const chart = box?.querySelector(".moody-chart");
  if (chart) {
    box.classList.add("diagram-zoomable");
    box.title = "Cliquer pour agrandir";
    box.onclick = openMoodyReader;
  }
}

function startTimer() { state.seconds = 0; state.timer = setInterval(() => { state.seconds++; const clock = document.querySelector("#clock"); if (clock) clock.textContent = `Temps ${formatTime(state.seconds)}`; }, 1000); }
function stopTimer() { clearInterval(state.timer); state.timer = null; }

document.addEventListener("keydown", event => { if (event.key === "Escape") closeMoodyReader(); });
document.querySelector("#homeButton").addEventListener("click", home);
window.addEventListener("hashchange", () => {
  if (!state.catalog) return;
  const requested = state.catalog.exercises.find(e => `#${e.id}` === location.hash);
  if (requested) openExercise(requested);
  else if (!location.hash) home();
});
window.addEventListener("beforeinstallprompt", event => { event.preventDefault(); state.installPrompt = event; const b = document.querySelector("#installButton"); b.hidden = false; b.onclick = async () => { await state.installPrompt.prompt(); b.hidden = true; }; });
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));

const loadJson = url => fetch(url).then(r => r.ok ? r.json() : []);
try {
  const [catalog, batch12, batch34, batch58, batchExam, batchTd, batchComp] = await Promise.all([
    fetch("./data/exercises.json").then(r => r.json()),
    loadJson("./data/exercises-ch1-ch2.json"),
    loadJson("./data/exercises-ch3-ch4.json"),
    loadJson("./data/exercises-ch5-ch8.json"),
    loadJson("./data/exercises-exam-td.json"),
    loadJson("./data/exercises-td.json"),
    loadJson("./data/exercises-complements.json")
  ]);
  state.catalog = { ...catalog, exercises: [...catalog.exercises, ...batch12, ...batch34, ...batch58, ...batchExam, ...batchTd, ...batchComp] };
  const requested = state.catalog.exercises.find(e => `#${e.id}` === location.hash);
  requested ? openExercise(requested) : home();
} catch {
  app.innerHTML = `<section class="card"><h1>Chargement impossible</h1><p>Lancez l’application depuis un serveur web local ou depuis Cloudflare Pages.</p></section>`;
}
