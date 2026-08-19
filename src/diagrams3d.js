import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { SOLVER_FAMILY, familyForSolver, hasWebGLView } from "./diagrams3d-families.js";

export { SOLVER_FAMILY, familyForSolver, hasWebGLView };

/* ── colour palette ──────────────────────────────────────────────── */
const PAL = Object.freeze({
  water:      0x0077be,
  waterLight: 0x4db2d6,
  waterDeep:  0x004d80,
  metal:      0x64748b,
  metalDark:  0x334155,
  concrete:   0x94a3b8,
  pump:       0x075985,
  turbine:    0x0f766e,
  force:      0xe63946,
  egl:        0xe63946,
  hgl:        0x0077be,
  foam:       0xf8fafc,
  oil:        0xb45309,
  wood:       0xb45309,
  ice:        0xe2e8f0,
  hull:       0xcbd5e1,
  sky:        0xd9edf7,
  ground:     0xd5e7f2,
  sunWarm:    0xfff4e6,
});

const G = 9.81;
const REDUCE = typeof matchMedia === "function" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;
const TWO_PI = Math.PI * 2;
const HALF_PI = Math.PI / 2;

/* ── math helpers ────────────────────────────────────────────────── */
const num = (v, fallback = 0) => {
  const x = +v;
  return Number.isFinite(x) ? x : fallback;
};
const fmt = (v, digits = 3) =>
  Number.isFinite(+v)
    ? Number(v).toLocaleString("fr-FR", { maximumSignificantDigits: digits })
    : "—";
const mm = v => num(v) / 1000;
const circleArea = d => Math.PI * d * d / 4;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp = (a, b, t) => a + (b - a) * t;

/* ── WebGL probe ─────────────────────────────────────────────────── */
function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch { return false; }
}

function resolveContainer(id) {
  if (id && typeof id === "object" && id.nodeType === 1) return id;
  return document.getElementById(String(id));
}

/* ── GPU disposal ────────────────────────────────────────────────── */
function disposeGpu(root) {
  if (!root) return;
  root.traverse(obj => {
    obj.geometry?.dispose();
    const mats = obj.material
      ? (Array.isArray(obj.material) ? obj.material : [obj.material])
      : [];
    for (const mat of mats) {
      if (!mat) continue;
      for (const key of Object.keys(mat)) {
        const v = mat[key];
        if (v?.isTexture) v.dispose();
      }
      mat.dispose();
    }
  });
}

/* ── Material factory (cached per-engine lifecycle) ──────────────── */
class MaterialCache {
  constructor() { this._cache = new Map(); }

  _key(type, color, opts) {
    return `${type}:${color}:${JSON.stringify(opts)}`;
  }

  metal(color = PAL.metal, extra = {}) {
    const k = this._key("metal", color, extra);
    if (this._cache.has(k)) return this._cache.get(k);
    const m = new THREE.MeshStandardMaterial({
      color, metalness: 0.32, roughness: 0.45, ...extra,
    });
    this._cache.set(k, m);
    return m;
  }

  water(opacity = 0.78) {
    const k = `water:${opacity}`;
    if (this._cache.has(k)) return this._cache.get(k);
    const m = new THREE.MeshPhysicalMaterial({
      color: PAL.water,
      transparent: true,
      opacity,
      roughness: 0.15,
      metalness: 0.02,
      transmission: 0.12,
      thickness: 0.4,
      depthWrite: true,
      clearcoat: 0.25,
      clearcoatRoughness: 0.3,
    });
    this._cache.set(k, m);
    return m;
  }

  concrete(extra = {}) {
    return this.metal(PAL.concrete, { metalness: 0.06, roughness: 0.82, ...extra });
  }

  dispose() {
    for (const m of this._cache.values()) m.dispose();
    this._cache.clear();
  }
}

/* ── Geometry helpers ────────────────────────────────────────────── */
function pipeMesh(x0, x1, rStart, rEnd, material) {
  const len = Math.max(Math.abs(x1 - x0), 0.05);
  const geo = new THREE.CylinderGeometry(rEnd, rStart, len, 32, 1, false);
  const mesh = new THREE.Mesh(geo, material);
  mesh.rotation.z = HALF_PI;
  mesh.position.set((x0 + x1) / 2, 0, 0);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function makeParticles(count, color, size) {
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color,
    size,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return { points, positions, geo, count };
}

function ribbon(samples, color, opacity = 0.35, zWidth = 0.28) {
  const geo = new THREE.BufferGeometry();
  const verts = [];
  const idx = [];
  for (let i = 0; i < samples.length; i++) {
    const p = samples[i];
    verts.push(p.x, p.y, -zWidth / 2, p.x, p.y, zWidth / 2);
    if (i) {
      const a = (i - 1) * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    color, transparent: true, opacity, side: THREE.DoubleSide,
    depthWrite: false, roughness: 0.35,
  }));
}

