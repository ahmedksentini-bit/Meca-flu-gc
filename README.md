# MécaFlu GC — V2

Application web statique et PWA d’exercices de mécanique des fluides pour le génie civil.

## Architecture

- `data/exercises.json` : chapitres et premier lot d’exercices ;
- `data/exercises-ch1-ch2.json`, `data/exercises-ch3-ch4.json` : lots suivants ;
- `src/solvers.js` : lois physiques, conversions SI et corrections ;
- `src/app.js` : moteur générique et interface ;
- `sw.js` et `manifest.webmanifest` : installation et fonctionnement hors connexion ;
- `tests/` : contrôles numériques des solveurs.

Pour ajouter un exercice, déclarer son contenu dans le JSON puis associer un solveur. Aucun framework ni compilation n’est nécessaire pour Cloudflare Pages.

## Développement

```text
npm test
npm run serve
```

Le dossier de sortie Cloudflare Pages reste la racine `/` et la commande de build reste vide.
