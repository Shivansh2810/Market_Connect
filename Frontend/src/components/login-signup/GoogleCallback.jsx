import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../../api/axios";
import { getDashboardPath } from "../../utils/dashboardRoutes";
import "./GoogleCallback.css";

export default function GoogleCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Phone update state
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [userData, setUserData] = useState(null);

  const performRedirect = (user) => {
    const from = sessionStorage.getItem('login_redirect');
    sessionStorage.removeItem('login_redirect');
    if (from) {
      console.log('➡️ Redirecting back to:', from);
      navigate(from, { replace: true });
    } else {
      const dashboardPath = getDashboardPath(user);
      console.log('➡️ Redirecting to:', dashboardPath);
      navigate(dashboardPath, { replace: true });
    }
  };

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        console.log('🔄 Google callback processing started...');
        
        // Get token and userId from URL parameters
        const token = searchParams.get('token');
        const userId = searchParams.get('userId');

        console.log('📨 URL Parameters:', { token: token ? '✅ Present' : '❌ Missing', userId: userId ? '✅ Present' : '❌ Missing' });

        if (!token) {
          throw new Error('No authentication token received');
        }

        // Store token immediately
        localStorage.setItem('token', token);
        console.log('✅ Token stored in localStorage');

        // Set authorization header for API calls
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('✅ Authorization header set');

        // Try multiple endpoints to get user data
        let userResponse;
        try {
          console.log('👤 Attempting to fetch user profile from /users/me...');
          userResponse = await api.get('/users/me');
        } catch (meError) {
          console.log('❌ /users/me failed, trying /me...');
          userResponse = await api.get('/me');
        }

        console.log('✅ User profile response:', userResponse.data);

        if (userResponse.data.success) {
          const user = userResponse.data.data || userResponse.data.user;
          
          if (!user) {
            throw new Error('User data not found in response');
          }

          console.log('👤 User data received:', { 
            name: user.name, 
            email: user.email, 
            role: user.role,
            mobNo: user.mobNo 
          });

          // Check if user needs to update phone number
          if (user.mobNo === "0000000000" || !user.mobNo || user.mobNo === "1234567890") {
            console.log('📱 Phone number needs update');
            setUserData(user);
            setShowPhoneModal(true);
            setLoading(false);
          } else {
            console.log('✅ Phone number is valid, logging in...');
            login(user, token);
            performRedirect(user);
          }
        } else {
          throw new Error('Failed to get user profile');
        }
        
      } catch (error) {
        console.error('❌ Google OAuth callback error:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        
        let errorMessage = 'Failed to complete Google sign-in. Please try again.';
        
        if (error.response?.status === 401) {
          errorMessage = 'Authentication failed. Please try logging in again.';
        } else if (error.response?.status === 404) {
          errorMessage = 'User profile not found. Please contact support.';
        } else if (error.message.includes('No authentication token')) {
          errorMessage = 'Authentication token missing. Please try logging in again.';
        }
        
        setError(errorMessage);
        setLoading(false);
      }
    };

    handleGoogleCallback();
  }, [navigate, searchParams, login]);

  const handlePhoneUpdate = async () => {
    const phoneRegex = /^[6-9]\d{9}$/;
    
    if (!phoneRegex.test(phoneNumber)) {
      setError("Please enter a valid 10-digit Indian mobile number");
      return;
    }

    setPhoneLoading(true);
    setError("");
    
    try {
      console.log('📱 Updating phone number to:', phoneNumber);
      
      const response = await api.put('/users/me/profile', { mobNo: phoneNumber });

      if (response.data.success) {
        console.log('✅ Phone number updated successfully');
        
        // Update user data with new phone number
        const updatedUser = { ...userData, mobNo: phoneNumber };
        const token = localStorage.getItem('token');
        
        updateUser(updatedUser);
        setShowPhoneModal(false);
        
        if (token) {
          login(updatedUser, token);
        }
        performRedirect(updatedUser);
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('❌ Phone update error:', error);
      setError("Failed to update phone number. Please try again.");
    } finally {
      setPhoneLoading(false);
    }
  };

  const skipPhoneUpdate = () => {
    console.log('⏭️ Skipping phone number update');
    setShowPhoneModal(false);
    const token = localStorage.getItem('token');
    
    if (userData && token) {
      login(userData, token);
      performRedirect(userData);
    } else {
      setError('Unable to complete login. Please try again.');
    }
  };

  const handleRetry = () => {
    console.log('🔄 Retrying Google login...');
    setError("");
    setLoading(true);
    
    // Clear stored token and redirect to login
    localStorage.removeItem('token');
    navigate('/login', { replace: true });
  };

  if (loading) {
    return (
      <div className="callback-container">
        <div className="callback-spinner"></div>
        <h2>Completing Google Sign-In...</h2>
        <p>Please wait while we authenticate your account.</p>
      </div>
    );
  }

  return (
    <div className="callback-container">
      {error && !showPhoneModal && (
        <div className="callback-error">
          <div style={{ marginBottom: '15px' }}>
            <span style={{ fontSize: '48px', marginBottom: '10px' }}>⚠️</span>
            <h3 style={{ margin: '10px 0', color: '#d32f2f' }}>Authentication Error</h3>
            <p style={{ margin: '0 0 20px 0', color: '#666' }}>{error}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button onClick={handleRetry} className="btn-login" style={{ padding: '10px 20px' }}>
              Try Again
            </button>
            <button onClick={() => navigate('/login')} className="btn-secondary" style={{ padding: '10px 20px' }}>
              Go to Login
            </button>
          </div>
        </div>
      )}

      {/* Phone Number Update Modal */}
      {showPhoneModal && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Complete Your Profile</h2>
              <p style={{ color: '#666', fontSize: '14px', margin: '5px 0 0 0' }}>
                Welcome to Market Connect!
              </p>
            </div>
            
            <div className="modal-body">
              <p style={{ marginBottom: '20px', color: '#666', textAlign: 'center' }}>
                Please add your mobile number for better service and security.
              </p>

              {error && (
                <div style={{ 
                  color: '#d32f2f', 
                  marginBottom: '15px', 
                  padding: '12px 15px', 
                  backgroundColor: '#ffebee', 
                  borderRadius: '6px',
                  fontSize: '14px',
                  textAlign: 'center',
                  border: '1px solid #ef5350'
                }}>
                  {error}
                </div>
              )}

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  placeholder="Enter your 10-digit mobile number"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    setError("");
                  }}
                  maxLength="10"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ccc',
                    borderRadius: '6px',
                    fontSize: '16px',
                    outline: 'none',
                    textAlign: 'center',
                    transition: 'border-color 0.3s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3c009d'}
                  onBlur={(e) => e.target.style.borderColor = '#ccc'}
                />
                <small style={{ display: 'block', marginTop: '5px', color: '#666', textAlign: 'center' }}>
                  We'll use this for order updates and security
                </small>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={skipPhoneUpdate}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '12px' }}
                >
                  Skip for Now
                </button>
                <button 
                  onClick={handlePhoneUpdate}
                  className="btn-login" 
                  disabled={phoneLoading || phoneNumber.length !== 10}
                  style={{ 
                    flex: 2, 
                    padding: '12px',
                    opacity: (phoneLoading || phoneNumber.length !== 10) ? 0.6 : 1
                  }}
                >
                  {phoneLoading ? "UPDATING..." : "CONTINUE"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}