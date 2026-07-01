import { Permission} from "../types";
import api from "./api";

export interface RolePayload {
  name: string;
  description: string | null;
  permissions: Record<string, Permission[]>;
}

// Récupérer tous les roles
export const getRoles = async () => {
  const response = await api.get("/roles");
  return response.data;
};

// Récupérer un role par ID
export const getRole = async (id: number | string) => {
  const response = await api.get(`/roles/${id}`);
  return response.data;
};

// Créer un role
export const createRole = async (
  roleData: RolePayload,
) => {
  const response = await api.post(
    "/roles/create",
    roleData,
  );

  return response.data;
};

// Mettre à jour un utilisateur
export const updateRole = async (
  id: number | string,
  roleData: RolePayload,
) => {
  const response = await api.put(
    `/roles/${id}`,
    roleData,
  );

  return response.data;
};

// Supprimer un role
export const deleteRole = async (
  id: number | string,
) => {
  const response = await api.delete(
    `/roles/${id}`,
  );

  return response.data;
};

