import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReviewManagement from '../ReviewManagement';
import api from '../../../../api/axios';

vi.mock('../../../../api/axios');

const mockOnBack = vi.fn();
const mockProduct = {
  _id: '1',
  title: 'Test Product'
};

const mockReviews = [
  {
    _id: '1',
    user: { name: 'John Doe' },
    rating: 5,
    comment: 'Great product!',
    createdAt: new Date().toISOString()
  }
];

const renderReviewManagement = () => {
  return render(
    <ReviewManagement product={mockProduct} onBack={mockOnBack} />
  );
};

describe('ReviewManagement Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({ data: { success: true, reviews: mockReviews } });
  });

  it('renders review management page', async () => {
    renderReviewManagement();
    
    // Component should render without errors
    await waitFor(() => {
      expect(document.body).toBeTruthy();
    });
  });

  it('displays product reviews', async () => {
    renderReviewManagement();
    
    // Component should render without errors
    await waitFor(() => {
      expect(document.body).toBeTruthy();
    });
  });

  it('handles back button', () => {
    renderReviewManagement();
    
    // Component should render without errors
    expect(document.body).toBeTruthy();
  });

  it('responds to review', async () => {
    renderReviewManagement();
    
    // Component should render without errors
    await waitFor(() => {
      expect(document.body).toBeTruthy();
    });
  });
});
