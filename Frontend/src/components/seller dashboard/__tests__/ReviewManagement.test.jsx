import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReviewManagement from '../ReviewManagement';
import api from '../../../../services/axios';

vi.mock('../../../../services/axios');

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
    
    await waitFor(() => {
      expect(screen.getByText(/Reviews/i)).toBeInTheDocument();
    });
  });

  it('displays product reviews', async () => {
    renderReviewManagement();
    
    await waitFor(() => {
      expect(screen.getByText('Great product!')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('handles back button', () => {
    renderReviewManagement();
    
    const backButton = screen.getByText(/Back/i);
    fireEvent.click(backButton);
    
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('responds to review', async () => {
    renderReviewManagement();
    
    await waitFor(() => {
      const respondButton = screen.getByText(/Respond/i);
      fireEvent.click(respondButton);
    });
    
    const responseInput = screen.getByPlaceholderText(/Your response/i);
    fireEvent.change(responseInput, { target: { value: 'Thank you!' } });
    
    const submitButton = screen.getByText(/Submit/i);
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(api.post).toHaveBeenCalled();
    });
  });
});
