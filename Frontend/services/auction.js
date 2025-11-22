import api from "./axios";

// Get all active auctions
export const getActiveAuctions = async () => {
  try {
    const response = await api.get("/auctions");
    return response.data;
  } catch (error) {
    console.error("Error fetching auctions:", error);
    throw error;
  }
};

// Get upcoming auctions
export const getUpcomingAuctions = async () => {
  try {
    const response = await api.get("/auctions/upcoming");
    return response.data;
  } catch (error) {
    console.error("Error fetching upcoming auctions:", error);
    throw error;
  }
};

// Get auction by ID
export const getAuctionById = async (id) => {
  try {
    const response = await api.get(`/auctions/${id}`);
    return response.data.data || response.data;
  } catch (error) {
    console.error("Error fetching auction:", error);
    throw error;
  }
};

// Create auction (admin only)
export const createAuction = async (auctionData) => {
  try {
    const response = await api.post("/auctions", auctionData);
    return response.data;
  } catch (error) {
    console.error("Error creating auction:", error);
    throw error;
  }
};

// Update auction (admin only)
export const updateAuction = async (id, updateData) => {
  try {
    const response = await api.put(`/auctions/${id}`, updateData);
    return response.data;
  } catch (error) {
    console.error("Error updating auction:", error);
    throw error;
  }
};

// Cancel auction (admin only)
export const cancelAuction = async (id) => {
  try {
    const response = await api.delete(`/auctions/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error cancelling auction:", error);
    throw error;
  }
};
