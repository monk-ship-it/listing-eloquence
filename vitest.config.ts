import { defineConfig } from "vitest/config";

// Standalone config so unit tests don't load the app's Vite/TanStack plugins.
export default defineConfig({
  test: { include: ["src/**/*.test.ts"], environment: "node" },
});
