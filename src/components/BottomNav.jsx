import React from "react";

const items = [["today", "任务", "✓"], ["map", "地图", "◌"], ["rewards", "奖品", "★"], ["settings", "设置", "⚙"]];

export default function BottomNav({ screen, onChange }) {
  return <nav className="bottom-nav" aria-label="主导航">{items.map(([id, label, icon]) => <button key={id} className={screen === id ? "nav-item active" : "nav-item"} onClick={() => onChange(id)} aria-current={screen === id ? "page" : undefined}><span className="nav-icon" aria-hidden="true">{icon}</span><span>{label}</span></button>)}</nav>;
}
