import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../axios';
import { createOrder, getMyOrders, cancelOrder } from '../order';

vi.mock('../axios');

describe('Order API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createOrder', () => {
    it('should create a new order', async () => {
      const orderData = {
        orderItems: [{ productId: '123', quantity: 1 }],
        shippingInfo: { street: '123 Main St', city: 'City' },
        payment: { method: 'card' }
      };
      const mockResponse = { success: true, data: { _id: '456', ...orderData } };
      api.post.mockResolvedValue({ data: mockResponse });

      const result = await createOrder(orderData);

      expect(api.post).toHaveBeenCalledWith('/orders/create', orderData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getMyOrders', () => {
    it('should fetch user orders', async () => {
      const mockOrders = {
        success: true,
        data: [
          { _id: '1', orderStatus: 'Delivered' },
          { _id: '2', orderStatus: 'Shipped' }
        ]
      };
      api.get.mockResolvedValue({ data: mockOrders });

      const result = await getMyOrders();

      expect(api.get).toHaveBeenCalledWith('/orders/my-orders');
      expect(result).toEqual(mockOrders);
    });
  });

  describe('cancelOrder', () => {
    it('should cancel an order', async () => {
      const orderId = '123';
      const mockResponse = { success: true, message: 'Order cancelled' };
      api.put.mockResolvedValue({ data: mockResponse });

      const result = await cancelOrder(orderId);

      expect(api.put).toHaveBeenCalledWith(`/orders/${orderId}/cancel`);
      expect(result).toEqual(mockResponse);
    });
  });
});
