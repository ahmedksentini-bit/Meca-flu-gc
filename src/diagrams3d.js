import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const WATER = 0x0077be;
const WATER_LIGHT = 0x4db2d6;
const METAL = 0x64748b;
const METAL_DARK = 0x334155;
const CONCRETE = 0x94a3b8;
const PUMP = 0x075985;
const FORCE = 0xe63946;
const FOAM = 0xf0f9ff;
const G = 9.81;
const REDUCE = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

const WEBGL_FIGURES = {
  hydraulicPower: hydraulicPower3D,
  hydraulicJump: hydraulicJump3D,
  damBreakRitter: damBreakRitter3D
};

let session = null;

export function hasWebGLView(solver) {
  return Boolean(WEBGL_FIGURES[solver]);
}

export function webglAvailable() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function resolveContainer(containerId) {
  if (containerId && typeof containerId === "object" && containerId.nodeType === 1) return containerId;
  return document.getElementById(String(containerId));
}

function disposeGpu(root) {
  if (!root) return;
  root.traverse(obj => {
    obj.geometry?.dispose();
    const materials = obj.material ? (Array.isArray(obj.material) ? obj.material : [obj.material]) : [];
    for (const mat of materials) {
      if (!mat) continue;
      for (const key of Object.keys(mat)) {
        const value = mat[key];
        if (value && value.isTexture) value.dispose();
      }
      mat.map?.dispose();
      mat.dispose();
    }
  });
}

/**
 * Canevas WebGL générique : scène, caméra perspective, lumières, OrbitControls, resize, boucle de rendu.
 * @param {string|HTMLElement} containerId
 * @param {(dt: number, t: number, ctx: object) => void} [renderCallback]
 */
export function createWebGLCanvas(containerId, renderCallback) {
  const container = resolveContainer(containerId);
  if (!container) throw new Error("Canevas 3D : conteneur introuvable.");
  if (!webglAvailable()) throw new Error("WebGL indisponible.");

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe8f4fb);
  scene.fog = new THREE.Fog(0xe8f4fb, 22, 48);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.08, 80);
  camera.position.set(8.4, 6.2, 11.2);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.style.display = "block";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.setAttribute("aria-label", "Schéma 3D interactif");
  container.innerHTML = "";
  container.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0xffffff, 0.62);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xfff4e6, 1.05);
  sun.position.set(7, 14, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.radius = 3.5;
  sun.shadow.bias = -0.0004;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 40;
  sun.shadow.camera.left = -14;
  sun.shadow.camera.right = 14;
  sun.shadow.camera.top = 12;
  sun.shadow.camera.bottom = -8;
  scene.add(sun);
  scene.add(new THREE.HemisphereLight(0xdbeafe, 0x94a3b8, 0.28));

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(48, 48),
    new THREE.MeshLambertMaterial({ color: 0xd9e8f2 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  ground.receiveShadow = true;
  scene.add(ground);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 4;
  controls.maxDistance = 28;
  controls.maxPolarAngle = Math.PI * 0.48;
  controls.target.set(0, 1.6, 0);
  controls.update();

  let callback = renderCallback || null;
  const clock = new THREE.Clock();
  let raf = 0;
  let running = true;

  const resize = () => {
    const w = Math.max(container.clientWidth, 1);
    const h = Math.max(container.clientHeight, 1);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  const tick = () => {
    if (!running) return;
    raf = requestAnimationFrame(tick);
    if (document.hidden) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    controls.update();
    callback?.(dt, clock.elapsedTime, { scene, camera, renderer, controls });
    renderer.render(scene, camera);
  };

  const onVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else if (running && !raf) {
      clock.getDelta();
      tick();
    }
  };
  document.addEventListener("visibilitychange", onVisibility);
  tick();

  return {
    scene,
    camera,
    renderer,
    controls,
    container,
    setRender(fn) { callback = fn; },
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      raf = 0;
      document.removeEventListener("visibilitychange", onVisibility);
      ro.disconnect();
      controls.dispose();
      disposeGpu(scene);
      renderer.dispose();
      renderer.forceContextLoss?.();
      renderer.domElement.remove();
    }
  };
}

function makeLabel(text, color = "#0f172a") {
  const canvas = document.createElement("canvas");
  canvas.width = 384;
  canvas.height = 96;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") ctx.roundRect(8, 12, 368, 72, 16);
  else ctx.rect(8, 12, 368, 72);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.font = "700 36px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 192, 50);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
  sprite.scale.set(2.15, 0.54, 1);
  sprite.userData.texture = texture;
  return sprite;
}

function metalMat(color = METAL, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, metalness: 0.35, roughness: 0.42, ...extra });
}

