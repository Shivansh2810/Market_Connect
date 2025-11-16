import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/axios";
import { useAuth } from "../../contexts/AuthContext";
import "./Login.css";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (!email || !password) {
      setError("Email and password are required!");
      return;
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      setError("Enter a valid email address!");
      return;
    }

    setLoading(true);
    try {
      console.log('👑 Admin login attempt:', { email });

      const response = await api.post('/users/admin/login', {
        email: email.trim().toLowerCase(),
        password
      });

      console.log('✅ Admin login response:', response.data);

      if (response.data.token && response.data.user) {
        if (response.data.user.role !== 'admin') {
          setError("Access denied. Admin credentials required.");
          setLoading(false);
          return;
        }

        setError("");
        login(response.data.user, response.data.token);
        
        console.log('✅ Admin logged in successfully');
        navigate('/admin');
      } else {
        setError("Login failed. Please try again.");
      }
    } catch (err) {
      console.error('❌ Admin login error:', err);
      console.error('📡 Error response:', err.response?.data);
      
      let errorMsg = "Login failed. Please try again.";
      
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        errorMsg = "⚠️ Cannot connect to server. Please ensure:\n1. Backend is running on port 8080\n2. Your internet connection is active";
      } else if (err.response?.status === 401) {
        errorMsg = "Invalid admin credentials. Please check your email and password.";
      } else if (err.response?.status === 500) {
        errorMsg = "Server error. Please try again later.";
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>Admin Login</h1>
          <p>Access the administrative dashboard</p>
        </div>

        {error && (
          <div className="error-message" style={{ whiteSpace: 'pre-line' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Admin Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@marketplace.com"
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login as Admin"}
          </button>
        </form>

        <div className="admin-info" style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#f0f9ff',
          borderRadius: '8px',
          fontSize: '13px',
          color: '#1e40af'
        }}>
          <strong>🔐 Admin Access Only</strong>
          <p style={{ margin: '8px 0 0 0' }}>
            This login is restricted to administrators only. 
            If you don't have admin credentials, please use the regular login.
          </p>
        </div>
      </div>
    </div>
  );
}
