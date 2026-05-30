import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        content: 'src/ChromeExtensionContentCoordinator.ts',
        background: 'src/ChromeExtensionBackgroundService.ts'
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    }
  }
});
