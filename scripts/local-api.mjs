import { familyApi } from "../server/worker.js";
import { localDatabase } from "./local-db.mjs";

export function familyPreview() {
  return { name: "family-local-api", configureServer(server) {
    const db = localDatabase(".sites-runtime/family.sqlite");
    server.httpServer?.on("close", () => db.close());
    server.middlewares.use(async (req, res, next) => {
      if (req.url?.split("?")[0] !== "/api/family") return next();
      const host = req.headers.host;
      if (!/^127\.0\.0\.1:\d+$/.test(host || "")) { res.writeHead(403); res.end(); return; }
      let body = "";
      for await (const chunk of req) body += chunk;
      const headers = new Headers(req.headers);
      headers.set("oai-authenticated-user-id", "local-preview");
      headers.set("oai-authenticated-user-email", "preview@example.test");
      const response = await familyApi(new Request(`http://${host}${req.url}`, { method: req.method, headers, ...(body ? { body } : {}) }), { DB: db });
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(await response.text());
    });
  } };
}
