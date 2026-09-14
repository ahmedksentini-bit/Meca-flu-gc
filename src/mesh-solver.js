import { G, darcyFriction } from './solvers.js';
import { geoDistance, metresPerPixel } from './geo.js';
export const defaultMesh = () => ({version:1,name:'Boucle de distribution',rho:998,nu:1.004,mode:'PDA',pmin:0,pfull:15,
  nodes:[{id:'R',type:'reservoir',head:50,z:50,demand:0,x:80,y:210},{id:'A',type:'junction',head:0,z:10,demand:3,x:290,y:100},{id:'B',type:'junction',head:0,z:20,demand:5,x:540,y:210},{id:'C',type:'junction',head:0,z:12,demand:2,x:290,y:320}],
  edges:[['P1','R','A'],['P2','A','B'],['P3','B','C'],['P4','C','R']].map(([id,from,to])=>({id,from,to,type:'pipe',length:200,diameter:100,roughness:0.04572,sumK:0,closed:false,h0:45,k:.06,curve:null}))});
const number=(x,label,lo,hi)=>{if(typeof x!=='number'||!Number.isFinite(x)||x<lo||x>hi)throw Error(`${label} : valeur entre ${lo} et ${hi} requise.`);};
const identifier=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{1,24}$/.test(x);
export function validateCurve(c){
  if(!c||typeof c.name!=='string'||!c.name.trim()||c.name.length>120||typeof c.source!=='string'||!c.source.trim()||c.source.length>500)throw Error('Courbe : nom et source obligatoires.');
  if(!Array.isArray(c.points)||c.points.length<2||c.points.length>100)throw Error('Courbe : 2 à 100 points Q (L/s), H (m).');
  c.points.forEach((p,i)=>{if(!Array.isArray(p)||p.length!==2)throw Error('Point Q,H invalide.');number(p[0],'Q courbe',0,100000);number(p[1],'H courbe',0,10000);if(i&&(p[0]<=c.points[i-1][0]||p[1]>=c.points[i-1][1]))throw Error('Q doit croître et H décroître strictement.');});
  if(c.points[0][0]!==0)throw Error('La courbe doit commencer à Q = 0 (hauteur à vanne fermée).');
  return c;
}
export function validateMesh(p){
  if(!p||p.version!==1||!['DDA','PDA'].includes(p.mode)||typeof p.name!=='string'||p.name.length>120)throw Error('Projet réseau non reconnu.');
  number(p.rho,'Masse volumique',.01,30000);number(p.nu,'Viscosité',.001,1000000);number(p.pmin,'Pression minimale',0,1000);number(p.pfull,'Pression de service',p.pmin+.001,10000);
  if(!Array.isArray(p.nodes)||p.nodes.length<2||p.nodes.length>30||!Array.isArray(p.edges)||!p.edges.length||p.edges.length>60)throw Error('Limites : 2–30 nœuds et 1–60 liaisons.');
  const ids=new Set();let reservoirs=0;
  p.nodes.forEach(n=>{if(!n||!identifier(n.id)||ids.has(n.id)||!['reservoir','junction'].includes(n.type))throw Error('Nœuds : identifiant unique et type requis.');ids.add(n.id);number(n.z,'Cote',-10000,10000);number(n.head,'Charge',-10000,10000);number(n.demand,'Demande',0,10000);const cadre=p.geo?20000:780;number(n.x,'Position X',p.geo?-cadre:20,cadre);number(n.y,'Position Y',p.geo?-cadre:20,p.geo?cadre:420);if(n.type==='reservoir'){reservoirs++;if(n.demand!==0)throw Error('Un réservoir ne porte pas de demande locale.');}});
  if(!reservoirs)throw Error('Ajouter au moins un réservoir à charge imposée.');
  const eids=new Set();p.edges.forEach(e=>{if(!e||!identifier(e.id)||eids.has(e.id)||!ids.has(e.from)||!ids.has(e.to)||e.from===e.to||!['pipe','pump','valve'].includes(e.type)||typeof e.closed!=='boolean')throw Error('Liaison invalide : identifiant, extrémités, type ou état.');eids.add(e.id);number(e.length,'Longueur',.01,100000);number(e.diameter,'Diamètre intérieur',1,20000);number(e.roughness,'Rugosité',0,e.diameter*.05);number(e.sumK,'Somme K',0,100000);if(e.type==='pump'){number(e.h0,'H0 pompe',.001,10000);number(e.k,'k pompe',.000001,10000);if(e.curve)validateCurve(e.curve);}});
  if(p.geo){
    const g=p.geo;
    number(g.lat,'Latitude du projet',-85.05112878,85.05112878);
    number(g.lon,'Longitude du projet',-180,180);
    if(!Number.isInteger(g.zoom)||g.zoom<1||g.zoom>21)throw Error('Niveau de zoom attendu entre 1 et 21.');
    if(typeof g.url!=='string'||!g.url.startsWith('https://')||g.url.length>500||!['{z}','{x}','{y}'].every(k=>g.url.includes(k)))
      throw Error('Adresse de tuiles attendue en https, avec les repères {z}, {x} et {y}.');
    if(typeof g.attribution!=='string'||!g.attribution.trim()||g.attribution.length>300)
      throw Error('Mention de source obligatoire pour le fond de carte.');
    if(g.autoLength!==undefined&&typeof g.autoLength!=='boolean')throw Error('Reprise automatique des longueurs : valeur vrai ou faux attendue.');
  }
  if(p.basemap){
    const m=p.basemap;
    if(typeof m.label!=='string'||!m.label.trim()||m.label.length>120)throw Error('Fond de plan : intitulé et origine de l’image requis (120 caractères maximum).');
    if(!m.a||!m.b)throw Error('Fond de plan : deux points de calage requis.');
    [['A',m.a],['B',m.b]].forEach(([name,pt])=>{number(pt.x,`Calage ${name} X`,0,800);number(pt.y,`Calage ${name} Y`,0,440);});
    number(m.distance,'Distance réelle de calage (m)',.001,1000000);
    if(Math.hypot(m.b.x-m.a.x,m.b.y-m.a.y)<20)throw Error('Points de calage trop rapprochés : les éloigner pour une échelle fiable.');
  }
  const seen=new Set(p.nodes.filter(n=>n.type==='reservoir').map(n=>n.id));let changed=true;
  while(changed){changed=false;p.edges.filter(e=>!e.closed).forEach(e=>{if(seen.has(e.from)!==seen.has(e.to)){seen.add(e.from);seen.add(e.to);changed=true;}});}
  if(seen.size!==p.nodes.length)throw Error('Nœud isolé : chaque composante ouverte doit être reliée à un réservoir.');
  return p;
}
// Echelle isotrope du fond de plan, en metres par unite du viewBox.
// Metres par unite du viewBox : resolution au sol de la carte, ou echelle du calage.
export const mapScale=p=>p.geo?metresPerPixel(p.geo.lat,p.geo.zoom)
  :p.basemap?p.basemap.distance/Math.hypot(p.basemap.b.x-p.basemap.a.x,p.basemap.b.y-p.basemap.a.y):null;