function waterMat(opacity = 0.72) {
  return new THREE.MeshStandardMaterial({
    color: WATER,
    transparent: true,
    opacity,
    roughness: 0.18,
    metalness: 0.04,
    depthWrite: true
  });
}

function tankShell(w, h, d) {
  const group = new THREE.Group();
  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      metalness: 0.08,
      roughness: 0.16,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide
    })
  );
  glass.castShadow = true;
  glass.receiveShadow = true;
  group.add(glass);
  const rim = new THREE.Mesh(new THREE.BoxGeometry(w + 0.08, 0.08, d + 0.08), metalMat(METAL_DARK));
  rim.position.y = h / 2;
  group.add(rim);
  return group;
}

function makeParticles(count, color, size) {
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color,
    size,
    transparent: true,
    opacity: 0.88,
    depthWrite: false,
    sizeAttenuation: true
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return { points, positions, geo };
}

function hydraulicPower3D(scene, data) {
  const group = new THREE.Group();
  scene.add(group);
  const tmp = new THREE.Vector3();
  let curve = null;
  let impeller = null;
  let particles = null;
  let phases = null;
  const count = 220;

  const build = d => {
    disposeGpu(group);
    group.clear();
    const Hg = Math.max(+d.head || 35, 1);
    const losses = Math.max(+d.losses || 0, 0);
    const hVis = 1.35 + 2.4 * (Hg / (Hg + 18));
    const q = Math.max(+d.Q || 20, 4);

    const low = tankShell(2.3, 2.5, 2.3);
    low.position.set(-4.35, 1.25, 0);
    group.add(low);
    const lowWater = new THREE.Mesh(new THREE.BoxGeometry(2.08, 1.35, 2.08), waterMat(0.7));
    lowWater.position.set(-4.35, 0.72, 0);
    lowWater.receiveShadow = true;
    group.add(lowWater);

    const high = tankShell(2.3, 2.2, 2.3);
    high.position.set(4.35, hVis + 0.9, 0);
    group.add(high);
    const highWater = new THREE.Mesh(new THREE.BoxGeometry(2.08, 1.15, 2.08), waterMat(0.7));
    highWater.position.set(4.35, hVis + 0.42, 0);
    highWater.receiveShadow = true;
    group.add(highWater);

    const pumpY = 1.15;
    const housing = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 18), metalMat(PUMP));
    housing.position.set(0, pumpY, 0);
    housing.castShadow = true;
    group.add(housing);
    const volute = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.16, 10, 24), metalMat(0x0c4a6e));
    volute.position.set(0, pumpY, 0);
    volute.rotation.x = Math.PI / 2;
    group.add(volute);

    impeller = new THREE.Group();
    impeller.position.set(0, pumpY, 0.12);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.12, 12), metalMat(0xe2e8f0));
    hub.rotation.x = Math.PI / 2;
    impeller.add(hub);
    for (let i = 0; i < 6; i++) {
      const vane = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.34, 0.04), metalMat(0xcbd5e1));
      vane.position.y = 0.16;
      const wrap = new THREE.Group();
      wrap.rotation.z = (i / 6) * Math.PI * 2;
      wrap.add(vane);
      impeller.add(wrap);
    }
    group.add(impeller);

    curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-4.35, 0.55, 0),
      new THREE.Vector3(-2.7, 0.5, 0),
      new THREE.Vector3(-1.35, 0.55, 0),
      new THREE.Vector3(-0.55, pumpY, 0),
      new THREE.Vector3(0.55, pumpY, 0),
      new THREE.Vector3(1.35, hVis + 0.55, 0),
      new THREE.Vector3(2.7, hVis + 0.55, 0),
      new THREE.Vector3(4.35, hVis + 0.5, 0)
    ]);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 72, 0.16, 10, false), metalMat(METAL));
    tube.castShadow = true;
    tube.receiveShadow = true;
    group.add(tube);

    const hmt = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, hVis, 8), new THREE.MeshBasicMaterial({ color: FORCE }));
    hmt.position.set(2.05, hVis / 2 + 0.15, -1.15);
    group.add(hmt);
    const headLbl = makeLabel(`HMT = ${Number(Hg + losses).toLocaleString("fr-FR", { maximumSignificantDigits: 3 })} m`, "#9f1239");
    headLbl.position.set(2.05, hVis + 0.55, -1.15);
    group.add(headLbl);
    const pumpLbl = makeLabel("Pompe");
    pumpLbl.position.set(0, pumpY + 1.05, 0.2);
    group.add(pumpLbl);
    const wellLbl = makeLabel("Puits");
    wellLbl.position.set(-4.35, 2.85, 0);
    group.add(wellLbl);
    const upLbl = makeLabel(`H_g = ${Number(Hg).toLocaleString("fr-FR", { maximumSignificantDigits: 3 })} m`);
    upLbl.position.set(4.35, hVis + 2.35, 0);
    group.add(upLbl);

    particles = makeParticles(count, WATER_LIGHT, 0.13);
    group.add(particles.points);
    phases = new Float32Array(count);
    for (let i = 0; i < count; i++) phases[i] = i / count;
    particles.speed = 0.08 + 0.004 * q;
  };

  build(data);
  return {
    group,
    setData(next) { build(next); },
    update(dt, t) {
      if (impeller) impeller.rotation.z += dt * (REDUCE ? 1.2 : 5.5);
      if (!curve || !particles) return;
      const speed = particles.speed * (REDUCE ? 0.2 : 1);
      for (let i = 0; i < count; i++) {
        const s = (phases[i] + t * speed) % 1;
        curve.getPointAt(s, tmp);
        particles.positions[i * 3] = tmp.x;
        particles.positions[i * 3 + 1] = tmp.y;
        particles.positions[i * 3 + 2] = tmp.z + 0.04 * Math.sin(t * 3 + i);
      }
      particles.geo.attributes.position.needsUpdate = true;
    },
    dispose() {
      scene.remove(group);
      disposeGpu(group);
    }
  };
}

