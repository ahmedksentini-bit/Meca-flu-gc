const CACHE = "mecaflu-v2-46";
const ASSETS = ["./","./index.html","./styles.css","./enhancements.css","./src/app.js","./src/solvers.js","./src/diagrams.js","./src/diagrams3d.js","./src/diagrams3d-families.js","./src/recaps.js","./src/warmups.js","./data/exercises.json","./data/exercises-ch1-ch2.json","./data/exercises-ch3-ch4.json","./data/exercises-ch5-ch8.json","./data/exercises-exam-td.json","./data/exercises-td.json","./data/exercises-complements.json","./data/exercises-hydrau-gen.json","./vendor/three/three.module.min.js","./vendor/three/addons/controls/OrbitControls.js","./vendor/pdfjs/pdf.min.mjs","./vendor/pdfjs/pdf.worker.min.mjs","./docs/Cours_Mecanique_des_Fluides_GC_S1.pdf","./manifest.webmanifest","./assets/icon.svg"];
ASSETS.push('./installation.css', './src/installation.js', './src/installation-solver.js');
ASSETS.push('./engineering.css', './src/engineering.js', './src/engineering-solvers.js');
// Les equations doivent rester lisibles hors connexion ; cours.html (3,4 Mo) et
// exerciseur.html sont mis en cache a la premiere visite, pas a l installation.
ASSETS.push('./vendor/mathjax/tex-chtml.js');
ASSETS.push('./src/geo.js','./studio.css','./src/mesh-solver.js','./src/network-studio.js','./src/technical-library.js','./src/project-store.js','./src/pdf-report.js','./src/basemap-store.js');
self.addEventListener("install", event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener("activate", event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener("fetch", event => { if (event.request.method !== "GET") return; event.respondWith(fetch(event.request).then(response => { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy)); return response; }).catch(() => caches.match(event.request).then(cached => cached || caches.match("./index.html")))); });
