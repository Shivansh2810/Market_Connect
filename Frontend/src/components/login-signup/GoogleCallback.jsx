import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../../api/axios";
import "./GoogleCallback.css";

// using shared api instance

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

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        // Check if we have token in URL (for direct callback)
        const token = searchParams.get('token');
        
        if (token) {
          // Store token and get user data
          localStorage.setItem('token', token);
          
          const response = await api.get(`/me`);
          
          if (response.data.success) {
            const user = response.data.data;
            
            // Check if user needs to update phone number
            if (user.mobNo === "0000000000" || !user.mobNo) {
              setUserData(user);
              setShowPhoneModal(true);
              setLoading(false);
            } else {
              login(user, token);
              navigate('/dashboard');
            }
          }
        } else {
          // If no token in URL, try to get from localStorage or redirect
          const storedToken = localStorage.getItem('token');
          if (storedToken) {
            const response = await api.get(`/me`);
            
            if (response.data.success) {
              const user = response.data.data;
              if (user.mobNo === "0000000000" || !user.mobNo) {
                setUserData(user);
                setShowPhoneModal(true);
              } else {
                login(user, storedToken);
                navigate('/dashboard');
              }
            }
          } else {
            navigate('/');
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Google OAuth callback error:', error);
        setError('Failed to complete Google sign-in. Please try again.');
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
    try {
      const token = localStorage.getItem('token');
      const response = await api.put(`/me/profile`, { mobNo: phoneNumber });

      if (response.data.success) {
        // Update user data with new phone number
        const updatedUser = { ...userData, mobNo: phoneNumber };
        updateUser(updatedUser);
        setShowPhoneModal(false);
        navigate('/dashboard');
      }
    } catch (error) {
      setError("Failed to update phone number. Please try again.");
    } finally {
      setPhoneLoading(false);
    }
  };

  const skipPhoneUpdate = () => {
    setShowPhoneModal(false);
    navigate('/dashboard');
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
      {error && (
        <div className="callback-error">
          {error}
          <button onClick={() => navigate('/')} className="callback-btn">
            Go to Login
          </button>
        </div>
      )}

      {/* Phone Number Update Modal */}
      {showPhoneModal && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Complete Your Profile</h2>
            </div>
            
            <div className="modal-body">
              <p style={{ marginBottom: '20px', color: '#666', textAlign: 'center' }}>
                Welcome to Market Connect! Please add your mobile number for better service.
              </p>

              {error && (
                <div style={{ 
                  color: 'red', 
                  marginBottom: '15px', 
                  padding: '10px', 
                  backgroundColor: '#ffe6e6', 
                  borderRadius: '5px',
                  fontSize: '14px',
                  textAlign: 'center'
                }}>
                  {error}
                </div>
              )}

              <input
                type="tel"
                placeholder="Enter your 10-digit mobile number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                maxLength="10"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ccc',
                  borderRadius: '6px',
                  fontSize: '16px',
                  marginBottom: '20px',
                  outline: 'none',
                  textAlign: 'center'
                }}
              />

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={skipPhoneUpdate}
                  className="btn-secondary"
                  style={{ flex: 1 }}
                >
                  Skip for Now
                </button>
                <button 
                  onClick={handlePhoneUpdate}
                  className="btn-login" 
                  disabled={phoneLoading}
                  style={{ flex: 2 }}
                >
                  {phoneLoading ? "UPDATING..." : "UPDATE PROFILE"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}