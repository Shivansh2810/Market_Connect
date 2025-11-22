import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import api from "../../../services/axios";
import { useAuth } from "../../contexts/AuthContext";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const location = useLocation();

  const [accountType, setAccountType] = useState("buyer");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");

  const handleSubmit = async (e) => {
    // ✅ COMPLETE PREVENTION OF DEFAULT BEHAVIOR
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    if (e && e.stopImmediatePropagation) {
      e.stopImmediatePropagation();
    }
    
    // ✅ PREVENT ANY FORM SUBMISSION RELOAD
    const form = e ? e.target : null;
    if (form && form.reset) {
      setTimeout(() => {
        form.reset = () => {}; // Override reset to prevent clearing
      }, 0);
    }
    
    console.log('🔄 Form submission completely prevented');
    
    setError("");
    
    // Basic validation
    if (!emailOrPhone || !password) {
      setError("Email and password are required!");
      return false; // ✅ Prevent further execution
    }

    const emailRegex = /\S+@\S+\.\S+/;
    const phoneRegex = /^[0-9]{10}$/;
    if (!emailRegex.test(emailOrPhone) && !phoneRegex.test(emailOrPhone)) {
      setError("Enter valid Email or Mobile Number!");
      return false; // ✅ Prevent further execution
    }

    const email = emailOrPhone.trim().toLowerCase();

    setLoading(true);
    try {
      console.log('🔑 Login attempt:', { email, role: accountType });
      
      const isAdminEmail = email === 'admin@marketplace.com' || email === 'admin@marketconnect.com';
      
      let response;
      if (isAdminEmail) {
        console.log('👑 Admin login detected');
        response = await api.post('/users/admin/login', {
          email,
          password
        });
      } else {
        response = await api.post('/users/login', {
          email,
          password,
          role: accountType
        });
      }

      console.log('✅ Login API response:', response.data);

      if (response.data.token && response.data.user) {
    console.log('🎯 Calling AuthContext.login()...');
    
    setError("");
    login(response.data.user, response.data.token);
    
    const userRole = response.data.user.role;
    console.log('➡️ User role:', userRole);
    console.log('➡️ Account type selected:', accountType);

    // 1. Always prioritize Admin
    if (userRole === 'admin') {
      console.log('➡️ Redirecting to /admin');
      navigate('/admin');
    } 
    // 2. Prioritize Seller if selected
    else if (accountType === 'seller' && (userRole === 'seller' || userRole === 'both')) {
      console.log('➡️ Redirecting to /seller-dashboard');
      navigate('/seller-dashboard');
    } 
    // 3. Handle Buyer (this is where the 'from' redirect now lives)
    else {
      // Check for a redirect-back path, only for buyers
      const from = location.state?.from?.pathname || null;
      
      if (from) {
        console.log('➡️ Buyer redirecting back to:', from);
        navigate(from, { replace: true });
      } else {
        // Default buyer dashboard
        console.log('➡️ Buyer redirecting to default /dashboard');
        navigate('/dashboard');
      }
    }

   } else {
    setError("Login failed. Please try again.");
   }
    } catch (err) {
      console.error('❌ Login error:', err);
      console.error('📡 Error response:', err.response);
      console.error('📡 Error data:', err.response?.data);
      console.error('📡 Error status:', err.response?.status);
      console.error('📡 Error message:', err.message);
      console.error('📡 Request URL:', err.config?.url);
      console.error('📡 Request data:', err.config?.data);
      
      let errorMsg = "Login failed. Please try again.";
      
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        errorMsg = "⚠️ Network error. Please check:\n1. Backend is running on port 8080\n2. Your internet connection";
      } else if (err.response?.status === 401) {
        errorMsg = "Invalid email or password. Please try again.";
      } else if (err.response?.status === 403) {
        errorMsg = "Access denied for this role. Please select the correct account type.";
      } else if (err.response?.status === 500) {
        errorMsg = "Server error. Please try again later.";
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      console.log('🔴 Setting error message:', errorMsg);
      setError(errorMsg);
      
      // ✅ Force the error to stay by preventing any default behavior
      setTimeout(() => {
        console.log('📝 Current error state:', error);
      }, 100);
    } finally {
      setLoading(false);
    }

    // ✅ IMPORTANT: Return false to prevent any default form behavior
    return false;
  };

  const handleGoogleLogin = () => {
    try {
    setError("");

    // --- ADD THIS LOGIC ---
    // Get the 'from' path, default to /dashboard if it doesn't exist
    const from = location.state?.from?.pathname || '/dashboard';
    // Store it so the callback page can read it
    sessionStorage.setItem('login_redirect', from);
    // --- END OF NEW LOGIC ---

    const base = api.defaults.baseURL || 'http://localhost:8080/api';
    const googleAuthUrl = `${base}/users/auth/google`;
    console.log('🔐 Redirecting to Google Auth:', googleAuthUrl);
    
    window.location.href = googleAuthUrl;
   } catch (err) {
// ...
      console.error('❌ Google login error:', err);
      setError('Failed to start Google login. Please try again.');
    }
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
      const response = await api.post('/users/forgot-password', {
        email: forgotEmail.toLowerCase().trim()
      });

      console.log('✅ Forgot password response:', response.data);

      if (response.data.message) {
        setForgotSuccess(response.data.message);
        setForgotError("");
        setForgotEmail("");
        setTimeout(() => {
          setShowForgotPassword(false);
          setForgotSuccess("");
        }, 5000);
      }
    } catch (err) {
      console.error('❌ Forgot password error:', err);
      
      let errorMessage = "Failed to send reset email. Please try again.";
      
      if (err.response?.status === 404) {
        errorMessage = "User hasn't registered with this email. Please check your email or sign up.";
      } else if (err.response?.status === 400) {
        errorMessage = err.response.data.message || "This account uses Google login. Please use Google login instead.";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.code === 'NETWORK_ERROR' || err.message === 'Network Error') {
        errorMessage = "Network error. Please check your internet connection.";
      }
      
      setForgotError(errorMessage);
      setForgotSuccess("");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleEmailChange = (e) => {
    setEmailOrPhone(e.target.value);
    if (error) setError("");
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (error) setError("");
  };

  const handleAccountTypeChange = (e) => {
    setAccountType(e.target.value);
    if (error) setError("");
  };

  // ✅ ADDED: Direct button click handler as alternative
  const handleLoginButtonClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Create a synthetic event for the form handler
    const syntheticEvent = {
      preventDefault: () => {},
      stopPropagation: () => {},
      target: document.querySelector('form')
    };
    
    handleSubmit(syntheticEvent);
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
            <div className="error-message" style={{ 
              color: '#d32f2f', 
              marginBottom: '15px', 
              padding: '12px 15px', 
              backgroundColor: '#ffebee', 
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              border: '1px solid #ef5350',
              animation: 'slideIn 0.3s ease-in-out'
            }}>
              <span style={{ marginRight: '8px' }}>⚠️</span>
              {error}
            </div>
          )}

          {/* ✅ OPTION 1: Regular form with enhanced prevention */}
          <form onSubmit={handleSubmit} noValidate>
            <select
              value={accountType}
              onChange={handleAccountTypeChange}
              style={{
                marginBottom: '15px'
              }}
            >
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
            </select>

            <input
              type="text"
              placeholder="Email"
              value={emailOrPhone}
              onChange={handleEmailChange}
              style={{
                marginBottom: '15px'
              }}
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={handlePasswordChange}
              style={{
                marginBottom: '20px'
              }}
              required
            />

            {/* ✅ OPTION 2: Use button with onClick instead of form submit */}
            <button 
              type="button" // ✅ Changed from "submit" to "button"
              onClick={handleLoginButtonClick}
              className="btn-login" 
              disabled={loading}
              style={{
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{
                    display: 'inline-block',
                    width: '16px',
                    height: '16px',
                    border: '2px solid transparent',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginRight: '8px'
                  }}></span>
                  LOGGING IN...
                </>
              ) : (
                "LOGIN"
              )}
            </button>
          </form>

          <div className="mt-4">
            <button
              onClick={handleGoogleLogin}
              className="btn-google"
              disabled={loading}
              style={{
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              <FcGoogle size={22} />
              <span>{loading ? 'Redirecting...' : 'Continue with Google'}</span>
            </button>
          </div>

          <div className="flex-footer">
            <p>
              New User?{" "}
              <span 
                onClick={() => !loading && navigate("/signup")} 
                className="link"
                style={{
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                Signup
              </span>
            </p>
            <p 
              className="forgot link" 
              onClick={() => !loading && setShowForgotPassword(true)}
              style={{ 
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              Forgot your password?
            </p>
          </div>
        </div>
      </div>

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
                  color: '#d32f2f', 
                  marginBottom: '15px', 
                  padding: '12px 15px', 
                  backgroundColor: '#ffebee', 
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  border: '1px solid #ef5350',
                  animation: 'slideIn 0.3s ease-in-out'
                }}>
                  <span style={{ marginRight: '8px' }}>⚠️</span>
                  {forgotError}
                </div>
              )}

              {forgotSuccess && (
                <div style={{ 
                  color: '#2e7d32', 
                  marginBottom: '15px', 
                  padding: '12px 15px', 
                  backgroundColor: '#e8f5e9', 
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  border: '1px solid #66bb6a',
                  animation: 'slideIn 0.3s ease-in-out'
                }}>
                  <span style={{ marginRight: '8px' }}>✅</span>
                  {forgotSuccess}
                </div>
              )}

              <form onSubmit={handleForgotPassword}>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={forgotEmail}
                  onChange={(e) => {
                    setForgotEmail(e.target.value);
                    setForgotError("");
                  }}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: forgotError ? '1px solid #ef5350' : '1px solid #ccc',
                    borderRadius: '6px',
                    fontSize: '15px',
                    marginBottom: '15px',
                    outline: 'none',
                    transition: 'border-color 0.3s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3c009d'}
                  onBlur={(e) => e.target.style.borderColor = forgotError ? '#ef5350' : '#ccc'}
                />
                <button 
                  type="submit" 
                  className="btn-login" 
                  disabled={forgotLoading}
                  style={{ 
                    width: '100%',
                    opacity: forgotLoading ? 0.7 : 1,
                    cursor: forgotLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {forgotLoading ? (
                    <>
                      <span className="spinner" style={{
                        display: 'inline-block',
                        width: '16px',
                        height: '16px',
                        border: '2px solid transparent',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        marginRight: '8px'
                      }}></span>
                      SENDING...
                    </>
                  ) : (
                    "SEND RESET LINK"
                  )}
                </button>
              </form>

              <div style={{ 
                marginTop: '15px', 
                padding: '10px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '6px',
                fontSize: '12px',
                color: '#666',
                textAlign: 'center'
              }}>
                <p style={{ margin: 0 }}>
                  Can't find the email? Check your spam folder or try again.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}