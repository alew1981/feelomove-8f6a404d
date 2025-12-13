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
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tooltip', '@radix-ui/react-tabs'],
          'vendor-date': ['date-fns'],
        }
      }
    },
    chunkSizeWarningLimit: 500,
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
