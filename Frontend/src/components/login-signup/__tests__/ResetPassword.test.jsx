import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ResetPassword from '../ResetPassword';

const navigateMock = vi.fn();
const postMock = vi.fn();
let paramsMock = { token: 'reset-token-123' };
const authState = { isAuthenticated: false };

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => authState,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useParams: () => paramsMock,
  };
});

vi.mock('../../../../services/axios', () => ({
  __esModule: true,
  default: {
    post: (...args) => postMock(...args),
  },
}));

const renderComponent = () => render(
  <MemoryRouter>
    <ResetPassword />
  </MemoryRouter>
);

const typePassword = (value) =>
  fireEvent.change(screen.getByLabelText(/^New Password$/i), { target: { value } });
const typeConfirmPassword = (value) =>
  fireEvent.change(screen.getByLabelText(/^Confirm New Password$/i), {
    target: { value },
  });

const submitForm = () => {
  const button = screen.getByRole('button', { name: /reset password/i });
  const form = button.closest('form');
  if (form) {
    form.noValidate = true;
  }
  fireEvent.click(button);
};

describe('ResetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockReset();
    postMock.mockReset();
    paramsMock = { token: 'reset-token-123' };
    authState.isAuthenticated = false;
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('redirects authenticated users to their dashboard', async () => {
    authState.isAuthenticated = true;

    renderComponent();

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('informs user when reset token is missing', () => {
    paramsMock = {};

    renderComponent();

    expect(screen.getByText(/Invalid Reset Link/i)).toBeInTheDocument();
    expect(
      screen.getByText('Invalid or missing reset token.')
    ).toBeInTheDocument();
  });

  it('validates required fields before submission', async () => {
    renderComponent();
    submitForm();

    expect(await screen.findByText('All fields are required!')).toBeInTheDocument();
    expect(postMock).not.toHaveBeenCalled();
  });

  it('submits reset request and navigates back after success', async () => {
    vi.useFakeTimers();
    postMock.mockResolvedValueOnce({ data: { message: 'Password reset successfully!' } });

    renderComponent();
    typePassword('StrongPass1');
    typeConfirmPassword('StrongPass1');
    submitForm();

    await act(async () => {
      await Promise.resolve();
    });

    expect(
      screen.getByText('Password reset successfully! Redirecting to login...')
    ).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(navigateMock).toHaveBeenCalledWith('/');
  });

  it('shows server error messages and invalidates token when necessary', async () => {
    postMock.mockRejectedValueOnce({
      response: { data: { message: 'token expired' } },
    });

    renderComponent();
    typePassword('StrongPass1');
    typeConfirmPassword('StrongPass1');
    submitForm();

    expect(await screen.findByText('token expired')).toBeInTheDocument();
    expect(screen.getByText(/Invalid Reset Link/i)).toBeInTheDocument();
  });

  it('handles generic reset failures gracefully', async () => {
    postMock.mockRejectedValueOnce({});

    renderComponent();
    typePassword('StrongPass1');
    typeConfirmPassword('StrongPass1');
    submitForm();

    expect(
      await screen.findByText(
        'Failed to reset password. The link may have expired. Please request a new reset link.'
      )
    ).toBeInTheDocument();
  });

  it('navigates back to login when resend link is requested', () => {
    paramsMock = {};

    renderComponent();
    fireEvent.click(screen.getByRole('button', { name: /Go to Login Page/i }));

    expect(navigateMock).toHaveBeenCalledWith('/');
  });
});
