import React, { useEffect, useState } from "react";
import BackupControls from "../components/BackupControls.jsx";
import { CATEGORIES, WEEKDAYS, taskCategory } from "../domain/family.js";
import { loadState } from "../domain/storage.js";

function TaskEditor({ task, onSave, onDirty, onClose }) {
  useEffect(() => { onDirty(true); }, []);
  const [draft, setDraft] = useState({ ...task, category: taskCategory(task), weekdays: task.weekdays || [0, 1, 2, 3, 4, 5, 6] });
  const [message, setMessage] = useState("");
  function patch(value) { setDraft(current => ({ ...current, ...value })); onDirty(true); }
  async function submit(event) { event.preventDefault(); const ok = await onSave(draft); if (ok) { onDirty(false); onClose(); } else setMessage("未保存，编辑内容仍保留，请查看上方提示。"); }
  return <form className="editor-panel" onSubmit={submit}><h3>{task.id ? "编辑任务" : "新增任务"}</h3><div className="edit-fields"><label>任务名称<input required maxLength={100} value={draft.label} onChange={e => patch({ label: e.target.value })} /></label><label>完成标准<input value={draft.description} onChange={e => patch({ description: e.target.value })} /></label><label>类别<select value={draft.category} onChange={e => patch({ category: e.target.value })}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></label><label>奖励星星<input type="number" min="1" max="10000" required value={draft.points} onChange={e => patch({ points: Number(e.target.value) })} /></label><label>达标天数 / 次数<input type="number" min="1" max="10000" required value={draft.threshold} onChange={e => patch({ threshold: Number(e.target.value) })} /></label>{draft.daily && <div><span>每周出现的日期</span><div className="weekday-picker">{WEEKDAYS.map((day, i) => <label key={day}><input type="checkbox" checked={draft.weekdays.includes(i)} onChange={() => patch({ weekdays: draft.weekdays.includes(i) ? draft.weekdays.filter(d => d !== i) : [...draft.weekdays, i] })} />{day}</label>)}</div><p className="schedule-note">不选任何日期表示暂停日常提醒。连续任务的奖励条件仍按连续自然日计算。</p></div>}</div><div className="edit-actions"><button className="primary-button">保存任务</button><button type="button" className="secondary-button" onClick={() => { if (window.confirm("放弃此处未保存的编辑？")) { onDirty(false); onClose(); } }}>取消</button></div><p role="status">{message}</p></form>;
}

function RewardEditor({ reward, onSave, onDirty, onClose }) {
  useEffect(() => { onDirty(true); }, []);
  const [draft, setDraft] = useState(reward);
  function patch(value) { setDraft(current => ({ ...current, ...value })); onDirty(true); }
  return <form className="editor-panel" onSubmit={async event => { event.preventDefault(); if (await onSave(draft)) { onDirty(false); onClose(); } }}><h3>{reward.id ? "编辑奖励" : "新增奖励"}</h3><div className="edit-fields"><label>奖励名称<input required maxLength={100} value={draft.label} onChange={e => patch({ label: e.target.value })} /></label><label>奖励内容<input value={draft.description} onChange={e => patch({ description: e.target.value })} /></label><label>所需星星<input required type="number" min="1" max="10000" value={draft.points} onChange={e => patch({ points: Number(e.target.value) })} /></label></div><div className="edit-actions"><button className="primary-button">保存奖励</button><button type="button" className="secondary-button" onClick={() => { if (window.confirm("放弃此处未保存的编辑？")) { onDirty(false); onClose(); } }}>取消</button></div></form>;
}