function pressurePrism(H, width, scale) {
  const geo = new THREE.BufferGeometry();
  const w = width / 2;
  const p = H * scale;
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array([
    0, H, -w,  0, 0, -w,  p, 0, -w,
    0, H,  w,  0, 0,  w,  p, 0,  w,
  ]), 3));
  geo.setIndex([0, 1, 2,  3, 5, 4,  0, 3, 4,  0, 4, 1,  1, 4, 5,  1, 5, 2,  0, 2, 5,  0, 5, 3]);
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    color: PAL.force, transparent: true, opacity: 0.45,
    side: THREE.DoubleSide, depthWrite: false,
  }));
}

/* ── 2D overlay (HTML labels projected from 3D world) ────────────── */
class Overlay2D {
  constructor(host) {
    this.host = host;
    this.layer = host.querySelector(".diagram-fs-labels");
    if (!this.layer) {
      this.layer = document.createElement("div");
      this.layer.className = "diagram-fs-labels";
      this.layer.setAttribute("aria-hidden", "true");
      host.appendChild(this.layer);
    }
    this.items = [];
    this.nodes = [];
    this._ndc = new THREE.Vector3();
    this.width = 1;
    this.height = 1;
  }

  resize(w, h) { this.width = w; this.height = h; }

  setItems(items) {
    this.items = items || [];
    this.layer.innerHTML = this.items.map((item, i) =>
      `<span class="diagram-fs-label${item.tone ? ` is-${item.tone}` : ""}" data-i="${i}">${item.text}</span>`
    ).join("");
    this.nodes = [...this.layer.children];
  }

  update(camera) {
    if (!this.nodes) return;
    for (let i = 0; i < this.items.length; i++) {
      const el = this.nodes[i];
      const world = this.items[i]?.world;
      if (!el || !world) continue;
      this._ndc.copy(world).project(camera);
      const behind = this._ndc.z > 1;
      el.style.display = behind ? "none" : "";
      if (behind) continue;
      el.style.left = `${(this._ndc.x * 0.5 + 0.5) * this.width}px`;
      el.style.top = `${(-this._ndc.y * 0.5 + 0.5) * this.height}px`;
    }
  }

  clear() {
    this.items = [];
    this.nodes = [];
    this.layer.innerHTML = "";
  }
}

