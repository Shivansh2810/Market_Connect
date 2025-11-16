import React, { useEffect, useState } from 'react';
import './profile.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faUser, 
    faEnvelope, 
    faPhone, 
    faMapMarkerAlt,
    faEdit,
    faSave,
    faTimes,
    faShoppingBag,
    faCreditCard,
    faCog,
    faSignOutAlt,
    faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import { getCurrentUserProfile, getCurrentUserOrders, updateCurrentUserProfile } from '../../../api/user';

const Profile = ({ onBack }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState('personal');
    const [profileData, setProfileData] = useState(null);
    const [orderHistory, setOrderHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError('');

                const [profileResponse, ordersResponse] = await Promise.all([
                    getCurrentUserProfile(),
                    getCurrentUserOrders().catch(() => ({ success: false, data: [] }))
                ]);

                if (profileResponse?.success && profileResponse.data) {
                    const profile = profileResponse.data;
                    setProfileData({
                        ...profile,
                        buyerInfo: {
                            shippingAddresses:
                                profile.buyerInfo?.shippingAddresses &&
                                Array.isArray(profile.buyerInfo.shippingAddresses)
                                    ? profile.buyerInfo.shippingAddresses
                                    : [],
                            cart: profile.buyerInfo?.cart || []
                        }
                    });
                } else {
                    setProfileData(null);
                }

                if (ordersResponse?.success && Array.isArray(ordersResponse.data)) {
                    setOrderHistory(ordersResponse.data);
                } else {
                    setOrderHistory([]);
                }
            } catch (fetchError) {
                console.error('Failed to load profile data', fetchError);
                setError(fetchError.response?.data?.message || 'Unable to load profile.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleInputChange = (field, value) => {
        setProfileData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = async () => {
        if (!profileData) return;
        try {
            setSaving(true);
            await updateCurrentUserProfile({
                name: profileData.name,
                mobNo: profileData.mobNo,
                sellerInfo: profileData.sellerInfo
            });
            setIsEditing(false);
        } catch (updateError) {
            console.error('Failed to update profile', updateError);
            setError(updateError.response?.data?.message || 'Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        // Reset to original data if needed
    };

    const renderPersonalInfo = () => {
        if (!profileData) {
            return (
                <div className="profile-section">
                    <p className="profile-empty-state">No profile information available.</p>
                </div>
            );
        }

        const addresses = profileData.buyerInfo?.shippingAddresses || [];

        return (
        <div className="profile-section">
            <div className="profile-header">
                <div className="profile-info">
                    <h2>{profileData.name}</h2>
                </div>
            </div>

            <div className="profile-details">
                <h3>Personal Information</h3>
                <div className="form-group">
                    <label>
                        <FontAwesomeIcon icon={faUser} />
                        Full Name
                    </label>
                    {isEditing ? (
                        <input
                            type="text"
                            value={profileData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className="form-input"
                        />
                    ) : (
                        <span className="form-value">{profileData.name}</span>
                    )}
                </div>

                <div className="form-group">
                    <label>
                        <FontAwesomeIcon icon={faEnvelope} />
                        Email Address
                    </label>
                    {isEditing ? (
                        <input
                            type="email"
                            value={profileData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className="form-input"
                        />
                    ) : (
                                        <span className="form-value">{profileData.email}</span>
                    )}
                </div>

                <div className="form-group">
                    <label>
                        <FontAwesomeIcon icon={faPhone} />
                        Mobile Number
                    </label>
                    {isEditing ? (
                        <input
                            type="tel"
                            value={profileData.mobNo || ''}
                            onChange={(e) => handleInputChange('mobNo', e.target.value)}
                            className="form-input"
                            placeholder="10-digit mobile number"
                            pattern="[6-9][0-9]{9}"
                            maxLength="10"
                        />
                    ) : (
                        <span className="form-value">+91 {profileData.mobNo || 'Not provided'}</span>
                    )}
                </div>

                {/* Role display - matches backend User model role enum */}
                <div className="form-group">
                    <label>
                        <FontAwesomeIcon icon={faUser} />
                        Account Role
                    </label>
                    <span className="form-value">
                        {profileData.role === 'both' ? 'Buyer & Seller' : 
                         profileData.role === 'seller' ? 'Seller' : 'Buyer'}
                    </span>
                </div>

                <div className="form-group">
                    <label>
                        <FontAwesomeIcon icon={faMapMarkerAlt} />
                        Shipping Addresses
                    </label>
                    {addresses.length > 0 ? (
                        <div className="addresses-list">
                            {addresses.map((address) => (
                                <div key={address._id || address.street} className="address-card">
                                    <span className="form-value">
                                        {address.street}, {address.city}, {address.state}{' '}
                                        {address.pincode}, {address.country || 'India'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <span className="form-value">No shipping addresses added</span>
                    )}
                    <p className="address-hint">
                        Manage your addresses from the checkout.
                    </p>
                </div>

                <div className="form-actions">
                    {isEditing ? (
                        <>
                            <button className="btn btn-save" onClick={handleSave} disabled={saving}>
                                <FontAwesomeIcon icon={faSave} />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button className="btn btn-cancel" onClick={handleCancel} disabled={saving}>
                                <FontAwesomeIcon icon={faTimes} />
                                Cancel
                            </button>
                        </>
                    ) : (
                        <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
                            <FontAwesomeIcon icon={faEdit} />
                            Edit Profile
                        </button>
                    )}
                </div>
            </div>
        </div>
        );
    };

    const renderOrderHistory = () => {
        const formatDate = (dateString) => {
            if (!dateString) return 'N/A';
            const date = new Date(dateString);
            return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
        };

        return (
            <div className="profile-section">
                <h3>Order History</h3>
                <div className="order-list">
                    {orderHistory.length === 0 && (
                        <p className="profile-empty-state">No orders found yet.</p>
                    )}
                    {orderHistory.map(order => {
                        const totalItems = order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
                        return (
                            <div key={order._id} className="order-item">
                                <div className="order-header">
                                    <div className="order-info">
                                        <span className="order-id">Order #{order._id.substring(order._id.length - 8)}</span>
                                        <span className="order-date">Placed: {formatDate(order.createdAt)}</span>
                                        {order.updatedAt && order.orderStatus === 'Delivered' && (
                                            <span className="delivery-date">Delivered: {formatDate(order.updatedAt)}</span>
                                        )}
                                    </div>
                                    <span className={`order-status ${order.orderStatus.toLowerCase().replace(' ', '-')}`}>
                                        {order.orderStatus}
                                    </span>
                                </div>
                                <div className="order-details">
                                    <div className="order-products">
                                        <strong>Items ({totalItems}):</strong>
                                        <ul>
                                            {order.orderItems.map((item, index) => (
                                                <li key={index} style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px'}}>
                                                    {item.image && (
                                                        <img 
                                                            src={item.image} 
                                                            alt={item.name}
                                                            style={{width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px'}}
                                                        />
                                                    )}
                                                    <span>{item.name} x {item.quantity} - ₹{item.price * item.quantity}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        {order.shippingInfo && (
                                            <div className="shipping-info" style={{marginTop: '10px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px'}}>
                                                <strong>Ship to:</strong> {order.shippingInfo.street}, {order.shippingInfo.city}, {order.shippingInfo.state} {order.shippingInfo.pincode}, {order.shippingInfo.country}
                                            </div>
                                        )}
                                    </div>
                                    <div className="order-pricing">
                                        <div>Items: ₹{order.itemsPrice?.toFixed(2) || '0.00'}</div>
                                        {order.taxPrice > 0 && <div>Tax (18% GST): ₹{order.taxPrice.toFixed(2)}</div>}
                                        {order.shippingPrice > 0 && <div>Shipping: ₹{order.shippingPrice.toFixed(2)}</div>}
                                        {order.shippingPrice === 0 && order.itemsPrice > 1000 && (
                                            <div style={{color: '#28a745', fontSize: '12px'}}>Free Shipping (Order above ₹1000)</div>
                                        )}
                                        <div className="order-total" style={{marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #ddd'}}>
                                            <strong>Total: ₹{order.totalPrice?.toFixed(2) || '0.00'}</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderSettings = () => (
        <div className="profile-section">
            <h3>Account Settings</h3>
            <div className="settings-list">
                <div className="setting-item">
                    <div className="setting-info">
                        <FontAwesomeIcon icon={faCreditCard} />
                        <div>
                            <h4>Payment Methods</h4>
                            <p>Manage your saved payment methods</p>
                        </div>
                    </div>
                    <button className="btn btn-secondary">Manage</button>
                </div>

                <div className="setting-item danger">
                    <div className="setting-info">
                        <FontAwesomeIcon icon={faSignOutAlt} />
                        <div>
                            <h4>Delete Account</h4>
                            <p>Permanently delete your account</p>
                        </div>
                    </div>
                    <button className="btn btn-danger">Delete</button>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="profile-page">
                <div className="profile-loading">
                    <div className="spinner" />
                    <p>Loading your profile...</p>
                </div>
            </div>
        );
    }

    if (error && !profileData) {
        return (
            <div className="profile-page">
                <div className="profile-error">
                    <p>{error}</p>
                    <button className="btn btn-primary" onClick={onBack}>Back to Dashboard</button>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page">
            <div className="profile-container">
                <div className="profile-header-bar">
                    <button className="back-btn" onClick={onBack}>
                        <FontAwesomeIcon icon={faArrowLeft} />
                        Back to Dashboard
                    </button>
                    <h1>My Profile</h1>
                </div>

                {error && profileData && (
                    <div className="profile-error-inline">{error}</div>
                )}

                <div className="profile-content">
                    <div className="profile-sidebar">
                        <nav className="profile-nav">
                            <button 
                                className={`nav-item ${activeTab === 'personal' ? 'active' : ''}`}
                                onClick={() => setActiveTab('personal')}
                            >
                                <FontAwesomeIcon icon={faUser} />
                                Personal Info
                            </button>
                            <button 
                                className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
                                onClick={() => setActiveTab('orders')}
                            >
                                <FontAwesomeIcon icon={faShoppingBag} />
                                Order History
                            </button>
                            <button 
                                className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                                onClick={() => setActiveTab('settings')}
                            >
                                <FontAwesomeIcon icon={faCog} />
                                Settings
                            </button>
                        </nav>
                    </div>

                    <div className="profile-main">
                        {activeTab === 'personal' && renderPersonalInfo()}
                        {activeTab === 'orders' && renderOrderHistory()}
                        {activeTab === 'settings' && renderSettings()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;