import { createInitialState, STATE_VERSION } from "./defaults.js";

const LEGACY_DAILY_DESCRIPTIONS = {
  "连续5天在19:50前完成作业": "在19:50前完成作业",
  "课桌、书包整洁一个月达到20天": "课桌、书包保持整洁",
  "预习在1小时内完成，累计3次": "完成当天预习",
  "连续5天得5分；连续7天得8分": "完成当天钢琴练习",
  "一个月洗碗6次及以上": "完成当天洗碗",
  "练腿、练嘴一个月不少于20天": "完成当天练腿、练嘴",
  "一个月不少于13天": "完成当天英语词书",
};

export function normaliseState(value, now = new Date()) {
  if (!value || value.version !== STATE_VERSION || !Array.isArray(value.tasks) || !value.months) return createInitialState(now);
  return {
    ...value,
    settings: { appName: "获得奖励冒险", currentMonth: value.settings?.currentMonth, ...value.settings },
    tasks: value.tasks.map(task => ({ ...task, description: LEGACY_DAILY_DESCRIPTIONS[task.description] || task.description })),
    rewards: Array.isArray(value.rewards) ? value.rewards : [],
    pointsLedger: Array.isArray(value.pointsLedger) ? value.pointsLedger : [],
    redemptions: Array.isArray(value.redemptions) ? value.redemptions : [],
  };
}