/* ── SceneManager3D ──────────────────────────────────────────────── */
export class SceneManager3D {
  constructor(container, renderCallback) {
    this.container = resolveContainer(container);
    if (!this.container) throw new Error("Canevas 3D : conteneur introuvable.");
    if (!webglAvailable()) throw new Error("WebGL indisponible.");

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(PAL.sky);
    this.scene.fog = new THREE.FogExp2(PAL.sky, 0.018);

    this.camera = new THREE.PerspectiveCamera(46, 1, 0.08, 120);
    this.camera.position.set(8.4, 6.2, 12);
    this._targetPos = new THREE.Vector3(8.4, 6.2, 12);
    this._targetLook = new THREE.Vector3(0, 1.5, 0);
    this._lerpSpeed = 0;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(clamp(window.devicePixelRatio || 1, 1, 2));
    this.renderer.setClearColor(PAL.sky, 1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    const canvas = this.renderer.domElement;
    canvas.style.cssText = "display:block;width:100%;height:100%;position:absolute;inset:0";
    canvas.setAttribute("aria-label", "Schéma 3D interactif");
    this.container.appendChild(canvas);

    this.content = new THREE.Group();
    this.scene.add(this.content);

    this._setupLighting();
    this._setupGround();

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 42;
    this.controls.maxPolarAngle = Math.PI * 0.48;
    this.controls.target.set(0, 1.5, 0);
    this.controls.update();

    this.callback = renderCallback || null;
    this.clock = new THREE.Clock();
    this.running = true;
    this.raf = 0;
    this.overlay = new Overlay2D(this.container);

    this._resize = () => this.resize();
    this.ro = new ResizeObserver(this._resize);
    this.ro.observe(this.container);
    window.addEventListener("resize", this._resize);

    this._onVis = () => {
      if (document.hidden) {
        cancelAnimationFrame(this.raf);
        this.raf = 0;
      } else if (this.running && !this.raf) {
        this.clock.getDelta();
        this.tick();
      }
    };
    document.addEventListener("visibilitychange", this._onVis);

    this._onCtxLost = e => { e.preventDefault(); this.running = false; cancelAnimationFrame(this.raf); };
    this._onCtxRestored = () => { this.running = true; this.clock.getDelta(); this.tick(); };
    canvas.addEventListener("webglcontextlost", this._onCtxLost);
    canvas.addEventListener("webglcontextrestored", this._onCtxRestored);

    this.resize();
    this.tick();
  }

  _setupLighting() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.55));

    const sun = new THREE.DirectionalLight(PAL.sunWarm, 1.15);
    sun.position.set(8, 18, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.radius = 3;
    sun.shadow.bias = -0.0003;
    const sc = sun.shadow.camera;
    sc.near = 1; sc.far = 50;
    sc.left = -18; sc.right = 18; sc.top = 14; sc.bottom = -10;
    this.scene.add(sun);

    const fill = new THREE.DirectionalLight(0xdbeafe, 0.28);
    fill.position.set(-6, 4, -8);
    this.scene.add(fill);

    this.scene.add(new THREE.HemisphereLight(0xdbeafe, PAL.ground, 0.35));
  }

  _setupGround() {
    const geo = new THREE.PlaneGeometry(80, 80);
    const mat = new THREE.MeshStandardMaterial({
      color: PAL.ground, roughness: 0.9, metalness: 0,
    });
    const ground = new THREE.Mesh(geo, mat);
    ground.rotation.x = -HALF_PI;
    ground.position.y = -0.02;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  setRender(fn) { this.callback = fn; }

  setCamera(position, target, smooth = true) {
    this._targetPos.set(position.x, position.y, position.z);
    this._targetLook.set(target.x, target.y, target.z);
    if (!smooth) {
      this.camera.position.copy(this._targetPos);
      this.controls.target.copy(this._targetLook);
      this.controls.update();
    }
    this._lerpSpeed = smooth ? 3.2 : 0;
  }

  resize() {
    const rect = this.container.getBoundingClientRect();
    let w = Math.floor(rect.width) || this.container.clientWidth;
    let h = Math.floor(rect.height) || this.container.clientHeight;
    if (w < 32) w = window.innerWidth || 320;
    if (h < 32) h = Math.floor((window.innerHeight || 600) * 0.72);
    w = Math.max(w, 320);
    h = Math.max(h, 240);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.overlay.resize(w, h);
  }

  clearScene() {
    disposeGpu(this.content);
    this.content.clear();
    this.overlay.clear();
  }

  tick = () => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.tick);
    if (document.hidden) return;
    const dt = Math.min(this.clock.getDelta(), 0.05);

    if (this._lerpSpeed > 0) {
      const t = 1 - Math.exp(-this._lerpSpeed * dt);
      this.camera.position.lerp(this._targetPos, t);
      this.controls.target.lerp(this._targetLook, t);
      if (this.camera.position.distanceTo(this._targetPos) < 0.01) {
        this.camera.position.copy(this._targetPos);
        this.controls.target.copy(this._targetLook);
        this._lerpSpeed = 0;
      }
    }

    this.controls.update();
    this.callback?.(dt, this.clock.elapsedTime, this);
    this.overlay.update(this.camera);
    this.renderer.render(this.scene, this.camera);
  };

  dispose() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    document.removeEventListener("visibilitychange", this._onVis);
    this.ro.disconnect();
    window.removeEventListener("resize", this._resize);
    const canvas = this.renderer.domElement;
    canvas.removeEventListener("webglcontextlost", this._onCtxLost);
    canvas.removeEventListener("webglcontextrestored", this._onCtxRestored);
    this.controls.dispose();
    this.overlay.clear();
    disposeGpu(this.scene);
    this.renderer.dispose();
    this.renderer.forceContextLoss?.();
    canvas.remove();
  }
}

/* ── Hydraulic 3D engine ─────────────────────────────────────────── */
const FAMILY_BUILDERS = { pipe: "buildPipeSystem", channel: "buildOpenChannel", gate: "buildGateAndDam", float: "buildFloatingBody" };

export class Hydraulic3DEngine {
  constructor() {
    this.manager = null;
    this.solver = null;
    this.animate = null;
    this.materials = new MaterialCache();
  }

  render(containerId, diagramType, params = {}) {
    const family = SOLVER_FAMILY[diagramType] || diagramType;
    const builder = FAMILY_BUILDERS[family];
    if (!builder) return false;
    const host = resolveContainer(containerId);
    if (!host) return false;

    if (!this.manager || this.manager.container !== host || !this.manager.renderer.domElement.isConnected) {
      this.dispose();
      host.querySelector("canvas")?.remove();
      this.manager = new SceneManager3D(host);
    }
    this.manager.clearScene();
    this.solver = diagramType;

    const pack = paramsFromSolver(diagramType, params);
    const built = this[builder](pack);

    this.animate = built.animate || null;
    this.manager.overlay.setItems(built.labels || []);
    this.manager.setCamera(built.camera, built.target);
    this.manager.setRender((dt, t) => this.animate?.(dt, t));
    return true;
  }

  clearScene() {
    this.animate = null;
    this.manager?.clearScene();
  }

