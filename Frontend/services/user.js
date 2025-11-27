import api from './axios';

export const getCurrentUserProfile = async () => {
  const response = await api.get('/users/me');
  return response.data;
};

export const updateCurrentUserProfile = async (payload) => {
  try {
    const response = await api.put('/users/me/profile', payload);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      const fallbackResponse = await api.put('/users/me/profile', payload);
      return fallbackResponse.data;
    }
    throw error;
  }
}; 

export const getCurrentUserOrders = async () => {
  try {
    const response = await api.get('/users/me/orders');
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      const fallbackResponse = await api.get('/users/me/orders');
      return fallbackResponse.data;
    }
    throw error;
  }
};

export const upgradeToSeller = async (shopName, shopAddress) => {
  const response = await api.put('/users/upgradetoseller', {
    shopName,
    shopAddress
  });
  return response.data;
};

// api/user.js - Update login function
export const login = async (loginData) => {
  try {
    const response = await api.post('/users/login', loginData); // ✅ Fixed endpoint
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const adminLogin = async (loginData) => {
  try {
    const response = await api.post('/users/admin/login', loginData); // ✅ Fixed endpoint
    return response.data;
  } catch (error) {
    console.error('Admin login error:', error);
    throw error;
  }
};

export const signup = async (signupData) => {
  try {
    const response = await api.post('/users/signup', signupData);
    return response.data;
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
};

export const forgotPassword = async (email) => {
  try {
    const response = await api.post('/users/forgot-password', { email });
    return response.data;
  } catch (error) {
    console.error('Forgot password error:', error);
    throw error;
  }
};

export const resetPassword = async (token, passwordData) => {
  try {
    const response = await api.post('/users/reset-password', {
      token,
      ...passwordData
    });
    return response.data;
  } catch (error) {
    console.error('Reset password error:', error);
    throw error;
  }
};