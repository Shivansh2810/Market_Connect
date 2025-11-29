import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminLogin from '../AdminLogin';

const loginMock = vi.fn();
const navigateMock = vi.fn();

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
  };
});

const postMock = vi.fn();

vi.mock('../../../../services/axios', () => ({
  __esModule: true,
  default: {
    post: (...args) => postMock(...args),
  },
}));

const renderComponent = () => render(<AdminLogin />);

const fillCredentials = ({ email = 'admin@marketplace.com', password = 'Password1!' } = {}) => {
  fireEvent.change(screen.getByLabelText(/admin email/i), { target: { value: email } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: password } });
};

const submit = () => {
  const submitButton = screen.getByRole('button', { name: /login as admin/i });
  const form = submitButton.closest('form');
  if (form) {
    form.noValidate = true;
  }
  fireEvent.click(submitButton);
};

const createDeferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe('AdminLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    postMock.mockReset();
  });

  it('requires email and password', async () => {
    renderComponent();
    submit();

    expect(await screen.findByText('Email and password are required!')).toBeInTheDocument();
    expect(postMock).not.toHaveBeenCalled();
  });

  it('validates email format', async () => {
    renderComponent();
    fillCredentials({ email: 'invalid-email', password: 'Password1!' });
    submit();

    expect(await screen.findByText('Enter a valid email address!')).toBeInTheDocument();
    expect(postMock).not.toHaveBeenCalled();
  });

  it('prevents non-admin users from logging in', async () => {
    postMock.mockResolvedValueOnce({
      data: {
        token: 'token',
        user: { role: 'buyer', name: 'User' },
      },
    });

    renderComponent();
    fillCredentials();
    submit();

    expect(await screen.findByText('Access denied. Admin credentials required.')).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('logs in admin users and redirects to admin dashboard', async () => {
    const user = { role: 'admin', name: 'Admin' };
    postMock.mockResolvedValueOnce({
      data: {
        token: 'token',
        user,
      },
    });

    renderComponent();
    fillCredentials();
    submit();

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith(user, 'token');
    });

    expect(navigateMock).toHaveBeenCalledWith('/admin');
  });

  it('shows loading state while awaiting response', async () => {
    const deferred = createDeferred();
    postMock.mockReturnValueOnce(deferred.promise);

    renderComponent();
    fillCredentials();
    submit();

    expect(screen.getByRole('button', { name: /logging in/i })).toBeDisabled();

    deferred.resolve({ data: { token: 't', user: { role: 'admin' } } });

    await waitFor(() => {
      expect(postMock).toHaveBeenCalled();
    });
  });

  it('handles custom error messages from the server', async () => {
    postMock.mockRejectedValueOnce({
      response: {
        data: { message: 'Custom error' },
      },
    });

    renderComponent();
    fillCredentials();
    submit();

    expect(await screen.findByText('Custom error')).toBeInTheDocument();
  });

  it('handles network errors with friendly guidance', async () => {
    postMock.mockRejectedValueOnce({
      code: 'ERR_NETWORK',
      message: 'Network Error',
    });

    renderComponent();
    fillCredentials();
    submit();

    expect(
      await screen.findByText(/Cannot connect to server. Please ensure/i)
    ).toBeInTheDocument();
  });

  it('overrides message for HTTP 401 responses', async () => {
    postMock.mockRejectedValueOnce({
      response: {
        status: 401,
      },
    });

    renderComponent();
    fillCredentials();
    submit();

    expect(
      await screen.findByText('Invalid admin credentials. Please check your email and password.')
    ).toBeInTheDocument();
  });

  it('shows server error guidance for 500 responses', async () => {
    postMock.mockRejectedValueOnce({
      response: {
        status: 500,
      },
    });

    renderComponent();
    fillCredentials();
    submit();

    expect(
      await screen.findByText('Server error. Please try again later.')
    ).toBeInTheDocument();
  });
});
