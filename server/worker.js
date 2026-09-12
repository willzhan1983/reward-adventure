import { validateFamilyState } from "../src/domain/family.js";

function json(body, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}

async function read(db) {
  const row = await db.prepare("SELECT state, revision, updated_at, updated_by FROM family_state WHERE id = 1").first();
  return row ? { state: JSON.parse(row.state), revision: row.revision, updatedAt: row.updated_at, updatedBy: row.updated_by } : { state: null, revision: 0 };
}

// Sites checks the private family audience before forwarding authenticated headers.
export async function familyApi(request, env) {
  const userId = request.headers.get("oai-authenticated-user-id");
  if (!userId) return json({ error: "请先登录，再打开家庭计划表。" }, 401);
  if (!env.DB) return json({ error: "家庭同步暂时不可用，请稍后重试。" }, 503);
  try {
    if (request.method === "GET") return json({ ...await read(env.DB), viewer: request.headers.get("oai-authenticated-user-email") || "家庭成员" });
    if (request.method !== "PUT") return json({ error: "不支持此操作。" }, 405);
    if (request.headers.get("Origin") !== new URL(request.url).origin) return json({ error: "请从家庭计划表页面提交。" }, 403);
    if (!request.headers.get("Content-Type")?.startsWith("application/json")) return json({ error: "提交格式不正确。" }, 415);
    const content = await request.text();
    if (content.length > 1_000_000) return json({ error: "记录过大，请先导出备份。" }, 413);
    let payload;
    try { payload = JSON.parse(content); } catch { return json({ error: "提交内容无法读取。" }, 400); }
    if (!Number.isSafeInteger(payload.revision) || payload.revision < 0 || !validateFamilyState(payload.state)) return json({ error: "记录格式或任务规则不正确，请检查后重试。" }, 400);
    const now = new Date().toISOString();
    const author = request.headers.get("oai-authenticated-user-email") || "家庭成员";
    const body = JSON.stringify(payload.state);
    const result = payload.revision === 0
      ? await env.DB.prepare("INSERT INTO family_state (id, state, revision, updated_at, updated_by) VALUES (1, ?, 1, ?, ?) ON CONFLICT(id) DO NOTHING").bind(body, now, author).run()
      : await env.DB.prepare("UPDATE family_state SET state = ?, revision = revision + 1, updated_at = ?, updated_by = ? WHERE id = 1 AND revision = ?").bind(body, now, author, payload.revision).run();
    if (result.meta.changes !== 1) return json({ error: "家人刚更新了记录。你的修改尚未提交，请先载入最新记录再修改。" }, 409);
    return json({ state: payload.state, revision: payload.revision + 1, updatedAt: now, updatedBy: author });
  } catch (error) {
    console.error("Family storage request failed", error);
    return json({ error: "暂时无法连接家庭记录，你的输入仍保留，请稍后重试。" }, 503);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/family") return familyApi(request, env);
    if (url.pathname.startsWith("/api/")) return json({ error: "接口不存在。" }, 404);
    return env.ASSETS.fetch(request);
  },
};
