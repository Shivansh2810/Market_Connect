import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    faShieldAlt,
    faUser,
    faHome // Imported faHome
} from '@fortawesome/free-solid-svg-icons';
import { getSimilarProducts } from '../../../services/product';

const ProductDetail = ({ product, reviews = [], onBack, onAddToCart, onBuyNow }) => {
    const navigate = useNavigate(); // Initialize navigation hook
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [isInCart, setIsInCart] = useState(false);
    const [similarProducts, setSimilarProducts] = useState([]);
    const [loadingSimilar, setLoadingSimilar] = useState(false);

    const renderStars = (rating) => {
        const normalizedRating = parseFloat(rating) || 0;
        const fullStars = Math.floor(normalizedRating);
        const hasHalfStar = normalizedRating % 1 >= 0.5;
        
        return (
            <div className="star-rating">
                {[...Array(5)].map((_, i) => {
                    if (i < fullStars) {
                        return <FontAwesomeIcon key={i} icon={faStar} className="filled" />;
                    } else if (i === fullStars && hasHalfStar) {
                        return <FontAwesomeIcon key={i} icon={faStar} className="half-filled" />;
                    } else {
                        return <FontAwesomeIcon key={i} icon={faStar} className="empty" />;
                    }
                })}
            </div>
        );
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
    
    const sellerName = (product.sellerId && typeof product.sellerId === 'object')
        ? product.sellerId.sellerInfo?.shopName || product.sellerId.name || 'Seller'
        : 'Market Connect';

    useEffect(() => {
        const fetchSimilarProducts = async () => {
            if (!product?._id) return;
            
            try {
                setLoadingSimilar(true);
                const response = await getSimilarProducts(product._id);
                if (response.success && response.products) {
                    setSimilarProducts(response.products);
                }
            } catch (error) {
                console.error('Error fetching similar products:', error);
            } finally {
                setLoadingSimilar(false);
            }
        };

        fetchSimilarProducts();
    }, [product?._id]);

    const handleSimilarProductClick = (similarProduct) => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        window.location.href = `/dashboard/products/${similarProduct._id}`;
    };

    return (
        <div className="product-detail-page">
            <div className="product-detail-container">
                {/* Header with Back Button and Home Icon */}
                <div className="product-detail-header">
                    <button className="back-button" onClick={onBack}>
                        <FontAwesomeIcon icon={faArrowLeft} />
                        Back to Products
                    </button>
                    
                    <button 
                        className="home-button" 
                        onClick={() => navigate('/dashboard')}
                        title="Go to Dashboard"
                    >
                        <FontAwesomeIcon icon={faHome} />
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
                                {renderStars(product.ratingAvg)}
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

                        {/* Quantity Selector */}
                        <div className="quantity-selector">
                            <label htmlFor="quantity">Quantity:</label>
                            <div className="quantity-controls">
                                <button 
                                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                                    disabled={quantity <= 1}
                                >
                                    -
                                </button>
                                <input 
                                    type="number" 
                                    id="quantity"
                                    min="1" 
                                    value={quantity} 
                                    onChange={(e) => {
                                        const value = parseInt(e.target.value, 10);
                                        if (!isNaN(value) && value >= 1) {
                                            setQuantity(value);
                                        }
                                    }}
                                />
                                <button onClick={() => setQuantity(prev => prev + 1)}>+</button>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="action-buttons">
                            <button 
                                className="add-to-cart-btn"
                                onClick={handleAddToCart}
                                disabled={isInCart}
                            >
                                <FontAwesomeIcon icon={faShoppingCart} />
                                {isInCart ? 'Added to Cart' : 'Add to Cart'}
                            </button>
                            <button 
                                className="buy-now-btn"
                                onClick={handleBuyNow}
                            >
                                Buy Now
                            </button>
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

                        <div className="seller-info" style={{marginTop: '15px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px'}}>
                            <span style={{fontSize: '14px', color: '#666'}}>
                                Sold by: {sellerName}
                            </span>
                        </div>

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
                                    <span className="review-date">{formatDate(review.createdAt)}</span>
                                    <p className="review-comment">{review.comment}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>No reviews yet for this product.</p>
                    )}
                </div>

                {similarProducts.length > 0 && (
                    <div className="similar-products-section">
                        <h2 className="similar-products-title">Similar Products You May Like</h2>
                        {loadingSimilar ? (
                            <div className="similar-products-loading">
                                <p>Loading similar products...</p>
                            </div>
                        ) : (
                            <div className="similar-products-grid">
                                {similarProducts.map((similarProduct) => {
                                    const similarPrimaryImage = similarProduct.images?.find(img => img.isPrimary)?.url 
                                        || similarProduct.images?.[0]?.url 
                                        || 'https://via.placeholder.com/300x300?text=No+Image';
                                    
                                    return (
                                        <div 
                                            key={similarProduct._id} 
                                            className="similar-product-card"
                                            onClick={() => handleSimilarProductClick(similarProduct)}
                                        >
                                            <div className="similar-product-image">
                                                <img src={similarPrimaryImage} alt={similarProduct.title} />
                                                {similarProduct.stock <= 0 && (
                                                    <div className="out-of-stock-overlay">Out of Stock</div>
                                                )}
                                            </div>
                                            <div className="similar-product-info">
                                                <h4 className="similar-product-title">{similarProduct.title}</h4>
                                                <div className="similar-product-rating">
                                                    <div className="stars">
                                                        {[...Array(5)].map((_, i) => (
                                                            <FontAwesomeIcon 
                                                                key={i} 
                                                                icon={faStar} 
                                                                className={i < Math.floor(similarProduct.ratingAvg || 0) ? 'filled' : ''}
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className="rating-count">({similarProduct.ratingCount || 0})</span>
                                                </div>
                                                <div className="similar-product-price">
                                                    <span className="price">
                                                        {similarProduct.currency === 'USD' ? '$' : '₹'}{similarProduct.price}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductDetail;