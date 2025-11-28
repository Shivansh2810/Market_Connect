import api from './axios';

// Create a new review
export const createReview = async (reviewData) => {
  const response = await api.post('/reviews', reviewData);
  return response.data;
};

// Update an existing review
export const updateReview = async (reviewId, reviewData) => {
  const response = await api.put(`/reviews/${reviewId}`, reviewData);
  return response.data;
};

// Delete a review
export const deleteReview = async (reviewId) => {
  const response = await api.delete(`/reviews/${reviewId}`);
  return response.data;
};

// Get reviews for a specific product (Public view)
export const getProductReviews = async (productId) => {
  const response = await api.get(`/reviews/product/${productId}`);
  return response.data;
};

export const getMyReviews = async () => {
  // IMPORTANT: Ensure your backend has a route matching this (e.g., router.get('/my-reviews', ...))
  // If your backend uses '/reviews/me' or '/reviews/user', change the string below.
  const response = await api.get('/reviews/my-reviews');
  return response.data;
};