import {defaultMesh,validateMesh,solveMesh,mapScale,planLength} from './mesh-solver.js';
import {materials,fittings,source,insideDiameter,parsePumpCSV,validatePipeCatalog} from './technical-library.js';
import {loadProject,saveProject,listProjects} from './project-store.js';
import {downloadReport} from './pdf-report.js';
import {putImage,getImage,deleteImage} from './basemap-store.js';
import {tilesFor,tileUrl,parseLatLon,pan,zoomAt,viewToLatLon,latLonToView,metresPerPixel,defaultTiles} from './geo.js';
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=x=>Number(x).toLocaleString('fr-FR',{maximumSignificantDigits:5});
let project=loadProject('studio:autosave',defaultMesh,validateMesh),selected={type:'node',id:project.nodes[0].id},mode='select',connectFrom=null,history=[];
let catalog=loadProject('catalog',()=>null,validatePipeCatalog);
let basemapUrl=null,calibration=[],pendingType=null;
const note='Régime permanent, liquide incompressible, conduites pleines. Solveur nodal Newton amorti interne ; continuité < 10^-6 L/s et énergie < 10^-5 m. Darcy-Colebrook, interpolation linéaire de lambda entre Re 2000 et 4000 (indicative, différente d’EPANET). PDA : demande proportionnelle à la racine de la pression normalisée entre pmin et pfull. Réservoirs à charge constante ; pompes unidirectionnelles ; vannes représentées par K et fermeture, sans régulateur automatique. Pas de transitoires, qualité d’eau ou niveau variable des réservoirs. Dessin topologique : la longueur hydraulique est saisie séparément. Profils entre cotes nodales linéaires ; ajouter explicitement chaque point haut. Les K sont agrégés par liaison, leur position réelle n’est pas résolue. Fond cartographique : les tuiles proviennent du fournisseur indiqué et leur mention de source doit rester affichée ; la position des nœuds est celle que vous pointez sur l’image, sa précision est celle de l’orthorectification du fournisseur. Fond de plan : l’échelle est isotrope et la longueur lue est HORIZONTALE — elle ignore la pente, les coudes et le profil de tranchée, donc sous-estime la conduite réelle ; elle est proposée, jamais imposée. Une image satellite ne porte aucune altimétrie : les cotes z restent à saisir. Validation indépendante requise avant dimensionnement réel.';
const field=(key,label,value,unit='',type='number')=>`<label class="plant-field"><span>${label}</span><div><input data-property="${key}" type="${type}" step="any" value="${esc(value)}"><span>${unit}</span></div></label>`;
const table=(headers,rows)=>`<div class="plant-table-wrap"><table><thead><tr>${headers.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(x=>`<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
export function mountStudio(root,navigate){
  root.classList.add('plant-root');window.scrollTo(0,0);
  let result=null,drag=null;
  root.innerHTML=`<section class="plant-app studio"><header class="plant-head"><div><button class="back" id="studioBack">← Bureau de calcul</button><p class="plant-kicker">RÉSEAUX MAILLÉS · ÉDITEUR GRAPHIQUE</p><h1>Atelier hydraulique</h1><p>Réservoirs, conduites, pompes et vannes · calcul des débits et pressions</p></div><div class="plant-tools"><button id="studioPDF">Rapport PDF</button><button id="studioExport">Exporter JSON</button><label class="plant-import ghost">Importer JSON<input id="studioImport" type="file" accept=".json"></label></div></header>
  <section class="software-panel studio-project"><label>Projet <input id="studioName" maxlength="120" value="${esc(project.name)}"></label><button id="studioSave">Enregistrer une copie nommée</button><label>Projets locaux <select id="studioSaved"></select></label><button id="studioLoad">Ouvrir</button><button id="studioExample">Exemple de boucle</button><span id="studioStatus" role="status"></span></section>
  <div class="studio-layout"><section class="software-panel"><div class="studio-toolbar"><button data-mode="select">Sélection / déplacer</button><button data-mode="connect">Relier 2 nœuds</button><button id="studioNode">+ Jonction</button><button id="studioReservoir">+ Réservoir</button><button id="studioUndo">Annuler</button><button id="studioDelete">Retirer la sélection</button></div><p id="studioHint">Cliquer un élément pour le modifier. Avec une carte : glisser le fond pour se déplacer, molette pour zoomer, « + Jonction » puis clic pour poser un nœud.</p><svg id="studioGraph" viewBox="0 0 800 440" role="group" aria-label="Éditeur du réseau"></svg><p class="plant-help" id="studioAttrib"></p><p class="plant-help">Les flèches indiquent le sens de référence ; un débit négatif indique le sens inverse. Sans fond de plan, le dessin n’est pas à l’échelle.</p>
  <section class="studio-basemap"><h3>Fond de plan</h3>
  <h4>Vue satellite</h4><p class="plant-help">Ouvrir la carte, zoomer à la molette, glisser le fond pour se déplacer, puis poser les nœuds au clic. Les longueurs se calculent d’elles-mêmes.</p>
  <label>Coordonnées du site<input id="geoCoords" placeholder="34.7406, 10.7603 — ou une adresse Google Maps collée"></label>
  <div class="studio-basemap-actions"><button id="geoOpen">Ouvrir la carte</button><button id="geoPlace">Aller aux coordonnées</button><button id="geoOut">Zoom −</button><button id="geoIn">Zoom +</button><button id="geoCentre">Recentrer sur le réseau</button><button id="geoClear">Retirer la carte</button></div>
  <label class="plant-check"><input id="geoAuto" type="checkbox"> Reprendre automatiquement les longueurs depuis la carte</label>
  <details><summary>Autre fournisseur de tuiles</summary><label>Adresse XYZ<input id="geoUrl" maxlength="500" placeholder="https://…/{z}/{x}/{y}.png"></label><label>Mention de source<input id="geoAttrib" maxlength="300"></label><button id="geoProvider">Appliquer ce fournisseur</button><p class="plant-help">Vérifier les conditions d’utilisation du service retenu ; la mention de source est obligatoire.</p></details>
  <p id="geoStatus" class="plant-help"></p>
  <h4>Ou une image calibrée</h4><p class="plant-help">Importer votre extrait de vue aérienne, placer deux points dont vous connaissez la distance réelle, puis reprendre les longueurs mesurées.</p>
  <label class="plant-import">Importer une image<input id="basemapFile" type="file" accept="image/*"></label>
  <label>Origine de l’image<input id="basemapLabel" maxlength="120" placeholder="ex. orthophoto 2024, extrait Google Earth"></label>
  <button data-mode="calibrate" id="basemapCalibrate">Placer les 2 points de calage</button>
  <label>Distance réelle entre A et B<input id="basemapDistance" type="number" step="any" min="0.001" placeholder="m"></label>
  <div class="studio-basemap-actions"><button id="basemapApplyScale">Valider l’échelle</button><button id="basemapApplyAll">Reprendre toutes les longueurs</button><button id="basemapClear">Retirer le fond</button></div>
  <p id="basemapStatus" class="plant-help"></p></section>
  <div class="studio-conditions"><label>Demandes <select id="studioMode"><option value="PDA">Dépendantes de la pression (PDA)</option><option value="DDA">Imposées (DDA)</option></select></label>${[['rho','ρ (kg/m³)'],['nu','ν (10⁻⁶ m²/s)'],['pmin','Pression de début de service (m)'],['pfull','Pression de pleine desserte (m)']].map(([key,label])=>`<label>${label}<input data-condition="${key}" type="number" step="any" value="${project[key]}"></label>`).join('')}</div></section><aside class="software-panel studio-inspector"><h2>Propriétés de la sélection</h2><div id="studioInspector"></div></aside></div>
  <section id="studioResults" aria-live="polite"></section><section class="software-panel"><h2>Profil de pression par liaison</h2><label>Liaison à examiner <select id="studioProfileSelect"></select></label><div id="studioProfile"></div></section><details class="software-panel" open><summary>Hypothèses et limites</summary><p>${note}</p><p>Bibliothèque indicative : <a href="${source}" target="_blank" rel="noopener">EPA, manuel EPANET 2.2, tableaux 3.2 et 3.3</a>. Les courbes fabricant sont importées par l’utilisateur avec leur source ; aucune courbe commerciale n’est inventée.</p></details></section>`;
  const status=text=>root.querySelector('#studioStatus').textContent=text;
  const remember=()=>{history.push(structuredClone(project));if(history.length>30)history.shift();};
  function persist(){try{validateMesh(project);status(saveProject('studio:autosave',project)?'Sauvegarde automatique locale effectuée.':'Stockage indisponible : exporter le JSON.');}catch{status('Brouillon invalide : dernière sauvegarde valide conservée.');}}
  function savedList(){root.querySelector('#studioSaved').innerHTML=listProjects().map(x=>`<option value="${esc(x.key)}">${esc(x.name)} — ${esc(x.date.slice(0,16))}</option>`).join('');}
  root.querySelector('#studioBack').onclick=()=>navigate('LOSSES_COLEBROOK_01');
  root.querySelector('#studioName').oninput=e=>{remember();project.name=e.target.value;persist();};
  root.querySelector('#studioMode').value=project.mode;
  root.querySelector('#studioMode').onchange=e=>{remember();project.mode=e.target.value;update();};
  root.querySelectorAll('[data-condition]').forEach(el=>el.oninput=()=>{remember();project[el.dataset.condition]=el.valueAsNumber;update();});
  root.querySelector('#studioSave').onclick=()=>{try{validateMesh(project);const key='studio:saved:'+Date.now();status(saveProject(key,project)?'Copie nommée enregistrée sur cet appareil.':'Échec de sauvegarde : exporter le JSON.');savedList();}catch(e){status(e.message);}};
  root.querySelector('#studioLoad').onclick=()=>{const key=root.querySelector('#studioSaved').value;if(!key)return;remember();project=loadProject(key,()=>project,validateMesh);selected={type:'node',id:project.nodes[0].id};mountStudio(root,navigate);};
  root.querySelector('#studioExample').onclick=()=>{remember();project=defaultMesh();selected={type:'node',id:'R'};mountStudio(root,navigate);};
  root.querySelector('#studioUndo').onclick=()=>{if(history.length){project=history.pop();selected={type:'node',id:project.nodes[0].id};mountStudio(root,navigate);}};
  root.querySelector('#studioExport').onclick=()=>{try{validateMesh(project);const url=URL.createObjectURL(new Blob([JSON.stringify(project,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='mecaflu-reseau-maille.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status('Projet exporté.');}catch(e){status(e.message);}};
  root.querySelector('#studioImport').onchange=async e=>{try{const f=e.target.files[0];if(!f)return;if(f.size>500000)throw Error('Maximum 500 Ko.');const data=JSON.parse(await f.text());validateMesh(data);remember();project=data;selected={type:'node',id:project.nodes[0].id};mountStudio(root,navigate);}catch(error){status(error.message);}};
  root.querySelector('#studioPDF').onclick=()=>{try{const r=solveMesh(project);downloadReport(project.name,project,r,[note,'Unites : q, flow et demandes en L/s ; H, pressure, gain, loss en m de liquide ; diametre/rugosite en mm ; nu en 10^-6 m2/s.','Sources : '+source]);status('Rapport PDF généré.');}catch(e){status('Rapport suspendu : '+e.message);}};
  root.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;connectFrom=null;if(mode==='calibrate')calibration=[];root.querySelector('#studioHint').textContent=mode==='connect'?'Cliquer le nœud de départ puis le nœud d’arrivée.':mode==='calibrate'?'Cliquer deux points du plan dont vous connaissez la distance réelle.':'Cliquer pour sélectionner ; glisser le fond déplace la carte, la molette zoome.';graph();});
  function unique(prefix,items){let i=1;while(items.some(x=>x.id===prefix+i))i++;return prefix+i;}
  function addNode(type,at){
    if(project.nodes.length>=30){status('Maximum 30 nœuds.');return;}
    remember();const id=unique(type==='reservoir'?'R':'N',project.nodes);
    const pos=at||{x:100+(project.nodes.length%5)*120,y:60+Math.floor(project.nodes.length/5)*55};
    const node={id,type,head:50,z:0,demand:type==='reservoir'?0:1,x:pos.x,y:pos.y};
    ancrer(node);project.nodes.push(node);
    selected={type:'node',id};update();inspector();
  }
  // Sur fond cartographique, le noeud se pose la ou l on clique plutot qu a une place calculee.
  const demanderNoeud=type=>{
    if(!project.geo){addNode(type);return;}
    pendingType=type;mode='placer';
    root.querySelector('#studioHint').textContent='Cliquer sur la carte à l’endroit exact du nœud.';
    status(`Cliquer sur la carte pour poser ${type==='reservoir'?'le réservoir':'la jonction'}.`);
  };
  root.querySelector('#studioNode').onclick=()=>demanderNoeud('junction');root.querySelector('#studioReservoir').onclick=()=>demanderNoeud('reservoir');
  root.querySelector('#studioDelete').onclick=()=>{if(!selected)return;remember();if(selected.type==='edge')project.edges=project.edges.filter(e=>e.id!==selected.id);else {if(project.nodes.length<=2){history.pop();status('Conserver au moins 2 nœuds.');return;}project.nodes=project.nodes.filter(n=>n.id!==selected.id);project.edges=project.edges.filter(e=>e.from!==selected.id&&e.to!==selected.id);}selected={type:'node',id:project.nodes[0].id};update();inspector();};
  function chooseNode(id){
    if(mode==='connect'){if(!connectFrom){connectFrom=id;status(`Départ ${id} choisi : sélectionner l’arrivée.`);return;}if(connectFrom===id){status('Choisir un autre nœud.');return;}if(project.edges.length>=60){status('Maximum 60 liaisons.');return;}remember();const edge={...defaultMesh().edges[0],id:unique('L',project.edges),from:connectFrom,to:id};project.edges.push(edge);selected={type:'edge',id:edge.id};connectFrom=null;mode='select';root.querySelector('#studioHint').textContent='Liaison créée. Modifier sa longueur, son diamètre et son type.';update();inspector();return;}
    selected={type:'node',id};graph();inspector();
  }
  const svg=root.querySelector('#studioGraph');
  const svgPoint=e=>{const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const loc=pt.matrixTransform(svg.getScreenCTM().inverse());return {x:Math.max(0,Math.min(800,Math.round(loc.x))),y:Math.max(0,Math.min(440,Math.round(loc.y)))};};
  svg.addEventListener('click',e=>{
    if(mode==='placer'&&pendingType){const pt=svgPoint(e),type=pendingType;pendingType=null;mode='select';root.querySelector('#studioHint').textContent='Cliquer pour sélectionner ; glisser le fond déplace la carte.';addNode(type,pt);return;}
    if(mode==='calibrate'){const pt=svgPoint(e);if(calibration.length>=2)calibration=[];calibration.push(pt);status(calibration.length<2?'Point A placé : cliquer le point B.':'Points A et B placés : saisir leur distance réelle puis valider l’échelle.');graph();return;}
    const node=e.target.closest('[data-graph-node]'),edge=e.target.closest('[data-graph-edge]');if(node)chooseNode(node.dataset.graphNode);else if(edge){selected={type:'edge',id:edge.dataset.graphEdge};graph();inspector();}});
  svg.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.target.dispatchEvent(new MouseEvent('click',{bubbles:true}));}});
  let mapDrag=null;
  svg.addEventListener('pointerdown',e=>{
    if(mode!=='select')return;
    const el=e.target.closest('[data-graph-node]');
    if(el){remember();drag=project.nodes.find(n=>n.id===el.dataset.graphNode);svg.setPointerCapture(e.pointerId);return;}
    if(project.geo){remember();mapDrag=svgPoint(e);svg.setPointerCapture(e.pointerId);}});
  // La molette zoome sur le point vise ; la rafale est regroupee en une seule etape annulable.
  let wheelTimer=null,wheelAvant=null;
  svg.addEventListener('wheel',e=>{
    if(!project.geo||mode!=='select')return;
    e.preventDefault();
    const zoom=Math.max(1,Math.min(21,project.geo.zoom+(e.deltaY<0?1:-1)));
    if(zoom===project.geo.zoom)return;
    if(!wheelTimer)wheelAvant=structuredClone(project);
    const pt=svgPoint(e);
    try{applyGeo(zoomAt(project.geo,zoom,pt.x,pt.y));geoStatus();}catch(err){status(err.message);return;}
    clearTimeout(wheelTimer);
    wheelTimer=setTimeout(()=>{wheelTimer=null;history.push(wheelAvant);if(history.length>30)history.shift();update();inspector();},250);
  },{passive:false});
  svg.addEventListener('pointermove',e=>{
    if(mapDrag){const pt=svgPoint(e);try{applyGeo(pan(project.geo,mapDrag.x-pt.x,mapDrag.y-pt.y));mapDrag=pt;}catch{mapDrag=null;}return;}
    if(!drag)return;const point=svg.createSVGPoint();point.x=e.clientX;point.y=e.clientY;const loc=point.matrixTransform(svg.getScreenCTM().inverse());drag.x=Math.max(20,Math.min(780,Math.round(loc.x)));drag.y=Math.max(20,Math.min(420,Math.round(loc.y)));graph();});
  svg.addEventListener('pointerup',()=>{if(mapDrag){mapDrag=null;geoStatus();update();inspector();return;}if(drag){ancrer(drag);selected={type:'node',id:drag.id};drag=null;update();inspector();}});
  svg.addEventListener('pointercancel',()=>{mapDrag=null;drag=null;persist();});
  function calibrationMarks(){
    const pts=calibration.length?calibration:project.basemap?[project.basemap.a,project.basemap.b]:[];
    if(!pts.length)return '';
    const line=pts.length===2?`<path d="M${pts[0].x} ${pts[0].y}L${pts[1].x} ${pts[1].y}" stroke="#dc2626" stroke-width="2" stroke-dasharray="6 4"/>`:'';
    return line+pts.map((pt,i)=>`<g class="studio-calib"><circle cx="${pt.x}" cy="${pt.y}" r="7" fill="none" stroke="#dc2626" stroke-width="3"/><text x="${pt.x+11}" y="${pt.y+5}" fill="#dc2626">${i?'B':'A'}</text></g>`).join('');
  }
  function graph(){
    const byId=new Map(project.nodes.map(n=>[n.id,n]));
    svg.innerHTML=`<defs><marker id="flowArrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0 0L7 3L0 6" fill="#0369a1"/></marker></defs><rect width="800" height="440" fill="#f0f7fb"/>${project.geo?tilesFor(project.geo).map(t=>`<image href="${esc(tileUrl(project.geo.url,t))}" x="${t.px}" y="${t.py}" width="${t.size}" height="${t.size}"/>`).join(''):''}${basemapUrl?`<image href="${basemapUrl}" x="0" y="0" width="800" height="440" preserveAspectRatio="xMidYMid meet"/>`:''}${calibrationMarks()}`+project.edges.map((e,i)=>{const a=byId.get(e.from),b=byId.get(e.to);if(!a||!b)return '';const r=result?.edges.find(x=>x.id===e.id),active=selected?.type==='edge'&&selected.id===e.id;const parallel=project.edges.slice(0,i).filter(x=>(x.from===e.from&&x.to===e.to)||(x.from===e.to&&x.to===e.from)).length,offset=parallel*35,mx=(a.x+b.x)/2+offset,my=(a.y+b.y)/2-offset;return `<g data-graph-edge="${esc(e.id)}" tabindex="0" role="button" aria-label="Liaison ${esc(e.id)}"><path d="M${a.x} ${a.y} Q${mx} ${my} ${b.x} ${b.y}" fill="none" stroke="${active?'#d97706':e.closed?'#94a3b8':'#0369a1'}" stroke-width="${active?6:4}" ${e.closed?'stroke-dasharray="7 5"':''} marker-end="url(#flowArrow)"/><text x="${mx}" y="${my-8}" text-anchor="middle">${esc(e.id)} · ${e.type==='pump'?'Pompe':e.type==='valve'?'Vanne':'Conduite'}${r?' · '+n(r.q)+' L/s':''}</text></g>`;}).join('')+project.nodes.map(node=>{const r=result?.nodes.find(x=>x.id===node.id),active=selected?.type==='node'&&selected.id===node.id,color=r&&node.type!=='reservoir'&&r.pressure<project.pfull?'#b45309':'#075985';return `<g data-graph-node="${esc(node.id)}" tabindex="0" role="button" aria-label="Nœud ${esc(node.id)}" style="cursor:move"><circle cx="${node.x}" cy="${node.y}" r="${node.type==='reservoir'?22:16}" fill="${color}" stroke="${active?'#f59e0b':'white'}" stroke-width="4"/><text x="${node.x}" y="${node.y+5}" fill="white" text-anchor="middle">${esc(node.id)}</text><text x="${node.x}" y="${Math.min(432,node.y+38)}" text-anchor="middle">${node.type==='reservoir'?'H='+n(node.head)+' m':r?'p/ρg='+n(r.pressure)+' m':''}</text></g>`;}).join('');
  }
  function inspector(){
    const box=root.querySelector('#studioInspector'),isNode=selected?.type==='node',item=(isNode?project.nodes:project.edges).find(x=>x.id===selected?.id);if(!item){box.innerHTML='Sélectionner un élément.';return;}
    const mesure=isNode?null:planLength(project,item);
    box.innerHTML=`<h3>${isNode?'Nœud':'Liaison'} ${esc(item.id)}</h3>`+(isNode?`<p>${item.type==='reservoir'?'Réservoir à charge constante':'Jonction de distribution'}</p>${field('z','Cote du nœud',item.z,'m')}${item.type==='reservoir'?field('head','Charge imposée H',item.head,'m'):field('demand','Demande nominale',item.demand,'L/s')}${field('x','Position graphique X',item.x)}${field('y','Position graphique Y',item.y)}`:`<p>${esc(item.from)} → ${esc(item.to)}</p><label class="plant-field">Type<select id="edgeType">${[['pipe','Conduite'],['pump','Pompe'],['valve','Vanne (K)']].map(([k,t])=>`<option value="${k}" ${item.type===k?'selected':''}>${t}</option>`).join('')}</select></label><label><input id="edgeClosed" type="checkbox" ${item.closed?'checked':''}> Liaison fermée</label>${project.geo&&project.geo.autoLength?`<label class="plant-field"><span>Longueur hydraulique</span><div><input value="${n(item.length)}" readonly><span>m</span></div></label><p class="plant-help">Reprise automatique depuis la carte ; décocher l’option pour saisir à la main.</p>`:field('length','Longueur hydraulique',item.length,'m')}${field('diameter','Diamètre intérieur',item.diameter,'mm')}${field('roughness','Rugosité',item.roughness,'mm')}${field('sumK','Somme K',item.sumK)}${mesure!==null?`<p class="plant-help">Longueur horizontale mesurée sur le plan : <b>${n(mesure)} m</b> — hors pente, coudes et profil de tranchée. <button id="applyMeasured">Reprendre cette longueur</button></p>`:''}${item.type==='pump'?`${field('h0','H0 (courbe simplifiée)',item.h0,'m')}${field('k','k (Q en L/s)',item.k,'m/(L/s)²')}<p>Pompe : ${item.curve?esc(item.curve.name)+' — '+esc(item.curve.source):'Exemple paramétrique H = H0 − kQ², non fabricant'}. La conduite et les K ci-dessus restent en série avec la pompe.</p><button id="clearCurve">Utiliser H0 − kQ²</button><details><summary>Importer une courbe fabricant</summary><label>Nom et conditions (vitesse, roue)<input id="curveName" maxlength="120"></label><label>Source / référence fabricant<input id="curveSource" maxlength="500"></label><label>CSV Q;H (L/s ; m)<textarea id="curveCSV" rows="5" placeholder="Q;H"></textarea></label><button id="applyCurve">Valider la courbe</button></details>`:''}<details open><summary>Bibliothèque technique</summary><label>Matériau neuf (EPA)<select id="materialSelect">${materials.map((m,i)=>`<option value="${i}">${esc(m.name)} · ε ${n(m.roughness)} mm</option>`).join('')}</select></label><button id="applyMaterial">Appliquer la rugosité</button><label>Accessoire (EPA)<select id="fittingSelect">${fittings.map((f,i)=>`<option value="${i}">${esc(f.name)} · K ${n(f.k)}</option>`).join('')}</select></label><button id="applyFitting">Ajouter son K</button><p class="plant-help">Valeurs indicatives pour matériel neuf ; confirmer géométrie, état et fabricant.</p><label>D extérieur (mm)<input id="outsideD" type="number" value="110"></label><label>Épaisseur réelle (mm)<input id="wallThickness" type="number" value="6.6" step="any"></label><button id="applyThickness">Calculer D intérieur = Dext − 2e</button><label class="plant-import">Importer catalogue JSON<input id="catalogImport" type="file" accept=".json"></label>${catalog?`<p>${esc(catalog.name)} · ${esc(catalog.source)}</p><label>Série / section<select id="catalogPipe">${catalog.pipes.map((s,i)=>`<option value="${i}">${esc(s.series)} · ${n(insideDiameter(s.outside,s.thickness))} mm intérieur</option>`).join('')}</select></label><button id="applyCatalog">Appliquer la section</button>`:''}<p class="plant-help">Format : {name, source, pipes:[{series, outside, thickness, roughness}]} ; dimensions en mm. Importer les valeurs réelles du fabricant, pas un DN assimilé au diamètre intérieur.</p></details>`);
    box.querySelectorAll('[data-property]').forEach(el=>el.oninput=()=>{remember();item[el.dataset.property]=el.type==='number'?el.valueAsNumber:el.value;if(isNode&&(el.dataset.property==='x'||el.dataset.property==='y'))ancrer(item);update();});
    box.querySelector('#edgeType')?.addEventListener('change',e=>{remember();item.type=e.target.value;inspector();update();});box.querySelector('#edgeClosed')?.addEventListener('change',e=>{remember();item.closed=e.target.checked;update();});
    const action=(id,fn)=>box.querySelector(id)?.addEventListener('click',()=>{try{remember();fn();update();inspector();}catch(e){status(e.message);}});
    action('#applyMaterial',()=>item.roughness=materials[Number(box.querySelector('#materialSelect').value)].roughness);
    action('#applyFitting',()=>item.sumK+=fittings[Number(box.querySelector('#fittingSelect').value)].k);
    action('#applyThickness',()=>item.diameter=insideDiameter(box.querySelector('#outsideD').valueAsNumber,box.querySelector('#wallThickness').valueAsNumber));
    action('#applyCurve',()=>item.curve=parsePumpCSV(box.querySelector('#curveCSV').value,box.querySelector('#curveName').value,box.querySelector('#curveSource').value));
    action('#clearCurve',()=>item.curve=null);
    action('#applyMeasured',()=>{const L=planLength(project,item);if(!(L>=.01&&L<=100000))throw Error('Longueur mesurée hors domaine : vérifier le calage.');item.length=Number(L.toFixed(3));});
    action('#applyCatalog',()=>{const s=catalog.pipes[Number(box.querySelector('#catalogPipe').value)];item.diameter=insideDiameter(s.outside,s.thickness);item.roughness=s.roughness;item.catalogReference=`${catalog.name} / ${s.series} / ${catalog.source}`;});
    box.querySelector('#catalogImport')?.addEventListener('change',async e=>{try{const f=e.target.files[0];if(!f)return;if(f.size>200000)throw Error('Maximum 200 Ko.');catalog=validatePipeCatalog(JSON.parse(await f.text()));const saved=saveProject('catalog',catalog);inspector();status(saved?'Catalogue chargé et conservé localement.':'Catalogue chargé pour la session ; stockage indisponible.');}catch(error){status(error.message);}});
  }
  function profile(){
    const box=root.querySelector('#studioProfile'),id=root.querySelector('#studioProfileSelect').value,e=result?.edges.find(x=>x.id===id);if(!e){box.innerHTML='<p>Profil indisponible : résoudre un réseau valide.</p>';return;}if(e.closed){box.innerHTML='<p>Liaison fermée : pas de ligne d’énergie continue entre les extrémités.</p>';return;}
    const a=project.nodes.find(x=>x.id===e.from),b=project.nodes.find(x=>x.id===e.to),velocityHead=e.v*e.v/(2*9.81),points=e.type==='pump'?[[0,e.fromHead],[0,e.fromHead+e.gain],[e.length,e.toHead]]:[[0,e.fromHead],[e.length,e.toHead]],min=Math.min(a.z,b.z,...points.map(x=>x[1]))-3,max=Math.max(a.z,b.z,...points.map(x=>x[1]+velocityHead))+3,X=x=>65+x/e.length*650,Y=y=>260-(y-min)/(max-min)*210;
    box.innerHTML=`<svg viewBox="0 0 800 310" role="img" aria-label="Profil piézométrique ${esc(e.id)}">${[0,1,2,3,4].map(i=>{const h=min+(max-min)*i/4;return `<path d="M65 ${Y(h)}H715" stroke="#cbd5e1"/><text x="60" y="${Y(h)+4}" text-anchor="end">${n(h)}</text>`;}).join('')}<path d="M65 ${Y(a.z)}L715 ${Y(b.z)}" stroke="#92400e" stroke-width="3"/><polyline points="${points.map(([x,h])=>`${X(x)},${Y(h)}`).join(' ')}" fill="none" stroke="#0284c7" stroke-width="3"/><polyline points="${points.map(([x,h])=>`${X(x)},${Y(h+velocityHead)}`).join(' ')}" fill="none" stroke="#7c3aed" stroke-width="2" stroke-dasharray="6 4"/><text x="65" y="25">Charge / cote (m)</text><text x="65" y="290">${esc(a.id)} · 0 m</text><text x="715" y="290" text-anchor="end">${esc(b.id)} · ${n(e.length)} m</text></svg><p>Bleu : ligne piézométrique H ; violet : énergie H + V²/(2g) ; brun : cote de conduite interpolée. ${e.type==='pump'?'Le saut de pompe est placé au début de cette liaison.':''}</p><p>Pression relative aux extrémités : ${n(e.fromHead-a.z)} / ${n(e.toHead-b.z)} m de liquide. ${Math.min(e.fromHead-a.z,e.toHead-b.z)<0?'Dépression détectée.':''} Ajouter un nœud à tout point haut intermédiaire pour le vérifier.</p>`;
  }
  root.querySelector('#studioProfileSelect').onchange=profile;
  function update(){
    const box=root.querySelector('#studioResults');result=null;
    if(project.geo&&project.geo.autoLength)project.edges.forEach(e=>{const L=planLength(project,e);if(L>=.01&&L<=100000)e.length=Number(L.toFixed(3));});
    try{result=solveMesh(project);box.innerHTML=`<div class="plant-metrics"><article><span>Demande nominale</span><strong>${n(result.totalDemand)} L/s</strong></article><article><span>Débit distribué</span><strong>${n(result.totalDelivered)} L/s</strong></article><article><span>Résidu nodal maximum</span><strong>${n(result.massResidual)} L/s</strong></article><article><span>Résidu énergétique</span><strong>${n(result.energyResidual)} m</strong></article></div><p class="eng-verdict eng-pass">Convergence numérique en ${result.iterations} itérations. Ce contrôle ne garantit pas l’adéquation physique du projet.</p>${result.warnings.length?`<div class="plant-warnings">${result.warnings.map(w=>`<p>${esc(w)}</p>`).join('')}</div>`:''}<section class="software-panel"><h2>Pressions et desserte</h2>${table(['Nœud','H (m)','Cote (m)','p/ρg (m)','Demande (L/s)','Distribué (L/s)'],result.nodes.map(x=>[esc(x.id),n(x.H),n(x.z),n(x.pressure),n(x.demand),n(x.delivered)]))}<h2>Débits des liaisons</h2>${table(['Liaison','Sens de référence','Q signé (L/s)','V (m/s)','Pertes (m)','Gain pompe (m)'],result.edges.map(x=>[esc(x.id),`${esc(x.from)} → ${esc(x.to)}`,n(x.q),n(x.v),n(x.loss),n(x.gain)]))}<h3>Réservoirs : débit net fourni (+) / reçu (−)</h3>${table(['Réservoir','Q (L/s)'],result.sources.map(s=>[esc(s.id),n(s.flow)]))}</section>`;}catch(e){box.innerHTML=`<div class="calc-error" role="alert"><strong>Calcul non validé</strong><p>${esc(e.message)}</p></div>`;}
    const select=root.querySelector('#studioProfileSelect'),previous=select.value;select.innerHTML=project.edges.map(e=>`<option value="${esc(e.id)}">${esc(e.id)} · ${esc(e.from)} → ${esc(e.to)}</option>`).join('');if(project.edges.some(e=>e.id===previous))select.value=previous;graph();profile();persist();
  }
  // Les noeuds sont ancres au terrain : tout changement de carte les replace sur
  // leurs coordonnees d origine, et l operation est refusee plutot que de les tronquer.
  function applyGeo(next){
    // Seuls les nœuds poses sur la carte portent des coordonnees : eux suivent le sol.
    // Ceux qui n ont pas encore ete places restent a l ecran pendant la navigation.
    project.nodes.forEach(node=>{
      if(node.lat===undefined)return;
      const v=latLonToView(next,node.lat,node.lon);
      node.x=Math.round(v.x);node.y=Math.round(v.y);
    });
    project.geo=next;graph();
  }
  const ancrer=node=>{if(!project.geo)return;const g=viewToLatLon(project.geo,node.x,node.y);node.lat=g.lat;node.lon=g.lon;};
  function geoStatus(){
    const el=root.querySelector('#geoStatus'),attrib=root.querySelector('#studioAttrib');
    if(!project.geo){el.textContent='Aucun fond cartographique : le dessin reste topologique.';attrib.textContent='';root.querySelector('#geoAuto').checked=false;return;}
    const g=project.geo;
    el.textContent=`Centre ${g.lat.toFixed(5)}, ${g.lon.toFixed(5)} · zoom ${g.zoom} · 1 unité du plan = ${n(metresPerPixel(g.lat,g.zoom))} m. Longueurs orthodromiques, donc horizontales.`;
    attrib.textContent=g.attribution;
    root.querySelector('#geoAuto').checked=!!g.autoLength;
    root.querySelector('#geoUrl').value=g.url;
    root.querySelector('#geoAttrib').value=g.attribution;
    root.querySelector('#geoCoords').value=`${g.lat.toFixed(6)}, ${g.lon.toFixed(6)}`;
  }
  root.querySelector('#geoPlace').onclick=()=>{
    try{
      const c=parseLatLon(root.querySelector('#geoCoords').value),ancien=project.geo;
      const next={lat:c.lat,lon:c.lon,zoom:c.zoom||(ancien?ancien.zoom:17),
        url:ancien?ancien.url:defaultTiles.url,attribution:ancien?ancien.attribution:defaultTiles.attribution,
        autoLength:ancien?ancien.autoLength:true};
      validateMesh({...project,geo:next});
      remember();project.geo=next;mode='select';graph();geoStatus();update();inspector();
      status('Carte placée : les nœuds portent de vraies coordonnées et les longueurs se calculent.');
    }catch(e){status(e.message);}
  };
  const zoomer=delta=>{try{
    if(!project.geo)throw Error('Placer d’abord la carte.');
    const zoom=project.geo.zoom+delta;
    if(zoom<1||zoom>21)throw Error('Zoom hors domaine : 1 à 21.');
    remember();applyGeo({...project.geo,zoom});geoStatus();update();inspector();
    status(`Zoom ${zoom}.`);
  }catch(e){status(e.message);}};
  root.querySelector('#geoOpen').onclick=()=>{
    try{
      const ancien=project.geo;
      const next={lat:20,lon:5,zoom:2,url:ancien?ancien.url:defaultTiles.url,
        attribution:ancien?ancien.attribution:defaultTiles.attribution,autoLength:ancien?ancien.autoLength:true};
      validateMesh({...project,geo:next});
      remember();
      if(ancien)applyGeo(next); else {project.geo=next;graph();}
      geoStatus();update();inspector();
      status('Carte ouverte sur le monde : zoomer à la molette jusqu’au site, puis poser les nœuds.');
    }catch(e){status(e.message);}
  };
  root.querySelector('#geoCentre').onclick=()=>{
    try{
      if(!project.geo)throw Error('Placer d’abord la carte.');
      const xs=project.nodes.map(x=>x.x),ys=project.nodes.map(x=>x.y);
      const cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2;
      remember();applyGeo(pan(project.geo,cx-400,cy-220));geoStatus();update();inspector();
      status('Réseau recentré.');
    }catch(e){status(e.message);}
  };
  root.querySelector('#geoIn').onclick=()=>zoomer(1);
  root.querySelector('#geoOut').onclick=()=>zoomer(-1);
  root.querySelector('#geoAuto').onchange=e=>{
    if(!project.geo){e.target.checked=false;status('Placer d’abord la carte.');return;}
    remember();project.geo.autoLength=e.target.checked;update();inspector();
    status(e.target.checked?'Longueurs reprises de la carte : vérifier pente, coudes et profil de tranchée.':'Longueurs revenues à la saisie manuelle.');
  };
  root.querySelector('#geoProvider').onclick=()=>{
    try{
      if(!project.geo)throw Error('Placer d’abord la carte.');
      const next={...project.geo,url:root.querySelector('#geoUrl').value.trim(),attribution:root.querySelector('#geoAttrib').value.trim()};
      validateMesh({...project,geo:next});
      remember();project.geo=next;graph();geoStatus();update();
      status('Fournisseur appliqué ; sa mention de source est affichée sous le schéma.');
    }catch(e){status(e.message);}
  };
  root.querySelector('#geoClear').onclick=()=>{
    remember();delete project.geo;mode='select';graph();geoStatus();update();inspector();
    status('Fond cartographique retiré. Les longueurs déjà saisies sont conservées.');
  };
  function basemapStatus(){
    const el=root.querySelector('#basemapStatus'),scale=mapScale(project);
    if(project.basemap){root.querySelector('#basemapLabel').value=project.basemap.label;root.querySelector('#basemapDistance').value=project.basemap.distance;}
    el.textContent=scale
      ? `Échelle : 1 unité du plan = ${n(scale)} m — calage « ${project.basemap.label} » sur ${n(project.basemap.distance)} m. Les longueurs proposées sont horizontales.`
      : basemapUrl ? 'Image chargée : placer les deux points de calage, saisir leur distance réelle, puis valider l’échelle.'
      : 'Aucun fond de plan. Le dessin reste topologique et les longueurs sont saisies à la main.';
  }
  async function loadBasemapImage(){
    if(basemapUrl){graph();return;}
    const blob=await getImage('studio:basemap');
    if(!blob)return;
    basemapUrl=URL.createObjectURL(blob);graph();basemapStatus();
  }
  root.querySelector('#basemapFile').onchange=async e=>{
    const file=e.target.files[0];if(!file)return;
    if(file.size>12000000){status('Image limitée à 12 Mo : réduire la définition de l’extrait.');return;}
    if(basemapUrl)URL.revokeObjectURL(basemapUrl);
    basemapUrl=URL.createObjectURL(file);
    status(await putImage('studio:basemap',file)?'Fond de plan chargé et conservé sur cet appareil.':'Fond de plan chargé pour la session ; stockage indisponible.');
    graph();basemapStatus();
  };
  root.querySelector('#basemapApplyScale').onclick=()=>{
    try{
      if(calibration.length!==2)throw Error('Placer d’abord les deux points de calage sur le plan.');
      const draft={...project,basemap:{label:root.querySelector('#basemapLabel').value.trim(),a:calibration[0],b:calibration[1],distance:root.querySelector('#basemapDistance').valueAsNumber}};
      validateMesh(draft);
      remember();project.basemap=draft.basemap;calibration=[];mode='select';
      basemapStatus();update();inspector();status('Échelle validée : les longueurs mesurées sont désormais proposées par tronçon.');
    }catch(e){status(e.message);}
  };
  root.querySelector('#basemapApplyAll').onclick=()=>{
    if(!mapScale(project)){status('Calibrer l’échelle avant de reprendre les longueurs.');return;}
    remember();let repris=0;
    project.edges.forEach(e=>{const L=planLength(project,e);if(L>=.01&&L<=100000){e.length=Number(L.toFixed(3));repris++;}});
    update();inspector();
    status(`${repris} longueur(s) horizontale(s) reprise(s) : vérifier pente, coudes et profil de tranchée avant de valider.`);
  };
  root.querySelector('#basemapClear').onclick=async()=>{
    remember();delete project.basemap;calibration=[];mode='select';
    if(basemapUrl){URL.revokeObjectURL(basemapUrl);basemapUrl=null;}
    await deleteImage('studio:basemap');
    graph();basemapStatus();update();inspector();
    status('Fond de plan retiré. Les longueurs déjà saisies sont conservées.');
  };
  savedList();inspector();update();basemapStatus();geoStatus();loadBasemapImage();
}