export default function SettingsScreen({ state, onUpdate, onDirty, draftReset, cloud }) {
  const [editing, setEditing] = useState(null);
  useEffect(() => { setEditing(null); }, [draftReset]);
  async function saveItem(kind, draft) {
    const list = state[kind];
    const next = draft.id ? list.map(item => item.id === draft.id ? draft : item) : [...list, { ...draft, id: crypto.randomUUID(), enabled: true }];
    return onUpdate({ ...state, [kind]: next });
  }
  return <div className="screen-content"><div className="screen-heading"><h2>家庭与计划</h2></div><section className="editor-panel family-info"><h3>家庭同步</h3><p>当前成员：{cloud.viewer || "家庭成员"}</p><p>所有获准访问这个站点的家人共用一份记录。在没有待提交修改时，每15秒自动更新，也可以点击上方“刷新”。</p>{cloud.updatedAt && <p>最近保存：{new Date(cloud.updatedAt).toLocaleString("zh-CN")}<br />记录人：{cloud.updatedBy}</p>}<p>添加家人：请站点拥有者在 Sites 的共享设置中按邮箱授予家人访问权限。请保持仅邀请成员可见。</p></section>
    {editing ? editing.kind === "tasks" ? <TaskEditor key={editing.item.id || "new-task"} task={editing.item} onSave={draft => saveItem("tasks", draft)} onDirty={onDirty} onClose={() => setEditing(null)} /> : <RewardEditor key={editing.item.id || "new-reward"} reward={editing.item} onSave={draft => saveItem("rewards", draft)} onDirty={onDirty} onClose={() => setEditing(null)} /> : <>
      <details className="settings-editor" open><summary>每周任务安排</summary><div className="editor-panel">{state.tasks.map(task => <div className="settings-row" key={task.id}><span><strong>{task.label}{!task.enabled ? "（已停用）" : ""}</strong><small>{task.daily ? task.weekdays ? task.weekdays.length ? task.weekdays.slice().sort().map(d => `周${WEEKDAYS[d]}`).join("、") : "暂无安排" : "每天" : "阶段目标"}</small></span><button className="secondary-button" onClick={() => setEditing({ kind: "tasks", item: task })}>编辑</button><button className="tiny-button" onClick={() => saveItem("tasks", { ...task, enabled: !task.enabled })}>{task.enabled ? "停用" : "启用"}</button></div>)}<button className="primary-button" onClick={() => setEditing({ kind: "tasks", item: { label: "", description: "", points: 1, kind: "count", threshold: 1, daily: true, enabled: true } })}>新增日常任务</button></div></details>
      <details className="settings-editor"><summary>奖励与小心愿</summary><div className="editor-panel"><label>首页期待的奖励<select className="month-select" value={state.settings.wishRewardId || state.rewards.find(r => r.enabled)?.id || ""} onChange={e => onUpdate({ ...state, settings: { ...state.settings, wishRewardId: e.target.value } })}>{state.rewards.filter(r => r.enabled).map(r => <option value={r.id} key={r.id}>{r.label} · {r.points} 星</option>)}</select></label>{state.rewards.map(reward => <div className="settings-row" key={reward.id}><span><strong>{reward.label}</strong><small>{reward.points} 颗星{!reward.enabled ? " · 已停用" : ""}</small></span><button className="secondary-button" onClick={() => setEditing({ kind: "rewards", item: reward })}>编辑</button><button className="tiny-button" onClick={() => saveItem("rewards", { ...reward, enabled: !reward.enabled })}>{reward.enabled ? "停用" : "启用"}</button></div>)}<button className="primary-button" onClick={() => setEditing({ kind: "rewards", item: { label: "", description: "", points: 5, enabled: true } })}>新增奖励</button></div></details>
      <details className="settings-editor"><summary>备份与旧记录迁移</summary><section className="editor-panel"><p className="panel-hint">导出会下载当前家庭记录。导入会替换全家的现有记录，请先导出一份备份。</p><BackupControls state={state} onImport={onUpdate} /><p className="schedule-note">旧网址的记录：在原页面导出备份，再在这里导入。本机在升级前的旧版记录仍保留。</p><button className="secondary-button" onClick={() => { if (window.confirm("用本机升级前的旧版记录替换当前家庭记录？请确认已导出当前家庭备份。")) onUpdate(loadState()); }}>恢复本机旧版记录</button></section></details>
    </>}
    {editing?.item.id && <button className="tiny-button danger" onClick={async () => { if (!window.confirm("删除会影响任务和奖励统计，请先导出备份。确定删除？")) return; if (await onUpdate({ ...state, [editing.kind]: state[editing.kind].filter(item => item.id !== editing.item.id) })) { onDirty(false); setEditing(null); } }}>删除此项目</button>}
    <section className="tip-card"><strong>添加到手机桌面</strong><p>在 Safari 中打开站点，选择分享 → 添加到主屏幕。家人请使用各自获准访问的账号登录。</p></section>
  </div>;
}
