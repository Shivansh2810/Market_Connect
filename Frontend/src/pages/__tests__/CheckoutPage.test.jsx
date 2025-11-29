import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

const useAuthMock = vi.fn();
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

const useCartMock = vi.fn();
vi.mock('../../contexts/CartContext', () => ({
  useCart: () => useCartMock(),
}));

const createOrderMock = vi.fn();
vi.mock('../../../services/order', () => ({
  createOrder: (...args) => createOrderMock(...args),
}));

const applyCouponMock = vi.fn();
vi.mock('../../../services/coupon', () => ({
  applyCoupon: (...args) => applyCouponMock(...args),
}));

const cancelPaymentOrderMock = vi.fn();
vi.mock('../../../services/payment', () => ({
  cancelPaymentOrder: (...args) => cancelPaymentOrderMock(...args),
}));

const paymentGatewayProps = [];
vi.mock('../../components/payment/PaymentGateway', () => ({
  __esModule: true,
  default: (props) => {
    paymentGatewayProps.push(props);
    return (
      <div data-testid="payment-gateway">
        <span>Gateway for {props.orderId}</span>
        <button onClick={props.onPaymentSuccess}>Simulate Success</button>
        <button onClick={props.onPaymentCancel}>Simulate Cancel</button>
      </div>
    );
  },
}));

vi.mock('../../components/payment/AvailableCoupons', () => ({
  __esModule: true,
  default: ({ onSelectCoupon }) => (
    <button type="button" onClick={() => onSelectCoupon('AUTO10')}>
      Use AUTO10
    </button>
  ),
}));

let CheckoutPage;
beforeAll(async () => {
  CheckoutPage = (await import('../CheckoutPage')).default;
});

const renderCheckout = () => render(<CheckoutPage />);

const baseCartItem = {
  productId: 'prod-1',
  quantity: 1,
  productDetails: {
    title: 'Camera',
    category: 'Electronics',
    currency: 'INR',
    price: 500,
    image: 'https://example.com/camera.jpg',
  },
};

let updateQuantityMock;
let removeFromCartMock;
let clearCartMock;

