// Le polycopie porte sa version dans son nom : une adresse inchangee laissait le cache
// HTTP resservir les anciens octets au prechargement, figeant l ancienne edition.
//
// Même cause pour les scripts et les données : Cloudflare les fait garder quatre
// heures par le navigateur (max-age=14400, réglage du domaine qui l'emporte sur
// les en-têtes de Pages), et une page neuve tournait avec des modules d'hier
// gardés sous la même adresse. Les fichiers du site passent donc en requête
// conditionnelle (no-cache) : le serveur renvoie le fichier s'il a changé,
// sinon une réponse 304 légère.
const CACHE = "mecaflu-v2-55";
const ASSETS = ["./","./index.html","./styles.css","./enhancements.css","./src/app.js","./src/solvers.js","./src/diagrams.js","./src/diagrams3d.js","./src/diagrams3d-families.js","./src/recaps.js","./src/warmups.js","./data/exercises.json","./data/exercises-ch1-ch2.json","./data/exercises-ch3-ch4.json","./data/exercises-ch5-ch8.json","./data/exercises-exam-td.json","./data/exercises-td.json","./data/exercises-complements.json","./data/exercises-hydrau-gen.json","./vendor/three/three.module.min.js","./vendor/three/addons/controls/OrbitControls.js","./vendor/pdfjs/pdf.min.mjs","./vendor/pdfjs/pdf.worker.min.mjs","./docs/Cours_Mecanique_des_Fluides_GC_S1_v01.pdf","./manifest.webmanifest","./assets/icon.svg"];
ASSETS.push('./installation.css', './src/installation.js', './src/installation-solver.js');
ASSETS.push('./engineering.css', './src/engineering.js', './src/engineering-solvers.js');
// Les equations doivent rester lisibles hors connexion ; cours.html (3,4 Mo) et
// exerciseur.html sont mis en cache a la premiere visite, pas a l installation.
ASSETS.push('./vendor/mathjax/tex-chtml.js');
// Laboratoire virtuel (chapitres 1 et 2) : page dédiée et figures du cours.
ASSETS.push('./labo.html','./labo.css','./src/labo.js','./src/labo-physique.js','./src/labo-dessin.js','./src/labo-scenarios.js','./src/labo-embed.js','./src/labo-ecoulement.js','./src/labo-canal.js','./src/labo-bille.js');
ASSETS.push('./src/geo.js','./studio.css','./src/mesh-solver.js','./src/network-studio.js','./src/technical-library.js','./src/project-store.js','./src/pdf-report.js','./src/basemap-store.js');
// Précharge sans tout-ou-rien : avec cache.addAll, un seul fichier manquant
// faisait échouer l'installation, et le lecteur restait sur l'ancienne version.
self.addEventListener("install", event => event.waitUntil(caches.open(CACHE)
  .then(cache => Promise.allSettled(ASSETS.map(url => fetch(url, { cache: "no-cache" })
    .then(response => (response.ok ? cache.put(url, response) : null)))))
  .then(() => self.skipWaiting())));
self.addEventListener("activate", event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener("fetch", event => {
  const { request } = event;
  if (request.method !== "GET") return;
  const local = new URL(request.url).origin === location.origin;
  // Un fichier du site est revalidé avec ses en-têtes d'origine : pdf.js lit le
  // polycopié par morceaux, son en-tête Range doit suivre. Les navigations (HTML
  // servi sans durée de cache), les polices et les tuiles satellite partent
  // comme avant, de même qu'une requête qui choisit son propre mode de cache.
  const revalidate = local && request.mode !== "navigate" && request.cache === "default";
  const network = fetch(revalidate ? new Request(request, { cache: "no-cache" }) : request);
  event.respondWith(network.then(response => {
    // On garde les réponses complètes et, comme avant, les réponses opaques
    // (statut 0) : tuiles et polices d'autres sites, et la redirection de
    // Cloudflare de cours.html vers /cours, qui ouvre le cours hors ligne.
    // Jamais un morceau de fichier (206) ni une erreur.
    if (response.status === 200 || response.status === 0) {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(request, copy)).catch(() => {});
    }
    return response;
  }).catch(() => caches.match(request).then(cached => {
    if (cached) return cached;
    // Le repli sur l'accueil ne vaut que pour une navigation : du HTML servi à la
    // place d'un .json ou d'un .js change une panne réseau franche en erreur
    // d'analyse muette au fond d'un module.
    if (request.mode === "navigate") return caches.match("./").then(home => home || caches.match("./index.html"));
    return new Response(`Ressource indisponible hors ligne : ${new URL(request.url).pathname}`,
      { status: 504, statusText: "Hors ligne", headers: { "Content-Type": "text/plain" } });
  })));
});
