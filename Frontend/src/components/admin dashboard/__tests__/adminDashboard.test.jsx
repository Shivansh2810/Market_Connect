import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import AdminDashboard from '../adminDashboard';
import * as categoryAPI from '../../../../services/category';
import * as couponAPI from '../../../../services/coupon';
import * as auctionAPI from '../../../../services/auction';
import * as productAPI from '../../../../services/product';

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

const defaultCategory = {
  _id: 'cat1',
  name: 'Electronics',
  slug: 'electronics',
  parentId: null
};

const childCategory = {
  _id: 'cat2',
  name: 'Mobiles',
  slug: 'mobiles',
  parentId: 'cat1'
};

const defaultCoupon = {
  _id: 'coupon1',
  code: 'SAVE20',
  description: '20% off',
  discountAmount: 20,
  minOrderValue: 100,
  validUntil: '2025-12-31T00:00:00.000Z',
  usageLimit: 10,
  usedCount: 2,
  isActive: true,
  applicableCategories: ['cat1']
};

const defaultAuction = {
  _id: 'auction1',
  title: 'Vintage Camera',
  auctionDetails: {
    startPrice: 5000,
    currentBid: 5500,
    startTime: '2025-12-01T10:00:00.000Z',
    endTime: '2025-12-01T12:00:00.000Z',
    status: 'Active',
    bidHistory: [{ bidder: 'user1', amount: 5200 }]
  }
};

const availableProduct = {
  _id: 'prod1',
  title: 'Smartphone',
  price: 999,
  stock: 5,
  isAuction: false
};

const renderAdminDashboard = () =>
  render(
    <BrowserRouter>
      <AdminDashboard />
    </BrowserRouter>
  );

