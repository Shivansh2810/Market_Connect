import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
    <AuthProvider>
      <Profile onBack={mockOnBack} />
    </AuthProvider>
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

  it('displays user information', () => {
    renderProfile();
    
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@test.com')).toBeInTheDocument();
  });

  it('handles back button', () => {
    renderProfile();
    
    const backButton = screen.getByText(/Back/i);
    fireEvent.click(backButton);
    
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('allows editing profile', async () => {
    renderProfile();
    
    const editButton = screen.getByText(/Edit/i);
    fireEvent.click(editButton);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
    });
  });
});
