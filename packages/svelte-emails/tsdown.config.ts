import path from "node:path";
import { defineConfig } from "tsdown";
import svelte from "rollup-plugin-svelte";
import { emitDts } from "svelte2tsx";
import { fileURLToPath } from "node:url";

export default defineConfig({
  outDir: "build",
  dts: false,
  plugins: [
    {
      /** Export component's types at the end of the build. */
      name: "rollup-plugin-svelte2dts",
      async closeBundle() {
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
      emitCss: false,
      compilerOptions: { generate: "server" },
    }),
  ],
});
