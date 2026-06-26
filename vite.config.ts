import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"
import { devtools } from "@tanstack/devtools-vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import { nitro } from "nitro/vite"
import viteReact from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

const config = defineConfig({
  // Bind the dev server to a fixed port and fail (instead of auto-incrementing
  // to the next free port) if it's already taken. A second `vite dev` would
  // otherwise start on another port but share the `node_modules/.vite` cache,
  // and its dep pre-bundling would trigger constant `full-reload`s in the first
  // instance's browser. Failing fast keeps a single dev server authoritative.
  server: {
    port: 3003,
    strictPort: true,
  },
  resolve: {
    tsconfigPaths: true,
    // Alias bare `kysely` imports to a shim that adds two constants Better
    // Auth's bundled SQLite/D1 dialect expects but kysely >= 0.29 dropped. See
    // the shim for details. Deep imports like `kysely/dist/...` are unaffected.
    alias: [
      {
        find: /^kysely$/,
        replacement: fileURLToPath(
          new URL("./vite-shims/kysely-compat.mjs", import.meta.url)
        ),
      },
    ],
  },
  // Nitro builds the server output and auto-applies the correct host preset
  // (e.g. `vercel` during a Vercel build), which produces a deployable
  // serverless output instead of a plain Node bundle.
  plugins: [devtools(), tailwindcss(), tanstackStart(), nitro(), viteReact()],
})

export default config
