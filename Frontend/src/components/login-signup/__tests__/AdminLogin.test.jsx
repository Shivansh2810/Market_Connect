import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminLogin from '../AdminLogin';
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
    
    expect(screen.getByText(/Admin Login/i)).toBeInTheDocument();
    expect(screen.getByText(/Access the administrative dashboard/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Admin Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Login as Admin/i })).toBeInTheDocument();
  });

  it('shows error when fields are empty', async () => {
    renderAdminLogin();
    
    const loginButton = screen.getByRole('button', { name: /Login as Admin/i });
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Email and password are required/i)).toBeInTheDocument();
    });
  });

  it('shows error for invalid email format', async () => {
    renderAdminLogin();
    
    const emailInput = screen.getByLabelText(/Admin Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const loginButton = screen.getByRole('button', { name: /Login as Admin/i });
    
    fireEvent.change(emailInput, { target: { value: 'invalidemail' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Enter a valid email address/i)).toBeInTheDocument();
    });
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
    
    const emailInput = screen.getByLabelText(/Admin Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const loginButton = screen.getByRole('button', { name: /Login as Admin/i });
    
    fireEvent.change(emailInput, { target: { value: 'admin@marketplace.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Admin123!' } });
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/users/admin/login', {
        email: 'admin@marketplace.com',
        password: 'Admin123!'
      });
      expect(mockNavigate).toHaveBeenCalledWith('/admin');
    });
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
    
    const emailInput = screen.getByLabelText(/Admin Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const loginButton = screen.getByRole('button', { name: /Login as Admin/i });
    
    fireEvent.change(emailInput, { target: { value: 'user@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Test123!' } });
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Access denied. Admin credentials required/i)).toBeInTheDocument();
    });
  });

  it('handles network error correctly', async () => {
    api.post.mockRejectedValueOnce({
      code: 'ERR_NETWORK',
      message: 'Network Error'
    });
    
    renderAdminLogin();
    
    const emailInput = screen.getByLabelText(/Admin Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const loginButton = screen.getByRole('button', { name: /Login as Admin/i });
    
    fireEvent.change(emailInput, { target: { value: 'admin@marketplace.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Admin123!' } });
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Cannot connect to server/i)).toBeInTheDocument();
    });
  });

  it('handles invalid credentials error', async () => {
    api.post.mockRejectedValueOnce({
      response: {
        status: 401,
        data: { message: 'Invalid admin credentials' }
      }
    });
    
    renderAdminLogin();
    
    const emailInput = screen.getByLabelText(/Admin Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const loginButton = screen.getByRole('button', { name: /Login as Admin/i });
    
    fireEvent.change(emailInput, { target: { value: 'admin@marketplace.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Invalid admin credentials/i)).toBeInTheDocument();
    });
  });

  it('navigates to user login', () => {
    renderAdminLogin();
    
    const userLoginLink = screen.getByText(/Go to User Login/i);
    fireEvent.click(userLoginLink);
    
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('disables button while loading', async () => {
    api.post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
    
    renderAdminLogin();
    
    const emailInput = screen.getByLabelText(/Admin Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const loginButton = screen.getByRole('button', { name: /Login as Admin/i });
    
    fireEvent.change(emailInput, { target: { value: 'admin@marketplace.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Admin123!' } });
    fireEvent.click(loginButton);
    
    expect(loginButton).toBeDisabled();
    expect(screen.getByText(/Logging in.../i)).toBeInTheDocument();
  });
});
