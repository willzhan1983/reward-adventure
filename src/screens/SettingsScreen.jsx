import React from "react";

export default function SettingsScreen({ state }) {
  return <div className="screen-content"><div className="screen-heading"><div><span className="date-line">规则管理</span><h2>设置</h2></div><span className="settings-count">{state.tasks.length}项任务</span></div><section className="settings-list"><div className="settings-row"><span><strong>任务管理</strong><small>新增、修改、停用或删除任务</small></span><b>›</b></div><div className="settings-row"><span><strong>奖励管理</strong><small>调整星星商店的奖励</small></span><b>›</b></div><div className="settings-row"><span><strong>月度归档</strong><small>查看以前的打卡记录</small></span><b>›</b></div><div className="settings-row"><span><strong>数据备份</strong><small>导出或导入本地 JSON</small></span><b>›</b></div></section><section className="tip-card"><strong>添加到苹果手机桌面</strong><p>在 Safari 打开后，点击分享按钮，再选择“添加到主屏幕”。以后可以像打开普通 App 一样使用。</p></section><p className="settings-note">当前版本：本地保存 · 无需密码 · 无需账号</p></div>;
}
