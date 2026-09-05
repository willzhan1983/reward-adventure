import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
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
