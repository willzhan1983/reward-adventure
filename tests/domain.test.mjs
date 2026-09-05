import test from "node:test";
import assert from "node:assert/strict";
import { createInitialState, DEFAULT_TASKS, DEFAULT_REWARDS } from "../src/domain/defaults.js";
import * as calculations from "../src/domain/calculations.js";
import { exportBackup, importBackup, loadState, saveState } from "../src/domain/storage.js";

const { getMonthSummary, redeemReward, setGoalStatus, toggleDailyCheckIn } = calculations;

const day = (n) => `2026-09-${String(n).padStart(2, "0")}`;

test("defaults include the 12 tasks and 7 rewards", () => {
  const state = createInitialState(new Date("2026-09-05T12:00:00"));
  assert.equal(state.tasks.length, 12);
  assert.equal(state.rewards.length, 7);
  assert.equal(state.tasks.find((task) => task.id === "math").description, "90分以上");
});

test("daily check-ins toggle and a five-day streak earns homework points", () => {
  let state = createInitialState(new Date("2026-09-05T12:00:00"));
  for (let n = 1; n <= 5; n += 1) state = toggleDailyCheckIn(state, day(n), "homework");
  assert.equal(getMonthSummary(state, "2026-09").streaks.homework, 5);
  assert.equal(getMonthSummary(state, "2026-09").earnedPoints, 5);
  state = toggleDailyCheckIn(state, day(5), "homework");
  assert.equal(getMonthSummary(state, "2026-09").streaks.homework, 4);
});

test("submitting today's tasks replaces that day's selection and keeps other days", () => {
  let state = createInitialState(new Date("2026-09-05T12:00:00"));
  state = toggleDailyCheckIn(state, "2026-09-04", "homework");
  state = toggleDailyCheckIn(state, "2026-09-05", "homework");
  state = calculations.submitDailyCheckIns(state, "2026-09-05", ["training", "words"]);

  assert.deepEqual(state.months["2026-09"].days["2026-09-04"], { homework: true });
  assert.deepEqual(state.months["2026-09"].days["2026-09-05"], { training: true, words: true });
});

test("piano awards eight points for seven days, not five plus seven", () => {
  let state = createInitialState(new Date("2026-09-05T12:00:00"));
  for (let n = 1; n <= 7; n += 1) state = toggleDailyCheckIn(state, day(n), "piano");
  assert.equal(getMonthSummary(state, "2026-09").earnedPoints, 8);
});

test("monthly targets and manual goals award points once", () => {
  let state = createInitialState(new Date("2026-09-05T12:00:00"));
  for (let n = 1; n <= 20; n += 1) state = toggleDailyCheckIn(state, day(n), "training");
  state = setGoalStatus(state, "2026-09", "math", true);
  assert.equal(getMonthSummary(state, "2026-09").earnedPoints, 17);
});

test("redemption rejects insufficient balance and succeeds when affordable", () => {
  let state = createInitialState(new Date("2026-09-05T12:00:00"));
  state = setGoalStatus(state, "2026-09", "math", true);
  assert.equal(redeemReward(state, "2026-09", "wish").ok, false);
  const result = redeemReward(state, "2026-09", "snack");
  assert.equal(result.ok, true);
  assert.equal(result.state.redemptions.length, 1);
});

test("state round-trips through local storage and backup JSON", () => {
  const storage = { data: new Map(), getItem(key) { return this.data.get(key) ?? null; }, setItem(key, value) { this.data.set(key, value); } };
  const state = createInitialState(new Date("2026-09-05T12:00:00"));
  saveState(state, storage);
  assert.equal(loadState(storage).settings.appName, "获得奖励冒险");
  assert.equal(importBackup(exportBackup(state)).tasks.length, DEFAULT_TASKS.length);
  assert.equal(DEFAULT_REWARDS.length, 7);
});
