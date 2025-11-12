import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";
import "./Login.css";

const API_BASE_URL = "http://localhost:8080/api";

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  
  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const [accountType, setAccountType] = useState("");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Forgot Password State
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!accountType || !emailOrPhone || !password) {
      setError("All fields are required!");
      return;
    }

    const emailRegex = /\S+@\S+\.\S+/;
    const phoneRegex = /^[0-9]{10}$/;
    if (!emailRegex.test(emailOrPhone) && !phoneRegex.test(emailOrPhone)) {
      setError("Enter valid Email or Mobile Number!");
      return;
    }

    // Extract email from emailOrPhone (assuming it's email for now)
    const email = emailOrPhone;

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, {
        email,
        password,
        role: accountType
      });

      if (response.data.token && response.data.user) {
        // Store auth data
        login(response.data.user, response.data.token);
        // Navigate to dashboard
        navigate("/dashboard");
      } else {
        setError("Login failed. Please try again.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 
        "Login failed. Please check your credentials and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Redirect to Google OAuth
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");
    
    if (!forgotEmail) {
      setForgotError("Email is required!");
      return;
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(forgotEmail)) {
      setForgotError("Please enter a valid email address!");
      return;
    }

    setForgotLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/forgot-password`, {
        email: forgotEmail.toLowerCase().trim()
      });

      if (response.data.message) {
        setForgotSuccess(response.data.message);
        setForgotEmail("");
        // Close modal after 3 seconds
        setTimeout(() => {
          setShowForgotPassword(false);
          setForgotSuccess("");
        }, 3000);
      }
    } catch (err) {
      setForgotError(
        err.response?.data?.message || 
        "Failed to send reset email. Please try again."
      );
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="login-page">
      <header className="login-header">
        <h1>Market Connect</h1>
        <p>Your trusted marketplace for buyers & sellers</p>
      </header>

      <div className="login-container">
        <div className="login-left">
          <div className="role-labels">
            <span>Buyer</span>
            <span>Seller</span>
          </div>
          <img
            src="https://cdn-icons-png.freepik.com/256/17695/17695167.png"
            alt="Market Connect"
          />
        </div>

        <div className="login-right">
          <h2>Login to Your Account</h2>

          {error && (
            <div style={{ 
              color: 'red', 
              marginBottom: '15px', 
              padding: '10px', 
              backgroundColor: '#ffe6e6', 
              borderRadius: '5px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
            >
              <option value="">Select Account Type</option>
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
            </select>

            <input
              type="text"
              placeholder="Email / Mobile Number"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? "LOGGING IN..." : "LOGIN"}
            </button>
          </form>

          <div className="mt-4">
            <button
              onClick={handleGoogleLogin}
              className="btn-google"
            >
              <FcGoogle size={22} />
              <span>Continue with Google</span>
            </button>
          </div>

          <div className="flex-footer">
            <p>
              New User?{" "}
              <span onClick={() => navigate("/signup")} className="link">
                Signup
              </span>
            </p>
            <p 
              className="forgot link" 
              onClick={() => setShowForgotPassword(true)}
              style={{ cursor: 'pointer' }}
            >
              Forgot your password?
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="modal-overlay" onClick={() => {
          setShowForgotPassword(false);
          setForgotEmail("");
          setForgotError("");
          setForgotSuccess("");
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Forgot Password</h2>
              <button 
                className="modal-close" 
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotEmail("");
                  setForgotError("");
                  setForgotSuccess("");
                }}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <p style={{ marginBottom: '20px', color: '#666' }}>
                Enter your email address and we'll send you a link to reset your password.
              </p>

              {forgotError && (
                <div style={{ 
                  color: 'red', 
                  marginBottom: '15px', 
                  padding: '10px', 
                  backgroundColor: '#ffe6e6', 
                  borderRadius: '5px',
                  fontSize: '14px'
                }}>
                  {forgotError}
                </div>
              )}

              {forgotSuccess && (
                <div style={{ 
                  color: 'green', 
                  marginBottom: '15px', 
                  padding: '10px', 
                  backgroundColor: '#e6ffe6', 
                  borderRadius: '5px',
                  fontSize: '14px'
                }}>
                  {forgotSuccess}
                </div>
              )}

              <form onSubmit={handleForgotPassword}>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '6px',
                    fontSize: '15px',
                    marginBottom: '15px',
                    outline: 'none'
                  }}
                />
                <button 
                  type="submit" 
                  className="btn-login" 
                  disabled={forgotLoading}
                  style={{ width: '100%' }}
                >
                  {forgotLoading ? "SENDING..." : "SEND RESET LINK"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}