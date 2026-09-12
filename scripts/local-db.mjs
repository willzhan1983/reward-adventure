import { DatabaseSync } from "node:sqlite";
import { readdirSync, readFileSync, mkdirSync } from "node:fs";

// Local preview adapter only; production uses the Sites D1 binding.
export function localDatabase(filename = ":memory:") {
  if (filename !== ":memory:") mkdirSync(".sites-runtime", { recursive: true });
  const sqlite = new DatabaseSync(filename);
  sqlite.exec("CREATE TABLE IF NOT EXISTS local_migrations (name TEXT PRIMARY KEY)");
  for (const name of readdirSync("drizzle").filter(name => name.endsWith(".sql")).sort()) {
    if (sqlite.prepare("SELECT name FROM local_migrations WHERE name = ?").get(name)) continue;
    sqlite.exec(readFileSync(`drizzle/${name}`, "utf8"));
    sqlite.prepare("INSERT INTO local_migrations VALUES (?)").run(name);
  }
  return { close: () => sqlite.close(), prepare(sql) {
    let params = [];
    const statement = { bind(...values) { params = values; return statement; }, async first() { return sqlite.prepare(sql).get(...params) || null; }, async run() { return { meta: { changes: Number(sqlite.prepare(sql).run(...params).changes) } }; } };
    return statement;
  } };
}
