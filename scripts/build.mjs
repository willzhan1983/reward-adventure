import { build } from "vite";
import { mkdir, copyFile, cp } from "node:fs/promises";

await build({ build: { outDir: "dist/client", emptyOutDir: true } });
await build({ configFile: false, build: { outDir: "dist/server", emptyOutDir: true, lib: { entry: "server/worker.js", formats: ["es"], fileName: () => "index.js" } } });
await mkdir("dist/.openai", { recursive: true });
await copyFile(".openai/hosting.json", "dist/.openai/hosting.json");
await cp("drizzle", "dist/.openai/drizzle", { recursive: true });
