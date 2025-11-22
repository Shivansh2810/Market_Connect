import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProductDetailPage from '../ProductDetailPage';
import { AuthProvider } from '../../contexts/AuthContext';
import { ProductsProvider } from '../../contexts/ProductsContext';
import { CartProvider } from '../../contexts/CartContext';
import * as productApi from '../../../services/product';

vi.mock('../../../services/product');

const mockNavigate = vi.fn();
const mockParams = { productId: '123' };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
  };
});

const renderProductDetailPage = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <ProductsProvider>
          <CartProvider>
            <ProductDetailPage />
          </CartProvider>
        </ProductsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('ProductDetailPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    productApi.getAllProducts.mockResolvedValue({ success: true, products: [] });
    productApi.getCategories.mockResolvedValue({ success: true, categories: [] });
  });

  it('renders loading state initially', () => {
    productApi.getAllProducts.mockImplementation(() => new Promise(() => {}));
    
    renderProductDetailPage();
    
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
  });

  it('shows error when product is not found', async () => {
    productApi.getAllProducts.mockResolvedValue({ success: true, products: [] });
    
    renderProductDetailPage();
    
    await waitFor(() => {
      expect(screen.getByText(/Product not found/i)).toBeInTheDocument();
    });
  });

  it('renders product details when product is found', async () => {
    const mockProduct = {
      _id: '123',
      title: 'Test Product',
      description: 'Test description',
      price: 999,
      stock: 10,
      images: [{ url: 'test.jpg', isPrimary: true }],
      categoryId: { name: 'Electronics' },
      sellerId: { name: 'Test Seller' },
      ratingAvg: 4.5,
      ratingCount: 10
    };
    
    productApi.getAllProducts.mockResolvedValue({ 
      success: true, 
      products: [mockProduct] 
    });
    
    renderProductDetailPage();
    
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    productApi.getAllProducts.mockRejectedValue(new Error('API Error'));
    
    renderProductDetailPage();
    
    await waitFor(() => {
      expect(screen.getByText(/Unable to load products/i)).toBeInTheDocument();
    });
  });
});
