import {defineConfig} from 'vite';

export default defineConfig({
    build: {
        outDir: 'dist',
        emptyOutDir: false,
        lib: {
            entry: 'src/VSCodeExtensionBootstrap.ts',
            formats: ['cjs'],
            fileName: () => 'extension.js'
        },
        rollupOptions: {
            external: ['vscode', 'path']
        }
    }
});
