import api from "./axios";

export const createOrder = async (orderData) =>
  (await api.post("/orders/create", orderData)).data;
export const getMyOrders = async () =>
  (await api.get("/orders/my-orders")).data;
