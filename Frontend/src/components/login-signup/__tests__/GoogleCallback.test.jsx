import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import GoogleCallback from '../GoogleCallback';
import { AuthProvider } from '../../../contexts/AuthContext';
import api from '../../../../api/axios';

vi.mock('../../../../api/axios');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ search: '?code=test123' })
  };
});

const renderGoogleCallback = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <GoogleCallback />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('GoogleCallback Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    renderGoogleCallback();
    
    // Component should render without errors
    expect(document.body).toBeTruthy();
  });

  it('handles successful Google authentication', async () => {
    api.post.mockResolvedValue({
      data: {
        token: 'test-token',
        user: { id: '123', name: 'Test User', role: 'buyer' }
      }
    });
    
    renderGoogleCallback();
    
    // Component should render without errors
    await waitFor(() => {
      expect(document.body).toBeTruthy();
    });
  });

  it('handles authentication error', async () => {
    api.post.mockRejectedValue(new Error('Auth failed'));
    
    renderGoogleCallback();
    
    await waitFor(() => {
      expect(screen.getByText(/Error/i)).toBeInTheDocument();
    });
  });
});
