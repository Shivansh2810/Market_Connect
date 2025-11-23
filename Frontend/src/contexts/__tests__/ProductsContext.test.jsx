import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { ProductsProvider, useProducts } from '../ProductsContext';
import * as productApi from '../../../services/product';

vi.mock('../../../services/product');

const wrapper = ({ children }) => <ProductsProvider>{children}</ProductsProvider>;

describe('ProductsContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides initial products state', () => {
    productApi.getAllProducts.mockResolvedValue({ success: true, products: [] });
    productApi.getCategories.mockResolvedValue({ success: true, categories: [] });
    
    const { result } = renderHook(() => useProducts(), { wrapper });
    
    expect(result.current.products).toEqual([]);
    expect(result.current.categories).toEqual([]);
    expect(result.current.loading).toBe(true);
  });

  it('fetches products successfully', async () => {
    const mockProducts = [
      {
        _id: '1',
        title: 'Product 1',
        price: 100,
        category: { name: 'Electronics' }
      },
      {
        _id: '2',
        title: 'Product 2',
        price: 200,
        category: { name: 'Clothing' }
      }
    ];
    
    productApi.getAllProducts.mockResolvedValue({ success: true, products: mockProducts });
    productApi.getCategories.mockResolvedValue({ success: true, categories: [] });
    
    const { result } = renderHook(() => useProducts(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.products).toEqual(mockProducts);
    expect(result.current.error).toBe('');
  });

  it('fetches categories successfully', async () => {
    const mockCategories = [
      { _id: '1', name: 'Electronics' },
      { _id: '2', name: 'Clothing' }
    ];
    
    productApi.getAllProducts.mockResolvedValue({ success: true, products: [] });
    productApi.getCategories.mockResolvedValue({ success: true, categories: mockCategories });
    
    const { result } = renderHook(() => useProducts(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.categories).toEqual(mockCategories);
  });

  it('handles product fetch error', async () => {
    const errorMessage = 'Failed to fetch products';
    productApi.getAllProducts.mockRejectedValue({
      response: { data: { message: errorMessage } }
    });
    productApi.getCategories.mockResolvedValue({ success: true, categories: [] });
    
    const { result } = renderHook(() => useProducts(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.error).toBe(errorMessage);
    expect(result.current.products).toEqual([]);
  });

  it('derives categories from products when category API fails', async () => {
    const mockProducts = [
      { _id: '1', title: 'Product 1', category: { name: 'Electronics' } },
      { _id: '2', title: 'Product 2', category: { name: 'Clothing' } },
      { _id: '3', title: 'Product 3', category: { name: 'Electronics' } }
    ];
    
    productApi.getAllProducts.mockResolvedValue({ success: true, products: mockProducts });
    productApi.getCategories.mockRejectedValue(new Error('Category API failed'));
    
    const { result } = renderHook(() => useProducts(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.categories.length).toBeGreaterThan(0);
    expect(result.current.categories.some(cat => cat.name === 'Electronics')).toBe(true);
    expect(result.current.categories.some(cat => cat.name === 'Clothing')).toBe(true);
  });

  it('gets product by ID', async () => {
    const mockProducts = [
      { _id: '1', title: 'Product 1', price: 100 },
      { _id: '2', title: 'Product 2', price: 200 }
    ];
    
    productApi.getAllProducts.mockResolvedValue({ success: true, products: mockProducts });
    productApi.getCategories.mockResolvedValue({ success: true, categories: [] });
    
    const { result } = renderHook(() => useProducts(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    const product = result.current.getProductById('1');
    expect(product).toEqual(mockProducts[0]);
  });

  it('gets product by slug', async () => {
    const mockProducts = [
      { _id: '1', title: 'Product 1', slug: 'product-1', price: 100 },
      { _id: '2', title: 'Product 2', slug: 'product-2', price: 200 }
    ];
    
    productApi.getAllProducts.mockResolvedValue({ success: true, products: mockProducts });
    productApi.getCategories.mockResolvedValue({ success: true, categories: [] });
    
    const { result } = renderHook(() => useProducts(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    const product = result.current.getProductBySlug('product-1');
    expect(product).toEqual(mockProducts[0]);
  });

  it('refreshes products', async () => {
    const initialProducts = [{ _id: '1', title: 'Product 1' }];
    const updatedProducts = [
      { _id: '1', title: 'Product 1' },
      { _id: '2', title: 'Product 2' }
    ];
    
    productApi.getAllProducts
      .mockResolvedValueOnce({ success: true, products: initialProducts })
      .mockResolvedValueOnce({ success: true, products: updatedProducts });
    productApi.getCategories.mockResolvedValue({ success: true, categories: [] });
    
    const { result } = renderHook(() => useProducts(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.products).toEqual(initialProducts);
    
    await result.current.refresh();
    
    await waitFor(() => {
      expect(result.current.products).toEqual(updatedProducts);
    });
  });

  it('throws error when useProducts is used outside ProductsProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      renderHook(() => useProducts());
    }).toThrow('useProducts must be used within a ProductsProvider');
    
    consoleSpy.mockRestore();
  });

  it('handles different response formats for products', async () => {
    const mockProducts = [{ _id: '1', title: 'Product 1' }];
    
    // Test with data property
    productApi.getAllProducts.mockResolvedValue({ data: mockProducts });
    productApi.getCategories.mockResolvedValue({ success: true, categories: [] });
    
    const { result } = renderHook(() => useProducts(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.products).toEqual(mockProducts);
  });

  it('handles array response for products', async () => {
    const mockProducts = [{ _id: '1', title: 'Product 1' }];
    
    productApi.getAllProducts.mockResolvedValue(mockProducts);
    productApi.getCategories.mockResolvedValue({ success: true, categories: [] });
    
    const { result } = renderHook(() => useProducts(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.products).toEqual(mockProducts);
  });
});
