import { G } from './solvers.js';
import { defaultInstallation, validateInstallation, installationLosses } from './installation-solver.js';

const bounded = (x, label, lo, hi) => {
  if (typeof x !== 'number' || !Number.isFinite(x) || x < lo || x > hi) throw Error(`${label} : valeur attendue entre ${lo} et ${hi}.`);
};
export const defaultSizing = () => ({ flow:10, rho:998, nu:1.004, length:200, roughness:0.05, sumK:2, maxVelocity:2, maxLoss:10, diameters:[50,63,75,90,100,110,125,140,150,160,180,200,250,300] });
export const defaultNpsh = () => ({ flow:10, rho:998, nu:1.004, length:6, diameter:150, roughness:0.05, sumK:1.5, surfacePressure:101.325, vaporPressure:2.339, surfaceZ:0, pumpZ:2, required:3, margin:1 });
export const defaultNetwork = () => ({ rho:998, nu:1.004, sourceHead:50, minPressure:15, nodes:[
  {id:'A',parent:'SOURCE',demand:0,z:5,length:150,diameter:150,roughness:0.05,sumK:1},
  {id:'B',parent:'A',demand:6,z:15,length:100,diameter:100,roughness:0.05,sumK:2},
  {id:'C',parent:'A',demand:4,z:20,length:180,diameter:90,roughness:0.05,sumK:2}
] });

// Units at boundary: L/s, mm, m, kg/m³, ν in 10⁻⁶ m²/s, pressures in kPa absolute.
export function pipeLoss(p, flow, diameter = p.diameter) {
  bounded(p.sumK, 'Somme K', 0, 100000);
  const model = {...defaultInstallation(), flow, rho:p.rho, nu:p.nu, sections:[{
    name:'Conduite',length:p.length,diameter,roughness:p.roughness,
    accessories:[{name:'Somme K',count:1,k:p.sumK}]
  }]};
  validateInstallation(model);
  return installationLosses(model, flow).rows[0];
}
export function solveSizing(p) {
  bounded(p.flow,'Débit',0.000001,100000);
  bounded(p.maxVelocity,'Vitesse maximale',0.001,100);
  bounded(p.maxLoss,'Perte admissible',0.000001,100000);
  if (!Array.isArray(p.diameters) || !p.diameters.length || p.diameters.length>100) throw Error('Renseigner 1 à 100 diamètres intérieurs.');
  p.diameters.forEach(d=>bounded(d,'Diamètre intérieur',1,20000));
  const rows=[...new Set(p.diameters)].sort((a,b)=>a-b).map(diameter=>{
    const loss=pipeLoss(p,p.flow,diameter);
    return {...loss,diameter,power:p.rho*G*p.flow/1000*loss.total/1000,accepted:loss.V<=p.maxVelocity && loss.total<=p.maxLoss};
  });
  return {rows,selected:rows.find(r=>r.accepted) || null};
}
export function solveNpsh(p) {
  bounded(p.surfacePressure,'Pression absolue du réservoir (kPa)',0.001,100000);
  bounded(p.vaporPressure,'Pression de vapeur absolue (kPa)',0,100000);
  if(p.vaporPressure>=p.surfacePressure) throw Error('Pression de vapeur ≥ pression du réservoir : hypothèse de liquide monophasique invalide.');
  bounded(p.surfaceZ,'Cote surface',-10000,10000); bounded(p.pumpZ,'Cote référence pompe',-10000,10000);
  bounded(p.required,'NPSH requis',0,10000); bounded(p.margin,'Marge imposée',0,10000);
  const loss=pipeLoss(p,p.flow);
  const pressureHead=(p.surfacePressure-p.vaporPressure)*1000/(p.rho*G);
  const available=pressureHead+p.surfaceZ-p.pumpZ-loss.total;
  const reserve=available-p.required;
  return {loss,pressureHead,available,reserve,accepted:reserve>=p.margin,maxPumpZ:p.surfaceZ+pressureHead-loss.total-p.required-p.margin};
}
export function solveNetwork(p) {
  bounded(p.rho,'Masse volumique',0.01,30000); bounded(p.nu,'Viscosité',0.001,1000000);
  bounded(p.sourceHead,'Charge source',-10000,10000); bounded(p.minPressure,'Pression minimale (mCE)',0,10000);
  if(!Array.isArray(p.nodes)||!p.nodes.length||p.nodes.length>50)throw Error('Le réseau doit comporter 1 à 50 nœuds.');
  const nodes=new Map();
  for(const node of p.nodes){
    if(!node || typeof node.id!=='string'|| !/^[A-Za-z0-9_-]{1,20}$/.test(node.id)||node.id==='SOURCE'||nodes.has(node.id))throw Error('Identifiants uniques requis (1–20 lettres, chiffres, _ ou -), hors SOURCE.');
    bounded(node.demand,'Demande nodale (L/s)',0,100000);bounded(node.z,'Cote du nœud',-10000,10000);
    pipeLoss({...node,rho:p.rho,nu:p.nu},0);
    nodes.set(node.id,{...node,children:[],flow:node.demand});
  }
  const roots=[];
  for(const node of nodes.values()){
    if(node.parent==='SOURCE')roots.push(node);
    else {if(!nodes.has(node.parent))throw Error(`Parent inconnu pour ${node.id}.`);nodes.get(node.parent).children.push(node);}
  }
  const visiting=new Set(),done=new Set();
  function accumulate(node){
    if(visiting.has(node.id))throw Error('Cycle détecté : seuls les réseaux arborescents sont acceptés.');
    if(done.has(node.id))return node.flow;
    visiting.add(node.id);node.flow=node.demand+node.children.reduce((s,c)=>s+accumulate(c),0);visiting.delete(node.id);done.add(node.id);return node.flow;
  }
  for(const node of nodes.values())accumulate(node);
  const rows=[];
  function propagate(node,upstreamHead,depth){
    const loss=pipeLoss({...node,rho:p.rho,nu:p.nu},node.flow);
    const head=upstreamHead-loss.total,pressureHead=head-node.z;
    rows.push({...node,children:undefined,depth,loss,head,pressureHead,pressureBar:p.rho*G*pressureHead/100000,accepted:pressureHead>=p.minPressure});
    node.children.forEach(c=>propagate(c,head,depth+1));
  }
  roots.forEach(node=>propagate(node,p.sourceHead,0));
  if(rows.length!==nodes.size)throw Error('Tous les nœuds doivent être reliés à SOURCE.');
  const totalFlow=roots.reduce((s,r)=>s+r.flow,0);
  const minSourceHead=Math.max(...rows.map(r=>p.sourceHead-r.head+r.z+p.minPressure));
  return {rows,totalFlow,minSourceHead,accepted:rows.every(r=>r.accepted),continuityResidual:totalFlow-p.nodes.reduce((s,r)=>s+r.demand,0)};
}
