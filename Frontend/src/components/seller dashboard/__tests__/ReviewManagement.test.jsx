import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReviewManagement from '../ReviewManagement';
import api from '../../../../services/axios';

vi.mock('../../../../services/axios');

const mockOnBack = vi.fn();
const defaultProduct = {
  _id: '1',
  title: 'Test Product',
};

const renderReviewManagement = (product = defaultProduct) =>
  render(<ReviewManagement product={product} onBack={mockOnBack} />);

describe('ReviewManagement Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnBack.mockReset();
  });

  it('renders review management page', async () => {
    const reviews = [
      {
        _id: '1',
        rating: 5,
        comment: 'Great product!',
        createdAt: '2025-01-01T06:30:00.000Z',
      },
      {
        _id: '2',
        rating: 4,
        comment: 'Solid overall',
        createdAt: '2025-01-02T09:15:00.000Z',
      },
    ];

    api.get.mockResolvedValueOnce({ data: { success: true, data: reviews } });

    renderReviewManagement();

    await waitFor(() => {
      expect(screen.getByText('Great product!')).toBeInTheDocument();
    });

    const averageStat = screen.getByText('Average Rating').closest('.stat-item');
    expect(averageStat).not.toBeNull();
    expect(averageStat?.textContent).toContain('4.5');

    const totalStat = screen.getByText('Total Reviews').closest('.stat-item');
    expect(totalStat).not.toBeNull();
    expect(totalStat?.textContent).toContain('2');

    expect(screen.getByText('Solid overall')).toBeInTheDocument();
  });

  it('displays product reviews with metadata and status badges', async () => {
    const detailedReviews = [
      {
        _id: 'd1',
        rating: 3,
        comment: '',
        createdAt: null,
        status: 'hidden',
        orderId: 'order-123',
        images: [{ url: 'https://example.com/review.png' }],
      },
      {
        _id: 'd2',
        rating: 2,
        comment: 'Needs work',
        createdAt: '2025-02-10T10:00:00.000Z',
        status: 'reported',
      },
    ];

    api.get.mockResolvedValueOnce({ data: { success: true, data: detailedReviews } });

    renderReviewManagement();

    await waitFor(() => {
      expect(screen.getByText('No comment provided.')).toBeInTheDocument();
    });

    const reviewCards = Array.from(document.querySelectorAll('.review-card'));
    expect(reviewCards.length).toBeGreaterThanOrEqual(2);

    expect(screen.getByText('Verified Purchase')).toBeInTheDocument();
    expect(screen.getByAltText('Review image 1')).toBeInTheDocument();
    expect(screen.getByText('Hidden')).toBeInTheDocument();
    expect(screen.getByText('Reported')).toBeInTheDocument();
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('handles rating filters and back navigation', async () => {
    const mixedReviews = [
      { _id: 'r1', rating: 5, comment: 'Fantastic', createdAt: '2025-03-01T12:00:00.000Z' },
      { _id: 'r2', rating: 3, comment: 'Average', createdAt: '2025-03-02T12:00:00.000Z' },
    ];

    api.get.mockResolvedValueOnce({ data: { success: true, data: mixedReviews } });

    renderReviewManagement();

    await waitFor(() => {
      expect(screen.getByText('Fantastic')).toBeInTheDocument();
    });

    const ratingCounts = Array.from(document.querySelectorAll('.rating-count')).map(
      (el) => el.textContent
    );
    expect(ratingCounts.filter((count) => count === '1').length).toBeGreaterThanOrEqual(1);

    await userEvent.click(screen.getByRole('button', { name: /3/i }));
    expect(screen.getByText('Average')).toBeInTheDocument();
    expect(screen.queryByText('Fantastic')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /All/i }));
    expect(screen.getByText('Fantastic')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Back to Reviews/i }));
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('surfaces errors when fetching reviews fails', async () => {
    api.get.mockRejectedValueOnce(new Error('Network down'));

    renderReviewManagement(null);

    expect(await screen.findByText('Loading reviews...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Failed to load reviews')).toBeInTheDocument();
    });

    expect(api.get).toHaveBeenCalledWith('/reviews/me/seller/stats');
    expect(screen.queryByText('No reviews found')).not.toBeInTheDocument();
  });
});
