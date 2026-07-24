import path from "node:path";
import { defineConfig } from "rolldown";
import svelte from "rollup-plugin-svelte";
import { emitDts } from "svelte2tsx";
import svelteConfig from "./svelte.config.js";
import { fileURLToPath } from "node:url";
import { viteAliasPlugin } from "rolldown/experimental";

// Remove `kit` to avoid a warning
delete svelteConfig.kit;

export default defineConfig({
  input: "src/index.ts",
  output: {
    file: "build/index.js",
    format: "esm",
  },
  platform: "node",
  external: ["mjml"],
  plugins: [
    viteAliasPlugin({
      entries: [
        {
          find: "$lib",
          replacement: path.resolve("src/lib"),
        },
      ],
    }),
    {
      /** Export component's types at the end of the build. */
      name: "rollup-plugin-svelte2dts",
      async buildEnd() {
        // All the heavy lifting is done by svelte2tsx
        await emitDts({
          svelteShimsPath: fileURLToPath(
            import.meta.resolve("svelte2tsx/svelte-shims-v4.d.ts"),
          ),
          declarationDir: "build",
          libRoot: "src",
          tsconfig: path.resolve("tsconfig.json"),
        });
      },
    },
    svelte({
      ...svelteConfig,
      compilerOptions: { generate: "server" },
      emitCss: false,
    }),
  ],
});
