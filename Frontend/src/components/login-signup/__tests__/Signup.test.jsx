import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Signup from '../Signup';
import { AuthProvider } from '../../../contexts/AuthContext';
import api from '../../../../api/axios';

vi.mock('../../../../api/axios');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderSignup = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Signup />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Signup Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders signup form correctly', () => {
    renderSignup();
    
    expect(screen.getByText(/Market Connect/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/First Name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Last Name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Mobile Number/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/^Password$/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Confirm Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /SIGN UP/i })).toBeInTheDocument();
  });

  it('validates first name to only accept alphabets', async () => {
    renderSignup();
    
    const firstNameInput = screen.getByPlaceholderText(/First Name/i);
    fireEvent.change(firstNameInput, { target: { value: 'John123' } });
    
    await waitFor(() => {
      expect(screen.getByText(/Only alphabets are allowed!/i)).toBeInTheDocument();
    });
  });

  it('validates last name to only accept alphabets', async () => {
    renderSignup();
    
    const lastNameInput = screen.getByPlaceholderText(/Last Name/i);
    fireEvent.change(lastNameInput, { target: { value: 'Doe@' } });
    
    await waitFor(() => {
      expect(screen.getByText(/Only alphabets are allowed!/i)).toBeInTheDocument();
    });
  });

  it('validates mobile number to only accept numbers', async () => {
    renderSignup();
    
    const mobileInput = screen.getByPlaceholderText(/Mobile Number/i);
    fireEvent.change(mobileInput, { target: { value: '98765abc' } });
    
    await waitFor(() => {
      expect(screen.getByText(/Only numbers are allowed!/i)).toBeInTheDocument();
    });
  });

  it('validates mobile number length', async () => {
    renderSignup();
    
    const mobileInput = screen.getByPlaceholderText(/Mobile Number/i);
    fireEvent.change(mobileInput, { target: { value: '12345678901' } });
    
    await waitFor(() => {
      expect(screen.getByText(/Mobile number cannot exceed 10 digits!/i)).toBeInTheDocument();
    });
  });

  it('shows error when passwords do not match', async () => {
    renderSignup();
    
    fireEvent.change(screen.getByPlaceholderText(/First Name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByPlaceholderText(/Last Name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByPlaceholderText(/Email/i), { target: { value: 'john@test.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Mobile Number/i), { target: { value: '9876543210' } });
    fireEvent.change(screen.getByPlaceholderText(/^Password$/i), { target: { value: 'Test123!' } });
    fireEvent.change(screen.getByPlaceholderText(/Confirm Password/i), { target: { value: 'Test456!' } });
    
    const signupButton = screen.getByRole('button', { name: /SIGN UP/i });
    fireEvent.click(signupButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Passwords do not match!/i)).toBeInTheDocument();
    });
  });

  it('shows error for short password', async () => {
    renderSignup();
    
    fireEvent.change(screen.getByPlaceholderText(/First Name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByPlaceholderText(/Last Name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByPlaceholderText(/Email/i), { target: { value: 'john@test.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Mobile Number/i), { target: { value: '9876543210' } });
    fireEvent.change(screen.getByPlaceholderText(/^Password$/i), { target: { value: 'Test1' } });
    fireEvent.change(screen.getByPlaceholderText(/Confirm Password/i), { target: { value: 'Test1' } });
    
    const signupButton = screen.getByRole('button', { name: /SIGN UP/i });
    fireEvent.click(signupButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Password must be at least 6 characters long!/i)).toBeInTheDocument();
    });
  });

  it('shows error for weak password', async () => {
    renderSignup();
    
    fireEvent.change(screen.getByPlaceholderText(/First Name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByPlaceholderText(/Last Name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByPlaceholderText(/Email/i), { target: { value: 'john@test.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Mobile Number/i), { target: { value: '9876543210' } });
    fireEvent.change(screen.getByPlaceholderText(/^Password$/i), { target: { value: 'password' } });
    fireEvent.change(screen.getByPlaceholderText(/Confirm Password/i), { target: { value: 'password' } });
    
    const signupButton = screen.getByRole('button', { name: /SIGN UP/i });
    fireEvent.click(signupButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Password must contain at least one uppercase letter, one lowercase letter, and one number!/i)).toBeInTheDocument();
    });
  });

  it('successfully signs up a new user', async () => {
    const mockResponse = {
      data: {
        token: 'fake-token',
        user: {
          id: '123',
          name: 'John Doe',
          email: 'john@test.com',
          role: 'buyer'
        }
      }
    };
    
    api.post.mockResolvedValueOnce(mockResponse);
    
    renderSignup();
    
    fireEvent.change(screen.getByPlaceholderText(/First Name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByPlaceholderText(/Last Name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByPlaceholderText(/Email/i), { target: { value: 'john@test.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Mobile Number/i), { target: { value: '9876543210' } });
    fireEvent.change(screen.getByPlaceholderText(/^Password$/i), { target: { value: 'Test123!' } });
    fireEvent.change(screen.getByPlaceholderText(/Confirm Password/i), { target: { value: 'Test123!' } });
    
    const signupButton = screen.getByRole('button', { name: /SIGN UP/i });
    fireEvent.click(signupButton);
    
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/users/signup', {
        name: 'John Doe',
        email: 'john@test.com',
        password: 'Test123!',
        confirmPassword: 'Test123!',
        mobNo: '9876543210'
      });
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('handles signup error correctly', async () => {
    api.post.mockRejectedValueOnce({
      response: {
        data: { message: 'Email already exists' }
      }
    });
    
    renderSignup();
    
    fireEvent.change(screen.getByPlaceholderText(/First Name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByPlaceholderText(/Last Name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByPlaceholderText(/Email/i), { target: { value: 'existing@test.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Mobile Number/i), { target: { value: '9876543210' } });
    fireEvent.change(screen.getByPlaceholderText(/^Password$/i), { target: { value: 'Test123!' } });
    fireEvent.change(screen.getByPlaceholderText(/Confirm Password/i), { target: { value: 'Test123!' } });
    
    const signupButton = screen.getByRole('button', { name: /SIGN UP/i });
    fireEvent.click(signupButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Email already exists/i)).toBeInTheDocument();
    });
  });

  it('navigates to login page when clicking login link', () => {
    renderSignup();
    
    const loginLink = screen.getByText(/Login/i);
    fireEvent.click(loginLink);
    
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('shows loading state during signup', async () => {
    api.post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    renderSignup();
    
    fireEvent.change(screen.getByPlaceholderText(/First Name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByPlaceholderText(/Last Name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByPlaceholderText(/Email/i), { target: { value: 'john@test.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Mobile Number/i), { target: { value: '9876543210' } });
    fireEvent.change(screen.getByPlaceholderText(/^Password$/i), { target: { value: 'Test123!' } });
    fireEvent.change(screen.getByPlaceholderText(/Confirm Password/i), { target: { value: 'Test123!' } });
    
    const signupButton = screen.getByRole('button', { name: /SIGN UP/i });
    fireEvent.click(signupButton);
    
    expect(screen.getByRole('button', { name: /SIGNING UP.../i })).toBeInTheDocument();
  });
});
