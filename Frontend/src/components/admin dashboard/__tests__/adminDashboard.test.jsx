import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminDashboard from '../adminDashboard';
import { AuthProvider } from '../../../contexts/AuthContext';
import * as categoryAPI from '../../../../services/category';
import * as couponAPI from '../../../../services/coupon';
import * as auctionAPI from '../../../../services/auction';

vi.mock('../../../../services/category');
vi.mock('../../../../services/coupon');
vi.mock('../../../../services/auction');
vi.mock('../../../../services/product');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockUser = {
  id: 'admin123',
  name: 'Test Admin',
  email: 'admin@test.com',
  role: 'admin'
};

const mockUseAuth = vi.fn();
vi.mock('../../../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../../../contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => mockUseAuth()
  };
});

const renderAdminDashboard = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <AdminDashboard />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('AdminDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      logout: vi.fn()
    });
    categoryAPI.getAllCategories.mockResolvedValue({ success: true, categories: [] });
    couponAPI.getAllCoupons.mockResolvedValue({ success: true, data: [] });
    auctionAPI.getActiveAuctions.mockResolvedValue({ success: true, data: [] });
  });

  it('renders admin dashboard header', async () => {
    renderAdminDashboard();
    
    await waitFor(() => {
      expect(screen.getByText(/Market Connect - Admin/i)).toBeInTheDocument();
    });
  });

  it('displays categories view by default', async () => {
    renderAdminDashboard();
    
    await waitFor(() => {
      expect(screen.getByText(/Category Management/i)).toBeInTheDocument();
    });
  });

  it('navigates to coupons view', async () => {
    renderAdminDashboard();
    
    await waitFor(() => {
      const couponsNav = screen.getByText('Coupons');
      fireEvent.click(couponsNav);
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Coupon Management/i)).toBeInTheDocument();
    });
  });

  it('navigates to auctions view', async () => {
    renderAdminDashboard();
    
    await waitFor(() => {
      const auctionsNav = screen.getByText('Auctions');
      fireEvent.click(auctionsNav);
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Auction Management/i)).toBeInTheDocument();
    });
  });

  it('opens category modal when add button clicked', async () => {
    renderAdminDashboard();
    
    await waitFor(() => {
      const addButton = screen.getByText(/Add Category/i);
      fireEvent.click(addButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Create Category/i)).toBeInTheDocument();
    });
  });

  it('handles logout', async () => {
    const mockLogout = vi.fn();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      logout: mockLogout
    });
    
    renderAdminDashboard();
    
    await waitFor(() => {
      const logoutButton = screen.getByTitle('Logout');
      fireEvent.click(logoutButton);
    });
    
    expect(mockLogout).toHaveBeenCalled();
  });
});
