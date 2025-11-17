import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';

vi.mock('../../contexts/AuthContext');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: ({ to }) => <div>Redirected to {to}</div>
  };
});

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading state', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      loading: true
    });

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should redirect to home if not authenticated', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      loading: false
    });

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByText('Redirected to /')).toBeInTheDocument();
  });

  it('should render children if authenticated', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { role: 'buyer' },
      loading: false
    });

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should allow admin to access any route', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { role: 'admin' },
      loading: false
    });

    render(
      <BrowserRouter>
        <ProtectedRoute allowedRoles={['seller']}>
          <div>Seller Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByText('Seller Content')).toBeInTheDocument();
  });

  it('should redirect if user role not allowed', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { role: 'buyer' },
      loading: false
    });

    render(
      <BrowserRouter>
        <ProtectedRoute allowedRoles={['seller']}>
          <div>Seller Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByText('Redirected to /dashboard')).toBeInTheDocument();
  });

  it('should allow user with correct role', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { role: 'seller' },
      loading: false
    });

    render(
      <BrowserRouter>
        <ProtectedRoute allowedRoles={['seller', 'both']}>
          <div>Seller Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByText('Seller Content')).toBeInTheDocument();
  });
});
