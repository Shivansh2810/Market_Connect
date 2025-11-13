import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);

const STORAGE_KEY = 'market-connect-cart';

const createCartItem = (product, quantity) => ({
  _id: `cart_${Date.now()}_${product._id}`,
  productId: product._id,
  quantity,
  price: product.price,
  addedAt: new Date().toISOString(),
  productDetails: {
    title: product.title,
    price: product.price,
    currency: product.currency,
    image: product.images?.find((img) => img.isPrimary)?.url || product.images?.[0]?.url || '',
    category: product.category?.name ?? 'General'
  }
});

const mergeCartItems = (existingItems) => {
  const map = new Map();
  existingItems.forEach((item) => {
    if (map.has(item.productId)) {
      const merged = map.get(item.productId);
      map.set(item.productId, {
        ...merged,
        quantity: merged.quantity + item.quantity,
        price: item.price
      });
    } else {
      map.set(item.productId, item);
    }
  });
  return Array.from(map.values());
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return mergeCartItems(parsed);
    } catch (error) {
      console.error('Failed to parse stored cart', error);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = (product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.productId === product._id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product._id
            ? { ...item, quantity: item.quantity + quantity, price: product.price }
            : item
        );
      }
      return [...prev, createCartItem(product, quantity)];
    });
  };

  const replaceCartWith = (product, quantity = 1) => {
    setItems([createCartItem(product, quantity)]);
  };

  const removeFromCart = (productId) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => setItems([]);

  const summary = useMemo(() => ({
    itemCount: items.reduce((count, item) => count + item.quantity, 0),
    totalAmount: items.reduce((total, item) => total + item.price * item.quantity, 0)
  }), [items]);

  const value = {
    items,
    addToCart,
    replaceCartWith,
    removeFromCart,
    updateQuantity,
    clearCart,
    ...summary
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
