import React, { useState } from 'react';
import './ProductDetail.css';
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
    faShieldAlt
} from '@fortawesome/free-solid-svg-icons';

const ProductDetail = ({ product, onBack, onAddToCart, onBuyNow }) => {
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [isInCart, setIsInCart] = useState(false);

    // Get primary image or first image - matching backend images structure
    const getPrimaryImage = () => {
        if (product.images && product.images.length > 0) {
            const primaryImage = product.images.find(img => img.isPrimary);
            return primaryImage ? primaryImage.url : product.images[0].url;
        }
        return '';
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
                            <span className="product-category">{product.categoryName || 'Category'}</span>
                            <h1 className="product-title">{product.title}</h1>
                            <div className="product-rating">
                                <div className="stars">
                                    {[...Array(5)].map((_, i) => (
                                        <FontAwesomeIcon 
                                            key={i} 
                                            icon={faStar} 
                                            className={i < Math.floor(product.ratingAvg || 0) ? 'filled' : ''}
                                        />
                                    ))}
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

                        {/* Product Specifications */}
                        {product.specs && Object.keys(product.specs).length > 0 && (
                            <div className="product-specs">
                                <h3>Specifications</h3>
                                <div className="specs-grid">
                                    {Object.entries(product.specs).map(([key, value]) => (
                                        <div key={key} className="spec-item">
                                            <span className="spec-key">{key}:</span>
                                            <span className="spec-value">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Tags */}
                        {product.tags && product.tags.length > 0 && (
                            <div className="product-tags">
                                {product.tags.map((tag, index) => (
                                    <span key={index} className="tag">#{tag}</span>
                                ))}
                            </div>
                        )}

                        {/* Product Condition */}
                        <div className="product-condition">
                            <FontAwesomeIcon icon={conditionInfo.icon} style={{ color: conditionInfo.color }} />
                            <span>Condition: <strong>{conditionInfo.text}</strong></span>
                        </div>

                        {/* Stock Status */}
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

                        {/* Description */}
                        {product.description && (
                            <div className="product-description">
                                <h3>Description</h3>
                                <p>{product.description}</p>
                            </div>
                        )}

                        {/* Quantity Selector */}
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

                        {/* Action Buttons */}
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

                        {/* Additional Info */}
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
            </div>
        </div>
    );
};

export default ProductDetail;