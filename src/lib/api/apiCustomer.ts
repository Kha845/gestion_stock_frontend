import { Customer} from "../types";
import api from "./api";

// Récupérer tous les clients
export const getCustomers = async () => {
  const response = await api.get("/customers");
  return response.data;
};

// Récupérer un client par ID
export const getCustomer = async (id: number | string) => {
  const response = await api.get(`/customers/${id}`);
  return response.data;
};

// Créer un client
export const createCustomer = async (
  customerData:  Partial<Customer>,
) => {
  const response = await api.post(
    "/customers/create",
    customerData,
  );

  return response.data;
};

// Mettre à jour un client
export const updateCustomer = async (
  id: number | string,
  customerData:  Partial<Customer>,
) => {
  const response = await api.put(
    `/customers/${id}`,
    customerData,
  );

  return response.data;
};

// Supprimer un client
export const deleteCustomer = async (
  id: number | string,
) => {
  const response = await api.delete(
    `/customers/${id}`,
  );

  return response.data;
};

