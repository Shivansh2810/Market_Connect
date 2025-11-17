import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ResetPassword from '../ResetPassword';
import api from '../../../../api/axios';

vi.mock('../../../../api/axios');

const mockNavigate = vi.fn();
const mockParams = { token: 'reset-token-123' };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
  };
});

const renderResetPassword = () => {
  return render(
    <BrowserRouter>
      <ResetPassword />
    </BrowserRouter>
  );
};

describe('ResetPassword Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders reset password form', () => {
    renderResetPassword();
    
    expect(screen.getByText(/Reset Password/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/New Password/i)).toBeInTheDocument();
  });

  it('validates password length', async () => {
    renderResetPassword();
    
    const passwordInput = screen.getByPlaceholderText(/New Password/i);
    fireEvent.change(passwordInput, { target: { value: '123' } });
    
    const submitButton = screen.getByText(/Reset Password/i);
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument();
    });
  });

  it('validates password match', async () => {
    renderResetPassword();
    
    const passwordInput = screen.getByPlaceholderText(/New Password/i);
    const confirmInput = screen.getByPlaceholderText(/Confirm Password/i);
    
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    fireEvent.change(confirmInput, { target: { value: 'Password456!' } });
    
    const submitButton = screen.getByText(/Reset Password/i);
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('successfully resets password', async () => {
    api.post.mockResolvedValue({ data: { success: true } });
    
    renderResetPassword();
    
    const passwordInput = screen.getByPlaceholderText(/New Password/i);
    const confirmInput = screen.getByPlaceholderText(/Confirm Password/i);
    
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    fireEvent.change(confirmInput, { target: { value: 'Password123!' } });
    
    const submitButton = screen.getByText(/Reset Password/i);
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/users/reset-password/reset-token-123', {
        password: 'Password123!'
      });
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('handles reset error', async () => {
    api.post.mockRejectedValue({
      response: { data: { message: 'Invalid token' } }
    });
    
    renderResetPassword();
    
    const passwordInput = screen.getByPlaceholderText(/New Password/i);
    const confirmInput = screen.getByPlaceholderText(/Confirm Password/i);
    
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    fireEvent.change(confirmInput, { target: { value: 'Password123!' } });
    
    const submitButton = screen.getByText(/Reset Password/i);
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Invalid token/i)).toBeInTheDocument();
    });
  });
});
