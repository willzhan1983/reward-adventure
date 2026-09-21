import React, { useEffect, useState } from "react";
import ProgressHero from "../components/ProgressHero.jsx";
import TaskCard from "../components/TaskCard.jsx";
import { dateKeyFromDate } from "../domain/defaults.js";
import { CATEGORIES, isScheduled, taskCategory, rewardRule, weekCompleted } from "../domain/family.js";
import { toggleAndSaveSelection } from "../domain/checkin-save.js";
import "../checkin.css";

export default function TodayScreen({ state, monthKey, summary, today, onSubmitTasks, onDirty, draftReset }) {
  const todayKey = dateKeyFromDate(today);
  const record = state.months[monthKey]?.days?.[todayKey] || {};
  const savedIds = Object.keys(record).filter(id => record[id]).sort().join(",");
  const [selected, setSelected] = useState(() => new Set(savedIds ? savedIds.split(",") : []));
  const [dirty, setDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  useEffect(() => { if (!dirty) setSelected(new Set(savedIds ? savedIds.split(",") : [])); }, [savedIds, dirty]);
  useEffect(() => { setSelected(new Set(savedIds ? savedIds.split(",") : [])); setDirty(false); setSaveStatus(""); onDirty(false); }, [draftReset, todayKey]);
  const daily = state.tasks.filter(task => isScheduled(task, today) || (task.daily && record[task.id]));
  const completed = daily.filter(task => selected.has(task.id));
  const wanted = state.rewards.find(reward => reward.enabled && reward.id === state.settings.wishRewardId) || state.rewards.find(reward => reward.enabled);
  async function toggle(id) {
    const { next, saved } = toggleAndSaveSelection(selected, id, onSubmitTasks);
    setSelected(next);
    setDirty(true); onDirty(true); setSaveStatus("saving");
    const ok = await saved;
    setDirty(!ok); onDirty(!ok); setSaveStatus(ok ? "saved" : "failed");
  }
  async function submit() {
    setSaveStatus("saving");
    const saved = await onSubmitTasks([...selected]);
    setSaveStatus(saved ? "saved" : "failed");
    if (saved) { setDirty(false); onDirty(false); }
  }
  const card = task => <TaskCard key={task.id} task={task} checked={selected.has(task.id)} detail={`${task.description} · ${rewardRule(task)}`} onToggle={() => toggle(task.id)} />;
  return <div className="screen-content"><div className="screen-heading"><div><span className="date-line">{today.toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "long" })}</span><h2>今天的小进步</h2></div><span className="streak-badge">本周坚持 {weekCompleted(state, today)} 天</span></div>
    <ProgressHero summary={summary} total={daily.length} />
    {CATEGORIES.map(category => { const tasks = daily.filter(task => taskCategory(task) === category && !selected.has(task.id)); return tasks.length ? <section className="section-block" key={category}><div className="section-title"><h3>{category}</h3><span>{tasks.length} 项待完成</span></div>{tasks.map(card)}</section> : null; })}
    {!daily.length && <p className="empty-state">今天没有安排日常任务，好好休息吧。</p>}
    {!!completed.length && <details className="section-block" open><summary>已经完成 {completed.length} 项</summary>{completed.map(card)}</details>}
    <button className="submit-checkin" onClick={submit} disabled={!dirty || saveStatus === "saving"}>{saveStatus === "saving" ? "正在自动保存…" : dirty ? "重新保存" : "今日记录已自动保存"}</button>
    <p className={`save-confirmation ${saveStatus === "failed" ? "error" : ""}`} role="status">{saveStatus === "saved" ? "✓ 打卡和星星已保存在这台设备" : saveStatus === "failed" ? "尚未保存；勾选内容仍保留，请点“重新保存”。" : "勾选或取消任务时立即保存；每个打卡日独立计分，不要求连续完成。"}</p>
    {wanted && <section className="wish-card"><span>我的下一个小期待</span><h3>{wanted.label}</h3><p>{wanted.description}</p><strong>{summary.availablePoints >= wanted.points ? "星星够啦，可以去奖品页兑换了" : `再积累 ${wanted.points - summary.availablePoints} 颗奖励星星`}</strong></section>}
  </div>;
}
