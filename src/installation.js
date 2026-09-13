import { defaultInstallation, solveInstallation, validateInstallation, installationLosses, pumpHead } from './installation-solver.js';

let project = defaultInstallation();
export const getInstallation = () => structuredClone(project);
export function applyInstallationDiameter(index, diameter) {
  const next = structuredClone(project);
  if (!Number.isInteger(index) || !next.sections[index]) throw Error('Tronçon introuvable.');
  next.sections[index].diameter = diameter;
  validateInstallation(next);
  project = next;
}
const esc = x => String(x).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n = x => Number(x).toLocaleString('fr-FR', {maximumSignificantDigits: 5});
const input = (label, key, value, unit = '', type = 'number') => `<label class="plant-field"><span>${label}</span><div><input data-project="${key}" type="${type}" ${type === 'number' ? 'step="any"' : 'maxlength="120"'} value="${esc(value)}"><span>${unit}</span></div></label>`;
const sectionInput = (i, key, label, value, unit = '') => `<label class="plant-field"><span>${label}</span><div><input data-section="${i}" data-key="${key}" type="${key === 'name' ? 'text' : 'number'}" step="any" value="${esc(value)}"><span>${unit}</span></div></label>`;

function chart(title, series, xLabel, yLabel) {
  const points = series.flatMap(s => s.points);
  const xMax = Math.max(1, ...points.map(p => p[0]));
  const yMin = Math.min(0, ...points.map(p => p[1]));
  const yMax = Math.max(1, ...points.map(p => p[1]));
  const X = x => 65 + x / xMax * 590, Y = y => 250 - (y - yMin) / (yMax - yMin) * 205;
  return `<figure class="plant-chart"><figcaption>${title}</figcaption><svg viewBox="0 0 690 300" role="img" aria-label="${esc(title)}"><rect x="65" y="45" width="590" height="205" fill="#f8fafc"/>${Array.from({length:5},(_,i)=>{const v=yMin+(yMax-yMin)*i/4;return `<path d="M65 ${Y(v)}H655" stroke="#dbe5ed"/><text x="57" y="${Y(v)+5}" text-anchor="end">${n(v)}</text><text x="${X(xMax*i/4)}" y="274" text-anchor="middle">${n(xMax*i/4)}</text>`}).join('')}${series.map(s=>`<polyline points="${s.points.map(p=>`${X(p[0])},${Y(p[1])}`).join(' ')}" fill="none" stroke="${s.color}" stroke-width="3"/>${s.points.length===1?`<circle cx="${X(s.points[0][0])}" cy="${Y(s.points[0][1])}" r="6" fill="${s.color}"/>`:''}`).join('')}<text x="65" y="24">${yLabel}</text><text x="655" y="296" text-anchor="end">${xLabel}</text></svg><div class="plant-legend">${series.map(s=>`<span><i style="background:${s.color}"></i>${s.label}</span>`).join('')}</div></figure>`;
}