const mockCartState = (overrides = {}) => {
  const clonedItem = JSON.parse(JSON.stringify(baseCartItem));
  useCartMock.mockReturnValue({
    items: [clonedItem],
    totalAmount: 500,
    itemCount: 1,
    updateQuantity: updateQuantityMock,
    removeFromCart: removeFromCartMock,
    clearCart: clearCartMock,
    ...overrides,
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  updateQuantityMock = vi.fn();
  removeFromCartMock = vi.fn();
  clearCartMock = vi.fn();

  useAuthMock.mockReturnValue({
    user: { name: 'Test User', email: 'test@example.com', phone: '9999999999' },
  });

  mockCartState({ items: [] , totalAmount: 0, itemCount: 0 });
});

afterEach(() => {
  paymentGatewayProps.length = 0;
});

describe('CheckoutPage', () => {
  it('renders empty-cart view and navigates to dashboard', async () => {
    renderCheckout();

    expect(screen.getByText(/Your cart is empty/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Go to Dashboard/i }));
    expect(navigateMock).toHaveBeenCalledWith('/dashboard');
  });

  it('validates shipping info and surfaces errors from API response', async () => {
    mockCartState();
    createOrderMock.mockResolvedValueOnce({ success: false, message: 'Address invalid' });

    renderCheckout();

    const submit = screen.getByRole('button', { name: /Proceed to Payment/i });

    await userEvent.click(submit);
    expect(await screen.findByText('Street address is required')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/Street Address/i), '12 Main Street');
    await userEvent.click(submit);
    expect(await screen.findByText('City is required')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/City/i), 'Metropolis');
    await userEvent.click(submit);
    expect(await screen.findByText('State is required')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/State/i), 'Gotham');
    await userEvent.type(screen.getByLabelText(/Pincode/i), '12345');
    await userEvent.click(submit);
    expect(await screen.findByText('Pincode must be exactly 6 digits')).toBeInTheDocument();

    await userEvent.clear(screen.getByLabelText(/Pincode/i));
    await userEvent.type(screen.getByLabelText(/Pincode/i), '123456');
    await userEvent.click(submit);

    await waitFor(() => {
      expect(createOrderMock).toHaveBeenCalled();
      expect(screen.getByText('Address invalid')).toBeInTheDocument();
    });
  });

  it('applies coupon successfully and allows removal', async () => {
    mockCartState();
    applyCouponMock.mockResolvedValueOnce({
      success: true,
      data: {
        coupon: { code: 'SAVE10', description: 'Ten percent off' },
        cartSummary: { discountAmount: 50 },
      },
    });

    renderCheckout();

    await userEvent.type(screen.getByPlaceholderText(/Enter coupon code/i), 'save10');
    await userEvent.click(screen.getByRole('button', { name: /Apply/i }));

    await waitFor(() => {
      expect(applyCouponMock).toHaveBeenCalledWith('SAVE10', 500);
      expect(screen.getByText(/You saved ₹50.00!/i)).toBeInTheDocument();
    });

    const removeButtons = screen.getAllByRole('button', { name: /Remove/i });
    await userEvent.click(removeButtons[removeButtons.length - 1]);
    expect(screen.queryByText('SAVE10')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter coupon code/i)).toHaveValue('');
  });

  it('handles coupon application failures and errors', async () => {
    mockCartState();

    renderCheckout();

    const applyButton = screen.getByRole('button', { name: /Apply/i });
    expect(applyButton).toBeDisabled();

    await userEvent.type(screen.getByPlaceholderText(/Enter coupon code/i), 'badone');
    applyCouponMock.mockResolvedValueOnce({ success: false, message: 'Invalid coupon' });
    await userEvent.click(applyButton);
    expect(await screen.findByText('Invalid coupon')).toBeInTheDocument();

    await userEvent.clear(screen.getByPlaceholderText(/Enter coupon code/i));
    await userEvent.type(screen.getByPlaceholderText(/Enter coupon code/i), 'error');
    applyCouponMock.mockRejectedValueOnce({ response: { data: { message: 'Expired' } } });
    await userEvent.click(applyButton);
    expect(await screen.findByText('Expired')).toBeInTheDocument();
  });

  it('auto-applies coupon selected from list', async () => {
    mockCartState();
    applyCouponMock.mockResolvedValue({
      success: true,
      data: {
        coupon: { code: 'AUTO10', description: 'Auto applied' },
        cartSummary: { discountAmount: 25 },
      },
    });

    vi.useFakeTimers();
    renderCheckout();

    await userEvent.click(screen.getByRole('button', { name: /Use AUTO10/i }));
    await act(async () => {
      vi.runAllTimers();
    });
    vi.useRealTimers();

    await waitFor(() => {
      expect(applyCouponMock).toHaveBeenCalledWith('AUTO10', 500);
      expect(screen.getAllByText(/AUTO10/i).length).toBeGreaterThan(0);
    });
  });

  it('creates order and completes payment flow successfully', async () => {
    mockCartState();
    createOrderMock.mockResolvedValueOnce({
      success: true,
      data: { _id: 'order-1', totalPrice: 590 },
    });

    renderCheckout();

    await userEvent.type(screen.getByLabelText(/Street Address/i), '12 Ocean Ave');
    await userEvent.type(screen.getByLabelText(/City/i), 'Atlantis');
    await userEvent.type(screen.getByLabelText(/State/i), 'Pacific');
    await userEvent.type(screen.getByLabelText(/Pincode/i), '654321');

    await userEvent.click(screen.getByRole('button', { name: /Proceed to Payment/i }));

    await waitFor(() => {
      expect(createOrderMock).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('payment-gateway')).toBeInTheDocument();
      expect(paymentGatewayProps[0].amount).toBe(590);
      expect(paymentGatewayProps[0].orderId).toBe('order-1');
    });

    await userEvent.click(screen.getByRole('button', { name: /Simulate Success/i }));

    await waitFor(() => {
      expect(clearCartMock).toHaveBeenCalled();
      expect(navigateMock).toHaveBeenCalledWith('/dashboard', {
        state: {
          message: 'Payment successful! Your order has been placed.',
          orderId: 'order-1',
          type: 'success',
        },
      });
    });
  });

  it('handles order creation errors with detailed messages', async () => {
    mockCartState();
    const detailedError = new Error('Network Error');
    detailedError.response = { data: { errors: ['Missing quantity', 'Invalid address'] } };
    createOrderMock.mockRejectedValueOnce(detailedError);

    renderCheckout();

    await userEvent.type(screen.getByLabelText(/Street Address/i), '21 Pine St');
    await userEvent.type(screen.getByLabelText(/City/i), 'Evergreen');
    await userEvent.type(screen.getByLabelText(/State/i), 'Forest');
    await userEvent.type(screen.getByLabelText(/Pincode/i), '112233');

    await userEvent.click(screen.getByRole('button', { name: /Proceed to Payment/i }));

    await waitFor(() => {
      expect(createOrderMock).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Missing quantity, Invalid address')).toBeInTheDocument();
    });
  });

  it('allows payment cancellation and restores checkout state', async () => {
    mockCartState();
    createOrderMock.mockResolvedValueOnce({
      success: true,
      data: { _id: 'order-2', totalPrice: 550 },
    });

    renderCheckout();

    await userEvent.type(screen.getByLabelText(/Street Address/i), '87 Lake View');
    await userEvent.type(screen.getByLabelText(/City/i), 'Pebble');
    await userEvent.type(screen.getByLabelText(/State/i), 'River');
    await userEvent.type(screen.getByLabelText(/Pincode/i), '778899');
    await userEvent.click(screen.getByRole('button', { name: /Proceed to Payment/i }));

    await waitFor(() => {
      expect(createOrderMock).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('payment-gateway')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole('button', { name: /Simulate Cancel/i }));

    await waitFor(() => {
      expect(cancelPaymentOrderMock).toHaveBeenCalledWith('order-2');
      expect(navigateMock).toHaveBeenCalledWith('/checkout', {
        state: {
          message: 'Payment was cancelled. You can try again.',
          type: 'info',
        },
      });
      expect(screen.getByRole('button', { name: /Proceed to Payment/i })).toBeInTheDocument();
    });
  });

  it('supports cart quantity updates and removal controls', async () => {
    mockCartState();

    renderCheckout();

    await userEvent.click(screen.getByRole('button', { name: '-' }));
    await userEvent.click(screen.getByRole('button', { name: '+' }));
    await userEvent.click(screen.getByRole('button', { name: /Remove/i }));

    expect(updateQuantityMock).toHaveBeenNthCalledWith(1, 'prod-1', 0);
    expect(updateQuantityMock).toHaveBeenNthCalledWith(2, 'prod-1', 2);
    expect(removeFromCartMock).toHaveBeenCalledWith('prod-1');
  });
});
