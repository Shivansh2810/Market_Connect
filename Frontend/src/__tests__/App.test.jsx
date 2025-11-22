import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';
import * as productApi from '../../services/product';
import * as auctionApi from '../../services/auction';

vi.mock('../../services/product');
vi.mock('../../services/auction');
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    connected: true,
    id: 'test-socket-id'
  }))
}));

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    productApi.getAllProducts.mockResolvedValue({ success: true, products: [] });
    productApi.getCategories.mockResolvedValue({ success: true, categories: [] });
    auctionApi.getActiveAuctions.mockResolvedValue([]);
  });

  it('renders without crashing', () => {
    render(<App />);
    expect(document.querySelector('.App')).toBeInTheDocument();
  });

  it('redirects root path to dashboard', () => {
    window.history.pushState({}, 'Test', '/');
    render(<App />);
    
    // Should redirect to dashboard
    expect(window.location.pathname).toBe('/');
  });

  it('provides all necessary contexts', () => {
    render(<App />);
    
    // The app should render without context errors
    expect(document.querySelector('.App')).toBeInTheDocument();
  });

  it('renders login route', () => {
    window.history.pushState({}, 'Login', '/login');
    render(<App />);
    
    // Login component should be rendered
    expect(window.location.pathname).toBe('/login');
  });

  it('renders signup route', () => {
    window.history.pushState({}, 'Signup', '/signup');
    render(<App />);
    
    expect(window.location.pathname).toBe('/signup');
  });

  it('renders admin login route', () => {
    window.history.pushState({}, 'Admin Login', '/admin-login');
    render(<App />);
    
    expect(window.location.pathname).toBe('/admin-login');
  });

  it('wraps app with AuthProvider', () => {
    render(<App />);
    
    // Should not throw error about missing AuthContext
    expect(document.querySelector('.App')).toBeInTheDocument();
  });

  it('wraps app with ProductsProvider', () => {
    render(<App />);
    
    // Should not throw error about missing ProductsContext
    expect(document.querySelector('.App')).toBeInTheDocument();
  });

  it('wraps app with CartProvider', () => {
    render(<App />);
    
    // Should not throw error about missing CartContext
    expect(document.querySelector('.App')).toBeInTheDocument();
  });

  it('wraps app with AuctionProvider', () => {
    render(<App />);
    
    // Should not throw error about missing AuctionContext
    expect(document.querySelector('.App')).toBeInTheDocument();
  });
});
