import { dateKeyFromDate, monthKeyFromDate } from "./defaults.js";

function monthRecord(state, monthKey) {
  return state.months[monthKey] || { days: {}, goals: {}, archivedAt: null };
}

function sortedDates(record, taskId) {
  return Object.keys(record.days)
    .filter((dateKey) => record.days[dateKey]?.[taskId])
    .sort();
}

export function countTaskDays(state, monthKey, taskId) {
  return sortedDates(monthRecord(state, monthKey), taskId).length;
}

export function longestStreak(state, monthKey, taskId) {
  const dates = sortedDates(monthRecord(state, monthKey), taskId);
  let longest = 0;
  let current = 0;
  let previous = null;
  for (const value of dates) {
    const currentDate = new Date(`${value}T00:00:00`);
    const previousDate = previous ? new Date(`${previous}T00:00:00`) : null;
    const adjacent = previousDate && (currentDate - previousDate) === 86400000;
    current = adjacent ? current + 1 : 1;
    longest = Math.max(longest, current);
    previous = value;
  }
  return longest;
}

export function currentStreak(state, monthKey, taskId, today = new Date()) {
  const record = monthRecord(state, monthKey);
  let streak = 0;
  let cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  while (record.days[dateKeyFromDate(cursor)]?.[taskId]) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function taskAchieved(state, monthKey, task) {
  const record = monthRecord(state, monthKey);
  if (task.kind === "manual") return Boolean(record.goals[task.id]);
  if (task.kind === "streak") return longestStreak(state, monthKey, task.id) >= task.threshold;
  if (task.kind === "piano") return longestStreak(state, monthKey, task.id) >= 5;
  return countTaskDays(state, monthKey, task.id) >= task.threshold;
}

function taskPoints(state, monthKey, task) {
  if (!taskAchieved(state, monthKey, task)) return 0;
  if (task.kind === "piano") return longestStreak(state, monthKey, task.id) >= 7 ? task.points7 : task.points;
  return task.points;
}

export function getMonthSummary(state, monthKey, today = new Date()) {
  const tasks = state.tasks.filter((task) => task.enabled);
  const counts = Object.fromEntries(tasks.map((task) => [task.id, countTaskDays(state, monthKey, task.id)]));
  const streaks = Object.fromEntries(tasks.map((task) => [task.id, longestStreak(state, monthKey, task.id)]));
  const dailyCounts = tasks.filter((task) => task.daily).reduce((sum, task) => {
    const todayKey = dateKeyFromDate(today);
    return sum + (monthRecord(state, monthKey).days[todayKey]?.[task.id] ? 1 : 0);
  }, 0);
  const earnedPoints = tasks.reduce((sum, task) => sum + taskPoints(state, monthKey, task), 0);
  const availablePoints = getAvailablePoints(state, monthKey, earnedPoints);
  return {
    counts,
    streaks,
    goals: { ...monthRecord(state, monthKey).goals },
    todayCount: dailyCounts,
    earnedPoints,
    availablePoints,
    taskStatus: Object.fromEntries(tasks.map((task) => [task.id, taskAchieved(state, monthKey, task)])),
    currentHomeworkStreak: currentStreak(state, monthKey, "homework", today),
  };
}

function getAvailablePoints(state, monthKey, currentEarnedPoints) {
  const earnedBefore = Object.keys(state.months)
    .filter((key) => key < monthKey)
    .reduce((sum, key) => sum + getMonthSummary(state, key).earnedPoints, 0);
  const spent = state.redemptions.reduce((sum, item) => sum + item.points, 0);
  return Math.max(0, earnedBefore + currentEarnedPoints - spent);
}

export function toggleDailyCheckIn(state, dateKey, taskId) {
  const monthKey = dateKey.slice(0, 7);
  const month = monthRecord(state, monthKey);
  const days = { ...month.days, [dateKey]: { ...(month.days[dateKey] || {}) } };
  days[dateKey][taskId] = !days[dateKey][taskId];
  if (!days[dateKey][taskId]) delete days[dateKey][taskId];
  return { ...state, months: { ...state.months, [monthKey]: { ...month, days } } };
}

export function setGoalStatus(state, monthKey, taskId, status) {
  const month = monthRecord(state, monthKey);
  const goals = { ...month.goals, [taskId]: Boolean(status) };
  return { ...state, months: { ...state.months, [monthKey]: { ...month, goals } } };
}

export function redeemReward(state, monthKey, rewardId) {
  const reward = state.rewards.find((item) => item.id === rewardId && item.enabled);
  if (!reward) return { state, ok: false, reason: "奖励不存在或已停用" };
  const summary = getMonthSummary(state, monthKey);
  if (summary.availablePoints < reward.points) return { state, ok: false, reason: `还差${reward.points - summary.availablePoints}颗星星` };
  const redemption = { id: `${Date.now()}-${rewardId}`, monthKey, rewardId, points: reward.points, createdAt: new Date().toISOString() };
  return { state: { ...state, redemptions: [...state.redemptions, redemption] }, ok: true, reason: "兑换成功" };
}

export function ensureCurrentMonth(state, now = new Date()) {
  const monthKey = monthKeyFromDate(now);
  if (state.settings.currentMonth === monthKey && state.months[monthKey]) return state;
  const oldKey = state.settings.currentMonth;
  const oldMonth = state.months[oldKey];
  const months = { ...state.months, [monthKey]: { days: {}, goals: {}, archivedAt: null } };
  if (oldMonth && oldKey) months[oldKey] = { ...oldMonth, archivedAt: new Date(now).toISOString() };
  return { ...state, settings: { ...state.settings, currentMonth: monthKey }, months };
}
