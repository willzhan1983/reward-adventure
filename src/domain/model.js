import { createInitialState, STATE_VERSION } from "./defaults.js";

export function normaliseState(value, now = new Date()) {
  if (!value || value.version !== STATE_VERSION || !Array.isArray(value.tasks) || !value.months) return createInitialState(now);
  return {
    ...value,
    settings: { appName: "获得奖励冒险", currentMonth: value.settings?.currentMonth, ...value.settings },
    rewards: Array.isArray(value.rewards) ? value.rewards : [],
    pointsLedger: Array.isArray(value.pointsLedger) ? value.pointsLedger : [],
    redemptions: Array.isArray(value.redemptions) ? value.redemptions : [],
  };
}
