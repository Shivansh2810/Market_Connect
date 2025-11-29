import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Signup from '../Signup';

const loginMock = vi.fn();
const navigateMock = vi.fn();
const postMock = vi.fn();
const authState = { login: loginMock, isAuthenticated: false };

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => authState,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
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
    <Signup />
  </MemoryRouter>
);

const firstNameInput = () => screen.getByPlaceholderText(/First Name/i);
const lastNameInput = () => screen.getByPlaceholderText(/Last Name/i);
const emailInput = () => screen.getByPlaceholderText(/Email/i);
const mobileInput = () => screen.getByPlaceholderText(/Mobile Number/i);
const passwordInput = () => screen.getByPlaceholderText(/^Password$/i);
const confirmPasswordInput = () => screen.getByPlaceholderText(/Confirm Password/i);
const submitButton = () => screen.getByRole('button', { name: /sign up/i });

const fillValidForm = () => {
  fireEvent.change(firstNameInput(), { target: { value: 'John' } });
  fireEvent.change(lastNameInput(), { target: { value: 'Doe' } });
  fireEvent.change(emailInput(), { target: { value: 'john@test.com' } });
  fireEvent.change(mobileInput(), { target: { value: '9876543210' } });
  fireEvent.change(passwordInput(), { target: { value: 'Test123!' } });
  fireEvent.change(confirmPasswordInput(), { target: { value: 'Test123!' } });
};

describe('Signup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loginMock.mockReset();
    navigateMock.mockReset();
    postMock.mockReset();
    authState.isAuthenticated = false;
  });

  afterEach(() => {
    cleanup();
  });

  it('redirects authenticated users to dashboard immediately', async () => {
    authState.isAuthenticated = true;
    renderComponent();
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('enforces alphabetic first and last names', async () => {
    renderComponent();
    fireEvent.change(firstNameInput(), { target: { value: 'Ann3' } });
    fireEvent.change(lastNameInput(), { target: { value: "O'Neil!" } });

    await waitFor(() => {
      expect(screen.getAllByText('Only alphabets are allowed!')).toHaveLength(2);
    });

    fireEvent.change(firstNameInput(), { target: { value: 'Anne' } });
    await waitFor(() => {
      expect(screen.getAllByText('Only alphabets are allowed!')).toHaveLength(1);
    });
  });

  it('prevents submission when field-level errors exist', () => {
    renderComponent();
    fireEvent.change(mobileInput(), { target: { value: '12345678901' } });
    fireEvent.click(submitButton());

    expect(
      screen.getByText('Please fix the highlighted errors before submitting!')
    ).toBeInTheDocument();
    expect(postMock).not.toHaveBeenCalled();
  });

  it('requires all form fields before submitting', async () => {
    renderComponent();
    fireEvent.change(passwordInput(), { target: { value: 'Valid123' } });
    fireEvent.change(confirmPasswordInput(), { target: { value: 'Valid123' } });
    fireEvent.click(submitButton());

    expect(await screen.findByText('All fields are required!')).toBeInTheDocument();
  });

  it('validates mobile number format and length', () => {
    renderComponent();
    fireEvent.change(mobileInput(), { target: { value: 'abc' } });
    expect(screen.getByText('Only numbers are allowed!')).toBeInTheDocument();

    fireEvent.change(mobileInput(), { target: { value: '12345678901' } });
    expect(
      screen.getByText('Mobile number cannot exceed 10 digits!')
    ).toBeInTheDocument();
  });

  it('validates password mismatch, minimum length, and complexity', () => {
    renderComponent();
    fireEvent.change(firstNameInput(), { target: { value: 'John' } });
    fireEvent.change(lastNameInput(), { target: { value: 'Doe' } });
    fireEvent.change(emailInput(), { target: { value: 'john@test.com' } });
    fireEvent.change(mobileInput(), { target: { value: '9876543210' } });
    fireEvent.change(passwordInput(), { target: { value: 'short' } });
    fireEvent.change(confirmPasswordInput(), { target: { value: 'longer' } });

    fireEvent.click(submitButton());

    expect(screen.getByText('Passwords do not match!')).toBeInTheDocument();

    fireEvent.change(confirmPasswordInput(), { target: { value: 'short' } });
    fireEvent.click(submitButton());
    expect(
      screen.getByText('Password must be at least 6 characters long!')
    ).toBeInTheDocument();

    fireEvent.change(passwordInput(), { target: { value: 'password' } });
    fireEvent.change(confirmPasswordInput(), { target: { value: 'password' } });
    fireEvent.click(submitButton());
    expect(
      screen.getByText(
        'Password must contain at least one uppercase letter, one lowercase letter, and one number!'
      )
    ).toBeInTheDocument();
  });

  it('signs up successfully and logs user in', async () => {
    postMock.mockResolvedValueOnce({
      data: {
        token: 'token',
        user: { name: 'John Doe', email: 'john@test.com' },
      },
    });

    renderComponent();
    fillValidForm();
    fireEvent.click(submitButton());

    await waitFor(() => {
      expect(postMock).toHaveBeenCalledWith('/users/signup', {
        name: 'John Doe',
        email: 'john@test.com',
        password: 'Test123!',
        confirmPassword: 'Test123!',
        mobNo: '9876543210',
      });
      expect(loginMock).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'john@test.com' }),
        'token'
      );
      expect(navigateMock).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('surfaces API error message when signup fails', async () => {
    postMock.mockRejectedValueOnce({
      response: { data: { message: 'Email already exists' } },
    });

    renderComponent();
    fillValidForm();
    fireEvent.click(submitButton());

    expect(await screen.findByText('Email already exists')).toBeInTheDocument();
  });

  it('falls back to generic error when API message missing', async () => {
    postMock.mockRejectedValueOnce({});

    renderComponent();
    fillValidForm();
    fireEvent.click(submitButton());

    expect(
      await screen.findByText(
        'Signup failed. Please check your information and try again.'
      )
    ).toBeInTheDocument();
  });

  it('navigates to login when link is clicked', () => {
    renderComponent();
    fireEvent.click(screen.getByText(/Login/i));
    expect(navigateMock).toHaveBeenCalledWith('/');
  });

  it('shows loading state while submitting signup request', () => {
    postMock.mockReturnValue(new Promise(() => {}));

    renderComponent();
    fillValidForm();
    fireEvent.click(submitButton());

    expect(screen.getByRole('button', { name: /SIGNING UP.../i })).toBeInTheDocument();
  });
});
