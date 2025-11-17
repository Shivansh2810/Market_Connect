import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { CartProvider, useCart } from '../CartContext';

const wrapper = ({ children }) => <CartProvider>{children}</CartProvider>;

const mockProduct = {
  _id: 'prod123',
  title: 'Test Product',
  price: 100,
  currency: 'INR',
  images: [{ url: 'test.jpg', isPrimary: true }],
  category: { name: 'Electronics' }
};

describe('CartContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('provides initial empty cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    expect(result.current.items).toEqual([]);
    expect(result.current.itemCount).toBe(0);
    expect(result.current.totalAmount).toBe(0);
  });

  it('adds product to cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    act(() => {
      result.current.addToCart(mockProduct, 2);
    });
    
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].productId).toBe('prod123');
    expect(result.current.items[0].quantity).toBe(2);
    expect(result.current.itemCount).toBe(2);
    expect(result.current.totalAmount).toBe(200);
  });

  it('increases quantity when adding same product', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    act(() => {
      result.current.addToCart(mockProduct, 1);
    });
    
    act(() => {
      result.current.addToCart(mockProduct, 2);
    });
    
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(3);
    expect(result.current.itemCount).toBe(3);
  });

  it('removes product from cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    act(() => {
      result.current.addToCart(mockProduct, 2);
    });
    
    act(() => {
      result.current.removeFromCart('prod123');
    });
    
    expect(result.current.items).toHaveLength(0);
    expect(result.current.itemCount).toBe(0);
    expect(result.current.totalAmount).toBe(0);
  });

  it('updates product quantity', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    act(() => {
      result.current.addToCart(mockProduct, 2);
    });
    
    act(() => {
      result.current.updateQuantity('prod123', 5);
    });
    
    expect(result.current.items[0].quantity).toBe(5);
    expect(result.current.itemCount).toBe(5);
    expect(result.current.totalAmount).toBe(500);
  });

  it('removes product when quantity set to 0', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    act(() => {
      result.current.addToCart(mockProduct, 2);
    });
    
    act(() => {
      result.current.updateQuantity('prod123', 0);
    });
    
    expect(result.current.items).toHaveLength(0);
  });

  it('replaces cart with single product', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    const product1 = { ...mockProduct, _id: 'prod1' };
    const product2 = { ...mockProduct, _id: 'prod2' };
    
    act(() => {
      result.current.addToCart(product1, 2);
    });
    
    act(() => {
      result.current.replaceCartWith(product2, 1);
    });
    
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].productId).toBe('prod2');
    expect(result.current.items[0].quantity).toBe(1);
  });

  it('clears entire cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    act(() => {
      result.current.addToCart(mockProduct, 2);
    });
    
    act(() => {
      result.current.clearCart();
    });
    
    expect(result.current.items).toHaveLength(0);
    expect(result.current.itemCount).toBe(0);
    expect(result.current.totalAmount).toBe(0);
  });

  it('persists cart to localStorage', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    act(() => {
      result.current.addToCart(mockProduct, 2);
    });
    
    const stored = JSON.parse(localStorage.getItem('market-connect-cart'));
    expect(stored).toHaveLength(1);
    expect(stored[0].productId).toBe('prod123');
  });

  it('restores cart from localStorage', () => {
    const cartData = [{
      _id: 'cart_123',
      productId: 'prod123',
      quantity: 3,
      price: 100,
      productDetails: {
        title: 'Test Product',
        price: 100,
        image: 'test.jpg'
      }
    }];
    
    localStorage.setItem('market-connect-cart', JSON.stringify(cartData));
    
    const { result } = renderHook(() => useCart(), { wrapper });
    
    expect(result.current.items).toHaveLength(1);
    expect(result.current.itemCount).toBe(3);
    expect(result.current.totalAmount).toBe(300);
  });

  it('calculates total amount correctly with multiple products', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    const product1 = { ...mockProduct, _id: 'prod1', price: 100 };
    const product2 = { ...mockProduct, _id: 'prod2', price: 200 };
    
    act(() => {
      result.current.addToCart(product1, 2); // 200
      result.current.addToCart(product2, 3); // 600
    });
    
    expect(result.current.totalAmount).toBe(800);
    expect(result.current.itemCount).toBe(5);
  });

  it('throws error when useCart is used outside CartProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      renderHook(() => useCart());
    }).toThrow('useCart must be used within a CartProvider');
    
    consoleSpy.mockRestore();
  });
});
