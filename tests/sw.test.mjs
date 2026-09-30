// Service worker exécuté pour de vrai dans un bac à sable, avec un cache simulé.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import vm from "node:vm";

const ORIGIN = "https://mecaflu.ksr-infra.org";
const source = readFileSync(new URL("../sw.js", import.meta.url), "utf8");

// `routes` : réponses particulières par chemin ; sinon 200, ou 206 pour une lecture partielle.
function mount({ cache = {}, online = false, calls = [], puts = [], routes = {} }) {
  const listeners = {};
  const key = x => new URL(typeof x === "string" ? x : x.url, `${ORIGIN}/sw.js`).pathname;
  const context = {
    self: null, location: { origin: ORIGIN }, URL, Request, Response, Headers, Promise, console,
    caches: {
      match: async x => cache[key(x)] ?? undefined,
      open: async () => ({ put: async (x, r) => { puts.push({ path: key(x), status: r.status }); } }),
      keys: async () => [], delete: async () => true,
    },
    fetch: async (request, init = {}) => {
      calls.push({ cache: init.cache ?? request.cache ?? "default", request });
      if (!online) throw new TypeError("Failed to fetch");
      const path = key(request);
      if (routes[path]) return routes[path]();
      const range = typeof request === "string" ? null : request.headers?.get?.("Range");
      return new Response("network", { status: range ? 206 : 200 });
    },
  };
  context.self = { addEventListener: (type, f) => { listeners[type] = f; }, skipWaiting: () => {}, clients: { claim: async () => {} } };
  vm.createContext(context);
  vm.runInContext(source, context);
  const serve = async (path, mode = "navigate", headers = {}, cache = "default") => {
    let promise = null;
    const url = path.startsWith("http") ? path : `${ORIGIN}${path}`;
    // Une requête de navigation ne se construit pas (mode interdit) : on la simule.
    const request = mode === "navigate" ? { method: "GET", url, mode, cache } : new Request(url, { mode, headers, cache });
    listeners.fetch({ request, respondWith: p => { promise = p; } });
    return promise;
  };
  serve.assets = () => vm.runInContext("ASSETS", context);
  return serve;
}
const settle = () => new Promise(r => setTimeout(r, 0));

// Cloudflare garde les scripts quatre heures dans le cache du navigateur : sans
// revalidation, une page neuve chargerait des modules d'hier de même adresse.
test("online: site files are revalidated, not read from the HTTP cache", async () => {
  const calls = [];
  const serve = mount({ online: true, calls });
  await serve("/src/app.js", "cors");
  await serve("/data/exercises-td.json", "cors");
  await serve("/", "navigate");
  await serve("https://fonts.gstatic.com/s/newsreader/v1/font.woff2", "cors");
  await serve("/src/app.js", "cors", {}, "reload");
  assert.deepEqual(calls.map(c => c.cache), ["no-cache", "no-cache", "default", "default", "reload"],
    "navigations, other sites' files and explicit cache modes go as before");
});

test("online: pdf.js range reads keep their Range header, and chunks are not cached", async () => {
  const calls = [], puts = [];
  const serve = mount({ online: true, calls, puts });
  const response = await serve("/docs/Cours_Mecanique_des_Fluides_GC_S1_v01.pdf", "cors", { Range: "bytes=0-65535" });
  assert.equal(response.status, 206);
  assert.equal(calls[0].request.headers.get("Range"), "bytes=0-65535");
  await serve("/src/app.js", "cors");
  await settle();
  assert.deepEqual(puts.map(p => p.path), ["/src/app.js"]);
});

test("online: errors are not cached, redirects and opaque responses still are", async () => {
  const puts = [];
  const opaque = type => () => ({ status: 0, type, ok: false, clone() { return this; } });
  const serve = mount({ online: true, puts, routes: {
    "/cours.html": opaque("opaqueredirect"),
    "/World_Imagery/MapServer/tile/17/51000/64000": opaque("opaque"),
    "/data/missing.json": () => new Response("introuvable", { status: 404 }),
  } });
  await serve("/cours.html", "navigate");
  await serve("https://server.arcgisonline.com/World_Imagery/MapServer/tile/17/51000/64000", "no-cors");
  await serve("/data/missing.json", "cors");
  await settle();
  assert.deepEqual(puts.map(p => p.path), ["/cours.html", "/World_Imagery/MapServer/tile/17/51000/64000"],
    "the cached Cloudflare redirect is what opens cours.html offline");
});

test("offline: the home page for a navigation, a plain failure for data", async () => {
  const serve = mount({ cache: { "/": new Response("HOME") } });
  assert.equal(await (await serve("/some-page")).text(), "HOME");
  const data = await serve("/data/exercises-td.json", "cors");
  assert.equal(data.status, 504, "missing data must fail plainly, not receive HTML");
  assert.match(data.headers.get("Content-Type"), /text\/plain/);
});

test("the precache lists every module and data file", () => {
  const assets = new Set(mount({}).assets());
  const files = ["src", "data"].flatMap(d => readdirSync(new URL(`../${d}/`, import.meta.url)).map(f => `./${d}/${f}`));
  for (const f of files) assert.ok(assets.has(f), `${f} missing from the service worker precache`);
});
