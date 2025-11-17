import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CustomerService from '../CustomerService';

const mockOnBack = vi.fn();

const renderCustomerService = () => {
  return render(<CustomerService onBack={mockOnBack} />);
};

describe('CustomerService Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders customer service chatbot', () => {
    renderCustomerService();
    
    expect(screen.getByText(/Customer Service/i)).toBeInTheDocument();
  });

  it('handles back button', () => {
    renderCustomerService();
    
    const backButton = screen.getByText(/Back/i);
    fireEvent.click(backButton);
    
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('sends message', async () => {
    renderCustomerService();
    
    const messageInput = screen.getByPlaceholderText(/Type your message/i);
    fireEvent.change(messageInput, { target: { value: 'Hello' } });
    
    const sendButton = screen.getByText(/Send/i);
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });
  });

  it('receives response', async () => {
    renderCustomerService();
    
    const messageInput = screen.getByPlaceholderText(/Type your message/i);
    fireEvent.change(messageInput, { target: { value: 'Help' } });
    
    const sendButton = screen.getByText(/Send/i);
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(screen.getByText(/How can I help/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
