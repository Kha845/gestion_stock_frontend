import { Category} from "../types";
import api from "./api";

// Récupérer tous les categories

export const getCategories = async () => {
  const response = await api.get("/categories");
  return response.data;
};

// Récupérer une catégorie par ID
export const getCategorie = async (id: number | string) => {
  const response = await api.get(`/categories/${id}`);
  return response.data;
};

// Créer une catégorie
export const createCategory = async (
  categoryData:  Partial<Category>,
) => {
  const response = await api.post(
    "/categories/create",
    categoryData,
  );

  return response.data;
};

// Mettre à jour un magasin
export const updateCategory = async (
  id: number | string,
  categoryData:  Partial<Category>,
) => {
  const response = await api.put(
    `/categories/${id}`,
    categoryData,
  );

  return response.data;
};

// Supprimer un magasin
export const deleteCategory = async (
  id: number | string,
) => {
  const response = await api.delete(
    `/categories/${id}`,
  );
  return response.data;
};

