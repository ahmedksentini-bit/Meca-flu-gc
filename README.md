# MécaFlu GC — V2

## Modules avancés

Depuis le Bureau de calcul :

- `#calculateur/dimensionnement` : comparaison de diamètres intérieurs réels, choix minimal selon vitesse et perte admissibles, puissance hydraulique dissipée ; reprise d’un tronçon et application du diamètre à l’installation.
- `#calculateur/npsh` : NPSHA depuis un réservoir, pertes d’aspiration, marge additive et cote maximale de référence pompe. NPSHR fabricant à renseigner au débit étudié ; aucune garantie universelle contre la cavitation.
- `#calculateur/reseau` : réseau arborescent jusqu’à 50 nœuds, demandes locales imposées, débits cumulés, charges et pressions nodales, charge source minimale. Boucles, sources multiples indépendantes, pompes internes et demandes dépendantes de la pression non modélisées.

Chaque module possède son export/import JSON (200 Ko maximum), ses contrôles de saisie et une note imprimable. Données conservées pendant la navigation dans la session ; exporter avant de recharger ou fermer. Les listes de diamètres et valeurs initiales sont des exemples, pas des catalogues normatifs. Saisir les diamètres intérieurs et rugosités correspondant aux matériaux et séries retenus.

Tests : `node --test tests/*.test.mjs`. Références de méthode : [EPA EPANET](https://www.epa.gov/water-research/epanet), [KSB NPSH](https://www.ksb.com/en-global/centrifugal-pump-lexicon/n). Solveurs internes indépendants d’EPANET.

Application web statique et PWA d’exercices de mécanique des fluides pour le génie civil.

Le **Bureau de calcul** complète le parcours pédagogique avec une interface de logiciel : saisie directe des données, recalcul instantané, schéma physique, résultats et note de calcul pour les conduites, le pompage, Bernoulli, l’hydrostatique et les écoulements à surface libre.

### Laboratoire virtuel (chapitres 1 à 8)

`labo.html` est un banc d’hydrostatique à monter soi-même : réservoirs ouverts, fermés (ciel à pression imposée ou gaz piégé isotherme) ou à paroi inclinée, couches de liquides non miscibles (eau, eau de mer, huile, essence, glycérine, tétrachlorure, mercure, liquide personnalisé), conduites et vannes, piézomètres, manomètres à cadran, tubes en U simples, différentiels ou renversés, vannes planes (rectangle, cercle, triangle ; charnière ou levage en glissières avec frottement) et flotteurs, pleins ou caissons creux ballastables. Un réservoir peut garder un niveau imposé (mer, nappe, grande retenue) et se représenter comme un terrain saturé.

Les éléments se glissent depuis la palette et s’accrochent aux piquages des parois (tous les 25 cm), aux conduites, aux parois et aux cotes rondes, avec un repère magnétique. Un clic sur une palette ajoute l’élément à un emplacement par défaut (clavier et tactile). Une conduite neuve arrive vanne fermée ; à l’ouverture, les niveaux s’équilibrent sous les yeux (vases communicants, conservation du volume, stratification). La surface libre se tire à la main, la sonde donne p, p<sub>abs</sub> et la charge en tout point, et l’inspecteur détaille chaque calcul : cheminement de proche en proche, plan de charge, F = p<sub>G</sub>S, centre de poussée y<sub>C</sub> = y<sub>G</sub> + I<sub>G</sub>/(y<sub>G</sub>S), diagramme des pressions, tirant d’eau, métacentre, couple à la gîte, remontée capillaire de Jurin, alertes de vaporisation.

Dix-sept expériences guidées reprennent les exercices 2.1, 2.2, 2.4, 2.5, 2.6, 2.8 et 2.9, les problèmes S.1 (vanne de chasse et effort de levage) et S.6 (batardeau flottant ballasté), la remontée de nappe sous un réservoir enterré et plusieurs paragraphes des chapitres 1 et 2 ; seize d’entre elles sont intégrées au cours comme figures dynamiques (`<div class="labo-widget" data-labo="…">`, montées à l’approche de l’écran). La page conserve l’expérience en cours dans le navigateur ; export et import JSON (200 Ko maximum).

Hypothèses affichées dans l’interface : fluides au repos, liquides incompressibles et non miscibles, poids des gaz négligé, gaz piégé isotherme, appareils de volume négligeable, conduites amorcées. En mode « illustratif », le transitoire des vases communicants est une relaxation vers l’équilibre, pas un calcul d’écoulement.

**Écoulements en charge.** Le sélecteur de modèle passe en **fluide parfait** (chapitre 4) ou en **fluide réel** (chapitre 6). Les conduites relient alors réservoirs, sorties à l’air libre, pompes et changements de section en chaînes série, résolues en régime quasi permanent par Bernoulli généralisé : H<sub>amont</sub> + H<sub>pompe</sub>(Q) = H<sub>aval</sub> + Σ pertes(Q). En fluide réel, les pertes linéaires suivent Darcy–Weisbach (λ = 64/Re ou Colebrook à partir de la rugosité, ou λ imposé, sur la longueur dessinée ou une longueur de calcul) ; les pertes singulières comptent l’entrée (0,5), la sortie (1), ΣK, la vanne selon son ouverture, le venturi et les raccords (Borda, rétrécissement). La palette « Écoulement » ajoute orifices en mince paroi (Torricelli, C<sub>d</sub>, C<sub>v</sub>, jet balistique qui tombe au sol ou dans un réservoir), sorties libres, pompes (débit imposé ou courbe H₀ − kQ², rendement, clapet), changements de section, venturis à manomètre différentiel, tubes de Pitot simples et doubles, et robinets d’apport. Les niveaux évoluent dans le temps par bilan de volume, avec chronomètre, pause et accélération (× 1 à × 300) ; les lignes de charge et piézométrique se tracent le long du circuit, et l’inspecteur déroule le bilan terme à terme (V, Re, λ, h<sub>f</sub>, singularités, HMT, puissances, alertes de cavitation).

Onze expériences d’écoulement reprennent les exercices 3.5, 4.1 à 4.7, 6.4, 6.6 et 6.7, avec les valeurs des corrigés (`tests/labo-ecoulement.test.mjs`) ; elles sont intégrées au cours comme figures dynamiques, figées lorsqu’elles sortent de l’écran.

**Quantité de mouvement (chapitre 5).** Une lance projette un jet de vitesse et de diamètre imposés ; plaques et augets placés sur sa trajectoire (ou sur celle d’un orifice ou d’une sortie) le dévient. Le théorème d’Euler donne l’effort du jet, le partage du débit entre les nappes d’une plaque inclinée (Q₁ = Q(1 + cos α)/2), et pour un auget animé d’une vitesse u, la puissance recueillie avec sa courbe P(u). L’affichage « Efforts » dessine aussi les efforts d’ancrage des coudes, F = (pS + ρQV)(e₁ − e₂), l’effort axial sur les raccords et la réaction des jets sur leur réservoir ou leur lance. Six expériences reprennent les exercices 5.1 à 5.6 (`tests/labo-quantite-mouvement.test.mjs`).

**Surface libre (chapitre 8).** Le canal (`src/labo-canal.js`) se voit en profil en long, avec une exagération verticale. Sa section est rectangulaire ou trapézoïdale ; on règle la pente (avec une éventuelle rupture), le Strickler, le débit amont et la condition aval : chute libre, niveau imposé, régime uniforme ou mur. Les équations de Saint-Venant sont résolues par volumes finis (flux HLL, reconstruction hydrostatique, frottement de Manning–Strickler semi-implicite, fronts secs admis). Le profil marque la profondeur normale, la profondeur critique, les zones torrentielles, les ressauts avec leurs hauteurs conjuguées, les ondes U ± c d’une intumescence et la solution de Ritter d’une rupture de barrage ; une sonde déplaçable donne S, P<sub>m</sub>, R<sub>h</sub>, U, Fr et E, avec une coupe en travers. Cinq expériences reprennent les exercices 8.1 à 8.4 et le ressaut du § 8.2 (`tests/labo-surface-libre.test.mjs`).

**Similitude (chapitre 7).** Un canal peut devenir la maquette au 1/N d’un autre : sa géométrie, son débit (× λ^5/2), sa rugosité (K × N^1/6) et ses conditions aux limites découlent du prototype, et son temps s’écoule √N fois plus vite, si bien que les deux lignes d’eau restent homothétiques à chaque instant. L’inspecteur de la maquette dresse le tableau des échelles de Froude, avec les valeurs homologues et la comparaison avec la similitude de Reynolds. Le viscosimètre à chute de bille (`src/labo-bille.js`) lâche une sphère dans le liquide d’un réservoir, avec la traînée de Stokes ou la loi complète de Schiller–Naumann ; le chronométrage entre deux repères donne μ = (ρ<sub>s</sub> − ρ)gd²/(18V) et le contrôle Re < 1. Deux expériences reprennent les exercices 7.4 et 7.5 (`tests/labo-similitude.test.mjs`) ; la viscosité du liquide personnalisé se règle dans les constantes.

### Installation hydraulique

Accessible depuis le Bureau de calcul ou `#calculateur/installation` : réseau en série entre deux réservoirs ouverts, 1 à 30 tronçons, accessoires par tronçon et pompe facultative. Deux modes : hauteur requise à débit imposé ou débit obtenu par intersection pompe/gravité–réseau. Le module affiche les pertes détaillées, les courbes et la puissance, contrôle les données et signale les régimes de transition. Les projets s’exportent et s’importent en JSON ; la note peut être imprimée depuis le navigateur.

`src/installation-solver.js` réutilise le facteur de Darcy du moteur existant ; `src/installation.js` gère l’interface. Les valeurs de K initiales sont des exemples à confirmer. Les changements de section ne sont pas ajoutés automatiquement. Ce premier module ne résout ni les réseaux maillés ni les transitoires et ne vérifie pas le NPSH (module séparé). Le diagramme de pertes cumulées n’est pas une ligne piézométrique.

### Vue satellite géoréférencée

L'atelier graphique embarque une carte manipulable. « Ouvrir la carte » affiche le monde entier ; la molette zoome sur le point visé, glisser le fond déplace la vue, et « + Jonction » ou « + Réservoir » suivis d'un clic posent le nœud à l'endroit exact désigné. « Aller aux coordonnées » accepte aussi une saisie précise — « latitude, longitude » ou une adresse Google Maps collée.

Un nœud posé sur la carte porte ses coordonnées réelles et **les longueurs des tronçons se calculent d'elles-mêmes**, en distance orthodromique. Seuls les nœuds effectivement posés suivent le terrain lors d'un zoom ou d'un déplacement ; ceux qui ne l'ont pas encore été restent à l'écran, ce qui permet de naviguer jusqu'au site sans disperser un schéma existant.

Le fournisseur par défaut est Esri World Imagery, sans clé d'API, dont la mention de source reste affichée sous le schéma. N'importe quel service de tuiles XYZ peut lui être substitué, avec sa propre mention ; vérifier ses conditions d'utilisation. Les tuiles exigent une connexion : le reste de l'application fonctionne hors ligne, pas le fond de carte.

Les nœuds sont ancrés au terrain. Déplacer ou zoomer la carte les fait suivre le sol et non l'écran ; ils peuvent donc sortir du cadre, et « Recentrer sur le réseau » les ramène. La reprise automatique des longueurs se désactive pour revenir à la saisie manuelle.

Réserves identiques au fond de plan calibré : la longueur obtenue est **horizontale**, elle ignore pente, coudes et profil de tranchée, et la précision des positions est celle de l'orthorectification du fournisseur. Une image satellite ne porte aucune altimétrie : les cotes des nœuds restent à renseigner.

### Fond de plan calibré

L'atelier graphique (`#calculateur/atelier`) accepte un extrait de vue aérienne en fond de plan. Importer l'image, placer deux points dont la distance réelle est connue, saisir cette distance : l'échelle isotrope en découle et chaque tronçon affiche alors sa longueur mesurée, reprenable à l'unité ou en bloc.

L'imagerie est fournie par l'utilisateur, avec son origine saisie et reportée dans la note de calcul ; aucune tuile n'est téléchargée et le module reste utilisable hors connexion. L'image est conservée dans IndexedDB (12 Mo maximum), le projet JSON ne portant que le calage.

La longueur lue est **horizontale** : elle ignore la pente, les coudes et le profil de tranchée, et sous-estime donc la conduite réelle. Elle est proposée, jamais imposée — la saisie manuelle reste la référence. Une image aérienne ne porte aucune altimétrie : les cotes des nœuds restent à renseigner.

## Architecture

- `data/exercises.json` : chapitres et premier lot d’exercices ;
- `data/exercises-ch1-ch2.json`, `data/exercises-ch3-ch4.json`, `data/exercises-ch5-ch8.json`, `data/exercises-exam-td.json`, `data/exercises-td.json` : lots suivants ;
- `src/solvers.js` : lois physiques, conversions SI et corrections ;
- `src/app.js` : moteur générique et interface ;
- `src/recaps.js` : rappel de cours affiché à gauche de chaque exercice ;
- `src/diagrams.js` : figures de cours, une par situation physique ;
- `src/mesh-solver.js`, `src/network-studio.js` : réseaux maillés et atelier graphique ;
- `src/geo.js` : projection Web Mercator, distances orthodromiques et pavage en tuiles ;
- `src/labo-physique.js` (moteur hydrostatique), `src/labo-ecoulement.js` (écoulements en charge et jets), `src/labo-canal.js` (Saint-Venant et maquettes), `src/labo-bille.js` (chute de bille), `src/labo-dessin.js` (rendu SVG), `src/labo-scenarios.js` (expériences guidées), `src/labo.js` (interface), `src/labo-embed.js` et `labo.css` : laboratoire virtuel ;
- `src/technical-library.js`, `src/project-store.js`, `src/pdf-report.js`, `src/basemap-store.js` : bibliothèque technique, sauvegarde locale, notes PDF et fonds de plan ;
- `sw.js` et `manifest.webmanifest` : installation et fonctionnement hors connexion ;
- `tests/` : contrôles numériques des solveurs.

Pour ajouter un exercice, déclarer son contenu dans le JSON puis associer un solveur. Aucun framework ni compilation n’est nécessaire pour Cloudflare Pages.

## Développement

```text
npm test
npm run serve
```

Le dossier de sortie Cloudflare Pages reste la racine `/` et la commande de build reste vide.
