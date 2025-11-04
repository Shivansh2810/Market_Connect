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
              onClick={() => alert('Google Sign-In coming soon!')}
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
            <p className="forgot">Forgot your password?</p>
          </div>
        </div>
      </div>
    </div>
  );
}
