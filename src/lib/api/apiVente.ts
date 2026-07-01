import api from "./api";

export interface SalePayload {
  store_id: string | null;
  customer_id?: string | null;
  payment_method: string;
  paid: number;
  user_id: string;
  date: string;

  items: {
    product_id: string;
    quantity: number;
    discount: number;
  }[];
}
// Récupérer tous les ventes

export const getSales = async () => {
  const response = await api.get("/sales");
  return response.data;
};

// Récupérer une ventes par ID
export const getSale = async (id: number | string) => {
  const response = await api.get(`/sales/${id}`);
  return response.data;
};

// Créer une ventes
export const createSale = async (
  venteData:  SalePayload,
) => {
  const response = await api.post(
    "/sales/create",
    venteData,
  );

  return response.data;
};

// Mettre à jour une vente
export const updateSale = async (
  id: number | string,
  saleData:  SalePayload,
) => {
  const response = await api.put(
    `/sales/${id}`,
    saleData,
  );

  return response.data;
};

// Supprimer une vente
export const deleteSale = async (
  id: number | string,
) => {
  const response = await api.delete(
    `/sales/${id}`,
  );
  return response.data;
};

