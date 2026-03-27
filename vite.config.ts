import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dir = path.dirname(fileURLToPath(import.meta.url));

/** Copy RunAnywhere WASM binaries into dist/assets at build time */
function copyWasmPlugin(): Plugin {
  const llamacppWasm = path.resolve(__dir, 'node_modules/@runanywhere/web-llamacpp/wasm');
  const onnxWasm    = path.resolve(__dir, 'node_modules/@runanywhere/web-onnx/wasm');

  return {
    name: 'copy-wasm',
    writeBundle(options) {
      const outDir    = options.dir ?? path.resolve(__dir, 'dist');
      const assetsDir = path.join(outDir, 'assets');
      fs.mkdirSync(assetsDir, { recursive: true });

      const llamaFiles = [
        'racommons-llamacpp.wasm',
        'racommons-llamacpp.js',
        'racommons-llamacpp-webgpu.wasm',
        'racommons-llamacpp-webgpu.js',
      ];
      for (const f of llamaFiles) {
        const src = path.join(llamacppWasm, f);
        if (fs.existsSync(src)) fs.copyFileSync(src, path.join(assetsDir, f));
      }

      const sherpaDir = path.join(onnxWasm, 'sherpa');
      const sherpaOut = path.join(assetsDir, 'sherpa');
      if (fs.existsSync(sherpaDir)) {
        fs.mkdirSync(sherpaOut, { recursive: true });
        for (const f of fs.readdirSync(sherpaDir)) {
          fs.copyFileSync(path.join(sherpaDir, f), path.join(sherpaOut, f));
        }
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    copyWasmPlugin(),
  ],
  server: {
    headers: {
      // Required for SharedArrayBuffer / multi-threaded WASM
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
  assetsInclude: ['**/*.wasm'],
  worker: { format: 'es' },
  optimizeDeps: {
    // Prevent Vite from pre-bundling WASM packages so import.meta.url resolves correctly
    exclude: ['@runanywhere/web-llamacpp', '@runanywhere/web-onnx'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three:  ['three', '@react-three/fiber', '@react-three/drei'],
          framer: ['framer-motion'],
          dexie:  ['dexie'],
        },
      },
    },
  },
});
