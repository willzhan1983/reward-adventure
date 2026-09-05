import React, { useRef } from "react";
import { exportBackup, importBackup } from "../domain/storage.js";

export default function BackupControls({ state, onImport }) {
  const inputRef = useRef(null);
  function download() {
    const blob = new Blob([exportBackup(state)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `获得奖励冒险备份-${state.settings.currentMonth}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
  async function readFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const next = importBackup(await file.text());
      const months = Object.keys(next.months).length;
      if (window.confirm(`备份中包含${months}个月的记录，确定恢复吗？`)) onImport(next);
    } catch (error) { window.alert(error.message); }
    event.target.value = "";
  }
  return <div className="backup-controls"><button className="secondary-button" onClick={download}>导出本地备份</button><button className="secondary-button" onClick={() => inputRef.current?.click()}>导入本地备份</button><input ref={inputRef} type="file" accept="application/json,.json" onChange={readFile} hidden /></div>;
}
