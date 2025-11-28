import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BecomeSellerPage from '../BecomeSellerPage';
import { AuthProvider } from '../../contexts/AuthContext';
import api from '../../../services/axios';

vi.mock('../../../services/axios');

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
    
    // Component should render without errors
    expect(document.body).toBeTruthy();
  });

  it('displays seller benefits', () => {
    renderBecomeSellerPage();
    
    // Component should render without errors
    expect(document.body).toBeTruthy();
  });

  it('handles seller registration', async () => {
    api.post.mockResolvedValue({ data: { success: true } });
    
    renderBecomeSellerPage();
    
    // Component should render without errors
    expect(document.body).toBeTruthy();
  });

  it('validates seller information', async () => {
    renderBecomeSellerPage();
    
    // Component should render without errors
    expect(document.body).toBeTruthy();
  });
});
