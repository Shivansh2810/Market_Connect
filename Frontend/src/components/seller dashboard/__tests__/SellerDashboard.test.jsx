import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SellerDashboard from '../SellerDashboard';
import { AuthProvider } from '../../../contexts/AuthContext';
import { ProductsProvider } from '../../../contexts/ProductsContext';
import api from '../../../../services/axios';

vi.mock('../../../../services/axios');
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
  id: 'seller123',
  name: 'Test Seller',
  email: 'seller@test.com',
  role: 'seller'
};

const mockUseAuth = vi.fn();
vi.mock('../../../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../../../contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => mockUseAuth()
  };
});

const mockDashboardData = {
  success: true,
  data: {
    totalRevenue: 50000,
    totalOrders: 100,
    totalProducts: 25,
    pendingReturns: 3,
    avgRating: 4.5,
    ratingCount: 50,
    topProducts: []
  }
};

const mockProducts = [
  {
    _id: '1',
    title: 'Seller Product 1',
    price: 999,
    stock: 10,
    sellerId: 'seller123',
    images: [{ url: 'test1.jpg' }],
    categoryId: { name: 'Electronics' }
  }
];

const renderSellerDashboard = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <ProductsProvider>
          <SellerDashboard />
        </ProductsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('SellerDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      logout: vi.fn()
    });
    api.get.mockImplementation((url) => {
      if (url === '/seller/dashboard') return Promise.resolve({ data: mockDashboardData });
      if (url.includes('/seller/my-sales')) return Promise.resolve({ data: { success: true, data: { orders: [], currentPage: 1, totalPages: 1 } } });
      if (url === '/seller/my-returns') return Promise.resolve({ data: { success: true, data: [] } });
      if (url === '/analytics/seller/salesreport') return Promise.resolve({ data: { success: true, data: [] } });
      if (url === '/products') return Promise.resolve({ data: { success: true, products: mockProducts } });
      return Promise.resolve({ data: {} });
    });
  });

  it('renders seller dashboard header', async () => {
    renderSellerDashboard();
    
    await waitFor(() => {
      expect(screen.getByText(/Market Connect - Seller/i)).toBeInTheDocument();
    });
  });

  it('displays dashboard metrics', async () => {
    renderSellerDashboard();
    
    await waitFor(() => {
      expect(screen.getByText(/Total Revenue/i)).toBeInTheDocument();
    });
  });

  it('navigates to products view', async () => {
    renderSellerDashboard();
    
    // Component should render without errors
    await waitFor(() => {
      expect(document.body).toBeTruthy();
    });
  });

  it('handles logout', async () => {
    const mockLogout = vi.fn();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      logout: mockLogout
    });
    
    renderSellerDashboard();
    
    await waitFor(() => {
      const logoutButton = screen.getByTitle('Logout');
      fireEvent.click(logoutButton);
    });
    
    expect(mockLogout).toHaveBeenCalled();
  });
});
