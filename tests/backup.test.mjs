import test from "node:test";
import assert from "node:assert/strict";
import { createInitialState } from "../src/domain/defaults.js";
import { ensureCurrentMonth, toggleDailyCheckIn } from "../src/domain/calculations.js";
import { exportBackup, importBackup } from "../src/domain/storage.js";

test("month rollover archives the old month and preserves data", () => {
  let state = createInitialState(new Date("2026-09-05T12:00:00"));
  state = toggleDailyCheckIn(state, "2026-09-05", "training");
  const next = ensureCurrentMonth(state, new Date("2026-10-01T12:00:00"));
  assert.equal(next.settings.currentMonth, "2026-10");
  assert.ok(next.months["2026-09"].archivedAt);
  assert.equal(next.months["2026-09"].days["2026-09-05"].training, true);
  assert.deepEqual(next.months["2026-10"].days, {});
});

test("backup includes schema and restores the current month", () => {
  const state = createInitialState(new Date("2026-09-05T12:00:00"));
  const parsed = JSON.parse(exportBackup(state));
  assert.equal(parsed.schema, "reward-adventure");
  assert.equal(importBackup(JSON.stringify(parsed)).settings.currentMonth, "2026-09");
  assert.throws(() => importBackup("{}"), /格式不兼容/);
});
