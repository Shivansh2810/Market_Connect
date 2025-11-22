import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../axios';
import {
  getCurrentUserProfile,
  getCurrentUserOrders,
  updateCurrentUserProfile,
  upgradeToSeller,
  login,
  signup
} from '../user';

vi.mock('../axios');

describe('User API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCurrentUserProfile', () => {
    it('should fetch current user profile', async () => {
      const mockProfile = {
        success: true,
        data: { name: 'John Doe', email: 'john@example.com' }
      };
      api.get.mockResolvedValue({ data: mockProfile });

      const result = await getCurrentUserProfile();

      expect(api.get).toHaveBeenCalledWith('/users/me');
      expect(result).toEqual(mockProfile);
    });
  });

  describe('getCurrentUserOrders', () => {
    it('should fetch current user orders', async () => {
      const mockOrders = {
        success: true,
        data: [{ _id: '1', orderStatus: 'Delivered' }]
      };
      api.get.mockResolvedValue({ data: mockOrders });

      const result = await getCurrentUserOrders();

      expect(api.get).toHaveBeenCalledWith('/users/me/orders');
      expect(result).toEqual(mockOrders);
    });

    it('should handle 404 error with fallback', async () => {
      const mockOrders = {
        success: true,
        data: []
      };
      api.get
        .mockRejectedValueOnce({ response: { status: 404 } })
        .mockResolvedValueOnce({ data: mockOrders });

      const result = await getCurrentUserOrders();

      expect(api.get).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockOrders);
    });
  });

  describe('updateCurrentUserProfile', () => {
    it('should update user profile', async () => {
      const payload = { name: 'Jane Doe' };
      const mockResponse = { success: true, data: payload };
      api.put.mockResolvedValue({ data: mockResponse });

      const result = await updateCurrentUserProfile(payload);

      expect(api.put).toHaveBeenCalledWith('/users/me/profile', payload);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('upgradeToSeller', () => {
    it('should upgrade user to seller', async () => {
      const mockResponse = { success: true };
      api.put.mockResolvedValue({ data: mockResponse });

      const result = await upgradeToSeller('My Shop', '123 Main St');

      expect(api.put).toHaveBeenCalledWith('/users/upgradetoseller', {
        shopName: 'My Shop',
        shopAddress: '123 Main St'
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('login', () => {
    it('should login user', async () => {
      const loginData = { email: 'test@example.com', password: 'password' };
      const mockResponse = { success: true, token: 'abc123' };
      api.post.mockResolvedValue({ data: mockResponse });

      const result = await login(loginData);

      expect(api.post).toHaveBeenCalledWith('/users/login', loginData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('signup', () => {
    it('should signup new user', async () => {
      const signupData = { name: 'John', email: 'john@example.com', password: 'password' };
      const mockResponse = { success: true, token: 'abc123' };
      api.post.mockResolvedValue({ data: mockResponse });

      const result = await signup(signupData);

      expect(api.post).toHaveBeenCalledWith('/users/signup', signupData);
      expect(result).toEqual(mockResponse);
    });
  });
});
