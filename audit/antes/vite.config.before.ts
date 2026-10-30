// ❌ ANTES: configuración por defecto. Sin manualChunks, sin análisis de bundle,
// console.log en producción y sourcemaps públicos.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: { sourcemap: true },
});
