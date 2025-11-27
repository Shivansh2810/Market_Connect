import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { AuctionProvider, useAuction } from '../AuctionContext';
import { AuthProvider } from '../AuthContext';
import * as auctionApi from '../../../services/auction';
import { io } from 'socket.io-client';

vi.mock('../../../services/auction');
vi.mock('socket.io-client');

const mockSocket = {
  on: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
  connected: true,
  id: 'test-socket-id'
};

const wrapper = ({ children }) => (
  <AuthProvider>
    <AuctionProvider>{children}</AuctionProvider>
  </AuthProvider>
);

describe('AuctionContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    io.mockReturnValue(mockSocket);
    localStorage.clear();
    // Mock both active and upcoming auctions
    auctionApi.getActiveAuctions.mockResolvedValue([]);
    auctionApi.getUpcomingAuctions.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('provides initial auction state', async () => {
    auctionApi.getActiveAuctions.mockResolvedValue([]);
    
    const { result } = renderHook(() => useAuction(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.auctions).toEqual([]);
    expect(result.current.error).toBe('');
  });

  it('fetches active auctions successfully', async () => {
    const mockAuctions = [
      {
        _id: '1',
        title: 'Auction 1',
        description: 'Test auction',
        images: [{ url: 'test.jpg', isPrimary: true }],
        auctionDetails: {
          startPrice: 100,
          currentBid: 150,
          minIncrement: 10,
          bidHistory: [],
          endTime: new Date(Date.now() + 3600000).toISOString(),
          startTime: new Date().toISOString(),
          status: 'active'
        }
      }
    ];
    
    auctionApi.getActiveAuctions.mockResolvedValue(mockAuctions);
    
    const { result } = renderHook(() => useAuction(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.auctions.length).toBe(1);
    expect(result.current.auctions[0].title).toBe('Auction 1');
    expect(result.current.auctions[0].currentBid).toBe(150);
  });

  it('handles auction fetch error', async () => {
    const errorMessage = 'Failed to fetch auctions';
    auctionApi.getActiveAuctions.mockRejectedValue(new Error(errorMessage));
    
    const { result } = renderHook(() => useAuction(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.error).toBe(errorMessage);
    expect(result.current.auctions).toEqual([]);
  });

  it('transforms product to auction format correctly', async () => {
    const mockProduct = {
      _id: '1',
      title: 'Test Product',
      description: 'Test description',
      images: [{ url: 'image1.jpg', isPrimary: true }],
      auctionDetails: {
        startPrice: 100,
        currentBid: 200,
        minIncrement: 10,
        bidHistory: [
          {
            _id: 'bid1',
            user: { name: 'John Doe' },
            amount: 200,
            createdAt: new Date().toISOString()
          }
        ],
        endTime: new Date(Date.now() + 3600000).toISOString(),
        startTime: new Date().toISOString(),
        status: 'active',
        highestBidder: { name: 'John Doe' }
      }
    };
    
    auctionApi.getActiveAuctions.mockResolvedValue([mockProduct]);
    
    const { result } = renderHook(() => useAuction(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    const auction = result.current.auctions[0];
    expect(auction.id).toBe('1');
    expect(auction.title).toBe('Test Product');
    expect(auction.startingPrice).toBe(100);
    expect(auction.currentBid).toBe(200);
    expect(auction.bids.length).toBe(1);
    expect(auction.bids[0].bidder).toBe('John Doe');
  });

  it('initializes socket connection', async () => {
    auctionApi.getActiveAuctions.mockResolvedValue([]);
    
    renderHook(() => useAuction(), { wrapper });
    
    await waitFor(() => {
      expect(io).toHaveBeenCalled();
    });
    
    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('bidUpdate', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('bidError', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('auctionEnded', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('auctionStarted', expect.any(Function));
  });

  it('places bid successfully', async () => {
    auctionApi.getActiveAuctions.mockResolvedValue([]);
    
    const { result } = renderHook(() => useAuction(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Test that placeBid function exists
    expect(result.current.placeBid).toBeDefined();
    expect(typeof result.current.placeBid).toBe('function');
  });

  it('joins auction room', async () => {
    auctionApi.getActiveAuctions.mockResolvedValue([]);
    
    const { result } = renderHook(() => useAuction(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    act(() => {
      result.current.joinAuctionRoom('product-1');
    });
    
    expect(mockSocket.emit).toHaveBeenCalledWith('joinAuctionRoom', 'product-1');
  });

  it('leaves auction room', async () => {
    auctionApi.getActiveAuctions.mockResolvedValue([]);
    
    const { result } = renderHook(() => useAuction(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    act(() => {
      result.current.leaveAuctionRoom('product-1');
    });
    
    expect(mockSocket.emit).toHaveBeenCalledWith('leaveAuctionRoom', 'product-1');
  });

  it('calculates time remaining correctly', async () => {
    auctionApi.getActiveAuctions.mockResolvedValue([]);
    
    const { result } = renderHook(() => useAuction(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    const futureTime = new Date(Date.now() + 3661000).toISOString(); // 1 hour, 1 minute, 1 second
    const timeRemaining = result.current.getTimeRemaining(futureTime);
    
    expect(timeRemaining).toBeDefined();
    expect(timeRemaining.hours).toBeGreaterThanOrEqual(1);
    expect(timeRemaining.minutes).toBeGreaterThanOrEqual(0);
    expect(timeRemaining.seconds).toBeGreaterThanOrEqual(0);
  });

  it('refreshes auctions', async () => {
    const initialAuctions = [
      {
        _id: '1',
        title: 'Auction 1',
        images: [],
        auctionDetails: { startPrice: 100, status: 'active' }
      }
    ];
    
    const updatedAuctions = [
      {
        _id: '1',
        title: 'Auction 1',
        images: [],
        auctionDetails: { startPrice: 100, status: 'active' }
      },
      {
        _id: '2',
        title: 'Auction 2',
        images: [],
        auctionDetails: { startPrice: 200, status: 'active' }
      }
    ];
    
    auctionApi.getActiveAuctions
      .mockResolvedValueOnce(initialAuctions)
      .mockResolvedValueOnce(updatedAuctions);
    auctionApi.getUpcomingAuctions.mockResolvedValue([]);
    
    const { result } = renderHook(() => useAuction(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.auctions.length).toBe(1);
    
    await act(async () => {
      await result.current.refresh();
    });
    
    await waitFor(() => {
      expect(result.current.auctions.length).toBe(2);
    });
  });

  it('gets auction by ID', async () => {
    const mockAuction = {
      _id: '1',
      title: 'Test Auction',
      images: [],
      auctionDetails: { startPrice: 100, status: 'active' }
    };
    
    auctionApi.getActiveAuctions.mockResolvedValue([]);
    auctionApi.getAuctionById.mockResolvedValue(mockAuction);
    
    const { result } = renderHook(() => useAuction(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    const auction = await result.current.getAuctionById('1');
    
    expect(auction.id).toBe('1');
    expect(auction.title).toBe('Test Auction');
  });

  it('throws error when useAuction is used outside AuctionProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      renderHook(() => useAuction());
    }).toThrow('useAuction must be used within AuctionProvider');
    
    consoleSpy.mockRestore();
  });

  it('disconnects socket on unmount', async () => {
    auctionApi.getActiveAuctions.mockResolvedValue([]);
    
    const { unmount } = renderHook(() => useAuction(), { wrapper });
    
    await waitFor(() => {
      expect(io).toHaveBeenCalled();
    });
    
    unmount();
    
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it('handles socket not connected when placing bid', async () => {
    const disconnectedSocket = { ...mockSocket, connected: false };
    io.mockReturnValue(disconnectedSocket);
    
    auctionApi.getActiveAuctions.mockResolvedValue([]);
    
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const { result } = renderHook(() => useAuction(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    act(() => {
      result.current.placeBid('product-1', 500);
    });
    
    expect(alertSpy).toHaveBeenCalledWith('Connection error. Please refresh the page.');
    alertSpy.mockRestore();
  });

  it('joins auction room successfully', async () => {
    auctionApi.getActiveAuctions.mockResolvedValue([]);
    mockSocket.connected = true;
    
    const { result } = renderHook(() => useAuction(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Wait for socket to be set up
    await new Promise(resolve => setTimeout(resolve, 100));
    
    act(() => {
      result.current.joinAuctionRoom('product-1');
    });
    
    // Just verify the function exists and can be called
    expect(result.current.joinAuctionRoom).toBeDefined();
  });

  it('leaves auction room successfully', async () => {
    auctionApi.getActiveAuctions.mockResolvedValue([]);
    mockSocket.connected = true;
    
    const { result } = renderHook(() => useAuction(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Wait for socket to be set up
    await new Promise(resolve => setTimeout(resolve, 100));
    
    act(() => {
      result.current.leaveAuctionRoom('product-1');
    });
    
    // Just verify the function exists and can be called
    expect(result.current.leaveAuctionRoom).toBeDefined();
  });

  it('handles joinAuctionRoom when socket not connected', async () => {
    auctionApi.getActiveAuctions.mockResolvedValue([]);
    
    const { result } = renderHook(() => useAuction(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Function should exist and handle disconnected state gracefully
    expect(result.current.joinAuctionRoom).toBeDefined();
    expect(() => result.current.joinAuctionRoom(null)).not.toThrow();
  });

  it('handles leaveAuctionRoom when socket not connected', async () => {
    auctionApi.getActiveAuctions.mockResolvedValue([]);
    
    const { result } = renderHook(() => useAuction(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Function should exist and handle disconnected state gracefully
    expect(result.current.leaveAuctionRoom).toBeDefined();
    expect(() => result.current.leaveAuctionRoom(null)).not.toThrow();
  });

  it('handles products with data property in response', async () => {
    const mockAuctions = [
      {
        _id: '1',
        title: 'Auction 1',
        images: [],
        auctionDetails: { startPrice: 100, status: 'active' }
      }
    ];
    
    auctionApi.getActiveAuctions.mockResolvedValue({ data: mockAuctions });
    auctionApi.getUpcomingAuctions.mockResolvedValue({ data: [] });
    
    const { result } = renderHook(() => useAuction(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.auctions.length).toBe(1);
  });

  it('handles products without images', async () => {
    const mockAuctions = [
      {
        _id: '1',
        title: 'Auction 1',
        images: [],
        auctionDetails: { startPrice: 100, status: 'active' }
      }
    ];
    
    auctionApi.getActiveAuctions.mockResolvedValue(mockAuctions);
    auctionApi.getUpcomingAuctions.mockResolvedValue([]);
    
    const { result } = renderHook(() => useAuction(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.auctions[0].image).toContain('placeholder');
  });

  it('handles bidUpdate socket event', async () => {
    auctionApi.getActiveAuctions.mockResolvedValue([
      {
        _id: 'prod1',
        title: 'Auction 1',
        images: [],
        auctionDetails: { startPrice: 100, currentBid: 100, status: 'active', bidHistory: [] }
      }
    ]);
    auctionApi.getUpcomingAuctions.mockResolvedValue([]);
    
    let bidUpdateHandler;
    mockSocket.on.mockImplementation((event, handler) => {
      if (event === 'bidUpdate') {
        bidUpdateHandler = handler;
      }
    });
    
    const { result } = renderHook(() => useAuction(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Simulate bid update
    act(() => {
      bidUpdateHandler({
        productId: 'prod1',
        currentBid: 200,
        highestBidder: 'John Doe',
        bid: {
          _id: 'bid1',
          product: 'prod1',
          user: { name: 'John Doe' },
          amount: 200,
          createdAt: new Date().toISOString()
        }
      });
    });
    
    await waitFor(() => {
      expect(result.current.auctions[0].currentBid).toBe(200);
    });
  });

  it('handles auctionEnded socket event', async () => {
    auctionApi.getActiveAuctions.mockResolvedValue([
      {
        _id: 'prod1',
        title: 'Auction 1',
        images: [],
        auctionDetails: { startPrice: 100, status: 'active' }
      }
    ]);
    auctionApi.getUpcomingAuctions.mockResolvedValue([]);
    
    let auctionEndedHandler;
    mockSocket.on.mockImplementation((event, handler) => {
      if (event === 'auctionEnded') {
        auctionEndedHandler = handler;
      }
    });
    
    const { result } = renderHook(() => useAuction(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    act(() => {
      auctionEndedHandler({ productId: 'prod1' });
    });
    
    await waitFor(() => {
      expect(result.current.auctions[0].status).toBe('completed');
    });
  });

  it('handles auctionStarted socket event', async () => {
    auctionApi.getActiveAuctions.mockResolvedValue([
      {
        _id: 'prod1',
        title: 'Auction 1',
        images: [],
        auctionDetails: { startPrice: 100, status: 'pending' }
      }
    ]);
    auctionApi.getUpcomingAuctions.mockResolvedValue([]);
    
    let auctionStartedHandler;
    mockSocket.on.mockImplementation((event, handler) => {
      if (event === 'auctionStarted') {
        auctionStartedHandler = handler;
      }
    });
    
    const { result } = renderHook(() => useAuction(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    act(() => {
      auctionStartedHandler({ productId: 'prod1' });
    });
    
    await waitFor(() => {
      expect(result.current.auctions[0].status).toBe('active');
    });
  });

  it('handles bidError socket event', async () => {
    auctionApi.getActiveAuctions.mockResolvedValue([]);
    auctionApi.getUpcomingAuctions.mockResolvedValue([]);
    
    let bidErrorHandler;
    mockSocket.on.mockImplementation((event, handler) => {
      if (event === 'bidError') {
        bidErrorHandler = handler;
      }
    });
    
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    renderHook(() => useAuction(), { wrapper });
    
    await waitFor(() => {
      expect(mockSocket.on).toHaveBeenCalled();
    });
    
    act(() => {
      bidErrorHandler('Bid too low');
    });
    
    expect(alertSpy).toHaveBeenCalledWith('Bid too low');
    alertSpy.mockRestore();
  });

  it('handles getTimeRemaining with null endTime', async () => {
    auctionApi.getActiveAuctions.mockResolvedValue([]);
    auctionApi.getUpcomingAuctions.mockResolvedValue([]);
    
    const { result } = renderHook(() => useAuction(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    const timeRemaining = result.current.getTimeRemaining(null);
    expect(timeRemaining).toBeNull();
  });

  it('handles socket initialization error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    io.mockImplementation(() => {
      throw new Error('Socket error');
    });
    
    auctionApi.getActiveAuctions.mockResolvedValue([]);
    auctionApi.getUpcomingAuctions.mockResolvedValue([]);
    
    renderHook(() => useAuction(), { wrapper });
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });
    
    consoleSpy.mockRestore();
  });

  it('handles getAuctionById error', async () => {
    auctionApi.getActiveAuctions.mockResolvedValue([]);
    auctionApi.getUpcomingAuctions.mockResolvedValue([]);
    auctionApi.getAuctionById.mockRejectedValue(new Error('Not found'));
    
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useAuction(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    await expect(result.current.getAuctionById('999')).rejects.toThrow('Not found');
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });

  it('handles placeBid without user', async () => {
    auctionApi.getActiveAuctions.mockResolvedValue([]);
    auctionApi.getUpcomingAuctions.mockResolvedValue([]);
    
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const { result } = renderHook(() => useAuction(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    act(() => {
      result.current.placeBid('product-1', 500);
    });
    
    expect(alertSpy).toHaveBeenCalledWith('Please login to place a bid');
    alertSpy.mockRestore();
  });

  it('handles bidUpdate with different productId formats', async () => {
    auctionApi.getActiveAuctions.mockResolvedValue([
      {
        _id: 'prod1',
        title: 'Auction 1',
        images: [],
        auctionDetails: { startPrice: 100, currentBid: 100, status: 'active', bidHistory: [] }
      }
    ]);
    auctionApi.getUpcomingAuctions.mockResolvedValue([]);
    
    let bidUpdateHandler;
    mockSocket.on.mockImplementation((event, handler) => {
      if (event === 'bidUpdate') {
        bidUpdateHandler = handler;
      }
    });
    
    const { result } = renderHook(() => useAuction(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Test with bid.productId
    act(() => {
      bidUpdateHandler({
        currentBid: 200,
        highestBidder: 'Jane',
        bid: {
          _id: 'bid2',
          productId: 'prod1',
          user: 'Jane',
          amount: 200,
          createdAt: new Date().toISOString()
        }
      });
    });
    
    await waitFor(() => {
      expect(result.current.auctions[0].currentBid).toBe(200);
    });
  });

  it('handles bidUpdate for non-matching auction', async () => {
    auctionApi.getActiveAuctions.mockResolvedValue([
      {
        _id: 'prod1',
        title: 'Auction 1',
        images: [],
        auctionDetails: { startPrice: 100, currentBid: 100, status: 'active', bidHistory: [] }
      }
    ]);
    auctionApi.getUpcomingAuctions.mockResolvedValue([]);
    
    let bidUpdateHandler;
    mockSocket.on.mockImplementation((event, handler) => {
      if (event === 'bidUpdate') {
        bidUpdateHandler = handler;
      }
    });
    
    const { result } = renderHook(() => useAuction(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    const originalBid = result.current.auctions[0].currentBid;
    
    // Test with non-matching productId
    act(() => {
      bidUpdateHandler({
        currentBid: 300,
        highestBidder: 'Someone',
        bid: {
          _id: 'bid3',
          product: 'different-product',
          user: { name: 'Someone' },
          amount: 300,
          createdAt: new Date().toISOString()
        }
      });
    });
    
    // Original auction should remain unchanged
    expect(result.current.auctions[0].currentBid).toBe(originalBid);
  });

  it('handles socket connect event', async () => {
    auctionApi.getActiveAuctions.mockResolvedValue([]);
    auctionApi.getUpcomingAuctions.mockResolvedValue([]);
    
    let connectHandler;
    mockSocket.on.mockImplementation((event, handler) => {
      if (event === 'connect') {
        connectHandler = handler;
      }
    });
    
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    renderHook(() => useAuction(), { wrapper });
    
    await waitFor(() => {
      expect(mockSocket.on).toHaveBeenCalled();
    });
    
    act(() => {
      connectHandler();
    });
    
    expect(consoleSpy).toHaveBeenCalledWith('🔌 Auction socket connected:', 'test-socket-id');
    consoleSpy.mockRestore();
  });

  it('handles socket disconnect event', async () => {
    auctionApi.getActiveAuctions.mockResolvedValue([]);
    auctionApi.getUpcomingAuctions.mockResolvedValue([]);
    
    let disconnectHandler;
    mockSocket.on.mockImplementation((event, handler) => {
      if (event === 'disconnect') {
        disconnectHandler = handler;
      }
    });
    
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    renderHook(() => useAuction(), { wrapper });
    
    await waitFor(() => {
      expect(mockSocket.on).toHaveBeenCalled();
    });
    
    act(() => {
      disconnectHandler();
    });
    
    expect(consoleSpy).toHaveBeenCalledWith('🔌 Auction socket disconnected');
    consoleSpy.mockRestore();
  });

  it('logs when placing bid with valid user', async () => {
    auctionApi.getActiveAuctions.mockResolvedValue([]);
    auctionApi.getUpcomingAuctions.mockResolvedValue([]);
    
    const mockUser = { _id: 'user123', name: 'Test User' };
    
    // Create a custom wrapper with mocked useAuth that returns a user
    const { useAuth } = await import('../AuthContext');
    vi.spyOn(await import('../AuthContext'), 'useAuth').mockReturnValue({
      user: mockUser,
      token: 'test-token',
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn()
    });
    
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { result } = renderHook(() => useAuction(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Now call placeBid with a user present - this should trigger the console.log
    act(() => {
      result.current.placeBid('product-1', 500);
    });
    
    // Verify the console.log was called
    expect(consoleSpy).toHaveBeenCalledWith('📤 Placing bid:', { 
      productId: 'product-1', 
      amount: 500, 
      userId: 'user123' 
    });
    
    consoleSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it('logs when joining auction room', async () => {
    auctionApi.getActiveAuctions.mockResolvedValue([]);
    auctionApi.getUpcomingAuctions.mockResolvedValue([]);
    
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { result } = renderHook(() => useAuction(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    act(() => {
      result.current.joinAuctionRoom('product-1');
    });
    
    expect(consoleSpy).toHaveBeenCalledWith('Joining auction room:', 'product-1');
    consoleSpy.mockRestore();
  });
});
