import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../profile.css', () => ({}));

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

const logoutMock = vi.fn();
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ logout: logoutMock }),
}));

const apiDeleteMock = vi.fn();
vi.mock('../../../../services/axios', () => ({
  __esModule: true,
  default: { delete: apiDeleteMock },
}));

const getCurrentUserProfile = vi.fn();
const getCurrentUserOrders = vi.fn();
const updateCurrentUserProfile = vi.fn();
vi.mock('../../../../services/user', () => ({
  getCurrentUserProfile,
  getCurrentUserOrders,
  updateCurrentUserProfile,
}));

const requestReturn = vi.fn();
vi.mock('../../../../services/return', () => ({
  requestReturn,
}));

const createReview = vi.fn();
const getMyReviews = vi.fn();
vi.mock('../../../../services/review', () => ({
  createReview,
  getMyReviews,
}));

let Profile;

const onBackMock = vi.fn();
const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
const confirmMock = vi.spyOn(window, 'confirm').mockReturnValue(true);
beforeAll(async () => {
  Profile = (await import('../Profile')).default;
});

const defaultProfile = {
  success: true,
  data: {
    _id: 'user1',
    name: 'Jane Doe',
    email: 'jane@example.com',
    mobNo: '9876543210',
    role: 'seller',
    buyerInfo: {
      shippingAddresses: [
        {
          _id: 'addr1',
          street: '221B Baker Street',
          city: 'London',
          state: 'London',
          pincode: 'NW16XE',
          country: 'UK',
        },
      ],
      cart: [],
    },
    sellerInfo: {
      shopName: 'Jane Boutique',
    },
  },
};

const deliveredOrder = {
  _id: 'order12345678',
  createdAt: '2025-06-01T10:00:00.000Z',
  updatedAt: '2025-06-05T10:00:00.000Z',
  orderStatus: 'Delivered',
  itemsPrice: 200,
  taxPrice: 36,
  shippingPrice: 0,
  totalPrice: 236,
  shippingInfo: {
    street: '221B Baker Street',
    city: 'London',
    state: 'London',
    pincode: 'NW16XE',
    country: 'UK',
  },
  orderItems: [
    {
      product: { _id: 'prod-reviewed' },
      name: 'Reviewed Gadget',
      quantity: 1,
      price: 100,
      image: 'https://example.com/reviewed.jpg',
    },
    {
      product: { _id: 'prod-new' },
      name: 'New Gadget',
      quantity: 2,
      price: 50,
    },
  ],
};

const processingOrder = {
  _id: 'orderProcessing',
  createdAt: '2025-06-03T12:00:00.000Z',
  orderStatus: 'Processing',
  itemsPrice: 120,
  taxPrice: 0,
  shippingPrice: 25,
  totalPrice: 145,
  orderItems: [
    {
      product: { _id: 'prod-processing' },
      name: 'Processing Gadget',
      quantity: 1,
      price: 120,
    },
  ],
};

const defaultOrders = {
  success: true,
  data: [deliveredOrder, processingOrder],
};

const defaultReviews = {
  success: true,
  data: [
    {
      productId: { _id: 'prod-reviewed' },
    },
  ],
};

const setupMocks = ({
  profile = defaultProfile,
  orders = defaultOrders,
  reviews = defaultReviews,
} = {}) => {
  getCurrentUserProfile.mockResolvedValue(profile);
  getCurrentUserOrders.mockResolvedValue(orders);
  getMyReviews.mockResolvedValue(reviews);
  updateCurrentUserProfile.mockResolvedValue({ success: true });
  requestReturn.mockResolvedValue({ success: true });
  createReview.mockResolvedValue({ success: true });
  apiDeleteMock.mockResolvedValue({ data: { success: true } });
};

const renderProfile = async (options = {}) => {
  setupMocks(options);
  const ref = React.createRef();
  render(<Profile ref={ref} onBack={onBackMock} />);

  await waitFor(() => expect(getCurrentUserProfile).toHaveBeenCalled());
  if (options?.profile?.success && options.profile.data) {
    await screen.findByText('Personal Information');
  } else {
    await screen.findByText('My Profile');
  }
  return { ref };
};

