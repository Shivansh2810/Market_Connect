import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './components/login-signup/Login';
import Signup from './components/login-signup/Signup';
import BuyerDashboard from './components/buyer dashboard/BuyerDashboard';
import GoogleCallback from './components/login-signup/GoogleCallback';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/google-callback" element={<GoogleCallback />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <BuyerDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;