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

  it('handles corrupted localStorage data', () => {
    localStorage.setItem('market-connect-cart', 'invalid json');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const { result } = renderHook(() => useCart(), { wrapper });
    
    expect(result.current.items).toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });

  it('handles non-array localStorage data', () => {
    localStorage.setItem('market-connect-cart', JSON.stringify({ invalid: 'data' }));
    
    const { result } = renderHook(() => useCart(), { wrapper });
    
    expect(result.current.items).toEqual([]);
  });

  it('merges duplicate items from localStorage', () => {
    const cartData = [
      {
        _id: 'cart_1',
        productId: 'prod123',
        quantity: 2,
        price: 100,
        productDetails: { title: 'Test' }
      },
      {
        _id: 'cart_2',
        productId: 'prod123',
        quantity: 3,
        price: 100,
        productDetails: { title: 'Test' }
      }
    ];
    
    localStorage.setItem('market-connect-cart', JSON.stringify(cartData));
    
    const { result } = renderHook(() => useCart(), { wrapper });
    
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(5);
  });

  it('handles product without images', () => {
    const productWithoutImages = {
      ...mockProduct,
      images: []
    };
    
    const { result } = renderHook(() => useCart(), { wrapper });
    
    act(() => {
      result.current.addToCart(productWithoutImages, 1);
    });
    
    expect(result.current.items[0].productDetails.image).toBe('');
  });

  it('handles product without category', () => {
    const productWithoutCategory = {
      ...mockProduct,
      category: null
    };
    
    const { result } = renderHook(() => useCart(), { wrapper });
    
    act(() => {
      result.current.addToCart(productWithoutCategory, 1);
    });
    
    expect(result.current.items[0].productDetails.category).toBe('General');
  });

  it('updates quantity for non-existing product', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    act(() => {
      result.current.addToCart(mockProduct, 2);
    });
    
    // Try to update a different product that doesn't exist
    act(() => {
      result.current.updateQuantity('nonexistent', 5);
    });
    
    // Original product should remain unchanged
    expect(result.current.items[0].quantity).toBe(2);
  });

  it('adds to cart with multiple products and updates one', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    const product1 = { ...mockProduct, _id: 'prod1', title: 'Product 1' };
    const product2 = { ...mockProduct, _id: 'prod2', title: 'Product 2' };
    const product3 = { ...mockProduct, _id: 'prod3', title: 'Product 3' };
    
    act(() => {
      result.current.addToCart(product1, 1);
      result.current.addToCart(product2, 2);
      result.current.addToCart(product3, 3);
    });
    
    expect(result.current.items).toHaveLength(3);
    
    // Now add more of product2 - this should update product2 but leave product1 and product3 unchanged
    act(() => {
      result.current.addToCart(product2, 5);
    });
    
    expect(result.current.items).toHaveLength(3);
    expect(result.current.items.find(i => i.productId === 'prod1').quantity).toBe(1);
    expect(result.current.items.find(i => i.productId === 'prod2').quantity).toBe(7);
    expect(result.current.items.find(i => i.productId === 'prod3').quantity).toBe(3);
  });
});
