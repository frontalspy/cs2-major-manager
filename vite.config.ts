import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// base "./" keeps asset URLs relative, so the build works from any GitHub
// Pages sub-path. Navigation is hash-based, so no 404 fallback is needed.
export default defineConfig({
  plugins: [react()],
  base: "./",
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
});
