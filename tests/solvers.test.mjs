import assert from "node:assert/strict";
import { solve, isClose, solvers } from "../src/solvers.js";

const exercise = solver => ({ solver });
const venturi = solve(exercise("venturi"), { D1:200,D2:100,h:100,rho:1000,rhoM:13600 }).values;
assert.ok(isClose(venturi.dp, 12360.6, 1e-10));
assert.ok(isClose(venturi.Q, 0.040331, 0.001));
assert.ok(isClose(venturi.V2, venturi.V1 * 4, 1e-12));

const wall = solvers.planeForce({ b:2,H:3,rho:1000 }).values;
assert.ok(isClose(wall.force, 88290, 1e-12));
assert.equal(wall.yp, 2);

const jet = solvers.jetPlate({ d:50,V:20,rho:1000 }).values;
assert.ok(isClose(jet.force, 785.398, 0.001));

const losses = solvers.colebrook({ D:200,L:300,Q:45,eps:0.15,nu:1 }).values;
assert.ok(losses.Re > 200000 && losses.Re < 400000);
assert.ok(losses.f > 0.015 && losses.f < 0.025);
assert.ok(losses.hf > 2 && losses.hf < 8);

const oil = solvers.density({ volume:6.5,W:55 }).values;
assert.ok(isClose(oil.rho, 862.65, 0.001));
assert.ok(isClose(oil.relative, oil.rho / 1000, 1e-12));

const diver = solvers.pressureDepth({ h:28,rho:1025,patm:101.3 }).values;
assert.ok(isClose(diver.relative, 281547, 1e-12));
assert.ok(isClose(diver.absolute, 382847, 1e-12));

assert.ok(isClose(solvers.compressibility({volume:1,p1:1,p2:100,K:2.2}).values.ratio, 0.45, 0.001));
assert.ok(solvers.layeredPressure({hOil:2,rhoOil:850,hWater:3,rhoWater:1000}).values.bottomP > 45000);
assert.ok(solvers.submergedGate({b:2,H:1.8,y0:1.2,rho:1000}).values.yp > 2.1);
assert.ok(solvers.torricelli({d:40,h:6,Cd:0.62}).values.Q > 0.008);
assert.ok(solvers.jetDeflect({d:50,V:20,theta:135,rho:1000}).values.force > 1400);
assert.ok(solvers.minorLosses({D:150,Q:30,Kentry:.5,Kelbows:.3,nElbows:2,Kvalve:.2,Kexit:1}).values.hf > 0);
assert.ok(isClose(solvers.froudeSimilarity({N:20,Vm:1.5,Qm:12}).values.Vp, 6.7082, 0.001));
const channel = solvers.manningChannel({b:3,y:1.2,S:1.5,Ks:70}).values;
assert.ok(channel.Q > 4 && channel.Fr < 1);

const two = solvers.twoSectionContinuity({ D1: 200, D2: 100, Q: 80 }).values;
assert.ok(isClose(two.V1, 2.5465, 0.002));
assert.ok(isClose(two.V2, two.V1 * 4, 1e-12));

const node = solvers.networkNode({ D1: 200, V1: 1.2, D2: 150, V2: 0.8, Qbranch: 12, D3: 250 }).values;
assert.ok(isClose(node.Q1, 37.699, 0.002));
assert.ok(isClose(node.Q2, 14.137, 0.002));
assert.ok(isClose(node.Q3, 39.836, 0.002));

const accel = solvers.convectiveAcceleration({ L: 0.8, V1: 1.5, V2: 8 }).values;
assert.ok(isClose(accel.gradient, 8.125, 1e-12));
assert.ok(isClose(accel.acceleration, 38.59375, 1e-12));

const rise = solvers.reservoirRise({ D: 8, Qin: 120, Qout: 45, deltaH: 1.5 }).values;
assert.ok(isClose(rise.dQ, 0.075, 1e-12));
assert.ok(isClose(rise.time, 1005.3, 0.01));

const pipe = solvers.pipeContinuity({ D: 100, Q: 80, targetV: 1.2 }).values;
assert.ok(pipe.V > 10);
assert.ok(pipe.Dtarget > 0.25 && pipe.Dtarget < 0.3);

const sections = solvers.bernoulliSections({ D1: 300, D2: 200, Q: 80, p1: 150, z1: 0, z2: 2.5, rho: 1000 }).values;
assert.ok(isClose(sections.V1, 1.1318, 0.002));
assert.ok(isClose(sections.p2, 122875, 0.002));

const pitotHg = solvers.pitot({ h: 25, rho: 1000, rhoM: 13600 }).values;
assert.ok(isClose(pitotHg.dynamic, 3090.15, 0.001));
assert.ok(isClose(pitotHg.V, 2.485, 0.002));

const drain = solvers.drainTime({ tankD: 3, orificeD: 50, h1: 4, h2: 1, Cd: 0.62 }).values;
assert.ok(drain.t > 2500 && drain.t < 2800);

const siphon = solvers.siphon({ D: 80, rise: 1.5, drop: 3, rho: 1000, patm: 101.3 }).values;
assert.ok(isClose(siphon.V, 7.672, 0.002));
assert.ok(isClose(siphon.pHigh, 57155, 0.002));

const pump = solvers.hydraulicPower({ Q: 50, head: 35, losses: 0, efficiency: 0.7, rho: 1000 }).values;
assert.ok(isClose(pump.H, 35, 1e-12));
assert.ok(isClose(pump.waterPower, 17167.5, 0.001));
assert.ok(isClose(pump.inputPower, 24525, 0.001));

assert.ok(isClose(100.024, 100));
assert.ok(!isClose(103, 100));
console.log("✓ Assertions métier validées");