  /* ── Pipe system ──────────────────────────────────────── */
  buildPipeSystem(p) {
    const group = this.manager.content;
    const mat = this.materials;
    const L = p.length;
    const r1 = p.r1, r2 = p.r2;
    const pipeMat = mat.metal(p.kind === "oil" ? PAL.oil : PAL.metal);
    const x0 = -L / 2, x1 = L / 2;

    if (p.kind === "elbow") {
      group.add(pipeMesh(x0, 0.2, r1, r1, pipeMat));
      const vert = pipeMesh(0, 2.4, r1, r1, pipeMat);
      vert.rotation.set(0, 0, 0);
      vert.position.set(0.2, 1.2, 0);
      group.add(vert);
      const joint = new THREE.Mesh(
        new THREE.SphereGeometry(r1 * 1.08, 16, 14),
        pipeMat,
      );
      joint.position.set(0.2, 0, 0);
      joint.castShadow = true;
      group.add(joint);
    } else if (p.kind === "venturi" || p.kind === "convergent" || p.kind === "enlargement") {
      group.add(pipeMesh(x0, -0.4, r1, r1, pipeMat));
      group.add(pipeMesh(-0.4, 0.4, r1, r2, pipeMat));
      group.add(pipeMesh(0.4, x1, r2, r2, pipeMat));
    } else {
      group.add(pipeMesh(x0, x1, r1, r2, pipeMat));
    }

    if (p.kind === "pump" || p.kind === "turbine") {
      const color = p.kind === "turbine" ? PAL.turbine : PAL.pump;
      const rHouse = Math.max(r1, 0.28) * 1.7;
      const housing = new THREE.Mesh(
        new THREE.SphereGeometry(rHouse, 24, 18),
        mat.metal(color),
      );
      housing.castShadow = true;
      group.add(housing);
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(rHouse * 0.85, 0.04, 8, 28),
        mat.metal(PAL.metalDark),
      );
      ring.rotation.y = HALF_PI;
      group.add(ring);
    }

    if (p.tanks) {
      for (const tank of p.tanks) {
        const shell = new THREE.Mesh(
          new THREE.BoxGeometry(tank.w, tank.h, tank.d),
          mat.concrete({ transparent: true, opacity: 0.28, side: THREE.DoubleSide }),
        );
        shell.position.set(tank.x, tank.h / 2, 0);
        group.add(shell);
        const fill = new THREE.Mesh(
          new THREE.BoxGeometry(tank.w * 0.88, tank.water, tank.d * 0.88),
          mat.water(0.72),
        );
        fill.position.set(tank.x, tank.water / 2 + 0.04, 0);
        group.add(fill);
      }
    }

    const eglH = 1.35 + 0.9 * p.headNorm;
    const hglH = eglH - 0.45;
    const eglPts = [{ x: x0, y: eglH }, { x: p.kind === "pump" ? -0.15 : x1 * 0.2, y: eglH }];
    if (p.kind === "pump") {
      eglPts.push({ x: 0.15, y: eglH + 1.1 }, { x: x1, y: eglH + 1.1 });
    } else {
      eglPts.push({ x: x1, y: eglH - (p.losses ? 0.55 : 0.12) });
    }
    const hglPts = eglPts.map(pt => ({
      x: pt.x, y: pt.y - (hglH > 0.3 ? 0.42 : 0.25),
    }));
    group.add(ribbon(eglPts, PAL.egl, 0.38));
    group.add(ribbon(hglPts, PAL.hgl, 0.34));

    const particles = makeParticles(220, PAL.waterLight, 0.095);
    group.add(particles.points);
    const speed = (0.12 + 0.04 * p.speed) * (REDUCE ? 0.2 : 1);

