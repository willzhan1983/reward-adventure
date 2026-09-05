import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("PWA scaffold has build scripts and app shell", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  assert.equal(typeof pkg.scripts.dev, "string");
  assert.equal(typeof pkg.scripts.build, "string");
  assert.match(fs.readFileSync(path.join(root, "index.html"), "utf8"), /获得奖励冒险/);
  assert.ok(fs.existsSync(path.join(root, "public", "manifest.webmanifest")));
  assert.ok(fs.existsSync(path.join(root, "public", "sw.js")));
});

test("service worker refreshes navigation and removes old caches", async () => {
  const listeners = {};
  const deleted = [];
  const networkResponse = { status: 200, type: "basic", clone() { return this; } };
  const cachedResponse = { cached: true };
  const context = {
    self: {
      addEventListener(type, listener) { listeners[type] = listener; },
      skipWaiting() {},
      clients: { claim: async () => {} },
    },
    caches: {
      keys: async () => ["reward-adventure-v1", "reward-adventure-v2"],
      delete: async (name) => { deleted.push(name); },
      match: async () => cachedResponse,
      open: async () => ({ addAll: async () => {}, put: async () => {} }),
    },
    fetch: async () => networkResponse,
    URL,
    Promise,
  };
  vm.runInNewContext(fs.readFileSync(path.join(root, "public", "sw.js"), "utf8"), context);

  let activation;
  listeners.activate({ waitUntil(promise) { activation = promise; } });
  await activation;
  assert.deepEqual(deleted, ["reward-adventure-v1"]);

  let response;
  listeners.fetch({
    request: { method: "GET", mode: "navigate", url: "https://example.com/reward-adventure/" },
    respondWith(promise) { response = promise; },
  });
  assert.equal(await response, networkResponse);
});
