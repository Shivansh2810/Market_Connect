import api from "./axios";

export const getReviews = async (productId) =>
  (await api.get(`/reviews/product/${productId}`)).data;
export const createReview = async (data) =>
  (await api.post("/reviews", data)).data;
