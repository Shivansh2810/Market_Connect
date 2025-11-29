import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import AuctionListing from '../AuctionListing';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockUseAuction = vi.fn();
vi.mock('../../../contexts/AuctionContext', () => ({
  useAuction: () => mockUseAuction(),
}));

describe('AuctionListing Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();
    mockUseAuction.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const baseContext = {
    auctions: [],
    upcomingAuctions: [],
    getTimeRemaining: vi.fn(),
  };

  it('shows empty state when no auctions are available', () => {
    mockUseAuction.mockReturnValue({ ...baseContext });

    render(<AuctionListing />);

    expect(screen.getByText('No Active Auctions')).toBeInTheDocument();
    const [backToDashboardButton] = screen.getAllByRole('button', { name: /Back to Dashboard/i });
    fireEvent.click(backToDashboardButton);
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('renders live auctions with urgent badge and navigates to detail', async () => {
    vi.useFakeTimers();
    const getTimeRemaining = vi.fn(() => ({
      total: 2 * 60 * 1000,
      days: 0,
      hours: 0,
      minutes: 2,
      seconds: 30,
    }));

    mockUseAuction.mockReturnValue({
      ...baseContext,
      auctions: [
        {
          id: 'live1',
          title: 'Live Auction',
          description: 'High demand item',
          image: 'live.jpg',
          currentBid: 750,
          bids: [{ id: 'b1' }, { id: 'b2' }],
          endTime: '2025-01-01T00:00:00.000Z',
          status: 'active',
        },
      ],
      getTimeRemaining,
    });

    render(<AuctionListing />);

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    const liveAuctionTitle = screen.getByText('Live Auction');

    expect(getTimeRemaining).toHaveBeenCalledWith('2025-01-01T00:00:00.000Z');

    const card = liveAuctionTitle.closest('.auction-card');
    expect(card).not.toBeNull();
    expect(card?.className).toContain('urgent');
    expect(screen.getByText('Ending Soon!')).toBeInTheDocument();
    expect(screen.getByText('2m 30s')).toBeInTheDocument();

    if (!card) throw new Error('expected auction card to exist');
    fireEvent.click(card);
    expect(mockNavigate).toHaveBeenCalledWith('/auctions/live1');
  });

  it('renders upcoming auctions with countdown and badge', async () => {
    vi.useFakeTimers();
    const getTimeRemaining = vi.fn(() => ({
      total: 30 * 60 * 1000,
      days: 0,
      hours: 0,
      minutes: 30,
      seconds: 0,
    }));

    mockUseAuction.mockReturnValue({
      ...baseContext,
      auctions: [],
      upcomingAuctions: [
        {
          id: 'up1',
          title: 'Upcoming Auction',
          description: 'Starts soon',
          image: 'upcoming.jpg',
          startingPrice: 500,
          startTime: '2025-02-01T10:00:00.000Z',
          status: 'pending',
        },
      ],
      getTimeRemaining,
    });

    render(<AuctionListing />);

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    const upcomingAuctionTitle = screen.getByText('Upcoming Auction');

    expect(getTimeRemaining).toHaveBeenCalledWith('2025-02-01T10:00:00.000Z');
    expect(screen.getByText('Starting Soon!')).toBeInTheDocument();
    expect(screen.getByText('30m 0s')).toBeInTheDocument();

    fireEvent.click(upcomingAuctionTitle);
    expect(mockNavigate).toHaveBeenCalledWith('/auctions/up1');
  });

  it('falls back to ended label when timer expires', async () => {
    vi.useFakeTimers();
    const getTimeRemaining = vi.fn(() => ({
      total: -2000,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    }));

    mockUseAuction.mockReturnValue({
      ...baseContext,
      auctions: [
        {
          id: 'ended1',
          title: 'Ended Auction',
          description: 'Already finished',
          image: 'ended.jpg',
          currentBid: 1200,
          bids: [],
          endTime: '2024-12-01T12:00:00.000Z',
          status: 'active',
        },
      ],
      getTimeRemaining,
    });

    render(<AuctionListing />);

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText('Ended Auction')).toBeInTheDocument();

    expect(getTimeRemaining).toHaveBeenCalledWith('2024-12-01T12:00:00.000Z');
    expect(screen.getAllByText('Ended').length).toBeGreaterThan(0);
  });
});
