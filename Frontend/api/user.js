import api from './axios';

export const getCurrentUserProfile = async () => {
  const response = await api.get('/me');
  return response.data;
};

export const updateCurrentUserProfile = async (payload) => {
  try {
    const response = await api.put('/me/profile', payload);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      const fallbackResponse = await api.put('/me/profile', payload);
      return fallbackResponse.data;
    }
    throw error;
  }
}; 

export const getCurrentUserOrders = async () => {
  try {
    const response = await api.get('/me/orders');
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      const fallbackResponse = await api.get('/me/orders');
      return fallbackResponse.data;
    }
    throw error;
  }
};

export const upgradeToSeller = async (shopName, shopAddress) => {
  const response = await api.put('/upgradetoseller', {
    shopName,
    shopAddress
  });
  return response.data;
};
