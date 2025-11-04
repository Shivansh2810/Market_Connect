import React, { useState } from 'react';
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

const Profile = ({ onBack }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState('personal');
    
    // Profile data state - Matching backend User model structure
    const [profileData, setProfileData] = useState({
        name: 'John Doe',
        email: 'john.doe@example.com',
        mobNo: '9876543210', // 10-digit Indian mobile number (no country code prefix)
        buyerInfo: {
            shippingAddresses: [
                {
                    street: '123 Main Street',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    pincode: '400001',
                    country: 'India'
                },
                {
                    street: '456 Park Avenue',
                    city: 'Delhi',
                    state: 'Delhi',
                    pincode: '110001',
                    country: 'India'
                }
            ]
        }
    });

    // Order history data - Matching backend Order model structure
    const orderHistory = [
        {
            _id: '507f1f77bcf86cd799439021',
            createdAt: '2024-01-15T10:30:00Z',
            orderItems: [
                { name: 'Wireless Bluetooth Headphones', quantity: 1, price: 1299, image: '' },
                { name: 'Premium Coffee Beans', quantity: 1, price: 349, image: '' },
                { name: 'Organic Cotton T-Shirt', quantity: 1, price: 399, image: '' }
            ],
            totalPrice: 2499,
            itemsPrice: 2047,
            taxPrice: 368,
            shippingPrice: 84,
            orderStatus: 'Delivered',
            deliveredAt: '2024-01-18T14:00:00Z',
            shippingInfo: {
                street: '123 Main Street',
                city: 'Mumbai',
                state: 'Maharashtra',
                pincode: '400001',
                country: 'India'
            }
        },
        {
            _id: '507f1f77bcf86cd799439022',
            createdAt: '2024-01-10T08:15:00Z',
            orderItems: [
                { name: 'Smart Fitness Watch', quantity: 1, price: 2499, image: '' },
                { name: 'Leather Wallet', quantity: 1, price: 1199, image: '' }
            ],
            totalPrice: 3698,
            itemsPrice: 3698,
            taxPrice: 666,
            shippingPrice: 0,
            orderStatus: 'Shipped',
            shippingInfo: {
                street: '123 Main Street',
                city: 'Mumbai',
                state: 'Maharashtra',
                pincode: '400001',
                country: 'India'
            }
        },
        {
            _id: '507f1f77bcf86cd799439023',
            createdAt: '2024-01-05T16:45:00Z',
            orderItems: [
                { name: 'Wired Headphone', quantity: 1, price: 899, image: '' }
            ],
            totalPrice: 899,
            itemsPrice: 899,
            taxPrice: 162,
            shippingPrice: 0,
            orderStatus: 'Delivered',
            deliveredAt: '2024-01-08T12:00:00Z',
            shippingInfo: {
                street: '456 Park Avenue',
                city: 'Delhi',
                state: 'Delhi',
                pincode: '110001',
                country: 'India'
            }
        }
    ];

    const handleInputChange = (field, value) => {
        setProfileData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = () => {
        setIsEditing(false);
        // Here you would typically save to backend
        console.log('Profile saved:', profileData);
    };

    const handleCancel = () => {
        setIsEditing(false);
        // Reset to original data if needed
    };

    const renderPersonalInfo = () => (
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

                <div className="form-group">
                    <label>
                        <FontAwesomeIcon icon={faMapMarkerAlt} />
                        Shipping Addresses
                    </label>
                    {profileData.buyerInfo?.shippingAddresses?.length > 0 ? (
                        <div className="addresses-list">
                            {profileData.buyerInfo.shippingAddresses.map((address, index) => (
                                <div key={index} className="address-card">
                                    {isEditing ? (
                                        <div className="address-form">
                                            <input
                                                type="text"
                                                value={address.street}
                                                onChange={(e) => {
                                                    const newAddresses = [...profileData.buyerInfo.shippingAddresses];
                                                    newAddresses[index].street = e.target.value;
                                                    setProfileData(prev => ({
                                                        ...prev,
                                                        buyerInfo: {
                                                            ...prev.buyerInfo,
                                                            shippingAddresses: newAddresses
                                                        }
                                                    }));
                                                }}
                                                className="form-input"
                                                placeholder="Street"
                                            />
                                            <input
                                                type="text"
                                                value={address.city}
                                                onChange={(e) => {
                                                    const newAddresses = [...profileData.buyerInfo.shippingAddresses];
                                                    newAddresses[index].city = e.target.value;
                                                    setProfileData(prev => ({
                                                        ...prev,
                                                        buyerInfo: {
                                                            ...prev.buyerInfo,
                                                            shippingAddresses: newAddresses
                                                        }
                                                    }));
                                                }}
                                                className="form-input"
                                                placeholder="City"
                                            />
                                            <input
                                                type="text"
                                                value={address.state}
                                                onChange={(e) => {
                                                    const newAddresses = [...profileData.buyerInfo.shippingAddresses];
                                                    newAddresses[index].state = e.target.value;
                                                    setProfileData(prev => ({
                                                        ...prev,
                                                        buyerInfo: {
                                                            ...prev.buyerInfo,
                                                            shippingAddresses: newAddresses
                                                        }
                                                    }));
                                                }}
                                                className="form-input"
                                                placeholder="State"
                                            />
                                            <input
                                                type="text"
                                                value={address.pincode}
                                                onChange={(e) => {
                                                    const newAddresses = [...profileData.buyerInfo.shippingAddresses];
                                                    newAddresses[index].pincode = e.target.value;
                                                    setProfileData(prev => ({
                                                        ...prev,
                                                        buyerInfo: {
                                                            ...prev.buyerInfo,
                                                            shippingAddresses: newAddresses
                                                        }
                                                    }));
                                                }}
                                                className="form-input"
                                                placeholder="Pincode (6 digits)"
                                                pattern="[0-9]{6}"
                                                maxLength="6"
                                            />
                                        </div>
                                    ) : (
                                        <span className="form-value">
                                            {address.street}, {address.city}, {address.state} {address.pincode}, {address.country}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <span className="form-value">No shipping addresses added</span>
                    )}
                </div>

                <div className="form-actions">
                    {isEditing ? (
                        <>
                            <button className="btn btn-save" onClick={handleSave}>
                                <FontAwesomeIcon icon={faSave} />
                                Save Changes
                            </button>
                            <button className="btn btn-cancel" onClick={handleCancel}>
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
                    {orderHistory.map(order => {
                        const totalItems = order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
                        return (
                            <div key={order._id} className="order-item">
                                <div className="order-header">
                                    <div className="order-info">
                                        <span className="order-id">#{order._id.substring(order._id.length - 8)}</span>
                                        <span className="order-date">{formatDate(order.createdAt)}</span>
                                        {order.deliveredAt && (
                                            <span className="delivery-date">Delivered: {formatDate(order.deliveredAt)}</span>
                                        )}
                                    </div>
                                    <span className={`order-status ${order.orderStatus.toLowerCase()}`}>
                                        {order.orderStatus}
                                    </span>
                                </div>
                                <div className="order-details">
                                    <div className="order-products">
                                        <strong>Items ({totalItems}):</strong>
                                        <ul>
                                            {order.orderItems.map((item, index) => (
                                                <li key={index}>
                                                    {item.name} x {item.quantity} - ₹{item.price * item.quantity}
                                                </li>
                                            ))}
                                        </ul>
                                        {order.shippingInfo && (
                                            <div className="shipping-info">
                                                <strong>Ship to:</strong> {order.shippingInfo.street}, {order.shippingInfo.city}, {order.shippingInfo.state} {order.shippingInfo.pincode}
                                            </div>
                                        )}
                                    </div>
                                    <div className="order-pricing">
                                        <div>Items: ₹{order.itemsPrice}</div>
                                        {order.taxPrice > 0 && <div>Tax: ₹{order.taxPrice}</div>}
                                        {order.shippingPrice > 0 && <div>Shipping: ₹{order.shippingPrice}</div>}
                                        <div className="order-total">
                                            <strong>Total: ₹{order.totalPrice}</strong>
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