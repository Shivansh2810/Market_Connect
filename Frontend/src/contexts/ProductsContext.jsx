import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getAllProducts } from '../../api/product';
import { getAllCategories } from '../../api/category';

const ProductsContext = createContext(null);

export const ProductsProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const deriveCategoriesFromProducts = useCallback((productList) => {
    const names = productList
      .map((product) => product?.category?.name || product?.category?.title || product?.category)
      .filter(Boolean);
    const unique = Array.from(new Set(names));
    return unique.map((name) => ({ _id: name, name }));
  }, []);

  const fetchCategories = useCallback(
    async (fallbackProducts = []) => {
      try {
        const response = await getAllCategories();
        if (response?.success && Array.isArray(response.categories)) {
          setCategories(response.categories);
        } else if (Array.isArray(response)) {
          setCategories(response);
        } else {
          setCategories(deriveCategoriesFromProducts(fallbackProducts));
        }
      } catch (catError) {
        console.warn('Failed to load categories, falling back to derived list', catError);
        setCategories(deriveCategoriesFromProducts(fallbackProducts));
      }
    },
    [deriveCategoriesFromProducts]
  );

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await getAllProducts();
      let fetchedProducts = [];

      if (response?.success && Array.isArray(response.products)) {
        fetchedProducts = response.products;
      } else if (response?.data && Array.isArray(response.data)) {
        fetchedProducts = response.data;
      } else if (Array.isArray(response)) {
        fetchedProducts = response;
      }

      setProducts(fetchedProducts);
      await fetchCategories(fetchedProducts);
    } catch (fetchError) {
      console.error('Failed to load products', fetchError);
      setError(fetchError.response?.data?.message || 'Unable to load products from the server.');
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const getProductById = useCallback(
    (id) => products.find((product) => product._id === id || product.id === id),
    [products]
  );

  const getProductBySlug = useCallback(
    (slug) => products.find((product) => product.slug === slug),
    [products]
  );

  const value = useMemo(
    () => ({
      products,
      categories,
      loading,
      error,
      refresh: fetchProducts,
      getProductById,
      getProductBySlug
    }),
    [products, categories, loading, error, fetchProducts, getProductById, getProductBySlug]
  );

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
};

export const useProducts = () => {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
};
