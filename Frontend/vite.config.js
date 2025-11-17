import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    port: 3000,
    open: true
  },

  build: {
    outDir: 'dist',
    sourcemap: true
  },

  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
    coverage: {
      provider: 'v8',
      reporter: ['text'],
      exclude: [
        'node_modules/',
        'src/setupTests.js',
        '**/*.test.{js,jsx}',
        '**/__tests__/**',
        '**/dist/**',
        '**/.{idea,git,cache,output,temp}/**',
        '**/{vite,vitest,postcss,tailwind}.config.{js,ts}',
        '**/main.jsx',
        '**/index.css',
        '**/*.css'
      ],
      all: true,
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80
    }
  }
})
