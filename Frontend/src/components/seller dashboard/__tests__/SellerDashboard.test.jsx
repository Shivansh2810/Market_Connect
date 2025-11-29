import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SellerDashboard from '../SellerDashboard';

const getMock = vi.fn();
const putMock = vi.fn();
const deleteMock = vi.fn();

vi.mock('../../../../services/axios', () => ({
  __esModule: true,
  default: {
    get: (...args) => getMock(...args),
    put: (...args) => putMock(...args),
    delete: (...args) => deleteMock(...args),
  },
}));

const useAuthMock = vi.fn();
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

const useProductsMock = vi.fn();
vi.mock('../../../contexts/ProductsContext', () => ({
  useProducts: () => useProductsMock(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../AddProduct', () => ({
  __esModule: true,
  default: ({ onBack, onSave, product }) => (
    <div data-testid="add-product-view">
      <span data-testid="editing-product">{product?.title ?? 'new product'}</span>
      <button type="button" onClick={() => onSave({ _id: product?._id || 'new' })}>
        save-product
      </button>
      <button type="button" onClick={onBack}>
        back-to-products
      </button>
    </div>
  ),
}));

vi.mock('../ReviewManagement', () => ({
  __esModule: true,
  default: ({ onBack, product }) => (
    <div data-testid="review-management-view">
      <span data-testid="review-product">{product?._id}</span>
      <button type="button" onClick={onBack}>
        back-to-reviews
      </button>
    </div>
  ),
}));

const renderDashboard = () => render(<SellerDashboard />);

const sellerUser = {
  id: 'seller123',
  email: 'seller@test.com',
  name: 'Seller Test',
};

const topProduct = {
  productId: 'prod-top',
  qtySold: 9,
  product: {
    title: 'Top Camera',
    price: 1200,
    images: [{ url: 'top.jpg' }],
  },
};

const ordersFixture = [
  {
    _id: 'order-1',
    buyer: { name: 'Buyer One' },
    orderItems: [{ quantity: 2 }],
    totalPrice: 3000,
    orderStatus: 'Order Placed',
    createdAt: '2024-02-01T00:00:00Z',
  },
  {
    _id: 'order-2',
    buyer: { email: 'buyer@two.com' },
    orderItems: [{ quantity: 1 }],
    totalPrice: 1500,
    orderStatus: 'Delivered',
    createdAt: '2024-03-01T00:00:00Z',
  },
];

const returnsFixture = [
  {
    _id: 'return-1',
    order: { _id: 'order-1', totalPrice: 500 },
    buyer: { name: 'Buyer One' },
    reason: 'Damaged item',
    description: 'Box crushed',
    refundAmount: 500,
    status: 'Requested',
    items: [{ name: 'Camera', quantity: 1, price: 500 }],
  },
  {
    _id: 'return-2',
    order: 'order-2',
    buyer: { email: 'buyer@two.com' },
    reason: 'Missing parts',
    refundAmount: 300,
    status: 'Rejected',
    rejectionReason: 'Outside policy',
  },
  {
    _id: 'return-3',
    order: 'order-3',
    buyer: { name: 'Buyer Three' },
    reason: 'Wrong size',
    refundAmount: 200,
    status: 'Completed',
  },
];

const sellerProductsResponse = {
  success: true,
  products: [
    {
      _id: 'product-1',
      title: 'Seller Laptop',
      price: 45000,
      stock: 4,
      categoryId: { name: 'Computers', _id: 'cat-1' },
      sellerId: { _id: 'seller123' },
      images: [{ url: 'laptop.jpg' }],
      ratingAvg: 4.8,
      ratingCount: 25,
      isDeleted: false,
    },
    {
      _id: 'product-2',
      title: 'Other Seller Phone',
      price: 15000,
      stock: 12,
      categoryId: { name: 'Mobiles', _id: 'cat-2' },
      sellerId: { _id: 'someone-else' },
      images: [{ url: 'phone.jpg' }],
      ratingAvg: 4,
      ratingCount: 10,
      isDeleted: false,
    },
    {
      _id: 'product-3',
      title: 'Deleted Item',
      price: 1000,
      stock: 1,
      categoryId: { name: 'Misc', _id: 'cat-3' },
      sellerId: 'seller123',
      isDeleted: true,
    },
  ],
};

const configureHappyPaths = () => {
  getMock.mockImplementation((url) => {
    if (url === '/seller/dashboard') {
      return Promise.resolve({
        data: {
          success: true,
          data: {
            totalRevenue: 100000,
            totalOrders: 200,
            totalProducts: 10,
            pendingReturns: 2,
            avgRating: 4.6,
            ratingCount: 80,
            topProducts: [topProduct],
          },
        },
      });
    }
    if (url.startsWith('/seller/my-sales')) {
      return Promise.resolve({
        data: { success: true, data: { orders: ordersFixture, currentPage: 1, totalPages: 2 } },
      });
    }
    if (url === '/seller/my-returns') {
      return Promise.resolve({ data: { success: true, data: returnsFixture } });
    }
    if (url === '/analytics/seller/salesreport') {
      return Promise.resolve({ data: { success: true, data: [{ _id: '2024-01-01', totalSales: 1000 }] } });
    }
    if (url === '/products') {
      return Promise.resolve({ data: sellerProductsResponse });
    }
    return Promise.resolve({ data: { success: true } });
  });

  putMock.mockResolvedValue({ data: { success: true } });
  deleteMock.mockResolvedValue({ data: { success: true } });
};

describe('SellerDashboard', () => {
  const logoutMock = vi.fn();
  const confirmSpy = vi.spyOn(window, 'confirm');
  const alertSpy = vi.spyOn(window, 'alert');

  beforeEach(() => {
    vi.clearAllMocks();
    configureHappyPaths();
    confirmSpy.mockReturnValue(true);
    alertSpy.mockImplementation(() => {});
    useAuthMock.mockReturnValue({ user: sellerUser, logout: logoutMock });
    useProductsMock.mockReturnValue({ categories: [{ _id: 'cat-1', name: 'Computers' }] });
  });

  afterEach(() => {
    delete window.__sellerDashboardTestHooks;
  });

  it('loads dashboard metrics and refreshes data', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Seller Dashboard')).toBeInTheDocument();
    });

    expect(screen.getByText(/Total Revenue/)).toBeInTheDocument();
    expect(screen.getAllByText(/Top Performing Products/)).toHaveLength(1);

    await userEvent.click(screen.getByRole('button', { name: /Refresh/i }));
    await waitFor(() => {
      expect(getMock).toHaveBeenCalledWith('/seller/dashboard');
    });
  });

  it('handles reviews navigation and logout', async () => {
    renderDashboard();
    await waitFor(() => screen.getByText('Seller Dashboard'));

    await userEvent.click(screen.getByText('Reviews'));
    await waitFor(() => screen.getByText('Customer Reviews'));

    const reviewButtons = screen.getAllByRole('button', { name: 'View Reviews' });
    await userEvent.click(reviewButtons[0]);

    await waitFor(() => screen.getByTestId('review-management-view'));
    await userEvent.click(screen.getByText('back-to-reviews'));
    expect(screen.getByText('Customer Reviews')).toBeInTheDocument();

    await userEvent.click(screen.getByTitle('Logout'));
    expect(logoutMock).toHaveBeenCalled();
  });
});
