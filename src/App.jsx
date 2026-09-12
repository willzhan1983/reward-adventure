import React, { useEffect, useMemo, useRef, useState } from "react";
import { dateKeyFromDate, monthKeyFromDate } from "./domain/defaults.js";
import { ensureCurrentMonth, getMonthSummary, redeemReward, setGoalStatus, submitDailyCheckIns } from "./domain/calculations.js";
import { loadState } from "./domain/storage.js";
import BottomNav from "./components/BottomNav.jsx";
import TodayScreen from "./screens/TodayScreen.jsx";
import MapScreen from "./screens/MapScreen.jsx";
import RewardsScreen from "./screens/RewardsScreen.jsx";
import SettingsScreen from "./screens/SettingsScreen.jsx";
import "./family.css";

async function requestFamily(method = "GET", data) {
  const response = await fetch("/api/family", { method, cache: "no-store", credentials: "same-origin", headers: { "Content-Type": "application/json" }, ...(data ? { body: JSON.stringify(data) } : {}), signal: AbortSignal.timeout(15000) });
  if (response.status === 401) throw Object.assign(new Error("请先登录后同步。"), { status: 401 });
  const body = await response.json();
  if (!response.ok) throw Object.assign(new Error(body.error || "同步失败，请重试。"), { status: response.status });
  return body;
}

export default function App() {
  const [state, setState] = useState(() => ensureCurrentMonth(loadState()));
  const [today, setToday] = useState(() => new Date());
  const [screen, setScreen] = useState("today");
  const [cloud, setCloud] = useState({ status: "loading", revision: 0, viewer: "", updatedAt: null });
  const [dirty, setDirty] = useState(false);
  const [draftReset, setDraftReset] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const revision = useRef(0);
  const saving = useRef(false);
  const pendingDraft = useRef(false);
  const conflict = useRef(false);
  const monthKey = monthKeyFromDate(today);
  const summary = useMemo(() => getMonthSummary(state, monthKey, today), [state, monthKey, today]);

  function markDirty(value) { pendingDraft.current = value; setDirty(value); }
  function accept(body) {
    revision.current = body.revision;
    setCloud(current => ({ ...current, ...body, state: undefined, status: body.state ? "ready" : "empty" }));
    if (body.state) setState(ensureCurrentMonth(body.state));
  }
  async function refresh(force = false) {
    if (saving.current || (!force && (pendingDraft.current || conflict.current))) return;
    const before = revision.current;
    try {
      const body = await requestFamily();
      if (saving.current || revision.current !== before || (!force && (pendingDraft.current || conflict.current))) return;
      accept(body); setError("");
      if (force) { conflict.current = false; markDirty(false); setDraftReset(value => value + 1); }
    } catch (err) { setError(err.message || "暂时连不上家庭同步，请检查网络后重试。"); }
  }
  useEffect(() => {
    refresh();
    const interval = setInterval(() => { if (!pendingDraft.current) setToday(new Date()); refresh(); }, 15000);
    const wake = () => { if (!pendingDraft.current) setToday(new Date()); refresh(); };
    window.addEventListener("focus", wake); window.addEventListener("online", wake);
    return () => { clearInterval(interval); window.removeEventListener("focus", wake); window.removeEventListener("online", wake); };
  }, []);
  useEffect(() => {
    const warn = event => { if (pendingDraft.current || saving.current) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  async function update(nextState) {
    if (saving.current || conflict.current) return false;
    saving.current = true; setBusy(true); setError("");
    try {
      const body = await requestFamily("PUT", { state: nextState, revision: revision.current });
      accept(body); markDirty(false); return true;
    } catch (err) {
      if (err.status === 409) conflict.current = true;
      setError(err.message || "网络中断，尚未确认保存，请重试。");
      return false;
    } finally { saving.current = false; setBusy(false); }
  }
  function submitTasks(taskIds, dateKey = dateKeyFromDate(today)) {
    let next = submitDailyCheckIns(state, dateKey, taskIds);
    const key = dateKey.slice(0, 7);
    next = { ...next, months: { ...next.months, [key]: { ...next.months[key], dayMeta: { ...next.months[key].dayMeta, [dateKey]: { backfilled: dateKey < dateKeyFromDate(today), at: new Date().toISOString(), by: cloud.viewer } } } } };
    return update(next);
  }
  function toggleGoal(taskId) {
    if (pendingDraft.current) { setError("请先保存当前日期的补记，再记录阶段目标。"); return false; }
    return update(setGoalStatus(state, monthKey, taskId, !state.months[monthKey]?.goals?.[taskId]));
  }
  function handleRedeem(rewardId) {
    const result = redeemReward(state, monthKey, rewardId);
    if (!result.ok) window.alert(result.reason);
    else if (window.confirm("确认兑换这个奖励？星星会从家庭账户中扣除。")) update(result.state);
  }
  function navigate(next) {
    if (saving.current) return;
    if (dirty && !window.confirm("还有未提交的修改。离开后将放弃这些修改，确定吗？")) return;
    markDirty(false); setScreen(next);
  }
  function reloadLatest() {
    if (dirty && !window.confirm("载入最新记录会放弃本页未提交的修改，确定吗？")) return;
    refresh(true);
  }
  const screenProps = { state, monthKey, summary, today, onSubmitTasks: submitTasks, onToggleGoal: toggleGoal, onRedeem: handleRedeem, onUpdate: update, busy, onDirty: markDirty, draftReset, cloud };
  return <main className="app-shell">
    <header className="app-header"><div className="brand-mark" aria-hidden="true">★</div><div><h1>获得奖励冒险</h1><p>一家人，一起积累小进步</p></div><div className="points-pill" aria-label={`可用积分${summary.availablePoints}颗星星`}>{summary.availablePoints} ★</div></header>
    <div className="sync-strip" role="status"><span>{busy ? "正在保存到家庭…" : dirty ? "有修改待提交" : cloud.status === "ready" ? "家庭记录已连接" : cloud.status === "empty" ? "首次启用家庭同步" : "正在读取家庭记录…"}</span><button onClick={reloadLatest} disabled={busy}>刷新</button></div>
    {error && <div className="notice error" role="alert"><p>{error}</p>{conflict.current ? <button className="secondary-button" onClick={reloadLatest}>载入最新记录</button> : <button className="secondary-button" onClick={() => refresh()}>重新连接</button>} <a href="/signin-with-chatgpt?return_to=%2F" target="_top">重新登录</a></div>}
    {cloud.status === "empty" && <section className="notice"><h2>把成长记录交给全家一起保存</h2><p>首次启用会把这台设备现有的任务和记录存入家庭。其他设备之后会读取同一份记录。</p><button className="primary-button" disabled={busy} onClick={() => update(state)}>启用家庭同步 · 保留本机记录</button></section>}
    {cloud.status === "loading" ? <p className="empty-state">正在连接，请稍候。暂时无法连接时可点击刷新重试。</p> : <fieldset className="screen-region" disabled={busy || cloud.status !== "ready" || conflict.current}>
      {screen === "today" && <TodayScreen {...screenProps} />}
      {screen === "map" && <MapScreen {...screenProps} />}
      {screen === "rewards" && <RewardsScreen {...screenProps} />}
      {screen === "settings" && <SettingsScreen {...screenProps} />}
    </fieldset>}
    <BottomNav screen={screen} onChange={navigate} />
  </main>;
}
