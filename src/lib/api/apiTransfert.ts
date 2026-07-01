import api from "./api";
import { Transfer } from "../types";

export const getTransfers = async () => {
  const response = await api.get("/transfers");
  return response.data;
};

export const getTransfer = async (
  id: string | number
) => {
  const response = await api.get(
    `/transfers/${id}`
  );

  return response.data;
};

export const createTransfer = async (
  data: Partial<Transfer>
) => {
  const response = await api.post(
    "/transfers/create",
    data
  );

  return response.data;
};

export const deleteTransfer = async (
  id: string | number
) => {
  const response = await api.delete(
    `/transfers/${id}`
  );

  return response.data;
};