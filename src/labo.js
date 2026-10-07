// Laboratoire virtuel d'hydrostatique : interface (palette, scène SVG,
// inspecteur). monterLabo() sert la page labo.html et les figures dynamiques
// intégrées au cours (mode « integre »).
import * as P from './labo-physique.js';
import { SCENARIOS, creerScenario } from './labo-scenarios.js';
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
  flotteur: ic('<rect x="3" y="15" width="22" height="9" fill="#8CC4DA"/><rect x="8" y="9" width="12" height="10" fill="#C9A46C" stroke="currentColor" stroke-width="1.6"/>')
};
const goutte = c => ic(`<path d="M14 3c4 6 8 10 8 14a8 8 0 0 1-16 0c0-4 4-8 8-14z" fill="${c}" stroke="currentColor" stroke-width="1.4"/>`);
const PALETTE = [
  { titre: 'Récipients', items: [['ouvert', 'Réservoir ouvert'], ['ferme', 'Réservoir fermé'], ['incline', 'Paroi inclinée']] },
  { titre: 'Fluides', items: P.LIQUIDES.map(f => [`fluide:${f}`, P.FLUIDES[f].nom.replace(/ \(.*\)/, '')]) },
  { titre: 'Liaisons', items: [['conduite', 'Conduite'], ['vanne', 'Vanne']] },
  { titre: 'Mesure', items: [['piezometre', 'Piézomètre'], ['manometre', 'Manomètre'], ['tubeU', 'Tube en U'], ['tubeUdiff', 'U différentiel']] },
  { titre: 'Ouvrages', items: [['vp-rect', 'Vanne plane'], ['vp-cercle', 'Vanne circulaire'], ['flotteur', 'Flotteur']] }
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
  flotteur: 'Lâchez le corps dans un réservoir : il trouve sa flottaison.'
};
const NOMS = { reservoir: 'Réservoir', conduite: 'Conduite', vanne: 'Vanne', piezometre: 'Piézomètre', manometre: 'Manomètre', tubeU: 'Tube en U', vannePlane: 'Vanne plane', flotteur: 'Flotteur' };