// Longueur HORIZONTALE lue sur le plan : ni pente, ni coudes, ni profil de tranchee.
// Sur fond cartographique la distance est orthodromique, calculee entre les
// coordonnees reelles des deux noeuds ; sur image calee, elle vient de l echelle.
export function planLength(p,edge){
  const a=p.nodes.find(n=>n.id===edge.from),b=p.nodes.find(n=>n.id===edge.to);
  if(!a||!b)return null;
  if(p.geo)return geoDistance(p.geo,a,b);
  const scale=mapScale(p);if(!scale)return null;
  return Math.hypot(b.x-a.x,b.y-a.y)*scale;
}
export function meshLoss(p,e,q){
  const D=e.diameter/1000,v=Math.abs(q)/1000/(Math.PI*D*D/4),Re=v*D/(p.nu*1e-6);
  let f=0;
  if(Re>0){if(Re<=2000)f=64/Re;else if(Re>=4000)f=darcyFriction(Re,e.roughness/e.diameter);else {const t=(Re-2000)/2000;f=(1-t)*64/Re+t*darcyFriction(Re,e.roughness/e.diameter);}}
  return {v,Re,f,loss:(f*e.length/D+e.sumK)*v*v/(2*G)};
}
export function curveHead(e,q){
  if(!e.curve)return e.h0-e.k*q*q;
  const a=e.curve.points;let i=1;while(i<a.length-1&&q>a[i][0])i++;
  return a[i-1][1]+(a[i][1]-a[i-1][1])*(q-a[i-1][0])/(a[i][0]-a[i-1][0]);
}
export function edgeFlow(p,e,dh){
  if(e.closed)return 0;
  const pump=e.type==='pump',gain=pump?curveHead(e,0):0;
  if(pump&&dh<=-gain)return 0; // one-way pump, closed against excessive back pressure
  const sign=pump?1:Math.sign(dh);if(!sign)return 0;
  const target=pump?dh:Math.abs(dh),fn=q=>meshLoss(p,e,q).loss-(pump?curveHead(e,q):0);
  let lo=0,hi=1;while(fn(hi)<target&&hi<100000)hi*=2;
  if(fn(hi)<target)throw Error('Débit hors domaine numérique.');
  for(let i=0;i<45;i++){const mid=(lo+hi)/2;if(fn(mid)<target)lo=mid;else hi=mid;}
  return sign*(lo+hi)/2;
}
export function deliveredDemand(p,n,h){
  if(n.type==='reservoir')return 0;
  if(p.mode==='DDA')return n.demand;
  const pressure=h-n.z;if(pressure<=p.pmin)return 0;if(pressure>=p.pfull)return n.demand;
  return n.demand*Math.sqrt((pressure-p.pmin)/(p.pfull-p.pmin));
}
function linearSolve(A,b){
  const n=b.length,Aa=A.map((row,i)=>[...row,b[i]]);
  for(let k=0;k<n;k++){let m=k;for(let i=k+1;i<n;i++)if(Math.abs(Aa[i][k])>Math.abs(Aa[m][k]))m=i;if(Math.abs(Aa[m][k])<1e-12)throw Error('Réseau hydrauliquement isolé ou Jacobienne singulière : vérifier pompes et vannes.');[Aa[k],Aa[m]]=[Aa[m],Aa[k]];for(let i=k+1;i<n;i++){const f=Aa[i][k]/Aa[k][k];for(let j=k;j<=n;j++)Aa[i][j]-=f*Aa[k][j];}}
  const x=Array(n).fill(0);for(let i=n-1;i>=0;i--){let s=Aa[i][n];for(let j=i+1;j<n;j++)s-=Aa[i][j]*x[j];x[i]=s/Aa[i][i];}return x;
}
export function solveMesh(p){
  validateMesh(p);const unknown=p.nodes.filter(n=>n.type==='junction'),idx=new Map(unknown.map((n,i)=>[n.id,i])),fixed=new Map(p.nodes.filter(n=>n.type==='reservoir').map(n=>[n.id,n.head]));
  const average=[...fixed.values()].reduce((a,b)=>a+b,0)/fixed.size;
  let h=unknown.map(n=>Math.max(average-1,n.z+p.pfull/2));
  const head=(id,hs)=>fixed.has(id)?fixed.get(id):hs[idx.get(id)];
  function evaluate(hs,jacobian=false){
    const F=unknown.map((n,i)=>deliveredDemand(p,n,hs[i])),A=unknown.map(()=>Array(unknown.length).fill(0));
    if(jacobian)unknown.forEach((n,i)=>{A[i][i]=(deliveredDemand(p,n,hs[i]+1e-4)-deliveredDemand(p,n,hs[i]-1e-4))/2e-4;});
    const flows=p.edges.map(e=>{
      const dh=head(e.from,hs)-head(e.to,hs),q=edgeFlow(p,e,dh),a=idx.get(e.from),b=idx.get(e.to);
      if(a!==undefined)F[a]+=q;if(b!==undefined)F[b]-=q;
      if(jacobian&&!e.closed){const dq=(edgeFlow(p,e,dh+1e-4)-edgeFlow(p,e,dh-1e-4))/2e-4;if(a!==undefined){A[a][a]+=dq;if(b!==undefined)A[a][b]-=dq;}if(b!==undefined){A[b][b]+=dq;if(a!==undefined)A[b][a]-=dq;}}
      return q;
    });return {F,A,flows,norm:Math.max(0,...F.map(Math.abs))};
  }
  let current=evaluate(h),iterations=0;
  for(;iterations<100&&current.norm>1e-6;iterations++){
    const {F,A}=evaluate(h,true),step=linearSolve(A,F.map(x=>-x));let scale=Math.min(1,50/Math.max(1,...step.map(Math.abs))),next;
    for(let j=0;j<24;j++){const candidate=h.map((x,i)=>x+scale*step[i]);next=evaluate(candidate);const closesActivePump=p.edges.some((e,i)=>e.type==='pump'&&current.flows[i]>1e-7&&next.flows[i]===0);if((next.norm<current.norm&&!closesActivePump)||next.norm<1e-6){h=candidate;break;}next=current;scale/=2;}
    if(next.norm>=current.norm)break;current=next;
  }
  if(current.norm>1e-6)throw Error(`Non-convergence après ${iterations} itérations : résidu ${current.norm.toExponential(2)} L/s. Aucune solution validée.`);
  const warnings=[],nodes=p.nodes.map(n=>{const H=head(n.id,h),pressure=H-n.z,delivered=deliveredDemand(p,n,H);if(n.type==='junction'&&pressure<p.pfull-1e-5)warnings.push(`${n.id} : pression sous la valeur de service.`);if(n.type==='junction'&&pressure<0)warnings.push(`${n.id} : dépression relative ; vérifier cavitation et entrée d’air.`);return {...n,H,pressure,delivered};});
  let energyResidual=0;
  const edges=p.edges.map((e,i)=>{const q=current.flows[i],loss=meshLoss(p,e,q),gain=e.type==='pump'&&!e.closed&&q>1e-8?curveHead(e,q):0,dh=head(e.from,h)-head(e.to,h);
    const active=!e.closed&&(e.type!=='pump'||q>1e-8);const residual=active?dh-(Math.sign(q)*loss.loss-gain):0;energyResidual=Math.max(energyResidual,Math.abs(residual));
    if(e.type==='pump'&&!e.closed&&((e.curve&&q>e.curve.points.at(-1)[0]+1e-6)||gain<0))throw Error(`${e.id} : point hors domaine de la courbe de pompe. Étendre la courbe avec des données vérifiées.`);
    if(loss.Re>2000&&loss.Re<4000)warnings.push(`${e.id} : transition, interpolation indicative.`);
    return {...e,q,...loss,gain,residual,fromHead:head(e.from,h),toHead:head(e.to,h)};
  });
  if(energyResidual>1e-5)throw Error('Bilan énergétique hors tolérance.');
  const sources=p.nodes.filter(n=>n.type==='reservoir').map(n=>({id:n.id,flow:edges.reduce((s,e)=>s+(e.from===n.id?e.q:0)-(e.to===n.id?e.q:0),0)}));
  return {nodes,edges,sources,iterations,massResidual:current.norm,energyResidual,totalDemand:unknown.reduce((s,n)=>s+n.demand,0),totalDelivered:nodes.reduce((s,n)=>s+n.delivered,0),warnings};
}