    return {
      camera: { x: 0.4, y: 4.6, z: 11.2 },
      target: { x: 0, y: 1.1, z: 0 },
      labels: [
        { text: `D = ${fmt(p.Dmm)} mm`, world: new THREE.Vector3(x0, r1 + 0.55, 0), tone: "water" },
        p.D2mm && p.D2mm !== p.Dmm
          ? { text: `D₂ = ${fmt(p.D2mm)} mm`, world: new THREE.Vector3(x1, r2 + 0.55, 0), tone: "water" }
          : null,
        p.Q != null
          ? { text: `Q = ${fmt(p.Q)} ${p.qUnit}`, world: new THREE.Vector3(0, -0.7, 0) }
          : null,
        p.V != null
          ? { text: `V = ${fmt(p.V)} m/s`, world: new THREE.Vector3(L * 0.22, r1 + 0.9, 0), tone: "water" }
          : null,
        p.H != null
          ? { text: `H = ${fmt(p.H)} m`, world: new THREE.Vector3(0, eglH + 0.35, 0), tone: "force" }
          : null,
        { text: "EGL", world: new THREE.Vector3(x0 + 0.4, eglH + 0.18, 0), tone: "force" },
        { text: "HGL", world: new THREE.Vector3(x0 + 0.4, hglPts[0].y + 0.18, 0), tone: "water" },
      ].filter(Boolean),
      animate: (dt, t) => {
        for (let i = 0; i < particles.count; i++) {
          const s = (i / particles.count + t * speed) % 1;
          const x = x0 + s * L;
          const angle = (i * 2.399) % TWO_PI;
          const rSpread = (p.kind === "elbow" && x > 0.15)
            ? r1 * 0.35
            : lerp(r1, r2, s) * 0.4;
          let y = Math.cos(angle) * rSpread;
          let z = Math.sin(angle) * rSpread;
          if (p.kind === "elbow" && x > 0.15) {
            y += (x - 0.15) * 0.9;
          }
          particles.positions[i * 3] = x;
          particles.positions[i * 3 + 1] = y;
          particles.positions[i * 3 + 2] = z;
        }
        particles.geo.attributes.position.needsUpdate = true;
      },
    };
  }

  /* ── Open channel ─────────────────────────────────────── */
  buildOpenChannel(p) {
    const group = this.manager.content;
    const mat = this.materials;
    const L = p.length;
    const b = p.bVis;
    const wall = p.wall;
    const zSlope = p.z;
    const t = 0.14;
    const half = b / 2;
    const topHalf = half + zSlope * wall;

    const shape = new THREE.Shape();
    shape.moveTo(-topHalf - t, 0);
    shape.lineTo(topHalf + t, 0);
    shape.lineTo(topHalf + t, wall);
    shape.lineTo(topHalf, wall);
    shape.lineTo(half, t);
    shape.lineTo(-half, t);
    shape.lineTo(-topHalf, wall);
    shape.lineTo(-topHalf - t, wall);
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, { depth: L, bevelEnabled: false, steps: 1 });
    geo.rotateY(HALF_PI);
    geo.translate(0, 0, -L / 2);
    const canal = new THREE.Mesh(geo, mat.metal(PAL.metalDark, { metalness: 0.1, roughness: 0.72 }));
    canal.castShadow = true;
    canal.receiveShadow = true;
    group.add(canal);

    const nx = 64, nz = 10;
    const surf = new THREE.PlaneGeometry(L, b * 0.92, nx, nz);
    surf.rotateX(-HALF_PI);
    const waterMesh = new THREE.Mesh(surf, mat.water(0.82));
    waterMesh.receiveShadow = true;
    group.add(waterMesh);

    const hasFoam = p.kind === "jump" || p.kind === "ritter";
    const foam = hasFoam ? makeParticles(140, PAL.foam, 0.1) : null;
    if (foam) group.add(foam.points);

    const heightAt = (x, time) => {
      if (p.kind === "jump") {
        const a = -p.Lr * 0.42, c = p.Lr * 0.58;
        if (x < a) return p.y1;
        if (x > c) return p.y2 + 0.02 * Math.sin(x * 2 + time * 1.5);
        const u = (x - a) / (c - a);
        const base = p.y1 + (p.y2 - p.y1) * (u * u * (3 - 2 * u));
        return base + Math.sin(u * Math.PI) * (p.y2 - p.y1) * 0.32
          * (0.7 + 0.3 * Math.sin(time * 7 + x * 5));
      }
      if (p.kind === "ritter") {
        const tau = 0.25 + ((time * (REDUCE ? 0.15 : 0.45)) % 5.2);
        const xPhys = x / p.scale;
        const h0 = p.h0;
        const c0 = Math.sqrt(G * h0);
        if (xPhys <= -c0 * tau) return h0 * p.scale;
        if (xPhys >= 2 * c0 * tau) return 0.02;
        const cc = (2 * c0 - xPhys / tau) / 3;
        return Math.max((cc * cc) / G * p.scale, 0.02);
      }
      if (p.kind === "weir") {
        const drop = Math.max(0, 0.55 - Math.abs(x));
        return p.y1 - drop * 0.85;
      }
      return p.y1 + (p.y2 - p.y1) * (x / L + 0.5);
    };

    const morph = time => {
      const pos = waterMesh.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const h = heightAt(x, time);
        const ripple = REDUCE ? 0 : 0.008 * Math.sin(x * 4 + time * 2.5 + z * 3);
        pos.setY(i, h + ripple);
      }
      pos.needsUpdate = true;
      waterMesh.geometry.computeVertexNormals();

      if (!foam) return;
      for (let i = 0; i < foam.count; i++) {
        const x = p.kind === "ritter"
          ? (i / foam.count) * L * 0.45
          : (i / foam.count - 0.5) * p.Lr;
        foam.positions[i * 3] = x;
        foam.positions[i * 3 + 1] = heightAt(x, time) + 0.08 + 0.05 * Math.sin(time * 6 + i);
        foam.positions[i * 3 + 2] = ((i % 8) - 3.5) * 0.22;
      }
      foam.geo.attributes.position.needsUpdate = true;
    };
    morph(0);

    return {
      camera: { x: 1.1, y: 6.2, z: 13.4 },
      target: { x: 0, y: 1.2, z: 0 },
      labels: [
        { text: `b = ${fmt(p.b)} m`, world: new THREE.Vector3(0, 0.2, b / 2 + 0.4) },
        {
          text: p.kind === "jump" ? `y₁ = ${fmt(p.y1raw)} m` : `y = ${fmt(p.y1raw)} m`,
          world: new THREE.Vector3(-L * 0.32, p.y1 + 0.7, 0), tone: "water",
        },
        p.kind === "jump"
          ? { text: `y₂ = ${fmt(p.y2raw)} m`, world: new THREE.Vector3(L * 0.28, p.y2 + 0.55, 0), tone: "water" }
          : null,
        p.Q != null
          ? { text: `Q = ${fmt(p.Q)} m³/s`, world: new THREE.Vector3(0, wall + 0.35, 0) }
          : null,
        p.kind === "ritter"
          ? { text: "front 2√(gh₀)", world: new THREE.Vector3(L * 0.28, 1.6, 0), tone: "force" }
          : null,
      ].filter(Boolean),
      animate: (dt, t) => morph(REDUCE ? 0 : t),
    };
  }

  /* ── Gate / dam ───────────────────────────────────────── */
  buildGateAndDam(p) {
    const group = this.manager.content;
    const mat = this.materials;
    const H = p.Hvis;
    const B = p.Bvis;

    const wallMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, H + 1.1, B + 0.8),
      mat.concrete(),
    );
    wallMesh.position.set(0, (H + 1.1) / 2, 0);
    wallMesh.castShadow = true;
    wallMesh.receiveShadow = true;
    group.add(wallMesh);

    if (p.kind === "circular") {
      const disk = new THREE.Mesh(
        new THREE.CylinderGeometry(p.radius, p.radius, 0.12, 36),
        mat.metal(PAL.metalDark),
      );
      disk.rotation.z = HALF_PI;
      disk.position.set(-0.22, p.yc, 0);
      disk.castShadow = true;
      group.add(disk);
    } else if (p.kind === "segment") {
      const seg = new THREE.Mesh(
        new THREE.CylinderGeometry(H * 0.7, H * 0.7, B * 0.7, 28, 1, false, 0, HALF_PI),
        mat.metal(PAL.metal),
      );
      seg.rotation.z = Math.PI;
      seg.position.set(-0.05, 0, 0);
      seg.castShadow = true;
      group.add(seg);
    } else {
      const gate = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, p.gateH, p.gateW),
        mat.metal(PAL.metalDark),
      );
      gate.position.set(-0.28, p.gateY, 0);
      gate.castShadow = true;
      group.add(gate);
    }

    const waterBox = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, H, B),
      mat.water(0.65),
    );
    waterBox.position.set(-2.3, H / 2, 0);
    group.add(waterBox);

    if (p.dual) {
      const down = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, p.H2, B),
        mat.water(0.5),
      );
      down.position.set(1.9, p.H2 / 2, 0);
      group.add(down);
    }

    const prism = pressurePrism(H, B * 0.55, p.pScale);
    prism.position.set(-0.45, 0, 0);
    group.add(prism);

    const arrow = new THREE.ArrowHelper(
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(-0.5, p.zC, 0),
      1.6, PAL.force, 0.28, 0.2,
    );
    group.add(arrow);

    return {
      camera: { x: -6.8, y: 4.8, z: 9.4 },
      target: { x: -1.2, y: H * 0.45, z: 0 },
      labels: [
        { text: `H = ${fmt(p.Hraw)} m`, world: new THREE.Vector3(-4.2, H + 0.35, 0), tone: "water" },
        { text: "F", world: new THREE.Vector3(-2.2, p.zC, 0), tone: "force" },
        { text: `z_C = H/3`, world: new THREE.Vector3(-0.2, p.zC + 0.45, 0), tone: "force" },
      ],
      animate: () => {},
    };
  }

  /* ── Floating body ────────────────────────────────────── */
  buildFloatingBody(p) {
    const group = this.manager.content;
    const mat = this.materials;

    const tank = new THREE.Mesh(
      new THREE.BoxGeometry(p.tankL, p.tankH, p.tankB),
      mat.concrete({ transparent: true, opacity: 0.22, side: THREE.DoubleSide }),
    );
    tank.position.set(0, p.tankH / 2, 0);
    group.add(tank);

    const waterM = new THREE.Mesh(
      new THREE.BoxGeometry(p.tankL * 0.94, p.wl, p.tankB * 0.94),
      mat.water(0.6),
    );
    waterM.position.set(0, p.wl / 2, 0);
    group.add(waterM);

    const body = new THREE.Group();
    let hull;
    if (p.kind === "log") {
      hull = new THREE.Mesh(
        new THREE.CylinderGeometry(p.radius, p.radius, p.len, 20),
        mat.metal(PAL.wood, { metalness: 0.05, roughness: 0.8 }),
      );
      hull.rotation.z = HALF_PI;
    } else if (p.kind === "iceberg") {
      hull = new THREE.Mesh(
        new THREE.ConeGeometry(p.Bvis * 0.7, p.Hvis, 6),
        mat.metal(PAL.ice, { metalness: 0.1, roughness: 0.35 }),
      );
    } else {
      hull = new THREE.Mesh(
        new THREE.BoxGeometry(p.len, p.Hvis, p.Bvis),
        mat.metal(PAL.hull, { metalness: 0.12, roughness: 0.55 }),
      );
    }
    hull.castShadow = true;
    body.add(hull);
    body.position.set(0, p.Te, 0);
    body.rotation.z = p.theta;
    group.add(body);

    const marker = color => new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 14, 12),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.3 }),
    );
    const Bpt = marker(0x0369a1); Bpt.position.set(0, p.zB, 0);
    const Gpt = marker(0x0f172a); Gpt.position.set(0.02, p.zG, 0);
    const Mpt = marker(PAL.force); Mpt.position.set(0, p.zM, 0);
    group.add(Bpt, Gpt, Mpt);

    return {
      camera: { x: 7.2, y: 5.4, z: 9.5 },
      target: { x: 0, y: p.wl * 0.6, z: 0 },
      labels: [
        { text: `Tₑ = ${fmt(p.TeRaw)} m`, world: new THREE.Vector3(p.len * 0.4, p.Te * 0.5, p.Bvis * 0.4), tone: "water" },
        { text: "B", world: new THREE.Vector3(0.35, p.zB, 0), tone: "water" },
        { text: "G", world: new THREE.Vector3(0.35, p.zG, 0) },
        { text: "M", world: new THREE.Vector3(0.35, p.zM, 0), tone: "force" },
        Number.isFinite(p.GM)
          ? { text: `GM = ${fmt(p.GM)} m`, world: new THREE.Vector3(-p.len * 0.35, p.zM + 0.4, 0) }
          : null,
      ].filter(Boolean),
      animate: (dt, t) => {
        if (REDUCE) return;
        body.rotation.z = p.theta + 0.025 * Math.sin(t * 1.3);
      },
    };
  }

  dispose() {
    this.animate = null;
    this.materials.dispose();
    this.manager?.dispose();
    this.manager = null;
  }
}

