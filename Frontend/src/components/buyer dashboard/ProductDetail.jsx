import React, { useState } from 'react';
import './ProductDetail.css'; // <-- Make sure this file exists
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faArrowLeft,
    faStar,
    faShoppingCart,
    faCheck,
    faTimes,
    faTag,
    faBox,
    faTruck,
    faShieldAlt,
    faUser
} from '@fortawesome/free-solid-svg-icons';

// 1. ACCEPT 'reviews' PROP
const ProductDetail = ({ product, reviews = [], onBack, onAddToCart, onBuyNow }) => {
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [isInCart, setIsInCart] = useState(false);

    // 2. ADDED HELPER FUNCTIONS FOR REVIEWS
    const renderStars = (rating) => {
        return [...Array(5)].map((_, i) => (
            <FontAwesomeIcon 
                key={i} 
                icon={faStar} 
                className={i < Math.floor(rating || 0) ? 'filled' : ''}
            />
        ));
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    if (!product) {
        return (
            <div className="product-detail-page">
                <div className="product-detail-container">
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                        <h2>Product data is missing</h2>
                        <button className="back-button" onClick={onBack}>
                            <FontAwesomeIcon icon={faArrowLeft} />
                            Back to Products
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const getPrimaryImage = () => {
        if (product.images && product.images.length > 0) {
            const primaryImage = product.images.find(img => img.isPrimary);
            return primaryImage ? primaryImage.url : product.images[0].url;
        }
        return 'https://via.placeholder.com/600x600?text=No+Image';
    };
    
    const primaryImage = getPrimaryImage();
    const allImages = product.images?.map(img => img.url) || (primaryImage ? [primaryImage] : []);

    const handleAddToCart = () => {
        onAddToCart(product, quantity);
        setIsInCart(true);
    };

    const handleBuyNow = () => {
        onBuyNow(product, quantity);
    };

    const getConditionBadge = (condition) => {
        const conditions = {
            'new': { text: 'Brand New', color: '#28a745', icon: faCheck },
            'used': { text: 'Used', color: '#ffc107', icon: faTag },
            'refurbished': { text: 'Refurbished', color: '#17a2b8', icon: faBox }
        };
        return conditions[condition] || conditions['new'];
    };

    const conditionInfo = getConditionBadge(product.condition || 'new');
    
    // 3. SELLER NAME LOGIC (this will now work correctly)
    const sellerName = (product.sellerId && typeof product.sellerId === 'object')
        ? product.sellerId.sellerInfo?.shopName || product.sellerId.name || 'Seller'
        : 'Market Connect'; // Fallback if sellerId is somehow missing

    return (
        <div className="product-detail-page">
            <div className="product-detail-container">
                {/* Header with Back Button */}
                <div className="product-detail-header">
                    <button className="back-button" onClick={onBack}>
                        <FontAwesomeIcon icon={faArrowLeft} />
                        Back to Products
                    </button>
                </div>

                <div className="product-detail-content">
                    {/* Left Side - Images */}
                    <div className="product-images">
                        <div className="main-image">
                            <img src={allImages[selectedImageIndex] || primaryImage} alt={product.title} />
                        </div>
                        {allImages.length > 1 && (
                            <div className="thumbnail-images">
                                {allImages.map((image, index) => (
                                    <div
                                        key={index}
                                        className={`thumbnail ${selectedImageIndex === index ? 'active' : ''}`}
                                        onClick={() => setSelectedImageIndex(index)}
                                    >
                                        <img src={image} alt={`${product.title} ${index + 1}`} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Side - Product Info */}
                    <div className="product-info">
                        <div className="product-header">
                            {product.category && (
                                <span className="product-category">
                                    {typeof product.category === 'string' 
                                        ? product.category 
                                        : product.category.name || 'Category'}
                                </span>
                            )}
                            {!product.category && product.categoryId && (
                                <span className="product-category">
                                    {typeof product.categoryId === 'string'
                                        ? `Category: ${product.categoryId}`
                                        : product.categoryId.name || 'Category'}
                                </span>
                            )}
                            <h1 className="product-title">{product.title}</h1>
                            {product.slug && (
                                <span className="product-slug" style={{fontSize: '12px', color: '#666', display: 'block', marginBottom: '10px'}}>
                                    {product.slug}
                                </span>
                            )}
                            <div className="product-rating">
                                <div className="stars">
                                    {/* Use the new renderStars function */}
                                    {renderStars(product.ratingAvg)}
                                </div>
                                <span className="rating-text">{product.ratingAvg?.toFixed(1) || '0.0'} ({product.ratingCount || 0} reviews)</span>
                            </div>
                        </div>

                        <div className="product-price-section">
                            <div className="price-group">
                                <span className="current-price">
                                    {product.currency === 'USD' ? '$' : '₹'}{product.price}
                                </span>
                            </div>
                            {product.currency === 'USD' && (
                                <span className="currency-badge">USD</span>
                            )}
                        </div>

                        {product.specs && (() => {
                            let specsObj = {};
                            if (product.specs instanceof Map) {
                                product.specs.forEach((value, key) => {
                                    specsObj[key] = value;
                                });
                            } else {
                                specsObj = product.specs;
                            }
                            
                            return Object.keys(specsObj).length > 0 ? (
                                <div className="product-specs">
                                    <h3>Specifications</h3>
                                    <div className="specs-grid">
                                        {Object.entries(specsObj).map(([key, value]) => (
                                            <div key={key} className="spec-item">
                                                <span className="spec-key">{key}:</span>
                                                <span className="spec-value">{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null;
                        })()}

                        {product.tags && product.tags.length > 0 && (
                            <div className="product-tags">
                                {product.tags.map((tag, index) => (
                                    <span key={index} className="tag">#{tag}</span>
                                ))}
                            </div>
                        )}

                        <div className="product-condition">
                            <FontAwesomeIcon icon={conditionInfo.icon} style={{ color: conditionInfo.color }} />
                            <span>Condition: <strong>{conditionInfo.text}</strong></span>
                        </div>

                        {/* --- 4. SELLER NAME FIX --- */}
                        <div className="seller-info" style={{marginTop: '15px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px'}}>
                            <span style={{fontSize: '14px', color: '#666'}}>
                                Sold by: {sellerName}
                            </span>
                        </div>
                        {/* --- END OF FIX --- */}


                        <div className="stock-status">
                            {product.stock > 0 ? (
                                <div className="in-stock">
                                    <FontAwesomeIcon icon={faCheck} />
                                    <span>In Stock</span>
                                </div>
                            ) : (
                                <div className="out-of-stock">
                                    <FontAwesomeIcon icon={faTimes} />
                                    <span>Out of Stock</span>
                                </div>
                            )}
                            {product.stock !== undefined && (
                                <span className="stock-quantity">({product.stock} units available)</span>
                            )}
                        </div>

                        {product.description && (
                            <div className="product-description">
                                <h3>Description</h3>
                                <p>{product.description}</p>
                            </div>
                        )}

                        <div className="quantity-selector">
                            <label>Quantity:</label>
                            <div className="quantity-controls">
                                <button 
                                    className="quantity-btn"
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    disabled={quantity <= 1}
                                >
                                    -
                                </button>
                                <span className="quantity">{quantity}</span>
                                <button 
                                    className="quantity-btn"
                                    onClick={() => setQuantity(quantity + 1)}
                                    disabled={product.stock <= 0 || quantity >= product.stock}
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        <div className="product-actions">
                            <button 
                                className="btn-add-cart"
                                onClick={handleAddToCart}
                                disabled={product.stock <= 0}
                            >
                                <FontAwesomeIcon icon={faShoppingCart} />
                                {isInCart ? 'Added to Cart' : 'Add to Cart'}
                            </button>
                            <button 
                                className="btn-buy-now"
                                onClick={handleBuyNow}
                                disabled={product.stock <= 0}
                            >
                                Buy Now
                            </button>
                        </div>

                        <div className="product-features">
                            <div className="feature">
                                <FontAwesomeIcon icon={faTruck} />
                                <span>Free Shipping on orders above ₹500</span>
                            </div>
                            <div className="feature">
                                <FontAwesomeIcon icon={faShieldAlt} />
                                <span>Secure Payment</span>
                            </div>
                            <div className="feature">
                                <FontAwesomeIcon icon={faCheck} />
                                <span>7-Day Return Policy</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- 5. ADDED NEW REVIEW SECTION --- */}
                <div className="product-reviews">
                    <h3>Customer Reviews ({reviews.length})</h3>
                    {reviews.length > 0 ? (
                        <div className="review-list">
                            {reviews.map(review => (
                                <div key={review._id} className="review-item">
                                    <div className="review-header">
                                        <div className="review-buyer">
                                            <FontAwesomeIcon icon={faUser} />
                                            <span>{review.buyerId?.name || 'Anonymous User'}</span>
                                        </div>
                                        <div className="review-rating">
                                            {renderStars(review.rating)}
                                        </div>
                                    </div>
                                    <p className="review-comment">{review.comment}</p>
                                    <span className="review-date">{formatDate(review.createdAt)}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>No reviews yet for this product.</p>
                    )}
                </div>
                {/* --- END OF NEW SECTION --- */}

            </div>
        </div>
    );
};

export default ProductDetail;