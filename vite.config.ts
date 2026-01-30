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
        // AGGRESSIVE CHUNK SPLITTING for better caching and reduced initial load
        // CRITICAL: Keep react/react-dom/react-router-dom in main bundle
        manualChunks: (id) => {
          // Core React stays in main bundle - DO NOT separate
          if (id.includes('node_modules/react/') || 
              id.includes('node_modules/react-dom/') || 
              id.includes('node_modules/react-router-dom/') ||
              id.includes('node_modules/scheduler/')) {
            return undefined; // Let Vite include in main bundle
          }
          
          // CRITICAL PATH: Query library needed early
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'vendor-query';
          }
          
          // DEFER: Supabase (loaded after initial render)
          if (id.includes('node_modules/@supabase/')) {
            return 'vendor-supabase';
          }
          
          // DEFER: Heavy UI libraries (not needed for first paint)
          if (id.includes('node_modules/@radix-ui/')) {
            return 'vendor-radix';
          }
          
          // DEFER: Charts (never on initial load)
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3')) {
            return 'vendor-charts';
          }
          
          // DEFER: Date utilities (replaced with native Intl in critical paths)
          if (id.includes('node_modules/date-fns')) {
            return 'vendor-date';
          }
          
          // DEFER: Icons (inline SVGs used in critical paths)
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          
          // DEFER: Form libraries
          if (id.includes('node_modules/react-hook-form') || id.includes('node_modules/zod')) {
            return 'vendor-forms';
          }
          
          // DEFER: Carousel/embla
          if (id.includes('node_modules/embla-carousel')) {
            return 'vendor-carousel';
          }
        },
        // Use content hash for better caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && /\.(png|jpe?g|gif|svg|webp|avif)$/i.test(assetInfo.name)) {
            return 'assets/images/[name]-[hash][extname]';
          }
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
