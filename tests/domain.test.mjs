import test from "node:test";
import assert from "node:assert/strict";
import { createInitialState, DEFAULT_TASKS, DEFAULT_REWARDS } from "../src/domain/defaults.js";
import * as calculations from "../src/domain/calculations.js";
import { exportBackup, importBackup, loadState, saveState } from "../src/domain/storage.js";
import { toggleAndSaveSelection } from "../src/domain/checkin-save.js";
import { normaliseState } from "../src/domain/model.js";

const { getMonthSummary, redeemReward, setGoalStatus, toggleDailyCheckIn } = calculations;

const day = (n) => `2026-09-${String(n).padStart(2, "0")}`;

test("defaults include the 12 tasks and 7 rewards", () => {
  const state = createInitialState(new Date("2026-09-05T12:00:00"));
  assert.equal(state.tasks.length, 12);
  assert.equal(state.rewards.length, 7);
  assert.equal(state.tasks.find((task) => task.id === "math").description, "90分以上");
});

test("saved default tasks migrate from monthly conditions to daily completion text", () => {
  const state = createInitialState(new Date("2026-09-05T12:00:00"));
  state.tasks.find((task) => task.id === "homework").description = "连续5天在19:50前完成作业";
  state.tasks.find((task) => task.id === "training").description = "练腿、练嘴一个月不少于20天";

  const migrated = normaliseState(state, new Date("2026-09-05T12:00:00"));
  assert.equal(migrated.tasks.find((task) => task.id === "homework").description, "在19:50前完成作业");
  assert.equal(migrated.tasks.find((task) => task.id === "training").description, "完成当天练腿、练嘴");
});

test("each daily homework check-in earns its configured stars", () => {
  let state = createInitialState(new Date("2026-09-05T12:00:00"));
  for (let n = 1; n <= 5; n += 1) state = toggleDailyCheckIn(state, day(n), "homework");
  assert.equal(getMonthSummary(state, "2026-09").streaks.homework, 5);
  assert.equal(getMonthSummary(state, "2026-09").earnedPoints, 25);
  state = toggleDailyCheckIn(state, day(5), "homework");
  assert.equal(getMonthSummary(state, "2026-09").streaks.homework, 4);
  assert.equal(getMonthSummary(state, "2026-09").earnedPoints, 20);
});

test("non-consecutive daily check-ins each earn the task's configured stars", () => {
  let state = createInitialState(new Date("2026-09-05T12:00:00"));
  state = toggleDailyCheckIn(state, day(1), "homework");
  state = toggleDailyCheckIn(state, day(3), "homework");

  const summary = getMonthSummary(state, "2026-09");
  assert.equal(summary.counts.homework, 2);
  assert.equal(summary.streaks.homework, 1);
  assert.equal(summary.earnedPoints, 10);
  assert.equal(summary.availablePoints, 10);
});

test("submitting today's tasks replaces that day's selection and keeps other days", () => {
  let state = createInitialState(new Date("2026-09-05T12:00:00"));
  state = toggleDailyCheckIn(state, "2026-09-04", "homework");
  state = toggleDailyCheckIn(state, "2026-09-05", "homework");
  state = calculations.submitDailyCheckIns(state, "2026-09-05", ["training", "words"]);

  assert.deepEqual(state.months["2026-09"].days["2026-09-04"], { homework: true });
  assert.deepEqual(state.months["2026-09"].days["2026-09-05"], { training: true, words: true });
});

test("piano earns its configured stars for every recorded practice day", () => {
  let state = createInitialState(new Date("2026-09-05T12:00:00"));
  for (let n = 1; n <= 7; n += 1) state = toggleDailyCheckIn(state, day(n), "piano");
  assert.equal(getMonthSummary(state, "2026-09").earnedPoints, 35);
});

test("manual goals still award their configured stars only once per month", () => {
  let state = createInitialState(new Date("2026-09-05T12:00:00"));
  state = setGoalStatus(state, "2026-09", "math", true);
  state = setGoalStatus(state, "2026-09", "math", true);
  assert.equal(getMonthSummary(state, "2026-09").earnedPoints, 5);
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
  assert.equal(saveState(state, storage), true);
  assert.equal(loadState(storage).settings.appName, "获得奖励冒险");
  assert.equal(importBackup(exportBackup(state)).tasks.length, DEFAULT_TASKS.length);
  assert.equal(DEFAULT_REWARDS.length, 7);
});

test("saving reports failure when browser storage is unavailable", () => {
  const state = createInitialState(new Date("2026-09-05T12:00:00"));
  const blockedStorage = { setItem() { throw new Error("storage blocked"); } };
  assert.equal(saveState(state, blockedStorage), false);
});

test("toggling a daily task starts saving the complete selection immediately", async () => {
  const calls = [];
  const { next, saved } = toggleAndSaveSelection(new Set(["homework"]), "preview", (taskIds) => {
    calls.push(taskIds);
    return true;
  });

  assert.deepEqual([...next].sort(), ["homework", "preview"]);
  assert.deepEqual(calls, [["homework", "preview"]]);
  assert.equal(await saved, true);
});
