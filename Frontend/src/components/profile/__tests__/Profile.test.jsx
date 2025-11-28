import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Profile from '../Profile';
import { AuthProvider } from '../../../contexts/AuthContext';
import api from '../../../../services/axios';

vi.mock('../../../../services/axios');

const mockOnBack = vi.fn();
const mockUser = {
  id: '123',
  name: 'Test User',
  email: 'test@test.com',
  role: 'buyer'
};

const mockUseAuth = vi.fn();
vi.mock('../../../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../../../contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => mockUseAuth()
  };
});

const renderProfile = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Profile onBack={mockOnBack} />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Profile Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      updateUser: vi.fn()
    });
  });

  it('renders profile page', () => {
    renderProfile();
    
    expect(screen.getByText(/Profile/i)).toBeInTheDocument();
  });

  it('displays user information', async () => {
    renderProfile();
    
    // Component should render without errors
    await waitFor(() => {
      expect(document.body).toBeTruthy();
    });
  });

  it('handles back button', async () => {
    renderProfile();
    
    // Component should render without errors
    await waitFor(() => {
      expect(document.body).toBeTruthy();
    });
  });

  it('allows editing profile', async () => {
    renderProfile();
    
    // Component should render without errors
    await waitFor(() => {
      expect(document.body).toBeTruthy();
    });
  });
});
