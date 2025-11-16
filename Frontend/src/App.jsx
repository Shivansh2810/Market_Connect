import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProductsProvider } from './contexts/ProductsContext';
import { CartProvider } from './contexts/CartContext';
import { AuctionProvider } from './contexts/AuctionContext';
import Login from './components/login-signup/Login';
import Signup from './components/login-signup/Signup';
import ResetPassword from './components/login-signup/ResetPassword';
import BuyerDashboard from './components/buyer dashboard/BuyerDashboard';
import SellerDashboard from './components/seller dashboard/SellerDashboard';
import AdminDashboard from './components/admin dashboard/adminDashboard';
import GoogleCallback from './components/login-signup/GoogleCallback';
import ProtectedRoute from './components/ProtectedRoute';
import ProductDetailPage from './pages/ProductDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import BecomeSellerPage from './pages/BecomeSellerPage';
import AuctionDetail from './components/auction/AuctionDetail';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <ProductsProvider>
        <CartProvider>
          <AuctionProvider>
          <Router>
            <div className="App">
              <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route path="/google-callback" element={<GoogleCallback />} />
                <Route path="/auction/:id" element={<AuctionDetail />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['buyer', 'both']}>
                      <BuyerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/products/:productId"
                  element={
                    <ErrorBoundary>
                      <ProtectedRoute allowedRoles={['buyer', 'both']}>
                        <ProductDetailPage />
                      </ProtectedRoute>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute allowedRoles={['buyer', 'both']}>
                      <CheckoutPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/seller-dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['seller', 'both']}>
                      <SellerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/become-seller"
                  element={
                    <ProtectedRoute allowedRoles={['buyer', 'both']}>
                      <BecomeSellerPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </Router>
          </AuctionProvider>
        </CartProvider>
      </ProductsProvider>
    </AuthProvider>
  );
}

export default App;