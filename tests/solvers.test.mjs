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

const lossesFull = solvers.colebrook({ D:200,L:300,Q:45,eps:0.15,nu:1 });
const losses = lossesFull.values;
assert.ok(lossesFull.steps.some(s => String(s[0]).includes("Itérations") && String(s[1]).includes("Itération 1")));
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

const mobile = solvers.jetMobile({ d: 50, V: 18, u: 6, rho: 1000 }).values;
assert.ok(isClose(mobile.uOpt, 6, 1e-12));
assert.ok(isClose(mobile.Ffixed / mobile.Fmoving, (18 / 12) ** 2, 1e-12));

const elbow = solvers.elbowForce({ D: 200, Q: 150, p1: 450, rho: 1000 }).values;
assert.ok(isClose(elbow.Fx, elbow.Fy, 1e-12));
assert.ok(isClose(elbow.F, elbow.Fx * Math.SQRT2, 1e-12));

const incline = solvers.inclinedPlate({ V: 12, Q: 40, theta: 60, rho: 1000 }).values;
assert.ok(isClose(incline.Qdown, 30, 1e-12));
assert.ok(isClose(incline.Qup, 10, 1e-12));

const react = solvers.jetReaction({ h: 4, A: 20, rho: 1000 }).values;
assert.ok(isClose(react.F, 2 * 1000 * 9.81 * 4 * 0.002, 0.001));

const oilLam = solvers.poiseuilleOil({ rho: 880, mu: 0.12, D: 40, L: 25, Q: 1.2 }).values;
assert.ok(oilLam.Re < 2000);
assert.ok(isClose(oilLam.f, 64 / oilLam.Re, 1e-12));

const grav = solvers.gravityPipe({ D: 200, L: 2500, H: 25, eps: 0.25, Ksum: 4.5, nu: 1 }).values;
assert.ok(grav.Q > 20 && grav.Q < 80);
assert.ok(grav.f > 0.015 && grav.f < 0.04);

const size = solvers.pipeSizing({ Q: 80, L: 2000, H: 20, eps: 0.1, nu: 1 }).values;
assert.ok([150, 200, 250, 300, 350, 400].includes(size.Dmm));
assert.ok(size.hf <= 20 + 1e-6);

const stokes = solvers.stokesViscosity({ rhoS: 7850, d: 2, V: 0.012, rhoF: 880 }).values;
assert.ok(stokes.mu > 0.8 && stokes.mu < 1.8);

const trap = solvers.trapezoidalChannel({ b: 2, z: 1.5, y: 1.2, S: 0.8, Ks: 70 }).values;
assert.ok(trap.Q > 2 && trap.Fr < 1);

const yn = solvers.normalDepth({ b: 1.2, S: 2, Ks: 80, Q: 2.4 }).values;
assert.ok(yn.y > 0.4 && yn.y < 1.5);

const wave = solvers.waveCelerity({ y: 2.5, V: 1.2, Lkm: 3 }).values;
assert.ok(isClose(wave.c, Math.sqrt(9.81 * 2.5), 1e-12));
assert.ok(wave.cUp > 0);

const ritter = solvers.damBreakRitter({ h0: 20, xKm: 8 }).values;
assert.ok(isClose(ritter.hDam, 80 / 9, 1e-12));
assert.ok(ritter.t > 200 && ritter.t < 400);

const sluice = solvers.damSluice({ b: 1.8, H: 1.2, hSill: 12, mu: 0.3, W: 8, Cd: 0.62, rho: 1000 }).values;
assert.ok(sluice.force > 2e5);
assert.ok(sluice.yp > 11.3 && sluice.yp < 11.5);

const borda = solvers.bordaCarnot({ D1: 100, D2: 200, Q: 30, rho: 1000 }).values;
assert.ok(borda.dp > 0 && borda.hs > 0);

const spill = solvers.froudeSpillway({ N: 50, Qp: 250, Vm: 3.2, tMin: 2, Fm: 12 }).values;
assert.ok(isClose(spill.Vp, 3.2 * Math.sqrt(50), 1e-12));
assert.ok(isClose(spill.Fp, 12 * 50 ** 3, 1e-12));

const damWall = solvers.retainingWall({ H: 4, t: 2.4, Hwall: 4.8, rhoC: 2400, rho: 1000 }).values;
assert.ok(isClose(damWall.F, 1000 * 9.81 * 8, 1e-12));
assert.ok(damWall.FS > 1);

const cannon = solvers.waterCannon({ d: 20, D1: 50, p1: 8, rho: 1000 }).values;
assert.ok(cannon.V2 > 30 && cannon.Fplate > cannon.Frecoil * 0.2);

const npsh = solvers.npshCavitation({ Q: 40, z0: 100, ze: 103.5, D: 200, L: 8, f: 0.02, K: 3.5, patm: 101.3, pv: 2.3, NPSHr: 4.2, margin: 0.5, rho: 1000 }).values;
assert.ok(npsh.NPSHd > 4.2);
assert.ok(npsh.zMax > 103.5);

const ice = solvers.iceberg({ rhoI: 917, rhoW: 1025 }).values;
assert.ok(isClose(ice.emerge, (1 - 917 / 1025) * 100, 1e-12));

const ft = solvers.froudeForceTime({ N: 25, Fm: 46, tm: 1.6 }).values;
assert.ok(isClose(ft.tp, 8, 1e-12));
assert.ok(isClose(ft.Fp, 46 * 25 ** 3, 1e-12));

const air = solvers.idealGasTwo({ temp1: 35, p1: 0.95, temp2: 0, p2: 1.013, R: 287 }).values;
assert.ok(isClose(air.rho1, 0.95e5 / (287 * 308.15), 1e-12));
assert.ok(isClose(air.rho2, 1.013e5 / (287 * 273.15), 1e-12));

const re2 = solvers.reynoldsTwo({ D1: 20, V1: 0.1, nu1: 1, D2: 100, V2: 1.2, nu2: 400 }).values;
assert.ok(isClose(re2.Re1, 2000, 1e-12));
assert.ok(isClose(re2.Re2, 300, 1e-12));

const field = solvers.kinematicField({ k: 1, x: 1, y: 2 }).values;
assert.equal(field.div, 0);
assert.ok(isClose(field.rot, -4, 1e-12));

const mlt = solvers.dimensionsMLT({ ok: 1 }).values;
assert.equal(mlt.pT, -3);
assert.equal(mlt.tL, 0);
assert.equal(mlt.gL, -2);

const pend = solvers.pendulumPi({ ok: 1 }).values;
assert.ok(isClose(pend.a, 0.5, 1e-12));
assert.ok(isClose(pend.b, -0.5, 1e-12));
assert.equal(pend.c, 0);

const prop = solvers.propellerPi({ ok: 1 }).values;
assert.equal(prop.a, 1);
assert.equal(prop.b, 3);
assert.equal(prop.c, 5);

const moody = solvers.moodyRead({ Re: 200000, epsRel: 0.00075 }).values;
assert.ok(moody.f > 0.018 && moody.f < 0.025);
assert.ok(moody.fInf > 0.015 && moody.fInf < 0.025);

const venturiK = solvers.venturi({ D1: 250, D2: 125, dpK: 20, rho: 1000 }).values;
assert.ok(venturiK.Q > 0.05 && venturiK.Q < 0.2);
assert.ok(isClose(venturiK.V2, venturiK.V1 * 4, 1e-12));

assert.ok(isClose(100.024, 100));
assert.ok(!isClose(103, 100));
console.log("✓ Assertions métier validées");
