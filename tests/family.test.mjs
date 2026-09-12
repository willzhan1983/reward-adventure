import test from "node:test";
import assert from "node:assert/strict";
import { familyApi } from "../server/worker.js";
import { localDatabase } from "../scripts/local-db.mjs";
import { createInitialState } from "../src/domain/defaults.js";
import { isScheduled, validateFamilyState, weekCompleted } from "../src/domain/family.js";
import { ensureCurrentMonth, submitDailyCheckIns } from "../src/domain/calculations.js";

const origin = "https://family.test";
function request(method = "GET", data, user = "parent-a", extra = {}) {
  return new Request(origin + "/api/family", { method, headers: { ...(user ? { "oai-authenticated-user-id": user, "oai-authenticated-user-email": `${user}@example.test` } : {}), Origin: origin, "Content-Type": "application/json", ...extra }, ...(data ? { body: JSON.stringify(data) } : {}) });
}
test("family sync persists across two members and prevents stale overwrites", async () => {
  const DB = localDatabase();
  try {
    const state = createInitialState();
    assert.equal((await familyApi(request("GET", null, null), { DB })).status, 401);
    assert.equal((await familyApi(request("PUT", { state, revision: 0 }, "parent-a", { Origin: "https://other.test" }), { DB })).status, 403);
    assert.equal((await familyApi(request("PUT", { state, revision: 0 }), { DB })).status, 200);
    const b = await (await familyApi(request("GET", null, "parent-b"), { DB })).json();
    assert.deepEqual(b.state, state); assert.equal(b.revision, 1);
    const changed = submitDailyCheckIns(state, "2026-09-10", ["words"]);
    assert.equal((await familyApi(request("PUT", { state: changed, revision: 1 }), { DB })).status, 200);
    assert.equal((await familyApi(request("PUT", { state, revision: 1 }, "parent-b"), { DB })).status, 409);
    const latest = await (await familyApi(request("GET", null, "parent-b"), { DB })).json();
    assert.equal(latest.revision, 2); assert.equal(latest.state.months["2026-09"].days["2026-09-10"].words, true);
    assert.equal((await familyApi(request("PUT", { state, revision: 0 }), { DB })).status, 409);
  } finally { DB.close(); }
});
test("sync rejects invalid rules and reports unavailable storage", async () => {
  const state = createInitialState(); state.tasks[0].points = -1;
  assert.equal(validateFamilyState(state), false);
  const DB = localDatabase();
  try { assert.equal((await familyApi(request("PUT", { state, revision: 0 }), { DB })).status, 400); }
  finally { DB.close(); }
  assert.equal((await familyApi(request(), {})).status, 503);
});
test("schedules support weekdays, daily legacy tasks and pause", () => {
  const task = createInitialState().tasks[0];
  const monday = new Date("2026-09-07T12:00:00");
  assert.equal(isScheduled(task, monday), true);
  assert.equal(isScheduled({ ...task, weekdays: [1, 3, 5] }, monday), true);
  assert.equal(isScheduled({ ...task, weekdays: [2] }, monday), false);
  assert.equal(isScheduled({ ...task, weekdays: [] }, monday), false);
});
test("backfill preserves other dates and month rollover preserves existing records", () => {
  let state = createInitialState(new Date("2026-08-31T12:00:00"));
  state = submitDailyCheckIns(state, "2026-09-07", ["words"]);
  state = submitDailyCheckIns(state, "2026-09-08", ["training"]);
  state = ensureCurrentMonth(state, new Date("2026-09-12T12:00:00"));
  assert.deepEqual(state.months["2026-09"].days["2026-09-07"], { words: true });
  assert.equal(weekCompleted(state, new Date("2026-09-12T12:00:00")), 2);
});
