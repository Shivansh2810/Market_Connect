import api from './axios';

// Request return for an order
export const requestReturn = async (returnData) => {
  const response = await api.post('/returns/request', returnData);
  return response.data;
};

// Get buyer's return requests
export const getMyReturns = async () => {
  const response = await api.get('/returns/my-returns');
  return response.data;
};

// Get returns for a specific order
export const getReturnsByOrderId = async (orderId) => {
  const response = await api.get(`/returns/order/${orderId}`);
  return response.data;
};

// Get specific return details
export const getReturnById = async (returnId) => {
  const response = await api.get(`/returns/${returnId}`);
  return response.data;
};
