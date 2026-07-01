import api from "./api";
import { Purchase } from "../types";

export const getPurchases = async () => {
  const response = await api.get("/purchases");
  return response.data;
};

export const getPurchase = async (
  id: string | number
) => {
  const response = await api.get(
    `/purchases/${id}`
  );

  return response.data;
};

export const createPurchase = async (
  data: Partial<Purchase>
) => {
  const response = await api.post(
    "/purchases/create",
    data
  );

  return response.data;
};

export const deletePurchase = async (
  id: string | number
) => {
  const response = await api.delete(
    `/purchases/${id}`
  );

  return response.data;
};