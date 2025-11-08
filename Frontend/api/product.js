import api from "./axios";

export const getAllProducts = async () => (await api.get("/products")).data;
export const getProductById = async (id) =>
  (await api.get(`/products/${id}`)).data;
