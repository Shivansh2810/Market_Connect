import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockSendAssistantQuery = vi.fn();

vi.mock('../../../../services/assistant', () => ({
  __esModule: true,
  sendAssistantQuery: (...args) => mockSendAssistantQuery(...args),
}));

let authValue;
let productsValue;
let cartValue;
let auctionValue;

const mockLogout = vi.fn();
const mockRefresh = vi.fn();
const mockAddToCart = vi.fn();
const mockReplaceCartWith = vi.fn();
const mockUpdateQuantity = vi.fn();
const mockRemoveFromCart = vi.fn();

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => authValue,
}));

vi.mock('../../../contexts/ProductsContext', () => ({
  useProducts: () => productsValue,
}));

vi.mock('../../../contexts/CartContext', () => ({
  useCart: () => cartValue,
}));

vi.mock('../../../contexts/AuctionContext', () => ({
  useAuction: () => auctionValue,
}));

vi.mock('../../profile/Profile', () => ({
  __esModule: true,
  default: ({ onBack }) => (
    <div data-testid="profile-view">
      <p>Profile Stub</p>
      <button type="button" onClick={onBack}>
        Back to dashboard
      </button>
    </div>
  ),
}));

vi.mock('../../customerService/CustomerService', () => ({
  __esModule: true,
  default: ({ onBack }) => (
    <div data-testid="customer-service-view">
      <p>Customer Service Stub</p>
      <button type="button" onClick={onBack}>
        Close customer service
      </button>
    </div>
  ),
}));

vi.mock('@fortawesome/react-fontawesome', () => ({
  __esModule: true,
  FontAwesomeIcon: (props) => (
    <span data-testid="fa-icon" {...props}>
      icon
    </span>
  ),
}));

import BuyerDashboard from '../BuyerDashboard';

const defaultProducts = [
  {
    _id: 'prod-1',
    title: 'Camera',
    description: 'Great camera with lens kit',
    price: 5000,
    stock: 3,
    images: [
      { url: 'primary.jpg', isPrimary: true },
      { url: 'secondary.jpg', isPrimary: false },
    ],
    categoryId: { name: 'Electronics' },
    category: { name: 'Electronics' },
    ratingAvg: 4.5,
    ratingCount: 10,
    currency: 'INR',
  },
  {
    _id: 'prod-2',
    title: 'Jeans',
    description: 'Comfortable denim jeans',
    price: 1500,
    stock: 0,
    images: [],
    categoryId: { name: 'Clothing' },
    category: { name: 'Clothing' },
    ratingAvg: 3.3,
    ratingCount: 4,
    currency: 'INR',
  },
  {
    _id: 'prod-3',
    title: 'Laptop',
    description: 'Gaming laptop',
    price: 85000,
    stock: 8,
    images: [{ url: 'laptop.jpg', isPrimary: false }],
    categoryId: { name: 'Electronics' },
    category: { name: 'Electronics' },
    ratingAvg: 5,
    ratingCount: 20,
    currency: 'USD',
    isDeleted: true,
  },
];

const defaultCategories = [
  { _id: 'cat-1', name: 'Electronics' },
  { _id: 'cat-2', name: 'Clothing' },
  { _id: 'cat-3', title: 'Accessories' },
];

const defaultAuctionState = {
  auctions: [
    { _id: 'auction-1', title: 'Auction One' },
    { _id: 'auction-2', title: 'Auction Two' },
  ],
  upcomingAuctions: [
    { _id: 'auction-3', title: 'Auction Three' },
  ],
};

const defaultCartItems = [
  {
    productId: 'prod-1',
    quantity: 2,
    productDetails: {
      title: 'Camera',
      price: 5000,
      currency: 'INR',
      image: 'primary.jpg',
    },
  },
];

const renderDashboard = (overrides = {}) => {
  if (overrides.auth) {
    authValue = { ...authValue, ...overrides.auth };
  }
  if (overrides.products) {
    productsValue = { ...productsValue, ...overrides.products };
  }
  if (overrides.cart) {
    cartValue = { ...cartValue, ...overrides.cart };
  }
  if (overrides.auction) {
    auctionValue = { ...auctionValue, ...overrides.auction };
  }

  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <BuyerDashboard />
    </MemoryRouter>
  );
};

