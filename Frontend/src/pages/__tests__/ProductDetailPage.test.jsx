import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductDetailPage from '../ProductDetailPage';

const mockNavigate = vi.fn();
let currentProductId = '123';
const currentLocation = { pathname: '/products/123', search: '', hash: '', state: null, key: 'test' };

const useAuthMock = vi.fn();
const useProductsMock = vi.fn();
const useCartMock = vi.fn();
const fetchProductByIdMock = vi.fn();
const apiGetMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ productId: currentProductId }),
    useLocation: () => currentLocation,
  };
});

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('../../contexts/ProductsContext', () => ({
  useProducts: () => useProductsMock(),
}));

vi.mock('../../contexts/CartContext', () => ({
  useCart: () => useCartMock(),
}));

vi.mock('../../../services/product', () => ({
  getProductById: (...args) => fetchProductByIdMock(...args),
}));

vi.mock('../../components/buyer dashboard/ProductDetail', () => ({
  __esModule: true,
  default: ({ product, reviews, onBack, onAddToCart, onBuyNow }) => (
    <div>
      <div data-testid="product-title">{product?.title}</div>
      <div data-testid="reviews-count">{reviews?.length ?? 0}</div>
      <button type="button" onClick={onBack}>
        back
      </button>
      <button type="button" onClick={() => onAddToCart(product, 2)}>
        add
      </button>
      <button type="button" onClick={() => onBuyNow(product, 1)}>
        buy
      </button>
    </div>
  ),
}));

vi.mock('../../../services/axios', () => ({
  __esModule: true,
  default: {
    get: (...args) => apiGetMock(...args),
  },
}));

const renderPage = () => render(<ProductDetailPage />);

describe('ProductDetailPage', () => {
  let addToCartMock;
  let replaceCartWithMock;

  beforeEach(() => {
    vi.clearAllMocks();
    currentProductId = '123';
    addToCartMock = vi.fn();
    replaceCartWithMock = vi.fn();

    useAuthMock.mockReturnValue({ isAuthenticated: true });
    useProductsMock.mockReturnValue({ loading: false });
    useCartMock.mockReturnValue({
      addToCart: addToCartMock,
      replaceCartWith: replaceCartWithMock,
    });

    fetchProductByIdMock.mockResolvedValue({
      success: true,
      product: {
        _id: '123',
        title: 'Default Product',
      },
    });

    apiGetMock.mockResolvedValue({
      data: { success: true, data: [{ _id: 'r1' }] },
    });
  });

  it('shows loading state while data is fetched', () => {
    fetchProductByIdMock.mockImplementation(() => new Promise(() => {}));

    renderPage();

    expect(screen.getByText('Loading product...')).toBeInTheDocument();
    expect(screen.getByText(/Please wait/i)).toBeInTheDocument();
  });

  it('returns early when no product id is provided', async () => {
    currentProductId = undefined;

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Product Not Found')).toBeInTheDocument();
      expect(screen.getByText('No product ID provided.')).toBeInTheDocument();
    });
    expect(fetchProductByIdMock).not.toHaveBeenCalled();
  });

  it('renders product details and allows interactions when authenticated', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('product-title')).toHaveTextContent('Default Product');
      expect(screen.getByTestId('reviews-count')).toHaveTextContent('1');
    });

    await userEvent.click(screen.getByText('back'));
    expect(mockNavigate).toHaveBeenCalledWith(-1);

    await userEvent.click(screen.getByText('add'));
    expect(addToCartMock).toHaveBeenCalledWith(
      expect.objectContaining({ _id: '123' }),
      2,
    );

    await userEvent.click(screen.getByText('buy'));
    expect(replaceCartWithMock).toHaveBeenCalledWith(
      expect.objectContaining({ _id: '123' }),
      1,
    );
    expect(mockNavigate).toHaveBeenCalledWith('/checkout');
  });

  it('redirects unauthenticated users to login when performing protected actions', async () => {
    useAuthMock.mockReturnValue({ isAuthenticated: false });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('product-title')).toHaveTextContent('Default Product');
    });

    await userEvent.click(screen.getByText('add'));
    expect(addToCartMock).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login', { state: { from: currentLocation } });
  });

  it('accepts product payloads nested inside data property', async () => {
    fetchProductByIdMock.mockResolvedValueOnce({
      data: { product: { _id: '123', title: 'Nested Product' } },
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('product-title')).toHaveTextContent('Nested Product');
    });
  });

  it('accepts product payloads returned at top-level product key', async () => {
    fetchProductByIdMock.mockResolvedValueOnce({
      product: { _id: '123', title: 'Direct Product' },
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('product-title')).toHaveTextContent('Direct Product');
    });
  });

  it('accepts raw product documents', async () => {
    fetchProductByIdMock.mockResolvedValueOnce({
      _id: '123',
      title: 'Raw Product',
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('product-title')).toHaveTextContent('Raw Product');
    });
  });

  it('falls back to empty reviews when review endpoint fails validation', async () => {
    apiGetMock.mockResolvedValueOnce({ data: { success: false } });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('reviews-count')).toHaveTextContent('0');
    });
  });

  it('surface backend error messages when fetchProductById rejects', async () => {
    const error = new Error('Boom');
    error.response = { data: { message: 'From API' } };
    fetchProductByIdMock.mockRejectedValueOnce(error);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Product Not Found')).toBeInTheDocument();
      expect(screen.getByText('From API')).toBeInTheDocument();
    });
  });

  it('handles missing product payload by showing fallback error', async () => {
    fetchProductByIdMock.mockResolvedValueOnce({});

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Unable to load product. Please try again.')).toBeInTheDocument();
    });

    mockNavigate.mockClear();
    await userEvent.click(screen.getByRole('button', { name: 'Back to Dashboard' }));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('handles review endpoint failures gracefully', async () => {
    apiGetMock.mockRejectedValueOnce(new Error('Network down'));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Unable to load product. Please try again.')).toBeInTheDocument();
    });
  });
});
