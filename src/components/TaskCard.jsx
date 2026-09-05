import React from "react";

export default function TaskCard({ task, checked, detail, onToggle, manual = false }) {
  return <button className={checked ? "task-card completed" : "task-card"} onClick={onToggle} aria-pressed={checked}><span className="task-check" aria-hidden="true">{checked ? "✓" : ""}</span><span className="task-copy"><strong>{task.label}</strong><small>{detail || task.description}</small></span><span className="task-chevron" aria-hidden="true">{manual ? "记录" : ""}</span></button>;
}
