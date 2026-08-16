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

assert.ok(isClose(100.024, 100));
assert.ok(!isClose(103, 100));
console.log("✓ 12 assertions métier validées");
