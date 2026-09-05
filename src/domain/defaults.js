export const STORAGE_KEY = "reward-adventure-state";
export const STATE_VERSION = 1;

export const DEFAULT_TASKS = [
  { id: "homework", label: "作业小勇士", description: "连续5天在19:50前完成作业", kind: "streak", threshold: 5, points: 5, enabled: true, daily: true },
  { id: "math", label: "数学考试", description: "90分以上", kind: "manual", threshold: 1, points: 5, enabled: true, daily: false },
  { id: "chinese", label: "语文考试", description: "93分以上", kind: "manual", threshold: 1, points: 5, enabled: true, daily: false },
  { id: "quiz", label: "小测验", description: "满分2次", kind: "manual", threshold: 1, points: 3, enabled: true, daily: false },
  { id: "english", label: "英语考试", description: "100分", kind: "manual", threshold: 1, points: 5, enabled: true, daily: false },
  { id: "science", label: "科学考试", description: "95分以上", kind: "manual", threshold: 1, points: 5, enabled: true, daily: false },
  { id: "tidy", label: "整洁魔法", description: "课桌、书包整洁一个月达到20天", kind: "count", threshold: 20, points: 10, enabled: true, daily: true },
  { id: "preview", label: "预习能量", description: "预习在1小时内完成，累计3次", kind: "count", threshold: 3, points: 4, enabled: true, daily: true },
  { id: "piano", label: "琴声任务", description: "连续5天得5分；连续7天得8分", kind: "piano", threshold: 5, points: 5, points7: 8, enabled: true, daily: true },
  { id: "dishes", label: "洗碗小帮手", description: "一个月洗碗6次及以上", kind: "count", threshold: 6, points: 8, enabled: true, daily: true },
  { id: "training", label: "训练能量站", description: "练腿、练嘴一个月不少于20天", kind: "count", threshold: 20, points: 12, enabled: true, daily: true },
  { id: "words", label: "英语词书", description: "一个月不少于13天", kind: "count", threshold: 13, points: 8, enabled: true, daily: true },
];

export const DEFAULT_REWARDS = [
  { id: "snack", label: "基础奖励", description: "选择一次喜欢的零食或甜点", points: 5, enabled: true },
  { id: "fun-time", label: "娱乐奖励", description: "周末增加30分钟娱乐时间", points: 10, enabled: true },
  { id: "dinner", label: "家庭决定权", description: "决定一次家庭晚餐吃什么", points: 15, enabled: true },
  { id: "small-gift", label: "小礼物", description: "购买20元以内的文具、贴纸或小礼物", points: 20, enabled: true },
  { id: "family-activity", label: "家庭活动", description: "选择一次看电影、骑车、公园或亲子游戏", points: 30, enabled: true },
  { id: "book", label: "成长礼物", description: "选择一本书或40元以内的礼物", points: 40, enabled: true },
  { id: "wish", label: "心愿奖励", description: "特别礼物或周末活动，由爸爸妈妈提前确认", points: 60, enabled: true },
];

export function monthKeyFromDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function dateKeyFromDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function createInitialState(now = new Date()) {
  const monthKey = monthKeyFromDate(now);
  return {
    version: STATE_VERSION,
    settings: { appName: "获得奖励冒险", currentMonth: monthKey },
    tasks: structuredClone(DEFAULT_TASKS),
    rewards: structuredClone(DEFAULT_REWARDS),
    months: { [monthKey]: { days: {}, goals: {}, archivedAt: null } },
    pointsLedger: [],
    redemptions: [],
  };
}