describe('AdminDashboard Component', () => {
  let alertSpy;
  let confirmSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      logout: vi.fn()
    });
    categoryAPI.getAllCategories.mockResolvedValue({ success: true, categories: [defaultCategory, childCategory] });
    couponAPI.getAllCoupons.mockResolvedValue({ success: true, data: [defaultCoupon] });
    auctionAPI.getActiveAuctions.mockResolvedValue({ success: true, data: [defaultAuction] });
    productAPI.getAllProducts.mockResolvedValue({ success: true, products: [availableProduct] });
    categoryAPI.createCategory = vi.fn().mockResolvedValue({ success: true });
    categoryAPI.updateCategory = vi.fn().mockResolvedValue({ success: true });
    categoryAPI.deleteCategory = vi.fn().mockResolvedValue({ success: true });
    couponAPI.createCoupon = vi.fn().mockResolvedValue({ success: true });
    couponAPI.updateCoupon = vi.fn().mockResolvedValue({ success: true });
    couponAPI.deleteCoupon = vi.fn().mockResolvedValue({ success: true });
    auctionAPI.createAuction = vi.fn().mockResolvedValue({ success: true });
    auctionAPI.cancelAuction = vi.fn().mockResolvedValue({ success: true });
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
    confirmSpy.mockRestore();
    consoleErrorSpy.mockRestore();
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
    fireEvent.click(await screen.findByText('Coupons'));

    await waitFor(() => {
      expect(screen.getByText(/Coupon Management/i)).toBeInTheDocument();
    });
  });

  it('shows coupon details and opens edit modal', async () => {
    renderAdminDashboard();

    fireEvent.click(await screen.findByText('Coupons'));

    const couponRow = (await screen.findByText('SAVE20')).closest('tr');
    const editButton = within(couponRow).getAllByRole('button')[0];
    fireEvent.click(editButton);

    const modalHeader = await screen.findByText(/Edit Coupon/i);
    const modal = modalHeader.closest('.modal-content');

    const codeInput = within(modal).getByPlaceholderText(/e.g., SAVE20/i);
    await userEvent.clear(codeInput);
    await userEvent.type(codeInput, 'updated');

    const saveButton = within(modal).getByRole('button', { name: /Save/i });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(couponAPI.updateCoupon).toHaveBeenCalledWith(
        'coupon1',
        expect.objectContaining({ code: 'UPDATED' })
      );
    });
  });

  it('navigates to auctions view', async () => {
    renderAdminDashboard();

    fireEvent.click(await screen.findByText('Auctions'));

    await waitFor(() => {
      expect(screen.getByText(/Auction Management/i)).toBeInTheDocument();
    });
  });

  it('displays auction table and cancels auction when confirmed', async () => {
    renderAdminDashboard();

    fireEvent.click(await screen.findByText('Auctions'));

    await waitFor(() => expect(screen.getByText(/Vintage Camera/i)).toBeInTheDocument());

    fireEvent.click(await screen.findByTitle('Cancel Auction'));

    await waitFor(() => {
      expect(auctionAPI.cancelAuction).toHaveBeenCalledWith('auction1');
    });
  });

  it('opens category modal when add button clicked', async () => {
    renderAdminDashboard();
    
    fireEvent.click(await screen.findByText(/Add Category/i));

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

  it('saves a new category after validation passes', async () => {
    renderAdminDashboard();

    await waitFor(() => {
      fireEvent.click(screen.getByText(/Add Category/i));
    });

    const nameInput = screen.getByPlaceholderText(/Enter category name/i);
    const slugInput = screen.getByPlaceholderText(/Enter URL slug/i);

    await userEvent.type(nameInput, 'Accessories');
    await userEvent.type(slugInput, 'accessories');

    await userEvent.click(screen.getByRole('button', { name: /Save/i }));

    await waitFor(() => {
      expect(categoryAPI.createCategory).toHaveBeenCalledWith({
        name: 'Accessories',
        slug: 'accessories',
        parentId: null
      });
    });
  });

  it('shows validation alerts when category form incomplete', async () => {
    renderAdminDashboard();

    fireEvent.click(await screen.findByText(/Add Category/i));

    await userEvent.click(screen.getByRole('button', { name: /Save/i }));
    expect(alertSpy).toHaveBeenCalledWith('Category name is required');
    alertSpy.mockClear();

    const nameInput = screen.getByPlaceholderText(/Enter category name/i);
    await userEvent.type(nameInput, 'Accessories');
    await userEvent.click(screen.getByRole('button', { name: /Save/i }));
    expect(alertSpy).toHaveBeenCalledWith('Slug is required');
  });

  it('edits and deletes category with confirmation', async () => {
    renderAdminDashboard();

    await screen.findByText('Mobiles');

    const categoryRow = screen.getByText('Mobiles').closest('tr');
    const editButton = within(categoryRow).getAllByRole('button')[0];
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByText(/Edit Category/i)).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /Save/i }));

    await waitFor(() => {
      expect(categoryAPI.updateCategory).toHaveBeenCalledWith('cat2', expect.objectContaining({ slug: 'mobiles' }));
    });

    const deleteButton = within(categoryRow).getAllByRole('button')[1];
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(categoryAPI.deleteCategory).toHaveBeenCalledWith('cat2');
    });
  });

  it('creates and deletes coupon from modal', async () => {
    renderAdminDashboard();

    fireEvent.click(await screen.findByText('Coupons'));
    fireEvent.click(await screen.findByText(/Add Coupon/i));

    const couponModalHeader = await screen.findByText(/Create Coupon/i);
    const couponModal = couponModalHeader.closest('.modal-content');

    const codeInput = within(couponModal).getByPlaceholderText(/e.g., SAVE20/i);
    const discountInput = within(couponModal).getByPlaceholderText(/e.g., 100/i);
    const validUntil = couponModal.querySelector('input[type="date"]');

    await userEvent.clear(codeInput);
    await userEvent.type(codeInput, 'newdeal');
    fireEvent.change(discountInput, { target: { value: '50' } });
    fireEvent.change(validUntil, { target: { value: '2025-12-31' } });

    const saveButton = within(couponModal).getByRole('button', { name: /Save/i });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(couponAPI.createCoupon).toHaveBeenCalledWith(expect.objectContaining({ code: 'NEWDEAL' }));
    });

    confirmSpy.mockReturnValueOnce(false);
    fireEvent.click(await screen.findByText('Coupons'));
    const couponRow = screen.getByText('SAVE20').closest('tr');
    const couponDeleteButton = within(couponRow).getAllByRole('button')[1];
    fireEvent.click(couponDeleteButton);
    expect(couponAPI.deleteCoupon).not.toHaveBeenCalled();

    confirmSpy.mockReturnValueOnce(true);
    fireEvent.click(couponDeleteButton);
    await waitFor(() => {
      expect(couponAPI.deleteCoupon).toHaveBeenCalledWith('coupon1');
    });
  });

  it('validates coupon fields before saving', async () => {
    renderAdminDashboard();

    fireEvent.click(await screen.findByText('Coupons'));
    fireEvent.click(await screen.findByText(/Add Coupon/i));

    const couponModalHeader = await screen.findByText(/Create Coupon/i);
    const couponModal = couponModalHeader.closest('.modal-content');

    const saveButton = within(couponModal).getByRole('button', { name: /Save/i });

    await userEvent.click(saveButton);
    expect(alertSpy).toHaveBeenCalledWith('Coupon code is required');
    alertSpy.mockClear();

    const codeInput = within(couponModal).getByPlaceholderText(/e.g., SAVE20/i);
    await userEvent.type(codeInput, 'code');
    await userEvent.click(saveButton);
    expect(alertSpy).toHaveBeenCalledWith('Discount amount must be greater than 0');
    alertSpy.mockClear();

    const discountInput = within(couponModal).getByPlaceholderText(/e.g., 100/i);
    fireEvent.change(discountInput, { target: { value: '10' } });
    await userEvent.click(saveButton);
    expect(alertSpy).toHaveBeenCalledWith('Valid until date is required');
  });

  it('creates auction when form is valid', async () => {
    renderAdminDashboard();

    fireEvent.click(await screen.findByText('Auctions'));
    const openModalButton = screen
      .getAllByRole('button', { name: /Create Auction/i })
      .find((btn) => btn.classList.contains('btn-white'));
    fireEvent.click(openModalButton);

    const modalHeader = await screen.findByText(/Create Auction/i, { selector: 'h3' });
    const modal = modalHeader.closest('.modal-content');

    const productSelect = within(modal).getByRole('combobox');
    await userEvent.selectOptions(productSelect, ['prod1']);

    const priceInput = within(modal).getByRole('spinbutton');
    fireEvent.change(priceInput, { target: { value: '1500' } });

    const [startInput, endInput] = modal.querySelectorAll('input[type="datetime-local"]');
    fireEvent.change(startInput, { target: { value: '2025-12-01T10:00' } });
    fireEvent.change(endInput, { target: { value: '2025-12-01T12:00' } });

    const submitButton = within(modal).getByRole('button', { name: /Create Auction/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(auctionAPI.createAuction).toHaveBeenCalled();
    });

    const [payload] = auctionAPI.createAuction.mock.calls[0];
    expect(payload.productId).toBe('prod1');
    expect(payload.startPrice).toBe(1500);
    expect(new Date(payload.startTime).toISOString()).toBe(new Date('2025-12-01T10:00').toISOString());
    expect(new Date(payload.endTime).toISOString()).toBe(new Date('2025-12-01T12:00').toISOString());
  });

  it('validates auction form fields', async () => {
    renderAdminDashboard();

    fireEvent.click(await screen.findByText('Auctions'));
    const openModalButton = screen
      .getAllByRole('button', { name: /Create Auction/i })
      .find((btn) => btn.classList.contains('btn-white'));
    fireEvent.click(openModalButton);

    const modalHeader = await screen.findByText(/Create Auction/i, { selector: 'h3' });
    const modal = modalHeader.closest('.modal-content');

    const submitButton = within(modal).getByRole('button', { name: /Create Auction/i });
    await userEvent.click(submitButton);
    expect(alertSpy).toHaveBeenCalledWith('Please select a product');
    alertSpy.mockClear();

    const productSelect = within(modal).getByRole('combobox');
    await userEvent.selectOptions(productSelect, ['prod1']);

    await userEvent.click(submitButton);
    expect(alertSpy).toHaveBeenCalledWith('Start time and end time are required');
    alertSpy.mockClear();

    const [startInput, endInput] = modal.querySelectorAll('input[type="datetime-local"]');
    fireEvent.change(startInput, { target: { value: '2025-12-01T12:00' } });
    fireEvent.change(endInput, { target: { value: '2025-12-01T13:00' } });

    await userEvent.click(submitButton);
    expect(alertSpy).toHaveBeenCalledWith('Start price must be greater than 0');
    alertSpy.mockClear();

    const priceInput = within(modal).getByRole('spinbutton');
    fireEvent.change(priceInput, { target: { value: '100' } });
    fireEvent.change(startInput, { target: { value: '2025-12-01T14:00' } });
    fireEvent.change(endInput, { target: { value: '2025-12-01T13:00' } });

    await userEvent.click(submitButton);
    expect(alertSpy).toHaveBeenCalledWith('End time must be after start time');
  });

  it('redirects non-admin users away from dashboard', async () => {
    mockUseAuth.mockReturnValue({
      user: { ...mockUser, role: 'user' },
      isAuthenticated: true,
      logout: vi.fn()
    });

    renderAdminDashboard();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('handles API errors gracefully', async () => {
    categoryAPI.getAllCategories.mockRejectedValueOnce(new Error('fail categories'));
    couponAPI.getAllCoupons.mockRejectedValueOnce(new Error('fail coupons'));
    auctionAPI.getActiveAuctions.mockRejectedValueOnce(new Error('fail auctions'));
    productAPI.getAllProducts.mockRejectedValueOnce(new Error('fail products'));

    renderAdminDashboard();

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
});
