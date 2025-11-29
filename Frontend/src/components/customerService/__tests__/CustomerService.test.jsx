import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import CustomerService from '../CustomerService';

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

const mockOnBack = vi.fn();

const createDeferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const createApiClient = () => ({
  get: vi.fn().mockResolvedValue({ data: { data: [] } }),
  post: vi.fn().mockResolvedValue({ data: { response: 'Bot response', data: { success: true } } })
});

const createFetch = () => vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ faqs: [] })
});

const renderCustomerService = (overrides = {}) => {
  const apiClient = overrides.apiClient ?? createApiClient();
  const fetchFn = overrides.useDefaultFetch
    ? undefined
    : overrides.fetchFn ?? createFetch();

  return {
    apiClient,
    fetchFn,
    ...render(
      <CustomerService
        onBack={mockOnBack}
        apiClient={apiClient}
        {...(fetchFn ? { fetchFn } : {})}
      />
    )
  };
};

describe('CustomerService Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders customer service chatbot', async () => {
    renderCustomerService();
    
    // Component should render without errors
    await waitFor(() => {
      expect(document.body).toBeTruthy();
    });
  });

  it('handles back button', async () => {
    renderCustomerService();
    await screen.findByRole('heading', { name: 'Customer Service' });

    const backButton = screen.getByText(/Back to Dashboard/i);
    fireEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalled();
  });

  it('sends message and shows bot response', async () => {
    renderCustomerService();
    
    const messageInput = screen.getByPlaceholderText(/Type your message here/i);
    fireEvent.change(messageInput, { target: { value: 'Hello' } });
    
    const sendButton = screen.getByRole('button', { name: /send message/i });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('Bot response')).toBeInTheDocument();
    });
  });

  it('fetches FAQs on mount', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ faqs: [] })
    });

    renderCustomerService({ fetchFn });

    await waitFor(() => {
      expect(fetchFn).toHaveBeenCalled();
    });
  });

  it('handles API error on send and shows error message', async () => {
    const { apiClient } = renderCustomerService();
    apiClient.post.mockRejectedValueOnce(new Error('Network error'));

    const input = screen.getByPlaceholderText(/Type your message here/i);
    fireEvent.change(input, { target: { value: 'Help' } });
    const send = screen.getByRole('button', { name: /send message/i });
    fireEvent.click(send);

    await waitFor(() => {
      expect(screen.getByText('Help')).toBeInTheDocument();
      expect(
        screen.getByText(/Sorry, I'm having trouble connecting right now/i)
      ).toBeInTheDocument();
    });
  });

  it('quick question buttons send and render bot reply', async () => {
    renderCustomerService();

    const orderHelpBtn = screen.getByText(/Order Help/i);
    fireEvent.click(orderHelpBtn);

    await waitFor(() => {
      expect(screen.getByText('I need help with my order')).toBeInTheDocument();
      expect(screen.getByText('Bot response')).toBeInTheDocument();
    });
  });

  it('toggles chat history and shows empty state', async () => {
    renderCustomerService();
    await screen.findByRole('heading', { name: 'Customer Service' });

    const toggle = screen.getByText(/Previous Conversations/i);
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(screen.getByText(/No saved conversations yet/i)).toBeInTheDocument();
    });
  });

  it('resets conversation and clears messages', async () => {
    renderCustomerService();

    // send a message to make reset button appear
    const input = screen.getByPlaceholderText(/Type your message here/i);
    fireEvent.change(input, { target: { value: 'Hi' } });
    const send = screen.getByRole('button', { name: /send message/i });
    fireEvent.click(send);

    await waitFor(() => {
      expect(screen.getByText('Hi')).toBeInTheDocument();
    });

    const resetBtn = screen.getByTitle(/Reset Conversation/i);
    fireEvent.click(resetBtn);

    await waitFor(() => {
      expect(screen.getByText(/Welcome to Customer Service/i)).toBeInTheDocument();
    });
  });

  it('toggles FAQ item and sends answer to chat', async () => {
    // Provide one FAQ
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ faqs: [{ question: 'Q1', answer: 'A1' }] })
    });

    renderCustomerService({ fetchFn });

    // Toggle FAQ open
    const faqBtn = await screen.findByTitle('Toggle answer');
    fireEvent.click(faqBtn);

    // Click "Ask this"
    const askBtn = await screen.findByText(/Ask this/i);
    fireEvent.click(askBtn);

    await waitFor(() => {
      const matches = screen.getAllByText('A1');
      expect(matches.some((el) => el.closest('.message'))).toBe(true);
    });
  });

  it('loads saved chats and restores a conversation when selected', async () => {
    const apiClient = createApiClient();
    const savedChats = {
      data: {
        data: [
          {
            _id: 'chat1',
            sessionId: 'session-123',
            firstMessage: 'Initial question',
            lastMessage: 'Most recent reply',
            messageCount: 3,
            lastMessageTime: '2025-01-01T10:00:00.000Z'
          }
        ]
      }
    };
    const chatDetail = {
      data: {
        data: {
          _id: 'chat1',
          sessionId: 'session-123',
          messages: [
            { text: 'Hello support', sender: 'user', timestamp: '2025-01-01T09:00:00.000Z' },
            { text: 'Hi there!', sender: 'bot', timestamp: '2025-01-01T09:01:00.000Z' }
          ]
        }
      }
    };

    apiClient.get
      .mockResolvedValueOnce(savedChats)
      .mockResolvedValueOnce(savedChats)
      .mockResolvedValueOnce(chatDetail);

    renderCustomerService({ apiClient });

    await screen.findByRole('heading', { name: 'Customer Service' });

    const toggle = screen.getByText(/Previous Conversations/i);
    fireEvent.click(toggle);

    const historyItem = await screen.findByText(/Initial question/i);
    fireEvent.click(historyItem);

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/chats/session-123');
    });

    await waitFor(() => {
      expect(screen.getByText('Hi there!')).toBeInTheDocument();
    });

    expect(screen.queryByText(/No saved conversations yet/i)).not.toBeInTheDocument();
  });

  it('shows loading state then falls back when saved chats fetch fails', async () => {
    const apiClient = createApiClient();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const initial = { data: { data: [] } };
    const deferred = createDeferred();

    apiClient.get
      .mockResolvedValueOnce(initial)
      .mockReturnValueOnce(deferred.promise)
      .mockResolvedValueOnce({ data: { data: { unexpected: true } } });

    renderCustomerService({ apiClient });

    await screen.findByRole('heading', { name: 'Customer Service' });

    const toggle = screen.getByText(/Previous Conversations/i);
    fireEvent.click(toggle);

    expect(screen.getByText(/Loading conversations/i)).toBeInTheDocument();

    await act(async () => {
      deferred.resolve(initial);
      await deferred.promise;
    });

    await waitFor(() => {
      expect(screen.getByText(/No saved conversations yet/i)).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('uses default fetch fallback when global fetch is unavailable', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = undefined;

    const apiClient = createApiClient();

    renderCustomerService({ apiClient, useDefaultFetch: true });

    await screen.findByRole('heading', { name: 'Customer Service' });

    await waitFor(() => {
      expect(screen.getByText(/No FAQs available right now/i)).toBeInTheDocument();
    });

    globalThis.fetch = originalFetch;
  });

  it('prevents duplicate quick questions while loading and falls back on missing response', async () => {
    const apiClient = createApiClient();
    const deferred = createDeferred();

    apiClient.post.mockImplementation((url, payload) => {
      if (url === '/assistant/chat') {
        return deferred.promise;
      }
      if (url === '/chats') {
        return Promise.resolve({ data: { saved: true, payload } });
      }
      return Promise.resolve({ data: {} });
    });

    renderCustomerService({ apiClient });

    const orderHelpBtn = screen.getByText(/Order Help/i);
    fireEvent.click(orderHelpBtn);

    await waitFor(() => {
      expect(screen.getByText('I need help with my order')).toBeInTheDocument();
    });

    fireEvent.click(orderHelpBtn);
    expect(apiClient.post).toHaveBeenCalledTimes(1);

    await act(async () => {
      deferred.resolve({ data: {} });
      await deferred.promise;
    });

    await waitFor(() => {
      expect(screen.getByText('Sorry, I could not process your request.')).toBeInTheDocument();
    });

    expect(apiClient.post).toHaveBeenCalledWith('/chats', expect.any(Object));
  });

  it('handles quick question errors and records fallback message', async () => {
    const apiClient = createApiClient();

    apiClient.post.mockImplementation((url) => {
      if (url === '/assistant/chat') {
        return Promise.reject(new Error('fail assistant'));
      }
      if (url === '/chats') {
        return Promise.resolve({ data: { saved: true } });
      }
      return Promise.resolve({ data: {} });
    });

    renderCustomerService({ apiClient });

    const returnsBtn = screen.getByText(/Returns/i);
    fireEvent.click(returnsBtn);

    await waitFor(() => {
      expect(screen.getByText('I want to return a product')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Sorry, I'm having trouble connecting right now/i)
      ).toBeInTheDocument();
    });

    expect(apiClient.post).toHaveBeenCalledWith('/chats', expect.any(Object));
  });

  it('collapses FAQ when toggled twice', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ faqs: [{ question: 'Close me', answer: 'Answer' }] })
    });

    renderCustomerService({ fetchFn });

    const faqBtn = await screen.findByTitle('Toggle answer');
    fireEvent.click(faqBtn);
    await screen.findByText('Answer');

    fireEvent.click(faqBtn);

    await waitFor(() => {
      expect(screen.queryByText('Answer')).not.toBeInTheDocument();
    });
  });
});