/* ── Parameter normalizers ───────────────────────────────────────── */
function paramsFromSolver(solver, d) {
  const family = SOLVER_FAMILY[solver] || solver;
  if (family === "pipe") return pipeParams(solver, d);
  if (family === "channel") return channelParams(solver, d);
  if (family === "gate") return gateParams(solver, d);
  return floatParams(solver, d);
}

function pipeParams(solver, d) {
  const Dmm = num(d.D, num(d.D1, num(d.d, 200)));
  const D2mm = num(d.D2, num(d.d, Dmm));
  const D = Math.max(Dmm > 20 ? mm(Dmm) : Dmm, 0.04);
  const D2 = Math.max(D2mm > 20 ? mm(D2mm) : D2mm, 0.03);
  const Lraw = num(d.L, num(d.Lkm, 12));
  const L = Lraw > 80 ? 10 : clamp(Lraw, 4, 14);
  const Qraw = num(d.Q, NaN);
  const Qsi = Number.isFinite(Qraw) ? (Qraw > 5 ? Qraw / 1000 : Qraw) : NaN;
  const V = num(d.V, num(d.V1, Number.isFinite(Qsi) ? Qsi / Math.max(circleArea(D), 1e-6) : 1.2));
  const H = num(d.head, num(d.H, num(d.Hg, null)));

  let kind = "straight";
  if (/venturi/i.test(solver)) kind = "venturi";
  else if (/elbow/i.test(solver)) kind = "elbow";
  else if (/convergent|enlargement|borda|gradual/i.test(solver)) kind = "convergent";
  else if (/pump|npsh|duty/i.test(solver)) kind = "pump";
  else if (/turbine/i.test(solver)) kind = "turbine";
  else if (/oil/i.test(solver)) kind = "oil";
  else if (/siphon/i.test(solver)) kind = "siphon";

  const hasTanks = kind === "pump" || kind === "turbine" || kind === "siphon";
  const tanks = hasTanks ? [
    { x: -L / 2 - 1.3, w: 2.1, h: 2.2, d: 2.1, water: 1.15 },
    { x: L / 2 + 1.3, w: 2.1, h: 2.0, d: 2.1, water: 1.0 },
  ] : null;

  return {
    kind, length: L,
    r1: Math.max(D * 2.8, 0.16), r2: Math.max(D2 * 2.8, 0.12),
    Dmm, D2mm,
    Q: Number.isFinite(Qraw) ? Qraw : null,
    qUnit: Qraw > 5 ? "L/s" : "m³/s",
    V, H: Number.isFinite(H) ? H : null,
    losses: num(d.losses, 0),
    headNorm: Math.min(num(H, 20) / 40, 1),
    speed: Math.min(Math.abs(V), 6),
    tanks,
  };
}

