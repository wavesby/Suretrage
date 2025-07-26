import { defineConfig } from 'vite'
import react from "@vitejs/plugin-react-swc"
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    open: true,
    // Add proxy configuration to forward API requests to our server
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      },
      '/health': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  // Explicitly exclude Node.js built-in modules from client build
  optimizeDeps: {
    exclude: ['fs', 'path', 'url', 'fs/promises']
  },
  // Tell Vite to ignore Node.js built-in modules
  build: {
    rollupOptions: {
      external: ['fs', 'path', 'url', 'fs/promises']
    }
  }
})
