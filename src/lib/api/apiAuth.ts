import api from "./api";
import type { Permission, Role, User } from "../types";

/* =========================================================
   LOGIN
========================================================= */

export const login = async (
  phone: string,
  password: string,
): Promise<User> => {
  try {
    const response = await api.post("/login", {
      phone,
      password,
    });

    const { user, token } = response.data.data;

    if (!user || !token) {
      throw new Error("Invalid credentials");
    }

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    return user;
  } catch (error) {
    console.error("Erreur login :", error);
    throw error; // IMPORTANT
  }
};

/* =========================================================
   LOGOUT
========================================================= */

export const logout = async (): Promise<void> => {
  try {
    await api.post("/logout");
  } catch (error) {
    console.error("Erreur lors de la déconnexion :", error);
  } finally {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }
};

/* =========================================================
   CURRENT USER
========================================================= */

export const currentUser = async (): Promise<User | null> => {
  try {
    const response = await api.get("/me");
    return response.data.data;
  } catch (error) {
     console.error("Erreur lors de la connexion :", error);
      return null;
  }
};

/* =========================================================
   STORE
========================================================= */

export const setActiveStore = (storeId: string): void => {
  localStorage.setItem("storeId", storeId);
};

/* =========================================================
   ADMIN CHECK (multi roles)
========================================================= */

export const isAdmin = (user: User | null): boolean => {
  if (!user?.roles) return false;

  return user.roles.some(
    (role) => role.name === "Administrateur"
  );
};

/* =========================================================
   PERMISSIONS (multi roles)
========================================================= */

export const hasPermission = (
  user: User | null,
  module: string,
  permission: Permission,
): boolean => {
  if (!user) return false;

  // Admin = accès total
  if (isAdmin(user)) return true;

  if (!user.roles || user.roles.length === 0) return false;

  // Vérifie tous les rôles
  return user.roles.some((role: Role) => {
    const permissions =
      role.permissions?.[module] ?? [];

    return permissions.includes(permission);
  });
};

/* =========================================================
   ACCÈS MODULE
========================================================= */

export const can = (
  user: User | null,
  modules: string[],
): boolean => {
  if (!user) return false;

  if (isAdmin(user)) return true;

  return modules.some((module) =>
    hasPermission(user, module, "read")
  );
};

/* =========================================================
   MODULES ERP
========================================================= */

export const ALL_MODULES: {
  key: string;
  label: string;
}[] = [
  { key: "dashboard", label: "Tableau de bord" },
  { key: "products", label: "Produits" },
  { key: "categories", label: "Catégories" },
  { key: "stock", label: "Stock" },
  { key: "transfers", label: "Transferts" },
  { key: "sales", label: "Ventes" },
  { key: "purchases", label: "Achats" },
  { key: "supplier_invoices", label: "Factures fournisseurs" },
  { key: "customers", label: "Clients" },
  { key: "suppliers", label: "Fournisseurs" },
  { key: "debts", label: "Dettes" },
  { key: "cash", label: "Caisse" },
  { key: "inventory", label: "Inventaire" },
  { key: "reports", label: "Rapports" },
  { key: "users", label: "Utilisateurs" },
  { key: "stores", label: "Magasins" },
  { key: "settings", label: "Paramétrage" },
];

/* =========================================================
   PERMISSIONS LIST
========================================================= */

export const ALL_PERMISSIONS: Permission[] = [
  "read",
  "write",
  "edit",
  "delete",
];