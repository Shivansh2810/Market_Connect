import api from './axios';

export const getActiveAuctions = async () => {
  try {
    const resp = await api.get('/auctions');
    // backend returns { success: true, data: auctions }
    return resp.data?.data || resp.data || [];
  } catch (error) {
    console.error('Error fetching auctions:', error);
    throw error;
  }
};

export const getAuctionById = async (id) => {
  try {
    const resp = await api.get(`/auctions/detail/${id}`);
    return resp.data?.data || resp.data || null;
  } catch (error) {
    console.error('Error fetching auction by id:', error);
    throw error;
  }
};

export const getAllAuctionsAdmin = async () => {
  try {
    const resp = await api.get('/auctions/admin/all');
    return resp.data?.data || resp.data || [];
  } catch (error) {
    console.error('Error fetching all auctions for admin:', error);
    throw error;
  }
};

export const createAuction = async (auctionData) => {
  try {
    const resp = await api.post('/auctions', auctionData);
    return resp.data || {};
  } catch (error) {
    console.error('Error creating auction:', error);
    throw error;
  }
};

export const updateAuction = async (id, updateData) => {
  try {
    const resp = await api.put(`/auctions/${id}`, updateData);
    return resp.data || {};
  } catch (error) {
    console.error('Error updating auction:', error);
    throw error;
  }
};

export const cancelAuction = async (id) => {
  try {
    const resp = await api.delete(`/auctions/${id}`);
    return resp.data || {};
  } catch (error) {
    console.error('Error cancelling auction:', error);
    throw error;
  }
};
