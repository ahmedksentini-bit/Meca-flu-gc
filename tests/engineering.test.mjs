import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultSizing,defaultNpsh,defaultNetwork,solveSizing,solveNpsh,solveNetwork,pipeLoss} from '../src/engineering-solvers.js';
import {getInstallation,applyInstallationDiameter} from '../src/installation.js';
const near=(a,b,t=1e-8)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
test('Sizing selects smallest unique diameter satisfying both constraints',()=>{
  const p=defaultSizing();p.diameters=[200,100,150,100];const r=solveSizing(p);
  assert.deepEqual(r.rows.map(x=>x.diameter),[100,150,200]);assert.equal(r.selected.diameter,100);
  p.maxVelocity=.5;assert.equal(solveSizing(p).selected.diameter,200);
  p.maxLoss=.00001;assert.equal(solveSizing(p).selected,null);
});
test('Sizing laminar losses and power agree with independent expressions',()=>{
  const p=defaultSizing();Object.assign(p,{flow:.01,length:10,sumK:0,roughness:0,diameters:[20]});
  const r=solveSizing(p).rows[0];near(r.total,128*p.nu*1e-6*10*.00001/(Math.PI*9.81*.02**4));near(r.power,p.rho*9.81*.00001*r.total/1000);
});
test('NPSH zero flow follows reservoir energy balance',()=>{
  const p=defaultNpsh();p.flow=0;const r=solveNpsh(p);near(r.available,(101325-2339)/(998*9.81)-2);near(r.loss.total,0);
  near(r.maxPumpZ,p.surfaceZ+r.pressureHead-p.required-p.margin);
});
test('NPSH reacts to suction lift, vapor pressure and required margin',()=>{
  const p=defaultNpsh();const r=solveNpsh(p);assert.ok(r.accepted);
  p.pumpZ+=1;near(solveNpsh(p).available,r.available-1);
  p.pumpZ=r.maxPumpZ+1;assert.equal(solveNpsh(p).accepted,false);
  p.vaporPressure=100;assert.equal(solveNpsh(p).accepted,false);
  p.vaporPressure=102;assert.throws(()=>solveNpsh(p));
});
test('Network conserves nodal flow, accumulates losses and checks pressure',()=>{
  const p=defaultNetwork(),r=solveNetwork(p),a=r.rows.find(x=>x.id==='A'),b=r.rows.find(x=>x.id==='B');
  near(r.totalFlow,10);near(a.flow,10);near(b.flow,6);near(r.continuityResidual,0);near(b.head,50-a.loss.total-b.loss.total);near(b.pressureHead,b.head-15);
  near(b.pressureBar,b.pressureHead*998*9.81/100000);assert.ok(r.accepted);
  p.sourceHead=r.minSourceHead-1;assert.equal(solveNetwork(p).accepted,false);
});
test('Network permits unsorted nodes, local demand and multiple source branches',()=>{
  const p=defaultNetwork();p.nodes[0].demand=2;p.nodes.reverse();p.nodes.push({...p.nodes[0],id:'D',parent:'SOURCE',demand:3});
  const r=solveNetwork(p);near(r.totalFlow,15);near(r.rows.find(x=>x.id==='A').flow,12);
});
test('Zero demands have zero loss',()=>{
  const p=defaultNetwork();p.nodes.forEach(x=>x.demand=0);const r=solveNetwork(p);near(r.totalFlow,0);r.rows.forEach(x=>{near(x.loss.total,0);near(x.head,50);});
});
test('Topology validation rejects cycles, duplicate IDs, missing parents and empty networks',()=>{
  for(const edit of [p=>p.nodes[0].parent='B',p=>p.nodes[1].id='A',p=>p.nodes[1].parent='missing',p=>p.nodes=[],p=>p.nodes[0].id='SOURCE']){const p=defaultNetwork();edit(p);assert.throws(()=>solveNetwork(p));}
});
test('All solvers reject invalid dimensions, nonfinite values and negative demands',()=>{
  for(const d of [0,-1,NaN,Infinity])assert.throws(()=>pipeLoss({...defaultNpsh(),diameter:d},10));
  const s=defaultSizing();s.diameters=[];assert.throws(()=>solveSizing(s));s.diameters=[100];s.flow=0;assert.throws(()=>solveSizing(s));
  const p=defaultNpsh();p.margin=-1;assert.throws(()=>solveNpsh(p));
  const t=defaultNetwork();t.nodes[0].demand=-1;assert.throws(()=>solveNetwork(t));
});
test('JSON round trips reproduce all module outputs',()=>{
  for(const [f,solve] of [[defaultSizing,solveSizing],[defaultNpsh,solveNpsh],[defaultNetwork,solveNetwork]]){const p=f();assert.deepEqual(solve(p),solve(JSON.parse(JSON.stringify(p))));}
});
test('Applying sizing changes only chosen installation diameter',()=>{
  const before=getInstallation();applyInstallationDiameter(1,125);const expected=structuredClone(before);expected.sections[1].diameter=125;assert.deepEqual(getInstallation(),expected);
  assert.throws(()=>applyInstallationDiameter(99,100));assert.throws(()=>applyInstallationDiameter(0,0));applyInstallationDiameter(1,before.sections[1].diameter);
});
