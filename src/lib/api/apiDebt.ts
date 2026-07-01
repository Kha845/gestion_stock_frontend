import api from "./api";

/**
 * Liste des dettes
 */
export const getDebts = async (
  type?: string,
  partyId?: number
) => {
  const response = await api.get(
    "/debts",
    {
      params: {
        type,
        party_id: partyId,
      },
    }
  );

  return response.data;
};

/**
 * Détail d'une dette
 */
export const getDebt = async (id: number) => {
  const response = await api.get(`/debts/${id}`);
  return response.data;
};

/**
 * Création d'une dette
 */
export const createDebt = async (data: {
  type: "client" | "fournisseur";
  party_id: number;
  reference: number;
  total: number;
  paid?: number;
  due_date?: string;
}) => {
  const response = await api.post(
    "/debts",
    data
  );

  return response.data;
};

/**
 * Modification d'une dette
 */
export const updateDebt = async (
  id: number,
  data: Partial<{
    type: "client" | "fournisseur";
    party_id: number;
    reference: number;
    total: number;
    paid: number;
    due_date: string;
  }>
) => {
  const response = await api.put(
    `/debts/${id}`,
    data
  );

  return response.data;
};

/**
 * Enregistrer un paiement
 */
export const payDebt = async (
  id: number,
  amount: number
) => {
  const response = await api.post(
    `/debts/${id}/payment`,
    {
      amount,
    }
  );

  return response.data;
};

/**
 * Suppression d'une dette
 */
export const deleteDebt = async (
  id: number
) => {
  const response = await api.delete(
    `/debts/${id}`
  );

  return response.data;
};

/* =========================
   📊 HISTORIQUE DES PAIEMENTS
   (nouveau - recommandé)
========================= */

export const getDebtPayments = async () => {
  const response = await api.get("/debts/payments");
  return response.data;
};

/* =========================
   📊 PAIEMENTS D'UNE DETTE
   (très utile UI)
========================= */
export const getDebtPaymentsByDebt = async (id: number) => {
  const response = await api.get(`/debts/${id}/payments`);
  return response.data;
};


export const getTotalDebt = async (
  type?: string,
  partyId?: number
) => {
  const response = await api.get(
    "/debts/total",
    {
      params: {
        type,
        party_id: partyId,
      },
    }
  );

  return response.data.total;
};