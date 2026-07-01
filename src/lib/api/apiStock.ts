import api from "./api";

export const getStocks = async () => {
  const response = await api.get("/stocks");
  return response.data;
};