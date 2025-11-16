import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { createOrder } from '../../api/order';
import PaymentGateway from '../components/payment/PaymentGateway';
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

  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setShippingInfo(prev => ({
      ...prev,
      [name]: value
    }));
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

      // Prepare order items - convert cart items to order format
      // If cart has multiple items, use "cart" format; otherwise use individual items
      const orderItems = items.length > 1 
        ? [{ productId: 'cart', quantity: 1 }] // Cart order format
        : items.map(item => ({
            productId: item.productId,
            quantity: item.quantity
          }));

      // Calculate prices (matching backend logic)
      const itemsPrice = totalAmount;
      const taxPrice = parseFloat((0.18 * itemsPrice).toFixed(2));
      const shippingPrice = itemsPrice > 1000 ? 0 : 50;
      const calculatedTotalPrice = itemsPrice + taxPrice + shippingPrice;

      // Create order
      // Note: Payment ID is required by validation, but payment will be created later
      // We use a placeholder ObjectId format that passes validation
      // The actual payment will be created and linked when user initiates payment
      const orderData = {
        shippingInfo,
        orderItems,
        payment: '000000000000000000000000' // Placeholder ObjectId - payment created later
      };

      const response = await createOrder(orderData);

      if (!response.success) {
        throw new Error(response.message || 'Failed to create order');
      }

      setOrderCreated(response.data);
      setShowShippingForm(false);

    } catch (err) {
      console.error('Order creation error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (paymentData) => {
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

  const handlePaymentCancel = () => {
    // Payment cancelled - allow user to try again or go back
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
  const taxPrice = parseFloat((0.18 * itemsPrice).toFixed(2));
  const shippingPrice = itemsPrice > 1000 ? 0 : 50;
  const finalTotalPrice = itemsPrice + taxPrice + shippingPrice;

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
          <div className="price-details">
            <h2>Price Details</h2>
            <div className="price-row">
              <span>Items ({itemCount})</span>
              <span>₹{itemsPrice.toFixed(2)}</span>
            </div>
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