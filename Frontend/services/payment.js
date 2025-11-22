import api from "./axios";

/**
 * Create a Razorpay order for payment
 * @param {string} orderId - The order ID from backend
 * @returns {Promise} Response with razorpayOrderId, amount, currency, keyId
 */
export const createRazorpayOrder = async (orderId) => {
  const response = await api.post("/payments/create-order", { orderId });
  return response.data;
};

/**
 * Verify payment after completion
 * @param {Object} paymentData - Contains razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId
 * @returns {Promise} Response with payment and order details
 */
export const verifyPayment = async (paymentData) => {
  const response = await api.post("/payments/verify", paymentData);
  return response.data;
};

/**
 * Get payment details by order ID
 * @param {string} orderId - The order ID
 * @returns {Promise} Payment details
 */
export const getPaymentByOrderId = async (orderId) => {
  const response = await api.get(`/payments/order/${orderId}`);
  return response.data;
};

/**
 * Initiate a refund for an order
 * @param {Object} refundData - Contains orderId, refundAmount (optional), reason (optional)
 * @returns {Promise} Refund details
 */
export const initiateRefund = async (refundData) => {
  const response = await api.post("/payments/initiate-refund", refundData);
  return response.data;
};

/**
 * Get refund status for an order
 * @param {string} orderId - The order ID
 * @returns {Promise} Refund status details
 */
export const getRefundStatus = async (orderId) => {
  const response = await api.get(`/payments/refund/status/${orderId}`);
  return response.data;
};

