import { Supplier} from "../types";
import api from "./api";

// Récupérer tous les fournisseurs
export const getSuppliers = async () => {
  const response = await api.get("/suppliers");
  return response.data;
};

// Récupérer un client par ID
export const getSupplier = async (id: number | string) => {
  const response = await api.get(`/suppliers/${id}`);
  return response.data;
};

// Créer un client
export const createSupplier = async (
  supplierData:  Partial<Supplier>,
) => {
  const response = await api.post(
    "/suppliers/create",
    supplierData,
  );

  return response.data;
};

// Mettre à jour un fournisseur
export const updateSupplier = async (
  id: number | string,
  supplierData:  Partial<Supplier>,
) => {
  const response = await api.put(
    `/suppliers/${id}`,
    supplierData,
  );

  return response.data;
};

// Supprimer un client
export const deleteSupplier = async (
  id: number | string,
) => {
  const response = await api.delete(
    `/suppliers/${id}`,
  );

  return response.data;
};

