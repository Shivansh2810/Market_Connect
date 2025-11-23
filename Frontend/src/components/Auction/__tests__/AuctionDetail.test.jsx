import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AuctionDetail from '../AuctionDetail';
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

const mockParams = { id: '1' };
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => mockParams,
    useNavigate: () => vi.fn(),
  };
});

const mockAuction = {
  _id: '1',
  title: 'Test Auction',
  description: 'Test description',
  auctionDetails: {
    startPrice: 1000,
    currentBid: 1500,
    minIncrement: 100,
    endTime: new Date(Date.now() + 3600000).toISOString(),
    status: 'active',
    bidHistory: []
  },
  images: [{ url: 'test.jpg' }]
};

const renderAuctionDetail = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <AuctionProvider>
          <AuctionDetail />
        </AuctionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('AuctionDetail Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auctionAPI.getAuctionById.mockResolvedValue(mockAuction);
    auctionAPI.getActiveAuctions.mockResolvedValue([mockAuction]);
  });

  it('renders auction detail page', async () => {
    renderAuctionDetail();
    
    await waitFor(() => {
      expect(screen.getByText('Test Auction')).toBeInTheDocument();
    });
  });

  it('displays auction information', async () => {
    renderAuctionDetail();
    
    await waitFor(() => {
      expect(screen.getByText(/Current Bid/i)).toBeInTheDocument();
      expect(screen.getByText(/₹1,500/i)).toBeInTheDocument();
    });
  });

  it('handles bid placement', async () => {
    renderAuctionDetail();
    
    await waitFor(() => {
      const bidInput = screen.getByPlaceholderText(/Enter bid/i);
      fireEvent.change(bidInput, { target: { value: '1600' } });
      
      const bidButton = screen.getByText(/Place Bid/i);
      fireEvent.click(bidButton);
    });
    
    // Bid should be placed
    expect(screen.getByText(/Place Bid/i)).toBeInTheDocument();
  });

  it('validates bid amount', async () => {
    renderAuctionDetail();
    
    await waitFor(() => {
      const bidInput = screen.getByPlaceholderText(/Enter bid/i);
      fireEvent.change(bidInput, { target: { value: '1000' } });
      
      const bidButton = screen.getByText(/Place Bid/i);
      fireEvent.click(bidButton);
    });
    
    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/must be higher/i)).toBeInTheDocument();
    });
  });

  it('displays countdown timer', async () => {
    renderAuctionDetail();
    
    await waitFor(() => {
      expect(screen.getByText(/Time Remaining/i)).toBeInTheDocument();
    });
  });
});
