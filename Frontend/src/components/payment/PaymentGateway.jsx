import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRazorpayOrder, verifyPayment } from '../../../api/payment';
import './PaymentGateway.css';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const PaymentGateway = ({ orderId, amount, orderDetails, onPaymentSuccess, onPaymentCancel }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (orderId && amount) {
      initializePayment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, amount]);

  const initializePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load Razorpay script
      const razorpayLoaded = await loadRazorpayScript();
      if (!razorpayLoaded) {
        throw new Error('Failed to load Razorpay SDK. Please check your internet connection.');
      }

      // Create Razorpay order via backend
      const response = await createRazorpayOrder(orderId);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to create payment order');
      }

      const { razorpayOrderId, amount: orderAmount, currency, keyId } = response.data;

      // Initialize Razorpay checkout
      const options = {
        key: keyId,
        amount: orderAmount,
        currency: currency || 'INR',
        name: 'Market Connect',
        description: `Order Payment - ${orderId}`,
        order_id: razorpayOrderId,
        handler: async function (response) {
          // Handle successful payment
          handlePaymentSuccess(response);
        },
        prefill: {
          name: orderDetails?.buyerName || '',
          email: orderDetails?.buyerEmail || '',
          contact: orderDetails?.buyerPhone || '',
        },
        notes: {
          orderId: orderId,
        },
        theme: {
          color: '#2563eb',
        },
        modal: {
          ondismiss: function () {
            // Handle payment cancellation
            handlePaymentCancel();
          },
        },
      };

      setLoading(false);
      
      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (err) {
      console.error('Payment initialization error:', err);
      setError(err.message || 'Failed to initialize payment. Please try again.');
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (razorpayResponse) => {
    try {
      setProcessing(true);
      setError(null);

      // Verify payment with backend
      const verifyData = {
        razorpayOrderId: razorpayResponse.razorpay_order_id,
        razorpayPaymentId: razorpayResponse.razorpay_payment_id,
        razorpaySignature: razorpayResponse.razorpay_signature,
        orderId: orderId,
      };

      const response = await verifyPayment(verifyData);

      if (!response.success) {
        throw new Error(response.message || 'Payment verification failed');
      }

      // Payment successful
      if (onPaymentSuccess) {
        onPaymentSuccess(response.data);
      } else {
        // Default success handling
        navigate('/dashboard', { 
          state: { 
            message: 'Payment successful! Your order has been placed.',
            orderId: orderId 
          } 
        });
      }

    } catch (err) {
      console.error('Payment verification error:', err);
      setError(err.message || 'Payment verification failed. Please contact support.');
      setProcessing(false);
      
      // Show error and allow retry
      if (window.confirm('Payment verification failed. Would you like to try again?')) {
        initializePayment();
      } else {
        handlePaymentCancel();
      }
    }
  };

  const handlePaymentCancel = () => {
    if (onPaymentCancel) {
      onPaymentCancel();
    } else {
      navigate('/checkout', { 
        state: { 
          message: 'Payment was cancelled. You can try again.' 
        } 
      });
    }
  };

  const handleRetry = () => {
    setError(null);
    initializePayment();
  };

  if (processing) {
    return (
      <div className="payment-gateway-container">
        <div className="payment-processing">
          <div className="spinner"></div>
          <h3>Processing Payment...</h3>
          <p>Please wait while we verify your payment.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-gateway-container">
        <div className="payment-error">
          <div className="error-icon">⚠️</div>
          <h3>Payment Error</h3>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={handleRetry} className="btn-retry">
              Try Again
            </button>
            <button onClick={handlePaymentCancel} className="btn-cancel">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="payment-gateway-container">
        <div className="payment-loading">
          <div className="spinner"></div>
          <h3>Loading Payment Gateway...</h3>
          <p>Please wait while we prepare your payment.</p>
        </div>
      </div>
    );
  }

  // This should not be visible as Razorpay modal opens immediately
  return (
    <div className="payment-gateway-container">
      <div className="payment-init">
        <p>Initializing payment gateway...</p>
      </div>
    </div>
  );
};

export default PaymentGateway;

