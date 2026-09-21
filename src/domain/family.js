export const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];
export const CATEGORIES = ["学习", "运动", "生活"];

export function taskCategory(task) {
  return task.category || (task.id === "training" ? "运动" : ["tidy", "dishes"].includes(task.id) ? "生活" : "学习");
}

export function isScheduled(task, date) {
  return task.enabled && task.daily && (!Array.isArray(task.weekdays) || task.weekdays.includes(date.getDay()));
}

export function rewardRule(task) {
  if (task.kind === "manual") return `达成目标得${task.points}星`;
  return `每次完成得${task.points}星`;
}

export function weekCompleted(state, today) {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  start.setDate(start.getDate() - (start.getDay() + 6) % 7);
  let count = 0;
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (Object.values(state.months[key.slice(0, 7)]?.days?.[key] || {}).some(Boolean)) count++;
  }
  return count;
}

const object = value => value && typeof value === "object" && !Array.isArray(value);
const integer = value => Number.isSafeInteger(value) && value >= 1 && value <= 10000;
export function validateFamilyState(state) {
  if (!object(state) || state.version !== 1 || !object(state.settings) || !object(state.months) || !Array.isArray(state.tasks) || !Array.isArray(state.rewards) || !Array.isArray(state.redemptions)) return false;
  if (state.tasks.length > 200 || state.rewards.length > 200 || Object.keys(state.months).length > 600) return false;
  for (const list of [state.tasks, state.rewards]) {
    if (new Set(list.map(item => item?.id)).size !== list.length) return false;
    for (const item of list) {
      if (!object(item) || typeof item.id !== "string" || !item.id || item.id.length > 150 || typeof item.label !== "string" || !item.label.trim() || item.label.length > 100 || !integer(item.points) || typeof item.enabled !== "boolean") return false;
    }
  }
  for (const task of state.tasks) {
    if (!["count", "streak", "piano", "manual"].includes(task.kind) || !integer(task.threshold) || typeof task.daily !== "boolean") return false;
    if (task.kind === "piano" && !integer(task.points7)) return false;
    if (task.weekdays !== undefined && (!Array.isArray(task.weekdays) || task.weekdays.some(day => !Number.isInteger(day) || day < 0 || day > 6))) return false;
  }
  for (const [month, data] of Object.entries(state.months)) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || !object(data) || !object(data.days) || !object(data.goals)) return false;
    for (const [date, record] of Object.entries(data.days)) {
      if (!date.startsWith(month + "-") || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date || !object(record) || Object.values(record).some(v => typeof v !== "boolean")) return false;
    }
    if (Object.values(data.goals).some(v => typeof v !== "boolean")) return false;
  }
  return state.redemptions.every(item => object(item) && integer(item.points) && typeof item.id === "string" && typeof item.rewardId === "string");
}
