import type {
  CashEntry,
  Category,
  Role,
  Customer,
  Debt,
  DebtPayment,
  InventorySession,
  Product,
  Purchase,
  Sale,
  StockLine,
  StockMovement,
  Store,
  Supplier,
  SupplierInvoice,
  Transfer,
  User,
} from "./types";

const KEY = "erp_db_v1";

export interface DB {
  users: User[];
  stores: Store[];
  categories: Category[];
  products: Product[];
  stock: StockLine[];
  movements: StockMovement[];
  customers: Customer[];
  suppliers: Supplier[];
  sales: Sale[];
  purchases: Purchase[];
  debts: Debt[];
  debtPayments: DebtPayment[];
  cash: CashEntry[];
  inventories: InventorySession[];
  transfers: Transfer[];
  roles: Role[];
  supplierInvoices: SupplierInvoice[];
  counters: { sale: number; purchase: number; transfer: number; invoice: number };
  session: { userId: string | null; storeId: string | null };
}

const seed = (): DB => {
  const now = new Date().toISOString();
  
  const stores: Store[] = [
    { id: "s1", name: "Magasin Central", address: "Avenue 1", phone: "0100000001", created_at: now },
    { id: "s2", name: "Magasin Nord", address: "Rue Nord", phone: "0100000002", created_at: now },
  ];
  const users: User[] = [
    { id: "u1", phone: "admin", password: "admin", fullName: "Administrateur", roleId: "admin", storeIds: [], active: true, created_at: now },
    { id: "u2", phone: "gestionnaire", password: "1234", fullName: "Gestionnaire Central", roleId: "gestionnaire", storeIds: ["s1"], active: true, created_at: now },
    { id: "u3", phone: "caissier", password: "1234", fullName: "Caissier Central", roleId: "caissier", storeIds: ["s1"], active: true, created_at: now },
    { id: "u4", phone: "comptable", password: "1234", fullName: "Comptable", roleId: "comptable", storeIds: [], active: true, created_at: now },
  ];
  const categories: Category[] = [
    { id: "c1", name: "Boissons" },
    { id: "c2", name: "Alimentaire" },
    { id: "c3", name: "Hygiène" },
  ];
  const products: Product[] = [
    { id: "p1", reference: "BO-001", name: "Eau minérale 1.5L", categoryId: "c1", unit: "pièce", price: 500, cost: 350, minStock: 20, createdAt: now },
    { id: "p2", reference: "BO-002", name: "Jus d'orange 1L", categoryId: "c1", unit: "pièce", price: 1500, cost: 1000, minStock: 10, createdAt: now },
    { id: "p3", reference: "AL-001", name: "Riz 5kg", categoryId: "c2", unit: "paquet", price: 5000, cost: 4000, minStock: 5, createdAt: now },
    { id: "p4", reference: "HY-001", name: "Savon", categoryId: "c3", unit: "pièce", price: 800, cost: 500, minStock: 15, createdAt: now },
  ];
  const stock: StockLine[] = [];
  for (const p of products) {
    for (const s of stores) {
      stock.push({ productId: p.id, storeId: s.id, quantity: Math.floor(Math.random() * 50) + 10 });
    }
  }
  return {
    users, stores, categories, products, stock,
    movements: [], customers: [], suppliers: [],
    sales: [], purchases: [], debts: [], debtPayments: [],
    cash: [], inventories: [], transfers: [],
    roles: [], supplierInvoices: [],
    counters: { sale: 0, purchase: 0, transfer: 0, invoice: 0 },
    session: { userId: null, storeId: null },
  };
};

let _db: DB | null = null;
const listeners = new Set<() => void>();

export const loadDB = (): DB => {
  if (_db) return _db;
  if (typeof window === "undefined") {
    _db = seed();
    return _db;
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      _db = JSON.parse(raw) as DB;
      // backward-compat: ensure new fields exist
      if (!_db.roles) _db.roles = [];
      if (!_db.supplierInvoices) _db.supplierInvoices = [];
      if (typeof _db.counters.invoice !== "number") _db.counters.invoice = 0;
      return _db;
    }
  } catch (e) {
    console.warn("DB load failed", e);
  }
  _db = seed();
  saveDB();
  return _db;
};

export const saveDB = () => {
  if (!_db || typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(_db));
  listeners.forEach((l) => l());
};

export const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const update = (mutator: (db: DB) => void) => {
  const db = loadDB();
  mutator(db);
  saveDB();
};

export const resetDB = () => {
  if (typeof window !== "undefined") localStorage.removeItem(KEY);
  _db = null;
  loadDB();
  listeners.forEach((l) => l());
};

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const formatMoney = (n: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  })
    .format(n || 0)
    .replace(/\u202F/g, " ")
    .replace(/\u00A0/g, " ");

export const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

export const formatDateTime = (d: string) =>
  new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export const hasRole = (
  user: User | null,
  roleName: string
) => {
  return (
    user?.roles?.some(
      (role: any) => role.name === roleName
    ) ?? false
  );
};