# Vérification des modules avancés — 13 septembre 2026

Commande : `node --test tests/*.test.mjs` — 19 tests, 19 réussis.

Couverture automatisée : choix du diamètre selon deux contraintes ; tri et dédoublonnage ; absence de solution ; Hagen–Poiseuille indépendant ; puissance dissipée ; bilan NPSH à débit nul ; sensibilité aux cotes et à la pression de vapeur ; critère de marge ; conservation nodale des débits ; pertes cumulées ; conversion pression/bar ; charge source minimale ; demandes locales ; branches multiples et ordre des nœuds ; débit nul ; cycles, doublons et parents absents ; valeurs invalides ; sérialisation JSON ; application ciblée à l’installation. Tests antérieurs conservés.

Contrôles navigateur sur l’aperçu local :

- Dimensionnement initial : 90 mm ; Vmax abaissée à 0,5 m/s : 160 mm.
- Débit négatif : calcul suspendu et résultats périmés retirés.
- NPSH initial disponible : 8,0729 m ; cote pompe portée à 9 m : critère non satisfait.
- Réseau initial : 10 L/s, charge source minimale 36,284 m ; charge source à 20 m : pression insuffisante.
- Parent A changé en B : cycle détecté ; ajout d’un nœud N1 fonctionnel.
- Reprise du refoulement et application du diamètre : T2 passe de 100 à 90 mm ; T1 reste à 150 mm.
- Export JSON déclenché avec message de succès.
- Import du fichier `fixtures/sizing-project.json` : diamètre proposé 200 mm ; fichier d’un autre module rejeté sans remplacer le projet courant.
- Navigation entre modules et rechargement des routes vérifiés.
- Écran mobile 390 × 844 : affichage lisible, largeur du document inférieure à celle du viewport ; largeur rétablie après test.
- Aucun message d’erreur JavaScript observé dans le journal du navigateur lors du contrôle final.

Limites : pas de validation sur installation physique ni comparaison exhaustive à un logiciel certifié. Le dialogue d’impression système et le fonctionnement hors connexion sur un appareil PWA installé n’ont pas été testés. Les assets des nouveaux modules sont inscrits dans le cache versionné. Les réseaux maillés et demandes dépendantes de la pression ne sont pas implémentés.
