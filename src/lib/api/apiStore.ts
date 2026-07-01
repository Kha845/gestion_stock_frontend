import { Store } from "../types";
import api from "./api";

// Récupérer tous les magasins
export const getStores = async () => {
  const response = await api.get("/stores");
  return response.data;
};

// Récupérer un magasin par ID
export const getStore = async (id: number | string) => {
  const response = await api.get(`/stores/${id}`);
  return response.data;
};

// Créer un magasin
export const createStore = async (
  storeData:  FormData,
) => {
  const response = await api.post(
    "/stores/create",
    storeData,{
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        },
  );

  return response.data;
};

// Mettre à jour un magasin
export const updateStore = async (
  id: number | string,
  storeData: FormData,
) => {
  const response = await api.put(
    `/stores/${id}`,
    storeData
  );

  return response.data;
};
// Supprimer un magasin
export const deleteStore = async (
  id: number | string,
) => {
  const response = await api.delete(
    `/stores/${id}`,
  );

  return response.data;
};

