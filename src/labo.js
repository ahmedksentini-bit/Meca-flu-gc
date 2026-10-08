// Laboratoire virtuel (hydrostatique et écoulements en charge) : interface (palette, scène SVG,
// inspecteur). monterLabo() sert la page labo.html et les figures dynamiques
// intégrées au cours (mode « integre »).
import * as P from './labo-physique.js';
import { SCENARIOS, GROUPES, creerScenario } from './labo-scenarios.js';
import * as E from './labo-ecoulement.js';
import { dessinerScene, vueDe, esc, fmtP, apercuReservoir, apercuRemplissage, apercuFlotteur, apercuSegment } from './labo-dessin.js';

const CLE = 'mecaflu-labo-v1';
const reduit = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const NB = P.nombre;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const arr = (v, p) => Math.round(v / p) * p;

// ---------- palette ----------
const ic = (corps) => `<svg viewBox="0 0 28 28" aria-hidden="true">${corps}</svg>`;
const ICONES = {
  ouvert: ic('<rect x="6" y="13" width="16" height="9" fill="#8CC4DA"/><path d="M5 5v18h18V5" fill="none" stroke="currentColor" stroke-width="2.2"/>'),
  ferme: ic('<rect x="6" y="14" width="16" height="8" fill="#8CC4DA"/><rect x="6" y="6" width="16" height="8" fill="#E3EAED"/><path d="M5 5h18v18H5z" fill="none" stroke="currentColor" stroke-width="2.2"/><text x="14" y="12.5" font-size="6" text-anchor="middle" fill="currentColor">p₀</text>'),
  incline: ic('<path d="M6 14h13l2.6 8H6z" fill="#8CC4DA"/><path d="M5 5v18h17L17 5" fill="none" stroke="currentColor" stroke-width="2.2"/>'),
  conduite: ic('<path d="M3 8h6v12h10V8h6" fill="none" stroke="currentColor" stroke-width="4.5"/><path d="M3 8h6v12h10V8h6" fill="none" stroke="#8CC4DA" stroke-width="2"/>'),
  vanne: ic('<path d="M4 14h20" stroke="currentColor" stroke-width="3"/><path d="M7 9l14 10V9L7 19z" fill="#fff" stroke="currentColor" stroke-width="1.8"/><path d="M14 14V6M10 6h8" stroke="currentColor" stroke-width="1.8"/>'),
  piezometre: ic('<path d="M3 22h10" stroke="currentColor" stroke-width="3"/><rect x="11" y="3" width="6" height="20" fill="#fff" stroke="currentColor" stroke-width="1.6"/><rect x="12.5" y="10" width="3" height="12" fill="#5DA3BD"/>'),
  manometre: ic('<path d="M3 23h11v-5" stroke="currentColor" stroke-width="2.5" fill="none"/><circle cx="14" cy="11" r="8" fill="#fff" stroke="currentColor" stroke-width="1.8"/><path d="M14 11l4-4" stroke="#A8492A" stroke-width="2"/>'),
  tubeU: ic('<path d="M9 4v14a5 5 0 0 0 10 0V4" fill="none" stroke="currentColor" stroke-width="4.5"/><path d="M9 13v5a5 5 0 0 0 10 0v-8" fill="none" stroke="#8A949C" stroke-width="2.4"/>'),
  tubeUdiff: ic('<path d="M3 4h6v14a5 5 0 0 0 10 0V4h6" fill="none" stroke="currentColor" stroke-width="3.6"/><path d="M9 14v4a5 5 0 0 0 10 0v-7" fill="none" stroke="#8A949C" stroke-width="2.2"/>'),
  'vp-rect': ic('<path d="M7 4v20" stroke="currentColor" stroke-width="2.2"/><path d="M7 11v8" stroke="#A8492A" stroke-width="5"/><path d="M8 15h12" stroke="#A8492A" stroke-width="1.8"/><path d="M20 15l-4-3v6z" fill="#A8492A"/>'),
  'vp-cercle': ic('<path d="M6 4v20" stroke="currentColor" stroke-width="2.2"/><circle cx="14" cy="15" r="5.5" fill="#fff" stroke="#A8492A" stroke-width="2.4"/><circle cx="14" cy="15" r="1.4" fill="#A8492A"/>'),
  flotteur: ic('<rect x="3" y="15" width="22" height="9" fill="#8CC4DA"/><rect x="8" y="9" width="12" height="10" fill="#C9A46C" stroke="currentColor" stroke-width="1.6"/>'),
  orifice: ic('<path d="M5 4v20" stroke="currentColor" stroke-width="2.4"/><path d="M5 12v3" stroke="#fff" stroke-width="3"/><path d="M6 13.5q9 0 16 9" fill="none" stroke="#5DA3BD" stroke-width="2.6"/>'),
  exutoire: ic('<path d="M3 9h11v8" fill="none" stroke="currentColor" stroke-width="4"/><path d="M14 18q0 4 2 8" fill="none" stroke="#5DA3BD" stroke-width="2.4"/>'),
  pompe: ic('<path d="M2 14h24" stroke="currentColor" stroke-width="3.4"/><circle cx="14" cy="14" r="7" fill="#fff" stroke="currentColor" stroke-width="2"/><path d="M11 10l7 4-7 4z" fill="#A8492A"/>'),
  raccord: ic('<path d="M2 11h8l8-4h8v14h-8l-8-4H2z" fill="#C9D3D8" stroke="currentColor" stroke-width="1.6"/>'),
  venturi: ic('<path d="M2 8h6l5 4h2l5-4h6v12h-6l-5-4h-2l-5 4H2z" fill="#C9D3D8" stroke="currentColor" stroke-width="1.6"/>'),
  pitot: ic('<path d="M2 18h24" stroke="currentColor" stroke-width="5"/><path d="M14 4v14h-6" fill="none" stroke="#A8492A" stroke-width="2"/>'),
  pitotDouble: ic('<path d="M2 8h24" stroke="currentColor" stroke-width="4.5"/><path d="M10 8v8a4 4 0 0 0 8 0V8" fill="none" stroke="currentColor" stroke-width="2.6"/><path d="M10 13v3a4 4 0 0 0 8 0v-5" fill="none" stroke="#8A949C" stroke-width="2"/>'),
  robinet: ic('<path d="M2 9h12q4 0 4 4v2" fill="none" stroke="currentColor" stroke-width="3.4"/><path d="M8 9V5M5 5h6" stroke="currentColor" stroke-width="2"/><path d="M18 17v8" stroke="#5DA3BD" stroke-width="2.4"/>'),
  lance: ic('<path d="M2 10l10 2v4L2 18z" fill="#C9D3D8" stroke="currentColor" stroke-width="1.6"/><path d="M12 14h14" stroke="#5DA3BD" stroke-width="3"/>'),
  plaque: ic('<path d="M3 14h13" stroke="#5DA3BD" stroke-width="3"/><path d="M19 4v20" stroke="currentColor" stroke-width="3.4"/><path d="M18 9q-3-3-4-6M18 19q-3 3-4 6" fill="none" stroke="#5DA3BD" stroke-width="2"/>'),
  auget: ic('<path d="M2 12h12" stroke="#5DA3BD" stroke-width="3"/><path d="M15 6a8 8 0 0 1 0 16" fill="none" stroke="currentColor" stroke-width="3"/><path d="M14 17H5" stroke="#5DA3BD" stroke-width="2"/>')
};
const goutte = c => ic(`<path d="M14 3c4 6 8 10 8 14a8 8 0 0 1-16 0c0-4 4-8 8-14z" fill="${c}" stroke="currentColor" stroke-width="1.4"/>`);
const PALETTE = [
  { titre: 'Récipients', items: [['ouvert', 'Réservoir ouvert'], ['ferme', 'Réservoir fermé'], ['incline', 'Paroi inclinée']] },
  { titre: 'Fluides', items: P.LIQUIDES.map(f => [`fluide:${f}`, P.FLUIDES[f].nom.replace(/ \(.*\)/, '')]) },
  { titre: 'Liaisons', items: [['conduite', 'Conduite'], ['vanne', 'Vanne']] },
  { titre: 'Mesure', items: [['piezometre', 'Piézomètre'], ['manometre', 'Manomètre'], ['tubeU', 'Tube en U'], ['tubeUdiff', 'U différentiel']] },
  { titre: 'Ouvrages', items: [['vp-rect', 'Vanne plane'], ['vp-cercle', 'Vanne circulaire'], ['flotteur', 'Flotteur']] },
  { titre: 'Écoulement', items: [['orifice', 'Orifice'], ['exutoire', 'Sortie libre'], ['pompe', 'Pompe'], ['raccord', 'Changement de section'], ['venturi', 'Venturi'], ['pitot', 'Tube de Pitot'], ['pitotDouble', 'Pitot double'], ['robinet', 'Robinet']] },
  { titre: 'Quantité de mouvement', items: [['lance', 'Lance (jet)'], ['plaque', 'Plaque'], ['auget', 'Auget']] }
];
const AIDE_PALETTE = {
  ouvert: 'Déposez le réservoir : il s’accroche aux cotes rondes et s’aligne sur les autres.',
  ferme: 'Réservoir à ciel gazeux sous pression p₀ (réglable dans l’inspecteur).',
  incline: 'Paroi droite inclinée à 60° : la poussée y a une composante verticale.',
  conduite: 'Déposez sur un premier piquage, puis choisissez le second.',
  vanne: 'Déposez sur une conduite ; un clic l’ouvre ou la ferme.',
  piezometre: 'Déposez sur un piquage de paroi ou de conduite.',
  manometre: 'Déposez sur un piquage : liquide, ciel gazeux ou conduite.',
  tubeU: 'Tube en U ouvert à l’air : déposez-le sur un piquage.',
  tubeUdiff: 'Déposez la première branche, puis choisissez le second piquage.',
  'vp-rect': 'Déposez sur une paroi ou un fond de réservoir.',
  'vp-cercle': 'Déposez sur une paroi ou un fond de réservoir.',
  flotteur: 'Lâchez le corps dans un réservoir : il trouve sa flottaison.',
  orifice: 'Orifice en mince paroi : déposez-le sur une paroi ou un fond (Torricelli).',
  exutoire: 'Point de sortie à l’air libre où aboutira une conduite.',
  pompe: 'Pompe à débit imposé ou à courbe H(Q) ; reliez son aspiration et son refoulement.',
  raccord: 'Jonction entre deux conduites de diamètres différents (élargissement ou rétrécissement).',
  venturi: 'Déposez sur une conduite : col rétréci et manomètre différentiel intégré.',
  pitot: 'Tube de Pitot : déposez sur une conduite, il lit la ligne de charge.',
  pitotDouble: 'Pitot double (prises totale et statique) relié à un tube en U au mercure.',
  robinet: 'Arrivée d’eau à débit constant qui tombe dans le réservoir situé dessous.',
  lance: 'Lance : jet de vitesse et de diamètre imposés (orientation réglable).',
  plaque: 'Plaque lisse : placez-la sur la trajectoire d’un jet pour lire l’effort et le partage du débit.',
  auget: 'Auget : retourne le jet (180°) ; fixe ou animé d’une vitesse u, comme sur une roue Pelton.'
};
// Éléments qui n'agissent qu'en mode écoulement (fluide parfait ou réel).
const ECOULEMENT = ['orifice', 'exutoire', 'pompe', 'raccord', 'venturi', 'pitot', 'pitotDouble', 'robinet', 'lance', 'plaque', 'auget'];
const LIBRES = ['exutoire', 'pompe', 'raccord', 'robinet', 'lance', 'plaque', 'auget'];
const NOMS = { reservoir: 'Réservoir', conduite: 'Conduite', vanne: 'Vanne', piezometre: 'Piézomètre', manometre: 'Manomètre', tubeU: 'Tube en U', vannePlane: 'Vanne plane', flotteur: 'Flotteur',
  orifice: 'Orifice', exutoire: 'Sortie libre', pompe: 'Pompe', raccord: 'Changement de section', venturi: 'Venturi', robinet: 'Robinet',
  lance: 'Lance', plaque: 'Plaque', auget: 'Auget' };
