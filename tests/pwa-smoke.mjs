import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("manifest declares an installable standalone app", () => {
  const manifest = JSON.parse(fs.readFileSync("public/manifest.webmanifest", "utf8"));
  assert.equal(manifest.name, "获得奖励冒险");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "/");
});

test("service worker installs and handles offline requests", () => {
  const worker = fs.readFileSync("public/sw.js", "utf8");
  assert.match(worker, /addEventListener\("install"/);
  assert.match(worker, /addEventListener\("fetch"/);
  assert.match(worker, /caches\.match/);
});
