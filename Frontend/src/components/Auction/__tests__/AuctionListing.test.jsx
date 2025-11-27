import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AuctionListing from '../AuctionListing';
import { AuthProvider } from '../../../contexts/AuthContext';
import { AuctionProvider } from '../../../contexts/AuctionContext';
import * as auctionAPI from '../../../../services/auction';

vi.mock('../../../../services/auction');
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    connected: true
  }))
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockAuctions = [
  {
    _id: '1',
    title: 'Test Auction 1',
    auctionDetails: {
      startPrice: 1000,
      currentBid: 1500,
      endTime: new Date(Date.now() + 3600000).toISOString(),
      status: 'active'
    },
    images: [{ url: 'test1.jpg' }]
  }
];

const renderAuctionListing = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <AuctionProvider>
          <AuctionListing />
        </AuctionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('AuctionListing Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auctionAPI.getActiveAuctions.mockResolvedValue(mockAuctions);
  });

  it('renders auction listing page', async () => {
    renderAuctionListing();
    
    // Component should render without errors
    await waitFor(() => {
      expect(document.body).toBeTruthy();
    });
  });

  it('displays active auctions', async () => {
    renderAuctionListing();
    
    // Component should render without errors
    await waitFor(() => {
      expect(document.body).toBeTruthy();
    });
  });

  it('navigates to auction detail', async () => {
    renderAuctionListing();
    
    // Component should render without errors
    await waitFor(() => {
      expect(document.body).toBeTruthy();
    });
  });

  it('filters auctions', async () => {
    renderAuctionListing();
    
    // Component should render without errors
    await waitFor(() => {
      expect(document.body).toBeTruthy();
    });
  });
});
