import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BuyerDashboard from '../BuyerDashboard';
import { AuthProvider } from '../../../contexts/AuthContext';
import { ProductsProvider } from '../../../contexts/ProductsContext';
import { CartProvider } from '../../../contexts/CartContext';
import { AuctionProvider } from '../../../contexts/AuctionContext';
import * as productApi from '../../../../api/product';
import * as auctionApi from '../../../../api/auction';

vi.mock('../../../../api/product');
vi.mock('../../../../api/auction');
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    connected: true
  }))
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock products for testing - simulates API response
// In real app, these come from backend database
const mockProducts = [
  {
    _id: '1',
    title: 'Test Product 1',
    description: 'Test description',
    price: 999,
    stock: 10,
    images: [{ url: 'test1.jpg', isPrimary: true }],
    categoryId: { name: 'Electronics' },
    ratingAvg: 4.5,
    ratingCount: 10
  },
  {
    _id: '2',
    title: 'Test Product 2',
    description: 'Test description 2',
    price: 1999,
    stock: 5,
    images: [{ url: 'test2.jpg', isPrimary: true }],
    categoryId: { name: 'Clothing' },
    ratingAvg: 4.0,
    ratingCount: 5
  }
];

const renderDashboard = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <ProductsProvider>
          <CartProvider>
            <AuctionProvider>
              <BuyerDashboard />
            </AuctionProvider>
          </CartProvider>
        </ProductsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('BuyerDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    productApi.getAllProducts.mockResolvedValue({ success: true, products: mockProducts });
    productApi.getCategories.mockResolvedValue({ success: true, categories: [
      { _id: '1', name: 'Electronics' },
      { _id: '2', name: 'Clothing' }
    ]});
    auctionApi.getActiveAuctions.mockResolvedValue([]);
  });

  it('renders dashboard header correctly', async () => {
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText(/Market Connect/i)).toBeInTheDocument();
    });
  });

  it('displays product grid', async () => {
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      expect(screen.getByText('Test Product 2')).toBeInTheDocument();
    });
  });

  it('filters products by search term', async () => {
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    });
    
    const searchInput = screen.getByPlaceholderText(/Search for products/i);
    fireEvent.change(searchInput, { target: { value: 'Product 1' } });
    
    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Product 2')).not.toBeInTheDocument();
    });
  });

  it('filters products by category', async () => {
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    });
    
    const categorySelect = screen.getByRole('combobox', { name: /category/i });
    fireEvent.change(categorySelect, { target: { value: 'Electronics' } });
    
    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Product 2')).not.toBeInTheDocument();
    });
  });

  it('sorts products by price low to high', async () => {
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    });
    
    const sortSelect = screen.getByRole('combobox', { name: /sort by/i });
    fireEvent.change(sortSelect, { target: { value: 'price-low' } });
    
    // Products should be sorted by price
    const products = screen.getAllByRole('heading', { level: 4 });
    expect(products[0]).toHaveTextContent('Test Product 1'); // ₹999
  });

  it('opens cart drawer when cart button clicked', async () => {
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    });
    
    const cartButton = screen.getByTitle('Cart');
    fireEvent.click(cartButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Your Cart/i)).toBeInTheDocument();
    });
  });

  it('navigates to product detail page when product clicked', async () => {
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    });
    
    const productCard = screen.getByText('Test Product 1').closest('.product-card');
    fireEvent.click(productCard);
    
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/products/1');
  });

  it('shows loading state while fetching products', () => {
    productApi.getAllProducts.mockImplementation(() => new Promise(() => {}));
    
    renderDashboard();
    
    expect(screen.getByText(/Loading products/i)).toBeInTheDocument();
  });

  it('shows error state when product fetch fails', async () => {
    productApi.getAllProducts.mockRejectedValue(new Error('API Error'));
    
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText(/couldn't load products/i)).toBeInTheDocument();
    });
  });

  it('displays auction badge when auctions are available', async () => {
    auctionApi.getActiveAuctions.mockResolvedValue([
      { _id: '1', title: 'Auction 1' },
      { _id: '2', title: 'Auction 2' }
    ]);
    
    renderDashboard();
    
    await waitFor(() => {
      const auctionBadge = screen.getByText('2');
      expect(auctionBadge).toBeInTheDocument();
    });
  });

  it('navigates to become seller page', async () => {
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText(/Become a Seller/i)).toBeInTheDocument();
    });
    
    const becomeSellerLink = screen.getByText(/Become a Seller/i);
    fireEvent.click(becomeSellerLink);
    
    expect(mockNavigate).toHaveBeenCalledWith('/become-seller');
  });

  it('handles logout correctly', async () => {
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByTitle('Logout')).toBeInTheDocument();
    });
    
    const logoutButton = screen.getByTitle('Logout');
    fireEvent.click(logoutButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('displays empty state when no products available', async () => {
    // Mock empty products array
    productApi.getAllProducts.mockResolvedValue({ success: true, products: [] });
    
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText(/No products found/i)).toBeInTheDocument();
    });
  });

  it('displays products from API response', async () => {
    // This test verifies that the component correctly displays
    // products returned from the mocked API call
    renderDashboard();
    
    await waitFor(() => {
      // Verify API was called
      expect(productApi.getAllProducts).toHaveBeenCalled();
      
      // Verify products from mock response are displayed
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      expect(screen.getByText('Test Product 2')).toBeInTheDocument();
    });
  });
});
