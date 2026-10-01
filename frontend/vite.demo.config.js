import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('./demo/', import.meta.url));

export default defineConfig({
  root,
  base: process.env.DEMO_BASE_PATH || '/',
  plugins: [react()],
  server: { port: 5174 },
  preview: { port: 4174 },
  build: {
    outDir: '../demo-dist',
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: fileURLToPath(new URL('./demo/index.html', import.meta.url)),
    },
  },
});