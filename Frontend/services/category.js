import api from './axios';

export const getAllCategories = async () => {
  try {
    // ✅ FIXED: Changed from '/categories' to '/category'
    const response = await api.get('/category');
    return response.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

export const getCategoryById = async (id) => {
  try {
    // ✅ FIXED: Changed from '/categories/${id}' to '/category/${id}'
    const response = await api.get(`/category/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching category:', error);
    throw error;
  }
};

export const createCategory = async (categoryData) => {
  try {
    // ✅ FIXED: Changed from '/categories' to '/category'
    const response = await api.post('/category', categoryData);
    return response.data;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

export const updateCategory = async (id, categoryData) => {
  try {
    // ✅ FIXED: Changed from '/categories/${id}' to '/category/${id}'
    const response = await api.put(`/category/${id}`, categoryData);
    return response.data;
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

export const deleteCategory = async (id) => {
  try {
    // ✅ FIXED: Changed from '/categories/${id}' to '/category/${id}'
    const response = await api.delete(`/category/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};