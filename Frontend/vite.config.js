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
      // Show ALL files that have test coverage
      all: false,
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
      include: [
        // API/Services files with tests
        'services/order.js',
        'services/return.js',
        'services/review.js',
        'services/product.js',
        'services/payment.js',
        'services/user.js',
        'services/auction.js',
        // Core app files
        'src/App.jsx',
        // Context files with tests
        'src/contexts/AuthContext.jsx',
        'src/contexts/CartContext.jsx',
        'src/contexts/ProductsContext.jsx',
        'src/contexts/AuctionContext.jsx',
        // Component files with tests
        'src/components/ProtectedRoute.jsx',
        'src/components/admin dashboard/adminDashboard.jsx',
        'src/components/Auction/AuctionListing.jsx',
        'src/components/Auction/AuctionDetail.jsx',
        'src/components/login-signup/Login.jsx',
        'src/components/login-signup/Signup.jsx',
        'src/components/login-signup/AdminLogin.jsx',
        'src/components/login-signup/ResetPassword.jsx',
        'src/components/login-signup/GoogleCallback.jsx',
        'src/components/payment/PaymentGateway.jsx',
        'src/components/buyer dashboard/BuyerDashboard.jsx',
        'src/components/customerService/CustomerService.jsx',
        'src/components/seller dashboard/ReviewManagement.jsx',
        'src/components/seller dashboard/SellerDashboard.jsx',
        'src/components/seller dashboard/AddProduct.jsx',
        'src/components/profile/Profile.jsx',
        // Page files with tests
        'src/pages/BecomeSellerPage.jsx',
        'src/pages/CheckoutPage.jsx',
        'src/pages/ProductDetailPage.jsx'
      ]
    }
  }
})