function hydraulicJump3D(scene, data) {
  const group = new THREE.Group();
  scene.add(group);
  const nx = 48, nz = 10;
  let surface = null;
  let foam = null;
  let stream = null;
  let params = null;
  const foamCount = 90;
  const streamCount = 140;
  const foamPhase = new Float32Array(foamCount);
  const streamPhase = new Float32Array(streamCount);
  for (let i = 0; i < foamCount; i++) foamPhase[i] = Math.random() * Math.PI * 2;
  for (let i = 0; i < streamCount; i++) streamPhase[i] = i / streamCount;

  const heightAt = (x, t) => {
    const { y1, y2, Lr } = params;
    const a = -Lr * 0.42;
    const b = Lr * 0.58;
    if (x < a) return y1;
    if (x > b) return y2 + 0.012 * Math.sin(x * 2.4 + t * 1.6);
    const u = (x - a) / (b - a);
    const base = y1 + (y2 - y1) * (u * u * (3 - 2 * u));
    const roller = Math.sin(u * Math.PI) * (y2 - y1) * 0.38 * (0.72 + 0.28 * Math.sin(t * 8 + x * 6));
    return base + roller;
  };

  const build = d => {
    disposeGpu(group);
    group.clear();
    const y1 = Math.max(+d.y1 || 0.3, 0.05);
    const V1 = +d.V1 || 1;
    const Fr1 = V1 / Math.sqrt(G * y1);
    const y2 = 0.5 * y1 * (-1 + Math.sqrt(1 + 8 * Fr1 ** 2));
    const Lr = 6 * Math.max(y2, y1);
    const yMax = Math.max(y2, y1, 0.4);
    const scale = 2.15 / yMax;
    params = { y1: y1 * scale, y2: y2 * scale, Lr: Math.min(Math.max(Lr * scale * 0.22, 2.4), 4.6), V1, width: 3.2, length: 12 };

    const bed = new THREE.Mesh(new THREE.BoxGeometry(params.length + 0.4, 0.18, params.width + 0.55), metalMat(CONCRETE, { metalness: 0.08, roughness: 0.78 }));
    bed.position.y = -0.09;
    bed.receiveShadow = true;
    bed.castShadow = true;
    group.add(bed);
    for (const side of [-1, 1]) {
      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(params.length + 0.4, params.y2 + 0.55, 0.16),
        metalMat(METAL, { metalness: 0.12, roughness: 0.7 })
      );
      wall.position.set(0, (params.y2 + 0.55) / 2, side * (params.width / 2 + 0.12));
      wall.castShadow = true;
      wall.receiveShadow = true;
      group.add(wall);
    }

    const geo = new THREE.PlaneGeometry(params.length, params.width * 0.92, nx, nz);
    geo.rotateX(-Math.PI / 2);
    surface = new THREE.Mesh(geo, waterMat(0.88));
    surface.receiveShadow = true;
    group.add(surface);

    foam = makeParticles(foamCount, FOAM, 0.11);
    group.add(foam.points);
    stream = makeParticles(streamCount, WATER_LIGHT, 0.09);
    group.add(stream.points);

    const l1 = makeLabel(`y₁ = ${Number(y1).toLocaleString("fr-FR", { maximumSignificantDigits: 3 })} m · Fr₁ = ${Number(Fr1).toLocaleString("fr-FR", { maximumSignificantDigits: 3 })}`);
    l1.position.set(-3.6, params.y1 + 1.35, 0);
    group.add(l1);
    const l2 = makeLabel(`y₂ = ${Number(y2).toLocaleString("fr-FR", { maximumSignificantDigits: 3 })} m`);
    l2.position.set(3.5, params.y2 + 1.2, 0);
    group.add(l2);
    const lr = makeLabel(`L_r ≈ ${Number(Lr).toLocaleString("fr-FR", { maximumSignificantDigits: 3 })} m`, "#9f1239");
    lr.position.set(0.2, params.y2 + 1.85, 0);
    group.add(lr);
  };

  const morphSurface = t => {
    const pos = surface.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, heightAt(pos.getX(i), t));
    }
    pos.needsUpdate = true;
    surface.geometry.computeVertexNormals();
  };

  build(data);
  morphSurface(0);
  return {
    group,
    setData(next) { build(next); morphSurface(0); },
    update(dt, t) {
      if (!params || !surface) return;
      morphSurface(REDUCE ? 0 : t);
      const { y1, y2, Lr, width, length, V1 } = params;
      const speed = (0.35 + 0.08 * V1) * (REDUCE ? 0.15 : 1);
      for (let i = 0; i < streamCount; i++) {
        const s = (streamPhase[i] + t * speed * 0.08) % 1;
        const x = -length / 2 + s * length;
        stream.positions[i * 3] = x;
        stream.positions[i * 3 + 1] = heightAt(x, t) + 0.05;
        stream.positions[i * 3 + 2] = (i % 7 - 3) * (width / 10);
      }
      stream.geo.attributes.position.needsUpdate = true;
      for (let i = 0; i < foamCount; i++) {
        const ang = foamPhase[i] + t * (REDUCE ? 1 : 4.2);
        const u = 0.35 + 0.45 * ((i % 10) / 10);
        const x = -Lr * 0.2 + u * Lr * 0.7;
        const r = 0.18 + (i % 5) * 0.05;
        foam.positions[i * 3] = x + r * Math.cos(ang);
        foam.positions[i * 3 + 1] = (y1 + y2) * 0.55 + r * 0.55 * Math.sin(ang * 1.4) + 0.2;
        foam.positions[i * 3 + 2] = ((i % 8) - 3.5) * 0.28;
      }
      foam.geo.attributes.position.needsUpdate = true;
    },
    dispose() {
      scene.remove(group);
      disposeGpu(group);
    }
  };
}

