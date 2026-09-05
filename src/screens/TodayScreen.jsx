import React from "react";
import ProgressHero from "../components/ProgressHero.jsx";
import TaskCard from "../components/TaskCard.jsx";
import { dateKeyFromDate } from "../domain/defaults.js";

const dateText = new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "long" });

export default function TodayScreen({ state, monthKey, summary, today, onToggleTask, onToggleGoal }) {
  const todayKey = dateKeyFromDate(today);
  const record = state.months[monthKey]?.days?.[todayKey] || {};
  const dailyTasks = state.tasks.filter((task) => task.enabled && task.daily);
  const goalTasks = state.tasks.filter((task) => task.enabled && !task.daily);
  return <div className="screen-content"><div className="screen-heading"><div><span className="date-line">{dateText.format(today)}</span><h2>今天收集星星</h2></div><span className="streak-badge">{summary.currentHomeworkStreak}天连胜</span></div><ProgressHero summary={summary} /><section className="section-block"><div className="section-title"><h3>今日任务</h3><span>{summary.todayCount}/{dailyTasks.length}</span></div>{dailyTasks.map((task) => <TaskCard key={task.id} task={task} checked={Boolean(record[task.id])} detail={task.id === "homework" ? `连续第${summary.currentHomeworkStreak}天` : `${summary.counts[task.id] || 0}天已完成`} onToggle={() => onToggleTask(task.id)} />)}</section><section className="section-block compact"><div className="section-title"><h3>阶段目标</h3><span>完成后记录</span></div>{goalTasks.map((task) => <TaskCard key={task.id} task={task} manual checked={Boolean(summary.goals[task.id])} detail={summary.goals[task.id] ? "已记录，积分已计入" : task.description} onToggle={() => onToggleGoal(task.id)} />)}</section></div>;
}
