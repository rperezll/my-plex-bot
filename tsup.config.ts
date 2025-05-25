import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/bot.ts'],
  format: ['esm'],
  target: 'node18',
  outDir: 'dist',
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: true,
  shims: true,
});
