import api from "./axios";

export const applyCoupon = async (couponCode, cartValue) =>
  (await api.post("/coupons/apply", { couponCode, cartValue })).data;

export const getAllCoupons = async () => {
  try {
    const response = await api.get('/coupons');
    return response.data;
  } catch (error) {
    console.error('Error fetching coupons:', error);
    throw error;
  }
};

export const createCoupon = async (couponData) => {
  try {
    const response = await api.post('/coupons', couponData);
    return response.data;
  } catch (error) {
    console.error('Error creating coupon:', error);
    throw error;
  }
};

export const updateCoupon = async (id, couponData) => {
  try {
    const response = await api.put(`/coupons/${id}`, couponData);
    return response.data;
  } catch (error) {
    console.error('Error updating coupon:', error);
    throw error;
  }
};

export const deleteCoupon = async (id) => {
  try {
    const response = await api.delete(`/coupons/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting coupon:', error);
    throw error;
  }
};