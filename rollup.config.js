import resolve from '@rollup/plugin-node-resolve';
import { defineConfig } from 'rollup';
import svelte from 'rollup-plugin-svelte';
import preprocess from 'svelte-preprocess';

export default defineConfig({
  input: 'package/index.js',
  output: {
    file: 'package/index.js',
    format: 'esm',
  },
  plugins: [
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
