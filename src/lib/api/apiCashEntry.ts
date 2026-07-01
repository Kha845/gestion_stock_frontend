import { CashEntry } from "../types";
import api from "./api";

export const getCashEntries = () => {
  return api.get("/cash-entries");
};

export const getCashEntry = (
  id: number | string
) => {
  return api.get(`/cash-entries/${id}`);
};

export const createCashEntry = (
  data: Partial<CashEntry>
) => {
  return api.post(
    "/cash-entries",
    data
  );
};

export const updateCashEntry = (
  id: number | string,
  data: Partial<CashEntry>
) => {
  return api.put(
    `/cash-entries/${id}`,
    data
  );
};

export const deleteCashEntry = (
  id: number | string
) => {
  return api.delete(
    `/cash-entries/${id}`
  );
};
