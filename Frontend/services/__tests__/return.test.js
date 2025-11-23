import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../axios';
import {
  requestReturn,
  getMyReturns,
  getReturnsByOrderId,
  getReturnById
} from '../return';

vi.mock('../axios');

describe('Return API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('requestReturn', () => {
    it('should request a return', async () => {
      const returnData = {
        orderId: '123',
        items: [{ productId: '456', quantity: 1 }],
        reason: 'Damaged Item',
        description: 'Product arrived damaged'
      };
      const mockResponse = { success: true, data: { _id: '789', ...returnData } };
      api.post.mockResolvedValue({ data: mockResponse });

      const result = await requestReturn(returnData);

      expect(api.post).toHaveBeenCalledWith('/returns/request', returnData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getMyReturns', () => {
    it('should fetch buyer returns', async () => {
      const mockReturns = {
        success: true,
        data: [
          { _id: '1', status: 'Requested' },
          { _id: '2', status: 'Approved' }
        ]
      };
      api.get.mockResolvedValue({ data: mockReturns });

      const result = await getMyReturns();

      expect(api.get).toHaveBeenCalledWith('/returns/my-returns');
      expect(result).toEqual(mockReturns);
    });
  });

  describe('getReturnsByOrderId', () => {
    it('should fetch returns for a specific order', async () => {
      const orderId = '123';
      const mockReturns = {
        success: true,
        data: [{ _id: '1', orderId, status: 'Requested' }]
      };
      api.get.mockResolvedValue({ data: mockReturns });

      const result = await getReturnsByOrderId(orderId);

      expect(api.get).toHaveBeenCalledWith(`/returns/order/${orderId}`);
      expect(result).toEqual(mockReturns);
    });
  });

  describe('getReturnById', () => {
    it('should fetch a specific return', async () => {
      const returnId = '123';
      const mockReturn = {
        success: true,
        data: { _id: returnId, status: 'Approved' }
      };
      api.get.mockResolvedValue({ data: mockReturn });

      const result = await getReturnById(returnId);

      expect(api.get).toHaveBeenCalledWith(`/returns/${returnId}`);
      expect(result).toEqual(mockReturn);
    });
  });
});
