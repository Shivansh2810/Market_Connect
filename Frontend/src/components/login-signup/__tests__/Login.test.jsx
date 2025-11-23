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

  it('renders login form correctly', () => {
    renderLogin();
    
    expect(screen.getByText(/Market Connect/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Email or Mobile Number/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
  });

  it('shows error when fields are empty', async () => {
    renderLogin();
    
    const loginButton = screen.getByRole('button', { name: /Login/i });
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Email and password are required/i)).toBeInTheDocument();
    });
  });

  it('shows error for invalid email format', async () => {
    renderLogin();
    
    const emailInput = screen.getByPlaceholderText(/Email or Mobile Number/i);
    const passwordInput = screen.getByPlaceholderText(/Password/i);
    const loginButton = screen.getByRole('button', { name: /Login/i });
    
    fireEvent.change(emailInput, { target: { value: 'invalidemail' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Enter valid Email or Mobile Number/i)).toBeInTheDocument();
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
    
    const emailInput = screen.getByPlaceholderText(/Email or Mobile Number/i);
    const passwordInput = screen.getByPlaceholderText(/Password/i);
    const loginButton = screen.getByRole('button', { name: /Login/i });
    
    fireEvent.change(emailInput, { target: { value: 'buyer@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Test123!' } });
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/users/login', {
        email: 'buyer@test.com',
        password: 'Test123!',
        role: 'buyer'
      });
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
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
    
    // Switch to seller tab
    const sellerTab = screen.getByText('Seller');
    fireEvent.click(sellerTab);
    
    const emailInput = screen.getByPlaceholderText(/Email or Mobile Number/i);
    const passwordInput = screen.getByPlaceholderText(/Password/i);
    const loginButton = screen.getByRole('button', { name: /Login/i });
    
    fireEvent.change(emailInput, { target: { value: 'seller@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Test123!' } });
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/users/login', {
        email: 'seller@test.com',
        password: 'Test123!',
        role: 'seller'
      });
      expect(mockNavigate).toHaveBeenCalledWith('/seller-dashboard');
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
    
    const emailInput = screen.getByPlaceholderText(/Email or Mobile Number/i);
    const passwordInput = screen.getByPlaceholderText(/Password/i);
    const loginButton = screen.getByRole('button', { name: /Login/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Invalid email or password/i)).toBeInTheDocument();
    });
  });

  it('navigates to signup page', () => {
    renderLogin();
    
    const signupLink = screen.getByText(/Signup/i);
    fireEvent.click(signupLink);
    
    expect(mockNavigate).toHaveBeenCalledWith('/signup');
  });

  it('navigates to admin login page', () => {
    renderLogin();
    
    const adminLink = screen.getByText(/Admin Login/i);
    fireEvent.click(adminLink);
    
    expect(mockNavigate).toHaveBeenCalledWith('/admin-login');
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
    
    const emailInput = screen.getByPlaceholderText(/Email or Mobile Number/i);
    const passwordInput = screen.getByPlaceholderText(/Password/i);
    const loginButton = screen.getByRole('button', { name: /Login/i });
    
    fireEvent.change(emailInput, { target: { value: '9876543210' } });
    fireEvent.change(passwordInput, { target: { value: 'Test123!' } });
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      expect(api.post).toHaveBeenCalled();
    });
  });
});
