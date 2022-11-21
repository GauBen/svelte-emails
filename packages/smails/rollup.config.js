import resolve from '@rollup/plugin-node-resolve';
import { mkdir, readdir, rename, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { defineConfig } from 'rollup';
import svelte from 'rollup-plugin-svelte';
import preprocess from 'svelte-preprocess';
import { emitDts } from 'svelte2tsx';

export default defineConfig({
  input: 'src/lib/index.ts',
  output: {
    file: 'build/index.js',
    format: 'esm',
  },
  plugins: [
    {
      name: 'rollup-plugin-svelte2dts',
      /** Export component's types at the end of the build. */
      async buildEnd() {
        try {
          const require = createRequire(import.meta.url);

          // All the heavy lifting is done by svelte2tsx
          await emitDts({
            svelteShimsPath: require.resolve('svelte2tsx/svelte-shims.d.ts'),
            declarationDir: 'build-tmp',
          });

          await mkdir('build', { recursive: true });
          for (const file of await readdir('build-tmp/src/lib'))
            await rename(`build-tmp/src/lib/${file}`, `build/${file}`);
        } finally {
          await rm('build-tmp', { recursive: true, force: true });
        }
      },
    },
    svelte({
      preprocess: preprocess(),
      compilerOptions: {
        generate: 'ssr',
      },
    }),
    resolve({
      exportConditions: ['svelte'],
      extensions: ['.svelte'],
    }),
  ],
});
