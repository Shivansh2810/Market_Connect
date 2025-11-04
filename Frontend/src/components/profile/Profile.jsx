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
    
    // Profile data state - Matching backend User model structure exactly
    // Backend User model: name, email, password, googleId, role, mobNo, sellerInfo, buyerInfo, timestamps
    // Backend addressSchema: street, city, state, pincode (6 chars), country (default "India")
    const [profileData, setProfileData] = useState({
        _id: '507f1f77bcf86cd799439010',
        name: 'John Doe',
        email: 'john.doe@example.com',
        mobNo: '9876543210', // 10-digit Indian mobile number (no country code prefix)
        role: 'buyer', // enum: ["buyer", "seller", "both"]
        sellerInfo: null, // { shopName, shopAddress } - only if role is "seller" or "both"
        buyerInfo: {
            shippingAddresses: [
                {
                    _id: '507f1f77bcf86cd799439011', // Address subdocument has _id
                    street: '123 Main Street',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    pincode: '400001', // 6 characters exactly
                    country: 'India' // Default value
                },
                {
                    _id: '507f1f77bcf86cd799439012',
                    street: '456 Park Avenue',
                    city: 'Delhi',
                    state: 'Delhi',
                    pincode: '110001',
                    country: 'India'
                }
            ],
            cart: [] // Backend cartSchema: [{ productId, quantity, price, addedAt, _id }]
        },
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
    });

    // Order history data - Matching backend Order model structure exactly
    // Backend Order model: shippingInfo (addressSchema), buyer, seller, orderItems, payment, itemsPrice, taxPrice, shippingPrice, totalPrice, orderStatus, timestamps
    // Backend orderItemSchema: name, quantity, image, price, product (ObjectId ref)
    // Backend orderStatus enum: ["Payment Pending", "Order Placed", "Shipped", "Delivered", "Cancelled", "Returned", "Payment Failed"]
    const orderHistory = [
        {
            _id: '507f1f77bcf86cd799439021',
            buyer: '507f1f77bcf86cd799439010', // ObjectId reference to User
            seller: '507f191e810c19729de860ea', // ObjectId reference to User
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-18T14:00:00Z',
            orderItems: [
                { 
                    name: 'Wireless Bluetooth Headphones', 
                    quantity: 1, 
                    price: 1299, 
                    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop',
                    product: '507f1f77bcf86cd799439011' // ObjectId reference
                },
                { 
                    name: 'Premium Coffee Beans', 
                    quantity: 1, 
                    price: 349, 
                    image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=300&h=300&fit=crop',
                    product: '507f1f77bcf86cd799439014'
                },
                { 
                    name: 'Organic Cotton T-Shirt', 
                    quantity: 1, 
                    price: 399, 
                    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop',
                    product: '507f1f77bcf86cd799439013'
                }
            ],
            itemsPrice: 2047,
            taxPrice: 368.46, // 18% GST
            shippingPrice: 50,
            totalPrice: 2465.46,
            orderStatus: 'Delivered', // enum value
            payment: null, // ObjectId reference to Payment (null if not paid)
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
            buyer: '507f1f77bcf86cd799439010',
            seller: '507f191e810c19729de860ea',
            createdAt: '2024-01-10T08:15:00Z',
            updatedAt: '2024-01-12T10:00:00Z',
            orderItems: [
                { 
                    name: 'Smart Fitness Watch', 
                    quantity: 1, 
                    price: 2499, 
                    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop',
                    product: '507f1f77bcf86cd799439012'
                },
                { 
                    name: 'Leather Wallet', 
                    quantity: 1, 
                    price: 1199, 
                    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=300&fit=crop',
                    product: '507f1f77bcf86cd799439016'
                }
            ],
            itemsPrice: 3698,
            taxPrice: 665.64,
            shippingPrice: 0, // Free shipping for orders above ₹1000
            totalPrice: 4363.64,
            orderStatus: 'Shipped',
            payment: '507f1f77bcf86cd799439030',
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
            buyer: '507f1f77bcf86cd799439010',
            seller: '507f191e810c19729de860ea',
            createdAt: '2024-01-05T16:45:00Z',
            updatedAt: '2024-01-08T12:00:00Z',
            orderItems: [
                { 
                    name: 'Wired Headphone', 
                    quantity: 1, 
                    price: 899, 
                    image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=300&h=300&fit=crop',
                    product: '507f1f77bcf86cd799439015'
                }
            ],
            itemsPrice: 899,
            taxPrice: 161.82,
            shippingPrice: 50,
            totalPrice: 1110.82,
            orderStatus: 'Delivered',
            payment: '507f1f77bcf86cd799439031',
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
                                                minLength="6"
                                                maxLength="6"
                                            />
                                            <input
                                                type="text"
                                                value={address.country || 'India'}
                                                onChange={(e) => {
                                                    const newAddresses = [...profileData.buyerInfo.shippingAddresses];
                                                    newAddresses[index].country = e.target.value;
                                                    setProfileData(prev => ({
                                                        ...prev,
                                                        buyerInfo: {
                                                            ...prev.buyerInfo,
                                                            shippingAddresses: newAddresses
                                                        }
                                                    }));
                                                }}
                                                className="form-input"
                                                placeholder="Country (default: India)"
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
                                        <div>Items: ₹{order.itemsPrice.toFixed(2)}</div>
                                        {order.taxPrice > 0 && <div>Tax (18% GST): ₹{order.taxPrice.toFixed(2)}</div>}
                                        {order.shippingPrice > 0 && <div>Shipping: ₹{order.shippingPrice.toFixed(2)}</div>}
                                        {order.shippingPrice === 0 && order.itemsPrice > 1000 && (
                                            <div style={{color: '#28a745', fontSize: '12px'}}>Free Shipping (Order above ₹1000)</div>
                                        )}
                                        <div className="order-total" style={{marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #ddd'}}>
                                            <strong>Total: ₹{order.totalPrice.toFixed(2)}</strong>
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