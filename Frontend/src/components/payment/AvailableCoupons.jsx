import { useState, useEffect } from 'react';
import { getAllCoupons } from '../../../api/coupon';
import './AvailableCoupons.css';

const AvailableCoupons = ({ cartValue, onSelectCoupon }) => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCoupons, setShowCoupons] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await getAllCoupons();
      
      if (response.success) {
        // Filter active and valid coupons
        const validCoupons = response.data.filter(coupon => {
          const now = new Date();
          const validUntil = new Date(coupon.validUntil);
          const isActive = coupon.isActive;
          const isNotExpired = validUntil > now;
          const hasUsageLeft = !coupon.usageLimit || coupon.usedCount < coupon.usageLimit;
          
          return isActive && isNotExpired && hasUsageLeft;
        });
        
        setCoupons(validCoupons);
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const isApplicable = (coupon) => {
    return cartValue >= coupon.minOrderValue;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="available-coupons-loading">
        Loading available coupons...
      </div>
    );
  }

  if (coupons.length === 0) {
    return null;
  }

  return (
    <div className="available-coupons">
      <button
        type="button"
        className="toggle-coupons-btn"
        onClick={() => setShowCoupons(!showCoupons)}
      >
        {showCoupons ? '▼' : '▶'} View Available Coupons ({coupons.length})
      </button>

      {showCoupons && (
        <div className="coupons-list">
          {coupons.map((coupon) => {
            const applicable = isApplicable(coupon);
            
            return (
              <div 
                key={coupon._id} 
                className={`coupon-card ${!applicable ? 'not-applicable' : ''}`}
              >
                <div className="coupon-code-badge">
                  {coupon.code}
                </div>
                <div className="coupon-info">
                  <p className="coupon-description">{coupon.description}</p>
                  <div className="coupon-details-row">
                    <span className="coupon-discount-text">
                      Save ₹{coupon.discountAmount}
                    </span>
                    {coupon.minOrderValue > 0 && (
                      <span className="coupon-min-order">
                        Min order: ₹{coupon.minOrderValue}
                      </span>
                    )}
                  </div>
                  <div className="coupon-validity">
                    Valid till {formatDate(coupon.validUntil)}
                  </div>
                </div>
                {applicable ? (
                  <button
                    type="button"
                    className="btn-apply-coupon-card"
                    onClick={() => onSelectCoupon(coupon.code)}
                  >
                    Apply
                  </button>
                ) : (
                  <div className="not-applicable-text">
                    Add ₹{(coupon.minOrderValue - cartValue).toFixed(2)} more
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AvailableCoupons;
