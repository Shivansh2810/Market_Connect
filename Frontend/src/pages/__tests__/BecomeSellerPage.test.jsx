import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

const updateUserMock = vi.fn();
const authMock = vi.fn();
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => authMock(),
}));

const upgradeToSellerMock = vi.fn();
vi.mock('../../../services/user', () => ({
  upgradeToSeller: (...args) => upgradeToSellerMock(...args),
}));

const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

let BecomeSellerPage;
beforeAll(async () => {
  BecomeSellerPage = (await import('../BecomeSellerPage')).default;
});

const renderPage = () => render(<BecomeSellerPage />);

const fillCommonFields = async () => {
  await userEvent.type(screen.getByLabelText(/Shop Name/i), 'Gadget Hub');
  await userEvent.type(screen.getByLabelText(/Street Address/i), '42 Galaxy Way');
  await userEvent.type(screen.getByLabelText(/^City/), 'Cosmopolis');
  await userEvent.type(screen.getByLabelText(/^State/), 'Nebula');
  await userEvent.type(screen.getByLabelText(/^Pincode/), '123456');
  await userEvent.clear(screen.getByLabelText(/Country/));
  await userEvent.type(screen.getByLabelText(/Country/), 'India');
};

describe('BecomeSellerPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockReturnValue({
      user: { _id: 'buyer1', role: 'buyer', name: 'Buyer Bob' },
      updateUser: updateUserMock,
    });
  });

  afterEach(() => {
    alertMock.mockClear();
  });

  it('shows already-seller notice and navigation controls', async () => {
    authMock.mockReturnValue({
      user: { _id: 'seller1', role: 'seller', name: 'Seller Sue' },
      updateUser: updateUserMock,
    });

    renderPage();

    expect(screen.getByText(/already a seller/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Go to Dashboard/i }));
    expect(navigateMock).toHaveBeenCalledWith('/dashboard');
  });

  it('validates required fields and displays error messages', async () => {
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: /Become a Seller/i }));

    expect(screen.getByText('Shop name is required')).toBeInTheDocument();
    expect(screen.getByText('Street address is required')).toBeInTheDocument();
    expect(screen.getByText('City is required')).toBeInTheDocument();
    expect(screen.getByText('State is required')).toBeInTheDocument();
    expect(screen.getByText('Pincode is required')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/^Pincode/), '12ab4567');
    expect(screen.getByLabelText(/^Pincode/)).toHaveValue('124567');

    await userEvent.clear(screen.getByLabelText(/^Pincode/));
    await userEvent.type(screen.getByLabelText(/^Pincode/), '12345');
    await userEvent.click(screen.getByRole('button', { name: /Become a Seller/i }));
    expect(screen.getByText('Pincode must be exactly 6 digits')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/Shop Name/), 'Nova Store');
    expect(screen.queryByText('Shop name is required')).not.toBeInTheDocument();
  });

  it('submits successfully, updates user, alerts, and navigates', async () => {
    upgradeToSellerMock.mockResolvedValue({ user: { _id: 'seller1', role: 'seller' } });

    renderPage();
    await fillCommonFields();

    await userEvent.click(screen.getByRole('button', { name: /Become a Seller/i }));

    await waitFor(() => {
      expect(upgradeToSellerMock).toHaveBeenCalledWith('Gadget Hub', {
        street: '42 Galaxy Way',
        city: 'Cosmopolis',
        state: 'Nebula',
        pincode: '123456',
        country: 'India',
      });
      expect(updateUserMock).toHaveBeenCalledWith({ _id: 'seller1', role: 'seller' });
      expect(alertMock).toHaveBeenCalledWith(
        'Congratulations! Your account has been upgraded to a seller. You can now login as a seller.'
      );
      expect(navigateMock).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows response message when upgrade succeeds without user payload', async () => {
    upgradeToSellerMock.mockResolvedValue({ success: true, message: 'Pending approval' });

    renderPage();
    await fillCommonFields();

    await userEvent.click(screen.getByRole('button', { name: /Become a Seller/i }));

    expect(await screen.findByText('Pending approval')).toBeInTheDocument();
    expect(updateUserMock).not.toHaveBeenCalled();
    expect(alertMock).not.toHaveBeenCalled();
  });

  it('handles upgrade failure with server message', async () => {
    upgradeToSellerMock.mockRejectedValue({ response: { data: { message: 'Service down' } } });

    renderPage();
    await fillCommonFields();

    await userEvent.click(screen.getByRole('button', { name: /Become a Seller/i }));

    expect(await screen.findByText('Service down')).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('falls back to generic error message on unexpected failure', async () => {
    upgradeToSellerMock.mockRejectedValue(new Error('Timeout'));

    renderPage();
    await fillCommonFields();

    await userEvent.click(screen.getByRole('button', { name: /Become a Seller/i }));

    expect(
      await screen.findByText('Failed to upgrade to seller. Please try again.')
    ).toBeInTheDocument();
  });

  it('responds to navigation shortcuts', async () => {
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: /Back to Dashboard/i }));
    await userEvent.click(screen.getByRole('button', { name: /Cancel/i }));

    expect(navigateMock).toHaveBeenCalledTimes(2);
    expect(navigateMock).toHaveBeenNthCalledWith(1, '/dashboard');
    expect(navigateMock).toHaveBeenNthCalledWith(2, '/dashboard');
  });
});