function damBreakRitter3D(scene, data) {
  const group = new THREE.Group();
  scene.add(group);
  const nx = 56, nz = 8;
  let surface = null;
  let spray = null;
  let params = null;
  const sprayCount = 120;
  const spraySeed = new Float32Array(sprayCount);
  for (let i = 0; i < sprayCount; i++) spraySeed[i] = Math.random();

  const ritter = (x, t, h0) => {
    const c0 = Math.sqrt(G * h0);
    if (t <= 1e-3) return x < 0 ? h0 : 0;
    if (x <= -c0 * t) return h0;
    if (x >= 2 * c0 * t) return 0;
    const c = (2 * c0 - x / t) / 3;
    return (c * c) / G;
  };

  const build = d => {
    disposeGpu(group);
    group.clear();
    const h0 = Math.max(+d.h0 || 12, 1);
    const xKm = Math.max(+d.xKm || 0.4, 0.05);
    const hVis = 2.55;
    const scale = hVis / h0;
    const lengthUp = 5.2;
    const lengthDown = 9.4;
    params = { h0, hVis, scale, lengthUp, lengthDown, xKm, period: 7.5 };

    const bed = new THREE.Mesh(
      new THREE.BoxGeometry(lengthUp + lengthDown + 0.6, 0.2, 3.6),
      metalMat(CONCRETE, { metalness: 0.08, roughness: 0.8 })
    );
    bed.position.set((lengthDown - lengthUp) / 2, -0.1, 0);
    bed.receiveShadow = true;
    group.add(bed);
    for (const side of [-1, 1]) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(lengthUp + lengthDown + 0.6, hVis + 0.7, 0.16), metalMat(METAL, { roughness: 0.72, metalness: 0.1 }));
      wall.position.set((lengthDown - lengthUp) / 2, (hVis + 0.7) / 2, side * 1.72);
      wall.castShadow = true;
      group.add(wall);
    }

    const damH = hVis + 0.55;
    for (const side of [-1, 1]) {
      const pier = new THREE.Mesh(new THREE.BoxGeometry(0.55, damH, 1.05), metalMat(0x78716c, { roughness: 0.85, metalness: 0.05 }));
      pier.position.set(0, damH / 2, side * 1.05);
      pier.castShadow = true;
      group.add(pier);
    }
    const rubble = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.45, 1.3), metalMat(0x57534e, { roughness: 0.9, metalness: 0 }));
    rubble.position.set(0.85, 0.22, 0);
    rubble.rotation.z = -0.18;
    rubble.castShadow = true;
    group.add(rubble);

    const geo = new THREE.PlaneGeometry(lengthUp + lengthDown, 3.05, nx, nz);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setX(i, pos.getX(i) + (lengthDown - lengthUp) / 2);
    surface = new THREE.Mesh(geo, waterMat(0.8));
    surface.receiveShadow = true;
    group.add(surface);

    spray = makeParticles(sprayCount, FOAM, 0.1);
    group.add(spray.points);

    const l0 = makeLabel(`h₀ = ${Number(h0).toLocaleString("fr-FR", { maximumSignificantDigits: 3 })} m`);
    l0.position.set(-3.1, hVis + 0.85, 0);
    group.add(l0);
    const ld = makeLabel("h = 4h₀/9 au barrage");
    ld.position.set(0.2, 1.55, 0);
    group.add(ld);
    const lf = makeLabel("front 2√(gh₀)", "#9f1239");
    lf.position.set(5.6, 2.4, 0);
    group.add(lf);
    const lx = makeLabel(`x = ${Number(xKm).toLocaleString("fr-FR", { maximumSignificantDigits: 3 })} km à l’aval`);
    lx.position.set(4.2, 3.15, 0);
    group.add(lx);
  };

  const simTime = t => {
    const { period } = params;
    const u = (t % period) / period;
    return 0.22 + u * 4.6;
  };

  const morph = t => {
    const tau = simTime(t);
    const { h0, scale, lengthDown } = params;
    const xWorld = x => x / scale;
    const pos = surface.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const h = ritter(xWorld(x), tau, h0) * scale;
      pos.setY(i, Math.max(h, 0.01));
    }
    pos.needsUpdate = true;
    surface.geometry.computeVertexNormals();
    const c0 = Math.sqrt(G * h0);
    const front = 2 * c0 * tau * scale;
    const xmax = lengthDown - 0.2;
    for (let i = 0; i < sprayCount; i++) {
      const along = (0.55 + 0.45 * spraySeed[i]) * Math.min(front, xmax);
      spray.positions[i * 3] = along;
      spray.positions[i * 3 + 1] = 0.12 + 0.55 * spraySeed[(i + 3) % sprayCount] + 0.12 * Math.sin(t * 6 + i);
      spray.positions[i * 3 + 2] = (spraySeed[(i + 7) % sprayCount] - 0.5) * 2.4;
    }
    spray.geo.attributes.position.needsUpdate = true;
  };

  build(data);
  morph(0);
  return {
    group,
    setData(next) { build(next); morph(0); },
    update(dt, t) { if (surface) morph(REDUCE ? 1.8 : t); },
    dispose() {
      scene.remove(group);
      disposeGpu(group);
    }
  };
}

