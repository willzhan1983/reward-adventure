import React, { useEffect, useState } from "react";
import { dateKeyFromDate } from "../domain/defaults.js";
import { getMonthSummary } from "../domain/calculations.js";
import { rewardRule, WEEKDAYS } from "../domain/family.js";
import TaskCard from "../components/TaskCard.jsx";

export default function MapScreen({ state, monthKey, today, onSubmitTasks, onToggleGoal, onDirty, draftReset }) {
  const [viewMonth, setViewMonth] = useState(monthKey);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState("");
  const [year, month] = viewMonth.split("-").map(Number);
  const summary = getMonthSummary(state, viewMonth, today);
  const days = state.months[viewMonth]?.days || {};
  const saved = selectedDay ? Object.keys(days[selectedDay] || {}).filter(id => days[selectedDay][id]).sort().join(",") : "";
  useEffect(() => { if (!dirty) setSelected(new Set(saved ? saved.split(",") : [])); }, [saved, dirty]);
  useEffect(() => { setDirty(false); onDirty(false); setSelected(new Set(saved ? saved.split(",") : [])); setMessage(""); }, [draftReset]);
  function choose(day) {
    if (dirty && !window.confirm("放弃当前日期尚未提交的修改？")) return;
    setSelectedDay(day); setSelected(new Set(Object.keys(days[day] || {}).filter(id => days[day][id]))); setDirty(false); onDirty(false); setMessage("");
  }
  function toggle(id) {
    const next = new Set(selected); if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next); const changed = [...next].sort().join(",") !== saved; setDirty(changed); onDirty(changed); setMessage("");
  }
  async function save() {
    const ok = await onSubmitTasks([...selected], selectedDay);
    setMessage(ok ? "✓ 这一天的记录已保存在这台设备" : "尚未保存，修改仍保留，请查看上方提示。");
    if (ok) { setDirty(false); onDirty(false); }
  }
  const count = Object.values(days).filter(record => Object.values(record).some(Boolean)).length;
  const options = [...new Set([monthKey, ...Object.keys(state.months)])].sort().reverse();
  const cells = [...Array(new Date(year, month - 1, 1).getDay()).fill(null), ...Array.from({ length: new Date(year, month, 0).getDate() }, (_, i) => i + 1)];
  return <div className="screen-content"><div className="screen-heading"><h2>冒险地图</h2><select className="month-select" aria-label="查看月份" value={viewMonth} onChange={event => { if (dirty && !window.confirm("放弃未提交的修改并切换月份？")) return; setViewMonth(event.target.value); setSelectedDay(null); setDirty(false); onDirty(false); }}>{options.map(key => <option key={key}>{key}</option>)}</select></div>
    <section className="map-card"><div className="map-caption"><strong>本月坚持 {count} 天</strong><span>点击日期查看或补记</span></div><div className="month-grid">{WEEKDAYS.map(day => <span className="weekday" key={day}>{day}</span>)}{cells.map((day, index) => { const key = day ? `${viewMonth}-${String(day).padStart(2, "0")}` : `blank-${index}`; const done = Object.values(days[key] || {}).some(Boolean); return <button key={key} className={`calendar-day ${!day ? "blank" : done ? "done" : ""} ${selectedDay === key ? "selected" : ""}`} disabled={!day || key > dateKeyFromDate(today)} onClick={() => choose(key)} aria-label={day ? `${day}日${done ? "已打卡" : "未打卡"}` : undefined}>{day || ""}</button>; })}</div></section>
    {selectedDay && <section className="day-editor"><h3>{selectedDay} · {selectedDay < dateKeyFromDate(today) ? "补记或更正" : "今日记录"}</h3>{state.months[viewMonth]?.dayMeta?.[selectedDay]?.backfilled && <p className="schedule-note">此日期有补记记录</p>}{state.tasks.filter(task => task.daily && (task.enabled || days[selectedDay]?.[task.id])).map(task => <TaskCard key={task.id} task={task} checked={selected.has(task.id)} onToggle={() => toggle(task.id)} />)}<button className="primary-button" disabled={!dirty} onClick={save}>保存这一天</button><p role="status" className="schedule-note">{message}</p></section>}
    <section className="section-block"><div className="section-title"><h3>阶段目标</h3><span>每月只计一次奖励</span></div>{state.tasks.filter(task => task.enabled && !task.daily).map(task => <TaskCard key={task.id} task={task} checked={!!summary.goals[task.id]} detail={`${task.description} · ${rewardRule(task)}`} onToggle={() => viewMonth === monthKey && onToggleGoal(task.id)} />)}{viewMonth !== monthKey && <p className="schedule-note">以往月份的阶段目标仅供查看。</p>}</section>
    <section className="section-block"><div className="section-title"><h3>星星怎么获得</h3><span>本月 {summary.earnedPoints} ★</span></div><p className="schedule-note">每天完成一项不等于获得一颗星。达到以下条件时计入奖励；连续任务仍按日历中的连续天数计算，休息日安排不会改变奖励规则。</p>{state.tasks.filter(task => task.enabled && task.daily).map(task => <div className="goal-row" key={task.id}><span className={summary.taskStatus[task.id] ? "goal-icon achieved" : "goal-icon"}>{summary.taskStatus[task.id] ? "✓" : "·"}</span><span><strong>{task.label}</strong><small>{rewardRule(task)}</small></span><b>{["streak", "piano"].includes(task.kind) ? `最长连续${summary.streaks[task.id]}天` : `累计${summary.counts[task.id]}天`}</b></div>)}</section>
  </div>;
}