export function mountInstallation(root, onBack) {
  root.classList.add('plant-root');
  root.innerHTML = `<section class="plant-app"><header class="plant-head"><div><button class="back" id="plantBack">← Bureau de calcul</button><p class="plant-kicker">INSTALLATION EN SÉRIE · LIQUIDE INCOMPRESSIBLE</p><h1>Installation hydraulique</h1><p>Deux réservoirs ouverts, des tronçons et une pompe facultative.</p></div><div class="plant-tools"><button id="plantSave" class="secondary">Enregistrer</button><label class="ghost plant-import">Ouvrir<input id="plantImport" type="file" accept=".json,application/json"></label><button id="plantPrint" class="ghost">Imprimer la note</button></div></header>
    <p id="plantMessage" role="status"></p><div class="plant-layout"><aside class="plant-settings software-panel"><h2>Conditions de calcul</h2>
    ${input('Nom du projet','name',project.name,'','text')}
    <label class="plant-field"><span>Grandeur recherchée</span><select id="plantMode"><option value="head" ${project.mode==='head'?'selected':''}>Hauteur nécessaire à débit imposé</option><option value="flow" ${project.mode==='flow'?'selected':''}>Débit obtenu (gravité / pompe)</option></select></label>
    ${input('Débit imposé','flow',project.flow,'L/s')}${input('Niveau du réservoir A','zA',project.zA,'m')}${input('Niveau du réservoir B','zB',project.zB,'m')}
    <h3>Propriétés du liquide</h3><p class="plant-help">Valeurs initiales : eau vers 20 °C. Saisir les propriétés à la température étudiée.</p>${input('Masse volumique ρ','rho',project.rho,'kg/m³')}${input('Viscosité cinématique ν','nu',project.nu,'10⁻⁶ m²/s')}
    <h3>Pompe</h3><label class="plant-check"><input id="plantPump" type="checkbox" ${project.pump?'checked':''}> Pompe présente</label><div id="plantPumpFields">${input('Hauteur à débit nul H₀','h0',project.h0,'m')}${input('Coefficient k','k',project.k,'m/(L/s)²')}${input('Rendement pompe η','efficiency',project.efficiency,'0–1')}<p class="plant-help">Hₚ = H₀ − kQ², avec Q en L/s. Courbe simplifiée ; domaine Hₚ ≥ 0.</p></div></aside>
    <div class="plant-work"><section class="software-panel"><div class="plant-section-head"><div><h2>Composition de l’installation</h2><p>Les accessoires utilisent la vitesse de leur tronçon.</p></div><button id="plantAdd" class="primary">+ Tronçon</button></div><div class="plant-chain" aria-label="Sens de circulation">Réservoir A <span>→</span> ${project.pump?'Pompe <span>→</span> ':''}${project.sections.map((s,i)=>`<b>T${i+1}</b><span>→</span>`).join('')} Réservoir B</div><div id="plantSections"></div></section><section id="plantResults" aria-live="polite"></section></div></div></section>`;
  root.querySelector('#plantBack').onclick = () => {root.classList.remove('plant-root'); onBack();};
  root.querySelector('#plantAdd').onclick = () => { if(project.sections.length>=30)return; project.sections.push({name:`Tronçon ${project.sections.length+1}`,length:50,diameter:100,roughness:0.05,accessories:[]}); mountInstallation(root,onBack); };
  root.querySelectorAll('[data-project]').forEach(el => el.addEventListener('input', () => {project[el.dataset.project]=el.type==='number'?el.valueAsNumber:el.value; update(root);}));
  root.querySelector('#plantMode').onchange = e => {project.mode=e.target.value; update(root);};
  root.querySelector('#plantPump').onchange = e => {project.pump=e.target.checked; mountInstallation(root,onBack);};
  renderSections(root,onBack);
  root.querySelector('#plantSave').onclick = () => {
    try {validateInstallation(project); const blob=new Blob([JSON.stringify(project,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url;a.download='mecaflu-installation.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000); root.querySelector('#plantMessage').textContent='Projet exporté en JSON.';} catch(e){root.querySelector('#plantMessage').textContent=e.message;}
  };
  root.querySelector('#plantImport').onchange = async e => {
    const file=e.target.files[0]; if(!file)return;
    try {if(file.size>200000)throw Error('Fichier trop volumineux (200 Ko maximum).');const data=JSON.parse(await file.text());validateInstallation(data);project=data;mountInstallation(root,onBack);root.querySelector('#plantMessage').textContent='Projet chargé.';}catch(error){root.querySelector('#plantMessage').textContent=error.message;}
  };
  root.querySelector('#plantPrint').onclick = () => window.print();
  update(root);
}

function renderSections(root,onBack) {
  root.querySelector('#plantSections').innerHTML=project.sections.map((s,i)=>`<article class="plant-pipe"><header><h3>Tronçon ${i+1}</h3><button class="ghost" data-remove-section="${i}" ${project.sections.length===1?'disabled':''}>Retirer</button></header><div class="plant-pipe-fields">${sectionInput(i,'name','Nom',s.name)}${sectionInput(i,'length','Longueur',s.length,'m')}${sectionInput(i,'diameter','Diamètre intérieur',s.diameter,'mm')}${sectionInput(i,'roughness','Rugosité ε',s.roughness,'mm')}</div><div class="plant-accessories">${s.accessories.map((a,j)=>`<div class="plant-accessory"><label>Accessoire<input aria-label="Accessoire T${i+1} ${j+1}" data-accessory="${i},${j},name" value="${esc(a.name)}"></label><label>Nombre<input aria-label="Nombre T${i+1} ${j+1}" type="number" min="0" step="1" data-accessory="${i},${j},count" value="${a.count}"></label><label>K unitaire<input aria-label="K T${i+1} ${j+1}" type="number" min="0" step="any" data-accessory="${i},${j},k" value="${a.k}"></label><button class="ghost" data-remove-accessory="${i},${j}" aria-label="Retirer accessoire T${i+1} ${j+1}">×</button></div>`).join('')}</div><button class="secondary" data-add-accessory="${i}">+ Accessoire</button></article>`).join('');
  root.querySelectorAll('[data-section]').forEach(el=>el.oninput=()=>{project.sections[Number(el.dataset.section)][el.dataset.key]=el.type==='number'?el.valueAsNumber:el.value;update(root);});
  root.querySelectorAll('[data-accessory]').forEach(el=>el.oninput=()=>{const [i,j,key]=el.dataset.accessory.split(',');project.sections[i].accessories[j][key]=el.type==='number'?el.valueAsNumber:el.value;update(root);});
  root.querySelectorAll('[data-add-accessory]').forEach(el=>el.onclick=()=>{const s=project.sections[Number(el.dataset.addAccessory)];if(s.accessories.length>=50)return;s.accessories.push({name:'Accessoire à renseigner',count:1,k:0});renderSections(root,onBack);update(root);});
  root.querySelectorAll('[data-remove-section]').forEach(el=>el.onclick=()=>{project.sections.splice(Number(el.dataset.removeSection),1);mountInstallation(root,onBack);});
  root.querySelectorAll('[data-remove-accessory]').forEach(el=>el.onclick=()=>{const [i,j]=el.dataset.removeAccessory.split(',');project.sections[i].accessories.splice(Number(j),1);renderSections(root,onBack);update(root);});
}

function update(root) {
  root.querySelector('[data-project="flow"]').disabled=project.mode==='flow';
  root.querySelector('#plantPumpFields').hidden=!project.pump;
  const box=root.querySelector('#plantResults');
  try {
    const r=solveInstallation(project);
    let qMax=Math.max(1,r.flow*1.5); if(project.pump)qMax=Math.max(qMax,Math.sqrt(project.h0/project.k));
    // Cap the chart to the physically meaningful pump domain when present.
    if(project.pump)qMax=Math.sqrt(project.h0/project.k)||1;
    const samples=Array.from({length:61},(_,i)=>qMax*i/60);
    const series=[{label:'Réseau : Δz + pertes',color:'#0369a1',points:samples.map(q=>[q,r.staticHead+installationLosses(project,q).total])}];
    if(project.pump)series.push({label:'Pompe',color:'#d97706',points:samples.map(q=>[q,Math.max(0,pumpHead(project,q))])});
    else series.push({label:'Sans pompe : H = 0',color:'#d97706',points:[[0,0],[qMax,0]]});
    series.push({label:project.mode==='head'?'Débit imposé':'Point calculé',color:'#be123c',points:[[r.flow,r.requiredHead]]});
    let cum=0;const cumulative=[[0,0]];r.losses.rows.forEach((row,i)=>{cum+=row.total;cumulative.push([i+1,cum]);});
    box.innerHTML=`<div class="plant-metrics">${[['Débit',r.flow,'L/s'],['Hauteur supplémentaire requise',r.requiredHead,'m'],['Pertes totales',r.losses.total,'m'],[project.pump?'Puissance à l’arbre estimée':'Puissance hydraulique supplémentaire',project.pump?r.shaftPower:r.hydraulicPower,'kW']].map(([label,value,unit])=>`<article><span>${label}</span><strong>${n(value)} <small>${unit}</small></strong></article>`).join('')}</div>
    ${r.warnings.length?`<div class="plant-warnings"><h3>Points à vérifier</h3><ul>${r.warnings.map(w=>`<li>${esc(w)}</li>`).join('')}</ul></div>`:''}
    <section class="software-panel"><h2>Pertes par tronçon</h2><div class="plant-table-wrap"><table><thead><tr><th>Tronçon</th><th>V (m/s)</th><th>Re</th><th>λ Darcy</th><th>Linéaires (m)</th><th>Singulières (m)</th><th>Total (m)</th></tr></thead><tbody>${r.losses.rows.map((row,i)=>`<tr><th>T${i+1} · ${esc(row.name)}</th>${[row.V,row.Re,row.lambda,row.regular,row.singular,row.total].map(v=>`<td>${n(v)}</td>`).join('')}</tr>`).join('')}</tbody><tfoot><tr><th colspan="4">Total</th><td>${n(r.losses.regular)}</td><td>${n(r.losses.singular)}</td><td>${n(r.losses.total)}</td></tr></tfoot></table></div></section>
    <div class="plant-charts">${chart('Courbe de réseau et charge disponible',series,'Débit (L/s)','Hauteur (m)')}${chart('Pertes cumulées de A vers B',[{label:'Linéaires + singulières',color:'#0f766e',points:cumulative}],'Numéro de tronçon','Pertes (m)')}</div>
    <details class="software-panel plant-note" open><summary>Note de calcul et hypothèses</summary><p>Régime permanent, liquide newtonien incompressible, conduites circulaires pleines en série. Réservoirs ouverts à la même pression atmosphérique ; vitesses aux surfaces négligeables. Le débit est identique dans tous les tronçons.</p><p>Q = ${n(r.flow)} L/s = ${n(r.flow/1000)} m³/s ; ν = ${n(project.nu)} × 10⁻⁶ m²/s ; ρ = ${n(project.rho)} kg/m³.</p><p>V = 4Q/(πD²) ; Re = VD/ν ; λ = 64/Re pour Re &lt; 2 000, sinon Colebrook–White (transition 2 000–4 000 indicative).</p><p>h = λ(L/D)V²/(2g) + Σ(nK)V²/(2g).</p><p>H requis = (zB − zA) + Σh = ${n(r.staticHead)} + ${n(r.losses.total)} = ${n(r.requiredHead)} m.</p><p>P hydraulique = ρgQ max(H,0) = ${n(r.hydraulicPower)} kW${project.pump?` ; P arbre = P hydraulique/η = ${n(r.shaftPower)} kW.`:'.'}</p>${r.residual!==null?`<p>Résidu du bilan pompe / gravité − réseau : ${n(r.residual)} m. ${r.converged?'Tolérance de 10⁻⁵ m respectée.':'Tolérance non respectée.'}</p>`:''}<p>Les K initiaux sont des exemples modifiables, à confirmer avec la géométrie et les données du fabricant. Ajouter explicitement les changements de section, entrées et sorties ; ils ne sont pas déduits automatiquement.</p><p>Le tracé cumulatif représente des pertes, pas une ligne piézométrique. Les cotes de la conduite, la position de la pompe et la pression de vapeur ne sont pas définies ici : le NPSH et la cavitation doivent être vérifiés dans le module dédié. Les coups de bélier et les réseaux maillés sont hors de ce modèle.</p></details>`;
  } catch(error) {
    box.innerHTML=`<div class="calc-error" role="alert"><strong>Calcul suspendu</strong><p>${esc(error.message)}</p></div>`;
  }
}
