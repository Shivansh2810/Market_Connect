import api from "./axios";

export const getAllProducts = async () => {
  try {
    const response = await api.get("/products");
    return response.data; 
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
};

export const getProductById = async (id) => {
  try {
    console.log('🔍 Fetching product with ID:', id);
    const response = await api.get(`/products/${id}`);
    console.log('Product API response:', response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching product:", error);
    console.error("Error response:", error.response?.data);
    throw error;
  }
};

export const getSimilarProducts = async (id) => {
  try {
    const response = await api.get(`/products/${id}/similar`);
    return response.data;
  } catch (error) {
    console.error("Error fetching similar products:", error);
    throw error;
  }
};

export const getCategories = async () =>
  (await api.get("/category")).data;