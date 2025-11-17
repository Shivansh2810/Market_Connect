import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { AuctionProvider, useAuction } from '../AuctionContext';
import { AuthProvider } from '../AuthContext';
import * as auctionApi from '../../../api/auction';
import { io } from 'socket.io-client';

vi.mock('../../../api/auction');
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
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('provides initial auction state', () => {
    auctionApi.getActiveAuctions.mockResolvedValue([]);
    
    const { result } = renderHook(() => useAuction(), { wrapper });
    
    expect(result.current.auctions).toEqual([]);
    expect(result.current.loading).toBe(false);
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
    
    act(() => {
      result.current.placeBid('product-1', 500);
    });
    
    expect(mockSocket.emit).toHaveBeenCalledWith('placeBid', {
      productId: 'product-1',
      bidAmount: 500,
      userId: undefined
    });
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
});
