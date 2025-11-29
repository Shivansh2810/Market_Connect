import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAllProducts, getProductById, getSimilarProducts, getCategories } from '../product';
import api from '../axios';

// Mock the API
vi.mock('../axios');

describe('Product API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllProducts', () => {
    it('fetches all products successfully', async () => {
      const mockProducts = {
        success: true,
        products: [
          { _id: '1', title: 'Product 1', price: 100 },
          { _id: '2', title: 'Product 2', price: 200 }
        ]
      };
      
      api.get.mockResolvedValueOnce({ data: mockProducts });
      
      const result = await getAllProducts();
      
      expect(api.get).toHaveBeenCalledWith('/products');
      expect(result).toEqual(mockProducts);
    });

    it('handles error when fetching products', async () => {
      const mockError = new Error('Network error');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      api.get.mockRejectedValueOnce(mockError);
      
      await expect(getAllProducts()).rejects.toThrow('Network error');
      expect(api.get).toHaveBeenCalledWith('/products');
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching products:', mockError);
      consoleSpy.mockRestore();
    });
  });

  describe('getProductById', () => {
    it('fetches product by ID successfully', async () => {
      const mockProduct = {
        success: true,
        product: {
          _id: '123',
          title: 'Test Product',
          price: 100,
          description: 'Test description'
        }
      };
      
      api.get.mockResolvedValueOnce({ data: mockProduct });
      
      const result = await getProductById('123');
      
      expect(api.get).toHaveBeenCalledWith('/products/123');
      expect(result).toEqual(mockProduct);
    });

    it('handles error when product not found', async () => {
      const mockError = {
        response: {
          status: 404,
          data: { message: 'Product not found' }
        }
      };
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      api.get.mockRejectedValueOnce(mockError);
      
      await expect(getProductById('999')).rejects.toEqual(mockError);
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching product:', mockError);
      expect(consoleSpy).toHaveBeenCalledWith('Error response:', mockError.response.data);
      consoleSpy.mockRestore();
    });

    it('logs console messages for debugging', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const mockProduct = {
        success: true,
        product: { _id: '123', title: 'Test' }
      };
      
      api.get.mockResolvedValueOnce({ data: mockProduct });
      
      await getProductById('123');
      
      expect(consoleSpy).toHaveBeenCalledWith('🔍 Fetching product with ID:', '123');
      expect(consoleSpy).toHaveBeenCalledWith('Product API response:', mockProduct);
      
      consoleSpy.mockRestore();
    });
  });

  describe('getSimilarProducts', () => {
    it('fetches similar products successfully', async () => {
      const mockProducts = {
        success: true,
        products: [
          { _id: '2', title: 'Similar Product 1', price: 90 },
          { _id: '3', title: 'Similar Product 2', price: 110 }
        ]
      };
      
      api.get.mockResolvedValueOnce({ data: mockProducts });
      
      const result = await getSimilarProducts('123');
      
      expect(api.get).toHaveBeenCalledWith('/products/123/similar');
      expect(result).toEqual(mockProducts);
    });

    it('handles error when fetching similar products', async () => {
      const mockError = new Error('Server error');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      api.get.mockRejectedValueOnce(mockError);
      
      await expect(getSimilarProducts('123')).rejects.toThrow('Server error');
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching similar products:', mockError);
      consoleSpy.mockRestore();
    });
  });

  describe('getCategories', () => {
    it('fetches categories successfully', async () => {
      const mockCategories = {
        success: true,
        categories: [
          { _id: '1', name: 'Electronics' },
          { _id: '2', name: 'Clothing' }
        ]
      };
      
      api.get.mockResolvedValueOnce({ data: mockCategories });
      
      const result = await getCategories();
      
      expect(api.get).toHaveBeenCalledWith('/category');
      expect(result).toEqual(mockCategories);
    });

    it('handles error when fetching categories', async () => {
      const mockError = new Error('Server error');
      api.get.mockRejectedValueOnce(mockError);
      
      await expect(getCategories()).rejects.toThrow('Server error');
    });
  });
});
