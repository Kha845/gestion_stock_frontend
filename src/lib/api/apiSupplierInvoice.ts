import { SupplierInvoice } from "../types";
import api from "./api";

// Récupérer toutes les factures fournisseur
export const getSupplierInvoices = async () => {
  const response = await api.get("/supplier-invoices");
  return response.data;
};

// Récupérer une facture fournisseur par ID
export const getSupplierInvoice = async (
  id: number | string
) => {
  const response = await api.get(`/supplier-invoices/${id}`);
  return response.data;
};

// Créer une facture fournisseur
export const createSupplierInvoice = async (
  invoiceData: FormData
) => {
  const response = await api.post(
    "/supplier-invoices/create",
    invoiceData,{
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
  );

  return response.data;
};

// Mettre à jour une facture fournisseur
export const updateSupplierInvoice = async (
  id: number | string,
  invoiceData: Partial<SupplierInvoice>
) => {
  const response = await api.put(
    `/supplier-invoices/${id}`,
    invoiceData
  );

  return response.data;
};

// Supprimer une facture fournisseur
export const deleteSupplierInvoice = async (
  id: number | string
) => {
  const response = await api.delete(
    `/supplier-invoices/${id}`
  );

  return response.data;
};


export const paySupplierInvoice = async (
  id: number | string,
  data: {
    amount: number;
    payment_method: string;
    user_id: string | undefined
  }
) => {
  const response = await api.post(
    `/supplier-invoices/${id}/pay`,
    data
  );

  return response.data;
};