beforeEach(() => {
  vi.clearAllMocks();

  authValue = {
    logout: mockLogout,
    user: { role: 'buyer' },
    isAuthenticated: true,
  };

  productsValue = {
    products: defaultProducts,
    categories: defaultCategories,
    loading: false,
    error: '',
    refresh: mockRefresh,
  };

  cartValue = {
    items: [],
    addToCart: mockAddToCart,
    replaceCartWith: mockReplaceCartWith,
    updateQuantity: mockUpdateQuantity,
    removeFromCart: mockRemoveFromCart,
    itemCount: 0,
    totalAmount: 0,
  };

  auctionValue = { ...defaultAuctionState };
});

describe('BuyerDashboard', () => {
  it('renders products, applies filters, and handles sorting', async () => {
    const user = userEvent;
    renderDashboard();

    expect(screen.getByText('Market Connect')).toBeInTheDocument();
    expect(screen.getByText('Camera')).toBeInTheDocument();
    expect(screen.getByText('Jeans')).toBeInTheDocument();
    expect(screen.queryByText('Laptop')).not.toBeInTheDocument();
    expect(screen.getByText('Only 3 left!')).toBeInTheDocument();
    screen.getAllByRole('button', { name: 'Out of Stock' }).forEach((btn) => {
      expect(btn).toBeDisabled();
    });

    const searchInput = screen.getByPlaceholderText(/Search products/);
    user.clear(searchInput);
    user.type(searchInput, 'Jeans');
    expect(screen.getByText('Jeans')).toBeInTheDocument();
    expect(screen.queryByText('Camera')).not.toBeInTheDocument();

    user.clear(searchInput);
    expect(screen.getByText('Camera')).toBeInTheDocument();

    const selects = document.querySelectorAll('.filters-section select');
    const categorySelect = selects[0];
    const sortSelect = selects[1];
    const priceSelect = selects[2];

    user.selectOptions(categorySelect, 'Electronics');
    expect(screen.getByText('Camera')).toBeInTheDocument();
    expect(screen.queryByText('Jeans')).not.toBeInTheDocument();

    user.selectOptions(categorySelect, 'All');
    expect(screen.getByText('Jeans')).toBeInTheDocument();

    user.selectOptions(priceSelect, '1000-2000');
    expect(screen.getByText('Jeans')).toBeInTheDocument();
    expect(screen.queryByText('Camera')).not.toBeInTheDocument();

    user.selectOptions(priceSelect, 'none');
    expect(screen.getByText('Camera')).toBeInTheDocument();

    user.selectOptions(sortSelect, 'price-low');
    user.selectOptions(sortSelect, 'price-high');
    user.selectOptions(sortSelect, 'rating');
    user.selectOptions(sortSelect, 'popularity');

    const cameraCard = screen.getByText('Camera').closest('.product-card');
    expect(cameraCard).not.toBeNull();
    const priceNode = within(cameraCard).getByText('₹5000');
    expect(priceNode).toBeInTheDocument();
    const image = within(cameraCard).getByRole('img');
    expect(image).toHaveAttribute('src', 'primary.jpg');

    const jeansCard = screen.getByText('Jeans').closest('.product-card');
    expect(jeansCard).not.toBeNull();
    const jeansImg = within(jeansCard).getByRole('img');
    expect(jeansImg).toHaveAttribute('src', 'https://via.placeholder.com/300?text=Market+Connect');
  });

  it('handles navigation, cart actions, and checkout for authenticated users', async () => {
    const user = userEvent;
    renderDashboard({ cart: { items: defaultCartItems, itemCount: 2, totalAmount: 10000 } });

    user.click(screen.getByRole('button', { name: 'Add to Cart' }));
    expect(mockAddToCart).toHaveBeenCalledWith(defaultProducts[0], 1);
    expect(document.querySelector('.cart-drawer.open')).not.toBeNull();

    user.click(screen.getByRole('button', { name: 'Buy Now' }));
    expect(mockReplaceCartWith).toHaveBeenCalledWith(defaultProducts[0], 1);
    expect(mockNavigate).toHaveBeenCalledWith('/checkout');
    mockNavigate.mockClear();

    const overlay = document.querySelector('.cart-drawer-overlay');
    expect(overlay).not.toBeNull();
    user.click(overlay);
    expect(document.querySelector('.cart-drawer.open')).toBeNull();

    user.click(screen.getByTitle('Cart'));
    expect(document.querySelector('.cart-drawer.open')).not.toBeNull();

    const cartItem = screen.getByText('Camera', { selector: '.cart-item-title' }).closest('.cart-item-drawer');
    expect(cartItem).not.toBeNull();

    const minusBtn = within(cartItem).getByRole('button', { name: '-' });
    const plusBtn = within(cartItem).getByRole('button', { name: '+' });
    user.click(minusBtn);
    expect(mockUpdateQuantity).toHaveBeenCalledWith('prod-1', 1);
    user.click(plusBtn);
    expect(mockUpdateQuantity).toHaveBeenCalledWith('prod-1', 3);
    user.click(within(cartItem).getByRole('button', { name: 'Remove' }));
    expect(mockRemoveFromCart).toHaveBeenCalledWith('prod-1');

    user.click(screen.getByRole('button', { name: 'Proceed to Checkout' }));
    expect(mockNavigate).toHaveBeenCalledWith('/checkout');

    const closeBtn = document.querySelector('.cart-close-btn');
    expect(closeBtn).not.toBeNull();
    user.click(closeBtn);
    expect(document.querySelector('.cart-drawer.open')).toBeNull();

    user.click(screen.getByRole('heading', { level: 4, name: 'Camera' }));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/products/prod-1');

    mockNavigate.mockClear();
    user.click(screen.getByTitle('Logout'));
    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('renders cart empty state for authenticated user with no items', async () => {
    const user = userEvent;
    renderDashboard();

    user.click(screen.getByTitle('Cart'));
    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    user.click(screen.getByRole('button', { name: 'Continue Shopping' }));
    expect(document.querySelector('.cart-drawer.open')).toBeNull();
  });

  it('shows guest cart prompt and requires auth for protected actions', async () => {
    const user = userEvent;
    renderDashboard({ auth: { isAuthenticated: false, user: { role: 'guest' } } });

    user.click(screen.getByTitle('Cart'));
    expect(screen.getByText('Please log in')).toBeInTheDocument();
    user.click(screen.getByRole('button', { name: 'Login / Register' }));
    expect(mockNavigate).toHaveBeenCalledWith('/login', expect.objectContaining({ state: expect.anything() }));

    mockNavigate.mockClear();
    user.click(screen.getByText('Live Auctions'));
    expect(mockNavigate).toHaveBeenCalledWith('/login', expect.objectContaining({ state: expect.anything() }));

    mockNavigate.mockClear();
    user.click(screen.getByRole('button', { name: 'Add to Cart' }));
    expect(mockNavigate).toHaveBeenCalledWith('/login', expect.objectContaining({ state: expect.anything() }));

    mockNavigate.mockClear();
    user.click(screen.getByRole('button', { name: 'Buy Now' }));
    expect(mockNavigate).toHaveBeenCalledWith('/login', expect.objectContaining({ state: expect.anything() }));
  });

  it('renders loading state', () => {
    renderDashboard({ products: { loading: true } });
    expect(screen.getByText('Loading products...')).toBeInTheDocument();
  });

  it('renders error state and handles actions', async () => {
    const user = userEvent;
    renderDashboard({ products: { loading: false, error: 'Network issue' } });
    expect(screen.getByText('We couldn’t load products')).toBeInTheDocument();
    user.click(screen.getByRole('button', { name: 'Try Again' }));
    expect(mockRefresh).toHaveBeenCalled();
    user.click(screen.getByRole('button', { name: 'Logout' }));
    expect(mockLogout).toHaveBeenCalled();
  });

  it('toggles profile view and customer service view', async () => {
    const user = userEvent;
    renderDashboard();

    user.click(screen.getByTitle('View Profile'));
    expect(screen.getByTestId('profile-view')).toBeInTheDocument();
    user.click(screen.getByRole('button', { name: 'Back to dashboard' }));
    expect(screen.queryByTestId('profile-view')).not.toBeInTheDocument();

    user.click(screen.getByTitle('Need help? Chat with us!'));
    expect(screen.getByTestId('customer-service-view')).toBeInTheDocument();
    user.click(screen.getByRole('button', { name: 'Close customer service' }));
    expect(screen.queryByTestId('customer-service-view')).not.toBeInTheDocument();
  });

  it('handles assistant search success, fallback mapping, clearing, and errors', async () => {
    const user = userEvent;
    renderDashboard();

    const searchInput = screen.getByPlaceholderText(/Search products/);
    user.clear(searchInput);
    user.type(searchInput, 'camera');
    expect(searchInput).toHaveValue('camera');

    const promiseControl = {};
    mockSendAssistantQuery.mockImplementation(() => new Promise((resolve) => {
      promiseControl.resolve = resolve;
    }));

    const assistantButton = screen.getByTitle(/AI Smart Search/i);
    expect(assistantButton).not.toBeDisabled();
    user.click(assistantButton);
    expect(mockSendAssistantQuery).toHaveBeenCalledWith({
      message: 'camera',
      sessionId: expect.stringMatching(/^shop_assistant_/),
    });
    expect(screen.getByText(/AI is analyzing/)).toBeInTheDocument();

    user.type(searchInput, '{Enter}');
    expect(mockSendAssistantQuery).toHaveBeenCalledTimes(1);

    promiseControl.resolve({
      products: [
        { id: 'prod-1' },
        {
          _id: 'external-1',
          name: 'Assistant Product',
          description: 'Suggested by assistant',
          price: 999,
          category: 'Gadgets',
          rating: 4.7,
          reviewCount: 3,
          image_url: 'assistant.jpg',
        },
      ],
    });

    await screen.findByText('AI-powered results');
    expect(screen.getByText('Smart Search Results')).toBeInTheDocument();
    expect(screen.getByText('Assistant Product')).toBeInTheDocument();
    expect(screen.getAllByText('Camera').length).toBeGreaterThan(0);

    user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.queryByText('Smart Search Results')).not.toBeInTheDocument();

    mockSendAssistantQuery.mockResolvedValue({ products: [] });
    user.type(searchInput, 'no results');
    user.click(assistantButton);
    await screen.findByText('No products found. Try different keywords.');

    mockSendAssistantQuery.mockRejectedValue(new Error('Service down'));
    user.type(searchInput, 'failure');
    user.click(assistantButton);
    await screen.findByText('Smart search failed. Try regular search instead.');
  });

  it('computes auction badge count, seller visibility, and mobile menu toggle', async () => {
    const user = userEvent;
    const firstRender = renderDashboard();

    expect(screen.getByText('Become a Seller')).toBeInTheDocument();
    const auctionBadge = document.querySelector('.auction-badge');
    expect(auctionBadge).not.toBeNull();
    expect(auctionBadge?.textContent).toBe('3');

    const becomeSellerItem = screen.getByText('Become a Seller').closest('.nav-item');
    expect(becomeSellerItem).not.toBeNull();
    user.click(becomeSellerItem);
    expect(mockNavigate).toHaveBeenCalledWith('/become-seller');
    mockNavigate.mockClear();

    const sidebar = document.querySelector('.sidebar');
    expect(sidebar?.classList.contains('mobile-open')).toBe(false);
    const menuButton = document.querySelector('.mobile-menu-btn');
    expect(menuButton).not.toBeNull();
    user.click(menuButton);
    expect(sidebar?.classList.contains('mobile-open')).toBe(true);
    user.click(menuButton);
    expect(sidebar?.classList.contains('mobile-open')).toBe(false);

    firstRender.unmount();

    const sellerRender = renderDashboard({ auth: { user: { role: 'seller' } } });
    expect(screen.queryByText('Become a Seller')).not.toBeInTheDocument();
    sellerRender.unmount();

    const bothRender = renderDashboard({ auth: { user: { role: 'both' } } });
    expect(screen.queryByText('Become a Seller')).not.toBeInTheDocument();
    bothRender.unmount();

    const badgeShouldHide = renderDashboard({ auction: { auctions: [], upcomingAuctions: [] } });
    expect(document.querySelector('.auction-badge')).toBeNull();
    badgeShouldHide.unmount();
  });

  it('resets filters when dashboard nav item clicked', async () => {
    const user = userEvent;
    renderDashboard();

    const searchInput = screen.getByPlaceholderText(/Search products/);
    user.clear(searchInput);
    user.type(searchInput, 'Jeans');
    const selects = document.querySelectorAll('.filters-section select');
    const categorySelect = selects[0];
    user.selectOptions(categorySelect, 'Electronics');

    user.click(screen.getByText('Dashboard'));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    expect(searchInput).toHaveValue('');
    expect(categorySelect).toHaveValue('All');
    expect(screen.getByText('Camera')).toBeInTheDocument();
    expect(screen.getByText('Jeans')).toBeInTheDocument();
  });
});
