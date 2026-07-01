import api from "./api";

// Récupérer tous les produits
export const getProducts = async (
  storeId?: string | number
) => {
  const response = await api.get(
    "/products",
    {
      params: {
        store_id: storeId,
      },
    }
  );

  return response.data;
};

// Récupérer un produit par ID
export const getProduct = async (id: number | string) => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

// Créer un produit
export const createProduct = async (
  productData:  FormData,
) => {
  const response = await api.post(
    "/products/create",
     productData, {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
  );

  return response.data;
};

// Mettre à jour un product

export const updateProduct = async (
  id: number | string,
  data: FormData
) => {
  const response = await api.post(
    `/products/${id}?_method=PUT`,
    data,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

// Supprimer un produit

export const deleteProduct = async (
  id: number | string,
) => {
  const response = await api.delete(
    `/products/${id}`,
  );
  return response.data;
};

