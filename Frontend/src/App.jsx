import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProductsProvider } from './contexts/ProductsContext';
import { CartProvider } from './contexts/CartContext';
import { AuctionProvider } from './contexts/AuctionContext';
import Login from './components/login-signup/Login';
import AdminLogin from './components/login-signup/AdminLogin';
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
import AuctionListing from './components/Auction/AuctionListing';
import AuctionDetail from './components/Auction/AuctionDetail';
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
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/admin-login" element={<AdminLogin />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/reset-password/:token" element={<ResetPassword />} />
                  <Route path="/google-callback" element={<GoogleCallback />} />
                <Route
                path="/dashboard"
                element={<BuyerDashboard />}
                />
                <Route
                path="/dashboard/products/:productId"
                element={<ProductDetailPage />}
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
                <Route
                  path="/auctions"
                  element={
                    <ProtectedRoute allowedRoles={['buyer', 'both']}>
                      <AuctionListing />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/auctions/:id"
                  element={
                    <ProtectedRoute allowedRoles={['buyer', 'both']}>
                      <AuctionDetail />
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