export function monterLabo(racine, opts = {}) {
  const integre = opts.mode === 'integre';
  const L = {
    scene: null, scenario: null, A: null, sel: null, vue: { k: 70, ox: 60, oy: 300, W: 640, H: 420 }, zoomManuel: false,
    drag: null, connexion: null, pointeurs: new Map(), pinch: null, histo: [], futur: [], raf: 0, last: 0, temps: 0,
    aff: new Map(), ressorts: new Map(), saisi: new Set(), animation: !reduit(), inspCle: null, alertesCle: '', palette: !integre
  };

  // ---------- DOM ----------
  racine.classList.add('labo');
  if (integre) racine.classList.add('labo-integre');
  const optScen = `<option value="">Atelier libre</option>` + SCENARIOS.map(s => `<option value="${s.id}">${esc(s.titre)}</option>`).join('');
  const optUnites = Object.keys(P.UNITES).map(u => `<option value="${u}">${P.UNITES[u].nom}</option>`).join('');
  racine.innerHTML = `
    <div class="lb-barre">
      ${integre ? `<strong class="lb-titre-int"></strong>` : `<label class="lb-scen">Expérience <select data-r="scenario">${optScen}</select></label>`}
      <div class="lb-groupe">
        <button type="button" data-a="annuler" title="Annuler (Ctrl+Z)" aria-label="Annuler">↶</button>
        <button type="button" data-a="retablir" title="Rétablir (Ctrl+Y)" aria-label="Rétablir">↷</button>
        <button type="button" data-a="${integre ? 'reinit' : 'vider'}">${integre ? 'Réinitialiser' : 'Vider'}</button>
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
          <label><input type="checkbox" data-anim> Animer les écoulements</label>
        </div></details>
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
    alertesUl = $('.lb-alertes'), fantome = $('.lb-fantome'), annonce = $('.lb-sr'), consigne = $('.lb-consigne');

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
    L.sel = null; L.connexion = null; L.aff.clear(); L.ressorts.clear(); L.zoomManuel = false;
    if (!L.animation) P.equilibrer(L.scene);
    L.A = P.analyser(L.scene);
    majBarre(); majConsigne(); cadrer(); apresEdition(true);
  }
  function majConsigne() {
    const m = SCENARIOS.find(s => s.id === L.scenario);
    if (integre) { const t = $('.lb-titre-int'); t.textContent = m ? m.titre : 'Laboratoire'; const a = $('[data-r="plein"]'); if (a) a.href = `labo.html${m ? '#' + m.id : ''}`; }
    if (!m) { consigne.hidden = true; return; }
    consigne.hidden = false;
    const lien = m.ancre ? (integre ? `#${encodeURIComponent(m.ancre)}` : `cours.html#${encodeURIComponent(m.ancre)}`) : null;
    consigne.innerHTML = `${integre ? '' : `<strong>${esc(m.titre)}</strong> <span class="lb-ref">${esc(m.ref)}</span> — `}${esc(m.consigne)}${lien && !integre ? ` <a href="${lien}">Revoir le cours</a>` : ''}`;
  }
  function majBarre() {
    const env = L.scene.env;
    const sc = racine.querySelector('[data-r="scenario"]'); if (sc) sc.value = L.scenario || '';
    racine.querySelector('[data-r="unite"]').value = env.unite;
    racine.querySelectorAll('[data-ref]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.ref === env.reference)));
    racine.querySelectorAll('[data-v]').forEach(c => { c.checked = !!env.vues[c.dataset.v]; });
    racine.querySelector('[data-anim]').checked = L.animation;
  }

  // Toute modification passe par ici : nettoyage, recalcul, rendu.
  function apresEdition(structure = false) {
    P.nettoyerScene(L.scene);
    if (L.sel && !L.scene.elements.some(e => e.id === L.sel)) L.sel = null;
    if (!L.animation) P.equilibrer(L.scene);
    if (structure) L.inspCle = null;
    sauver();
    demander();
  }

  // ---------- vue ----------
  const V = () => vueDe(L.vue);
  function emprise() {
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    const ajoute = (x, z) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); };
    const A = L.A || P.analyser(L.scene);
    for (const e of L.scene.elements) {
      if (e.type === 'reservoir') { ajoute(e.x, e.z); ajoute(e.x + Math.max(e.w, P.largeurA(e, e.H)), e.z + e.H + 0.3); }
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
    if (!Number.isFinite(x0)) { x0 = 0; x1 = 6; z0 = -0.5; z1 = 4; }
    return { x0, x1, z0, z1 };
  }
  function cadrer() {
    const b = emprise(), W = L.vue.W, H = L.vue.H, mg = 0.5;
    const bw = b.x1 - b.x0 + 2 * mg, bh = b.z1 - b.z0 + 2 * mg;
    const k = clamp(Math.min((W - 70) / bw, (H - 40) / bh), 14, 260);
    L.vue.k = k;
    L.vue.ox = 46 + (W - 56 - bw * k) / 2 - (b.x0 - mg) * k;
    L.vue.oy = H - 12 - (H - 34 - bh * k) / 2 + (b.z0 - mg) * k;
    demander();
  }
  function zoomer(f, X = L.vue.W / 2, Y = L.vue.H / 2) {
    const k = clamp(L.vue.k * f, 10, 400), r = k / L.vue.k;
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
    if (L.animation && !(L.drag && L.drag.gel)) actif = P.avancer(L.scene, dt);
    L.A = P.analyser(L.scene);
    actif = majAffichage(dt) || actif;
    rendre();
    if (actif) L.raf = requestAnimationFrame(boucle);
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
    if (L.connexion) t = L.connexion.type === 'conduite' ? 'Choisissez le second piquage de la conduite (Échap pour annuler).' : 'Choisissez le piquage de la seconde branche (Échap pour annuler).';
    else if (L.drag && L.drag.mode === 'palette') t = L.drag.texteAide || 'Relâchez sur une cible surlignée.';
    else if (!L.scene.elements.length) t = integre ? 'Ouvrez la palette « Construire » pour ajouter des éléments.' : 'Glissez un réservoir depuis la palette, puis remplissez-le en y déposant un fluide.';
    else t = integre ? 'Cliquez une vanne · tirez une surface libre · survolez le liquide pour lire la pression · Ctrl + molette : zoom'
      : 'Cliquez une vanne pour l’ouvrir · tirez une surface libre pour remplir · survolez le liquide pour lire la pression · molette : zoom · glisser le fond : déplacer la vue';
    if (aide.textContent !== t) aide.textContent = t;
  }

  // ---------- cibles d'accrochage ----------
  function ciblesPiquages({ conduites = true, couvercles = true, sauf = null } = {}) {
    const res = [], A = L.A || P.analyser(L.scene);
    for (const e of L.scene.elements) {
      if (e.type === 'reservoir' && e.id !== sauf) {
        for (const p of P.portsReservoir(e)) if (couvercles || p.paroi !== 'h') res.push({ ...p, ref: { el: e.id, port: p.id } });
      }
      if (conduites && e.type === 'conduite' && A.conduites.get(e.id)) {
        for (const t of P.TAPS_CONDUITE) {
          const q = P.pointSurTrace(A.conduites.get(e.id).tr, t);
          res.push({ x: q.x, z: q.z, sx: 0, sz: 1, paroi: 't', el: e.id, ref: { el: e.id, port: `t:${t.toFixed(2)}` } });
        }
      }
    }
    return res;
  }
  function plusProche(cibles, X, Y, rayon = 34) {
    const v = V();
    let best = null, d = rayon;
    for (const c of cibles) { const dd = Math.hypot(v.X(c.x) - X, v.Y(c.z) - Y); if (dd < d) { d = dd; best = c; } }
    return best;
  }
  const etiquettePort = c => c.paroi === 't' ? `piquage sur ${c.el} · z = ${NB(c.z, 2)} m` : `${c.el} · ${({ g: 'paroi gauche', d: 'paroi droite', f: 'fond', h: 'couvercle' })[c.paroi]} · z = ${NB(c.z, 2)} m`;
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
    const A = P.analyser(L.scene), t = P.piquage(L.scene, ref, { ...A, idx: A.idx });
    if (!t || !t.fluide || !(t.p > 0)) return 1.5;
    return clamp(Math.ceil((t.p / (t.rho * A.ctx.g) + 0.5) / 0.25) * 0.25, 0.75, 20);
  }
  function creerAppareil(kind, c) {
    const ref = { el: c.el || c.ref.el, port: c.ref.port };
    if (kind === 'piezometre') return { id: nouvelId('piezometre'), type: 'piezometre', piquage: ref, Ht: hauteurPiezo(ref), d: 12, ox: c.paroi === 't' ? 0 : decalageAppareil(ref) };
    if (kind === 'manometre') return { id: nouvelId('manometre'), type: 'manometre', piquage: ref, mode: 'relatif', ox: c.paroi === 't' ? 0 : decalageAppareil(ref) };
    if (kind === 'tubeU') return { id: nouvelId('tubeU'), type: 'tubeU', piquage: ref, piquage2: null, fluideM: 'mercure', L: 1, ox: c.sx < 0 ? -0.6 : 0.6, oz: -0.6 };
    return null;
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
    dire(`${NOMS[el.type] || 'Élément'} ${el.id} ajouté`);
  }
  function remplir(r, fluide, zCible) {
    const A = P.analyser(L.scene), e = A.etats.get(r.id);
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
    P.calerGaz(r, A.ctx, L.scene);
    return true;
  }
  function ajoutRapide(kind) {
    const els = L.scene.elements, tanks = els.filter(e => e.type === 'reservoir');
    const cible = (els.find(e => e.id === L.sel && e.type === 'reservoir')) || tanks[0];
    avantModif();
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
      const cibles = ciblesPiquages({ conduites: k !== 'conduite' && k !== 'tubeUdiff', couvercles: k === 'manometre' || k === 'tubeU' });
      const c = plusProche(cibles, X, Y);
      d.ui.cibles = cibles.map(q => ({ x: q.x, z: q.z, actif: q === c }));
      if (c) { d.cible = c; d.ui.aimant = { x: c.x, z: c.z, texte: etiquettePort(c) }; }
      d.texteAide = c ? etiquettePort(c) : 'Approchez d’un piquage (points) pour accrocher l’appareil.';
      return;
    }
    if (k === 'vanne') {
      let best = null;
      for (const [id, ec] of L.A.conduites) {
        const p = P.projeterSurTrace(ec.tr, x, z), dpx = p.d * L.vue.k;
        if (dpx < 30 && (!best || dpx < best.dpx)) best = { id, t: clamp(arr(p.t, 0.05), 0.05, 0.95), dpx, tr: ec.tr };
      }
      if (best) { const q = P.pointSurTrace(best.tr, best.t); d.cible = best; d.ui.aimant = { x: q.x, z: q.z, texte: `sur ${best.id}` }; }
      d.texteAide = best ? `Vanne sur ${best.id}` : 'Approchez d’une conduite.';
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
    const cibles = ciblesPiquages({ conduites: false, couvercles: false, sauf: type === 'conduite' ? premier.el : null }).filter(q => !(q.el === premier.el && q.id === premier.id));
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
    const glissables = ['res', 'surf', 'taille', 'palier', 'van', 'inst', 'ubloc', 'vp', 'flot'];
    if (!type || !el || !glissables.includes(type)) { d.type = 'vue'; d.vue0 = { ...L.vue }; return; }
    avantModif();
    if (type === 'res') { d.dx = v.x(d.debut.X) - el.x; d.dz = v.z(d.debut.Y) - el.z; }
    else if (type === 'surf') { d.i = +extra; d.gel = true; }
    else if (type === 'taille') { d.gel = true; d.hauteurs = hauteursCouches(el); }
    else if (type === 'flot') { L.saisi.add(el.id); d.gel = false; }
    else if (type === 'inst') { d.origine = { ...el.piquage }; }
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
        const cibles = ciblesPiquages({ couvercles: el.type !== 'piezometre' }).filter(q => !(q.el === el.id));
        const c = plusProche(cibles, X, Y);
        d.ui.cibles = cibles.map(q => ({ x: q.x, z: q.z, actif: q === c }));
        if (c) { el.piquage = { ...c.ref }; d.ui.aimant = { x: c.x, z: c.z, texte: etiquettePort(c) }; }
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
    if (d.type === 'inst' && d.el && !P.resoudre(L.scene, d.el.piquage)) d.el.piquage = d.origine;
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
    }
  });
  const sc = racine.querySelector('[data-r="scenario"]');
  if (sc) sc.addEventListener('change', () => { charger(sc.value || null, { garderHisto: true }); if (!integre) history.replaceState(null, '', sc.value ? `#${sc.value}` : location.pathname); });
  racine.querySelector('[data-r="unite"]').addEventListener('change', e => { L.scene.env.unite = e.target.value; L.inspCle = null; sauver(); demander(); });
  racine.querySelectorAll('[data-v]').forEach(c => c.addEventListener('change', () => { L.scene.env.vues[c.dataset.v] = c.checked; sauver(); demander(); }));
  racine.querySelector('[data-anim]').addEventListener('change', e => { L.animation = e.target.checked; if (!L.animation) P.equilibrer(L.scene); demander(); });
  const fichier = racine.querySelector('[data-r="fichier"]');
  if (fichier) fichier.addEventListener('change', async () => {
    const f = fichier.files[0]; fichier.value = '';
    if (!f) return;
    try {
      if (f.size > 200 * 1024) throw Error('Fichier trop volumineux (200 Ko au plus).');
      const s = P.verifierScene(JSON.parse(await f.text()));
      avantModif();
      L.scene = s; L.scenario = null; L.sel = null; L.aff.clear(); L.ressorts.clear();
      L.A = P.analyser(L.scene); L.zoomManuel = false;
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
    const tete = `<header class="lb-insp-tete"><span class="lb-type">${NOMS[el.type]}</span><strong>${esc(el.id)}</strong><button type="button" data-a="supprimer" class="lb-suppr" title="Supprimer (Suppr)">Supprimer</button></header>`;
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
          <p class="lb-note">Les liquides non miscibles se rangent par densité, le plus lourd au fond.</p></fieldset>`;
        h += `<fieldset><legend>Ciel</legend><div class="lb-seg" role="group"><button type="button" data-k="ferme" data-v="0" aria-pressed="${!el.ferme}">ouvert</button><button type="button" data-k="ferme" data-v="1" aria-pressed="${el.ferme}">fermé</button></div>`;
        if (el.ferme) h += sel_('mode', 'Gaz', el.ciel.mode, [['impose', 'pression imposée (détendeur)'], ['piege', 'gaz piégé (p·V constant)']]) + num('p0', 'p₀ relative', el.ciel.mode === 'piege' ? e.pCiel / 1000 : el.ciel.p / 1000, 'kPa', { pas: 1, min: -100, dec: 2 });
        h += `</fieldset>`;
        h += `<fieldset><legend>Géométrie</legend><div class="lb-grille2">${num('x', 'x gauche', el.x, 'm')}${num('z', 'Cote du fond', el.z, 'm')}${num('w', 'Largeur', el.w, 'm', { min: 0.3 })}${num('H', 'Hauteur', el.H, 'm', { min: 0.5 })}${num('b', 'Profondeur b', el.b, 'm', { min: 0.05 })}${num('alpha', 'Paroi droite α', el.alpha, '°', { pas: 1, min: 30, max: 150, dec: 1 })}</div></fieldset>`;
        h += `<fieldset><legend>Diagramme des pressions</legend>${sel_('diagramme', 'Sur', el.diagramme, [['aucune', 'aucune paroi'], ...PAROIS])}<div class="lb-sorties" data-o="paroi"></div></fieldset>`;
        h += `<div class="lb-sorties">${sortie('niveau', 'Surface libre')}${sortie('pFond', 'Pression au fond')}${el.ferme ? sortie('pCiel', 'Pression du ciel') : ''}${sortie('vol', 'Volume de liquide')}${sortie('masse', 'Masse')}${sortie('compress', 'Compression au fond')}</div>`;
        break;
      }
      case 'conduite':
        h += `<div class="lb-grille2">${num('D', 'Diamètre', el.D * 1000, 'mm', { pas: 5, min: 5, dec: 0 })}${num('zr', 'Cote de passage', L.A.conduites.get(el.id)?.tr.zr, 'm')}</div><button type="button" class="lb-btn" data-k="zrAuto">Tracé automatique</button>`;
        h += `<div class="lb-sorties">${sortie('etat', 'État')}${sortie('contenu', 'Contenu')}${sortie('pA', 'p côté ' + esc(el.a.el))}${sortie('pB', 'p côté ' + esc(el.b.el))}${sortie('debit', 'Débit instantané')}${sortie('pire', 'p abs minimale')}</div>`;
        break;
      case 'vanne':
        h += `<button type="button" class="lb-btn lb-btn-fort" data-k="basculer">${el.ouverte ? 'Fermer la vanne' : 'Ouvrir la vanne'}</button>`;
        h += num('t', 'Position sur la conduite', el.t * 100, '%', { pas: 5, min: 5, max: 95, dec: 0 });
        h += `<div class="lb-sorties">${sortie('dp', 'Δp de part et d’autre')}${sortie('force', 'Effort sur l’obturateur')}</div>`;
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
        h += sel_('charniere', 'Charnière', el.charniere, [['aucune', 'aucune'], ['haut', 'arête haute'], ['bas', 'arête basse']]) + '</div>';
        h += `<div class="lb-sorties">${sortie('S', 'Surface S')}${sortie('hG', 'Profondeur de G')}${sortie('pG', 'Pression en G')}${sortie('F', 'Résultante F')}${sortie('ecart', 'C sous G')}${sortie('hC', 'Profondeur de C')}${sortie('FH', 'F<sub>H</sub> / F<sub>V</sub>')}${sortie('M', 'Moment / effort de manœuvre')}</div>`;
        break;
      }
      case 'flotteur':
        h += `<div class="lb-grille2">${num('l', 'Largeur l (dans le plan)', el.l, 'm', { min: 0.05 })}${num('h', 'Hauteur', el.h, 'm', { min: 0.05 })}${num('b', 'Longueur b', el.b, 'm', { min: 0.05 })}${num('m', 'Masse', el.m, 'kg', { pas: 10, min: 0.01, dec: 1 })}${num('dens', 'Masse vol. moyenne', el.m / (el.l * el.h * el.b), 'kg/m³', { pas: 10, dec: 0 })}${num('zG', 'G au-dessus du fond', el.zG, 'm', { min: 0 })}</div>`;
        h += `<label class="lb-champ lb-large"><span>Gîte θ</span><input type="range" min="-30" max="30" step="1" data-k="gite" value="${el.gite}"><em data-o="giteV">${NB(el.gite, 0)}°</em></label>`;
        h += `<div class="lb-sorties">${sortie('P', 'Poids P')}${sortie('FA', 'Poussée F<sub>A</sub>')}${sortie('T', 'Tirant d’eau')}${sortie('CM', 'CM = I/V')}${sortie('GM', 'GM')}${sortie('etat', 'Équilibre')}${sortie('couple', 'Couple à θ')}</div>`;
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
    h += `<details class="lb-env"><summary>Constantes</summary><div class="lb-grille2">${num('g', 'g', env.g, 'm/s²', { pas: 0.01, dec: 3 })}${num('patm', 'p<sub>atm</sub>', env.patm / 1000, 'kPa', { pas: 0.1, dec: 3 })}${num('rhoPerso', 'ρ liquide perso.', L.scene.perso.rho, 'kg/m³', { pas: 10, dec: 0 })}</div></details>`;
    h += `<p class="lb-note lb-hyp">Hypothèses : fluides au repos, liquides incompressibles et non miscibles, poids des gaz négligé, gaz piégé isotherme, appareils de volume négligeable, conduites amorcées.</p>`;
    return h;
  }
  function majInspecteur() {
    const el = L.sel ? elt(L.sel) : null;
    const cle = el ? `${el.id}|${el.type}|${el.type === 'reservoir' ? `${el.ferme}|${el.ciel.mode}|${L.A.etats.get(el.id).niveaux.map(n => n.fluide).join(',')}` : ''}${el.type === 'vannePlane' ? el.forme + el.paroi : ''}${el.type === 'vanne' ? el.ouverte : ''}|${L.scene.env.unite}` : `global|${L.scene.elements.length}`;
    if (cle !== L.inspCle) {
      if (insp.contains(document.activeElement) && document.activeElement.matches('input[type=number],input[type=text]') && L.inspCle && L.inspCle.split('|')[0] === cle.split('|')[0]) {
        // on garde le champ en cours de saisie
      } else {
        L.inspCle = cle;
        insp.innerHTML = el ? formulaire(el) : formulaireGlobal();
      }
    }
    const o = el ? sorties(el) : { releves: releves() };
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
    const A = L.A, env = L.scene.env;
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
      else if (e.type === 'vanne') { const ec = A.conduites.get(e.conduite), d = ec && ec.deltas.find(k => k.id === e.id); t = e.ouverte ? 'ouverte' : `fermée${d && d.dp != null ? ` · Δp = ${P.pression(d.dp, env.unite)}` : ''}`; }
      if (t) lignes.push(`<button type="button" data-sel="${esc(e.id)}"><b>${esc(e.id)}</b><span>${t}</span></button>`);
    }
    return lignes.join('') || '<p class="lb-note">Aucun élément.</p>';
  }
  function sorties(el) {
    const A = L.A, env = L.scene.env, g = A.ctx.g, o = {};
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
        o.etapes = li([...(m.etapes || []), ...(m.message ? [`<b>${esc(m.message)}</b>`] : []), ...(m.capillaire ? [esc(m.capillaire)] : [])]);
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
        o.etapes = li([...(m.etapes || []), ...(m.message ? [`<b>${esc(m.message)}</b>`] : [])]);
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
        o.M = v.moment != null ? `${NB(v.moment / 1000, 2)} kN·m / ${NB(v.effort / 1000, 2)} kN` : 'sans charnière';
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
        o.GM = f.GM != null ? `${NB(f.GM, 3)} m` : '—';
        o.etat = f.fond ? 'repose au fond' : f.stable == null ? 'flotte' : f.stable ? 'stable' : 'instable';
        o.couple = f.gite ? `${NB(f.gite.couple / 1000, 2)} kN·m (${f.gite.redresse ? 'redresse' : 'fait chavirer'})` : el.gite ? '—' : 'θ = 0';
        o.giteV = `${NB(el.gite, 0)}°`;
        o.etapes = li(f.etapes);
        break;
      }
    }
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
        if (!ok) return;
        if (k === 'D') el.D = clamp(v / 1000, 0.005, 5);
        if (k === 'zr') el.zr = v;
        break;
      case 'vanne':
        if (k === 'basculer') { el.ouverte = !el.ouverte; structure = true; dire(`Vanne ${el.id} ${el.ouverte ? 'ouverte' : 'fermée'}`); break; }
        if (k === 't' && ok) el.t = clamp(v / 100, 0.05, 0.95);
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
        if (k === 'charniere') { el.charniere = valeur; break; }
        if (!ok) return;
        if (k === 'a') { el.a = Math.max(0.05, v); if (el.forme === 'cercle') el.l = el.a; }
        if (k === 'l') el.l = Math.max(0.05, v);
        if (k === 's') el.s = v;
        break;
      }
      case 'flotteur':
        if (!ok) return;
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
    if (!k || t.tagName === 'SELECT') return;
    debutModif();
    appliquer(k, t.value, t.value, false);
  });
  insp.addEventListener('change', e => {
    const t = e.target, k = t.dataset && t.dataset.k;
    if (!k) return;
    debutModif();
    appliquer(k, t.value, t.value, true);
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
    detruire: () => { ro.disconnect(); cancelAnimationFrame(L.raf); racine.innerHTML = ''; }
  };
  racine.labo = api;
  return api;
}