export function disposeWebGL() {
  if (!session) return;
  session.demo?.dispose();
  session.canvas?.dispose();
  session = null;
}

export function isWebGLMounted(solver) {
  return Boolean(session && session.solver === solver && session.canvas?.renderer?.domElement?.isConnected);
}

export function mountWebGLFigure(containerId, solver, data) {
  disposeWebGL();
  const factory = WEBGL_FIGURES[solver];
  if (!factory || !webglAvailable()) return false;
  const canvas = createWebGLCanvas(containerId, null);
  if (solver === "hydraulicPower") {
    canvas.camera.position.set(9.2, 6.4, 10.5);
    canvas.controls.target.set(0, 2.1, 0);
  } else if (solver === "hydraulicJump") {
    canvas.camera.position.set(1.2, 5.8, 12.4);
    canvas.controls.target.set(0, 1.15, 0);
  } else {
    canvas.camera.position.set(1.6, 6.8, 13.2);
    canvas.controls.target.set(1.4, 1.2, 0);
  }
  canvas.controls.update();
  const demo = factory(canvas.scene, data);
  canvas.setRender((dt, t) => demo.update(dt, t));
  session = { canvas, demo, solver };
  return true;
}

export function updateWebGLFigure(data) {
  if (!session) return false;
  session.demo.setData(data);
  return true;
}

export function mountOrUpdate(containerId, solver, data) {
  if (isWebGLMounted(solver)) return updateWebGLFigure(data);
  return mountWebGLFigure(containerId, solver, data);
}
