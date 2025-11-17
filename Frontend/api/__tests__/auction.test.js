import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getActiveAuctions, getAuctionById, createAuction, cancelAuction } from '../auction';
import api from '../axios';

// Mock the API
vi.mock('../axios');

describe('Auction API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getActiveAuctions', () => {
    it('fetches active auctions successfully', async () => {
      const mockAuctions = {
        success: true,
        data: [
          {
            _id: '1',
            title: 'Auction 1',
            auctionDetails: {
              startPrice: 1000,
              currentBid: 1200,
              status: 'Active'
            }
          }
        ]
      };
      
      api.get.mockResolvedValueOnce({ data: mockAuctions });
      
      const result = await getActiveAuctions();
      
      expect(api.get).toHaveBeenCalledWith('/auctions');
      expect(result).toEqual(mockAuctions);
    });

    it('handles error when fetching auctions', async () => {
      const mockError = new Error('Network error');
      api.get.mockRejectedValueOnce(mockError);
      
      await expect(getActiveAuctions()).rejects.toThrow('Network error');
    });
  });

  describe('getAuctionById', () => {
    it('fetches auction by ID successfully', async () => {
      const mockAuction = {
        success: true,
        data: {
          _id: '123',
          title: 'Test Auction',
          auctionDetails: {
            startPrice: 1000,
            currentBid: 1500
          }
        }
      };
      
      api.get.mockResolvedValueOnce({ data: mockAuction });
      
      const result = await getAuctionById('123');
      
      expect(api.get).toHaveBeenCalledWith('/auctions/123');
      expect(result).toEqual(mockAuction.data);
    });

    it('handles error when auction not found', async () => {
      const mockError = {
        response: {
          status: 404,
          data: { message: 'Auction not found' }
        }
      };
      
      api.get.mockRejectedValueOnce(mockError);
      
      await expect(getAuctionById('999')).rejects.toEqual(mockError);
    });
  });

  describe('createAuction', () => {
    it('creates auction successfully', async () => {
      const auctionData = {
        productId: '123',
        startTime: '2024-12-20T10:00:00Z',
        endTime: '2024-12-20T18:00:00Z',
        startPrice: 1000
      };
      
      const mockResponse = {
        success: true,
        message: 'Auction created successfully',
        product: { _id: '123', isAuction: true }
      };
      
      api.post.mockResolvedValueOnce({ data: mockResponse });
      
      const result = await createAuction(auctionData);
      
      expect(api.post).toHaveBeenCalledWith('/auctions', auctionData);
      expect(result).toEqual(mockResponse);
    });

    it('handles error when creating auction', async () => {
      const mockError = {
        response: {
          status: 400,
          data: { message: 'Product already in auction' }
        }
      };
      
      api.post.mockRejectedValueOnce(mockError);
      
      await expect(createAuction({})).rejects.toEqual(mockError);
    });
  });

  describe('cancelAuction', () => {
    it('cancels auction successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Auction cancelled'
      };
      
      api.delete.mockResolvedValueOnce({ data: mockResponse });
      
      const result = await cancelAuction('123');
      
      expect(api.delete).toHaveBeenCalledWith('/auctions/123');
      expect(result).toEqual(mockResponse);
    });

    it('handles error when cancelling auction', async () => {
      const mockError = {
        response: {
          status: 404,
          data: { message: 'Auction not found' }
        }
      };
      
      api.delete.mockRejectedValueOnce(mockError);
      
      await expect(cancelAuction('999')).rejects.toEqual(mockError);
    });
  });
});
