import { STORAGE_KEY, createInitialState } from "./defaults.js";
import { normaliseState } from "./model.js";

export function loadState(storage = globalThis.localStorage, now = new Date()) {
  if (!storage) return createInitialState(now);
  try {
    return normaliseState(JSON.parse(storage.getItem(STORAGE_KEY)), now);
  } catch {
    return createInitialState(now);
  }
}

export function saveState(state, storage = globalThis.localStorage) {
  if (!storage) return;
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function exportBackup(state) {
  return JSON.stringify({ schema: "reward-adventure", version: state.version, exportedAt: new Date().toISOString(), state }, null, 2);
}

export function importBackup(json, now = new Date()) {
  let parsed;
  try { parsed = JSON.parse(json); } catch { throw new Error("备份文件不是有效的JSON"); }
  if (parsed?.schema !== "reward-adventure" || !parsed.state) throw new Error("备份文件格式不兼容");
  return normaliseState(parsed.state, now);
}
