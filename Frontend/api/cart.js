import api from "./axios";

export const getCart = async () => 
  (await api.get("/cart")).data;

export const addToCart = async (productId, quantity = 1) =>
  (await api.post("/cart/items", { productId, quantity })).data;

export const updateCartItem = async (itemId, quantity) =>
  (await api.put(`/cart/items/${itemId}`, { quantity })).data;

export const removeCartItem = async (itemId) =>
  (await api.delete(`/cart/items/${itemId}`)).data;

export const clearCart = async () =>
  (await api.delete("/cart")).data;