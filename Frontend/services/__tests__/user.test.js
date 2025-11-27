import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../axios';
import {
  getCurrentUserProfile,
  getCurrentUserOrders,
  updateCurrentUserProfile,
  upgradeToSeller,
  login,
  adminLogin,
  signup,
  forgotPassword,
  resetPassword
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

    it('should throw error for non-404 errors', async () => {
      const mockError = { response: { status: 500 } };
      api.get.mockRejectedValueOnce(mockError);

      await expect(getCurrentUserOrders()).rejects.toEqual(mockError);
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

    it('should handle 404 error with fallback', async () => {
      const payload = { name: 'Jane Doe' };
      const mockResponse = { success: true, data: payload };
      api.put
        .mockRejectedValueOnce({ response: { status: 404 } })
        .mockResolvedValueOnce({ data: mockResponse });

      const result = await updateCurrentUserProfile(payload);

      expect(api.put).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockResponse);
    });

    it('should throw error for non-404 errors', async () => {
      const payload = { name: 'Jane Doe' };
      const mockError = { response: { status: 500 } };
      api.put.mockRejectedValueOnce(mockError);

      await expect(updateCurrentUserProfile(payload)).rejects.toEqual(mockError);
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

    it('should handle login error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const loginData = { email: 'test@example.com', password: 'wrong' };
      const mockError = new Error('Invalid credentials');
      api.post.mockRejectedValueOnce(mockError);

      await expect(login(loginData)).rejects.toThrow('Invalid credentials');
      expect(consoleSpy).toHaveBeenCalledWith('Login error:', mockError);
      
      consoleSpy.mockRestore();
    });
  });

  describe('adminLogin', () => {
    it('should login admin user', async () => {
      const loginData = { email: 'admin@example.com', password: 'password' };
      const mockResponse = { success: true, token: 'admin123' };
      api.post.mockResolvedValue({ data: mockResponse });

      const result = await adminLogin(loginData);

      expect(api.post).toHaveBeenCalledWith('/users/admin/login', loginData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle admin login error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const loginData = { email: 'admin@example.com', password: 'wrong' };
      const mockError = new Error('Invalid credentials');
      api.post.mockRejectedValueOnce(mockError);

      await expect(adminLogin(loginData)).rejects.toThrow('Invalid credentials');
      expect(consoleSpy).toHaveBeenCalledWith('Admin login error:', mockError);
      
      consoleSpy.mockRestore();
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

    it('should handle signup error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const signupData = { name: 'John', email: 'john@example.com', password: 'password' };
      const mockError = new Error('Email already exists');
      api.post.mockRejectedValueOnce(mockError);

      await expect(signup(signupData)).rejects.toThrow('Email already exists');
      expect(consoleSpy).toHaveBeenCalledWith('Signup error:', mockError);
      
      consoleSpy.mockRestore();
    });
  });

  describe('forgotPassword', () => {
    it('should send forgot password email', async () => {
      const mockResponse = { success: true, message: 'Reset email sent' };
      api.post.mockResolvedValue({ data: mockResponse });

      const result = await forgotPassword('test@example.com');

      expect(api.post).toHaveBeenCalledWith('/users/forgot-password', { email: 'test@example.com' });
      expect(result).toEqual(mockResponse);
    });

    it('should handle forgot password error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockError = new Error('User not found');
      api.post.mockRejectedValueOnce(mockError);

      await expect(forgotPassword('test@example.com')).rejects.toThrow('User not found');
      expect(consoleSpy).toHaveBeenCalledWith('Forgot password error:', mockError);
      
      consoleSpy.mockRestore();
    });
  });

  describe('resetPassword', () => {
    it('should reset password', async () => {
      const mockResponse = { success: true, message: 'Password reset successful' };
      const passwordData = { password: 'newpassword', confirmPassword: 'newpassword' };
      api.post.mockResolvedValue({ data: mockResponse });

      const result = await resetPassword('token123', passwordData);

      expect(api.post).toHaveBeenCalledWith('/users/reset-password', {
        token: 'token123',
        ...passwordData
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle reset password error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const passwordData = { password: 'newpassword', confirmPassword: 'newpassword' };
      const mockError = new Error('Invalid token');
      api.post.mockRejectedValueOnce(mockError);

      await expect(resetPassword('invalid', passwordData)).rejects.toThrow('Invalid token');
      expect(consoleSpy).toHaveBeenCalledWith('Reset password error:', mockError);
      
      consoleSpy.mockRestore();
    });
  });
});
