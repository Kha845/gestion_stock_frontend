import api from "./api";

/**
 * Liste des inventaires
 */
export const getInventories = async () => {
  const response = await api.get(
    "/inventories"
  );

  return response.data;
};

/**
 * Détail d'un inventaire
 */
export const getInventory = async (
  id: string | number
) => {
  const response = await api.get(
    `/inventories/${id}`
  );

  return response.data;
};

/**
 * Création d'un inventaire
 */
export const createInventory = async (
  data: {
    store_id: number;
    date: string;
    lines: {
      product_id: string;
      physical: number;
    }[];
  }
) => {
  const response = await api.post(
    "/inventories",
    data
  );

  return response.data;
};

/**
 * Validation d'un inventaire
 */
export const validateInventory =
  async (
    id: string | number
  ) => {
    const response = await api.post(
      `/inventories/${id}/validate`
    );

    return response.data;
  };

/**
 * Suppression d'un inventaire
 */
export const deleteInventory =
  async (
    id: string | number
  ) => {
    const response = await api.delete(
      `/inventories/${id}`
    );

    return response.data;
  };

/**
 * Mise à jour  d'un inventaire
 */

export const updateInventory = async (
  id: number,
  data: any
) => {
  const response = await api.put(
    `/inventories/${id}`,
    data
  );

  return response.data;
};