import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      input: 'src/webview.ts',
      output: {
        entryFileNames: 'webview.js',
        format: 'iife'
      }
    }
  }
});
