import api from "./api";

export interface UserPayload {
  phone: string;
  password?: string;
  full_name: string;
  store_id: string | null;
  active: boolean | undefined;
  roles: string[];
}


// Récupérer tous les utilisateurs
export const getUsers = async () => {
  const response = await api.get("/users");
  return response.data;
};

// Récupérer un utilisateur par ID
export const getUser = async (id: number | string) => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

// Créer un utilisateur
export const createUser = async (
  userData: UserPayload,
) => {
  const response = await api.post(
    "/users/create",
    userData,
  );

  return response.data;
};

// Mettre à jour un utilisateur
export const updateUser = async (
  id: number | string,
  userData: UserPayload,
) => {
  const response = await api.put(
    `/users/${id}`,
    userData,
  );

  return response.data;
};

// Supprimer un utilisateur
export const deleteUser = async (
  id: number | string,
) => {
  const response = await api.delete(
    `/users/${id}`,
  );

  return response.data;
};

