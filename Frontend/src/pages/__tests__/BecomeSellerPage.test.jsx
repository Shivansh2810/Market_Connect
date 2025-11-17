import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BecomeSellerPage from '../BecomeSellerPage';
import { AuthProvider } from '../../contexts/AuthContext';
import api from '../../../api/axios';

vi.mock('../../../api/axios');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockUser = {
  id: '123',
  name: 'Test User',
  email: 'test@test.com',
  role: 'buyer'
};

const mockUseAuth = vi.fn();
vi.mock('../../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../../contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => mockUseAuth()
  };
});

const renderBecomeSellerPage = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <BecomeSellerPage />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('BecomeSellerPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      updateUser: vi.fn()
    });
  });

  it('renders become seller page', () => {
    renderBecomeSellerPage();
    
    expect(screen.getByText(/Become a Seller/i)).toBeInTheDocument();
  });

  it('displays seller benefits', () => {
    renderBecomeSellerPage();
    
    expect(screen.getByText(/Start Selling/i)).toBeInTheDocument();
  });

  it('handles seller registration', async () => {
    api.post.mockResolvedValue({ data: { success: true } });
    
    renderBecomeSellerPage();
    
    const registerButton = screen.getByText(/Register as Seller/i);
    fireEvent.click(registerButton);
    
    await waitFor(() => {
      expect(api.post).toHaveBeenCalled();
    });
  });

  it('validates seller information', async () => {
    renderBecomeSellerPage();
    
    const businessNameInput = screen.getByPlaceholderText(/Business Name/i);
    fireEvent.change(businessNameInput, { target: { value: '' } });
    
    const submitButton = screen.getByText(/Submit/i);
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/required/i)).toBeInTheDocument();
    });
  });
});