function channelParams(solver, d) {
  const y1raw = num(d.y1, num(d.y, num(d.h, num(d.h0, 1))));
  const V1 = num(d.V1, num(d.V, 1.4));
  const Fr1 = V1 / Math.sqrt(G * Math.max(y1raw, 0.05));
  const y2raw = /jump/i.test(solver)
    ? 0.5 * y1raw * (-1 + Math.sqrt(1 + 8 * Fr1 ** 2))
    : num(d.y2, y1raw);
  const yMax = Math.max(y1raw, y2raw, 0.4);
  const scale = 2.2 / yMax;

  let kind = "uniform";
  if (/jump/i.test(solver)) kind = "jump";
  else if (/ritter|damBreak/i.test(solver)) kind = "ritter";
  else if (/weir|spill/i.test(solver)) kind = "weir";

  return {
    kind,
    b: num(d.b, 3),
    bVis: clamp(num(d.b, 3) * 0.9, 2.4, 4.2),
    z: num(d.z, 0),
    y1: y1raw * scale, y2: y2raw * scale,
    y1raw, y2raw,
    wall: Math.max(y2raw, y1raw) * scale + 0.7,
    length: 12,
    Lr: clamp(6 * y2raw * scale * 0.22, 2.2, 4.8),
    Q: num(d.Q, null),
    h0: num(d.h0, y1raw),
    scale, V1,
  };
}

