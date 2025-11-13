import React, { createContext, useContext, useMemo } from 'react';
import { sampleProducts, categories } from '../data/sampleProducts';

const ProductsContext = createContext(null);

export const ProductsProvider = ({ children }) => {
  const value = useMemo(
    () => ({
      products: sampleProducts,
      categories,
      getProductById: (id) => sampleProducts.find((product) => product._id === id),
      getProductBySlug: (slug) => sampleProducts.find((product) => product.slug === slug)
    }),
    []
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