const VITESSES = [1, 5, 10, 30, 60, 100, 300];
function duree(t) {
  if (!(t > 0)) return '0 s';
  if (t < 60) return `${P.nombre(t, t < 10 ? 1 : 0)} s`;
  const m = Math.floor(t / 60), s = Math.round(t - 60 * m);
  if (m < 60) return `${m} min ${String(s).padStart(2, '0')} s`;
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`;
}

export function monterLabo(racine, opts = {}) {
  const integre = opts.mode === 'integre';
  const L = {
    scene: null, scenario: null, A: null, sel: null, vue: { k: 70, ox: 60, oy: 300, W: 640, H: 420 }, zoomManuel: false,
    drag: null, connexion: null, pointeurs: new Map(), pinch: null, histo: [], futur: [], raf: 0, last: 0, temps: 0,
    aff: new Map(), ressorts: new Map(), saisi: new Set(), animation: !reduit(), inspCle: null, alertesCle: '', palette: !integre,
    pause: false, cache: false
  };

  // ---------- DOM ----------
  racine.classList.add('labo');
  if (integre) racine.classList.add('labo-integre');
  const optScen = `<option value="">Atelier libre</option>` + GROUPES.map(([g, nom]) =>
    `<optgroup label="${esc(nom)}">${SCENARIOS.filter(s => (s.chapitre || '1-2') === g).map(s => `<option value="${s.id}">${esc(s.titre)}</option>`).join('')}</optgroup>`).join('');
  const optUnites = Object.keys(P.UNITES).map(u => `<option value="${u}">${P.UNITES[u].nom}</option>`).join('');
  racine.innerHTML = `
    <div class="lb-barre">
      ${integre ? `<strong class="lb-titre-int"></strong>` : `<label class="lb-scen">Expérience <select data-r="scenario">${optScen}</select></label>`}
      <div class="lb-groupe">
        <button type="button" data-a="annuler" title="Annuler (Ctrl+Z)" aria-label="Annuler">↶</button>
        <button type="button" data-a="retablir" title="Rétablir (Ctrl+Y)" aria-label="Rétablir">↷</button>
        <button type="button" data-a="reinit" title="Recharger l’expérience">Réinitialiser</button>
        ${integre ? '' : `<button type="button" data-a="vider">Vider</button>`}
        ${integre ? `<button type="button" data-a="palette" aria-pressed="false">Construire</button>` : ''}
      </div>
      <div class="lb-groupe">
        <select data-r="unite" aria-label="Unité de pression">${optUnites}</select>
        <div class="lb-seg" role="group" aria-label="Référence des pressions">
          <button type="button" data-ref="relative" aria-pressed="true">relative</button><button type="button" data-ref="absolue" aria-pressed="false">absolue</button>
        </div>
        <details class="lb-vues"><summary>Affichage</summary><div>
          <label><input type="checkbox" data-v="champ"> Champ de pression</label>
          <label><input type="checkbox" data-v="charge"> Plans de charge</label>
          <label><input type="checkbox" data-v="cotes"> Cotes</label>
          <label><input type="checkbox" data-v="isobares"> Isobares</label>
          <label><input type="checkbox" data-v="lignes"> Lignes de charge</label>
          <label><input type="checkbox" data-v="efforts"> Efforts (quantité de mouvement)</label>
          <label><input type="checkbox" data-anim> Animer les écoulements</label>
        </div></details>
      </div>
      <div class="lb-groupe lb-temps-g">
        <select data-r="ecoulement" aria-label="Modèle d’écoulement">${Object.entries(E.MODES).map(([k, t]) => `<option value="${k}">${esc(t)}</option>`).join('')}</select>
        <span class="lb-chrono" data-chrono>
          <button type="button" data-a="pause" aria-label="Pause">❚❚</button>
          <select data-r="vitesse" aria-label="Accélération du temps">${VITESSES.map(v => `<option value="${v}">× ${v}</option>`).join('')}</select>
          <output class="lb-temps" aria-live="off">t = 0 s</output>
        </span>
      </div>
      <div class="lb-groupe">
        <button type="button" data-a="cadrer" title="Cadrer la scène">Cadrer</button>
        ${integre ? `<a class="lb-lien" data-r="plein" href="labo.html">Ouvrir le laboratoire ↗</a>` :
        `<button type="button" data-a="exporter">Exporter</button><button type="button" data-a="importer">Importer</button><input type="file" accept="application/json,.json" hidden data-r="fichier">`}
      </div>
    </div>
    <div class="lb-consigne" hidden></div>
    <div class="lb-corps">
      <aside class="lb-palette" aria-label="Palette d’éléments"${L.palette ? '' : ' hidden'}>
        ${PALETTE.map(g => `<div class="lb-pal-g"><h3>${g.titre}</h3><div class="lb-pal-items">${g.items.map(([k, nom]) => {
          const icone = k.startsWith('fluide:') ? goutte(P.FLUIDES[k.slice(7)].couleur) : ICONES[k];
          return `<button type="button" class="lb-tuile" data-k="${k}" title="${esc(AIDE_PALETTE[k] || `Glissez sur un réservoir pour le remplir de ${nom.toLowerCase()}`)}">${icone}<span>${esc(nom)}</span></button>`;
        }).join('')}</div></div>`).join('')}
      </aside>
      <div class="lb-scene" tabindex="0" aria-label="Scène du laboratoire">
        <svg class="lb-svg" role="img" aria-label="Schéma de l’expérience"></svg>
        <ul class="lb-alertes" aria-live="polite"></ul>
        <div class="lb-bulle" hidden></div>
        <div class="lb-zoom"><button type="button" data-a="zplus" aria-label="Zoomer">+</button><button type="button" data-a="zmoins" aria-label="Dézoomer">−</button></div>
        <p class="lb-aide"></p>
      </div>
      <aside class="lb-insp" aria-label="Inspecteur"></aside>
    </div>
    <p class="lb-sr" aria-live="polite"></p>
    <div class="lb-fantome" hidden></div>`;
  const $ = s => racine.querySelector(s);
  const svg = $('.lb-svg'), scene = $('.lb-scene'), insp = $('.lb-insp'), bulle = $('.lb-bulle'), aide = $('.lb-aide'),
    alertesUl = $('.lb-alertes'), fantome = $('.lb-fantome'), annonce = $('.lb-sr'), consigne = $('.lb-consigne'), tempsOut = $('.lb-temps');

  // ---------- état, historique, persistance ----------
  const instantane = () => JSON.stringify(P.exporterScene(L.scene));
  function avantModif() {
    const s = instantane();
    if (L.histo[L.histo.length - 1] !== s) L.histo.push(s);
    if (L.histo.length > 80) L.histo.shift();
    L.futur = [];
    majBoutons();
  }
  function restaurer(json) {
    L.scene = JSON.parse(json);
    if (L.sel && !L.scene.elements.some(e => e.id === L.sel)) L.sel = null;
    L.aff.clear(); L.ressorts.clear();
    majBarre();
    apresEdition(true);
  }
  function annuler() { if (!L.histo.length) return; L.futur.push(instantane()); restaurer(L.histo.pop()); majBoutons(); dire('Action annulée'); }
  function retablir() { if (!L.futur.length) return; L.histo.push(instantane()); restaurer(L.futur.pop()); majBoutons(); }
  function majBoutons() {
    racine.querySelector('[data-a="annuler"]').disabled = !L.histo.length;
    racine.querySelector('[data-a="retablir"]').disabled = !L.futur.length;
  }
  let tSauve = 0;
  function sauver() {
    if (integre) return;
    clearTimeout(tSauve);
    tSauve = setTimeout(() => {
      try { localStorage.setItem(CLE, JSON.stringify({ v: 1, scenario: L.scenario, scene: P.exporterScene(L.scene) })); } catch { /* stockage indisponible */ }
    }, 500);
  }
  function dire(t) { annonce.textContent = ''; setTimeout(() => { annonce.textContent = t; }, 30); }

  function charger(id, { garderHisto = false } = {}) {
    if (garderHisto && L.scene) avantModif();
    L.scene = id ? creerScenario(id) : P.sceneVide();
    L.scenario = id || null;
    L.sel = null; L.connexion = null; L.aff.clear(); L.ressorts.clear(); L.zoomManuel = false; L.pause = false;
    if (!L.animation) E.equilibrer(L.scene);
    L.A = E.analyserTout(L.scene);
    majBarre(); majConsigne(); cadrer(); apresEdition(true);
  }
  function majConsigne() {
    const m = SCENARIOS.find(s => s.id === L.scenario);
    if (integre) { const t = $('.lb-titre-int'); t.textContent = m ? m.titre : 'Laboratoire'; const a = $('[data-r="plein"]'); if (a) a.href = `labo.html${m ? '#' + m.id : ''}`; }
    $('[data-a="reinit"]').hidden = !integre && !m;
    if (!m) { consigne.hidden = true; return; }
    consigne.hidden = false;
    const lien = m.ancre ? (integre ? `#${encodeURIComponent(m.ancre)}` : `cours.html#${encodeURIComponent(m.ancre)}`) : null;
    // « C_d » des consignes s'affiche en indice (texte échappé au préalable)
    const indices = t => esc(t).replace(/([A-Za-zρ])_([A-Za-z0-9]+)/g, '$1<sub>$2</sub>');
    consigne.innerHTML = `${integre ? '' : `<strong>${esc(m.titre)}</strong> <span class="lb-ref">${esc(m.ref)}</span> — `}${indices(m.consigne)}${lien && !integre ? ` <a href="${lien}">Revoir le cours</a>` : ''}`;
  }
  function majBarre() {
    const env = L.scene.env;
    const sc = racine.querySelector('[data-r="scenario"]'); if (sc) sc.value = L.scenario || '';
    racine.querySelector('[data-r="unite"]').value = env.unite;
    racine.querySelectorAll('[data-ref]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.ref === env.reference)));
    racine.querySelectorAll('[data-v]').forEach(c => { c.checked = !!env.vues[c.dataset.v]; });
    racine.querySelector('[data-anim]').checked = L.animation;
    const mode = env.ecoulement || 'illustratif';
    racine.querySelector('[data-r="ecoulement"]').value = mode;
    racine.querySelector('[data-chrono]').hidden = mode === 'illustratif';
    const vs = racine.querySelector('[data-r="vitesse"]');
    if (![...vs.options].some(o => +o.value === env.vitesse)) vs.insertAdjacentHTML('beforeend', `<option value="${env.vitesse}">× ${env.vitesse}</option>`);
    vs.value = String(env.vitesse || 1);
    const bp = racine.querySelector('[data-a="pause"]');
    bp.textContent = L.pause ? '▶' : '❚❚'; bp.setAttribute('aria-label', L.pause ? 'Reprendre' : 'Pause');
  }

  // Toute modification passe par ici : nettoyage, recalcul, rendu.
  function apresEdition(structure = false) {
    P.nettoyerScene(L.scene);
    if (L.sel && !L.scene.elements.some(e => e.id === L.sel)) L.sel = null;
    if (!L.animation) E.equilibrer(L.scene);
    if (structure) L.inspCle = null;
    sauver();
    demander();
  }

  const modeEc = () => L.scene.env.ecoulement || 'illustratif';
  // Déposer un appareil d'écoulement en mode illustratif active le fluide parfait.
  function basculerEcoulement(kind) {
    // jets et obstacles n'ont d'intérêt qu'avec leurs efforts affichés
    if (['lance', 'plaque', 'auget'].includes(kind) && !L.scene.env.vues.efforts) { L.scene.env.vues.efforts = true; majBarre(); }
    if (!ECOULEMENT.includes(kind) || modeEc() !== 'illustratif') return;
    L.scene.env.ecoulement = 'parfait';
    L.pause = false;
    majBarre();
    flash('Écoulement simulé en fluide parfait (changez de modèle dans la barre).');
  }

  // ---------- vue ----------
  const V = () => vueDe(L.vue);
  function emprise() {
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    const ajoute = (x, z) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); };
    const A = L.A || E.analyserTout(L.scene);
    for (const e of L.scene.elements) {
      if (e.type === 'reservoir') { ajoute(e.x, e.z); ajoute(e.x + Math.max(e.w, P.largeurA(e, e.H)), e.z + e.H + 0.3); }
      if (LIBRES.includes(e.type)) { ajoute(e.x - 0.6, e.z - 0.5); ajoute(e.x + 0.6, e.z + 0.5); }
      const m = A.mesures.get(e.id);
      if (m && m.tap) {
        ajoute(m.tap.x, m.tap.z);
        if (e.type === 'piezometre' && m.geo) { ajoute(m.geo.x + 0.4, m.geo.zB + e.Ht + 0.25); ajoute(m.geo.x, m.geo.zB); }
        if (e.type === 'manometre' && m.geo) ajoute(m.geo.x + 0.3, m.geo.zB + (m.tap.sz < 0 ? -0.6 : 0.6));
        if (e.type === 'tubeU' && m.geo) { ajoute(m.geo.xg - 0.2, m.geo.zBas - 0.3); ajoute(m.geo.xd + 0.9, m.geo.zHaut + 0.3); }
      }
      const c = A.conduites.get(e.id);
      if (c) for (const p of c.tr.pts) ajoute(p.x, p.z - 0.25);
    }
    if (A.ecoulement) {
      // les nappes déviées par un obstacle peuvent filer loin : on ne cadre que les jets
      for (const j of A.ecoulement.jets) if (!j.nappe) for (const p of j.pts || []) ajoute(p.x, p.z);
      // la ligne de charge (relevée par une pompe) doit rester dans le cadre
      if (L.scene.env.vues.lignes !== false) for (const sol of A.ecoulement.chaines) for (const [id, pt] of sol.parTuyau || []) {
        const ec = A.conduites.get(id);
        if (ec) for (const q of pt.points) ajoute(P.pointSurTrace(ec.tr, q.t).x, q.H + 0.3);
      }
    }
    if (!Number.isFinite(x0)) { x0 = 0; x1 = 6; z0 = -0.5; z1 = 4; }
    return { x0, x1, z0, z1 };
  }
  function cadrer() {
    const b = emprise(), W = L.vue.W, H = L.vue.H, mg = 0.5;
    const bw = b.x1 - b.x0 + 2 * mg, bh = b.z1 - b.z0 + 2 * mg;
    const k = clamp(Math.min((W - 70) / bw, (H - 40) / bh), 3, 260);
    L.vue.k = k;
    L.vue.ox = 46 + (W - 56 - bw * k) / 2 - (b.x0 - mg) * k;
    L.vue.oy = H - 12 - (H - 34 - bh * k) / 2 + (b.z0 - mg) * k;
    demander();
  }
  function zoomer(f, X = L.vue.W / 2, Y = L.vue.H / 2) {
    const k = clamp(L.vue.k * f, 3, 400), r = k / L.vue.k;
    L.vue.ox = X - (X - L.vue.ox) * r; L.vue.oy = Y - (Y - L.vue.oy) * r; L.vue.k = k;
    L.zoomManuel = true;
    demander();
  }
  const ro = new ResizeObserver(() => {
    const r = scene.getBoundingClientRect();
    if (r.width < 10 || r.height < 10) return;
    const premier = !L.vue.pret;
    L.vue.W = Math.round(r.width); L.vue.H = Math.round(r.height); L.vue.pret = true;
    svg.setAttribute('width', L.vue.W); svg.setAttribute('height', L.vue.H);
    svg.setAttribute('viewBox', `0 0 ${L.vue.W} ${L.vue.H}`);
    if (premier || !L.zoomManuel) cadrer(); else demander();
  });
  ro.observe(scene);

  // ---------- boucle d'animation ----------
  function demander() { if (!L.raf) { L.last = performance.now(); L.raf = requestAnimationFrame(boucle); } }
  function boucle(t) {
    L.raf = 0;
    const dt = Math.min(0.05, Math.max(0, (t - L.last) / 1000));
    L.last = t; L.temps += dt;
    let actif = false;
    const ecoule = (L.scene.env.ecoulement || 'illustratif') !== 'illustratif';
    // En écoulement, le temps s'écoule même sans animation (c'est le contenu) ;
    // hors écran ou en pause, la scène est figée.
    if (!(L.drag && L.drag.gel) && !L.cache && (ecoule ? !L.pause : L.animation)) actif = E.avancer(L.scene, dt);
    L.A = E.analyserTout(L.scene);
    // Tant qu'un débit circule, la boucle continue (même sur une image de durée nulle).
    if (ecoule && !L.pause && L.A.ecoulement && L.A.ecoulement.transferts.some(k => k.Q > 0)) actif = true;
    actif = majAffichage(dt) || actif;
    rendre();
    if (actif && !L.cache) { if (!L.raf) L.raf = requestAnimationFrame(boucle); }
    else sauver();
  }
  // Valeurs affichées : elles rejoignent la valeur calculée en douceur.
  function majAffichage(dt) {
    let bouge = false;
    const k = L.animation ? 1 - Math.exp(-dt / 0.16) : 1;
    const suivre = (id, cible, eps, depart) => {
      if (!Number.isFinite(cible)) { L.aff.delete(id); return; }
      let v = L.aff.get(id);
      if (v == null || !Number.isFinite(v)) v = L.animation && depart != null ? depart : cible;
      v += (cible - v) * k;
      if (Math.abs(cible - v) < eps) v = cible; else bouge = true;
      L.aff.set(id, v);
    };
    for (const e of L.scene.elements) {
      const m = L.A.mesures.get(e.id);
      if (e.type === 'piezometre' && m && !m.erreur) suivre(e.id, m.vide || m.depression ? m.geo.zB : m.zN, 2e-4, m.geo.zB);
      else if (e.type === 'manometre' && m && !m.erreur) suivre(e.id, m.lu, Math.max(1, Math.abs(m.lu) * 1e-4), 0);
      else if (e.type === 'tubeU' && m && !m.erreur) suivre(e.id, Number.isFinite(m.x) ? m.x : 0, 2e-5, 0);
      else if (e.type === 'vanne') suivre(e.id, e.ouverte ? 1 : 0, 0.01, null);
      else if (e.type === 'flotteur') {
        const f = L.A.flotteurs.get(e.id);
        if (!f || f.erreur || L.saisi.has(e.id)) continue;
        let r = L.ressorts.get(e.id);
        if (!r || !L.animation) { r = { z: f.zb, v: 0 }; L.ressorts.set(e.id, r); continue; }
        const w = 5.5, zeta = 0.28, n = Math.max(1, Math.ceil(dt / 0.008));
        for (let i = 0; i < n; i++) { const h = dt / n; r.v += (-w * w * (r.z - f.zb) - 2 * zeta * w * r.v) * h; r.z += r.v * h; }
        if (Math.abs(r.z - f.zb) < 1e-4 && Math.abs(r.v) < 1e-3) { r.z = f.zb; r.v = 0; } else bouge = true;
      }
    }
    return bouge;
  }
  const affAPI = {
    val: (id, cible) => (L.aff.has(id) ? L.aff.get(id) : cible),
    vanne: v => (L.aff.has(v.id) ? L.aff.get(v.id) : (v.ouverte ? 1 : 0)),
    flot: (id, cible) => (L.ressorts.has(id) ? L.ressorts.get(id).z : cible)
  };

  // ---------- rendu ----------
  function rendre() {
    if (!L.vue.pret) return;
    const d = L.drag && L.drag.ui || {};
    const ui = { selection: L.sel, aff: affAPI, temps: L.temps, W: L.vue.W, saisi: L.saisi,
      guides: d.guides, cibles: d.cibles || (L.connexion && L.connexion.cibles), aimant: d.aimant || (L.connexion && L.connexion.aimant), apercu: d.apercu || (L.connexion && L.connexion.apercu) };
    svg.innerHTML = dessinerScene(L.scene, L.A, L.vue, ui);
    if (modeEc() !== 'illustratif') { const tt = `t = ${duree(L.scene._t || 0)}`; if (tempsOut.textContent !== tt) tempsOut.textContent = tt; }
    majAlertes();
    majInspecteur();
    majAide();
  }
  function majAlertes() {
    const al = L.A.alertes.slice(0, 4);
    const cle = al.map(a => a.texte).join('|');
    if (cle === L.alertesCle) return;
    L.alertesCle = cle;
    alertesUl.innerHTML = al.map(a => `<li class="${a.niveau}"><button type="button" data-sel="${esc(a.id)}">${a.texte}</button></li>`).join('');
  }
  function majAide() {
    let t;
    if (L.connexion) t = L.connexion.type === 'conduite' ? 'Choisissez le second piquage ou le port d’un appareil (Échap pour annuler).' : 'Choisissez le piquage de la seconde branche (Échap pour annuler).';
    else if (L.drag && L.drag.mode === 'palette') t = L.drag.texteAide || 'Relâchez sur une cible surlignée.';
    else if (!L.scene.elements.length) t = integre ? 'Ouvrez la palette « Construire » pour ajouter des éléments.' : 'Glissez un réservoir depuis la palette, puis remplissez-le en y déposant un fluide.';
    else if (modeEc() !== 'illustratif') t = integre ? 'Cliquez une vanne, une pompe ou un orifice · ❚❚ fige le temps · Ctrl + molette : zoom'
      : 'Cliquez une vanne, une pompe ou un orifice pour les manœuvrer · ❚❚ fige le temps, × l’accélère · glissez les appareils · molette : zoom';
    else t = integre ? 'Cliquez une vanne · tirez une surface libre · survolez le liquide pour lire la pression · Ctrl + molette : zoom'
      : 'Cliquez une vanne pour l’ouvrir · tirez une surface libre pour remplir · survolez le liquide pour lire la pression · molette : zoom · glisser le fond : déplacer la vue';
    if (aide.textContent !== t) aide.textContent = t;
  }

  // ---------- cibles d'accrochage ----------
  function ciblesPiquages({ conduites = true, couvercles = true, sauf = null, appareils = false, pitot = false, reservoirs = true } = {}) {
    const res = [], A = L.A || E.analyserTout(L.scene);
    for (const e of L.scene.elements) {
      if (reservoirs && e.type === 'reservoir' && e.id !== sauf) {
        for (const p of P.portsReservoir(e)) if (couvercles || p.paroi !== 'h') res.push({ ...p, ref: { el: e.id, port: p.id } });
      }
      if (conduites && e.type === 'conduite' && A.conduites.get(e.id)) {
        // prise statique « t » ou prise face au courant « k » (Pitot)
        const pr = pitot ? 'k' : 't';
        for (const t of P.TAPS_CONDUITE) {
          const q = P.pointSurTrace(A.conduites.get(e.id).tr, t);
          res.push({ x: q.x, z: q.z, sx: 0, sz: 1, paroi: pr, el: e.id, ref: { el: e.id, port: `${pr}:${t.toFixed(2)}` } });
        }
      }
    }
    if (appareils) res.push(...portsLibres(sauf));
    return res;
  }
  // Ports d'appareils (pompe, raccord, sortie libre) encore libres.
  function portsLibres(sauf = null) {
    const pris = new Set(L.scene.elements.filter(c => c.type === 'conduite').flatMap(c => [`${c.a.el}:${c.a.port}`, `${c.b.el}:${c.b.port}`]));
    const res = [];
    for (const e of L.scene.elements) {
      if (!P.APPAREILS.includes(e.type) || e.id === sauf) continue;
      for (const port of P.PORTS_APPAREIL[e.type]) {
        if (pris.has(`${e.id}:${port}`)) continue;
        res.push({ ...P.portAppareil(e, port), paroi: 'appareil', el: e.id, id: port, ref: { el: e.id, port } });
      }
    }
    return res;
  }
  // Placement libre d'un appareil : grille et cotes remarquables.
  function placerLibre(x, z, sauf = null) {
    const res = L.scene.elements.filter(e => e.type === 'reservoir');
    const devs = L.scene.elements.filter(e => LIBRES.includes(e.type) && e.id !== sauf);
    const cz = [{ v: L.scene.env.zSol ?? 0, texte: 'niveau du sol' },
      ...res.flatMap(r => [{ v: r.z, texte: `fond de ${r.id}` }, { v: r.z + r.H, texte: `haut de ${r.id}` }, { v: L.A.etats.get(r.id).zL, texte: `surface de ${r.id}` }]),
      ...devs.map(e => ({ v: e.z, texte: `axe de ${e.id}` }))];
    const cx = [...res.map(r => ({ v: r.x + P.largeurA(r, r.H) / 2 })), ...devs.map(e => ({ v: e.x }))];
    const ax = aimanter(x, cx), az = aimanter(z, cz);
    const p = { x: ax.v, z: az.v };
    p.guide = az.cible && az.cible.texte ? { z: p.z, x: p.x, texte: az.cible.texte } : null;
    p.texte = `x = ${NB(p.x, 2)} m · z = ${NB(p.z, 2)} m`;
    return p;
  }
  function plusProche(cibles, X, Y, rayon = 34) {
    const v = V();
    let best = null, d = rayon;
    for (const c of cibles) { const dd = Math.hypot(v.X(c.x) - X, v.Y(c.z) - Y); if (dd < d) { d = dd; best = c; } }
    return best;
  }
  const etiquettePort = c => c.paroi === 't' ? `piquage sur ${c.el} · z = ${NB(c.z, 2)} m`
    : c.paroi === 'k' ? `prise face au courant sur ${c.el} · z = ${NB(c.z, 2)} m`
      : c.paroi === 'appareil' ? `${c.el} · ${({ o: 'sortie', asp: 'aspiration', ref: 'refoulement', a: 'entrée a', b: 'sortie b' })[c.id]} · z = ${NB(c.z, 2)} m`
        : `${c.el} · ${({ g: 'paroi gauche', d: 'paroi droite', f: 'fond', h: 'couvercle' })[c.paroi]} · z = ${NB(c.z, 2)} m`;
  const nomDe = el => (el.type === 'piezometre' && /^k:/.test(el.piquage.port) ? 'Tube de Pitot' : el.type === 'tubeU' && /^k:/.test(el.piquage.port) ? 'Pitot double' : NOMS[el.type] || 'Élément');
  // Aimant 1D : cibles prioritaires, sinon grille fine.
  function aimanter(v, cibles, pas = 0.05) {
    const tol = 9 / L.vue.k;
    let best = null;
    for (const c of cibles) if (Math.abs(c.v - v) < tol && (!best || Math.abs(c.v - v) < Math.abs(best.v - v))) best = c;
    if (best) return { v: best.v, cible: best };
    const g = arr(v, 0.25);
    if (Math.abs(g - v) < tol * 0.7) return { v: g, cible: { v: g, texte: null, grille: true } };
    return { v: arr(v, pas), cible: null };
  }
  function reservoirSous(x, z, marge = 0) {
    for (let i = L.scene.elements.length - 1; i >= 0; i--) {
      const r = L.scene.elements[i];
      if (r.type !== 'reservoir') continue;
      const s = z - r.z;
      if (s >= -marge && s <= r.H + marge && x >= r.x - marge && x <= r.x + P.largeurA(r, clamp(s, 0, r.H)) + marge) return r;
    }
    return null;
  }
  function paroiProche(X, Y, a = 0.5) {
    const v = V(), x = v.x(X), z = v.z(Y);
    let best = null, dmin = 30;
    for (const r of L.scene.elements) {
      if (r.type !== 'reservoir') continue;
      for (const paroi of ['g', 'd', 'f']) {
        const R = P.repereParoi(r, paroi), Lw = R.L;
        const u = (x - R.ox) * R.dx + (z - R.oz) * R.dz;
        const uc = clamp(u, Math.min(a / 2, Lw / 2), Math.max(Lw - a / 2, Lw / 2));
        const px = R.ox + uc * R.dx, pz = R.oz + uc * R.dz, d = Math.hypot(v.X(px) - X, v.Y(pz) - Y);
        if (d < dmin) { dmin = d; best = { r, paroi, s: uc, L: Lw, R }; }
      }
    }
    return best;
  }

  // ---------- création d'éléments ----------
  const nouvelId = t => P.nouvelId(L.scene, t);
  function nouveauReservoir(kind, x, z) {
    const r = { id: nouvelId('reservoir'), type: 'reservoir', nom: '', x, z, w: kind === 'incline' ? 1.6 : 1.5, H: 3, b: 1, alpha: kind === 'incline' ? 60 : 90,
      ferme: kind === 'ferme', diagramme: 'aucune', ciel: { mode: 'impose', p: kind === 'ferme' ? 20000 : 0, n: 0 }, couches: [] };
    r.couches = P.couchesDepuisHauteurs(r, [{ fluide: 'eau', h: 2 }]);
    return r;
  }
  function decalageAppareil(ref) {
    // Les appareils d'une même paroi s'écartent les uns des autres.
    const memes = L.scene.elements.filter(e => (e.type === 'piezometre' || e.type === 'manometre') && e.piquage.el === ref.el && e.piquage.port[0] === ref.port[0]);
    return 0.35 + 0.45 * memes.length;
  }
  function hauteurPiezo(ref) {
    const A = E.analyserTout(L.scene), t = P.piquage(L.scene, ref, { ...A, idx: A.idx });
    if (!t || !t.fluide || !(t.p > 0)) return 1.5;
    return clamp(Math.ceil((t.p / (t.rho * A.ctx.g) + 0.5) / 0.25) * 0.25, 0.75, 20);
  }
  function creerAppareil(kind, c) {
    const ref = { el: c.el || c.ref.el, port: c.ref.port };
    if (kind === 'piezometre') return { id: nouvelId('piezometre'), type: 'piezometre', piquage: ref, Ht: hauteurPiezo(ref), d: 12, ox: c.paroi === 't' ? 0 : decalageAppareil(ref) };
    if (kind === 'manometre') return { id: nouvelId('manometre'), type: 'manometre', piquage: ref, mode: 'relatif', ox: c.paroi === 't' ? 0 : decalageAppareil(ref) };
    if (kind === 'tubeU') return { id: nouvelId('tubeU'), type: 'tubeU', piquage: ref, piquage2: null, fluideM: 'mercure', L: 1, ox: c.sx < 0 ? -0.6 : 0.6, oz: -0.6 };
    if (kind === 'pitot') return { id: nouvelId('piezometre'), type: 'piezometre', piquage: ref, Ht: hauteurPiezo(ref), d: 8, ox: 0 };
    if (kind === 'pitotDouble') return { id: nouvelId('tubeU'), type: 'tubeU', piquage: ref, piquage2: { el: ref.el, port: ref.port.replace(/^k/, 't') }, fluideM: 'mercure', L: 0.6, ox: 0, oz: -0.7 };
    return null;
  }
  function nouvelAppareil(kind, x, z) {
    const id = nouvelId(kind);
    if (kind === 'pompe') return { id, type: 'pompe', x, z, sens: 1, marche: true, mode: 'debit', Q: 0.01, H0: 30, k: 1e4, eta: 0.7 };
    if (kind === 'robinet') return { id, type: 'robinet', x, z, Q: 0.005, fluide: 'eau', ouvert: true };
    if (kind === 'lance') return { id, type: 'lance', x, z, angle: 0, d: 0.05, V: 10, fluide: 'eau', ouvert: true };
    if (kind === 'plaque') return { id, type: 'plaque', x, z, angle: 90, L: 0.8 };
    if (kind === 'auget') return { id, type: 'auget', x, z, angle: 180, w: 0.3, beta: 180, sens: 1, u: 0 };
    return { id, type: kind, x, z };
  }
  const nouvelOrifice = (r, paroi, s) => ({ id: nouvelId('orifice'), type: 'orifice', reservoir: r.id, paroi, s, d: 0.05, Cd: 0.62, Cv: 0.98, ouvert: true });
  const nouveauVenturi = (c, t) => ({ id: nouvelId('venturi'), type: 'venturi', conduite: c.id, t, d: Math.max(3, arr(c.D * 500, 1)) / 1000, Cq: 0.98, fluideM: 'mercure' });
  function ajoutRapideEcoulement(kind, cible) {
    const els = L.scene.elements;
    const cond = els.find(e => e.id === L.sel && e.type === 'conduite') || els.find(e => e.type === 'conduite');
    if (kind === 'venturi' || kind === 'pitot' || kind === 'pitotDouble') {
      if (!cond) return refus('Ajoutez d’abord une conduite.');
      basculerEcoulement(kind);
      if (kind === 'venturi') return ajouter(nouveauVenturi(cond, 0.5));
      const ref = { el: cond.id, port: 'k:0.35' };
      return ajouter(creerAppareil(kind, { ...P.resoudre(L.scene, ref), el: cond.id, ref }));
    }
    if (kind === 'orifice') {
      if (!cible) return refus('Ajoutez d’abord un réservoir.');
      basculerEcoulement(kind);
      return ajouter(nouvelOrifice(cible, 'd', Math.min(0.25, cible.H / 2)));
    }
    basculerEcoulement(kind);
    const la = els.find(e => e.id === L.sel && e.type === 'lance') || els.find(e => e.type === 'lance');
    if ((kind === 'plaque' || kind === 'auget') && la) {
      const a = la.angle * Math.PI / 180, o = nouvelAppareil(kind, arr(la.x + 0.8 * Math.cos(a), 0.05), arr(la.z + 0.8 * Math.sin(a), 0.05));
      if (kind === 'auget') o.angle = la.angle + 180; else o.angle = la.angle + 90;
      return ajouter(o);
    }
    if (kind === 'robinet' && cible) return ajouter(nouvelAppareil(kind, arr(cible.x + P.largeurA(cible, cible.H) / 2, 0.05), arr(cible.z + cible.H + 0.5, 0.05)));
    const b = els.length ? emprise() : { x1: 0 };
    ajouter(nouvelAppareil(kind, arr(b.x1 + 1, 0.25), cible ? arr(cible.z + 0.25, 0.25) : 0.5));
    if (!L.zoomManuel) cadrer();
  }
  function ajouter(el, { selection = true } = {}) {
    L.scene.elements.push(el);
    if (el.type === 'conduite') {
      // Une conduite neuve arrive vanne fermée : rien ne coule avant que l'élève l'ouvre.
      L.scene.elements.push({ id: nouvelId('vanne'), type: 'vanne', conduite: el.id, t: 0.5, ouverte: false });
      flash('Conduite posée avec une vanne fermée : cliquez la vanne pour l’ouvrir.');
    }
    if (el.type === 'reservoir') P.calerGaz(el, L.A ? L.A.ctx : P.contexte(L.scene), L.scene);
    if (selection) L.sel = el.id;
    apresEdition(true);
    dire(`${nomDe(el)} ${el.id} ajouté`);
  }
  function remplir(r, fluide, zCible) {
    const A = E.analyserTout(L.scene), e = A.etats.get(r.id);
    let h = zCible != null ? zCible - e.zL : 0;
    if (!(h > 0.02)) h = Math.min(0.5, Math.max(0.05, r.H - e.sL - 0.05));
    if (r.ferme) h = Math.min(h, (r.H - e.sL) * 0.9);
    h = Math.min(h, r.H - e.sL);
    if (!(h > 1e-3)) { dire(`${r.id} est plein`); return false; }
    // Volume entre la surface actuelle et la cible (paroi éventuellement inclinée).
    const vol = (s0, s1) => r.b * (r.w * (s1 - s0) + P.cotan(r) * (s1 * s1 - s0 * s0) / 2);
    const dV = vol(e.sL, e.sL + h);
    const c = r.couches.find(k => k.fluide === fluide);
    if (c) c.V += dV; else r.couches.push({ fluide, V: dV });
    r.couches = P.trierCouches(r.couches, A.ctx);
    if (r.constant) r.hc = Math.min(r.H, e.sL + h);
    P.calerGaz(r, A.ctx, L.scene);
    return true;
  }
  function ajoutRapide(kind) {
    const els = L.scene.elements, tanks = els.filter(e => e.type === 'reservoir');
    const cible = (els.find(e => e.id === L.sel && e.type === 'reservoir')) || tanks[0];
    avantModif();
    if (ECOULEMENT.includes(kind)) return ajoutRapideEcoulement(kind, cible);
    if (kind === 'ouvert' || kind === 'ferme' || kind === 'incline') {
      const b = tanks.length ? emprise() : { x1: -1 };
      ajouter(nouveauReservoir(kind, arr(b.x1 + 1.2, 0.25), 0));
      if (!L.zoomManuel) cadrer();
      return;
    }
    if (kind.startsWith('fluide:')) {
      if (!cible) return refus('Ajoutez d’abord un réservoir.');
      if (remplir(cible, kind.slice(7), null)) { L.sel = cible.id; apresEdition(true); }
      return;
    }
    if (kind === 'conduite' || kind === 'tubeUdiff') {
      if (tanks.length < 2) return refus('Il faut deux réservoirs.');
      const [a, b] = cible === tanks[1] ? [tanks[1], tanks[0]] : [cible, tanks.find(t => t !== cible)];
      const gauche = a.x <= b.x;
      const pa = { el: a.id, port: `${gauche ? 'd' : 'g'}:0.25` }, pb = { el: b.id, port: `${gauche ? 'g' : 'd'}:0.25` };
      if (kind === 'conduite') ajouter({ id: nouvelId('conduite'), type: 'conduite', a: pa, b: pb, zr: null, D: 0.1 });
      else ajouter(diffEntre(pa, pb));
      return;
    }
    if (kind === 'vanne') {
      const c = els.find(e => e.id === L.sel && e.type === 'conduite') || els.find(e => e.type === 'conduite');
      if (!c) return refus('Ajoutez d’abord une conduite.');
      ajouter({ id: nouvelId('vanne'), type: 'vanne', conduite: c.id, t: 0.5, ouverte: false });
      return;
    }
    if (!cible) return refus('Ajoutez d’abord un réservoir.');
    if (kind === 'piezometre' || kind === 'manometre' || kind === 'tubeU') {
      const s = clamp(arr(cible.H * 0.2, 0.25), 0.25, cible.H - 0.25);
      const ref = { el: cible.id, port: `${kind === 'manometre' ? 'g' : 'd'}:${s.toFixed(2)}` };
      const p = P.resoudre(L.scene, ref);
      ajouter(creerAppareil(kind, { ...p, ref }));
      return;
    }
    if (kind === 'vp-rect' || kind === 'vp-cercle') {
      const a = Math.min(1, cible.H / 3);
      ajouter({ id: nouvelId('vannePlane'), type: 'vannePlane', reservoir: cible.id, paroi: 'd', s: a / 2 + 0.25, forme: kind === 'vp-cercle' ? 'cercle' : 'rect', a, l: kind === 'vp-cercle' ? a : cible.b, charniere: 'aucune' });
      return;
    }
    if (kind === 'flotteur') {
      ajouter(nouveauFlotteur(cible, cible.w / 2));
    }
  }
  function nouveauFlotteur(r, x) {
    // Section plus large que haute : stable en bois (d = 0,6), contrairement au cube.
    const l = Math.min(1, 0.4 * r.w), h = Math.max(0.2, 0.5 * l), b = Math.min(1, r.b);
    return { id: nouvelId('flotteur'), type: 'flotteur', reservoir: r.id, x: clamp(x, l / 2, r.w - l / 2), l, h, b, m: 600 * l * h * b, zG: h / 2, gite: 0 };
  }
  function diffEntre(pa, pb) {
    const A = P.resoudre(L.scene, pa), B = P.resoudre(L.scene, pb);
    const z0 = Math.min(A.z, B.z) - 0.7;
    return { id: nouvelId('tubeU'), type: 'tubeU', piquage: pa, piquage2: pb, fluideM: 'mercure', L: 1, ox: arr((B.x - A.x) / 2, 0.05) || 0.6, oz: arr(z0 - A.z, 0.05) };
  }
  function refus(t) { L.histo.pop(); majBoutons(); dire(t); flash(t); }
  let tFlash = 0;
  function flash(t) { aide.textContent = t; aide.classList.add('lb-flash'); clearTimeout(tFlash); tFlash = setTimeout(() => { aide.classList.remove('lb-flash'); majAide(); }, 2200); }

  // ---------- dépôt depuis la palette ----------
  function majDepot(d, X, Y) {
    const v = V(), x = v.x(X), z = v.z(Y), k = d.kind;
    d.ui = { cibles: null, aimant: null, apercu: null, guides: [] };
    d.cible = null;
    if (k === 'ouvert' || k === 'ferme' || k === 'incline') {
      const r = nouveauReservoir(k, 0, 0);
      const ax = aimanter(x - r.w / 2, L.scene.elements.filter(e => e.type === 'reservoir').flatMap(e => [{ v: e.x + P.largeurA(e, 0) + 0.6 }, { v: e.x }]));
      const cz = L.scene.elements.filter(e => e.type === 'reservoir').map(e => ({ v: e.z, texte: `fond aligné sur ${e.id}` }));
      cz.push({ v: 0, texte: 'z = 0' });
      const az = aimanter(z - 1, cz);
      r.x = ax.v; r.z = az.v;
      d.cible = r;
      d.ui.apercu = apercuReservoir(L.vue, r);
      if (az.cible && az.cible.texte) d.ui.guides.push({ z: r.z, x: r.x, texte: az.cible.texte });
      d.texteAide = `Fond à z = ${NB(r.z, 2)} m`;
      return;
    }
    if (k.startsWith('fluide:')) {
      const r = reservoirSous(x, z, 0.2);
      if (!r) { d.texteAide = 'Relâchez au-dessus d’un réservoir pour le remplir.'; return; }
      const e = L.A.etats.get(r.id);
      const cz = L.scene.elements.filter(o => o.type === 'reservoir' && o !== r).map(o => ({ v: L.A.etats.get(o.id).zL, texte: `surface de ${o.id}` }));
      let zc = aimanter(clamp(z, e.zL, r.z + r.H), cz).v;
      if (zc <= e.zL + 0.02) zc = Math.min(e.zL + 0.5, r.z + r.H);
      const fl = L.A.ctx.fl(k.slice(7));
      d.cible = { r, z: zc };
      d.ui.apercu = apercuRemplissage(L.vue, r, e.sL, zc - r.z, fl.couleur, `+ ${NB(zc - e.zL, 2)} m de ${fl.nom.toLowerCase()}`);
      d.texteAide = `Remplir ${r.id} jusqu’à z = ${NB(zc, 2)} m`;
      return;
    }
    if (k === 'piezometre' || k === 'manometre' || k === 'tubeU' || k === 'conduite' || k === 'tubeUdiff') {
      const cibles = ciblesPiquages({ conduites: k !== 'conduite' && k !== 'tubeUdiff', couvercles: k === 'manometre' || k === 'tubeU', appareils: k === 'conduite' });
      const c = plusProche(cibles, X, Y);
      d.ui.cibles = cibles.map(q => ({ x: q.x, z: q.z, actif: q === c }));
      if (c) { d.cible = c; d.ui.aimant = { x: c.x, z: c.z, texte: etiquettePort(c) }; }
      d.texteAide = c ? etiquettePort(c) : 'Approchez d’un piquage (points) pour accrocher l’appareil.';
      return;
    }
    if (k === 'vanne' || k === 'venturi') {
      let best = null;
      for (const [id, ec] of L.A.conduites) {
        const p = P.projeterSurTrace(ec.tr, x, z), dpx = p.d * L.vue.k;
        if (dpx < 30 && (!best || dpx < best.dpx)) best = { id, t: clamp(arr(p.t, 0.05), 0.05, 0.95), dpx, tr: ec.tr };
      }
      if (best) { const q = P.pointSurTrace(best.tr, best.t); d.cible = best; d.ui.aimant = { x: q.x, z: q.z, texte: `sur ${best.id}` }; }
      d.texteAide = best ? `${k === 'vanne' ? 'Vanne' : 'Venturi'} sur ${best.id}` : 'Approchez d’une conduite.';
      return;
    }
    if (k === 'pitot' || k === 'pitotDouble') {
      const cibles = ciblesPiquages({ reservoirs: false, pitot: true });
      const c = plusProche(cibles, X, Y);
      d.ui.cibles = cibles.map(q => ({ x: q.x, z: q.z, actif: q === c }));
      if (c) { d.cible = c; d.ui.aimant = { x: c.x, z: c.z, texte: etiquettePort(c) }; }
      d.texteAide = c ? etiquettePort(c) : 'Approchez d’une conduite (points) : la prise s’ouvre face au courant.';
      return;
    }
    if (k === 'orifice') {
      const pw = paroiProche(X, Y, 0.1);
      if (pw) {
        const e = L.A.etats.get(pw.r.id), cibles = [];
        for (let s = 0.25; s < pw.L - 0.05; s += 0.25) cibles.push({ v: s });
        const s = clamp(aimanter(pw.s, cibles, 0.01).v, 0.05, pw.L - 0.05);
        const R = pw.R, c = { x: R.ox + s * R.dx, z: R.oz + s * R.dz };
        d.cible = { ...pw, s };
        d.ui.aimant = { x: c.x, z: c.z, texte: `${pw.r.id} · ${pw.paroi === 'f' ? 'fond · ' : ''}h = ${NB(e.zL - c.z, 2)} m sous la surface` };
      }
      d.texteAide = pw ? 'Relâchez pour percer l’orifice.' : 'Approchez d’une paroi ou d’un fond de réservoir.';
      return;
    }
    if (LIBRES.includes(k)) {
      const p = placerLibre(x, z);
      d.cible = p;
      d.ui.aimant = { x: p.x, z: p.z, texte: p.guide ? p.guide.texte : p.texte };
      if (p.guide) d.ui.guides.push(p.guide);
      d.texteAide = `${NOMS[k]} à ${p.texte}`;
      return;
    }
    if (k === 'vp-rect' || k === 'vp-cercle') {
      const a = 0.8;
      const pw = paroiProche(X, Y, a);
      if (pw) {
        const e = L.A.etats.get(pw.r.id);
        const cibles = [];
        for (let s = a / 2; s <= pw.L - a / 2 + 1e-9; s += 0.25) cibles.push({ v: s });
        const s = clamp(aimanter(pw.s, cibles).v, a / 2, pw.L - a / 2);
        const R = pw.R, c = { x: R.ox + s * R.dx, z: R.oz + s * R.dz };
        d.cible = { ...pw, s, a };
        d.ui.apercu = apercuSegment(L.vue, { x: R.ox + (s - a / 2) * R.dx, z: R.oz + (s - a / 2) * R.dz }, { x: R.ox + (s + a / 2) * R.dx, z: R.oz + (s + a / 2) * R.dz });
        d.ui.aimant = { x: c.x, z: c.z, texte: pw.paroi === 'f' ? `${pw.r.id} · fond` : `${pw.r.id} · centre à ${NB(e.zL - c.z, 2)} m sous la surface` };
      }
      d.texteAide = pw ? 'Relâchez pour poser la vanne sur cette paroi.' : 'Approchez d’une paroi de réservoir.';
      return;
    }
    if (k === 'flotteur') {
      const r = reservoirSous(x, z, 0.3);
      if (!r) { d.texteAide = 'Lâchez le flotteur dans un réservoir.'; return; }
      const f = nouveauFlotteur(r, arr(x - r.x, 0.05));
      d.cible = { r, f, z: Math.max(z - f.h / 2, r.z) };
      d.ui.apercu = apercuFlotteur(L.vue, r, f, d.cible.z);
      d.texteAide = `Lâcher dans ${r.id}`;
    }
  }
  function deposer(d) {
    const k = d.kind, c = d.cible;
    if (!c) return;
    avantModif();
    if (k === 'ouvert' || k === 'ferme' || k === 'incline') { c.id = nouvelId('reservoir'); ajouter(c); return; }
    if (k.startsWith('fluide:')) { if (remplir(c.r, k.slice(7), c.z)) { L.sel = c.r.id; apresEdition(true); } else L.histo.pop(); return; }
    if (k === 'piezometre' || k === 'manometre' || k === 'tubeU') { ajouter(creerAppareil(k, c)); return; }
    if (k === 'conduite' || k === 'tubeUdiff') { L.histo.pop(); demarrerConnexion(k === 'conduite' ? 'conduite' : 'tubeU', c); return; }
    if (k === 'vanne') { ajouter({ id: nouvelId('vanne'), type: 'vanne', conduite: c.id, t: c.t, ouverte: false }); return; }
    if (ECOULEMENT.includes(k)) basculerEcoulement(k);
    if (k === 'venturi') { ajouter(nouveauVenturi(elt(c.id), c.t)); return; }
    if (k === 'pitot' || k === 'pitotDouble') { ajouter(creerAppareil(k, c)); return; }
    if (k === 'orifice') { ajouter(nouvelOrifice(c.r, c.paroi, c.s)); return; }
    if (LIBRES.includes(k)) { ajouter(nouvelAppareil(k, c.x, c.z)); return; }
    if (k === 'vp-rect' || k === 'vp-cercle') {
      ajouter({ id: nouvelId('vannePlane'), type: 'vannePlane', reservoir: c.r.id, paroi: c.paroi, s: c.s, forme: k === 'vp-cercle' ? 'cercle' : 'rect', a: c.a, l: k === 'vp-cercle' ? c.a : Math.min(c.r.b, 1), charniere: 'aucune' });
      return;
    }
    if (k === 'flotteur') {
      ajouter(c.f);
      L.ressorts.set(c.f.id, { z: c.z, v: 0 });
    }
  }
  function demarrerConnexion(type, premier) {
    const cibles = ciblesPiquages({ conduites: false, couvercles: false, sauf: type === 'conduite' ? premier.el : null, appareils: type === 'conduite' }).filter(q => !(q.el === premier.el && q.id === premier.id));
    L.connexion = { type, premier, cibles: cibles.map(q => ({ x: q.x, z: q.z, actif: false })), liste: cibles, aimant: null, apercu: null };
    dire('Choisissez le second piquage');
    demander();
  }
  function majConnexion(X, Y) {
    const c = L.connexion, q = plusProche(c.liste, X, Y);
    c.choix = q;
    c.cibles = c.liste.map(p => ({ x: p.x, z: p.z, actif: p === q }));
    c.aimant = q ? { x: q.x, z: q.z, texte: etiquettePort(q) } : null;
    const v = V();
    c.apercu = apercuSegment(L.vue, c.premier, q || { x: v.x(X), z: v.z(Y) });
    demander();
  }
  function finirConnexion() {
    const c = L.connexion; L.connexion = null;
    if (!c.choix) { dire('Liaison annulée'); demander(); return; }
    avantModif();
    const pa = { el: c.premier.el, port: c.premier.id }, pb = { el: c.choix.el, port: c.choix.id };
    if (c.type === 'conduite') ajouter({ id: nouvelId('conduite'), type: 'conduite', a: pa, b: pb, zr: null, D: 0.1 });
    else ajouter(diffEntre(pa, pb));
  }

  // ---------- glisser dans la scène ----------
  const local = e => { const r = svg.getBoundingClientRect(); return { X: e.clientX - r.left, Y: e.clientY - r.top }; };
  const elt = id => L.scene.elements.find(e => e.id === id);
  function demarrerGlisser(d) {
    const [type, id, extra] = (d.h || '').split(':');
    const el = elt(id), v = V();
    d.type = type; d.el = el;
    const glissables = ['res', 'surf', 'taille', 'palier', 'van', 'inst', 'ubloc', 'vp', 'flot', 'dev', 'vt'];
    if (!type || !el || !glissables.includes(type)) { d.type = 'vue'; d.vue0 = { ...L.vue }; return; }
    avantModif();
    if (type === 'res') { d.dx = v.x(d.debut.X) - el.x; d.dz = v.z(d.debut.Y) - el.z; }
    else if (type === 'surf') { d.i = +extra; d.gel = true; }
    else if (type === 'taille') { d.gel = true; d.hauteurs = hauteursCouches(el); }
    else if (type === 'flot') { L.saisi.add(el.id); d.gel = false; }
    else if (type === 'inst') { d.origine = { ...el.piquage }; d.origine2 = el.piquage2 ? { ...el.piquage2 } : null; }
    else if (type === 'dev' && el.type !== 'orifice') { d.dx = v.x(d.debut.X) - el.x; d.dz = v.z(d.debut.Y) - el.z; }
    else if (type === 'ubloc') { const m = L.A.mesures.get(el.id); d.dx = v.x(d.debut.X) - m.geo.xc; d.dz = v.z(d.debut.Y) - m.geo.z0; }
  }
  function hauteursCouches(r) {
    const e = L.A.etats.get(r.id);
    return e.niveaux.map(n => ({ fluide: n.fluide, h: n.s1 - n.s0 }));
  }
  function majGlisser(d, X, Y) {
    const v = V(), x = v.x(X), z = v.z(Y), el = d.el;
    d.ui = { guides: [] };
    switch (d.type) {
      case 'vue': L.vue.ox = d.vue0.ox + X - d.debut.X; L.vue.oy = d.vue0.oy + Y - d.debut.Y; L.zoomManuel = true; break;
      case 'res': {
        const autres = L.scene.elements.filter(e => e.type === 'reservoir' && e !== el);
        const cx = autres.flatMap(e => [{ v: e.x }, { v: e.x + P.largeurA(e, 0) + 0.6, texte: null }, { v: e.x - el.w - 0.6 }]);
        const ez = L.A.etats.get(el.id);
        const cz = [{ v: 0, texte: 'z = 0' }, ...autres.map(e => ({ v: e.z, texte: `fond aligné sur ${e.id}` })),
          ...autres.map(e => ({ v: L.A.etats.get(e.id).zL - ez.sL, texte: `surface libre alignée sur ${e.id}`, surf: true }))];
        el.x = aimanter(x - d.dx, cx).v;
        const az = aimanter(z - d.dz, cz);
        el.z = az.v;
        if (az.cible && az.cible.texte) d.ui.guides.push({ z: az.cible.surf ? el.z + ez.sL : el.z, x: el.x, texte: az.cible.texte });
        break;
      }
      case 'surf': {
        const e = L.A.etats.get(el.id), n = e.niveaux[d.i];
        if (!n) break;
        const autres = L.scene.elements.filter(o => o.type === 'reservoir' && o !== el).map(o => ({ v: L.A.etats.get(o.id).zL, texte: `surface de ${o.id}` }));
        const portsZ = P.portsReservoir(el).filter(p => p.paroi === 'g').map(p => ({ v: p.z, texte: null }));
        const sup = e.niveaux.slice(d.i + 1).reduce((t, k) => t + (k.s1 - k.s0), 0);
        const zMax = el.z + el.H - sup - (el.ferme ? 0.05 * el.H : 0);
        const a = aimanter(clamp(z, n.z0, zMax), [...autres, ...portsZ], 0.01);
        const zc = clamp(a.v, n.z0, zMax);
        const hauts = hauteursCouches(el);
        hauts[d.i].h = Math.max(0, zc - n.z0);
        el.couches = P.trierCouches(P.couchesDepuisHauteurs(el, hauts), L.A.ctx);
        if (el.constant) el.hc = Math.min(el.H, hauts.reduce((t, c) => t + c.h, 0));
        P.calerGaz(el, L.A.ctx, L.scene);
        d.ui.aimant = { x: el.x + P.largeurA(el, zc - el.z), z: zc, texte: `z = ${NB(zc, 2)} m · ${L.A.ctx.fl(n.fluide).nom.toLowerCase()} ${NB(zc - n.z0, 2)} m` };
        if (a.cible && a.cible.texte) d.ui.guides.push({ z: zc, x: el.x, texte: a.cible.texte });
        break;
      }
      case 'taille': {
        const H = clamp(aimanter(z - el.z, [], 0.05).v, 0.5, 40);
        const w = clamp(aimanter(x - el.x - H * P.cotan(el), [], 0.05).v, 0.3, 40);
        if (P.largeurA({ ...el, w, H }, H) < 0.25) break;
        el.H = H; el.w = w;
        el.couches = P.trierCouches(P.couchesDepuisHauteurs(el, d.hauteurs), L.A.ctx);
        P.calerGaz(el, L.A.ctx, L.scene);
        P.nettoyerScene(L.scene);
        d.ui.aimant = { x: el.x + P.largeurA(el, H), z: el.z + H, texte: `${NB(w, 2)} × ${NB(H, 2)} m` };
        break;
      }
      case 'palier': {
        const ec = L.A.conduites.get(el.id);
        const cz = [...L.scene.elements.filter(e => e.type === 'reservoir').flatMap(e => [{ v: e.z, texte: `fond de ${e.id}` }, { v: e.z + e.H, texte: `haut de ${e.id}` }]), { v: ec.tr.A.z }, { v: ec.tr.B.z }];
        const a = aimanter(z, cz);
        el.zr = a.v;
        d.ui.aimant = { x: x, z: a.v, texte: `passage à z = ${NB(a.v, 2)} m` };
        break;
      }
      case 'van': {
        const ec = L.A.conduites.get(el.conduite);
        if (!ec) break;
        el.t = clamp(arr(P.projeterSurTrace(ec.tr, x, z).t, 0.025), 0.05, 0.95);
        break;
      }
      case 'inst': {
        // un Pitot reste une prise face au courant ; le Pitot double emmène sa prise statique
        const pitot = /^k:/.test(el.piquage.port);
        const cibles = pitot ? ciblesPiquages({ reservoirs: false, pitot: true }) : ciblesPiquages({ couvercles: el.type !== 'piezometre' }).filter(q => !(q.el === el.id));
        const c = plusProche(cibles, X, Y);
        d.ui.cibles = cibles.map(q => ({ x: q.x, z: q.z, actif: q === c }));
        if (c) {
          el.piquage = { ...c.ref };
          if (pitot && el.piquage2 && /^t:/.test(el.piquage2.port)) el.piquage2 = { el: c.ref.el, port: c.ref.port.replace(/^k/, 't') };
          d.ui.aimant = { x: c.x, z: c.z, texte: etiquettePort(c) };
        }
        break;
      }
      case 'dev': {
        if (el.type === 'orifice') {
          const pw = paroiProche(X, Y, el.d);
          if (!pw) break;
          el.reservoir = pw.r.id; el.paroi = pw.paroi;
          const cibles = [];
          for (let s = 0.25; s < pw.L - 0.05; s += 0.25) cibles.push({ v: s });
          const m = el.d / 2 + 0.01;
          el.s = clamp(aimanter(pw.s, cibles, 0.01).v, Math.min(m, pw.L / 2), Math.max(pw.L - m, pw.L / 2));
          const e = L.A.etats.get(pw.r.id), R = pw.R, cz = R.oz + el.s * R.dz;
          d.ui.aimant = { x: R.ox + el.s * R.dx, z: cz, texte: `h = ${NB(e.zL - cz, 2)} m sous la surface` };
          break;
        }
        const p = placerLibre(x - d.dx, z - d.dz, el.id);
        el.x = p.x; el.z = p.z;
        if (p.guide) d.ui.guides.push(p.guide);
        break;
      }
      case 'vt': {
        const ec = L.A.conduites.get(el.conduite);
        if (!ec) break;
        el.t = clamp(arr(P.projeterSurTrace(ec.tr, x, z).t, 0.025), 0.05, 0.95);
        break;
      }
      case 'ubloc': {
        const m = L.A.mesures.get(el.id);
        el.ox = arr(x - d.dx - m.tap.x, 0.05);
        el.oz = aimanter(z - d.dz - m.tap.z, [{ v: 0, texte: 'au niveau du piquage' }]).v;
        break;
      }
      case 'vp': {
        const pw = paroiProche(X, Y, el.a);
        if (!pw) break;
        el.reservoir = pw.r.id; el.paroi = pw.paroi;
        const cibles = [];
        for (let s = el.a / 2; s <= pw.L - el.a / 2 + 1e-9; s += 0.25) cibles.push({ v: s });
        el.s = clamp(aimanter(pw.s, cibles).v, el.a / 2, Math.max(el.a / 2, pw.L - el.a / 2));
        if (el.forme === 'rect' && el.l > pw.r.b) el.l = pw.r.b;
        const e = L.A.etats.get(pw.r.id), R = pw.R, cz = R.oz + el.s * R.dz;
        d.ui.aimant = { x: R.ox + el.s * R.dx, z: cz, texte: pw.paroi === 'f' ? 'fond' : `G à ${NB(e.zL - cz, 2)} m sous la surface` };
        break;
      }
      case 'flot': {
        const r = elt(el.reservoir), cible = reservoirSous(x, z, 0.3) || r;
        if (cible !== r) { el.reservoir = cible.id; }
        const rr = elt(el.reservoir);
        el.x = clamp(arr(x - rr.x, 0.05), el.l / 2, rr.w - el.l / 2);
        L.ressorts.set(el.id, { z: clamp(z - el.h / 2, rr.z, rr.z + rr.H + 2), v: 0 });
        break;
      }
    }
    apresEdition(false);
  }
  function finGlisser(d) {
    if (d.type === 'flot') { L.saisi.delete(d.el.id); P.nettoyerScene(L.scene); }
    if (d.type === 'inst' && d.el && !P.resoudre(L.scene, d.el.piquage)) { d.el.piquage = d.origine; if (d.origine2) d.el.piquage2 = d.origine2; }
    if (d.type === 'vue') { /* rien */ }
    else if (d.type && d.type !== 'vue') { L.inspCle = null; dire('Élément déplacé'); }
    L.drag = null;
    apresEdition(true);
  }
  function clic(h, X, Y) {
    const [type, id] = (h || '').split(':');
    const el = elt(id);
    if (!el) { if (L.sel) { L.sel = null; L.inspCle = null; demander(); } return; }
    if (type === 'van') {
      avantModif();
      el.ouverte = !el.ouverte;
      L.sel = el.id; L.inspCle = null;
      dire(`Vanne ${el.id} ${el.ouverte ? 'ouverte' : 'fermée'}`);
      apresEdition(true);
      return;
    }
    if (type === 'dev' && ['orifice', 'pompe', 'robinet', 'lance'].includes(el.type)) {
      avantModif();
      if (el.type === 'pompe') el.marche = el.marche === false;
      else el.ouvert = !el.ouvert;
      L.sel = el.id; L.inspCle = null;
      dire(el.type === 'pompe' ? `Pompe ${el.id} ${el.marche ? 'en marche' : 'arrêtée'}` : el.type === 'orifice' ? `Orifice ${el.id} ${el.ouvert ? 'débouché' : 'bouché'}`
        : el.type === 'robinet' ? `Robinet ${el.id} ${el.ouvert ? 'ouvert' : 'fermé'}` : `Lance ${el.id} ${el.ouvert ? 'ouverte' : 'fermée'}`);
      apresEdition(true);
      return;
    }
    if (L.sel !== el.id) { L.sel = el.id; L.inspCle = null; }
    demander();
  }

  // ---------- événements de la scène ----------
  svg.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button > 1) return;
    const pos = local(e);
    L.pointeurs.set(e.pointerId, pos);
    try { svg.setPointerCapture(e.pointerId); } catch { /* pointeur déjà relâché */ }
    if (L.pointeurs.size === 2) {
      const [a, b] = [...L.pointeurs.values()];
      if (L.drag && L.drag.bouge && L.drag.type !== 'vue') annuler();
      L.drag = null;
      L.pinch = { d: Math.hypot(a.X - b.X, a.Y - b.Y), c: { X: (a.X + b.X) / 2, Y: (a.Y + b.Y) / 2 } };
      return;
    }
    if (L.connexion) { majConnexion(pos.X, pos.Y); L.drag = { mode: 'connexion', debut: pos }; return; }
    const cible = e.target.closest && e.target.closest('[data-h]');
    L.drag = { mode: 'scene', h: cible ? cible.dataset.h : null, debut: pos, bouge: false, button: e.button };
    bulle.hidden = true;
    scene.setAttribute('data-souris', '');
    scene.focus({ preventScroll: true, focusVisible: false });
  });
  svg.addEventListener('pointermove', e => {
    const pos = local(e);
    if (L.pointeurs.has(e.pointerId)) L.pointeurs.set(e.pointerId, pos);
    if (L.pinch && L.pointeurs.size === 2) {
      const [a, b] = [...L.pointeurs.values()], d = Math.hypot(a.X - b.X, a.Y - b.Y), c = { X: (a.X + b.X) / 2, Y: (a.Y + b.Y) / 2 };
      L.vue.ox += c.X - L.pinch.c.X; L.vue.oy += c.Y - L.pinch.c.Y;
      zoomer(d / L.pinch.d, c.X, c.Y);
      L.pinch = { d, c };
      return;
    }
    if (L.connexion) { majConnexion(pos.X, pos.Y); return; }
    const d = L.drag;
    if (!d || d.mode !== 'scene') { sonde(pos); return; }
    if (!d.bouge) {
      if (Math.hypot(pos.X - d.debut.X, pos.Y - d.debut.Y) < 4) return;
      d.bouge = true;
      if (d.button === 1) d.h = null;
      demarrerGlisser(d);
    }
    majGlisser(d, pos.X, pos.Y);
  });
  const relache = e => {
    L.pointeurs.delete(e.pointerId);
    if (L.pinch) { if (L.pointeurs.size < 2) L.pinch = null; return; }
    const d = L.drag;
    if (!d) return;
    if (d.mode === 'connexion') { L.drag = null; if (L.connexion && e.type === 'pointerup') finirConnexion(); return; }
    if (e.type === 'pointercancel') { if (d.bouge && d.type !== 'vue') annuler(); L.drag = null; demander(); return; }
    if (!d.bouge) { L.drag = null; clic(d.h, d.debut.X, d.debut.Y); return; }
    finGlisser(d);
  };
  svg.addEventListener('pointerup', relache);
  svg.addEventListener('pointercancel', relache);
  svg.addEventListener('pointerleave', () => { if (!L.drag) bulle.hidden = true; });
  svg.addEventListener('wheel', e => {
    if (integre && !e.ctrlKey) return;
    e.preventDefault();
    const pos = local(e);
    zoomer(Math.exp(-e.deltaY * (e.deltaMode ? 0.05 : 0.0015)), pos.X, pos.Y);
  }, { passive: false });
  svg.addEventListener('dblclick', e => {
    const h = e.target.closest && e.target.closest('[data-h]');
    if (!h) cadrer();
  });

  function sonde(pos) {
    if (!L.A) return;
    const v = V(), s = P.sonder(L.scene, L.A, v.x(pos.X), v.z(pos.Y));
    if (!s || s.corps) { bulle.hidden = true; return; }
    const env = L.scene.env, ctx = L.A.ctx;
    const nom = s.fluide ? ctx.fl(s.fluide).nom : 'gaz';
    let h = `<b>${esc(s.el)} · ${esc(nom)}</b><br>z = ${NB(s.z, 2)} m${s.fluide ? ` · profondeur ${NB(s.profondeur, 2)} m` : ''}<br>p = ${P.pression(s.p, env.unite)} <small>rel.</small> · ${P.pression(s.pabs, env.unite)} <small>abs.</small>`;
    if (s.charge != null) h += `<br>charge z + p/ρg = ${NB(s.charge, 3)} m`;
    bulle.innerHTML = h;
    bulle.hidden = false;
    const W = L.vue.W;
    bulle.style.left = `${Math.min(pos.X + 14, W - 230)}px`;
    bulle.style.top = `${Math.max(pos.Y - 70, 4)}px`;
  }

  // ---------- palette : glisser-déposer ----------
  racine.querySelectorAll('.lb-tuile').forEach(t => {
    t.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.preventDefault();
      L.drag = { mode: 'palette', kind: t.dataset.k, depart: { x: e.clientX, y: e.clientY }, bouge: false, tuile: t };
      try { t.setPointerCapture(e.pointerId); } catch { /* */ }
    });
    t.addEventListener('pointermove', e => {
      const d = L.drag;
      if (!d || d.mode !== 'palette' || d.tuile !== t) return;
      if (!d.bouge && Math.hypot(e.clientX - d.depart.x, e.clientY - d.depart.y) < 6) return;
      if (!d.bouge) { d.bouge = true; fantome.innerHTML = t.innerHTML; fantome.hidden = false; L.connexion = null; }
      const rr = racine.getBoundingClientRect();
      fantome.style.left = `${e.clientX - rr.left + 8}px`; fantome.style.top = `${e.clientY - rr.top + 8}px`;
      const r = svg.getBoundingClientRect();
      d.dessus = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (d.dessus) majDepot(d, e.clientX - r.left, e.clientY - r.top); else { d.ui = null; d.cible = null; d.texteAide = 'Glissez dans la scène.'; }
      fantome.classList.toggle('ok', !!d.cible);
      demander();
    });
    const fin = e => {
      const d = L.drag;
      if (!d || d.mode !== 'palette' || d.tuile !== t) return;
      fantome.hidden = true;
      L.drag = null;
      if (e.type === 'pointerup') {
        if (!d.bouge) ajoutRapide(d.kind);
        else if (d.dessus && d.cible) deposer(d);
        else dire('Dépôt annulé');
      }
      demander();
    };
    t.addEventListener('pointerup', fin);
    t.addEventListener('pointercancel', fin);
    t.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ajoutRapide(t.dataset.k); } });
  });

  // ---------- barre d'outils ----------
  racine.addEventListener('click', e => {
    const b = e.target.closest('[data-a],[data-ref],[data-sel]');
    if (!b || !racine.contains(b)) return;
    if (b.dataset.sel) { L.sel = b.dataset.sel; L.inspCle = null; demander(); return; }
    if (b.dataset.ref) { L.scene.env.reference = b.dataset.ref; majBarre(); L.inspCle = null; sauver(); demander(); return; }
    switch (b.dataset.a) {
      case 'annuler': annuler(); break;
      case 'retablir': retablir(); break;
      case 'vider': avantModif(); L.scene = P.sceneVide(); L.scenario = null; L.sel = null; majBarre(); majConsigne(); apresEdition(true); break;
      case 'reinit': charger(L.scenario, { garderHisto: true }); break;
      case 'palette': L.palette = !L.palette; $('.lb-palette').hidden = !L.palette; b.setAttribute('aria-pressed', String(L.palette)); break;
      case 'cadrer': L.zoomManuel = false; cadrer(); break;
      case 'zplus': zoomer(1.25); break;
      case 'zmoins': zoomer(0.8); break;
      case 'exporter': exporter(); break;
      case 'importer': $('[data-r="fichier"]').click(); break;
      case 'supprimer': supprimer(); break;
      case 'pause': L.pause = !L.pause; majBarre(); dire(L.pause ? 'Temps figé' : 'Le temps reprend'); demander(); break;
    }
  });
  racine.querySelector('[data-r="ecoulement"]').addEventListener('change', e => {
    avantModif();
    L.scene.env.ecoulement = e.target.value;
    L.pause = false;
    majBarre(); apresEdition(true);
    dire(`Modèle : ${E.MODES[e.target.value]}`);
  });
  racine.querySelector('[data-r="vitesse"]').addEventListener('change', e => { L.scene.env.vitesse = +e.target.value || 1; sauver(); demander(); });
  const sc = racine.querySelector('[data-r="scenario"]');
  if (sc) sc.addEventListener('change', () => { charger(sc.value || null, { garderHisto: true }); if (!integre) history.replaceState(null, '', sc.value ? `#${sc.value}` : location.pathname); });
  racine.querySelector('[data-r="unite"]').addEventListener('change', e => { L.scene.env.unite = e.target.value; L.inspCle = null; sauver(); demander(); });
  racine.querySelectorAll('[data-v]').forEach(c => c.addEventListener('change', () => { L.scene.env.vues[c.dataset.v] = c.checked; sauver(); demander(); }));
  racine.querySelector('[data-anim]').addEventListener('change', e => { L.animation = e.target.checked; if (!L.animation) E.equilibrer(L.scene); demander(); });
  const fichier = racine.querySelector('[data-r="fichier"]');
  if (fichier) fichier.addEventListener('change', async () => {
    const f = fichier.files[0]; fichier.value = '';
    if (!f) return;
    try {
      if (f.size > 200 * 1024) throw Error('Fichier trop volumineux (200 Ko au plus).');
      const s = P.verifierScene(JSON.parse(await f.text()));
      avantModif();
      L.scene = s; L.scenario = null; L.sel = null; L.aff.clear(); L.ressorts.clear();
      L.A = E.analyserTout(L.scene); L.zoomManuel = false;
      majBarre(); majConsigne(); cadrer(); apresEdition(true);
      dire('Expérience importée');
    } catch (err) { flash(`Import impossible : ${err.message}`); }
  });
  function exporter() {
    const blob = new Blob([JSON.stringify(P.exporterScene(L.scene), null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `labo-${(L.scenario || 'atelier')}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  function supprimer() {
    if (!L.sel) return;
    avantModif();
    const id = L.sel;
    L.scene.elements = L.scene.elements.filter(e => e.id !== id);
    L.sel = null;
    apresEdition(true);
    dire(`${id} supprimé`);
  }
  // Page dédiée : raccourcis valables partout ; dans le cours, seulement dans la figure.
  (integre ? racine : document).addEventListener('keydown', e => {
    if (e.target.closest && e.target.closest('.labo') && e.target.closest('.labo') !== racine) return;
    if (e.target === scene) scene.removeAttribute('data-souris');
    const champ = e.target.closest && e.target.closest('input,select,textarea');
    if ((e.ctrlKey || e.metaKey) && !champ) {
      if (e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? retablir() : annuler(); return; }
      if (e.key.toLowerCase() === 'y') { e.preventDefault(); retablir(); return; }
    }
    if (champ) return;
    if (e.key === 'Escape') { if (L.connexion) { L.connexion = null; dire('Liaison annulée'); } else if (L.sel) { L.sel = null; L.inspCle = null; } demander(); }
    else if ((e.key === 'Delete' || e.key === 'Backspace') && L.sel) { e.preventDefault(); supprimer(); }
    else if (e.key === '+' || e.key === '=') zoomer(1.25);
    else if (e.key === '-') zoomer(0.8);
  });

  // ---------- inspecteur ----------
  const num = (k, lab, val, unite, o = {}) => `<label class="lb-champ"><span>${lab}</span><input type="number" inputmode="decimal" data-k="${k}" value="${Number.isFinite(val) ? +val.toFixed(o.dec ?? 3) : ''}" step="${o.pas ?? 0.05}"${o.min != null ? ` min="${o.min}"` : ''}${o.max != null ? ` max="${o.max}"` : ''}><em>${unite}</em></label>`;
  const sel_ = (k, lab, val, options) => `<label class="lb-champ"><span>${lab}</span><select data-k="${k}">${options.map(([v, t]) => `<option value="${esc(v)}"${String(v) === String(val) ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`;
  const sortie = (k, lab) => `<div class="lb-sortie"><span>${lab}</span><output data-o="${k}">—</output></div>`;
  const fluidesOpt = P.LIQUIDES.map(f => [f, P.FLUIDES[f].nom]);
  const PAROIS = [['g', 'Paroi gauche'], ['d', 'Paroi droite'], ['f', 'Fond']];

  function formulaire(el) {
    const env = L.scene.env, u = P.UNITES[env.unite].nom;
    const tete = `<header class="lb-insp-tete"><span class="lb-type">${nomDe(el)}</span><strong>${esc(el.id)}</strong><button type="button" data-a="supprimer" class="lb-suppr" title="Supprimer (Suppr)">Supprimer</button></header>`;
    let h = tete;
    switch (el.type) {
      case 'reservoir': {
        const e = L.A.etats.get(el.id);
        h += `<label class="lb-champ lb-large"><span>Nom</span><input type="text" data-k="nom" maxlength="40" value="${esc(el.nom || '')}"></label>`;
        h += `<fieldset><legend>Contenu (du haut vers le bas)</legend><div class="lb-couches">${e.niveaux.slice().reverse().map(n => {
          const i = e.niveaux.indexOf(n);
          return `<div class="lb-couche"><i style="background:${L.A.ctx.fl(n.fluide).couleur}"></i><select data-k="couche:${i}:fluide" aria-label="Fluide de la couche">${fluidesOpt.map(([v, t]) => `<option value="${v}"${v === n.fluide ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select><input type="number" step="0.05" min="0" data-k="couche:${i}:h" value="${+(n.s1 - n.s0).toFixed(3)}" aria-label="Épaisseur (m)"><em>m</em><button type="button" data-k="couche:${i}:suppr" aria-label="Retirer la couche">×</button></div>`;
        }).join('') || '<p class="lb-note">Réservoir vide : déposez un fluide ou ajoutez une couche.</p>'}</div>
          <label class="lb-champ"><span>Ajouter</span><select data-k="ajoutCouche"><option value="">— fluide —</option>${fluidesOpt.map(([v, t]) => `<option value="${v}">${esc(t)}</option>`).join('')}</select></label>
          <p class="lb-note">Les liquides non miscibles se rangent par densité, le plus lourd au fond.</p>
          <label class="lb-coche"><input type="checkbox" data-k="constant"${el.constant ? ' checked' : ''}> Niveau maintenu constant (mer, nappe, grande retenue)</label>
          ${sel_('aspect', 'Représentation', el.aspect || 'liquide', [['liquide', 'réservoir de liquide'], ['sol', 'terrain saturé (nappe)']])}</fieldset>`;
        h += `<fieldset><legend>Ciel</legend><div class="lb-seg" role="group"><button type="button" data-k="ferme" data-v="0" aria-pressed="${!el.ferme}">ouvert</button><button type="button" data-k="ferme" data-v="1" aria-pressed="${el.ferme}">fermé</button></div>`;
        if (el.ferme) h += sel_('mode', 'Gaz', el.ciel.mode, [['impose', 'pression imposée (détendeur)'], ['piege', 'gaz piégé (p·V constant)']]) + num('p0', 'p₀ relative', el.ciel.mode === 'piege' ? e.pCiel / 1000 : el.ciel.p / 1000, 'kPa', { pas: 1, min: -100, dec: 2 });
        h += `</fieldset>`;
        h += `<fieldset><legend>Géométrie</legend><div class="lb-grille2">${num('x', 'x gauche', el.x, 'm')}${num('z', 'Cote du fond', el.z, 'm')}${num('w', 'Largeur', el.w, 'm', { min: 0.3 })}${num('H', 'Hauteur', el.H, 'm', { min: 0.5 })}${num('b', 'Profondeur b', el.b, 'm', { min: 0.05 })}${num('alpha', 'Paroi droite α', el.alpha, '°', { pas: 1, min: 30, max: 150, dec: 1 })}</div></fieldset>`;
        h += `<fieldset><legend>Diagramme des pressions</legend>${sel_('diagramme', 'Sur', el.diagramme, [['aucune', 'aucune paroi'], ...PAROIS])}<div class="lb-sorties" data-o="paroi"></div></fieldset>`;
        h += `<div class="lb-sorties">${sortie('niveau', 'Surface libre')}${sortie('pFond', 'Pression au fond')}${el.ferme ? sortie('pCiel', 'Pression du ciel') : ''}${sortie('vol', 'Volume de liquide')}${sortie('masse', 'Masse')}${sortie('compress', 'Compression au fond')}</div>`;
        break;
      }
      case 'conduite': {
        const ecm = modeEc(), tr = L.A.conduites.get(el.id)?.tr;
        h += `<div class="lb-grille2">${num('D', 'Diamètre', el.D * 1000, 'mm', { pas: 5, min: 5, dec: 1 })}${num('zr', 'Cote de passage', tr?.zr, 'm')}</div><button type="button" class="lb-btn" data-k="zrAuto">Tracé automatique</button>`;
        if (ecm === 'reel') {
          h += `<fieldset><legend>Pertes de charge (chapitre 6)</legend><div class="lb-grille2">`;
          h += num('Lreel', 'Longueur de calcul', el.Lreel ?? tr?.L, 'm', { pas: 1, min: 0.01, dec: 2 });
          h += el.lambda == null ? num('rugo', 'Rugosité ε', el.rugo ?? 0.1, 'mm', { pas: 0.01, min: 0, dec: 3 }) : num('lambda', 'λ imposé', el.lambda, '', { pas: 0.001, min: 0, max: 0.2, dec: 4 });
          h += num('K', 'Singularités ΣK', el.K || 0, '', { pas: 0.1, min: 0, dec: 2 });
          h += `</div>${el.Lreel != null ? '<button type="button" class="lb-btn" data-k="LreelAuto">Longueur dessinée</button>' : ''}`;
          h += `<label class="lb-coche"><input type="checkbox" data-k="lambdaImp"${el.lambda != null ? ' checked' : ''}> Imposer λ (sinon 64/Re ou Colebrook)</label>`;
          h += `<label class="lb-coche"><input type="checkbox" data-k="Kauto"${el.Kauto !== false ? ' checked' : ''}> Compter l’entrée (K = 0,5) et la sortie (K = 1)</label></fieldset>`;
        }
        if (ecm === 'illustratif') h += `<div class="lb-sorties">${sortie('etat', 'État')}${sortie('contenu', 'Contenu')}${sortie('pA', 'p côté ' + esc(el.a.el))}${sortie('pB', 'p côté ' + esc(el.b.el))}${sortie('debit', 'Débit instantané')}${sortie('pire', 'p abs minimale')}</div>`;
        else h += `<div class="lb-sorties">${sortie('debit', 'Débit Q')}${sortie('V', 'Vitesse V')}${ecm === 'reel' ? sortie('Re', 'Reynolds') + sortie('lambda', 'λ') + sortie('pertes', 'Pertes dans la conduite') : ''}${sortie('pA', 'p côté ' + esc(el.a.el))}${sortie('pB', 'p côté ' + esc(el.b.el))}${sortie('pire', 'p abs minimale')}</div>`;
        h += `<div class="lb-sorties">${sortie('coudes', 'Efforts sur les coudes')}</div>`;
        break;
      }
      case 'vanne':
        h += `<button type="button" class="lb-btn lb-btn-fort" data-k="basculer">${el.ouverte ? 'Fermer la vanne' : 'Ouvrir la vanne'}</button>`;
        if (modeEc() !== 'illustratif') {
          h += `<label class="lb-champ lb-large"><span>Ouverture</span><input type="range" min="5" max="100" step="5" data-k="ouverture" value="${Math.round((el.ouverture ?? 1) * 100)}"><em data-o="ouvV">${Math.round((el.ouverture ?? 1) * 100)} %</em></label>`;
          if (modeEc() === 'reel') h += num('Kv', 'K pleine ouverture', el.Kv ?? 0.2, '', { pas: 0.05, min: 0, dec: 2 });
        }
        h += num('t', 'Position sur la conduite', el.t * 100, '%', { pas: 5, min: 5, max: 95, dec: 0 });
        h += modeEc() === 'illustratif' ? `<div class="lb-sorties">${sortie('dp', 'Δp de part et d’autre')}${sortie('force', 'Effort sur l’obturateur')}</div>`
          : `<div class="lb-sorties">${sortie('K', 'Coefficient K')}${sortie('dH', 'Perte de charge ΔH')}${sortie('dp', 'Chute de pression')}</div>`;
        break;
      case 'orifice':
        h += `<button type="button" class="lb-btn lb-btn-fort" data-k="basculer">${el.ouvert ? 'Boucher l’orifice' : 'Déboucher l’orifice'}</button>`;
        h += `<div class="lb-grille2">${num('d', 'Diamètre d', el.d * 1000, 'mm', { pas: 1, min: 1, dec: 1 })}${num('Cd', 'C<sub>d</sub> (débit)', el.Cd, '', { pas: 0.01, min: 0.05, max: 1, dec: 3 })}${num('Cv', 'C<sub>v</sub> (vitesse)', el.Cv, '', { pas: 0.01, min: 0.05, max: 1, dec: 3 })}${sel_('paroi', 'Paroi', el.paroi, PAROIS)}${num('s', el.paroi === 'f' ? 'Centre depuis la gauche' : 'Centre depuis le pied', el.s, 'm', { pas: 0.05, min: 0 })}</div>`;
        h += `<p class="lb-note">Mince paroi : C<sub>c</sub> ≈ 0,62, C<sub>v</sub> ≈ 0,98, C<sub>d</sub> = C<sub>c</sub>C<sub>v</sub> ≈ 0,61. Ajutage cylindrique : C<sub>d</sub> ≈ 0,82 ; ajutage rentrant (Borda) : ≈ 0,5.</p>`;
        h += `<div class="lb-sorties">${sortie('h', 'Charge h sur l’orifice')}${sortie('V', 'Vitesse du jet')}${sortie('Q', 'Débit')}${sortie('portee', 'Jet')}${sortie('T', 'Temps de vidange')}${sortie('R', 'Réaction du jet')}</div>`;
        break;
      case 'pompe':
        h += `<button type="button" class="lb-btn lb-btn-fort" data-k="basculer">${el.marche === false ? 'Démarrer la pompe' : 'Arrêter la pompe'}</button>`;
        h += `<div class="lb-grille2">${sel_('mode', 'Fonctionnement', el.mode, [['debit', 'débit imposé'], ['courbe', 'courbe H = H₀ − kQ²']])}${sel_('sens', 'Sens', el.sens, [['1', 'vers la droite'], ['-1', 'vers la gauche']])}`;
        h += el.mode === 'courbe' ? num('H0', 'H₀ (à débit nul)', el.H0, 'm', { pas: 1, min: 0, dec: 2 }) + num('k', 'k', el.k, 's²/m⁵', { pas: 100, min: 0, dec: 0 }) : num('Q', 'Débit imposé', el.Q * 1000, 'L/s', { pas: 0.5, min: 0, dec: 2 });
        h += `${num('eta', 'Rendement η', el.eta * 100, '%', { pas: 1, min: 5, max: 100, dec: 0 })}${num('z', 'Cote de l’axe', el.z, 'm')}</div>`;
        h += `<div class="lb-sorties">${sortie('Q', 'Débit')}${sortie('H', 'Hauteur manométrique')}${sortie('Ph', 'Puissance hydraulique')}${sortie('Pa', 'Puissance absorbée')}</div>`;
        break;
      case 'raccord':
        h += `<div class="lb-grille2">${num('x', 'x', el.x, 'm')}${num('z', 'Cote de l’axe', el.z, 'm')}</div><p class="lb-note">Les diamètres sont ceux des conduites raccordées : réglez-les dans chacune.</p>`;
        h += `<div class="lb-sorties">${sortie('D', 'D₁ → D₂')}${sortie('V', 'V₁ → V₂')}${sortie('dH', 'Perte singulière')}${sortie('dp', 'p₂ − p₁')}${sortie('Fa', 'Effort de l’eau sur le raccord')}</div>`;
        break;
      case 'venturi': {
        const c = elt(el.conduite);
        h += `<div class="lb-grille2">${num('d', 'Diamètre du col d', el.d * 1000, 'mm', { pas: 1, min: 2, max: c ? +(c.D * 950).toFixed(1) : 5000, dec: 1 })}${num('Cq', 'C<sub>q</sub>', el.Cq, '', { pas: 0.01, min: 0.5, max: 1, dec: 3 })}${sel_('fluideM', 'Liquide manométrique', el.fluideM, fluidesOpt)}${num('t', 'Position sur la conduite', el.t * 100, '%', { pas: 5, min: 5, max: 95, dec: 0 })}</div>`;
        h += `<div class="lb-sorties">${sortie('V12', 'V₁ → V₂ (col)')}${sortie('dp', 'p₁ − p₂')}${sortie('dh', 'Dénivellation Δh')}${sortie('Qmes', 'Q déduit de Δh')}${sortie('Q', 'Q réel')}${sortie('p2', 'p au col')}</div>`;
        break;
      }
      case 'exutoire':
        h += `<div class="lb-grille2">${num('x', 'x', el.x, 'm')}${num('z', 'Cote de sortie', el.z, 'm')}</div>`;
        h += `<div class="lb-sorties">${sortie('V', 'Vitesse de sortie')}${sortie('Q', 'Débit')}${sortie('portee', 'Jet')}${sortie('R', 'Réaction ρQV')}</div>`;
        break;
      case 'lance':
        h += `<button type="button" class="lb-btn lb-btn-fort" data-k="basculer">${el.ouvert ? 'Fermer la lance' : 'Ouvrir la lance'}</button>`;
        h += `<div class="lb-grille2">${num('d', 'Diamètre du jet d', el.d * 1000, 'mm', { pas: 1, min: 2, dec: 1 })}${num('V', 'Vitesse V', el.V, 'm/s', { pas: 0.5, min: 0, dec: 2 })}${num('angle', 'Orientation', el.angle, '°', { pas: 5, dec: 2 })}${sel_('fluide', 'Liquide', el.fluide, fluidesOpt)}${num('x', 'x de la buse', el.x, 'm')}${num('z', 'z de la buse', el.z, 'm')}</div>`;
        h += `<p class="lb-note">Orientation : 0° vers la droite, 90° vers le haut, 180° vers la gauche.</p>`;
        h += `<div class="lb-sorties">${sortie('Q', 'Débit Q = SV')}${sortie('qm', 'Débit massique')}${sortie('qdm', 'Flux de quantité de mouvement ρQV')}${sortie('Pj', 'Puissance du jet ½ρQV²')}${sortie('cible', 'Le jet frappe')}</div>`;
        break;
      case 'plaque':
        h += `<div class="lb-grille2">${num('L', 'Longueur', el.L, 'm', { pas: 0.05, min: 0.05 })}${num('angle', 'Inclinaison sur l’horizontale', el.angle, '°', { pas: 5, dec: 1 })}${num('x', 'x du centre', el.x, 'm')}${num('z', 'z du centre', el.z, 'm')}</div>`;
        h += `<div class="lb-sorties">${sortie('F', 'Effort du jet')}${sortie('alpha', 'Angle jet / plaque α')}${sortie('Q12', 'Partage Q₁ / Q₂')}${sortie('Fxz', 'F<sub>x</sub> / F<sub>z</sub>')}</div>`;
        break;
      case 'auget':
        h += `<div class="lb-grille2">${num('w', 'Ouverture', el.w, 'm', { pas: 0.05, min: 0.05 })}${num('angle', 'Orientation de l’ouverture', el.angle, '°', { pas: 5, dec: 1 })}${num('beta', 'Déviation β', el.beta, '°', { pas: 5, min: 10, max: 180, dec: 0 })}${sel_('sens', 'Sens de déviation', el.sens, [['1', 'direct'], ['-1', 'indirect']])}${num('x', 'x', el.x, 'm')}${num('z', 'z', el.z, 'm')}</div>`;
        h += `<label class="lb-champ lb-large"><span>Vitesse de l’auget u</span><input type="range" min="0" max="${Math.max(1, Math.ceil(vitesseJet(el) || 20))}" step="0.25" data-k="u" value="${el.u}"><em data-o="uV">${NB(el.u, 2)} m/s</em></label>`;
        h += `<p class="lb-note">L’auget est supposé animé de la vitesse u en s’éloignant du jet (régime établi, comme un auget de roue Pelton).</p>`;
        h += `<div class="lb-sorties">${sortie('F', 'Effort du jet')}${sortie('P', 'Puissance recueillie F·u')}${sortie('eta', 'Part de la puissance du jet')}${sortie('vo', 'Vitesse absolue de l’eau renvoyée')}</div><div data-o="courbe" class="lb-courbe"></div>`;
        break;
      case 'robinet':
        h += `<button type="button" class="lb-btn lb-btn-fort" data-k="basculer">${el.ouvert ? 'Fermer le robinet' : 'Ouvrir le robinet'}</button>`;
        h += `<div class="lb-grille2">${num('Q', 'Débit', el.Q * 1000, 'L/s', { pas: 0.5, min: 0, dec: 2 })}${sel_('fluide', 'Liquide', el.fluide, fluidesOpt)}${num('x', 'x', el.x, 'm')}${num('z', 'Cote', el.z, 'm')}</div>`;
        h += `<div class="lb-sorties">${sortie('debit', 'Apport')}${sortie('cible', 'Destination')}${sortie('montee', 'Montée du niveau')}</div>`;
        break;
      case 'piezometre':
        h += `<div class="lb-grille2">${num('Ht', 'Hauteur du tube', el.Ht, 'm', { pas: 0.25, min: 0.2 })}${num('d', 'Diamètre intérieur', el.d, 'mm', { pas: 1, min: 0.5, dec: 1 })}${num('ox', 'Déport', el.ox, 'm', { pas: 0.05 })}</div>`;
        h += `<div class="lb-sorties">${sortie('niv', 'Niveau du ménisque')}${sortie('h', 'Hauteur h = p/ρg')}${sortie('hc', 'Remontée capillaire')}${sortie('p', 'Pression au piquage')}</div>`;
        break;
      case 'manometre':
        h += sel_('mode', 'Graduation', el.mode, [['relatif', 'pression relative'], ['absolu', 'pression absolue']]) + num('ox', 'Déport', el.ox, 'm', { pas: 0.05 });
        h += `<div class="lb-sorties">${sortie('lu', 'Lecture')}${sortie('abs', 'Pression absolue')}${sortie('fs', 'Pleine échelle')}</div>`;
        break;
      case 'tubeU':
        h += sel_('fluideM', 'Liquide manométrique', el.fluideM, [...fluidesOpt, ...(el.piquage2 ? [['air', 'Air (U renversé)']] : [])]);
        h += `<div class="lb-grille2">${num('L', 'Longueur des branches', el.L, 'm', { pas: 0.1, min: 0.2 })}${num('ox', 'Décalage horizontal', el.ox, 'm')}${num('oz', 'Niveau de repos / piquage', el.oz, 'm')}</div>`;
        h += `<div class="lb-sorties">${sortie('dh', 'Dénivellation Δh')}${sortie('z1', 'Ménisque côté A')}${sortie('z2', el.piquage2 ? 'Ménisque côté B' : 'Ménisque côté air')}${sortie('pm', el.piquage2 ? 'p<sub>A</sub> − p<sub>B</sub>' : 'p<sub>A</sub> déduite')}</div>`;
        break;
      case 'vannePlane': {
        const r = elt(el.reservoir), Lw = r ? P.longueurParoi(r, el.paroi) : 1;
        h += `<div class="lb-grille2">${sel_('paroi', 'Paroi', el.paroi, PAROIS)}${sel_('forme', 'Forme', el.forme, [['rect', 'rectangle'], ['cercle', 'cercle'], ['triangle', 'triangle (base en bas)']])}`;
        h += num('a', el.forme === 'cercle' ? 'Diamètre D' : 'Hauteur a (le long de la paroi)', el.a, 'm', { min: 0.05 });
        if (el.forme !== 'cercle') h += num('l', 'Largeur l', el.l, 'm', { min: 0.05 });
        h += num('s', el.paroi === 'f' ? 'Centre depuis la gauche' : 'Centre depuis le pied (le long de la paroi)', el.s, 'm', { min: el.a / 2, max: Lw - el.a / 2 });
        h += sel_('charniere', 'Manœuvre', el.charniere, [['aucune', 'non étudiée'], ['haut', 'charnière en haut'], ['bas', 'charnière en bas'], ['glissieres', 'levante en glissières']]);
        if (el.charniere === 'glissieres') h += num('f', 'Frottement f', el.f ?? 0.25, '', { pas: 0.01, min: 0, dec: 2 }) + num('poids', 'Poids propre', (el.poids ?? 0) / 1000, 'kN', { pas: 0.5, min: 0, dec: 2 });
        h += '</div>';
        h += `<div class="lb-sorties">${sortie('S', 'Surface S')}${sortie('hG', 'Profondeur de G')}${sortie('pG', 'Pression en G')}${sortie('F', 'Résultante F')}${sortie('ecart', 'C sous G')}${sortie('hC', 'Profondeur de C')}${sortie('FH', 'F<sub>H</sub> / F<sub>V</sub>')}${sortie('M', 'Moment / effort de manœuvre')}</div>`;
        break;
      }
      case 'flotteur':
        h += `<div class="lb-grille2">${num('l', 'Largeur l (dans le plan)', el.l, 'm', { min: 0.05 })}${num('h', 'Hauteur', el.h, 'm', { min: 0.05 })}${num('b', 'Longueur b', el.b, 'm', { min: 0.05 })}${num('m', el.creux ? 'Masse à vide' : 'Masse', el.m, 'kg', { pas: 10, min: 0.01, dec: 1 })}${num('dens', 'Masse vol. moyenne', el.m / (el.l * el.h * el.b), 'kg/m³', { pas: 10, dec: 0 })}${num('zG', 'G au-dessus du fond', el.zG, 'm', { min: 0 })}</div>`;
        h += `<label class="lb-champ lb-large"><span>Gîte θ</span><input type="range" min="-30" max="30" step="1" data-k="gite" value="${el.gite}"><em data-o="giteV">${NB(el.gite, 0)}°</em></label>`;
        {
          const lest = P.lestFlotteur(el, L.A.ctx);
          h += `<fieldset><legend>Caisson creux et ballast</legend><label class="lb-coche"><input type="checkbox" data-k="creux"${el.creux ? ' checked' : ''}> Caisson creux (ballastable)</label>`;
          if (el.creux) {
            h += num('e', 'Épaisseur des parois', el.e ?? 0.03, 'm', { pas: 0.01, min: 0, dec: 3 });
            h += `<label class="lb-champ lb-large"><span>Ballast</span><input type="range" min="0" max="${+lest.Vmax.toFixed(3)}" step="${+(lest.Vmax / 400).toFixed(4)}" data-k="ballast" value="${+(el.ballast || 0).toFixed(3)}"><em>m³</em></label>`;
            h += num('ballast', 'Volume de ballast', el.ballast || 0, 'm³', { pas: 1, min: 0, max: +lest.Vmax.toFixed(3), dec: 2 });
            h += sel_('ballastFluide', 'Liquide de ballast', el.ballastFluide || 'eau', fluidesOpt);
            h += num('cloisons', 'Compartiments (sur la largeur)', el.cloisons || 1, '', { pas: 1, min: 1, max: 12, dec: 0 });
          }
          h += `</fieldset>`;
        }
        h += `<div class="lb-sorties">${sortie('P', 'Poids P')}${sortie('FA', 'Poussée F<sub>A</sub>')}${sortie('T', 'Tirant d’eau')}${sortie('Fs', 'Sécurité au soulèvement P/F<sub>A</sub>')}${el.creux ? sortie('hb', 'Ballast') : ''}${sortie('CM', 'CM = I/V')}${sortie('GM', 'GM')}${sortie('etat', 'Équilibre')}${sortie('couple', 'Couple à θ')}</div>`;
        break;
    }
    h += `<details class="lb-etapes-d" open><summary>Calcul détaillé</summary><ol class="lb-etapes" data-o="etapes"></ol></details>`;
    return h;
  }
  function formulaireGlobal() {
    const env = L.scene.env, ctx = L.A.ctx;
    const presents = new Set(L.scene.elements.flatMap(e => e.type === 'reservoir' ? e.couches.map(c => c.fluide) : e.type === 'tubeU' ? [e.fluideM] : []));
    let h = `<header class="lb-insp-tete"><span class="lb-type">Expérience</span><strong>${esc(L.scene.nom || '')}</strong></header>`;
    h += `<p class="lb-note">Sélectionnez un élément pour le régler et suivre son calcul. Relevés en temps réel :</p><div class="lb-releves" data-o="releves"></div>`;
    h += `<details class="lb-fluides"><summary>Propriétés des fluides (chapitre 1)</summary><div class="lb-tab"><table><thead><tr><th>Fluide</th><th>ρ kg/m³</th><th>d</th><th>μ Pa·s</th><th>σ N/m</th><th>θ</th><th>E<sub>v</sub> GPa</th><th>c m/s</th><th>p<sub>v</sub> kPa</th></tr></thead><tbody>${
      P.LIQUIDES.map(f => { const q = ctx.fl(f); return `<tr${presents.has(f) ? ' class="present"' : ''}><td><i style="background:${q.couleur}"></i>${esc(q.nom)}</td><td>${NB(q.rho, 0)}</td><td>${NB(q.rho / 1000, 3)}</td><td>${q.mu < 0.01 ? q.mu.toExponential(1).replace('.', ',') : NB(q.mu, 2)}</td><td>${NB(q.sigma, 3)}</td><td>${q.theta}°</td><td>${NB(q.Ev / 1e9, 2)}</td><td>${NB(Math.sqrt(q.Ev / q.rho), 0)}</td><td>${q.pv < 1 ? '≈ 0' : NB(q.pv / 1000, 2)}</td></tr>`; }).join('')
    }</tbody></table></div><p class="lb-note">À 20 °C. Poids volumique γ = ρg ; densité d = ρ/ρ<sub>eau</sub> ; célérité du son c = √(E<sub>v</sub>/ρ).</p></details>`;
    const ec = modeEc() !== 'illustratif';
    if (ec) h += `<div class="lb-sorties">${sortie('temps', 'Temps simulé')}${sortie('perdu', 'Volume parti au sol')}</div>`;
    h += `<details class="lb-env"><summary>Constantes</summary><div class="lb-grille2">${num('g', 'g', env.g, 'm/s²', { pas: 0.01, dec: 3 })}${num('patm', 'p<sub>atm</sub>', env.patm / 1000, 'kPa', { pas: 0.1, dec: 3 })}${num('rhoPerso', 'ρ liquide perso.', L.scene.perso.rho, 'kg/m³', { pas: 10, dec: 0 })}${ec ? num('zSol', 'Cote du sol', env.zSol ?? 0, 'm', { pas: 0.25, dec: 2 }) : ''}</div></details>`;
    h += ec ? `<p class="lb-note lb-hyp">Hypothèses : liquide incompressible, régime quasi permanent (les niveaux varient lentement devant le temps de mise en vitesse), conduites en série, vitesse négligeable dans les réservoirs${modeEc() === 'reel' ? ', pertes de charge de Darcy–Weisbach (λ de Colebrook ou 64/Re) et coefficients singuliers usuels' : ', fluide parfait : aucune perte, seule l’énergie cinétique du jet de sortie est perdue'}.</p>`
      : `<p class="lb-note lb-hyp">Hypothèses : fluides au repos, liquides incompressibles et non miscibles, poids des gaz négligé, gaz piégé isotherme, appareils de volume négligeable, conduites amorcées.</p>`;
    return h;
  }
  function majInspecteur() {
    const el = L.sel ? elt(L.sel) : null;
    const cle = el ? `${el.id}|${el.type}|${el.type === 'reservoir' ? `${el.ferme}|${el.ciel.mode}|${L.A.etats.get(el.id).niveaux.map(n => n.fluide).join(',')}` : ''}${el.type === 'vannePlane' ? el.forme + el.paroi + el.charniere : ''}${el.type === 'flotteur' ? `${!!el.creux}|${el.e}` : ''}${el.type === 'reservoir' ? `|${!!el.constant}` : ''}${el.type === 'vanne' ? el.ouverte : ''}${el.type === 'conduite' ? `${el.lambda == null}|${el.Lreel == null}` : ''}${['orifice', 'robinet', 'lance'].includes(el.type) ? el.ouvert : ''}${el.type === 'pompe' ? `${el.mode}|${el.marche}` : ''}|${L.scene.env.unite}|${modeEc()}` : `global|${L.scene.elements.length}|${modeEc()}`;
    if (cle !== L.inspCle) {
      if (insp.contains(document.activeElement) && document.activeElement.matches('input[type=number],input[type=text]') && L.inspCle && L.inspCle.split('|')[0] === cle.split('|')[0]) {
        // on garde le champ en cours de saisie
      } else {
        L.inspCle = cle;
        insp.innerHTML = el ? formulaire(el) : formulaireGlobal();
      }
    }
    const o = el ? sorties(el) : { releves: releves(), temps: duree(L.scene._t || 0), perdu: `${NB((L.scene._perdu || 0) * 1000, 1)} L` };
    for (const [k, v] of Object.entries(o)) {
      const n = insp.querySelector(`[data-o="${k}"]`);
      if (n && n._v !== v) { n._v = v; n.innerHTML = v; }
    }
    // Champs qui suivent la physique (niveaux d'un réservoir en cours d'écoulement).
    if (el && el.type === 'reservoir') {
      const e = L.A.etats.get(el.id);
      e.niveaux.forEach((n, i) => {
        const inp = insp.querySelector(`[data-k="couche:${i}:h"]`);
        if (inp && document.activeElement !== inp) inp.value = +(n.s1 - n.s0).toFixed(3);
      });
    }
  }
  const P_ = p => fmtP(p, L.scene.env);
  const li = a => (a || []).map(t => `<li>${t}</li>`).join('');
  function releves() {
    const A = L.A, env = L.scene.env, Ec = A.ecoulement;
    const lignes = [];
    for (const e of L.scene.elements) {
      const m = A.mesures.get(e.id);
      let t = null;
      if (e.type === 'piezometre' && m && !m.erreur) t = m.vide || m.depression ? (m.depression ? 'dépression' : 'hors liquide') : m.deborde ? 'déborde' : `niveau ${NB(m.zN, 3)} m · h = ${NB(m.h, 3)} m`;
      else if (e.type === 'manometre' && m && !m.erreur) t = Number.isFinite(m.lu) ? `${P.pression(m.lu, env.unite)}${e.mode === 'absolu' ? ' abs' : ''}` : '—';
      else if (e.type === 'tubeU' && m && !m.erreur) t = m.invalide ? 'configuration invalide' : `Δh = ${NB(Math.abs(m.dh) * 1000, 1)} mm${m.chasse ? ' (chassé)' : ''}`;
      else if (e.type === 'vannePlane') { const v = A.ouvrages.get(e.id); if (v && !v.erreur) t = `F = ${NB(v.F / 1000, 2)} kN`; }
      else if (e.type === 'flotteur') { const f = A.flotteurs.get(e.id); if (f && !f.erreur) t = f.fond ? 'au fond' : `T = ${NB(f.T, 3)} m${f.GM != null ? ` · GM = ${NB(f.GM, 3)} m` : ''}`; }
      else if (e.type === 'reservoir') { const r = A.etats.get(e.id); t = `surface ${NB(r.zL, 3)} m · fond ${P_(r.pFond)}`; }
      else if (e.type === 'vanne') { const ec = A.conduites.get(e.conduite), d = ec && ec.deltas.find(k => k.id === e.id); t = e.ouverte ? `ouverte${Ec && (e.ouverture ?? 1) < 1 ? ` à ${Math.round(e.ouverture * 100)} %` : ''}` : `fermée${d && d.dp != null && !Ec ? ` · Δp = ${P.pression(d.dp, env.unite)}` : ''}`; }
      else if (Ec && e.type === 'conduite') { const pc = Ec.parConduite.get(e.id); if (pc) t = `Q = ${NB(pc.sol.Q * 1000, 2)} L/s · V = ${NB(pc.d.V, 2)} m/s`; }
      else if (Ec && e.type === 'orifice') { const st = Ec.orifices.get(e.id); t = st && st.Q > 0 ? `Q = ${NB(st.Q * 1000, 2)} L/s · h = ${NB(st.h, 3)} m` : e.ouvert ? 'à sec' : 'bouché'; }
      else if (Ec && e.type === 'pompe') { const i = infoPompe(e); t = i ? `H = ${NB(i.info.H, 2)} m · ${NB(i.info.Pabs / 1000, 2)} kW` : e.marche === false ? 'à l’arrêt' : 'sans débit'; }
      else if (Ec && e.type === 'venturi') { const st = Ec.venturis.get(e.id); if (st) t = `Δh = ${NB(Math.abs(st.dh) * 1000, 0)} mm · Q = ${NB(st.Qmes * 1000, 2)} L/s`; }
      else if (Ec && e.type === 'exutoire') { const so = Ec.sorties.get(e.id); t = so ? `V = ${NB(so.V, 2)} m/s · Q = ${NB(so.Q * 1000, 2)} L/s` : 'à sec'; }
      else if (e.type === 'robinet') t = e.ouvert ? `${NB(e.Q * 1000, 2)} L/s` : 'fermé';
      else if (e.type === 'raccord' && A.efforts) { const r = A.efforts.raccords.find(k => k.r === e); if (r) t = `effort axial ${forceTexte(Math.abs(r.Fa))}`; }
      else if (Ec && e.type === 'lance') { const st = Ec.lances.get(e.id); t = st && st.Q > 0 ? `Q = ${NB(st.Q * 1000, 2)} L/s · ρQV = ${forceTexte(st.reaction)}` : 'fermée'; }
      else if (Ec && (e.type === 'plaque' || e.type === 'auget')) { const ob = Ec.obstacles.get(e.id); t = ob ? `F = ${forceTexte(Math.hypot(ob.F.x, ob.F.z))}${ob.P > 0.5 ? ` · P = ${NB(ob.P / 1000, 2)} kW` : ''}` : 'hors du jet'; }
      if (t) lignes.push(`<button type="button" data-sel="${esc(e.id)}"><b>${esc(e.id)}</b><span>${t}</span></button>`);
    }
    return lignes.join('') || '<p class="lb-note">Aucun élément.</p>';
  }
  const fmtRe = r => (r < 1e4 ? NB(r, 0) : `${NB(r / 10 ** Math.floor(Math.log10(r)), 2)} × 10<sup>${Math.floor(Math.log10(r))}</sup>`);
  const regime = r => (r < 2000 ? 'laminaire' : r < 4000 ? 'transitoire' : 'turbulent');
  const infoPompe = el => { const sol = L.A.ecoulement?.chaines.find(c => c.Q > 0 && c.pompes?.some(p => p.el === el)); return sol ? { sol, info: sol.pompes.find(p => p.el === el) } : null; };
  const nonSimule = 'Mode illustratif : choisissez « fluide parfait » ou « fluide réel » dans la barre pour simuler l’écoulement.';
  const forceTexte = F => (Math.abs(F) >= 1000 ? `${NB(F / 1000, 2)} kN` : `${NB(F, Math.abs(F) < 10 ? 2 : 1)} N`);
  // Vitesse du jet qui frappe un obstacle (pour borner le curseur de l'auget).
  const vitesseJet = o => { const ob = L.A.ecoulement && L.A.ecoulement.obstacles.get(o.id), im = ob && ob.impacts[0]; return im ? im.V : null; };
  // Courbe P(u) d'un auget : P = ρ S (V − u)² u (1 − cos β), maximum en u = V/3.
  function courbeAuget(o, im) {
    const S = im.Q / im.V, V = im.V, k = im.rho * S * (1 - Math.cos(o.beta * Math.PI / 180));
    const Pu = u => k * (V - u) ** 2 * u, Pm = Pu(V / 3) || 1, W = 260, H = 120, mx = 34, my = 12;
    const X = u => mx + (W - mx - 8) * u / V, Y = p => H - 22 - (H - 22 - my) * p / Pm;
    let d = '';
    for (let i = 0; i <= 60; i++) { const u = V * i / 60; d += `${i ? 'L' : 'M'}${X(u).toFixed(1)},${Y(Pu(u)).toFixed(1)}`; }
    const u0 = Math.min(o.u, V);
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Puissance recueillie en fonction de la vitesse de l’auget"><line x1="${mx}" y1="${H - 22}" x2="${W - 6}" y2="${H - 22}" class="lb-axe-c"/><line x1="${mx}" y1="${my - 4}" x2="${mx}" y2="${H - 22}" class="lb-axe-c"/>`
      + `<line x1="${X(V / 3).toFixed(1)}" y1="${my}" x2="${X(V / 3).toFixed(1)}" y2="${H - 22}" class="lb-repere-c"/><path d="${d}" class="lb-courbe-p"/><circle cx="${X(u0).toFixed(1)}" cy="${Y(Pu(u0)).toFixed(1)}" r="4" class="lb-point-c"/>`
      + `<text x="${X(V / 3).toFixed(1)}" y="${H - 8}" text-anchor="middle">V/3</text><text x="${W - 8}" y="${H - 8}" text-anchor="end">u = V</text><text x="${mx - 4}" y="${my + 4}" text-anchor="end">${NB(Pm / 1000, 2)}</text><text x="${mx + 4}" y="${my + 4}">P (kW)</text></svg>`;
  }
  // Bernoulli généralisé le long d'une chaîne, terme à terme.
  function etapesChaine(sol, focus = null) {
    const g = L.A.ctx.g, mode = modeEc(), et = [];
    const nomB = b => (b.type === 'sortie' ? `la sortie libre ${esc(b.el.id)}` : esc(b.el.id));
    et.push(`Bernoulli généralisé de ${nomB(sol.S)} à ${nomB(sol.Dt)} : H<sub>amont</sub>${sol.pompes.length ? ' + H<sub>pompe</sub>' : ''} = H<sub>aval</sub> + Σ pertes, avec H = z + p/ρg + V²/2g`);
    et.push(`Amont (${esc(sol.S.el.id)}) : H = z + p/ρg = ${NB(sol.S.z, 3)} + ${NB(sol.S.p, 0)}/(${NB(sol.rho, 0)} × ${NB(g, 2)}) = <b>${NB(sol.Hs, 3)} m</b> (vitesse négligeable dans le réservoir)`);
    if (sol.Dt.type === 'sortie') et.push(`Aval : jet à l’air libre (p = 0) à z = ${NB(sol.Dt.z, 3)} m ; son énergie cinétique V²/2g = ${NB(sol.hs, 3)} m quitte le circuit`);
    else if (!sol.sortieNoyee) et.push(`Aval : la conduite débouche à l’air libre dans ${esc(sol.Dt.el.id)} à z = ${NB(sol.Dt.z, 3)} m ; V²/2g = ${NB(sol.hs, 3)} m quitte le circuit`);
    else et.push(`Aval (${esc(sol.Dt.el.id)}) : H = ${NB(sol.Hd, 3)} m ; ${mode === 'parfait' ? 'l’énergie cinétique' : 'la perte de sortie (K = 1)'} V²/2g = ${NB(sol.hs, 3)} m se dissipe dans le réservoir`);
    sol.tuyaux.forEach((t, i) => {
      const d = sol.det[i];
      let x = `${esc(t.c.id)} (D = ${NB(t.D * 1000, 0)} mm${mode === 'reel' ? `, L = ${NB(t.L, 2)} m` : ''}) : V = 4Q/πD² = ${NB(d.V, 3)} m/s, V²/2g = ${NB(d.hv, 3)} m`;
      if (mode === 'reel') {
        x += ` ; Re = VD/ν = ${fmtRe(d.Re)} (${regime(d.Re)}) ; λ = ${NB(d.lambda, 4)}${Number.isFinite(t.c.lambda) ? ' (imposé)' : d.Re < 2000 ? ' = 64/Re' : ' (Colebrook)'} ; h<sub>f</sub> = λ(L/D)V²/2g = ${NB(d.hf, 3)} m`;
        const loc = [];
        if (d.he) loc.push(`entrée ${NB(d.he, 3)} m`);
        if (d.hK) loc.push(`ΣK = ${NB(t.c.K, 2)} → ${NB(d.hK, 3)} m`);
        if (d.hvannes) loc.push(`vanne ${NB(d.hvannes, 3)} m`);
        if (d.hventuri) loc.push(`venturi ${NB(d.hventuri, 3)} m`);
        if (loc.length) x += ` ; singulières : ${loc.join(', ')}`;
      }
      et.push(focus === t.c.id ? `<b>${x}</b>` : x);
    });
    for (const r of sol.raccords) if (mode === 'reel') et.push(`Raccord ${esc(r.el.id)} : D ${NB(r.D1 * 1000, 0)} → ${NB(r.D2 * 1000, 0)} mm, perte ${NB(r.h, 3)} m (${r.D2 >= r.D1 ? 'Borda : (V₁ − V₂)²/2g' : '0,5(1 − (D₂/D₁)²)V₂²/2g'})`);
    for (const p of sol.pompes) et.push(`Pompe ${esc(p.el.id)} : H<sub>m</sub> = ${NB(p.H, 2)} m ${p.el.mode === 'courbe' ? '(courbe H₀ − kQ²)' : '(débit imposé : H<sub>m</sub> déduite du bilan)'}`);
    const Hp = sol.pompes.reduce((t, p) => t + p.H, 0);
    et.push(`Bilan : ${NB(sol.Hs, 3)}${sol.pompes.length ? ` + ${NB(Hp, 2)}` : ''} − ${NB(sol.Hd, 3)} = Σ pertes = ${NB(sol.total, 3)} m ⇒ <b>Q = ${NB(sol.Q * 1000, 2)} L/s</b>`);
    return et;
  }
  function pourquoiRepos(c) {
    if (modeEc() === 'illustratif') return nonSimule;
    const sol = L.A.ecoulement.chaines.find(k => k.ch.items.some(i => i.c === c));
    if (sol && sol.raison) return sol.raison;
    if (sol && L.scene.elements.some(v => v.type === 'vanne' && !v.ouverte && sol.ch.items.some(i => i.c && i.c.id === v.conduite))) return 'Une vanne fermée coupe la chaîne : rien ne s’écoule.';
    if (sol && sol.ch.items.some(i => i.type === 'pompe' && i.el.marche === false)) return 'La pompe est à l’arrêt : elle fait clapet anti-retour.';
    return 'Pas d’écoulement : les charges s’équilibrent, ou le piquage amont n’est plus dans le liquide.';
  }
  function sorties(el) {
    const A = L.A, env = L.scene.env, g = A.ctx.g, o = {}, Ec = A.ecoulement;
    switch (el.type) {
      case 'reservoir': {
        const e = A.etats.get(el.id);
        o.niveau = `z = ${NB(e.zL, 3)} m`;
        o.pFond = P_(e.pFond);
        if (el.ferme) o.pCiel = P_(e.pCiel);
        o.vol = `${NB(e.Vliq, 3)} m³`;
        o.masse = `${NB(e.niveaux.reduce((t, n) => t + n.V * n.rho, 0), 0)} kg`;
        const bas = e.niveaux[0];
        o.compress = bas ? `ΔV/V = p/E<sub>v</sub> = ${NB(Math.max(0, e.pFond) / A.ctx.fl(bas.fluide).Ev * 100, 5)} %` : '—';
        const et = [];
        if (el.ferme) et.push(`Ciel gazeux : p₀ = ${NB(e.pCiel, 0)} Pa (${el.ciel.mode === 'piege' ? `gaz piégé, p<sub>abs</sub>·V = ${NB(el.ciel.n, 0)} J constant` : 'pression imposée'})`);
        else et.push('Surface libre à la pression atmosphérique : p = 0 en relatif.');
        for (let i = e.niveaux.length - 1; i >= 0; i--) {
          const n = e.niveaux[i], h = n.s1 - n.s0, nom = A.ctx.fl(n.fluide).nom.toLowerCase();
          et.push(`${i ? `Interface à z = ${NB(n.z0, 3)} m` : `Fond (z = ${NB(n.z0, 3)} m)`} : p = ${NB(n.pHaut, 0)} + ρ<sub>${esc(nom)}</sub> g h = ${NB(n.pHaut, 0)} + ${NB(n.rho, 0)} × ${NB(g, 2)} × ${NB(h, 3)} = <b>${NB(n.pBas, 0)} Pa</b>`);
          et.push(`Plan de charge de ${esc(nom)} : z + p/ρg = ${NB(n.charge, 3)} m`);
        }
        if (e.niveaux.length) et.push(`Au fond : ${NB(e.pFond / 1000, 2)} kPa = ${NB(e.pFond / 9810, 3)} mCE = ${NB(e.pFond / 1e5, 4)} bar ; en absolu ${NB((e.pFond + A.ctx.patm) / 1000, 2)} kPa`);
        const pr = A.parois.get(el.id);
        if (pr) {
          const nomP = { g: 'paroi gauche', d: 'paroi droite', f: 'fond' }[el.diagramme];
          o.paroi = `<div class="lb-sortie"><span>F sur ${nomP}</span><output>${NB(pr.F / 1000, 2)} kN</output></div>` +
            (el.diagramme === 'f' ? '' : `<div class="lb-sortie"><span>C au-dessus du pied</span><output>${NB(pr.zC, 3)} m</output></div><div class="lb-sortie"><span>Moment au pied</span><output>${NB(pr.momentPied / 1000, 2)} kN·m</output></div>`) +
            (Math.abs(pr.FV) > 1 && el.diagramme === 'd' ? `<div class="lb-sortie"><span>F<sub>H</sub> / F<sub>V</sub></span><output>${NB(pr.FH / 1000, 2)} / ${NB(pr.FV / 1000, 2)} kN</output></div>` : '');
          et.push(`Diagramme sur la ${nomP} : F = ∫ p b dℓ = aire du diagramme × b = ${NB(pr.F / 1000, 2)} kN${el.diagramme === 'f' ? '' : `, appliquée à ${NB(pr.zC, 3)} m au-dessus du pied (moment ${NB(pr.momentPied / 1000, 2)} kN·m)`}`);
          if (pr.formule && pr.formule.ecart != null && el.diagramme !== 'f' && !el.ferme && e.niveaux.length === 1) et.push(`Contrôle : F = ½ρgbH² = ${NB(0.5 * e.niveaux[0].rho * g * el.b * (pr.mouille * Math.sin((pr.R.alpha) * Math.PI / 180)) ** 2 / 1000 / Math.sin(pr.R.alpha * Math.PI / 180), 2)} kN, C au tiers inférieur`);
        } else o.paroi = '';
        o.etapes = li(et);
        break;
      }
      case 'conduite': {
        const ec = A.conduites.get(el.id);
        if (!ec) break;
        if (Ec) {
          const pc = Ec.parConduite.get(el.id), pa = ec.en(0).p, pb = ec.en(1).p;
          o.pA = Number.isFinite(pa) ? P_(pa) : '—'; o.pB = Number.isFinite(pb) ? P_(pb) : '—';
          o.pire = ec.pire ? `${P.pression(ec.pire.pabs, env.unite)} abs à z = ${NB(ec.pire.z, 2)} m` : '—';
          if (!pc) { o.debit = 'au repos'; o.V = o.Re = o.lambda = o.pertes = '—'; o.etapes = li([pourquoiRepos(el)]); break; }
          const d = pc.d;
          o.debit = `${NB(pc.sol.Q * 1000, 2)} L/s → ${esc(pc.t.sens > 0 ? el.b.el : el.a.el)}`;
          o.V = `${NB(d.V, 3)} m/s (V²/2g = ${NB(d.hv, 3)} m)`;
          o.Re = `${fmtRe(d.Re)} · ${regime(d.Re)}`;
          o.lambda = NB(d.lambda, 4);
          o.pertes = `${NB(d.hf + d.hK + d.he + d.hvannes + d.hventuri, 3)} m (frottement ${NB(d.hf, 3)} m)`;
          o.etapes = li(etapesChaine(pc.sol, el.id));
          break;
        }
        o.etat = ec.ouverte ? 'ouverte' : 'coupée par une vanne fermée';
        o.contenu = [...new Set(ec.troncons.map(t => t.fluide ? A.ctx.fl(t.fluide).nom : 'air'))].join(' / ');
        o.pA = P_(ec.cotes.a.p); o.pB = P_(ec.cotes.b.p);
        o.debit = Math.abs(ec.q) > 1e-7 ? `${NB(Math.abs(ec.q) * 1000, 2)} L/s ${ec.sens > 0 ? '→ ' + esc(el.b.el) : '→ ' + esc(el.a.el)}` : 'au repos';
        o.pire = ec.pire ? `${P.pression(ec.pire.pabs, env.unite)} abs à z = ${NB(ec.pire.z, 2)} m` : '—';
        const et = ['Les deux extrémités communiquent si toutes les vannes sont ouvertes : à l’équilibre, la charge z + p/ρg est la même aux deux piquages (vases communicants).'];
        const a = ec.cotes.a, b = ec.cotes.b;
        if (a.f) et.push(`Côté ${esc(el.a.el)} : z + p/ρg = ${NB(a.z, 3)} + ${NB(a.p, 0)}/(${NB(a.rho, 0)} × ${NB(g, 2)}) = ${NB(a.z + a.p / (a.rho * g), 3)} m`);
        if (b.f) et.push(`Côté ${esc(el.b.el)} : z + p/ρg = ${NB(b.z, 3)} + ${NB(b.p, 0)}/(${NB(b.rho, 0)} × ${NB(g, 2)}) = ${NB(b.z + b.p / (b.rho * g), 3)} m`);
        if (ec.tInterface != null) et.push('Deux liquides différents : l’interface se place dans la conduite là où les deux colonnes s’équilibrent.');
        if (Math.abs(ec.q) > 1e-7) et.push('Écoulement en cours : le liquide va de la plus forte charge vers la plus faible (le régime transitoire n’est qu’illustratif, les pertes de charge relèvent du chapitre 6).');
        o.etapes = li(et);
        break;
      }
      case 'vanne': {
        if (Ec) {
          const pc = Ec.parConduite.get(el.conduite), K = E.kVanne(el), reel = modeEc() === 'reel';
          o.ouvV = `${Math.round((el.ouverture ?? 1) * 100)} %`;
          o.K = Number.isFinite(K) ? NB(K, 2) : '∞ (fermée)';
          if (!pc) { o.dH = '—'; o.dp = '—'; o.etapes = li([el.ouverte ? pourquoiRepos(elt(el.conduite)) : 'Vanne fermée : K infini, elle arrête l’écoulement.']); break; }
          const dH = reel ? K * pc.d.hv : 0;
          o.dH = `${NB(dH, 3)} m`;
          o.dp = P.pression(pc.sol.rho * g * dH, env.unite);
          o.etapes = li([`Vitesse dans la conduite : V = ${NB(pc.d.V, 3)} m/s, V²/2g = ${NB(pc.d.hv, 4)} m`,
            reel ? `Perte singulière : ΔH = K V²/2g = ${NB(K, 2)} × ${NB(pc.d.hv, 4)} = <b>${NB(dH, 3)} m</b>` : 'Fluide parfait : la vanne ne dissipe rien ; passez en fluide réel pour voir sa perte de charge.',
            `Chute de pression au passage : Δp = ρ g ΔH = ${NB(pc.sol.rho * g * dH, 0)} Pa`,
            'Vanne à opercule : K ≈ 0,2 ouverte, ≈ 1,15 aux trois quarts, ≈ 5,6 à moitié, ≈ 24 au quart. Fermer la vanne réduit le débit en augmentant K.']);
          break;
        }
        const ec = A.conduites.get(el.conduite), d = ec && ec.deltas.find(k => k.id === el.id), c = elt(el.conduite);
        if (el.ouverte || !d || d.dp == null) { o.dp = el.ouverte ? 'vanne ouverte : Δp nul à l’équilibre' : 'indéterminé (tronçon isolé)'; o.force = '—'; o.etapes = li(['Ouverte, la vanne laisse les deux côtés s’équilibrer.']); break; }
        const S = Math.PI * c.D ** 2 / 4;
        o.dp = P.pression(d.dp, env.unite);
        o.force = `${NB(Math.abs(d.dp) * S, 0)} N`;
        o.etapes = li([`Pression de chaque côté à la cote de la vanne (z = ${NB(d.z, 2)} m), calculée depuis chaque réservoir : Δp = ${NB(d.dp, 0)} Pa`, `Effort sur l’obturateur : F = Δp × πD²/4 = ${NB(Math.abs(d.dp), 0)} × ${NB(S, 5)} = ${NB(Math.abs(d.dp) * S, 0)} N`]);
        break;
      }
      case 'piezometre': {
        const m = A.mesures.get(el.id);
        if (!m || m.erreur) break;
        o.niv = m.vide || m.depression ? '—' : m.deborde ? 'déborde' : `z = ${NB(m.zN, 3)} m`;
        o.h = Number.isFinite(m.h) ? `${NB(m.h, 3)} m` : '—';
        o.hc = Number.isFinite(m.hc) ? `${NB(m.hc * 1000, 1)} mm` : '—';
        o.p = Number.isFinite(m.p) ? P_(m.p) : '—';
        o.etapes = li([...(m.etapes || []), ...(m.message ? [`<b>${esc(m.message)}</b>`] : []), ...(m.capillaire ? [esc(m.capillaire)] : []),
          ...(/^k:/.test(el.piquage.port) ? ['Prise face au courant (Pitot) : le liquide s’y arrête, la pression vaut p + ρV²/2 ; le niveau monte jusqu’à la ligne de charge H = z + p/ρg + V²/2g.'] : [])]);
        break;
      }
      case 'manometre': {
        const m = A.mesures.get(el.id);
        if (!m || m.erreur) break;
        o.lu = Number.isFinite(m.lu) ? `${P.pression(m.lu, env.unite)}${el.mode === 'absolu' ? ' abs' : ''}` : '—';
        o.abs = Number.isFinite(m.pabs) ? P.pression(m.pabs, env.unite) : '—';
        o.fs = P.pression(m.pleineEchelle || 0, env.unite);
        o.etapes = li([...(m.etapes || []), ...(m.message ? [esc(m.message)] : [])]);
        break;
      }
      case 'tubeU': {
        const m = A.mesures.get(el.id);
        if (!m || m.erreur) break;
        const ok = !m.invalide && Number.isFinite(m.dh);
        o.dh = ok ? `${NB(Math.abs(m.dh) * 1000, 1)} mm` : '—';
        o.z1 = ok ? `z₁ = ${NB(m.z1, 3)} m` : '—';
        o.z2 = ok ? `z₂ = ${NB(m.z2, 3)} m` : '—';
        o.pm = ok ? P.pression(m.pMesuree, env.unite) : '—';
        const et = [...(m.etapes || []), ...(m.message ? [`<b>${esc(m.message)}</b>`] : [])];
        if (ok && /^k:/.test(el.piquage.port)) {
          const pc = Ec && Ec.parConduite.get(el.piquage.el), rho = pc ? pc.sol.rho : 1000, rhoM = A.ctx.rho(el.fluideM);
          const Vp = E.vitessePitot({ dh: Math.abs(m.dh), rho, rhoM, g });
          et.push('Pitot double : la prise face au courant lit p + ρV²/2, la prise latérale p ; l’écart ρV²/2 = (ρ<sub>M</sub> − ρ) g Δh');
          et.push(`V = √(2(ρ<sub>M</sub> − ρ) g Δh/ρ) = √(2 × (${NB(rhoM, 0)} − ${NB(rho, 0)}) × ${NB(g, 2)} × ${NB(Math.abs(m.dh), 4)}/${NB(rho, 0)}) = <b>${NB(Vp, 3)} m/s</b>${pc ? ` (vitesse débitante ${NB(pc.d.V, 3)} m/s)` : ''}`);
        }
        o.etapes = li(et);
        break;
      }
      case 'vannePlane': {
        const v = A.ouvrages.get(el.id), e = A.etats.get(el.reservoir);
        if (!v || v.erreur) break;
        o.S = `${NB(P.formes[el.forme].S(el.a, el.l), 3)} m²`;
        o.hG = el.paroi === 'f' ? `${NB(e.zL - v.G.z, 3)} m` : `${NB(e.zL - v.G.z, 3)} m`;
        o.pG = P_(v.pG);
        o.F = `${NB(v.F / 1000, 2)} kN`;
        o.ecart = `${NB((v.uG - v.uC) * 100, 2)} cm`;
        o.hC = `${NB(e.zL - v.C.z, 3)} m`;
        o.FH = `${NB(v.FH / 1000, 2)} / ${NB(v.FV / 1000, 2)} kN`;
        o.M = v.levage != null ? `levage T = ${NB(v.levage / 1000, 2)} kN` : v.moment != null ? `${NB(v.moment / 1000, 2)} kN·m / ${NB(v.effort / 1000, 2)} kN` : 'non étudiée';
        o.etapes = li(v.etapes);
        break;
      }
      case 'flotteur': {
        const f = A.flotteurs.get(el.id);
        if (!f || f.erreur) break;
        o.P = `${NB(f.P / 1000, 3)} kN`;
        o.FA = `${NB(f.FA / 1000, 3)} kN`;
        o.T = f.fond ? 'au fond' : f.immerge ? 'immergé' : `${NB(f.T, 3)} m (franc-bord ${NB(el.h - f.T, 3)} m)`;
        o.CM = f.CM != null ? `${NB(f.CM, 3)} m` : '—';
        o.GM = f.GM != null ? `${NB(f.GM, 3)} m${f.GMfige != null ? ` (ballast figé : ${NB(f.GMfige, 3)} m)` : ''}` : '—';
        o.etat = f.fond ? 'repose au fond' : f.stable == null ? 'flotte' : f.stable ? 'stable' : 'instable';
        o.Fs = Number.isFinite(f.Fs) ? `${NB(f.Fs, 2)}${f.fond ? '' : ' (le corps flotte)'}` : '—';
        if (el.creux) o.hb = `${NB(f.lest.V, 2)} m³ sur ${NB(f.lest.h, 3)} m${f.lest.surfaceLibre ? ' (surface libre)' : ''}`;
        o.couple = f.gite ? `${NB(f.gite.couple / 1000, 2)} kN·m (${f.gite.redresse ? 'redresse' : 'fait chavirer'})` : el.gite ? '—' : 'θ = 0';
        o.giteV = `${NB(el.gite, 0)}°`;
        o.etapes = li(f.etapes);
        break;
      }
      case 'orifice': {
        const st = Ec && Ec.orifices.get(el.id), r = elt(el.reservoir);
        if (!st) { o.etapes = li([nonSimule]); break; }
        o.h = st.h > 0 ? `${NB(st.h, 3)} m` : 'hors liquide';
        o.V = st.V > 0 ? `${NB(st.V, 3)} m/s (théorique ${NB(st.Vth, 3)})` : '—';
        o.Q = st.Q > 0 ? `${NB(st.Q * 1000, 2)} L/s` : el.ouvert ? '0' : 'bouché';
        o.portee = st.jet ? (st.jet.cible ? `reçu par ${esc(st.jet.cible.id)}` : st.jet.portee != null ? `portée ${NB(Math.abs(st.jet.portee), 2)} m (chute ${NB(st.jet.chute, 2)} m)` : '—') : '—';
        const s = Math.PI * el.d ** 2 / 4, et = [];
        const vertical = el.paroi === 'g' || (el.paroi === 'd' && Math.abs(r.alpha - 90) < 1e-9);
        const T = Math.abs(r.alpha - 90) < 1e-9 && !r.ferme && !r.constant && st.h > 0 ? 2 * r.w * r.b * Math.sqrt(st.h) / (el.Cd * s * Math.sqrt(2 * g)) : null;
        o.T = r.constant ? 'niveau constant : régime permanent' : T != null ? `${duree(T)} jusqu’au niveau de l’orifice` : '—';
        if (st.h > 0 && el.ouvert) {
          et.push(`Charge sur le centre de l’orifice : h = p/ρg = ${NB(st.h, 3)} m${r.ferme ? ' (pression du ciel comprise)' : ' (profondeur sous la surface libre)'}`);
          et.push(`Torricelli (Bernoulli de la surface à la veine contractée) : V<sub>th</sub> = √(2gh) = √(2 × ${NB(g, 2)} × ${NB(st.h, 3)}) = ${NB(st.Vth, 3)} m/s`);
          et.push(`Vitesse réelle : V = C<sub>v</sub>√(2gh) = ${NB(el.Cv, 3)} × ${NB(st.Vth, 3)} = <b>${NB(st.V, 3)} m/s</b>`);
          et.push(`Débit : Q = C<sub>d</sub> s √(2gh) = ${NB(el.Cd, 3)} × ${NB(s, 6)} × ${NB(st.Vth, 3)} = <b>${NB(st.Q * 1000, 2)} L/s</b>`);
          if (vertical && st.jet && st.jet.portee != null) et.push(`Jet horizontal : x = Vt et y = gt²/2 ⇒ x = 2C<sub>v</sub>√(h y) ; pour une chute y = ${NB(st.jet.chute, 3)} m : portée <b>${NB(Math.abs(st.jet.portee), 2)} m</b>`);
          if (T != null) et.push(`Vidange (section S = ${NB(r.w * r.b, 3)} m² constante, l’orifice seul débite) : S dz = −Q dt ⇒ T = 2S√h/(C<sub>d</sub> s √(2g)) = <b>${duree(T)}</b>`);
        } else et.push(el.ouvert ? 'L’orifice est au-dessus de la surface libre : rien ne s’écoule.' : 'Orifice bouché : cliquez-le pour le déboucher.');
        o.etapes = li(et);
        break;
      }
      case 'pompe': {
        const i = infoPompe(el);
        if (!i) {
          o.Q = el.marche === false ? 'à l’arrêt' : '0'; o.H = o.Ph = o.Pa = '—';
          o.etapes = li([!Ec ? nonSimule : el.marche === false ? 'Pompe à l’arrêt : elle fait clapet anti-retour.' : 'Pas d’écoulement : l’aspiration doit plonger dans un réservoir et la chaîne aboutir à un réservoir ou une sortie libre ; vérifiez aussi les vannes et le sens de la pompe.']);
          break;
        }
        const { sol, info } = i;
        o.Q = `${NB(sol.Q * 1000, 2)} L/s`;
        o.H = `${NB(info.H, 2)} m`;
        o.Ph = `${NB(info.Ph / 1000, 2)} kW`;
        o.Pa = `${NB(info.Pabs / 1000, 2)} kW`;
        const et = etapesChaine(sol);
        if (sol.pompes.length === 1) et.push(`Hauteur manométrique : H<sub>m</sub> = (H<sub>aval</sub> − H<sub>amont</sub>) + Σ pertes = (${NB(sol.Hd, 3)} − ${NB(sol.Hs, 3)}) + ${NB(sol.total, 3)} = <b>${NB(info.H, 2)} m</b>`);
        et.push(`Puissance hydraulique : P<sub>h</sub> = ρ g Q H<sub>m</sub> = ${NB(sol.rho, 0)} × ${NB(g, 2)} × ${NB(sol.Q, 5)} × ${NB(info.H, 2)} = <b>${NB(info.Ph / 1000, 2)} kW</b>`);
        et.push(`Puissance absorbée : P<sub>a</sub> = P<sub>h</sub>/η = ${NB(info.Ph / 1000, 2)}/${NB(el.eta, 2)} = <b>${NB(info.Pabs / 1000, 2)} kW</b>`);
        o.etapes = li(et);
        break;
      }
      case 'raccord': {
        const sol = Ec && Ec.chaines.find(c => c.Q > 0 && c.raccords?.some(r => r.el === el)), r = sol && sol.raccords.find(k => k.el === el);
        if (!r) { o.D = o.V = o.dH = o.dp = '—'; o.etapes = li([Ec ? 'Pas d’écoulement à travers ce raccord.' : nonSimule]); break; }
        const dp = sol.rho * (r.V1 ** 2 - r.V2 ** 2) / 2 - sol.rho * g * r.h, elarg = r.D2 >= r.D1;
        o.D = `${NB(r.D1 * 1000, 0)} → ${NB(r.D2 * 1000, 0)} mm`;
        o.V = `${NB(r.V1, 3)} → ${NB(r.V2, 3)} m/s`;
        o.dH = `${NB(r.h, 4)} m`;
        o.dp = P.pression(dp, env.unite);
        o.etapes = li([`Continuité : S₁V₁ = S₂V₂ ⇒ V₂ = V₁(D₁/D₂)² = ${NB(r.V1, 3)} × (${NB(r.D1 * 1000, 0)}/${NB(r.D2 * 1000, 0)})² = ${NB(r.V2, 3)} m/s`,
          modeEc() === 'reel' ? (elarg ? `Élargissement brusque (Borda) : ΔH = (V₁ − V₂)²/2g = (${NB(r.V1, 3)} − ${NB(r.V2, 3)})²/(2 × ${NB(g, 2)}) = <b>${NB(r.h, 4)} m</b>` : `Rétrécissement brusque : ΔH = 0,5(1 − (D₂/D₁)²) V₂²/2g = <b>${NB(r.h, 4)} m</b>`) : 'Fluide parfait : aucune perte au raccord.',
          `Bernoulli entre l’amont et l’aval du raccord (même cote) : p₂ − p₁ = ρ(V₁² − V₂²)/2 − ρgΔH = <b>${NB(dp, 0)} Pa</b>${elarg ? ' : la pression remonte dans l’élargissement' : ' : la pression chute dans le rétrécissement'}`]);
        break;
      }
      case 'venturi': {
        const st = Ec && Ec.venturis.get(el.id), c = elt(el.conduite);
        if (!st || !c) { o.etapes = li([nonSimule]); break; }
        o.V12 = `${NB(st.V1, 3)} → ${NB(st.V2, 3)} m/s`;
        o.dp = P.pression(st.dp, env.unite);
        o.dh = `${NB(Math.abs(st.dh) * 1000, 1)} mm de ${esc(A.ctx.fl(el.fluideM).nom.toLowerCase())}`;
        o.Qmes = `${NB(st.Qmes * 1000, 2)} L/s`;
        o.Q = `${NB(st.Q * 1000, 2)} L/s`;
        o.p2 = `${P.pression(st.p2, env.unite)} (abs. ${P.pression(st.p2 + A.ctx.patm, env.unite)})`;
        const S1 = Math.PI * c.D ** 2 / 4, S2 = Math.PI * el.d ** 2 / 4;
        o.etapes = li(st.Q > 0 ? [
          `Continuité : V₁ = Q/S₁ = ${NB(st.Q, 5)}/${NB(S1, 5)} = ${NB(st.V1, 3)} m/s ; au col V₂ = Q/S₂ = ${NB(st.V2, 3)} m/s`,
          `Bernoulli entre l’entrée et le col (même cote, sans perte) : p₁ − p₂ = ρ(V₂² − V₁²)/2 = ${NB(st.rho, 0)} × (${NB(st.V2 ** 2, 3)} − ${NB(st.V1 ** 2, 3)})/2 = <b>${NB(st.dp, 0)} Pa</b>`,
          `Manomètre différentiel : p₁ − p₂ = (ρ<sub>M</sub> − ρ) g Δh ⇒ Δh = ${NB(st.dp, 0)}/((${NB(st.rhoM, 0)} − ${NB(st.rho, 0)}) × ${NB(g, 2)}) = <b>${NB(Math.abs(st.dh) * 1000, 1)} mm</b>`,
          `Lecture inverse : Q = C<sub>q</sub> S₂ √(2Δp/(ρ(1 − (S₂/S₁)²))) = <b>${NB(st.Qmes * 1000, 2)} L/s</b> avec C<sub>q</sub> = ${NB(el.Cq, 3)} (frottements et contraction)`
        ] : ['Pas d’écoulement dans la conduite : Δh = 0.']);
        break;
      }
      case 'exutoire': {
        const so = Ec && Ec.sorties.get(el.id);
        if (!so) { o.V = o.Q = o.portee = '—'; o.etapes = li([Ec ? 'Pas d’écoulement : reliez la sortie à un réservoir par une conduite et ouvrez la vanne.' : nonSimule]); break; }
        o.V = `${NB(so.V, 3)} m/s`;
        o.Q = `${NB(so.Q * 1000, 2)} L/s`;
        o.portee = so.jet && so.jet.cible ? `reçu par ${esc(so.jet.cible.id)}` : so.jet && so.jet.portee != null ? `portée ${NB(Math.abs(so.jet.portee), 2)} m (chute ${NB(so.jet.chute, 2)} m)` : '—';
        o.etapes = li([...etapesChaine(so.sol), 'Au-delà de la sortie, le jet suit une parabole : x = V<sub>x</sub> t, z = V<sub>z</sub> t − g t²/2.']);
        break;
      }
      case 'robinet': {
        const st = Ec && Ec.robinets.get(el.id), r = st && st.jet && st.jet.cible;
        o.debit = el.ouvert ? `${NB(el.Q * 1000, 2)} L/s = ${NB(el.Q * 3600, 2)} m³/h` : 'fermé';
        o.cible = !Ec ? '—' : !el.ouvert ? '—' : r ? `remplit ${esc(r.id)}` : 'tombe au sol';
        const S = r ? r.b * P.largeurA(r, Math.min(A.etats.get(r.id).sL, r.H)) : null;
        o.montee = S && el.ouvert ? `dz/dt = Q/S = ${NB(el.Q / S * 1000, 2)} mm/s` : '—';
        o.etapes = li(Ec ? [`Apport à débit constant Q = ${NB(el.Q * 1000, 2)} L/s.`, ...(S ? [`Dans ${esc(r.id)} (section S = ${NB(S, 3)} m²), en l’absence de sortie, le niveau monte de dz/dt = Q/S = ${NB(el.Q / S * 1000, 2)} mm/s ; s’il se vide en même temps, le niveau s’équilibre quand le débit sortant égale Q.`] : [])] : [nonSimule]);
        break;
      }
      case 'lance': {
        const st = Ec && Ec.lances.get(el.id);
        if (!st) { o.etapes = li([nonSimule]); break; }
        const S = Math.PI * el.d ** 2 / 4;
        o.Q = `${NB(st.Q * 1000, 2)} L/s`;
        o.qm = `${NB(st.Q * st.rho, 1)} kg/s`;
        o.qdm = forceTexte(st.reaction);
        o.Pj = `${NB(st.rho * st.Q * el.V ** 2 / 2 / 1000, 2)} kW`;
        o.cible = !st.Q ? '—' : st.im ? `${esc(st.im.o.id)} à ${NB(st.im.V, 2)} m/s` : st.jet && st.jet.cible ? esc(st.jet.cible.id) : st.jet && st.jet.portee != null ? `le sol, à ${NB(Math.abs(st.jet.portee), 2)} m` : '—';
        o.etapes = li(st.Q > 0 ? [`Section du jet S = πd²/4 = ${NB(S, 6)} m² ; débit Q = SV = ${NB(S, 6)} × ${NB(el.V, 2)} = <b>${NB(st.Q * 1000, 2)} L/s</b>`,
          `Flux de quantité de mouvement emporté par le jet : ρQV = ${NB(st.rho, 0)} × ${NB(st.Q, 5)} × ${NB(el.V, 2)} = <b>${forceTexte(st.reaction)}</b> ; c’est aussi la réaction qui repousse la lance (propulsion par réaction).`,
          `Puissance cinétique du jet : ½ρQV² = ${NB(st.rho * st.Q * el.V ** 2 / 2, 0)} W`,
          'En vol libre, seule la pesanteur agit : la composante horizontale de la vitesse se conserve, le jet décrit une parabole.'] : ['Lance fermée.']);
        break;
      }
      case 'plaque': {
        const ob = Ec && Ec.obstacles.get(el.id), im = ob && ob.impacts[0];
        if (!im) { o.F = o.alpha = o.Q12 = o.Fxz = '—'; o.etapes = li([Ec ? 'Aucun jet ne frappe la plaque : placez-la sur la trajectoire d’une lance, d’un orifice ou d’une sortie.' : nonSimule]); break; }
        const F = Math.hypot(ob.F.x, ob.F.z), ca = Math.abs(im.vt) / im.V;
        o.F = `<b>${forceTexte(F)}</b>`;
        o.alpha = `${NB(im.alpha, 1)}°`;
        o.Q12 = `${NB(im.Q1 * 1000, 2)} / ${NB(im.Q2 * 1000, 2)} L/s`;
        o.Fxz = `${forceTexte(ob.F.x)} / ${forceTexte(ob.F.z)}`;
        o.etapes = li([`Volume de contrôle : le jet entre l’arrivée et la plaque. Jet libre : pression atmosphérique partout, pressions relatives nulles ; pesanteur négligée sur ce petit volume.`,
          `Le jet arrive à V = ${NB(im.V, 3)} m/s avec un débit Q = ${NB(im.Q * 1000, 2)} L/s, sous l’angle α = ${NB(im.alpha, 2)}° avec la plaque.`,
          `Plaque lisse : pas d’effort tangentiel, la quantité de mouvement tangentielle se conserve : ρQ₁V − ρQ₂V = ρQV cos α. Avec Q₁ + Q₂ = Q : Q₁ = Q(1 + cos α)/2 = <b>${NB(im.Q1 * 1000, 2)} L/s</b>, Q₂ = Q(1 − cos α)/2 = <b>${NB(im.Q2 * 1000, 2)} L/s</b> (cos α = ${NB(ca, 3)}).`,
          `Projection sur la normale : la composante V sin α est détruite, d’où l’effort du jet F = ρQV sin α = ${NB(im.rho, 0)} × ${NB(im.Q, 5)} × ${NB(im.V, 3)} × ${NB(Math.sin(im.alpha * Math.PI / 180), 3)} = <b>${forceTexte(F)}</b>.`,
          ...(ob.impacts.length > 1 ? [`${ob.impacts.length} jets frappent la plaque : les efforts s’ajoutent.`] : [])]);
        break;
      }
      case 'auget': {
        const ob = Ec && Ec.obstacles.get(el.id), im = ob && ob.impacts[0];
        o.uV = `${NB(el.u, 2)} m/s`;
        if (!im) { o.F = o.P = o.eta = o.vo = '—'; o.courbe = ''; o.etapes = li([Ec ? (el.u > 0 ? 'Aucun jet n’atteint l’auget : il fuit plus vite que le jet, ou il est hors de sa trajectoire.' : 'Aucun jet ne frappe l’auget : orientez son ouverture face à une lance ou à un orifice.') : nonSimule]); break; }
        const F = Math.hypot(ob.F.x, ob.F.z), Pj = im.rho * im.Q * im.V ** 2 / 2, S = im.Q / im.V;
        o.F = `<b>${forceTexte(F)}</b>`;
        o.P = el.u > 0 ? `${NB(ob.P / 1000, 3)} kW` : 'auget fixe : P = 0';
        o.eta = el.u > 0 ? `${NB(ob.P / Pj * 100, 1)} %` : '—';
        o.vo = `${NB(Math.hypot(im.vo.x, im.vo.z), 2)} m/s`;
        o.courbe = courbeAuget(el, im);
        const et = [`Le jet arrive à V = ${NB(im.V, 3)} m/s (section S = ${NB(S, 6)} m², débit Q = ${NB(im.Q * 1000, 2)} L/s).`];
        if (el.u > 0) et.push(`Repère lié à l’auget : vitesse relative V − u = ${NB(im.Vr, 3)} m/s ; l’auget n’intercepte que Q<sub>r</sub> = S(V − u) = ${NB(im.Qr * 1000, 2)} L/s.`);
        et.push(`Déviation de β = ${NB(el.beta, 0)}° sans frottement : la vitesse relative garde son module. Projection d’Euler sur l’axe du jet : F = ρQ<sub>r</sub>(V − u)(1 − cos β)${el.beta >= 179 ? ' = 2ρS(V − u)²' : ''} = <b>${forceTexte(F)}</b>.`);
        if (el.u > 0) {
          et.push(`Puissance recueillie : P = F·u = ${forceTexte(F)} × ${NB(el.u, 2)} m/s = <b>${NB(ob.P / 1000, 3)} kW</b>, soit ${NB(ob.P / Pj * 100, 1)} % de la puissance du jet ½ρQV² = ${NB(Pj / 1000, 2)} kW.`);
          et.push(`P(u) = ρS(V − u)²u(1 − cos β) ; dP/du = ρS(V − u)(V − 3u)(1 − cos β) = 0 ⇒ <b>u = V/3 = ${NB(im.V / 3, 2)} m/s</b> pour un auget isolé (P<sub>max</sub> = 8/27 de la puissance du jet à 180°) ; une roue à augets multiples, qui intercepte tout le débit, a son optimum à V/2.`);
        } else et.push('Auget fixe : la force est double de celle sur une plaque normale (ρQV), d’où l’intérêt des augets Pelton.');
        et.push(`L’eau repart à la vitesse absolue ${el.beta >= 179 ? `2u − V = ${NB(2 * el.u - im.V, 2)} m/s` : `${NB(Math.hypot(im.vo.x, im.vo.z), 2)} m/s`}${Math.abs(2 * el.u - im.V) < 0.3 && el.beta >= 179 ? ' : elle tombe presque sans vitesse, toute son énergie cinétique a été cédée' : ''}.`);
        o.etapes = li(et);
        break;
      }
    }
    // Efforts d'ancrage (chapitre 5), quel que soit le modèle d'écoulement.
    if (el.type === 'conduite' && A.efforts) {
      const cs = A.efforts.coudes.filter(c => c.c === el);
      o.coudes = cs.length ? cs.map(c => `${forceTexte(Math.hypot(c.F.x, c.F.z))} à z = ${NB(c.z, 2)} m`).join('<br>') : 'aucun coude en charge';
      if (cs.length) o.etapes = (o.etapes || '') + li(cs.map(c => `Coude à ${NB(c.angle, 0)}° (z = ${NB(c.z, 2)} m) : p = ${NB(c.p / 1000, 2)} kPa, pS = ${NB(c.p * c.S, 0)} N, ρQV = ${NB(c.rho * c.Q * c.V, 0)} N ; Euler : F = (pS + ρQV)(e₁ − e₂) = ${NB(c.m, 0)} × ${NB(Math.hypot(c.e1.x - c.e2.x, c.e1.z - c.e2.z), 3)} = <b>${forceTexte(Math.hypot(c.F.x, c.F.z))}</b> (poids de l’eau du coude négligé).`));
    }
    if (el.type === 'raccord' && A.efforts) {
      const r = A.efforts.raccords.find(k => k.r === el);
      o.Fa = r ? `${forceTexte(Math.abs(r.Fa))} ${(r.Fa > 0) === (r.e.x > 0) ? 'vers la droite' : 'vers la gauche'}` : '—';
      if (r) o.etapes = (o.etapes || '') + li([`Effort axial (Euler) : F = p₁S₁ + ρQV₁ − p₂S₂ − ρQV₂ = ${NB(r.a.p * r.a.S, 0)} + ${NB(r.a.rho * r.Q * r.Va, 0)} − ${NB(r.b.p * r.b.S, 0)} − ${NB(r.b.rho * r.Q * r.Vb, 0)} = <b>${forceTexte(r.Fa)}</b> ; les brides ou un massif doivent le reprendre.`]);
    }
    if (el.type === 'orifice' && Ec) {
      const st = Ec.orifices.get(el.id);
      o.R = st && st.Q > 0 ? forceTexte(st.reaction) : '—';
      if (st && st.Q > 0) o.etapes = (o.etapes || '') + li([`Réaction du jet sur le réservoir (ex. 5.5) : F = ρQV = ρ C<sub>d</sub>C<sub>v</sub> s · 2gh = <b>${forceTexte(st.reaction)}</b>, ${el.Cd === 1 && el.Cv === 1 ? 'soit exactement' : 'à comparer à'} 2ρghs = ${forceTexte(2 * st.rho * g * st.h * Math.PI * el.d ** 2 / 4)} : le double de la poussée hydrostatique sur un bouchon.`]);
    }
    if (el.type === 'exutoire' && Ec) { const so = Ec.sorties.get(el.id); o.R = so ? forceTexte(so.reaction) : '—'; }
    return o;
  }
  // Saisie dans l'inspecteur.
  function appliquer(k, valeur, brut, fin) {
    const el = L.sel ? elt(L.sel) : null, ctx = L.A.ctx;
    const v = parseFloat(String(valeur).replace(',', '.'));
    const ok = Number.isFinite(v);
    if (!el) {
      if (!ok) return;
      if (k === 'g') L.scene.env.g = clamp(v, 1, 30);
      if (k === 'patm') L.scene.env.patm = clamp(v * 1000, 50000, 120000);
      if (k === 'rhoPerso') L.scene.perso.rho = clamp(v, 500, 20000);
      if (k === 'zSol') L.scene.env.zSol = clamp(v, -200, 200);
      for (const r of L.scene.elements) if (r.type === 'reservoir') { r.couches = P.trierCouches(r.couches, P.contexte(L.scene)); }
      return apresEdition(fin);
    }
    let structure = fin;
    switch (el.type) {
      case 'reservoir': {
        if (k === 'nom') { el.nom = String(valeur).slice(0, 40); break; }
        if (k === 'ferme') { el.ferme = brut === '1'; if (el.ferme) { if (!el.ciel.p) el.ciel.p = 20000; } P.calerGaz(el, ctx, L.scene); structure = true; break; }
        if (k === 'mode') { el.ciel.mode = valeur === 'piege' ? 'piege' : 'impose'; P.calerGaz(el, ctx, L.scene); structure = true; break; }
        if (k === 'p0' && ok) { el.ciel.p = clamp(v * 1000, -100000, 1e7); P.calerGaz(el, ctx, L.scene); break; }
        if (k === 'diagramme') { el.diagramme = valeur; break; }
        if (k === 'constant') { el.constant = brut === '1'; if (el.constant) el.hc = L.A.etats.get(el.id).sL; structure = true; break; }
        if (k === 'aspect') { el.aspect = valeur === 'sol' ? 'sol' : 'liquide'; break; }
        if (k === 'ajoutCouche' && valeur) { remplir(el, valeur, null); structure = true; break; }
        if (k.startsWith('couche:')) {
          const [, i, q] = k.split(':'), hauts = hauteursCouches(el);
          if (!hauts[+i]) break;
          if (q === 'fluide') hauts[+i].fluide = valeur;
          else if (q === 'h' && ok) hauts[+i].h = Math.max(0, v);
          else if (q === 'suppr') hauts.splice(+i, 1);
          const tot = hauts.reduce((t, c) => t + c.h, 0), max = el.H * (el.ferme ? 0.97 : 1);
          if (tot > max) { const ex = tot - max; hauts[+i] && (hauts[+i].h = Math.max(0, hauts[+i].h - ex)); }
          el.couches = P.trierCouches(P.couchesDepuisHauteurs(el, hauts), ctx);
          if (el.constant) el.hc = Math.min(el.H, hauts.reduce((t, c) => t + c.h, 0));
          P.calerGaz(el, ctx, L.scene);
          if (q !== 'h') structure = true;
          break;
        }
        if (!ok) return;
        const hauts = hauteursCouches(el);
        if (k === 'x') el.x = v;
        else if (k === 'z') el.z = v;
        else if (k === 'b') el.b = clamp(v, 0.05, 60);
        else if (k === 'w' || k === 'H' || k === 'alpha') {
          const essai = { ...el, [k]: k === 'alpha' ? clamp(v, 30, 150) : clamp(v, k === 'w' ? 0.3 : 0.5, 60) };
          if (P.largeurA(essai, essai.H) < 0.25) return;
          el[k] = essai[k];
        }
        if (['w', 'H', 'alpha', 'b'].includes(k)) { el.couches = P.trierCouches(P.couchesDepuisHauteurs(el, hauts), ctx); P.calerGaz(el, ctx, L.scene); }
        break;
      }
      case 'conduite':
        if (k === 'zrAuto') { el.zr = null; break; }
        if (k === 'LreelAuto') { el.Lreel = null; structure = true; break; }
        if (k === 'lambdaImp') { el.lambda = brut === '1' ? 0.02 : null; structure = true; break; }
        if (k === 'Kauto') { el.Kauto = brut === '1'; break; }
        if (!ok) return;
        if (k === 'D') el.D = clamp(v / 1000, 0.005, 5);
        if (k === 'zr') el.zr = v;
        if (k === 'Lreel') el.Lreel = clamp(v, 0.01, 100000);
        if (k === 'rugo') el.rugo = clamp(v, 0, 50);
        if (k === 'lambda') el.lambda = clamp(v, 0, 0.2);
        if (k === 'K') el.K = clamp(v, 0, 10000);
        break;
      case 'vanne':
        if (k === 'basculer') { el.ouverte = !el.ouverte; structure = true; dire(`Vanne ${el.id} ${el.ouverte ? 'ouverte' : 'fermée'}`); break; }
        if (!ok) return;
        if (k === 't') el.t = clamp(v / 100, 0.05, 0.95);
        if (k === 'ouverture') el.ouverture = clamp(v / 100, 0.05, 1);
        if (k === 'Kv') el.Kv = clamp(v, 0, 1000);
        break;
      case 'orifice':
        if (k === 'basculer') { el.ouvert = !el.ouvert; structure = true; break; }
        if (k === 'paroi') { el.paroi = valeur; structure = true; break; }
        if (!ok) return;
        if (k === 'd') el.d = clamp(v / 1000, 0.001, 5);
        if (k === 'Cd') el.Cd = clamp(v, 0.05, 1);
        if (k === 'Cv') el.Cv = clamp(v, 0.05, 1);
        if (k === 's') el.s = Math.max(0, v);
        break;
      case 'pompe':
        if (k === 'basculer') { el.marche = el.marche === false; structure = true; break; }
        if (k === 'mode') { el.mode = valeur === 'courbe' ? 'courbe' : 'debit'; structure = true; break; }
        if (k === 'sens') { el.sens = valeur === '-1' ? -1 : 1; break; }
        if (!ok) return;
        if (k === 'Q') el.Q = clamp(v / 1000, 0, 100);
        if (k === 'H0') el.H0 = clamp(v, 0, 5000);
        if (k === 'k') el.k = clamp(v, 0, 1e9);
        if (k === 'eta') el.eta = clamp(v / 100, 0.05, 1);
        if (k === 'x') el.x = clamp(v, -500, 500);
        if (k === 'z') el.z = clamp(v, -500, 500);
        break;
      case 'raccord': case 'exutoire':
        if (!ok) return;
        if (k === 'x') el.x = clamp(v, -500, 500);
        if (k === 'z') el.z = clamp(v, -500, 500);
        break;
      case 'venturi': {
        if (k === 'fluideM') { el.fluideM = valeur; break; }
        if (!ok) return;
        const c = elt(el.conduite);
        if (k === 'd') el.d = clamp(v / 1000, 0.002, c ? c.D * 0.95 : 5);
        if (k === 'Cq') el.Cq = clamp(v, 0.5, 1);
        if (k === 't') el.t = clamp(v / 100, 0.05, 0.95);
        break;
      }
      case 'robinet':
        if (k === 'basculer') { el.ouvert = !el.ouvert; structure = true; break; }
        if (k === 'fluide') { el.fluide = valeur; break; }
        if (!ok) return;
        if (k === 'Q') el.Q = clamp(v / 1000, 0, 100);
        if (k === 'x') el.x = clamp(v, -500, 500);
        if (k === 'z') el.z = clamp(v, -500, 500);
        break;
      case 'lance':
        if (k === 'basculer') { el.ouvert = !el.ouvert; structure = true; break; }
        if (k === 'fluide') { el.fluide = valeur; break; }
        if (!ok) return;
        if (k === 'd') el.d = clamp(v / 1000, 0.002, 2);
        if (k === 'V') el.V = clamp(v, 0, 200);
        if (k === 'angle') el.angle = clamp(v, -360, 360);
        if (k === 'x') el.x = clamp(v, -500, 500);
        if (k === 'z') el.z = clamp(v, -500, 500);
        break;
      case 'plaque': case 'auget':
        if (k === 'sens') { el.sens = valeur === '-1' ? -1 : 1; break; }
        if (!ok) return;
        if (k === 'L') el.L = clamp(v, 0.05, 50);
        if (k === 'w') el.w = clamp(v, 0.05, 10);
        if (k === 'beta') el.beta = clamp(v, 10, 180);
        if (k === 'u') el.u = clamp(v, 0, 200);
        if (k === 'angle') el.angle = clamp(v, -360, 360);
        if (k === 'x') el.x = clamp(v, -500, 500);
        if (k === 'z') el.z = clamp(v, -500, 500);
        break;
      case 'piezometre':
        if (!ok) return;
        if (k === 'Ht') el.Ht = clamp(v, 0.2, 40); if (k === 'd') el.d = clamp(v, 0.5, 60); if (k === 'ox') el.ox = clamp(v, -20, 20);
        break;
      case 'manometre':
        if (k === 'mode') { el.mode = valeur === 'absolu' ? 'absolu' : 'relatif'; break; }
        if (k === 'ox' && ok) el.ox = clamp(v, -20, 20);
        break;
      case 'tubeU':
        if (k === 'fluideM') { el.fluideM = valeur; break; }
        if (!ok) return;
        if (k === 'L') el.L = clamp(v, 0.2, 10); if (k === 'ox') el.ox = clamp(v, -20, 20); if (k === 'oz') el.oz = clamp(v, -20, 20);
        break;
      case 'vannePlane': {
        if (k === 'paroi') { el.paroi = valeur; structure = true; break; }
        if (k === 'forme') { el.forme = valeur; if (valeur === 'cercle') el.l = el.a; structure = true; break; }
        if (k === 'charniere') { el.charniere = valeur; if (valeur === 'glissieres') { el.f ??= 0.25; el.poids ??= 0; } structure = true; break; }
        if (k === 'f' && ok) { el.f = clamp(v, 0, 1.5); break; }
        if (k === 'poids' && ok) { el.poids = clamp(v * 1000, 0, 1e8); break; }
        if (!ok) return;
        if (k === 'a') { el.a = Math.max(0.05, v); if (el.forme === 'cercle') el.l = el.a; }
        if (k === 'l') el.l = Math.max(0.05, v);
        if (k === 's') el.s = v;
        break;
      }
      case 'flotteur':
        if (k === 'creux') { el.creux = brut === '1'; el.e ??= 0.03; el.ballast ??= 0; el.ballastFluide ??= 'eau'; structure = true; break; }
        if (k === 'ballastFluide') { el.ballastFluide = valeur; break; }
        if (!ok) return;
        if (k === 'ballast') { el.ballast = clamp(v, 0, P.lestFlotteur({ ...el, ballast: Infinity }, ctx).Vmax); break; }
        if (k === 'e') { el.e = clamp(v, 0, Math.min(el.l, el.h, el.b) / 2 - 0.01); structure = true; break; }
        if (k === 'cloisons') { el.cloisons = clamp(Math.round(v), 1, 12); break; }
        if (k === 'dens') el.m = clamp(v, 1, 30000) * el.l * el.h * el.b;
        else if (k === 'gite') el.gite = clamp(v, -30, 30);
        else if (k === 'm') el.m = Math.max(0.01, v);
        else if (['l', 'h', 'b'].includes(k)) { const d = el.m / (el.l * el.h * el.b); el[k] = Math.max(0.05, v); el.m = d * el.l * el.h * el.b; }
        else if (k === 'zG') el.zG = Math.max(0, v);
        break;
    }
    apresEdition(structure);
  }
  let modifEnCours = false;
  const debutModif = () => { if (!modifEnCours) { avantModif(); modifEnCours = true; } };
  insp.addEventListener('input', e => {
    const t = e.target, k = t.dataset && t.dataset.k;
    if (!k || t.tagName === 'SELECT' || t.type === 'checkbox') return;
    debutModif();
    appliquer(k, t.value, t.value, false);
  });
  insp.addEventListener('change', e => {
    const t = e.target, k = t.dataset && t.dataset.k;
    if (!k) return;
    debutModif();
    const val = t.type === 'checkbox' ? (t.checked ? '1' : '0') : t.value;
    appliquer(k, val, val, true);
    modifEnCours = false;
    if (t.tagName === 'SELECT' && k === 'ajoutCouche') t.value = '';
  });
  insp.addEventListener('click', e => {
    const b = e.target.closest('button[data-k]');
    if (!b) return;
    avantModif();
    appliquer(b.dataset.k, b.dataset.v ?? '', b.dataset.v ?? '', true);
    modifEnCours = false;
  });
  insp.addEventListener('focusout', () => { modifEnCours = false; });

  // ---------- démarrage ----------
  let initial = opts.scenario;
  let restauree = null;
  if (!integre) {
    const h = decodeURIComponent((location.hash || '').slice(1));
    if (h && SCENARIOS.some(s => s.id === h)) initial = h;
    else {
      try {
        const brut = JSON.parse(localStorage.getItem(CLE) || 'null');
        if (brut && brut.scene) { restauree = P.verifierScene(brut.scene); initial = brut.scenario || null; }
      } catch { restauree = null; }
    }
  }
  if (restauree) {
    L.scene = restauree; L.scenario = initial && SCENARIOS.some(s => s.id === initial) ? initial : null;
    majBarre(); majConsigne(); apresEdition(true);
  } else charger(initial === undefined ? 'vases' : initial);
  majBoutons();
  if (!integre) window.addEventListener('hashchange', () => {
    const h = decodeURIComponent(location.hash.slice(1));
    if (SCENARIOS.some(s => s.id === h) && h !== L.scenario) charger(h, { garderHisto: true });
  });

  const api = {
    charger: id => charger(id, { garderHisto: true }),
    scene: () => L.scene,
    analyse: () => L.A,
    vue: () => ({ ...L.vue }),
    emprise,
    // Hors écran, une figure du cours fige son temps et coupe sa boucle.
    visible: b => { L.cache = !b; if (b) demander(); },
    detruire: () => { ro.disconnect(); cancelAnimationFrame(L.raf); racine.innerHTML = ''; }
  };
  racine.labo = api;
  return api;
}
