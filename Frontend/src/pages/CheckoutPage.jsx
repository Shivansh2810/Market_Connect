import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, totalAmount, itemCount, updateQuantity, removeFromCart, clearCart } = useCart();

  const handlePlaceOrder = () => {
    // Placeholder for future integration with backend orders flow
    alert('Checkout flow coming soon!');
    clearCart();
    navigate('/dashboard');
  };

  if (items.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Your cart is empty</h2>
        <p>Add products to your cart before proceeding to checkout.</p>
        <button
          type="button"
          style={{
            marginTop: '20px',
            padding: '10px 24px',
            backgroundColor: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
          onClick={() => navigate('/dashboard')}
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px', maxWidth: '960px', margin: '0 auto' }}>
      <button
        type="button"
        onClick={() => navigate(-1)}
        style={{
          marginBottom: '24px',
          background: 'none',
          border: 'none',
          color: '#2563eb',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        ← Continue Shopping
      </button>

      <h1 style={{ marginBottom: '24px' }}>Checkout</h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '24px'
        }}
      >
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)' }}>
          <h2 style={{ marginBottom: '16px' }}>Order Summary ({itemCount} items)</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {items.map((item) => (
              <div
                key={item.productId}
                style={{
                  display: 'flex',
                  gap: '16px',
                  borderBottom: '1px solid #e2e8f0',
                  paddingBottom: '16px'
                }}
              >
                <img
                  src={item.productDetails?.image || ''}
                  alt={item.productDetails?.title || 'Product'}
                  style={{ width: '96px', height: '96px', objectFit: 'cover', borderRadius: '8px' }}
                />
                <div style={{ flex: 1 }}>
                  <h3 style={{ marginBottom: '4px' }}>{item.productDetails?.title}</h3>
                  <p style={{ margin: '0 0 8px 0', color: '#64748b' }}>{item.productDetails?.category}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontWeight: 'bold' }}>
                      {item.productDetails?.currency === 'USD' ? '$' : '₹'}
                      {item.productDetails?.price || 0}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          border: '1px solid #cbd5f5',
                          background: '#fff',
                          cursor: 'pointer'
                        }}
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          border: '1px solid #cbd5f5',
                          background: '#fff',
                          cursor: 'pointer'
                        }}
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.productId)}
                      style={{
                        marginLeft: 'auto',
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)', height: 'fit-content' }}>
          <h2 style={{ marginBottom: '16px' }}>Price Details</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Items ({itemCount})</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Shipping</span>
              <span style={{ color: '#22c55e' }}>Free</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '18px', marginTop: '12px' }}>
              <span>Total Amount</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePlaceOrder}
            style={{
              width: '100%',
              marginTop: '24px',
              padding: '12px 16px',
              backgroundColor: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600'
            }}
          >
            Place Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
