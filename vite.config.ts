import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

/**
 * Configuración optimizada tras la auditoría de bundle.
 *  - manualChunks: separa vendors estables (cache de larga duración en el navegador).
 *  - recharts / dompurify NO se agrupan en vendor: viajan solo con la ruta lazy que los usa.
 *  - envPrefix explícito: solo VITE_* llega al cliente.
 *  - ANALYZE=true genera stats.html con rollup-plugin-visualizer.
 */
export default defineConfig(({ mode }) => {
  const plugins: PluginOption[] = [react()];
  if (process.env.ANALYZE === 'true') {
    plugins.push(
      visualizer({ filename: 'stats.html', template: 'treemap', gzipSize: true, brotliSize: true }) as PluginOption,
    );
  }

  return {
    plugins,
    envPrefix: 'VITE_',
    build: {
      target: 'es2020',
      sourcemap: mode !== 'production' ? true : false,
      cssCodeSplit: true,
      chunkSizeWarningLimit: 400, // el único chunk >250 kB es AdminPage (recharts), diferido y solo para admins
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'vendor-react';
            if (id.includes('react-router') || id.includes('@remix-run')) return 'vendor-router';
            if (id.includes('@supabase')) return 'vendor-supabase'; // auth-js + postgrest-js
            return undefined; // recharts, dompurify, d3… se quedan en el chunk lazy de su ruta
          },
        },
      },
    },
    esbuild: mode === 'production' ? { drop: ['console', 'debugger'] } : {},
  };
});
