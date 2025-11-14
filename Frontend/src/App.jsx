import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProductsProvider } from './contexts/ProductsContext';
import { CartProvider } from './contexts/CartContext';
import Login from './components/login-signup/Login';
import Signup from './components/login-signup/Signup';
import ResetPassword from './components/login-signup/ResetPassword';
import BuyerDashboard from './components/buyer dashboard/BuyerDashboard';
import GoogleCallback from './components/login-signup/GoogleCallback';
import ProtectedRoute from './components/ProtectedRoute';
import ProductDetailPage from './pages/ProductDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import BecomeSellerPage from './pages/BecomeSellerPage';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <ProductsProvider>
        <CartProvider>
          <Router>
            <div className="App">
              <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route path="/google-callback" element={<GoogleCallback />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <BuyerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/products/:productId"
                  element={
                    <ProtectedRoute>
                      <ProductDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute>
                      <CheckoutPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/become-seller"
                  element={
                    <ProtectedRoute>
                      <BecomeSellerPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </Router>
        </CartProvider>
      </ProductsProvider>
    </AuthProvider>
  );
}

export default App;