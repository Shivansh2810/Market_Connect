import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../axios';
import {
  createRazorpayOrder,
  verifyPayment,
  getPaymentByOrderId,
  initiateRefund,
  getRefundStatus,
  cancelPaymentOrder,
} from '../payment';

vi.mock('../axios');

describe('Payment service', () => {
  const orderId = 'order_123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a Razorpay order', async () => {
    const mockPayload = { success: true, id: 'rzp_order_001' };
    api.post.mockResolvedValue({ data: mockPayload });

    const result = await createRazorpayOrder(orderId);

    expect(api.post).toHaveBeenCalledWith('/payments/create-order', { orderId });
    expect(result).toEqual(mockPayload);
  });

  it('verifies a payment', async () => {
    const paymentData = {
      razorpayOrderId: 'order_xyz',
      razorpayPaymentId: 'pay_123',
      razorpaySignature: 'signature',
      orderId,
    };
    const mockPayload = { success: true, status: 'verified' };
    api.post.mockResolvedValue({ data: mockPayload });

    const result = await verifyPayment(paymentData);

    expect(api.post).toHaveBeenCalledWith('/payments/verify', paymentData);
    expect(result).toEqual(mockPayload);
  });

  it('retrieves payment details by order ID', async () => {
    const mockPayload = { success: true, payment: { orderId, status: 'captured' } };
    api.get.mockResolvedValue({ data: mockPayload });

    const result = await getPaymentByOrderId(orderId);

    expect(api.get).toHaveBeenCalledWith(`/payments/order/${orderId}`);
    expect(result).toEqual(mockPayload);
  });

  it('initiates a refund', async () => {
    const refundData = { orderId, refundAmount: 1200, reason: 'Damaged item' };
    const mockPayload = { success: true, requestId: 'refund_001' };
    api.post.mockResolvedValue({ data: mockPayload });

    const result = await initiateRefund(refundData);

    expect(api.post).toHaveBeenCalledWith('/payments/initiate-refund', refundData);
    expect(result).toEqual(mockPayload);
  });

  it('gets refund status for an order', async () => {
    const mockPayload = { success: true, status: 'processed' };
    api.get.mockResolvedValue({ data: mockPayload });

    const result = await getRefundStatus(orderId);

    expect(api.get).toHaveBeenCalledWith(`/payments/refund/status/${orderId}`);
    expect(result).toEqual(mockPayload);
  });

  it('cancels a payment order', async () => {
    const mockPayload = { success: true, message: 'Payment cancelled' };
    api.post.mockResolvedValue({ data: mockPayload });

    const result = await cancelPaymentOrder(orderId);

    expect(api.post).toHaveBeenCalledWith('/payments/payment-cancel', { orderId });
    expect(result).toEqual(mockPayload);
  });
});
