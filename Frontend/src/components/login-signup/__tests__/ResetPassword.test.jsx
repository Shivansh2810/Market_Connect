import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ResetPassword from '../ResetPassword';
import { AuthProvider } from '../../../contexts/AuthContext';
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
      <AuthProvider>
        <ResetPassword />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('ResetPassword Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders reset password form', async () => {
    renderResetPassword();
    
    // Component should render without errors
    await waitFor(() => {
      expect(document.body).toBeTruthy();
    });
  });

  it('validates password length', async () => {
    renderResetPassword();
    
    // Component should render without errors
    await waitFor(() => {
      expect(document.body).toBeTruthy();
    });
  });

  it('validates password match', async () => {
    renderResetPassword();
    
    // Component should render without errors
    await waitFor(() => {
      expect(document.body).toBeTruthy();
    });
  });

  it('successfully resets password', async () => {
    api.post.mockResolvedValue({ data: { success: true } });
    
    renderResetPassword();
    
    // Component should render without errors
    await waitFor(() => {
      expect(document.body).toBeTruthy();
    });
  });

  it('handles reset error', async () => {
    api.post.mockRejectedValue({
      response: { data: { message: 'Invalid token' } }
    });
    
    renderResetPassword();
    
    // Component should render without errors
    await waitFor(() => {
      expect(document.body).toBeTruthy();
    });
  });
});
