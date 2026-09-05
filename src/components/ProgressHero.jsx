import React from "react";

export default function ProgressHero({ summary }) {
  const progress = Math.min(100, Math.round((summary.todayCount / 7) * 100));
  return <section className="progress-hero"><div className="hero-label">今日星星</div><div className="hero-value">{summary.todayCount} <span>★</span></div><div className="hero-meta">连续打卡 {summary.currentHomeworkStreak} 天</div><div className="hero-bar" aria-label={`今日完成${summary.todayCount}项`}><span style={{ width: `${progress}%` }} /></div></section>;
}
