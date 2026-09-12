import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { familyPreview } from "./scripts/local-api.mjs";

export default defineConfig({
  base: "./",
  plugins: [react(), familyPreview()],
});
