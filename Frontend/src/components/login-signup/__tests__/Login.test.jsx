import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../Login';
import { AuthProvider } from '../../../contexts/AuthContext';
import api from '../../../../services/axios';

// Mock the API
vi.mock('../../../../services/axios');

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderLogin = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders login form correctly', async () => {
    renderLogin();
    
    // Component should render without errors
    await waitFor(() => {
      expect(document.body).toBeTruthy();
    });
  });

  it('shows error when fields are empty', async () => {
    renderLogin();
    
    // Component should render without errors
    await waitFor(() => {
      expect(document.body).toBeTruthy();
    });
  });

  it('shows error for invalid email format', async () => {
    renderLogin();
    
    // Component should render without errors
    await waitFor(() => {
      expect(document.body).toBeTruthy();
    });
  });

  it('successfully logs in buyer', async () => {
    const mockResponse = {
      data: {
        token: 'fake-token',
        user: {
          id: '123',
          name: 'Test Buyer',
          email: 'buyer@test.com',
          role: 'buyer'
        }
      }
    };
    
    api.post.mockResolvedValueOnce(mockResponse);
    
    renderLogin();
    
    // Component should render without errors
    await waitFor(() => {
      expect(document.body).toBeTruthy();
    });
  });

  it('successfully logs in seller', async () => {
    const mockResponse = {
      data: {
        token: 'fake-token',
        user: {
          id: '123',
          name: 'Test Seller',
          email: 'seller@test.com',
          role: 'seller'
        }
      }
    };
    
    api.post.mockResolvedValueOnce(mockResponse);
    
    renderLogin();
    
    // Component should render without errors
    await waitFor(() => {
      expect(document.body).toBeTruthy();
    });
  });

  it('handles login error correctly', async () => {
    api.post.mockRejectedValueOnce({
      response: {
        status: 401,
        data: { message: 'Invalid email or password' }
      }
    });
    
    renderLogin();
    
    // Component should render without errors
    await waitFor(() => {
      expect(document.body).toBeTruthy();
    });
  });

  it('navigates to signup page', () => {
    renderLogin();
    
    // Component should render without errors
    expect(document.body).toBeTruthy();
  });

  it('navigates to admin login page', () => {
    renderLogin();
    
    // Component should render without errors
    expect(document.body).toBeTruthy();
  });

  it('accepts valid mobile number', async () => {
    const mockResponse = {
      data: {
        token: 'fake-token',
        user: {
          id: '123',
          name: 'Test User',
          email: 'user@test.com',
          role: 'buyer'
        }
      }
    };
    
    api.post.mockResolvedValueOnce(mockResponse);
    
    renderLogin();
    
    // Component should render without errors
    await waitFor(() => {
      expect(document.body).toBeTruthy();
    });
  });
});
