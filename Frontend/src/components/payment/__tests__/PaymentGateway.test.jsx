import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PaymentGateway from '../PaymentGateway';
import api from '../../../../api/axios';

vi.mock('../../../../api/axios');

const mockOnSuccess = vi.fn();
const mockOnCancel = vi.fn();

const renderPaymentGateway = (amount = 1000) => {
  return render(
    <PaymentGateway 
      amount={amount} 
      onSuccess={mockOnSuccess} 
      onCancel={mockOnCancel} 
    />
  );
};

describe('PaymentGateway Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders payment form', () => {
    renderPaymentGateway();
    
    expect(screen.getByText(/Payment/i)).toBeInTheDocument();
    expect(screen.getByText(/₹1,000/i)).toBeInTheDocument();
  });

  it('validates card number', async () => {
    renderPaymentGateway();
    
    const cardInput = screen.getByPlaceholderText(/Card Number/i);
    fireEvent.change(cardInput, { target: { value: '1234' } });
    
    const submitButton = screen.getByText(/Pay Now/i);
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Invalid card number/i)).toBeInTheDocument();
    });
  });

  it('validates expiry date', async () => {
    renderPaymentGateway();
    
    const expiryInput = screen.getByPlaceholderText(/MM\/YY/i);
    fireEvent.change(expiryInput, { target: { value: '13/25' } });
    
    const submitButton = screen.getByText(/Pay Now/i);
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Invalid expiry/i)).toBeInTheDocument();
    });
  });

  it('validates CVV', async () => {
    renderPaymentGateway();
    
    const cvvInput = screen.getByPlaceholderText(/CVV/i);
    fireEvent.change(cvvInput, { target: { value: '12' } });
    
    const submitButton = screen.getByText(/Pay Now/i);
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Invalid CVV/i)).toBeInTheDocument();
    });
  });

  it('submits payment successfully', async () => {
    api.post.mockResolvedValue({ data: { success: true } });
    
    renderPaymentGateway();
    
    const cardInput = screen.getByPlaceholderText(/Card Number/i);
    fireEvent.change(cardInput, { target: { value: '4111111111111111' } });
    
    const expiryInput = screen.getByPlaceholderText(/MM\/YY/i);
    fireEvent.change(expiryInput, { target: { value: '12/25' } });
    
    const cvvInput = screen.getByPlaceholderText(/CVV/i);
    fireEvent.change(cvvInput, { target: { value: '123' } });
    
    const submitButton = screen.getByText(/Pay Now/i);
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('handles payment error', async () => {
    api.post.mockRejectedValue({ response: { data: { message: 'Payment failed' } } });
    
    renderPaymentGateway();
    
    const cardInput = screen.getByPlaceholderText(/Card Number/i);
    fireEvent.change(cardInput, { target: { value: '4111111111111111' } });
    
    const submitButton = screen.getByText(/Pay Now/i);
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Payment failed/i)).toBeInTheDocument();
    });
  });

  it('handles cancel button', () => {
    renderPaymentGateway();
    
    const cancelButton = screen.getByText(/Cancel/i);
    fireEvent.click(cancelButton);
    
    expect(mockOnCancel).toHaveBeenCalled();
  });
});
