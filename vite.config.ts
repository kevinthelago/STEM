import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  // Tauri: prevent vite from obscuring Rust errors
  clearScreen: false,
  // Tauri: tauri expects a fixed port
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      // exclude Tauri's watch from Vite's watcher
      ignored: ['**/src-tauri/**'],
    },
  },
  // Tauri: produce sourcemaps for debug builds
  build: {
    sourcemap: process.env.TAURI_DEBUG ? true : false,
    // Tauri supports es2021
    target: ['es2021', 'chrome100', 'safari13'],
    // don't minify for debug builds
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
  },
  // Tauri: use an env file to avoid exposing TAURI_* variables to Vite
  envPrefix: ['VITE_', 'TAURI_'],
})
