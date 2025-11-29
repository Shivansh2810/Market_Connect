import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../Login';

const loginMock = vi.fn();
const navigateMock = vi.fn();
let locationMock = { state: undefined };

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: loginMock,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useLocation: () => locationMock,
  };
});

const postMock = vi.fn();

vi.mock('../../../../services/axios', () => ({
  __esModule: true,
  default: {
    post: (...args) => postMock(...args),
  },
}));

const renderComponent = () => render(
  <MemoryRouter>
    <Login />
  </MemoryRouter>
);

const emailInput = () => screen.getByPlaceholderText('Email');
const passwordInput = () => screen.getByPlaceholderText('Password');
const loginButton = () => screen.getByRole('button', { name: /login/i });
const googleButton = () => screen.getByRole('button', { name: /continue with google/i });
const forgotPasswordForm = () =>
  screen.getByRole('button', { name: /send reset link/i }).closest('form');

const submitLogin = () => fireEvent.click(loginButton());
const submitForgotPassword = () => {
  const form = forgotPasswordForm();
  if (form) {
    form.noValidate = true;
  }
  fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));
};

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loginMock.mockReset();
    navigateMock.mockReset();
    postMock.mockReset();
    locationMock = { state: undefined };
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    cleanup();
  });

  it('requires email and password', () => {
    renderComponent();
    submitLogin();

    expect(
      screen.getByText('Email and password are required!')
    ).toBeInTheDocument();
    expect(postMock).not.toHaveBeenCalled();
  });

  it('validates email or phone format', () => {
    renderComponent();
    fireEvent.change(emailInput(), { target: { value: 'invalid' } });
    fireEvent.change(passwordInput(), { target: { value: 'Password1!' } });
    submitLogin();

    expect(
      screen.getByText('Enter valid Email or Mobile Number!')
    ).toBeInTheDocument();
  });

  it('logs in admin users through admin endpoint', async () => {
    postMock.mockResolvedValueOnce({
      data: {
        token: 'token',
        user: { role: 'admin', email: 'admin@marketplace.com' },
      },
    });

    renderComponent();
    fireEvent.change(emailInput(), { target: { value: 'admin@marketplace.com' } });
    fireEvent.change(passwordInput(), { target: { value: 'Password1!' } });
    submitLogin();

    await waitFor(() => {
      expect(postMock).toHaveBeenCalledWith('/users/admin/login', {
        email: 'admin@marketplace.com',
        password: 'Password1!',
      });
    });

    expect(loginMock).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'admin' }),
      'token'
    );
    expect(navigateMock).toHaveBeenCalledWith('/admin');
  });

  it('logs in sellers and respects role preference', async () => {
    postMock.mockResolvedValueOnce({
      data: {
        token: 'token',
        user: { role: 'both', email: 'seller@test.com' },
      },
    });

    renderComponent();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'seller' } });
    fireEvent.change(emailInput(), { target: { value: 'seller@test.com' } });
    fireEvent.change(passwordInput(), { target: { value: 'Password1!' } });
    submitLogin();

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalled();
    });

    expect(navigateMock).toHaveBeenCalledWith('/seller-dashboard');
  });

  it('redirects buyers back to original path when provided', async () => {
    locationMock = { state: { from: { pathname: '/orders' } } };
    postMock.mockResolvedValueOnce({
      data: {
        token: 'token',
        user: { role: 'buyer', email: 'buyer@test.com' },
      },
    });

    renderComponent();
    fireEvent.change(emailInput(), { target: { value: 'buyer@test.com' } });
    fireEvent.change(passwordInput(), { target: { value: 'Password1!' } });
    submitLogin();

    await waitFor(() => expect(loginMock).toHaveBeenCalled());

    expect(navigateMock).toHaveBeenCalledWith('/orders', { replace: true });
  });

  it('falls back to buyer dashboard when no redirect exists', async () => {
    postMock.mockResolvedValueOnce({
      data: {
        token: 'token',
        user: { role: 'buyer', email: 'buyer@test.com' },
      },
    });

    renderComponent();
    fireEvent.change(emailInput(), { target: { value: 'buyer@test.com' } });
    fireEvent.change(passwordInput(), { target: { value: 'Password1!' } });
    submitLogin();

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/dashboard'));
  });

  it('handles network errors gracefully', async () => {
    postMock.mockRejectedValueOnce({
      code: 'ERR_NETWORK',
      message: 'Network Error',
    });

    renderComponent();
    fireEvent.change(emailInput(), { target: { value: 'buyer@test.com' } });
    fireEvent.change(passwordInput(), { target: { value: 'Password1!' } });
    submitLogin();

    expect(
      await screen.findByText(/Network error. Please check:/i)
    ).toBeInTheDocument();
  });

  it('maps HTTP errors to descriptive messages', async () => {
    const cases = [
      { status: 401, expected: 'Invalid email or password. Please try again.' },
      { status: 403, expected: 'Access denied for this role. Please select the correct account type.' },
      { status: 500, expected: 'Server error. Please try again later.' },
    ];

    for (const { status, expected } of cases) {
      postMock.mockRejectedValueOnce({ response: { status } });

      const view = renderComponent();
      fireEvent.change(emailInput(), { target: { value: 'buyer@test.com' } });
      fireEvent.change(passwordInput(), { target: { value: 'Password1!' } });
      submitLogin();

      expect(await screen.findByText(expected)).toBeInTheDocument();
      postMock.mockReset();
      view.unmount();
    }
  });

  it('prefers server-provided error messages', async () => {
    postMock.mockRejectedValueOnce({
      response: {
        data: { message: 'Custom server error' },
      },
    });

    renderComponent();
    fireEvent.change(emailInput(), { target: { value: 'buyer@test.com' } });
    fireEvent.change(passwordInput(), { target: { value: 'Password1!' } });
    submitLogin();

    expect(await screen.findByText('Custom server error')).toBeInTheDocument();
  });

  it('falls back to generic error message when only exception message exists', async () => {
    postMock.mockRejectedValueOnce(new Error('Something unexpected'));

    renderComponent();
    fireEvent.change(emailInput(), { target: { value: 'buyer@test.com' } });
    fireEvent.change(passwordInput(), { target: { value: 'Password1!' } });
    submitLogin();

    expect(await screen.findByText('Something unexpected')).toBeInTheDocument();
  });

  it('clears error state when email or password changes', () => {
    renderComponent();
    submitLogin();
    expect(
      screen.getByText('Email and password are required!')
    ).toBeInTheDocument();

    fireEvent.change(emailInput(), { target: { value: 'buyer@test.com' } });
    expect(
      screen.queryByText('Email and password are required!')
    ).not.toBeInTheDocument();
  });

  it('initiates Google login and stores redirect path', () => {
    vi.stubEnv('VITE_BACKEND_URL', 'http://backend.test');
    locationMock = { state: { from: { pathname: '/wishlist' } } };
    vi.stubGlobal('location', { href: 'http://localhost/login' });

    renderComponent();
    fireEvent.click(googleButton());

    expect(sessionStorage.getItem('login_redirect')).toBe('/wishlist');
    expect(global.location.href).toBe('http://backend.test/api/users/auth/google');
  });

  it('falls back to default backend url when env variable missing', () => {
    vi.stubEnv('VITE_BACKEND_URL', '');
    vi.stubGlobal('location', { href: '' });

    renderComponent();
    fireEvent.click(googleButton());

    expect(global.location.href).toBe('http://localhost:8080/api/users/auth/google');
  });

  it('opens forgot password modal and validates input', async () => {
    renderComponent();

    fireEvent.click(screen.getByText(/Forgot your password/i));

    submitForgotPassword();
    expect(await screen.findByText('Email is required!')).toBeInTheDocument();

    const emailField = await screen.findByPlaceholderText(/Enter your email/i);
    fireEvent.change(emailField, {
      target: { value: 'invalid' },
    });
    submitForgotPassword();
    expect(
      await screen.findByText('Please enter a valid email address!')
    ).toBeInTheDocument();
  });

  it('handles forgot password success flow and auto-close', async () => {
    vi.useFakeTimers();
    postMock.mockResolvedValueOnce({ data: { message: 'Email sent!' } });

    renderComponent();
    fireEvent.click(screen.getByText(/Forgot your password/i));

    const emailInput = screen.getByPlaceholderText(/Enter your email/i);
    fireEvent.change(emailInput, {
      target: { value: 'user@test.com' },
    });

    submitForgotPassword();

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText('Email sent!')).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(
      screen.queryByPlaceholderText(/Enter your email address/i)
    ).not.toBeInTheDocument();
  });

  it('maps forgot password errors to friendly messages', async () => {
    const scenarios = [
      {
        error: { response: { status: 404 } },
        expected: "User hasn't registered with this email. Please check your email or sign up.",
      },
      {
        error: { response: { status: 400, data: { message: 'Use Google login' } } },
        expected: 'Use Google login',
      },
      {
        error: { response: { status: 400, data: {} } },
        expected: 'This account uses Google login. Please use Google login instead.',
      },
      {
        error: { code: 'NETWORK_ERROR', message: 'Network Error' },
        expected: 'Network error. Please check your internet connection.',
      },
    ];

    for (const { error, expected } of scenarios) {
      postMock.mockRejectedValueOnce(error);

      const view = renderComponent();
      fireEvent.click(screen.getByText(/Forgot your password/i));
      fireEvent.change(screen.getByPlaceholderText(/Enter your email/i), {
        target: { value: 'user@test.com' },
      });
      submitForgotPassword();

      expect(await screen.findByText(expected)).toBeInTheDocument();
      postMock.mockReset();
      view.unmount();
    }
  });

  it('closes forgot password modal when overlay is clicked', () => {
    renderComponent();
    fireEvent.click(screen.getByText(/Forgot your password/i));

    const overlay = document.querySelector('.modal-overlay');
    expect(overlay).toBeTruthy();
    fireEvent.click(overlay);

    expect(screen.queryByText(/Forgot Password/i)).not.toBeInTheDocument();
  });
});
