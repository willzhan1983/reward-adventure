export function toggleAndSaveSelection(selected, taskId, save) {
  const next = new Set(selected);
  if (next.has(taskId)) next.delete(taskId);
  else next.add(taskId);
  return { next, saved: Promise.resolve(save([...next])) };
}
