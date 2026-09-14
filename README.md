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

### Installation hydraulique

Accessible depuis le Bureau de calcul ou `#calculateur/installation` : réseau en série entre deux réservoirs ouverts, 1 à 30 tronçons, accessoires par tronçon et pompe facultative. Deux modes : hauteur requise à débit imposé ou débit obtenu par intersection pompe/gravité–réseau. Le module affiche les pertes détaillées, les courbes et la puissance, contrôle les données et signale les régimes de transition. Les projets s’exportent et s’importent en JSON ; la note peut être imprimée depuis le navigateur.

`src/installation-solver.js` réutilise le facteur de Darcy du moteur existant ; `src/installation.js` gère l’interface. Les valeurs de K initiales sont des exemples à confirmer. Les changements de section ne sont pas ajoutés automatiquement. Ce premier module ne résout ni les réseaux maillés ni les transitoires et ne vérifie pas le NPSH (module séparé). Le diagramme de pertes cumulées n’est pas une ligne piézométrique.

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
