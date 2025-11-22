import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../services/axios";
import { useAuth } from "../../contexts/AuthContext";
import "./ResetPassword.css";

// using shared api instance

export default function ResetPassword() {
  const navigate = useNavigate();
  const { token } = useParams();
  const { isAuthenticated } = useAuth();
  
  const [form, setForm] = useState({
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tokenValid, setTokenValid] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      setError("Invalid or missing reset token.");
    }
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.password || !form.confirmPassword) {
      setError("All fields are required!");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/users/reset-password`, {
        token,
        password: form.password,
        confirmPassword: form.confirmPassword
      });

      if (response.data.message) {
        setSuccess("Password reset successfully! Redirecting to login...");
        
        setTimeout(() => {
          navigate("/");
        }, 3000);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 
        "Failed to reset password. The link may have expired. Please request a new reset link."
      );
      if (err.response?.data?.message?.includes('token')) {
        setTokenValid(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendLink = () => {
    navigate("/");
  };

  if (!tokenValid) {
    return (
      <div className="reset-password-page">
        <header className="reset-password-header">
          <h1>Market Connect</h1>
          <p>Your trusted marketplace for buyers & sellers</p>
        </header>

        <div className="reset-password-container">
          <div className="reset-password-card">
            <div className="reset-password-icon error">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </div>
            
            <h2>Invalid Reset Link</h2>
            
            <div className="error-message">
              {error || "This password reset link is invalid or has expired."}
            </div>

            <p className="reset-instructions">
              Please request a new password reset link from the login page.
            </p>

            <button 
              onClick={handleResendLink}
              className="btn-primary"
            >
              Go to Login Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-page">
      <header className="reset-password-header">
        <h1>Market Connect</h1>
        <p>Your trusted marketplace for buyers & sellers</p>
      </header>

      <div className="reset-password-container">
        <div className="reset-password-card">
          <div className="reset-password-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          
          <h2>Reset Your Password</h2>
          <p className="reset-instructions">
            Enter your new password below. Make sure it's strong and secure.
          </p>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="password">New Password</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Enter new password"
                value={form.password}
                onChange={handleChange}
                disabled={loading || success}
                required
              />
              <div className="password-requirements">
                <span>Must contain:</span>
                <ul>
                  <li className={form.password.length >= 6 ? 'valid' : ''}>At least 6 characters</li>
                  <li className={/[a-z]/.test(form.password) ? 'valid' : ''}>One lowercase letter</li>
                  <li className={/[A-Z]/.test(form.password) ? 'valid' : ''}>One uppercase letter</li>
                  <li className={/\d/.test(form.password) ? 'valid' : ''}>One number</li>
                </ul>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Confirm new password"
                value={form.confirmPassword}
                onChange={handleChange}
                disabled={loading || success}
                required
              />
              {form.confirmPassword && form.password === form.confirmPassword && (
                <div className="password-match valid">
                  ✓ Passwords match
                </div>
              )}
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <div className="password-match error">
                  ✗ Passwords do not match
                </div>
              )}
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading || success}
            >
              {loading ? "RESETTING PASSWORD..." : "RESET PASSWORD"}
            </button>
          </form>

          <div className="reset-footer">
            <p>
              Remember your password?{" "}
              <span onClick={() => navigate("/")} className="link">
                Back to Login
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}