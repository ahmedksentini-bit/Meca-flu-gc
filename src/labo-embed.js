// Figures dynamiques du cours : chaque bloc .labo-widget[data-labo] devient un
// laboratoire intégré, monté à l'approche de l'écran pour ne pas alourdir la
// page (cours.html compte une douzaine de figures).
import { monterLabo } from './labo.js';

const blocs = [...document.querySelectorAll('.labo-widget[data-labo]')];
const monter = n => {
  if (n.dataset.monte) return;
  n.dataset.monte = '1';
  try { monterLabo(n, { mode: 'integre', scenario: n.dataset.labo }); }
  catch (e) { n.dataset.monte = ''; console.error('Laboratoire', n.dataset.labo, e); }
};
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(entrees => {
    for (const e of entrees) if (e.isIntersecting) { io.unobserve(e.target); monter(e.target); }
  }, { rootMargin: '600px 0px' });
  blocs.forEach(n => io.observe(n));
} else blocs.forEach(monter);
