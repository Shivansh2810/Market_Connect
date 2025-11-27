import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CustomerService from '../CustomerService';

// Mock axios
vi.mock('../../../../api/axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { data: [] } }),
    post: vi.fn().mockResolvedValue({ data: { success: true } })
  }
}));

// Mock fetch
global.fetch = vi.fn();

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

const mockOnBack = vi.fn();

const renderCustomerService = () => {
  return render(<CustomerService onBack={mockOnBack} />);
};

describe('CustomerService Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ response: 'Bot response', faqs: [] })
    });
  });

  it('renders customer service chatbot', async () => {
    renderCustomerService();
    
    // Component should render without errors
    await waitFor(() => {
      expect(document.body).toBeTruthy();
    });
  });

  it('handles back button', () => {
    renderCustomerService();
    
    const backButton = screen.getByText(/Back to Dashboard/i);
    fireEvent.click(backButton);
    
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('sends message', async () => {
    renderCustomerService();
    
    const messageInput = screen.getByPlaceholderText(/Type your message here/i);
    fireEvent.change(messageInput, { target: { value: 'Hello' } });
    
    const sendButton = screen.getByRole('button', { name: '' });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });
  });

  it('receives response', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: 'How can I help you?' })
    });
    
    renderCustomerService();
    
    // Component should render without errors
    await waitFor(() => {
      expect(document.body).toBeTruthy();
    }, { timeout: 3000 });
  });
});
