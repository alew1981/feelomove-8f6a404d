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
        // AGGRESSIVE chunk splitting for faster mobile loading
        manualChunks: (id) => {
          // Skip non-node_modules (app code handled separately)
          if (!id.includes('node_modules')) return;
          
          // === CRITICAL PATH (loaded immediately) ===
          // Core React - absolute minimum for hydration
          if (id.includes('node_modules/react/') || id.includes('node_modules/scheduler/')) {
            return 'vendor-react-core';
          }
          // React DOM - needed for rendering
          if (id.includes('react-dom')) {
            return 'vendor-react-dom';
          }
          // Router - needed for navigation
          if (id.includes('react-router')) {
            return 'vendor-router';
          }
          
          // === DATA LAYER (loads with first API call) ===
          // TanStack Query - needed for data fetching
          if (id.includes('@tanstack/react-query')) {
            return 'vendor-query';
          }
          // Supabase client
          if (id.includes('@supabase')) {
            return 'vendor-supabase';
          }
          
          // === UI LAYER (can be slightly deferred) ===
          // Radix primitives - split by component family
          if (id.includes('@radix-ui/react-dialog') || id.includes('@radix-ui/react-alert-dialog')) {
            return 'vendor-ui-dialogs';
          }
          if (id.includes('@radix-ui/react-dropdown') || id.includes('@radix-ui/react-menu') || id.includes('@radix-ui/react-popover')) {
            return 'vendor-ui-menus';
          }
          if (id.includes('@radix-ui/react-select') || id.includes('@radix-ui/react-checkbox') || id.includes('@radix-ui/react-radio')) {
            return 'vendor-ui-forms';
          }
          if (id.includes('@radix-ui/react-scroll-area') || id.includes('@radix-ui/react-tabs') || id.includes('@radix-ui/react-accordion')) {
            return 'vendor-ui-layout';
          }
          if (id.includes('@radix-ui/')) {
            return 'vendor-ui-primitives';
          }
          
          // === UTILITIES (loaded on demand) ===
          // Date utilities - only needed when displaying dates
          if (id.includes('date-fns')) {
            return 'vendor-date';
          }
          // Icons - tree-shaken but still chunked separately
          if (id.includes('lucide-react')) {
            return 'vendor-icons';
          }
          // Form handling
          if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
            return 'vendor-forms';
          }
          // Carousel/embla
          if (id.includes('embla')) {
            return 'vendor-carousel';
          }
          // Recharts (heavy, always lazy load)
          if (id.includes('recharts') || id.includes('d3-')) {
            return 'vendor-charts';
          }
          // Helmet for SEO
          if (id.includes('react-helmet')) {
            return 'vendor-seo';
          }
          // Class utilities
          if (id.includes('clsx') || id.includes('tailwind-merge') || id.includes('class-variance')) {
            return 'vendor-styles';
          }
          
          // Catch-all for remaining node_modules
          return 'vendor-misc';
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