function gateParams(solver, d) {
  const Hraw = num(d.H, num(d.hSill, num(d.y1, 4)));
  const scale = 2.6 / Math.max(Hraw, 0.8);
  const Hvis = Hraw * scale;

  let kind = "plane";
  if (/circular/i.test(solver)) kind = "circular";
  else if (/quarter|segment|curved/i.test(solver)) kind = "segment";
  else if (/sluice/i.test(solver)) kind = "sluice";
  else if (/lock/i.test(solver)) kind = "lock";
  else if (/dual/i.test(solver)) kind = "dual";
  else if (/wall|retain/i.test(solver)) kind = "wall";

  return {
    kind, Hraw, Hvis, Bvis: 3.2, pScale: 0.42,
    zC: Hvis / 3,
    gateH: kind === "sluice" ? Hvis * 0.28 : Hvis * 0.72,
    gateW: 2.2,
    gateY: kind === "sluice" ? Hvis * 0.18 : Hvis * 0.5,
    radius: num(d.D, 1.2) * 0.35,
    yc: Hvis * 0.45,
    H2: num(d.y2, num(d.h, Hraw * 0.45)) * scale,
    dual: kind === "dual" || kind === "lock",
  };
}

function floatParams(solver, d) {
  const TeRaw = num(d.draft, num(d.Te, 1.2));
  const L = num(d.L, 12);
  const B = num(d.B, 5);
  const zG = num(d.zG, num(d.KG, TeRaw * 1.1));
  const volume = Math.max(L * B * TeRaw, 1);
  const BM = (L * B ** 3 / 12) / volume;
  const zB = TeRaw / 2;
  const GM = zB + BM - zG;
  const scale = 3.2 / Math.max(B, 3);

  let kind = "barge";
  if (/log|wood/i.test(solver)) kind = "log";
  else if (/ice/i.test(solver)) kind = "iceberg";
  else if (/caisson|cofferdam/i.test(solver)) kind = "caisson";

  return {
    kind, TeRaw,
    Te: TeRaw * scale,
    len: Math.min(L * 0.28, 4.4),
    Bvis: Math.min(B * 0.45, 2.4),
    Hvis: Math.max(TeRaw * scale * 1.7, 1.1),
    tankL: 7.2, tankB: 5.2, tankH: 3.4,
    wl: 1.35, theta: 0.12,
    zB: zB * scale, zG: zG * scale, zM: (zB + BM) * scale,
    GM, radius: 0.55,
  };
}

/* ── Singleton + public API ──────────────────────────────────────── */
let engine = null;

export function webglOk() { return webglAvailable(); }

export function createWebGLCanvas(containerId, renderCallback) {
  return new SceneManager3D(containerId, renderCallback);
}

export function render3DDiagram(containerId, diagramType, params) {
  if (!webglAvailable()) return false;
  if (!engine) engine = new Hydraulic3DEngine();
  return engine.render(containerId, diagramType, params);
}

export function clearScene() {
  engine?.clearScene();
}

export function disposeWebGL() {
  engine?.dispose();
  engine = null;
}

export function isWebGLMounted() {
  return Boolean(engine?.manager?.renderer?.domElement?.isConnected);
}

export function mountWebGLFigure(containerId, solver, data) {
  return render3DDiagram(containerId, solver, data);
}

export function updateWebGLFigure(data) {
  if (!engine?.solver) return false;
  return render3DDiagram(engine.manager.container, engine.solver, data);
}

export function mountOrUpdate(containerId, solver, data) {
  return render3DDiagram(containerId, solver, data);
}
