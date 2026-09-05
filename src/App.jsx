import React, { useEffect, useMemo, useState } from "react";
import { dateKeyFromDate, monthKeyFromDate } from "./domain/defaults.js";
import { ensureCurrentMonth, getMonthSummary, redeemReward, setGoalStatus, submitDailyCheckIns } from "./domain/calculations.js";
import { loadState, saveState } from "./domain/storage.js";
import BottomNav from "./components/BottomNav.jsx";
import TodayScreen from "./screens/TodayScreen.jsx";
import MapScreen from "./screens/MapScreen.jsx";
import RewardsScreen from "./screens/RewardsScreen.jsx";
import SettingsScreen from "./screens/SettingsScreen.jsx";

const today = new Date();

export default function App() {
  const [state, setState] = useState(() => ensureCurrentMonth(loadState()));
  const [screen, setScreen] = useState("today");
  const monthKey = state.settings.currentMonth || monthKeyFromDate(today);
  const summary = useMemo(() => getMonthSummary(state, monthKey, today), [state, monthKey]);

  useEffect(() => saveState(state), [state]);

  function update(nextState) { setState(nextState); }
  function submitTasks(taskIds, dateKey = dateKeyFromDate(today)) { update(submitDailyCheckIns(state, dateKey, taskIds)); }
  function toggleGoal(taskId) { update(setGoalStatus(state, monthKey, taskId, !state.months[monthKey]?.goals?.[taskId])); }
  function handleRedeem(rewardId) {
    const result = redeemReward(state, monthKey, rewardId);
    if (!result.ok) window.alert(result.reason); else update(result.state);
  }

  const screenProps = { state, monthKey, summary, today, onSubmitTasks: submitTasks, onToggleGoal: toggleGoal, onRedeem: handleRedeem, onUpdate: update };
  return <main className="app-shell">
    <header className="app-header"><div className="brand-mark" aria-hidden="true">★</div><div><h1>获得奖励冒险</h1><p>每天收集一点星星</p></div><div className="points-pill" aria-label={`可用积分${summary.availablePoints}颗星星`}>{summary.availablePoints} <span>★</span></div></header>
    <section className="screen-region">
      {screen === "today" && <TodayScreen {...screenProps} />}
      {screen === "map" && <MapScreen {...screenProps} />}
      {screen === "rewards" && <RewardsScreen {...screenProps} />}
      {screen === "settings" && <SettingsScreen {...screenProps} />}
    </section>
    <BottomNav screen={screen} onChange={setScreen} />
  </main>;
}
