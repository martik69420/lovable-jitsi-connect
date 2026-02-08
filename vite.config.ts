import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'radix-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dismissable-layer',
            '@radix-ui/react-focus-scope',
            '@radix-ui/react-popover',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-toast',
            '@radix-ui/react-tabs',
            '@radix-ui/react-select',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-switch',
            '@radix-ui/react-scroll-area',
          ],
          'scroll-utils': [
            'react-remove-scroll',
          ],
        },
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "./src") },
    ],
    dedupe: ['react', 'react-dom'],
  },
}));
