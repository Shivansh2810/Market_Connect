import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PaymentGateway from '../PaymentGateway';
import { createRazorpayOrder, verifyPayment } from '../../../../services/payment';

vi.mock('../PaymentGateway.css', () => ({}));

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('../../../../services/payment', () => ({
  createRazorpayOrder: vi.fn(),
  verifyPayment: vi.fn(),
}));

describe('PaymentGateway', () => {
  const originalAppendChild = document.body.appendChild;
  let scriptShouldLoad = true;
  let razorpayOptions;
  let openMock;

  const setScriptOutcome = (shouldLoad) => {
    scriptShouldLoad = shouldLoad;
  };

  const createDeferred = () => {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };

  beforeEach(() => {
    scriptShouldLoad = true;
    razorpayOptions = undefined;
    openMock = vi.fn();

    document.body.appendChild = vi.fn((node) => {
      const result = originalAppendChild.call(document.body, node);
      if (node.tagName === 'SCRIPT') {
        setTimeout(() => {
          if (scriptShouldLoad) {
            node.onload?.();
          } else {
            node.onerror?.();
          }
        }, 0);
      }
      return result;
    });

    window.Razorpay = vi.fn().mockImplementation(function (options) {
      razorpayOptions = options;
      this.open = openMock;
    });

    navigateMock.mockReset();
    createRazorpayOrder.mockReset();
    verifyPayment.mockReset();
  });

  afterEach(() => {
    document.body.appendChild = originalAppendChild;
    document
      .querySelectorAll('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
      .forEach((node) => node.remove());
    delete window.Razorpay;
    cleanup();
  });

  it('initializes Razorpay and completes the payment flow', async () => {
    const deferred = createDeferred();
    createRazorpayOrder.mockResolvedValue({
      success: true,
      data: {
        razorpayOrderId: 'rzp_test123',
        amount: 5000,
        currency: 'INR',
        keyId: 'key_test',
      },
    });
    verifyPayment.mockReturnValueOnce(deferred.promise);
    const onPaymentSuccess = vi.fn();

    render(
      <PaymentGateway
        orderId="order_1"
        amount={5000}
        orderDetails={{ buyerName: 'Jane', buyerEmail: 'jane@test.com', buyerPhone: '999' }}
        onPaymentSuccess={onPaymentSuccess}
      />
    );

    expect(await screen.findByText(/Initializing payment gateway/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(openMock).toHaveBeenCalledTimes(1);
    });

    expect(window.Razorpay).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'key_test', amount: 5000, order_id: 'rzp_test123' })
    );

    await act(async () => {
      await razorpayOptions.handler({
        razorpay_order_id: 'rzp_test123',
        razorpay_payment_id: 'pay_1',
        razorpay_signature: 'sig_1',
      });
    });

    expect(await screen.findByText(/Processing Payment/i)).toBeInTheDocument();

    await act(async () => {
      await deferred.resolve({ success: true, data: { receipt: 'rcpt_1' } });
    });

    await waitFor(() => {
      expect(verifyPayment).toHaveBeenCalledWith(
        expect.objectContaining({ orderId: 'order_1' })
      );
      expect(onPaymentSuccess).toHaveBeenCalledWith({ receipt: 'rcpt_1' });
    });
  });

  it('shows an error when Razorpay script fails to load and retries successfully', async () => {
    setScriptOutcome(false);
    createRazorpayOrder.mockResolvedValue({
      success: true,
      data: {
        razorpayOrderId: 'rzp_retry',
        amount: 7500,
        currency: 'INR',
        keyId: 'key_retry',
      },
    });

    render(<PaymentGateway orderId="order_retry" amount={7500} />);

    expect(await screen.findByText(/Payment Error/i)).toBeInTheDocument();
    expect(screen.getByText(/Failed to load Razorpay SDK/i)).toBeInTheDocument();
    expect(createRazorpayOrder).not.toHaveBeenCalled();

    setScriptOutcome(true);
    await userEvent.click(screen.getByRole('button', { name: /Try Again/i }));

    await waitFor(() => {
      expect(createRazorpayOrder).toHaveBeenCalledTimes(1);
      expect(openMock).toHaveBeenCalledTimes(1);
    });
  });

  it('handles payment verification failure and cancels when user opts out of retry', async () => {
    createRazorpayOrder.mockResolvedValue({
      success: true,
      data: {
        razorpayOrderId: 'rzp_fail',
        amount: 5500,
        currency: 'INR',
        keyId: 'key_fail',
      },
    });
    verifyPayment.mockRejectedValue(new Error('Gateway timeout'));
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<PaymentGateway orderId="order_fail" amount={5500} />);

    await waitFor(() => {
      expect(openMock).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      await razorpayOptions.handler({
        razorpay_order_id: 'rzp_fail',
        razorpay_payment_id: 'pay_fail',
        razorpay_signature: 'sig_fail',
      });
    });

    expect(await screen.findByText('Gateway timeout')).toBeInTheDocument();
    expect(confirmSpy).toHaveBeenCalledWith(
      'Payment verification failed. Would you like to try again?'
    );
    expect(navigateMock).toHaveBeenCalledWith('/checkout', {
      state: { message: 'Payment was cancelled. You can try again.' },
    });

    confirmSpy.mockRestore();
  });

  it('retries payment verification when user chooses to try again', async () => {
    createRazorpayOrder
      .mockResolvedValueOnce({
        success: true,
        data: {
          razorpayOrderId: 'rzp_first',
          amount: 8000,
          currency: 'INR',
          keyId: 'key_first',
        },
      })
      .mockResolvedValueOnce({
        success: true,
        data: {
          razorpayOrderId: 'rzp_second',
          amount: 8000,
          currency: 'INR',
          keyId: 'key_second',
        },
      });

    verifyPayment
      .mockRejectedValueOnce(new Error('Signature mismatch'))
      .mockResolvedValueOnce({ success: true, data: { receipt: 'rcpt_final' } });

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const onPaymentSuccess = vi.fn();

    render(
      <PaymentGateway
        orderId="order_retry_flow"
        amount={8000}
        onPaymentSuccess={onPaymentSuccess}
      />
    );

    await waitFor(() => {
      expect(openMock).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      await razorpayOptions.handler({
        razorpay_order_id: 'rzp_first',
        razorpay_payment_id: 'pay_first',
        razorpay_signature: 'sig_first',
      });
    });

    await waitFor(() => {
      expect(createRazorpayOrder).toHaveBeenCalledTimes(2);
    });

    await waitFor(() => {
      expect(openMock).toHaveBeenCalledTimes(2);
    });

    await act(async () => {
      await razorpayOptions.handler({
        razorpay_order_id: 'rzp_second',
        razorpay_payment_id: 'pay_second',
        razorpay_signature: 'sig_second',
      });
    });

    await waitFor(() => {
      expect(onPaymentSuccess).toHaveBeenCalledWith({ receipt: 'rcpt_final' });
    });

    confirmSpy.mockRestore();
  });

  it('invokes custom cancel handler when checkout is dismissed', async () => {
    createRazorpayOrder.mockResolvedValue({
      success: true,
      data: {
        razorpayOrderId: 'rzp_cancel',
        amount: 6000,
        currency: 'INR',
        keyId: 'key_cancel',
      },
    });
    verifyPayment.mockResolvedValue({ success: true, data: {} });
    const onPaymentCancel = vi.fn();

    render(
      <PaymentGateway
        orderId="order_cancel"
        amount={6000}
        onPaymentCancel={onPaymentCancel}
      />
    );

    await waitFor(() => {
      expect(openMock).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      razorpayOptions.modal.ondismiss();
    });

    expect(onPaymentCancel).toHaveBeenCalledTimes(1);
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('navigates to dashboard on successful payment when no success callback is provided', async () => {
    createRazorpayOrder.mockResolvedValue({
      success: true,
      data: {
        razorpayOrderId: 'rzp_default',
        amount: 4500,
        currency: 'INR',
        keyId: 'key_default',
      },
    });
    verifyPayment.mockResolvedValue({ success: true, data: { orderId: 'order_default' } });

    render(<PaymentGateway orderId="order_default" amount={4500} />);

    await waitFor(() => {
      expect(openMock).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      await razorpayOptions.handler({
        razorpay_order_id: 'rzp_default',
        razorpay_payment_id: 'pay_default',
        razorpay_signature: 'sig_default',
      });
    });

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/dashboard', {
        state: {
          message: 'Payment successful! Your order has been placed.',
          orderId: 'order_default',
        },
      });
    });
  });
});
