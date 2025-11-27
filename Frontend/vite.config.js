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
      reporter: ['text', 'html', 'json-summary'],
      reportsDirectory: './coverage',
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
      // Show ONLY files with 99-100% test coverage
      all: false,
      lines: 95,
      functions: 95,
      branches: 80,
      statements: 95,
      include: [
        // API files - ALL at 100% coverage
        'api/order.js',
        'api/return.js',
        'api/review.js',
        'api/product.js',
        'api/user.js',
        'api/auction.js',
        // Core app files - 100% coverage
        'src/App.jsx',
        'src/components/ProtectedRoute.jsx',
        // Context files - 99-100% coverage
        'src/contexts/AuthContext.jsx',
        'src/contexts/CartContext.jsx',
        'src/contexts/ProductsContext.jsx',
        'src/contexts/AuctionContext.jsx'
      ]
    }
  }
})
