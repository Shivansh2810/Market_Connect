import React, { useState, useEffect } from 'react';
import './ReviewManagement.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faArrowLeft,
    faStar,
    faCheck,
    faTimes,
    faFilter,
    faUser,
    faCalendar
} from '@fortawesome/free-solid-svg-icons';
import api from '../../../api/axios';

const ReviewManagement = ({ product, onBack }) => {
    const [filterRating, setFilterRating] = useState('all');
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch reviews from backend
    useEffect(() => {
        const fetchReviews = async () => {
            try {
                setLoading(true);
                setError(null);
                
                let response;
                if (product && product._id) {
                    // Fetch reviews for specific product
                    response = await api.get(`/reviews/product/${product._id}`);
                } else {
                    // Fetch all seller reviews (seller stats endpoint)
                    response = await api.get('/reviews/me/seller/stats');
                }
                
                if (response.data.success) {
                    setReviews(response.data.data || []);
                }
            } catch (err) {
                console.error('Failed to fetch reviews:', err);
                setError('Failed to load reviews');
                setReviews([]);
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, [product]);

    // Filter reviews
    const filteredReviews = reviews.filter(review => {
        const matchesRating = filterRating === 'all' || review.rating === parseInt(filterRating);
        return matchesRating;
    });

    // Calculate average rating
    const averageRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : '0.0';

    // Rating distribution
    const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
        rating,
        count: reviews.filter(r => r.rating === rating).length,
        percentage: reviews.length > 0 
            ? (reviews.filter(r => r.rating === rating).length / reviews.length * 100).toFixed(0)
            : 0
    }));


    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Render stars
    const renderStars = (rating) => {
        return [...Array(5)].map((_, i) => (
            <FontAwesomeIcon 
                key={i}
                icon={faStar} 
                className={i < rating ? 'filled' : ''}
            />
        ));
    };

    return (
        <div className="review-management-page">
            <div className="review-management-container">
                <div className="review-header">
                    <button className="back-button" onClick={onBack}>
                        <FontAwesomeIcon icon={faArrowLeft} />
                        Back to Reviews
                    </button>
                    <div className="review-header-content">
                        <div>
                            <h1>{product ? product.title : 'All Reviews'}</h1>
                            <p className="review-subtitle">Manage customer reviews and ratings</p>
                        </div>
                        <div className="review-stats-summary">
                            <div className="stat-item">
                                <div className="stat-value">{averageRating}</div>
                                <div className="stat-label">Average Rating</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-value">{reviews.length}</div>
                                <div className="stat-label">Total Reviews</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="review-content">
                    {/* Sidebar - Rating Distribution */}
                    <aside className="review-sidebar">
                        <h3>Rating Distribution</h3>
                        <div className="rating-distribution">
                            {ratingDistribution.map(({ rating, count, percentage }) => (
                                <div key={rating} className="rating-bar-item">
                                    <div className="rating-label">
                                        <span>{rating}</span>
                                        <FontAwesomeIcon icon={faStar} className="filled" />
                                    </div>
                                    <div className="rating-bar">
                                        <div 
                                            className="rating-bar-fill" 
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                    <div className="rating-count">{count}</div>
                                </div>
                            ))}
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="review-main">
                        {/* Filters */}
                        <div className="review-filters">
                            <div className="filter-buttons">
                                <button
                                    className={`filter-btn ${filterRating === 'all' ? 'active' : ''}`}
                                    onClick={() => setFilterRating('all')}
                                >
                                    All
                                </button>
                                {[5, 4, 3, 2, 1].map(rating => (
                                    <button
                                        key={rating}
                                        className={`filter-btn ${filterRating === rating.toString() ? 'active' : ''}`}
                                        onClick={() => setFilterRating(rating.toString())}
                                    >
                                        <FontAwesomeIcon icon={faStar} className="filled" />
                                        {rating}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Reviews List */}
                        <div className="reviews-list">
                            {loading ? (
                                <div className="loading-state">Loading reviews...</div>
                            ) : error ? (
                                <div className="error-state">{error}</div>
                            ) : filteredReviews.length > 0 ? (
                                filteredReviews.map(review => (
                                    <div key={review._id} className={`review-card ${review.status === 'visible' ? '' : review.status}`}>
                                        <div className="review-card-header">
                                        <div className="reviewer-info">
                                            <div className="reviewer-avatar">
                                                {/* Anonymous avatar - no buyer identifying info */}
                                                <FontAwesomeIcon icon={faUser} />
                                            </div>
                                            <div>
                                                <div className="reviewer-name">
                                                    Anonymous Customer
                                                    {/* Verified purchase if orderId exists (backend requirement: review only for purchased products) */}
                                                    {review.orderId && (
                                                        <span className="verified-badge">Verified Purchase</span>
                                                    )}
                                                </div>
                                                <div className="review-date">
                                                    <FontAwesomeIcon icon={faCalendar} />
                                                    {formatDate(review.createdAt)}
                                                </div>
                                            </div>
                                        </div>
                                            <div className="review-rating">
                                                {renderStars(review.rating)}
                                            </div>
                                        </div>

                                        <div className="review-body">
                                            <p className="review-comment">{review.comment || 'No comment provided.'}</p>
                                        </div>

                                        {/* Review Images */}
                                        {review.images && review.images.length > 0 && (
                                            <div className="review-images" style={{
                                                marginTop: '15px',
                                                display: 'flex',
                                                gap: '10px',
                                                flexWrap: 'wrap'
                                            }}>
                                                {review.images.map((img, idx) => (
                                                    <img 
                                                        key={idx}
                                                        src={img.url} 
                                                        alt={`Review image ${idx + 1}`}
                                                        style={{
                                                            width: '80px',
                                                            height: '80px',
                                                            objectFit: 'cover',
                                                            borderRadius: '8px',
                                                            border: '1px solid var(--border-color)'
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {/* Status Badge */}
                                        {review.status === 'hidden' && (
                                            <div className="status-badge hidden">Hidden</div>
                                        )}
                                        {review.status === 'reported' && (
                                            <div className="status-badge reported">Reported</div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="empty-reviews">
                                    <FontAwesomeIcon icon={faStar} />
                                    <p>No reviews found</p>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default ReviewManagement;

