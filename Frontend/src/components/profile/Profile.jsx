import React, { useEffect, useImperativeHandle, useState, forwardRef } from 'react';
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
    faArrowLeft,
    faUndo
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../../services/axios';
import { getCurrentUserProfile, getCurrentUserOrders, updateCurrentUserProfile } from '../../../services/user';
import { requestReturn } from '../../../services/return';
// --- CHANGE 1: Import getMyReviews here ---
import { createReview, getMyReviews } from '../../../services/review'; 

const Profile = forwardRef(({ onBack }, ref) => {
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState('personal');
    const [profileData, setProfileData] = useState(null);
    const [orderHistory, setOrderHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [returnReason, setReturnReason] = useState('');
    const [returnDescription, setReturnDescription] = useState('');
    const [selectedItems, setSelectedItems] = useState([]);
    const [submittingReturn, setSubmittingReturn] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewData, setReviewData] = useState({
        orderId: '',
        productId: '',
        productName: '',
        rating: 0,
        comment: ''
    });
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewedProducts, setReviewedProducts] = useState(new Set());

    const navigate = useNavigate();
    const { logout } = useAuth();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError('');

                // --- CHANGE 2: Fetch Reviews alongside Profile and Orders ---
                const [profileResponse, ordersResponse, reviewsResponse] = await Promise.all([
                    getCurrentUserProfile(),
                    getCurrentUserOrders().catch(() => ({ success: false, data: [] })),
                    getMyReviews().catch(() => ({ success: false, data: [] })) // Fetch user's reviews
                ]);

                // Handle Profile Data
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

                // Handle Order Data
                if (ordersResponse?.success && Array.isArray(ordersResponse.data)) {
                    setOrderHistory(ordersResponse.data);
                } else {
                    setOrderHistory([]);
                }

                // --- CHANGE 3: Process the fetched reviews into the Set ---
                const previouslyReviewed = new Set();
                
                if (reviewsResponse?.success && Array.isArray(reviewsResponse.data)) {
                    reviewsResponse.data.forEach(review => {
                        // Check if product is populated object or just ID string
                        const prodId = review.productId?._id || review.productId || review.product;
                        if (prodId) {
                            previouslyReviewed.add(prodId.toString());
                        }
                    });
                }
                setReviewedProducts(previouslyReviewed);
                // -----------------------------------------------------------

            } catch (fetchError) {
                console.error('Failed to load profile data', fetchError);
                setError(fetchError.response?.data?.message || 'Unable to load profile.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

        useImperativeHandle(ref, () => ({
            triggerWriteReview: handleWriteReview,
            setReviewedProducts,
            triggerSubmitReview: handleSubmitReview,
            updateReviewData: (updater) => {
                setReviewData((prev) => {
                    if (typeof updater === 'function') {
                        return updater(prev);
                    }
                    return { ...prev, ...updater };
                });
            },
            openReturnModal: handleReturnOrder,
            triggerSubmitReturn: handleSubmitReturn,
            toggleReturnItem: handleItemSelection,
            updateReturnState: ({ reason, description }) => {
                if (typeof reason !== 'undefined') {
                    setReturnReason(reason);
                }
                if (typeof description !== 'undefined') {
                    setReturnDescription(description);
                }
            },
            setActiveTab,
        }));

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

    const handleDeleteAccount = async () => {
        if (deleting) return;

        const confirmed = window.confirm(
            'Are you sure you want to permanently delete your account? This action cannot be undone.'
        );

        if (!confirmed) return;

        try {
            setDeleting(true);
            setError('');

            const response = await api.delete('/users/me');

            if (!response?.data?.success) {
                throw new Error(response?.data?.message || 'Failed to delete account');
            }

            // Clear auth state and redirect to home/login
            logout();
            navigate('/', { replace: true });
        } catch (deleteError) {
            console.error('Failed to delete account', deleteError);
            const message =
                deleteError.response?.data?.message ||
                deleteError.message ||
                'Failed to delete account. Please try again.';
            setError(message);
        } finally {
            setDeleting(false);
        }
    };

    const handleReturnOrder = (order) => {
        setSelectedOrder(order);
        setSelectedItems(order.orderItems.map(item => ({
            productId: item.product._id || item.product,
            quantity: item.quantity,
            selected: true
        })));
        setReturnReason('');
        setReturnDescription('');
        setShowReturnModal(true);
    };

    const handleItemSelection = (productId, checked) => {
        setSelectedItems(prev => 
            prev.map(item => 
                item.productId === productId 
                    ? { ...item, selected: checked }
                    : item
            )
        );
    };

    const handleSubmitReturn = async () => {
        if (!returnReason) {
            alert('Please select a reason for return');
            return;
        }

        const itemsToReturn = selectedItems.filter(item => item.selected);
        if (itemsToReturn.length === 0) {
            alert('Please select at least one item to return');
            return;
        }

        try {
            setSubmittingReturn(true);
            setError('');

            const returnData = {
                orderId: selectedOrder._id,
                items: itemsToReturn.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity
                })),
                reason: returnReason,
                description: returnDescription
            };

            await requestReturn(returnData);
            
            alert('Return request submitted successfully! Awaiting seller approval.');
            setShowReturnModal(false);
            
            // Refresh orders
            const ordersResponse = await getCurrentUserOrders();
            if (ordersResponse?.success && Array.isArray(ordersResponse.data)) {
                setOrderHistory(ordersResponse.data);
            }
        } catch (returnError) {
            console.error('Failed to submit return request', returnError);
            const message = returnError.response?.data?.message || 'Failed to submit return request';
            alert(message);
        } finally {
            setSubmittingReturn(false);
        }
    };

    const canReturnOrder = (order) => {
        return order.orderStatus === 'Delivered';
    };

    const handleWriteReview = (order, item) => {
        const productId = item.product._id || item.product;
        
        // Safety check
        if (reviewedProducts.has(productId)) {
            alert('You have already reviewed this product.');
            return;
        }

        setReviewData({
            orderId: order._id,
            productId: productId,
            productName: item.name,
            rating: 0,
            comment: ''
        });
        setShowReviewModal(true);
    };

    const handleRatingClick = (rating) => {
        setReviewData(prev => ({ ...prev, rating }));
    };

    const handleSubmitReview = async () => {
        if (reviewData.rating === 0) {
            alert('Please select a rating');
            return;
        }

        try {
            setSubmittingReview(true);
            setError('');

            const payload = {
                productId: reviewData.productId,
                orderId: reviewData.orderId,
                rating: reviewData.rating,
                comment: reviewData.comment || '',
                images: [] // Can be extended for image upload
            };

            await createReview(payload);
            
            // --- CHANGE 4: Update Local State Immediately ---
            setReviewedProducts(prev => new Set([...prev, reviewData.productId]));
            
            alert('Review submitted successfully! Thank you for your feedback.');
            setShowReviewModal(false);
            setReviewData({
                orderId: '',
                productId: '',
                productName: '',
                rating: 0,
                comment: ''
            });
        } catch (reviewError) {
            console.error('Failed to submit review', reviewError);
            const message = reviewError.response?.data?.message || 'Failed to submit review';
            alert(message);
        } finally {
            setSubmittingReview(false);
        }
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
                                                <li key={index} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '6px'}}>
                                                    <div style={{display: 'flex', alignItems: 'center', gap: '10px', flex: 1}}>
                                                        {item.image && (
                                                            <img 
                                                                src={item.image} 
                                                                alt={item.name}
                                                                style={{width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px'}}
                                                            />
                                                        )}
                                                        <div>
                                                            <div style={{fontWeight: '500'}}>{item.name}</div>
                                                            <div style={{fontSize: '13px', color: '#666'}}>Qty: {item.quantity} - ₹{item.price * item.quantity}</div>
                                                        </div>
                                                    </div>
                                                    {order.orderStatus === 'Delivered' && (
                                                        reviewedProducts.has(item.product._id || item.product) ? (
                                                            <span style={{
                                                                padding: '6px 12px',
                                                                fontSize: '12px',
                                                                color: '#28a745',
                                                                fontWeight: '500',
                                                                whiteSpace: 'nowrap'
                                                            }}>
                                                                ✓ Reviewed
                                                            </span>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleWriteReview(order, item)}
                                                                style={{
                                                                    padding: '6px 12px',
                                                                    fontSize: '12px',
                                                                    backgroundColor: '#3c009d',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '4px',
                                                                    cursor: 'pointer',
                                                                    whiteSpace: 'nowrap'
                                                                }}
                                                            >
                                                                Write Review
                                                            </button>
                                                        )
                                                    )}
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
                                {canReturnOrder(order) && (
                                    <div className="order-actions" style={{marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee'}}>
                                        <button 
                                            className="btn btn-secondary"
                                            onClick={() => handleReturnOrder(order)}
                                            style={{display: 'flex', alignItems: 'center', gap: '8px'}}
                                        >
                                            <FontAwesomeIcon icon={faUndo} />
                                            Request Return
                                        </button>
                                    </div>
                                )}
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
                

                <div className="setting-item danger">
                    <div className="setting-info">
                        <FontAwesomeIcon icon={faSignOutAlt} />
                        <div>
                            <h4>Delete Account</h4>
                            <p>Permanently delete your account</p>
                        </div>
                    </div>
                    <button
                        className="btn btn-danger"
                        onClick={handleDeleteAccount}
                        disabled={deleting}
                    >
                        {deleting ? 'Deleting...' : 'Delete'}
                    </button>
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

            {/* Return Order Modal */}
            {showReturnModal && selectedOrder && (
                <div className="modal-overlay" onClick={() => setShowReturnModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Request Return</h2>
                            <button className="modal-close" onClick={() => setShowReturnModal(false)}>
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p style={{marginBottom: '15px', color: '#666'}}>
                                Order #{selectedOrder._id.substring(selectedOrder._id.length - 8)}
                            </p>

                            <div className="form-group">
                                <label>Select Items to Return:</label>
                                <div className="return-items-list">
                                    {selectedOrder.orderItems.map((item, index) => (
                                        <div key={index} className="return-item-checkbox">
                                            <input
                                                type="checkbox"
                                                id={`item-${index}`}
                                                checked={selectedItems[index]?.selected || false}
                                                onChange={(e) => handleItemSelection(
                                                    item.product._id || item.product,
                                                    e.target.checked
                                                )}
                                            />
                                            <label htmlFor={`item-${index}`}>
                                                {item.image && (
                                                    <img 
                                                        src={item.image} 
                                                        alt={item.name}
                                                        style={{width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', marginRight: '10px'}}
                                                    />
                                                )}
                                                <span>{item.name} x {item.quantity} - ₹{item.price * item.quantity}</span>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Reason for Return *</label>
                                <select 
                                    value={returnReason} 
                                    onChange={(e) => setReturnReason(e.target.value)}
                                    className="form-input"
                                    required
                                >
                                    <option value="">Select a reason</option>
                                    <option value="Damaged Item">Damaged Item</option>
                                    <option value="Wrong Item Sent">Wrong Item Sent</option>
                                    <option value="Item Not as Described">Item Not as Described</option>
                                    <option value="Size Issue">Size Issue</option>
                                    <option value="No Longer Needed">No Longer Needed</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Additional Details (Optional)</label>
                                <textarea
                                    value={returnDescription}
                                    onChange={(e) => setReturnDescription(e.target.value)}
                                    className="form-input"
                                    rows="4"
                                    placeholder="Please provide any additional information about your return request..."
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button 
                                className="btn btn-secondary" 
                                onClick={() => setShowReturnModal(false)}
                                disabled={submittingReturn}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn btn-primary" 
                                onClick={handleSubmitReturn}
                                disabled={submittingReturn}
                            >
                                {submittingReturn ? 'Submitting...' : 'Submit Return Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Review Modal */}
            {showReviewModal && (
                <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Write a Review</h2>
                            <button className="modal-close" onClick={() => setShowReviewModal(false)}>
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p style={{marginBottom: '20px', color: '#666', fontWeight: '500'}}>
                                {reviewData.productName}
                            </p>

                            <div className="form-group">
                                <label>Your Rating *</label>
                                <div className="star-rating-input">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            className={`star-btn ${star <= reviewData.rating ? 'filled' : ''}`}
                                            onClick={() => handleRatingClick(star)}
                                        >
                                            ★
                                        </button>
                                    ))}
                                </div>
                                {reviewData.rating > 0 && (
                                    <p style={{marginTop: '8px', fontSize: '14px', color: '#666'}}>
                                        {reviewData.rating === 1 && 'Poor'}
                                        {reviewData.rating === 2 && 'Fair'}
                                        {reviewData.rating === 3 && 'Good'}
                                        {reviewData.rating === 4 && 'Very Good'}
                                        {reviewData.rating === 5 && 'Excellent'}
                                    </p>
                                )}
                            </div>

                            <div className="form-group">
                                <label>Your Review (Optional)</label>
                                <textarea
                                    value={reviewData.comment}
                                    onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                                    className="form-input"
                                    rows="6"
                                    placeholder={
                                        reviewData.rating === 5 ? "What made this product excellent? Share what you loved about it..." :
                                        reviewData.rating === 4 ? "What did you like about this product? Share your positive experience..." :
                                        reviewData.rating === 3 ? "Share your honest thoughts about this product. What worked well and what could be improved?" :
                                        reviewData.rating === 2 ? "What aspects of this product didn't meet your expectations? Please share your concerns..." :
                                        reviewData.rating === 1 ? "We're sorry to hear about your experience. Please tell us what went wrong so we can improve..." :
                                        "Share your experience with this product..."
                                    }
                                    maxLength="3000"
                                />
                                <p style={{fontSize: '12px', color: '#999', marginTop: '5px', textAlign: 'right'}}>
                                    {reviewData.comment.length}/3000
                                </p>
                            </div>

                            <div style={{padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '8px', fontSize: '13px', color: '#666'}}>
                                <strong>Note:</strong> Your review will be visible to other customers. Please be honest and respectful.
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button 
                                className="btn btn-secondary" 
                                onClick={() => setShowReviewModal(false)}
                                disabled={submittingReview}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn btn-primary" 
                                onClick={handleSubmitReview}
                                disabled={submittingReview || reviewData.rating === 0}
                            >
                                {submittingReview ? 'Submitting...' : 'Submit Review'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

export default Profile;