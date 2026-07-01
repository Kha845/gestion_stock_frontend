import api from "./api";

export const getStockMovements = async () => {
  const response = await api.get(
    "/stock-movements"
  );

  return response.data;
};