import React from "react";

export default function ProgressHero({ summary, total }) {
  const progress = total ? Math.min(100, Math.round((summary.todayCount / total) * 100)) : 0;
  return <section className="progress-hero"><div className="hero-label">今日已提交</div><div className="hero-value">{summary.todayCount} <span>/ {total} 项</span></div><div className="hero-meta">本月已获得 {summary.earnedPoints} 颗奖励星星</div><div className="hero-bar" aria-label={`今日完成${summary.todayCount}项`}><span style={{ width: `${progress}%` }} /></div></section>;
}
