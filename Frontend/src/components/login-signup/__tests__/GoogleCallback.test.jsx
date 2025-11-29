import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import GoogleCallback from '../GoogleCallback';

const loginMock = vi.fn();
const updateUserMock = vi.fn();
const navigateMock = vi.fn();
const dashboardPathMock = vi.fn().mockReturnValue('/dashboard');

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: loginMock,
    updateUser: updateUserMock,
  }),
}));

vi.mock('../../utils/dashboardRoutes', () => ({
  getDashboardPath: (user) => dashboardPathMock(user),
}));

const apiMock = vi.hoisted(() => ({
  defaults: { headers: { common: {} } },
  get: vi.fn(),
  put: vi.fn(),
}));

vi.mock('../../../../services/axios', () => ({
  __esModule: true,
  default: apiMock,
}));

let searchParams = new URLSearchParams('token=test-token&userId=user123');

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useSearchParams: () => [searchParams],
  };
});

const renderComponent = () => render(<GoogleCallback />);

const mockBothRequestsError = (error) => {
  apiMock.get.mockReset();
  apiMock.get.mockRejectedValueOnce(error);
  apiMock.get.mockRejectedValueOnce(error);
};

const mockUserResponse = (user, { firstFails = false } = {}) => {
  apiMock.get.mockReset();
  if (firstFails) {
    apiMock.get.mockRejectedValueOnce(new Error('primary failed'));
  }
  apiMock.get.mockResolvedValueOnce({
    data: {
      success: true,
      data: user,
    },
  });
};

describe('GoogleCallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loginMock.mockReset();
    updateUserMock.mockReset();
    navigateMock.mockReset();
    dashboardPathMock.mockReturnValue('/dashboard');
    apiMock.get.mockReset();
    apiMock.put.mockReset();
    localStorage.clear();
    sessionStorage.clear();
    searchParams = new URLSearchParams('token=test-token&userId=user123');
  });

  it('redirects with existing phone number and stored redirect path', async () => {
    sessionStorage.setItem('login_redirect', '/products/1');

    mockUserResponse({
      name: 'Test User',
      email: 'user@test.com',
      role: 'buyer',
      mobNo: '9876543210',
    });

    renderComponent();

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'user@test.com' }),
        'test-token'
      );
    });

    expect(navigateMock).toHaveBeenCalledWith('/products/1', { replace: true });
    expect(sessionStorage.getItem('login_redirect')).toBeNull();
  });

  it('falls back to /me endpoint and shows phone modal for missing number', async () => {
    searchParams = new URLSearchParams('token=fallback-token&userId=user456');
    apiMock.get
      .mockRejectedValueOnce(new Error('primary failed'))
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            name: 'Fallback User',
            email: 'fallback@test.com',
            role: 'buyer',
            mobNo: '',
          },
        },
      });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Complete Your Profile/i)).toBeInTheDocument();
    });

    expect(apiMock.get).toHaveBeenCalledTimes(2);
    expect(loginMock).not.toHaveBeenCalled();
  });

  it('validates phone number before updating profile', async () => {
    mockUserResponse({
      name: 'User',
      email: 'user@test.com',
      role: 'buyer',
      mobNo: '0001234567',
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Complete Your Profile/i)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/10-digit mobile/i);
    fireEvent.change(input, { target: { value: '1234567890' } });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(
      screen.getByText('Please enter a valid 10-digit Indian mobile number')
    ).toBeInTheDocument();
    expect(apiMock.put).not.toHaveBeenCalled();
  });

  it('updates phone number successfully and redirects based on role', async () => {
    dashboardPathMock.mockReturnValue('/seller-dashboard');
    mockUserResponse({
      name: 'Seller',
      email: 'seller@test.com',
      role: 'seller',
      mobNo: '0000000000',
    });

    apiMock.put.mockResolvedValueOnce({ data: { success: true } });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Complete Your Profile/i)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/10-digit mobile/i);
    fireEvent.change(input, { target: { value: '9876543210' } });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(updateUserMock).toHaveBeenCalledWith(
        expect.objectContaining({ mobNo: '9876543210' })
      );
    });

    expect(loginMock).toHaveBeenCalledWith(expect.any(Object), 'test-token');
    expect(navigateMock).toHaveBeenCalledWith('/seller-dashboard', { replace: true });
  });

  it('shows error when phone update request fails', async () => {
    mockUserResponse({
      name: 'User',
      email: 'user@test.com',
      role: 'buyer',
      mobNo: '0001234567',
    });

    apiMock.put.mockRejectedValueOnce(new Error('fail')); 

    renderComponent();

    await waitFor(() => screen.getByText(/Complete Your Profile/i));

    fireEvent.change(screen.getByPlaceholderText(/10-digit mobile/i), {
      target: { value: '9876543210' },
    });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Failed to update phone number. Please try again.')
      ).toBeInTheDocument();
    });
  });

  it('skips phone update when requested and token exists', async () => {
    mockUserResponse({
      name: 'User',
      email: 'user@test.com',
      role: 'buyer',
      mobNo: '0000000000',
    });

    renderComponent();

    await waitFor(() => screen.getByText(/Complete Your Profile/i));

    fireEvent.click(screen.getByRole('button', { name: /skip for now/i }));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalled();
    });
  });

  it('shows error when skipping without stored token or user data', async () => {
    mockUserResponse({
      name: 'User',
      email: 'user@test.com',
      role: 'buyer',
      mobNo: '0000000000',
    });

    renderComponent();

    await waitFor(() => screen.getByText(/Complete Your Profile/i));

    localStorage.removeItem('token');

    fireEvent.click(screen.getByRole('button', { name: /skip for now/i }));

    expect(
      await screen.findByText('Unable to complete login. Please try again.')
    ).toBeInTheDocument();
  });

  it('handles missing token error and retry flow', async () => {
    searchParams = new URLSearchParams('userId=user123');

    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText('Authentication token missing. Please try logging in again.')
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Try Again/i }));

    expect(localStorage.getItem('token')).toBeNull();
    expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true });
  });

  it('navigates to login when requested from error state', async () => {
    searchParams = new URLSearchParams('userId=user123');

    renderComponent();

    await waitFor(() => screen.getByText(/Authentication token missing/i));

    fireEvent.click(screen.getByRole('button', { name: /Go to Login/i }));

    expect(navigateMock).toHaveBeenCalledWith('/login');
  });

  it('maps 401 errors to retry guidance', async () => {
    searchParams = new URLSearchParams('token=bad');
    mockBothRequestsError({ response: { status: 401 } });

    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText('Authentication failed. Please try logging in again.')
      ).toBeInTheDocument();
    });
  });

  it('maps 404 errors to support guidance', async () => {
    searchParams = new URLSearchParams('token=bad');
    mockBothRequestsError({ response: { status: 404 } });

    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText('User profile not found. Please contact support.')
      ).toBeInTheDocument();
    });
  });
});
