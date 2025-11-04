import api from "./axios";

export const applyCoupon = async (code) =>
  (await api.post("/coupons/apply", { code })).data;
