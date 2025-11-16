import api from "./axios";

export const getAllProducts = async () => {
  try {
    const response = await api.get("/products");
    return response.data; // This should now return { success: true, products: [...] }
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
};

export const getProductById = async (id) => {
  try {
    const response = await api.get(`/products/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching product:", error);
    throw error;
  }
};
export const getCategories = async () =>
  (await api.get("/category")).data;