describe('Profile Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    alertMock.mockClear();
    confirmMock.mockReturnValue(true);
  });

  afterEach(() => {
    onBackMock.mockClear();
    navigateMock.mockClear();
    logoutMock.mockClear();
  });

  it('loads profile data, allows editing, and supports cancellation', async () => {
    const { ref } = await renderProfile();

    expect(screen.getAllByText('Jane Doe')[0]).toBeInTheDocument();
    expect(screen.getByText('Seller')).toBeInTheDocument();
    expect(screen.getByText(/221B Baker Street/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Edit Profile/i }));

    const nameInput = screen.getByDisplayValue('Jane Doe');
    const emailInput = screen.getByDisplayValue('jane@example.com');
    const mobileInput = screen.getByDisplayValue('9876543210');

    fireEvent.change(nameInput, { target: { value: 'Jane Updated' } });
    fireEvent.change(emailInput, { target: { value: 'updated@example.com' } });
    fireEvent.change(mobileInput, { target: { value: '9123456789' } });

    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => {
      expect(updateCurrentUserProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Jane Updated',
          mobNo: '9123456789',
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Edit Profile/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Edit Profile/i }));
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));

    expect(updateCurrentUserProfile).toHaveBeenCalledTimes(1);
    expect(screen.getAllByText('Jane Updated')[0]).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Back to Dashboard/i }));
    expect(onBackMock).toHaveBeenCalled();

    // Exercise imperative methods
    act(() => {
      ref.current.updateReviewData({ comment: 'Great product' });
      ref.current.updateReturnState({ reason: 'Other', description: 'Manual update' });
    });
  });

  it('handles account deletion success and error cases', async () => {
    await renderProfile();

    fireEvent.click(screen.getByRole('button', { name: /Settings/i }));

    confirmMock.mockReturnValueOnce(false);
    fireEvent.click(screen.getByRole('button', { name: /Delete/i }));
    expect(apiDeleteMock).not.toHaveBeenCalled();

    confirmMock.mockReturnValueOnce(true);
    apiDeleteMock.mockResolvedValueOnce({ data: { success: true } });
    fireEvent.click(screen.getByRole('button', { name: /Delete/i }));

    await waitFor(() => {
      expect(apiDeleteMock).toHaveBeenCalledWith('/users/me');
      expect(logoutMock).toHaveBeenCalled();
      expect(navigateMock).toHaveBeenCalledWith('/', { replace: true });
    });

    confirmMock.mockReturnValueOnce(true);
    apiDeleteMock.mockResolvedValueOnce({ data: { success: false, message: 'Unable to delete' } });
    fireEvent.click(screen.getByRole('button', { name: /Delete/i }));
    await screen.findByText('Unable to delete');

    confirmMock.mockReturnValueOnce(true);
    apiDeleteMock.mockRejectedValueOnce({ response: { data: { message: 'Server error' } } });
    fireEvent.click(screen.getByRole('button', { name: /Delete/i }));
    await screen.findByText('Server error');
  });

  it('handles order return workflow and refreshes orders', async () => {
    const { ref } = await renderProfile();

    fireEvent.click(screen.getByRole('button', { name: /Order History/i }));
    fireEvent.click(screen.getByRole('button', { name: /Request Return/i }));

    fireEvent.click(screen.getByRole('button', { name: /Submit Return Request/i }));
    expect(alertMock).toHaveBeenCalledWith('Please select a reason for return');

    alertMock.mockClear();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Damaged Item' } });

    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach(cb => fireEvent.click(cb));

    fireEvent.click(screen.getByRole('button', { name: /Submit Return Request/i }));
    expect(alertMock).toHaveBeenCalledWith('Please select at least one item to return');

    alertMock.mockClear();
    fireEvent.click(checkboxes[0]);
    fireEvent.change(screen.getByPlaceholderText(/additional information/i), {
      target: { value: 'Packaging damaged' },
    });

    requestReturn.mockResolvedValueOnce({ success: true });
    fireEvent.click(screen.getByRole('button', { name: /Submit Return Request/i }));

    await waitFor(() => {
      expect(requestReturn).toHaveBeenCalledWith({
        orderId: 'order12345678',
        items: [
          {
            productId: 'prod-reviewed',
            quantity: 1,
          },
        ],
        reason: 'Damaged Item',
        description: 'Packaging damaged',
      });
      expect(alertMock).toHaveBeenCalledWith('Return request submitted successfully! Awaiting seller approval.');
    });

    await waitFor(() => expect(getCurrentUserOrders).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /Submit Return Request/i })).not.toBeInTheDocument()
    );

    requestReturn.mockRejectedValueOnce({ response: { data: { message: 'Cannot process' } } });
    act(() => {
      ref.current.openReturnModal(deliveredOrder);
      ref.current.updateReturnState({ reason: 'Damaged Item', description: 'Retry' });
      ref.current.triggerSubmitReturn();
    });
    await waitFor(() => expect(alertMock).toHaveBeenCalledWith('Cannot process'));

    alertMock.mockClear();
    requestReturn.mockRejectedValueOnce(new Error('Network down'));
    act(() => {
      ref.current.openReturnModal(deliveredOrder);
      ref.current.updateReturnState({ reason: 'Damaged Item' });
      ref.current.triggerSubmitReturn();
    });
    await waitFor(() => expect(alertMock).toHaveBeenCalledWith('Failed to submit return request'));
  });

  it('manages review workflow, including duplicate prevention and error handling', async () => {
    const { ref } = await renderProfile({ reviews: { success: true, data: [] } });

    act(() => {
      ref.current.triggerSubmitReview();
    });
    expect(alertMock).toHaveBeenCalledWith('Please select a rating');

    alertMock.mockClear();

    fireEvent.click(screen.getByRole('button', { name: /Order History/i }));
    const reviewButtons = screen.getAllByRole('button', { name: /Write Review/i });
    fireEvent.click(reviewButtons[1]);

    const stars = screen.getAllByRole('button', { name: '★' });
    await userEvent.click(stars[3]);

    const commentArea = screen.getByPlaceholderText(/Share your positive experience|Share your experience/i);
    fireEvent.change(commentArea, { target: { value: 'Excellent quality' } });

    await userEvent.click(screen.getByRole('button', { name: /Submit Review/i }));
    await waitFor(() => expect(createReview).toHaveBeenCalledWith({
      productId: 'prod-new',
      orderId: 'order12345678',
      rating: 4,
      comment: 'Excellent quality',
      images: [],
    }));
    expect(alertMock).toHaveBeenCalledWith('Review submitted successfully! Thank you for your feedback.');

    alertMock.mockClear();
    await act(async () => {
      ref.current.setReviewedProducts(new Set(['prod-reviewed', 'prod-new']));
    });
    act(() => {
      ref.current.triggerWriteReview(deliveredOrder, deliveredOrder.orderItems[0]);
    });
    expect(alertMock).toHaveBeenCalledWith('You have already reviewed this product.');

    alertMock.mockClear();
    createReview.mockRejectedValueOnce({ response: { data: { message: 'Review failed' } } });
    await act(async () => {
      ref.current.updateReviewData({ orderId: 'order12345678', productId: 'prod-error', rating: 5 });
    });
    await act(async () => {
      ref.current.triggerSubmitReview();
    });
    await waitFor(() => expect(alertMock).toHaveBeenCalledWith('Review failed'));

    alertMock.mockClear();
    createReview.mockRejectedValueOnce(new Error('Network issue'));
    await act(async () => {
      ref.current.updateReviewData({ orderId: 'order12345678', productId: 'prod-error-2', rating: 5 });
    });
    await act(async () => {
      ref.current.triggerSubmitReview();
    });
    await waitFor(() => expect(alertMock).toHaveBeenCalledWith('Failed to submit review'));
  });

  it('renders error state when profile loading fails', async () => {
    getCurrentUserProfile.mockRejectedValueOnce(new Error('Server down'));
    getCurrentUserOrders.mockResolvedValueOnce({ success: true, data: [] });
    getMyReviews.mockResolvedValueOnce({ success: true, data: [] });

    render(<Profile onBack={onBackMock} />);

    await screen.findByText('Unable to load profile.');
    expect(screen.getByRole('button', { name: /Back to Dashboard/i })).toBeInTheDocument();
  });

  it('shows empty personal info when profile data is missing', async () => {
    await renderProfile({
      profile: { success: false },
      orders: { success: true, data: [] },
      reviews: { success: true, data: [] },
    });

    fireEvent.click(screen.getByRole('button', { name: /Personal Info/i }));
    expect(screen.getByText('No profile information available.')).toBeInTheDocument();
  });
});
