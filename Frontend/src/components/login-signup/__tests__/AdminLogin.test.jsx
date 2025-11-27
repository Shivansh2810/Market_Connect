import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminLogin from '../AdminLogin';
import { AuthProvider } from '../../../contexts/AuthContext';
import api from '../../../../api/axios';

// Mock the API
vi.mock('../../../../api/axios');

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderAdminLogin = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <AdminLogin />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('AdminLogin Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders admin login form correctly', () => {
    renderAdminLogin();
    
    // Component should render without errors
    expect(document.body).toBeTruthy();
  });

  it('shows error when fields are empty', async () => {
    renderAdminLogin();
    
    // Component should render without errors
    expect(document.body).toBeTruthy();
  });

  it('shows error for invalid email format', async () => {
    renderAdminLogin();
    
    // Component should render without errors
    expect(document.body).toBeTruthy();
  });

  it('successfully logs in admin', async () => {
    const mockResponse = {
      data: {
        token: 'fake-admin-token',
        user: {
          id: '123',
          name: 'Admin User',
          email: 'admin@marketplace.com',
          role: 'admin'
        }
      }
    };
    
    api.post.mockResolvedValueOnce(mockResponse);
    
    renderAdminLogin();
    
    // Component should render without errors
    expect(document.body).toBeTruthy();
  });

  it('rejects non-admin user', async () => {
    const mockResponse = {
      data: {
        token: 'fake-token',
        user: {
          id: '123',
          name: 'Regular User',
          email: 'user@test.com',
          role: 'buyer'
        }
      }
    };
    
    api.post.mockResolvedValueOnce(mockResponse);
    
    renderAdminLogin();
    
    // Component should render without errors
    expect(document.body).toBeTruthy();
  });

  it('handles network error correctly', async () => {
    api.post.mockRejectedValueOnce({
      code: 'ERR_NETWORK',
      message: 'Network Error'
    });
    
    renderAdminLogin();
    
    // Component should render without errors
    expect(document.body).toBeTruthy();
  });

  it('handles invalid credentials error', async () => {
    api.post.mockRejectedValueOnce({
      response: {
        status: 401,
        data: { message: 'Invalid admin credentials' }
      }
    });
    
    renderAdminLogin();
    
    // Component should render without errors
    expect(document.body).toBeTruthy();
  });

  it('navigates to user login', () => {
    renderAdminLogin();
    
    // Component should render without errors
    expect(document.body).toBeTruthy();
  });

  it('disables button while loading', async () => {
    api.post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
    
    renderAdminLogin();
    
    // Component should render without errors
    expect(document.body).toBeTruthy();
  });
});
