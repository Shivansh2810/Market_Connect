import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { upgradeToSeller } from '../../services/user';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faStore, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import './BecomeSellerPage.css';

const BecomeSellerPage = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    shopName: '',
    shopAddress: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    }
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (field, value) => {
    if (field.startsWith('shopAddress.')) {
      const addressField = field.replace('shopAddress.', '');
      setFormData(prev => ({
        ...prev,
        shopAddress: {
          ...prev.shopAddress,
          [addressField]: value
        }
      }));
      // Clear error for this field
      if (errors[field]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
      // Clear error for this field
      if (errors[field]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.shopName.trim()) {
      newErrors.shopName = 'Shop name is required';
    }

    if (!formData.shopAddress.street.trim()) {
      newErrors['shopAddress.street'] = 'Street address is required';
    }

    if (!formData.shopAddress.city.trim()) {
      newErrors['shopAddress.city'] = 'City is required';
    }

    if (!formData.shopAddress.state.trim()) {
      newErrors['shopAddress.state'] = 'State is required';
    }

    if (!formData.shopAddress.pincode.trim()) {
      newErrors['shopAddress.pincode'] = 'Pincode is required';
    } else if (!/^[0-9]{6}$/.test(formData.shopAddress.pincode)) {
      newErrors['shopAddress.pincode'] = 'Pincode must be exactly 6 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const response = await upgradeToSeller(formData.shopName, formData.shopAddress);

      if (response.user) {
        // Update auth context with new user data
        updateUser(response.user);
        
        // Show success message
        alert('Congratulations! Your account has been upgraded to a seller. You can now login as a seller.');
        
        // Navigate back to dashboard
        navigate('/dashboard');
      } else {
        setError(response.message || 'Failed to upgrade account');
      }
    } catch (err) {
      console.error('Upgrade error:', err);
      setError(err.response?.data?.message || 'Failed to upgrade to seller. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Check if user is already a seller
  if (user && (user.role === 'seller' || user.role === 'both')) {
    return (
      <div className="become-seller-page">
        <div className="become-seller-container">
          <button className="back-button" onClick={() => navigate('/dashboard')}>
            <FontAwesomeIcon icon={faArrowLeft} />
            Back to Dashboard
          </button>
          <div className="already-seller">
            <FontAwesomeIcon icon={faStore} size="3x" />
            <h2>You're Already a Seller!</h2>
            <p>Your account already has seller privileges. You can login as a seller anytime.</p>
            <button className="btn-primary" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="become-seller-page">
      <div className="become-seller-container">
        <button className="back-button" onClick={() => navigate('/dashboard')}>
          <FontAwesomeIcon icon={faArrowLeft} />
          Back to Dashboard
        </button>

        <div className="become-seller-header">
          <FontAwesomeIcon icon={faStore} size="2x" />
          <h1>Become a Seller</h1>
          <p>Fill in your shop details to start selling on Market Connect</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="become-seller-form">
          <div className="form-section">
            <h3>
              <FontAwesomeIcon icon={faStore} />
              Shop Information
            </h3>
            
            <div className="form-group">
              <label htmlFor="shopName">Shop Name *</label>
              <input
                type="text"
                id="shopName"
                value={formData.shopName}
                onChange={(e) => handleInputChange('shopName', e.target.value)}
                placeholder="Enter your shop name"
                className={errors.shopName ? 'error' : ''}
              />
              {errors.shopName && <span className="error-text">{errors.shopName}</span>}
            </div>
          </div>

          <div className="form-section">
            <h3>
              <FontAwesomeIcon icon={faMapMarkerAlt} />
              Shop Address
            </h3>

            <div className="form-group">
              <label htmlFor="street">Street Address *</label>
              <input
                type="text"
                id="street"
                value={formData.shopAddress.street}
                onChange={(e) => handleInputChange('shopAddress.street', e.target.value)}
                placeholder="Enter street address"
                className={errors['shopAddress.street'] ? 'error' : ''}
              />
              {errors['shopAddress.street'] && (
                <span className="error-text">{errors['shopAddress.street']}</span>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="city">City *</label>
                <input
                  type="text"
                  id="city"
                  value={formData.shopAddress.city}
                  onChange={(e) => handleInputChange('shopAddress.city', e.target.value)}
                  placeholder="Enter city"
                  className={errors['shopAddress.city'] ? 'error' : ''}
                />
                {errors['shopAddress.city'] && (
                  <span className="error-text">{errors['shopAddress.city']}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="state">State *</label>
                <input
                  type="text"
                  id="state"
                  value={formData.shopAddress.state}
                  onChange={(e) => handleInputChange('shopAddress.state', e.target.value)}
                  placeholder="Enter state"
                  className={errors['shopAddress.state'] ? 'error' : ''}
                />
                {errors['shopAddress.state'] && (
                  <span className="error-text">{errors['shopAddress.state']}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="pincode">Pincode *</label>
                <input
                  type="text"
                  id="pincode"
                  value={formData.shopAddress.pincode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    handleInputChange('shopAddress.pincode', value);
                  }}
                  placeholder="6-digit pincode"
                  maxLength="6"
                  className={errors['shopAddress.pincode'] ? 'error' : ''}
                />
                {errors['shopAddress.pincode'] && (
                  <span className="error-text">{errors['shopAddress.pincode']}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="country">Country</label>
                <input
                  type="text"
                  id="country"
                  value={formData.shopAddress.country}
                  onChange={(e) => handleInputChange('shopAddress.country', e.target.value)}
                  placeholder="Country (default: India)"
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => navigate('/dashboard')}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Upgrading...' : 'Become a Seller'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BecomeSellerPage;

