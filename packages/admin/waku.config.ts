import { join } from "node:path"
import babel from "@rolldown/plugin-babel"
import tailwindcss from "@tailwindcss/vite"
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react"
import Inspect from "vite-plugin-inspect"
import { defineConfig } from "waku/config"

export default defineConfig({
  vite: {
    server: {
      port: Number.parseInt(process.env.PORT || "3000", 10),
    },
    devtools: true,
    plugins: [
      tailwindcss(),
      Inspect(),
      viteReact(),
      babel({
        presets: [reactCompilerPreset()],
      }),
    ],
    resolve: {
      dedupe: ["react", "react-dom"],
      alias: {
        "broadcaster-components": join(
          import.meta.dirname,
          "../components/src",
        ),
        "broadcaster-db": join(import.meta.dirname, "../db/src"),
        "slack-parser": join(import.meta.dirname, "../slack-parser/src"),
      },
    },
  },
  srcDir: "./src/ui",
})
