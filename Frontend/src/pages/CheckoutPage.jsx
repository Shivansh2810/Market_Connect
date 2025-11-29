import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { createOrder } from '../../services/order';
import { applyCoupon } from '../../services/coupon';
import PaymentGateway from '../components/payment/PaymentGateway';
import AvailableCoupons from '../components/payment/AvailableCoupons';
import { cancelPaymentOrder } from '../../services/payment';
import './CheckoutPage.css';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, totalAmount, itemCount, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const [shippingInfo, setShippingInfo] = useState({
    street: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India'
  });
  const [orderCreated, setOrderCreated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showShippingForm, setShowShippingForm] = useState(true);
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState(null);

  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setShippingInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApplyCoupon = async (codeOverride) => {
    const rawCode = typeof codeOverride === 'string' ? codeOverride : couponCode;
    const normalizedCode = rawCode.trim().toUpperCase();

    if (!normalizedCode) {
      setCouponError('Please enter a coupon code');
      return;
    }

    try {
      setCouponLoading(true);
      setCouponError(null);

      // Calculate cart value before tax and shipping
      const cartValue = totalAmount;

      const response = await applyCoupon(normalizedCode, cartValue);

      if (response.success) {
        setAppliedCoupon(response.data);
        setCouponError(null);
      } else {
        setCouponError(response.message || 'Failed to apply coupon');
        setAppliedCoupon(null);
      }
    } catch (err) {
      console.error('Coupon application error:', err);
      setCouponError(err.response?.data?.message || 'Invalid or expired coupon');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
  };

  const handleSelectCoupon = (code) => {
    const normalizedCode = code.toUpperCase();
    setCouponCode(normalizedCode);
    // Auto-apply the selected coupon using the latest code value
    setTimeout(() => {
      handleApplyCoupon(normalizedCode);
    }, 100);
  };

  const validateShippingInfo = () => {
    if (!shippingInfo.street.trim()) {
      setError('Street address is required');
      return false;
    }
    if (!shippingInfo.city.trim()) {
      setError('City is required');
      return false;
    }
    if (!shippingInfo.state.trim()) {
      setError('State is required');
      return false;
    }
    if (!shippingInfo.pincode.trim() || !/^[0-9]{6}$/.test(shippingInfo.pincode)) {
      setError('Pincode must be exactly 6 digits');
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateShippingInfo()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Prepare order items - send actual product IDs and quantities
      // Since frontend cart is in localStorage (not synced to backend),
      // we send the actual items instead of using "cart" keyword
      const orderItems = items.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }));

      // Create order without payment field (payment will be created later)
      const orderData = {
        shippingInfo,
        orderItems,
        couponCode: appliedCoupon ? appliedCoupon.coupon.code : undefined
      };

      console.log('Creating order with data:', JSON.stringify(orderData, null, 2));

      const response = await createOrder(orderData);

      if (!response.success) {
        throw new Error(response.message || 'Failed to create order');
      }

      setOrderCreated(response.data);
      setShowShippingForm(false);

    } catch (err) {
      console.error('Order creation error:', err);
      console.error('Error response:', err.response?.data);
      
      // Show detailed error message
      let errorMessage = 'Failed to create order. Please try again.';
      
      if (err.response?.data?.errors) {
        // Joi validation errors
        errorMessage = err.response.data.errors.join(', ');
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    // Payment successful - clear cart and redirect
    clearCart();
    navigate('/dashboard', {
      state: {
        message: 'Payment successful! Your order has been placed.',
        orderId: orderCreated._id,
        type: 'success'
      }
    });
  };

  const handlePaymentCancel = async () => {
    try {
      // We check if orderCreated exists to get the ID
      if (orderCreated && orderCreated._id) {
        await cancelPaymentOrder(orderCreated._id);
        console.log("Payment status updated to Failed/Cancelled on backend");
      }
    } catch (error) {
      // logging the error but don't stop the UI flow
      console.error("Failed to update status on backend:", error);
    }

    setOrderCreated(null);
    setShowShippingForm(true);
    navigate('/checkout', {
      state: {
        message: 'Payment was cancelled. You can try again.',
        type: 'info'
      }
    });
  };

  // If order is created, show payment gateway
  if (orderCreated) {
    const orderDetails = {
      buyerName: user?.name || user?.email || 'Customer',
      buyerEmail: user?.email || '',
      buyerPhone: user?.phone || ''
    };

    return (
      <div className="checkout-page">
        <PaymentGateway
          orderId={orderCreated._id}
          amount={orderCreated.totalPrice}
          orderDetails={orderDetails}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentCancel={handlePaymentCancel}
        />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="checkout-page-empty">
        <h2>Your cart is empty</h2>
        <p>Add products to your cart before proceeding to checkout.</p>
        <button
          type="button"
          className="btn-primary"
          onClick={() => navigate('/dashboard')}
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  // Calculate prices for display
  const itemsPrice = totalAmount;
  const discountAmount = appliedCoupon?.cartSummary?.discountAmount || 0;
  const priceAfterDiscount = itemsPrice - discountAmount;
  const taxPrice = parseFloat((0.18 * priceAfterDiscount).toFixed(2));
  const shippingPrice = priceAfterDiscount > 1000 ? 0 : 50;
  const finalTotalPrice = priceAfterDiscount + taxPrice + shippingPrice;

  return (
    <div className="checkout-page">
      <button
        type="button"
        className="back-button"
        onClick={() => navigate(-1)}
      >
        ← Continue Shopping
      </button>

      <h1 className="checkout-title">Checkout</h1>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="checkout-grid">
        {/* Left Column - Order Summary and Shipping */}
        <div className="checkout-left">
          {/* Shipping Information Form */}
          {showShippingForm && (
            <div className="checkout-section">
              <h2>Shipping Information</h2>
              <div className="shipping-form">
                <div className="form-group">
                  <label htmlFor="street">Street Address *</label>
                  <input
                    type="text"
                    id="street"
                    name="street"
                    value={shippingInfo.street}
                    onChange={handleShippingChange}
                    placeholder="Enter street address"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="city">City *</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={shippingInfo.city}
                    onChange={handleShippingChange}
                    placeholder="Enter city"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="state">State *</label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={shippingInfo.state}
                    onChange={handleShippingChange}
                    placeholder="Enter state"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="pincode">Pincode *</label>
                  <input
                    type="text"
                    id="pincode"
                    name="pincode"
                    value={shippingInfo.pincode}
                    onChange={handleShippingChange}
                    placeholder="6-digit pincode"
                    maxLength="6"
                    pattern="[0-9]{6}"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="country">Country</label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={shippingInfo.country}
                    onChange={handleShippingChange}
                    placeholder="Enter country"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Order Summary */}
          <div className="checkout-section">
            <h2>Order Summary ({itemCount} items)</h2>
            <div className="order-items">
              {items.map((item) => (
                <div key={item.productId} className="order-item">
                  <img
                    src={item.productDetails?.image || ''}
                    alt={item.productDetails?.title || 'Product'}
                    className="order-item-image"
                  />
                  <div className="order-item-details">
                    <h3>{item.productDetails?.title}</h3>
                    <p className="order-item-category">{item.productDetails?.category}</p>
                    <div className="order-item-footer">
                      <span className="order-item-price">
                        {item.productDetails?.currency === 'USD' ? '$' : '₹'}
                        {item.productDetails?.price || 0}
                      </span>
                      <div className="quantity-controls">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="quantity-btn"
                        >
                          -
                        </button>
                        <span className="quantity-value">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="quantity-btn"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.productId)}
                        className="remove-btn"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Price Details */}
        <div className="checkout-right">
          {/* Coupon Section */}
          <div className="coupon-section">
            <h3>Apply Coupon</h3>
            {!appliedCoupon ? (
              <>
                <div className="coupon-input-group">
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    disabled={couponLoading}
                    className="coupon-input"
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyCoupon()}
                    disabled={couponLoading || !couponCode.trim()}
                    className="btn-apply-coupon"
                  >
                    {couponLoading ? 'Applying...' : 'Apply'}
                  </button>
                </div>
                <AvailableCoupons 
                  cartValue={totalAmount} 
                  onSelectCoupon={handleSelectCoupon}
                />
              </>
            ) : (
              <div className="coupon-applied">
                <div className="coupon-success">
                  <span className="coupon-icon">✓</span>
                  <div className="coupon-details">
                    <strong>{appliedCoupon.coupon.code}</strong>
                    <p>{appliedCoupon.coupon.description}</p>
                    <span className="coupon-discount">
                      You saved ₹{appliedCoupon.cartSummary.discountAmount.toFixed(2)}!
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="btn-remove-coupon"
                >
                  Remove
                </button>
              </div>
            )}
            {couponError && (
              <div className="coupon-error">
                {couponError}
              </div>
            )}
          </div>

          <div className="price-details">
            <h2>Price Details</h2>
            <div className="price-row">
              <span>Items ({itemCount})</span>
              <span>₹{itemsPrice.toFixed(2)}</span>
            </div>
            {appliedCoupon && (
              <div className="price-row discount-row">
                <span>Discount ({appliedCoupon.coupon.code})</span>
                <span className="discount-amount">
                  -₹{discountAmount.toFixed(2)}
                </span>
              </div>
            )}
            <div className="price-row">
              <span>Tax (18% GST)</span>
              <span>₹{taxPrice.toFixed(2)}</span>
            </div>
            <div className="price-row">
              <span>Shipping</span>
              <span className={shippingPrice === 0 ? 'free-shipping' : ''}>
                {shippingPrice === 0 ? 'Free' : `₹${shippingPrice.toFixed(2)}`}
              </span>
            </div>
            <div className="price-divider"></div>
            <div className="price-row total-row">
              <span>Total Amount</span>
              <span>₹{finalTotalPrice.toFixed(2)}</span>
            </div>
            {appliedCoupon && (
              <div className="savings-info">
                Total Savings: ₹{discountAmount.toFixed(2)}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={loading}
            className="btn-place-order"
          >
            {loading ? 'Creating Order...' : 'Proceed to Payment'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;