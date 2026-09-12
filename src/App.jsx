import React, { useEffect, useMemo, useState } from "react";
import { dateKeyFromDate, monthKeyFromDate } from "./domain/defaults.js";
import { ensureCurrentMonth, getMonthSummary, redeemReward, setGoalStatus, submitDailyCheckIns } from "./domain/calculations.js";
import { loadState, saveState } from "./domain/storage.js";
import BottomNav from "./components/BottomNav.jsx";
import TodayScreen from "./screens/TodayScreen.jsx";
import MapScreen from "./screens/MapScreen.jsx";
import RewardsScreen from "./screens/RewardsScreen.jsx";
import SettingsScreen from "./screens/SettingsScreen.jsx";
import "./family.css";

export default function App() {
  const [state, setState] = useState(() => ensureCurrentMonth(loadState()));
  const [today, setToday] = useState(() => new Date());
  const [screen, setScreen] = useState("today");
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const monthKey = monthKeyFromDate(today);
  const summary = useMemo(() => getMonthSummary(state, monthKey, today), [state, monthKey, today]);

  useEffect(() => {
    const wake = () => { if (!dirty) setToday(new Date()); };
    window.addEventListener("focus", wake);
    return () => window.removeEventListener("focus", wake);
  }, [dirty]);
  useEffect(() => {
    const warn = event => { if (dirty) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function markDirty(value) { setDirty(value); }
  async function update(nextState) {
    if (!saveState(nextState)) {
      setError("保存失败，请退出无痕浏览后重试。");
      return false;
    }
    setState(nextState);
    setError("");
    setDirty(false);
    return true;
  }
  function submitTasks(taskIds, dateKey = dateKeyFromDate(today)) {
    let next = submitDailyCheckIns(state, dateKey, taskIds);
    const key = dateKey.slice(0, 7);
    next = { ...next, months: { ...next.months, [key]: { ...next.months[key], dayMeta: { ...next.months[key].dayMeta, [dateKey]: { backfilled: dateKey < dateKeyFromDate(today), at: new Date().toISOString(), by: "本机" } } } } };
    return update(next);
  }
  function toggleGoal(taskId) {
    if (dirty) { setError("请先保存当前日期的补记，再记录阶段目标。"); return false; }
    return update(setGoalStatus(state, monthKey, taskId, !state.months[monthKey]?.goals?.[taskId]));
  }
  function handleRedeem(rewardId) {
    const result = redeemReward(state, monthKey, rewardId);
    if (!result.ok) window.alert(result.reason);
    else if (window.confirm("确认兑换这个奖励？星星会从本机账户中扣除。")) update(result.state);
  }
  function navigate(next) {
    if (dirty && !window.confirm("还有未保存的修改。离开后将放弃这些修改，确定吗？")) return;
    setDirty(false);
    setScreen(next);
  }

  const screenProps = { state, monthKey, summary, today, onSubmitTasks: submitTasks, onToggleGoal: toggleGoal, onRedeem: handleRedeem, onUpdate: update, busy: false, onDirty: markDirty, draftReset: 0 };
  return <main className="app-shell">
    <header className="app-header"><div className="brand-mark" aria-hidden="true">★</div><div><h1>获得奖励冒险</h1><p>每天积累一点小进步</p></div><div className="points-pill" aria-label={`可用积分${summary.availablePoints}颗星星`}>{summary.availablePoints} ★</div></header>
    <div className="sync-strip" role="status"><span>{dirty ? "有修改待保存" : "记录已保存在这台设备"}</span></div>
    {error && <div className="notice error" role="alert"><p>{error}</p></div>}
    <fieldset className="screen-region">
      {screen === "today" && <TodayScreen {...screenProps} />}
      {screen === "map" && <MapScreen {...screenProps} />}
      {screen === "rewards" && <RewardsScreen {...screenProps} />}
      {screen === "settings" && <SettingsScreen {...screenProps} />}
    </fieldset>
    <BottomNav screen={screen} onChange={navigate} />
  </main>;
}
