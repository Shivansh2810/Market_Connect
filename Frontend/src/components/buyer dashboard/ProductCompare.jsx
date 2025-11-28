import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FaTimes, FaStar, FaCheck, FaMinus, FaArrowLeft } from 'react-icons/fa';
import './ProductCompare.css';

const ProductCompare = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [compareData, setCompareData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);

    const ids = searchParams.get('ids');
    if (!ids) {
      setError('No products selected for comparison');
      setLoading(false);
      return;
    }

    fetchCompareData(ids);
  }, [searchParams]);

  const fetchCompareData = async (ids) => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/products/compare?ids=${ids}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to compare products');
      }

      setCompareData(data.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getBetterIndicator = (better, productIndex) => {
    const productKey = productIndex === 0 ? 'p1' : 'p2';
    if (better === productKey) return <FaCheck className="better-icon" />;
    if (better === 'equal') return <FaMinus className="equal-icon" />;
    return null;
  };

  const renderStars = (rating) => {
    return (
      <div className="stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar
            key={star}
            className={star <= Math.round(rating) ? 'filled' : ''}
          />
        ))}
      </div>
    );
  };

  const getPrimaryImage = (product) => {
    const primaryImg = product.images?.find(img => img.isPrimary);
    return primaryImg?.url || product.images?.[0]?.url || '/placeholder.png';
  };

  if (loading) {
    return (
      <div className="compare-container">
        <div className="loading-screen">Loading comparison...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="compare-container">
        <div className="error-screen">
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={() => navigate(-1)} className="back-btn">
            <FaArrowLeft /> Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!compareData) return null;

  const { products, metrics, specs } = compareData;

  return (
    <div className="compare-container">
      <div className="compare-header">
        <button onClick={() => navigate(-1)} className="back-btn">
          <FaArrowLeft /> Back
        </button>
        <h1>Product Comparison</h1>
        <button onClick={() => navigate(-1)} className="close-btn">
          <FaTimes />
        </button>
      </div>

      <div className="compare-content">
        {/* Product Cards */}
        <div className="compare-section">
          <div className="section-label">Products</div>
          <div className="compare-row">
            {products.map((product, index) => (
              <div key={product._id} className="compare-card">
                <div className="product-image-wrapper">
                  <img src={getPrimaryImage(product)} alt={product.title} />
                </div>
                <h3 className="product-title">{product.title}</h3>
                <p className="product-category">
                  {product.categoryId?.name || 'Uncategorized'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Price Comparison */}
        <div className="compare-section">
          <div className="section-label">Price</div>
          <div className="compare-row">
            {products.map((product, index) => (
              <div key={product._id} className="compare-card">
                <div className="metric-value">
                  {getBetterIndicator(metrics.price.better, index)}
                  <span className="price">
                    {product.currency} {metrics.price[index === 0 ? 'p1' : 'p2'].toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rating Comparison */}
        <div className="compare-section">
          <div className="section-label">Rating</div>
          <div className="compare-row">
            {products.map((product, index) => (
              <div key={product._id} className="compare-card">
                <div className="metric-value">
                  {getBetterIndicator(metrics.ratingAvg.better, index)}
                  <div className="rating-display">
                    {renderStars(metrics.ratingAvg[index === 0 ? 'p1' : 'p2'])}
                    <span className="rating-text">
                      {metrics.ratingAvg[index === 0 ? 'p1' : 'p2'].toFixed(1)} 
                      ({metrics.ratingCount[index === 0 ? 'p1' : 'p2']} reviews)
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stock Comparison */}
        <div className="compare-section">
          <div className="section-label">Stock Availability</div>
          <div className="compare-row">
            {products.map((product, index) => (
              <div key={product._id} className="compare-card">
                <div className="metric-value">
                  {getBetterIndicator(metrics.stock.better, index)}
                  <span className={metrics.stock[index === 0 ? 'p1' : 'p2'] > 0 ? 'in-stock' : 'out-of-stock'}>
                    {metrics.stock[index === 0 ? 'p1' : 'p2']} units
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Condition Comparison */}
        <div className="compare-section">
          <div className="section-label">Condition</div>
          <div className="compare-row">
            {products.map((product, index) => (
              <div key={product._id} className="compare-card">
                <div className="metric-value">
                  {getBetterIndicator(metrics.condition.better, index)}
                  <span className={`condition-badge ${metrics.condition[index === 0 ? 'p1' : 'p2']}`}>
                    {metrics.condition[index === 0 ? 'p1' : 'p2']}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Specifications Comparison */}
        {specs && specs.length > 0 && (
          <div className="compare-section">
            <div className="section-label">Specifications</div>
            {specs.map((spec, idx) => (
              <div key={idx} className="spec-row">
                <div className="spec-label">{spec.key}</div>
                <div className="compare-row">
                  {[spec.p1, spec.p2].map((value, index) => (
                    <div key={index} className="compare-card">
                      <div className="spec-value">
                        {value || <span className="not-available">N/A</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCompare;
