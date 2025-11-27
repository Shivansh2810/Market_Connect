import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import api from '../../../api/axios';

// Mock the API
vi.mock('../../../api/axios');

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    delete api.defaults.headers.common['Authorization'];
  });

  it('provides initial auth state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('logs in user successfully', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    const mockUser = {
      id: '123',
      name: 'Test User',
      email: 'test@test.com',
      role: 'buyer'
    };
    const mockToken = 'fake-token-123';
    
    act(() => {
      result.current.login(mockUser, mockToken);
    });
    
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.token).toBe(mockToken);
    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorage.getItem('token')).toBe(mockToken);
    expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser));
    expect(api.defaults.headers.common['Authorization']).toBe(`Bearer ${mockToken}`);
  });

  it('logs out user successfully', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    // First login
    const mockUser = {
      id: '123',
      name: 'Test User',
      email: 'test@test.com',
      role: 'buyer'
    };
    const mockToken = 'fake-token-123';
    
    act(() => {
      result.current.login(mockUser, mockToken);
    });
    
    // Then logout
    act(() => {
      result.current.logout();
    });
    
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(api.defaults.headers.common['Authorization']).toBeUndefined();
  });

  it('updates user data', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    const mockUser = {
      id: '123',
      name: 'Test User',
      email: 'test@test.com',
      role: 'buyer'
    };
    
    act(() => {
      result.current.login(mockUser, 'fake-token');
    });
    
    const updatedUser = {
      ...mockUser,
      name: 'Updated Name'
    };
    
    act(() => {
      result.current.updateUser(updatedUser);
    });
    
    expect(result.current.user).toEqual(updatedUser);
    expect(localStorage.getItem('user')).toBe(JSON.stringify(updatedUser));
  });

  it('restores auth state from localStorage', () => {
    const mockUser = {
      id: '123',
      name: 'Test User',
      email: 'test@test.com',
      role: 'buyer'
    };
    const mockToken = 'fake-token-123';
    
    localStorage.setItem('token', mockToken);
    localStorage.setItem('user', JSON.stringify(mockUser));
    
    // Mock successful token validation
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: mockUser
      }
    });
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe(mockToken);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  it('restores auth state with user property instead of data', () => {
    const mockUser = {
      id: '456',
      name: 'Another User',
      email: 'another@test.com',
      role: 'seller'
    };
    const mockToken = 'fake-token-456';
    
    localStorage.setItem('token', mockToken);
    localStorage.setItem('user', JSON.stringify(mockUser));
    
    // Mock successful token validation with user property
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        user: mockUser
      }
    });
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe(mockToken);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  it('clears invalid token from localStorage', async () => {
    localStorage.setItem('token', 'invalid-token');
    localStorage.setItem('user', JSON.stringify({ id: '123' }));
    
    // Mock failed token validation
    api.get.mockRejectedValueOnce({
      response: { status: 401 }
    });
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  it('throws error when useAuth is used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');
    
    consoleSpy.mockRestore();
  });
});
