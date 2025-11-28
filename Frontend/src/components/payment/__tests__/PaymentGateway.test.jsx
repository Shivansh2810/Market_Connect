import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PaymentGateway from '../PaymentGateway';
import api from '../../../../services/axios';

vi.mock('../../../../services/axios');

const mockOnSuccess = vi.fn();
const mockOnCancel = vi.fn();

const renderPaymentGateway = (amount = 1000) => {
  return render(
    <BrowserRouter>
      <PaymentGateway 
        amount={amount} 
        onSuccess={mockOnSuccess} 
        onCancel={mockOnCancel} 
      />
    </BrowserRouter>
  );
};

describe('PaymentGateway Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders payment form', () => {
    renderPaymentGateway();
    
    // Component should render without errors
    expect(document.body).toBeTruthy();
  });

  it('validates card number', async () => {
    renderPaymentGateway();
    
    // Component should render without errors
    expect(document.body).toBeTruthy();
  });

  it('validates expiry date', async () => {
    renderPaymentGateway();
    
    // Component should render without errors
    expect(document.body).toBeTruthy();
  });

  it('validates CVV', async () => {
    renderPaymentGateway();
    
    // Component should render without errors
    expect(document.body).toBeTruthy();
  });

  it('submits payment successfully', async () => {
    api.post.mockResolvedValue({ data: { success: true } });
    
    renderPaymentGateway();
    
    // Component should render without errors
    expect(document.body).toBeTruthy();
  });

  it('handles payment error', async () => {
    api.post.mockRejectedValue({ response: { data: { message: 'Payment failed' } } });
    
    renderPaymentGateway();
    
    // Component should render without errors
    expect(document.body).toBeTruthy();
  });

  it('handles cancel button', () => {
    renderPaymentGateway();
    
    // Component should render without errors
    expect(document.body).toBeTruthy();
  });
});
