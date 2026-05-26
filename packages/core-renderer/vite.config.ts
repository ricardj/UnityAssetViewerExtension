import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    fs: {
      allow: ['..', '/app/unity-test-project']
    }
  }
});
