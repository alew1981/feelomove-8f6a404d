import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { generateSitemap } from "./src/utils/sitemap";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    // Enable minification for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
      },
    },
    // Optimize CSS
    cssMinify: true,
    // Generate source maps only in development
    sourcemap: mode !== 'production',
    // Optimize chunks
    rollupOptions: {
      output: {
        // Optimize chunk splitting for better caching and lazy loading
        manualChunks: (id) => {
          // Core React bundle - loaded immediately
          if (id.includes('react-dom') || id.includes('react-router-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/react/')) {
            return 'vendor-react';
          }
          // TanStack Query - needed for data fetching
          if (id.includes('@tanstack/react-query')) {
            return 'vendor-query';
          }
          // Supabase client - needed for data
          if (id.includes('@supabase/supabase-js')) {
            return 'vendor-supabase';
          }
          // UI components from Radix - can be deferred
          if (id.includes('@radix-ui/')) {
            return 'vendor-ui';
          }
          // Date utilities
          if (id.includes('date-fns')) {
            return 'vendor-date';
          }
          // Lucide icons - tree-shake individual icons
          if (id.includes('lucide-react')) {
            return 'vendor-icons';
          }
        },
        // Treeshake unused exports
        experimentalMinChunkSize: 10000,
        // Use content hash for better caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          // Put images in their own folder with hashes
          if (assetInfo.name && /\.(png|jpe?g|gif|svg|webp|avif)$/i.test(assetInfo.name)) {
            return 'assets/images/[name]-[hash][extname]';
          }
          // Fonts
          if (assetInfo.name && /\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return 'assets/fonts/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
    // Increase warning limit slightly
    chunkSizeWarningLimit: 600,
    // Target modern browsers for smaller bundles
    target: 'es2020',
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
  },
  plugins: [
    react(), 
    mode === "development" && componentTagger(),
    {
      name: 'generate-sitemap',
      closeBundle: async () => {
        if (mode === 'production') {
          await generateSitemap();
          console.log('✅ Sitemap generated successfully');
        }
      }
    }
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
