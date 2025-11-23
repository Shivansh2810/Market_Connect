import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../axios';
import {
  createReview,
  updateReview,
  deleteReview,
  getProductReviews
} from '../review';

vi.mock('../axios');

describe('Review API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createReview', () => {
    it('should create a new review', async () => {
      const reviewData = {
        productId: '123',
        orderId: '456',
        rating: 5,
        comment: 'Great product!'
      };
      const mockResponse = { success: true, data: { _id: '789', ...reviewData } };
      api.post.mockResolvedValue({ data: mockResponse });

      const result = await createReview(reviewData);

      expect(api.post).toHaveBeenCalledWith('/reviews', reviewData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateReview', () => {
    it('should update an existing review', async () => {
      const reviewId = '123';
      const reviewData = { rating: 4, comment: 'Updated comment' };
      const mockResponse = { success: true, data: { _id: reviewId, ...reviewData } };
      api.put.mockResolvedValue({ data: mockResponse });

      const result = await updateReview(reviewId, reviewData);

      expect(api.put).toHaveBeenCalledWith(`/reviews/${reviewId}`, reviewData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteReview', () => {
    it('should delete a review', async () => {
      const reviewId = '123';
      const mockResponse = { success: true, message: 'Review deleted' };
      api.delete.mockResolvedValue({ data: mockResponse });

      const result = await deleteReview(reviewId);

      expect(api.delete).toHaveBeenCalledWith(`/reviews/${reviewId}`);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getProductReviews', () => {
    it('should fetch reviews for a product', async () => {
      const productId = '123';
      const mockReviews = {
        success: true,
        data: [
          { _id: '1', rating: 5, comment: 'Great!' },
          { _id: '2', rating: 4, comment: 'Good' }
        ]
      };
      api.get.mockResolvedValue({ data: mockReviews });

      const result = await getProductReviews(productId);

      expect(api.get).toHaveBeenCalledWith(`/reviews/product/${productId}`);
      expect(result).toEqual(mockReviews);
    });
  });
});
