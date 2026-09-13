import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultInstallation, solveInstallation, validateInstallation } from '../src/installation-solver.js';
const near = (actual, expected, tolerance = 1e-7) => assert.ok(Math.abs(actual-expected)<tolerance, `${actual} != ${expected}`);

test('Laminar pipe agrees with Hagen–Poiseuille independently of the friction solver', () => {
  const p=defaultInstallation();p.flow=0.01;p.zB=0;p.sections=[{name:'Tube',length:10,diameter:20,roughness:0,accessories:[]}];
  const r=solveInstallation(p);const Q=p.flow/1000,D=.02;
  near(r.losses.total,128*(p.nu*1e-6)*10*Q/(Math.PI*9.81*D**4));
});
test('Accessory losses use the local diameter and include counts', () => {
  const p=defaultInstallation();p.sections[0].accessories=[{name:'Test',count:3,k:2}];
  const r=solveInstallation(p),v=r.losses.rows[0].V;
  near(r.losses.rows[0].singular,6*v*v/(2*9.81));
  near(r.requiredHead,p.zB-p.zA+r.losses.total);
  near(r.shaftPower,r.hydraulicPower/p.efficiency);
});
test('Pump duty point closes the energy balance and gravity gives no pump power', () => {
  const p=defaultInstallation();p.mode='flow';let r=solveInstallation(p);
  assert.ok(r.flow>0 && r.converged);near(r.requiredHead,p.h0-p.k*r.flow*r.flow);
  p.pump=false;p.zA=40;r=solveInstallation(p);assert.ok(r.flow>0);near(r.requiredHead,0);near(r.hydraulicPower,0);
});
test('No positive head available gives zero flow, not a fictitious operating point', () => {
  const p=defaultInstallation();p.mode='flow';p.pump=false;const r=solveInstallation(p);
  assert.equal(r.flow,0);assert.equal(r.converged,false);assert.ok(r.warnings.length>0);
});
test('Invalid dimensions, empty fields and malformed imports are rejected', () => {
  for(const change of [p=>p.sections[0].diameter=0,p=>p.nu=NaN,p=>p.sections=[],p=>p.sections[0].accessories[0].count=1.5,p=>p.sections[0].roughness=100]) {
    const p=defaultInstallation();change(p);assert.throws(()=>solveInstallation(p));
  }
  assert.throws(()=>validateInstallation({}));
});
test('Zero flow has finite zero loss and does not crash', () => {
  const p=defaultInstallation();p.flow=0;const r=solveInstallation(p);near(r.losses.total,0);near(r.hydraulicPower,0);
});
test('Project JSON round trip retains the calculation', () => {
  const p=defaultInstallation();near(solveInstallation(JSON.parse(JSON.stringify(p))).requiredHead,solveInstallation(p).requiredHead);
});
