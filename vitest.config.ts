import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"
import viteReact from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [viteReact()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "html", "json-summary", "lcov"],
      reportsDirectory: "./coverage",
      // Scope to the logic layer that unit/component tests target. Routes and
      // UI components are exercised by the Playwright E2E suite, which Vitest
      // can't measure, so including them here would report a misleadingly low
      // number. As we add component tests we can widen this include.
      include: ["src/lib/**/*.ts"],
      exclude: [
        "src/**/*.{test,spec}.{ts,tsx}",
        "src/**/*.d.ts",
        // Server functions are exercised by the integration + E2E jobs (which
        // run without coverage), so they'd skew this unit-coverage number.
        "src/lib/**/*.functions.ts",
        "src/lib/**/*.server.ts",
      ],
      // Soft thresholds: set a couple points below the current baseline
      // (statements 56.3 / branches 55.0 / functions 58.9 / lines 57.7) so the
      // run fails on regressions without demanding new tests. The small margin
      // avoids flaky failures from tiny line-count shifts. Ratchet these up as
      // coverage improves (or flip `autoUpdate` on to do it automatically).
      thresholds: {
        statements: 54,
        branches: 53,
        functions: 56,
        lines: 55,
        autoUpdate: false,
      },
    },
  },
})
