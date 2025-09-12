import alias from "@rollup/plugin-alias";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { defineConfig } from "rollup";
import svelte from "rollup-plugin-svelte";
import { emitDts } from "svelte2tsx";
import svelteConfig from "./svelte.config.js";
import path from "node:path";

export default defineConfig({
  input: "src/index.ts",
  output: {
    file: "build/index.js",
    format: "esm",
  },
  external: ["mjml"],
  plugins: [
    {
      /** Export component's types at the end of the build. */
      name: "rollup-plugin-svelte2dts",
      async buildEnd() {
        const require = createRequire(import.meta.url);

        // All the heavy lifting is done by svelte2tsx
        await emitDts({
          svelteShimsPath: require.resolve("svelte2tsx/svelte-shims.d.ts"),
          declarationDir: "build",
          libRoot: "src",
          tsconfig: path.resolve("tsconfig.json"),
        });

        // We need to replace `.svelte` with `.svelte.js` for types to be resolved
        const index = "build/mails/index.d.ts";
        const code = await readFile(index, "utf-8");
        await writeFile(index, code.replaceAll(".svelte", ".svelte.js"));
      },
    },
    svelte({
      ...svelteConfig,
      compilerOptions: { generate: "server" },
      emitCss: false,
    }),
    resolve({ exportConditions: ["svelte"], extensions: [".svelte"] }),
    typescript({ sourceMap: false }),
    alias({ entries: [{ find: "$lib", replacement: "src/lib" }] }),
  ],
});
