import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { Store, User } from "@/lib/types";

import {
  login as loginApi,
  logout as logoutApi,
  currentUser,
} from "@/lib/api/apiAuth";

import { getStores } from "@/lib/api/apiStore";

/* =========================
   TYPES
========================= */
interface AuthCtx {
  user: User | null;
  stores: Store[];
  login: (u: string, p: string) => Promise<User>;
  logout: () => Promise<void>;
  storeId: string;
  setStoreId: (id: string) => void;
  refreshStores: () => Promise<void>;
}

/* =========================
   CONTEXT
========================= */
const Ctx = createContext<AuthCtx | null>(null);

/* =========================
   PROVIDER
========================= */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [storeId, setStoreId] = useState<string>("");

  
  /* INIT USER */
  useEffect(() => {
    const init = async () => {
      const user = await currentUser();
      setUser(user);
      if (user?.store_id) {
        setStoreId(String(user.store_id));
      }
    };
    init();
  }, []);

  /* =========================
     LOGIN
  ========================= */
  const login = async (u: string, p: string): Promise<User> => {
    const user = await loginApi(u, p);

    setUser(user);

    if (user.store_id) {
    setStoreId(String(user.store_id));
  }

    return user;
  };

  /* =========================
     LOGOUT
  ========================= */
  const logout = async (): Promise<void> => {
    await logoutApi();

    setUser(null);
  };

  /* =========================
     STORES
  ========================= */
  const refreshStores = async () => {
    const res = await getStores();
    setStores(res.data ?? res);
  };

  /* =========================
     MEMO VALUE
  ========================= */
  const value = useMemo(
    () => ({
      user,
      stores,
      login,
      logout,
      refreshStores,
      storeId,
      setStoreId,
    }),
    [user, stores,storeId],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
    </Ctx.Provider>
  );
}

/* =========================
   HOOK
========================= */
export const useAuth = () => {
  const ctx = useContext(Ctx);

  if (!ctx) {
    throw new Error("AuthProvider missing");
  }

  return ctx;
};