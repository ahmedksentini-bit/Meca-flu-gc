import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultMesh,solveMesh,meshLoss,edgeFlow,validateMesh,validateCurve,deliveredDemand,mapScale,planLength} from '../src/mesh-solver.js';
import {insideDiameter,parsePumpCSV,validatePipeCatalog,materials} from '../src/technical-library.js';
import {saveProject,loadProject,listProjects} from '../src/project-store.js';
import {createReport} from '../src/pdf-report.js';
const near=(a,b,t=2e-6)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
function single(){const p=defaultMesh();p.mode='DDA';p.nodes=p.nodes.slice(0,2);p.nodes[1].demand=1;p.edges=p.edges.slice(0,1);return p;}
test('Meshed loop converges with mass and energy balance and reverse flow',()=>{const r=solveMesh(defaultMesh());near(r.totalDelivered,10);near(r.sources[0].flow,10);assert.ok(r.massResidual<1e-6);assert.ok(r.energyResidual<1e-5);assert.ok(r.edges.find(e=>e.id==='P3').q<0);});
test('Single pipe laminar reference is independently Hagen-Poiseuille',()=>{const p=single();p.nodes[1].demand=.01;const e=p.edges[0],Q=.00001,D=e.diameter/1000;const loss=128*p.nu*1e-6*e.length*Q/(Math.PI*9.81*D**4);const r=solveMesh(p);near(r.edges[0].q,.01);near(r.nodes[1].H,p.nodes[0].head-loss);});
test('Parallel identical pipes share flow equally (analytical symmetry)',()=>{const p=single();p.nodes[1].demand=8;p.edges.push({...p.edges[0],id:'P2'});const r=solveMesh(p);near(r.edges[0].q,4);near(r.edges[1].q,4);});
test('Two fixed sources and a central node satisfy independent laminar linear network',()=>{const p=single();p.nodes[1].demand=.02;const e=p.edges[0];p.nodes.push({...p.nodes[0],id:'R2',head:49.999,x:650});p.edges.push({...e,id:'P2',from:'R2'});const resistance=128*p.nu*1e-6*e.length*.001/(Math.PI*9.81*(e.diameter/1000)**4);const h=(50+49.999-resistance*.02)/2;const r=solveMesh(p);near(r.nodes[1].H,h);near(r.edges[0].q,(50-h)/resistance);near(r.sources.reduce((s,x)=>s+x.flow,0),.02);});
test('Pressure dependent demand matches constructed half-demand reference',()=>{const p=single();p.mode='PDA';p.nodes[1].demand=2;const z=p.nodes[1].z,pressure=p.pmin+(p.pfull-p.pmin)*.25;p.nodes[0].head=z+pressure+meshLoss(p,p.edges[0],1).loss;const r=solveMesh(p);near(r.totalDelivered,1);near(r.nodes[1].pressure,pressure);});
test('PDA delivers zero below minimum and full demand above required pressure',()=>{const p=single();p.mode='PDA';const node=p.nodes[1];near(deliveredDemand(p,node,node.z-1),0);near(deliveredDemand(p,node,node.z+p.pfull+1),node.demand);p.nodes[0].head=0;near(solveMesh(p).totalDelivered,0);});
test('Pump at imposed demand satisfies independently prescribed energy balance',()=>{const p=single();p.nodes[1].demand=5;p.edges[0].type='pump';const r=solveMesh(p);near(r.edges[0].q,5);near(r.nodes[1].H,50+45-.06*25-meshLoss(p,p.edges[0],5).loss);});
test('Imported piecewise pump curve is interpolated and out-of-range rejected',()=>{const p=single();const e=p.edges[0];e.type='pump';e.curve={name:'Reference analytique',source:'Cas de test, non fabricant',points:[[0,40],[2,30],[4,0]]};const r=solveMesh(p);near(r.edges[0].gain,35);p.nodes[1].demand=5;assert.throws(()=>solveMesh(p),/hors domaine/);});
test('Pump blocks reverse flow; closed links have zero flow',()=>{const p=single(),e={...p.edges[0],type:'pump'};near(edgeFlow(p,e,-100),0);near(edgeFlow(p,{...e,closed:true},10),0);p.edges.push({...p.edges[0],id:'closed',closed:true});near(solveMesh(p).edges[1].q,0);});
test('Node/link ordering and orientation do not change hydraulic solution',()=>{const p=defaultMesh(),r=solveMesh(p);p.nodes.reverse();p.edges.reverse();for(const e of p.edges)[e.from,e.to]=[e.to,e.from];const s=solveMesh(p);r.nodes.forEach(x=>near(x.H,s.nodes.find(y=>y.id===x.id).H,1e-5));});
test('Invalid meshes and disconnected components are rejected',()=>{for(const f of [p=>p.nodes[1].id='R',p=>p.edges[0].diameter=0,p=>p.edges[0].from='missing',p=>p.edges.forEach(e=>e.closed=true),p=>p.pfull=p.pmin,p=>p.nodes[1].x=NaN,p=>p.nodes[0].demand=1]){const p=defaultMesh();f(p);assert.throws(()=>validateMesh(p));}});
test('Transition loss relation remains continuous and monotonic',()=>{const p=single(),e=p.edges[0];let last=0;for(let Re=1800;Re<=4200;Re+=25){const q=Re*p.nu*1e-6*Math.PI*(e.diameter/1000)/4*1000,loss=meshLoss(p,e,q).loss;assert.ok(loss>last);last=loss;}});
test('Catalog dimensions, material unit conversions and curve validation',()=>{near(materials[1].roughness,.15*.3048);near(insideDiameter(110,6.6),96.8);assert.throws(()=>insideDiameter(100,60));const curve=parsePumpCSV('Q;H\n0;40\n5;30\n10;10','Pompe test','Source de test');assert.equal(curve.points.length,3);assert.throws(()=>validateCurve({...curve,source:''}));assert.throws(()=>parsePumpCSV('0;20\n5;30','test','source'));assert.throws(()=>validatePipeCatalog({name:'test',source:'test',pipes:[{series:'SDR',outside:100,thickness:100,roughness:0}]}));});
test('Local projects survive serialization, invalid storage is isolated and quota errors handled',()=>{const map=new Map(),storage={setItem:(k,v)=>map.set(k,v),getItem:k=>map.get(k),key:i=>[...map.keys()][i],get length(){return map.size;}};const p=defaultMesh();assert.ok(saveProject('studio:test',p,storage));assert.deepEqual(loadProject('studio:test',defaultMesh,validateMesh,storage),p);assert.equal(listProjects(storage).length,1);map.set('mecaflu-project-v1:broken','{');assert.deepEqual(loadProject('broken',defaultMesh,validateMesh,storage),defaultMesh());assert.equal(saveProject('x',p,{setItem(){throw Error('Quota');}}),false);});
test('PDF includes correct object offsets, pagination and escaped text',()=>{const bytes=createReport({title:'Réseau (test)',date:'2026-09-13',sections:[{title:'Bilan',lines:Array.from({length:130},(_,i)=>`Ligne ${i} : débit (L/s) = 1`)}]});const pdf=new TextDecoder().decode(bytes);assert.ok(pdf.startsWith('%PDF-1.4'));assert.match(pdf,/Page 4\/4/);const start=Number(pdf.match(/startxref\n(\d+)/)[1]);assert.equal(pdf.slice(start,start+4),'xref');const entries=pdf.slice(start).split('\n').slice(3).filter(x=>/^\d{10} 00000 n/.test(x));entries.forEach((e,i)=>assert.ok(pdf.slice(Number(e.slice(0,10))).startsWith(`${i+1} 0 obj`)));});
test('Basemap calibration validates, scales isotropically and measures plan length',()=>{
  const p=defaultMesh();
  assert.equal(mapScale(p),null);
  assert.equal(planLength(p,p.edges[0]),null);
  validateMesh(p);
  p.basemap={label:'Ortho de test',a:{x:100,y:100},b:{x:300,y:100},distance:400};
  validateMesh(p);
  near(mapScale(p),2);
  const a=p.nodes.find(n=>n.id==='R'),b=p.nodes.find(n=>n.id==='A');
  near(planLength(p,p.edges[0]),Math.hypot(b.x-a.x,b.y-a.y)*2);
  near(planLength(p,{from:'R',to:'R'}),0);
  assert.equal(planLength(p,{from:'R',to:'inconnu'}),null);
  for(const f of [m=>m.b={x:110,y:100},m=>m.distance=0,m=>m.label='  ',m=>m.a={x:-5,y:100},m=>m.b=null,m=>m.distance='400']){
    const q=defaultMesh();q.basemap={label:'Ortho',a:{x:100,y:100},b:{x:300,y:100},distance:400};f(q.basemap);
    assert.throws(()=>validateMesh(q));
  }
});
