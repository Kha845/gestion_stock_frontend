export type Permission = "read" | "write" | "edit" | "delete";

export interface Role {
  id: string;
  name: string;
  description?: string;
  // map module key -> list of permissions granted
  permissions: Record<string, Permission[]>;
  created_at: string;
}

export interface User {
  id: string;
  phone: string;
  password: string; 
  full_name: string;
  store_id: string | null;
  active: boolean;
  created_at: string;
  roles: Role[];
}

export interface Store {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  ninea?: string;
  registre_commerce?: string;
  logo?: File | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
}

export type Unit = "pièce" | "kg" | "litre" | "boîte" | "paquet" | "mètre" | "sac";

export interface Product {
  id: string;
  reference: string;
  name: string;
  category_id?: string;
  unit: Unit;
  price: number; // sale price
  cost: number;
  stock: number;
  min_stock: number;
  image: string;
  created_at: string;
  stocks: StockLine[];
}

export interface StockLine {
  product_id: string;
  store_id: string;
  quantity: number;
}

export type MovementType =
  | "achat"
  | "vente"
  | "transfert_in"
  | "transfert_out"
  | "perte"
  | "ajustement"
  | "inventaire";

export interface StockMovement {
  id: string;
  product_id: string;
  store_id: string;
  type: MovementType;
  quantity: number; // signed
  reference?: string; // sale id, purchase id, etc.
  note?: string;
  date: string;
  user_id: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  created_at: string;
}

export type PaymentMethod = "espèces" | "carte" | "mobile" | "virement" | "crédit";

export interface SaleItem {
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  discount: number; // amount
}

export interface Sale {
  id: string;
  number: string;
  store_id: string;
  customer_id?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  paid: number;
  payment_method: PaymentMethod;
  is_credit: boolean;
  date: string;
  user_id: string;
}

export interface PurchaseItem {
  id?: string;
  product_id: string;
  name: string;
  quantity: number;
  unit_cost: number;
}

export interface Purchase {
  id: string;
  number: string;
  store_id: string ;
  supplier_id: string;
  items: PurchaseItem[];
  total: number;
  paid: number;
  payment_method: PaymentMethod;
  is_credit: boolean;
  date: string;
  user_id: string;
  supplier: Supplier;
}

export type DebtType = "client" | "fournisseur";

export interface Debt {
  id: string;
  type: DebtType;
  party_id: string; // customer or supplier id
  reference: string; // sale or purchase id
  total: number;
  paid: number;
  dueDate?: string;
  created_at: string;
}

export interface DebtPayment {
  id: string;
  debt_id: string;
  amount: number;
  date: string;
  user_id: string;
  note?: string;
}

export type CashType = "entrée" | "sortie";

export type CashCategory =
  | "vente"
  | "paiement_client"
  | "achat"
  | "paiement_fournisseur"
  | "dépense"
  | "autre";

export interface CashEntry {
  id: string;
  store_id: string;
  type: CashType;
  category: CashCategory;
  amount: number;
  description?: string;
  reference?: string;
  date: string;
  user_id: string;
}

export interface InventorySession {
  id: string;
  store_id: string;
  date: string;
  user_id: string;
  lines: { product_id: string; theoretical: number; physical: number }[];
  status: "brouillon" | "validé";
}

export interface Transfer {
  id: string;
  number: string;
  from_store_id: string | number;
  to_store_id: string | number;
  items: { product_id: string; quantity: number }[];
  date: string;
  user_id: string;
  note?: string;
}

export type SupplierInvoiceStatus = "impayée" | "partielle" | "payée";

export interface SupplierInvoiceItem {
  description: string;
  quantity: number;
  unit_cost: number;
}

export interface SupplierInvoice {
  id: string;
  number: string; // internal number
  invoice_number: string; // supplier's own invoice number
  supplier_id: string;
  store_id: string;
  issue_date: string;
  due_date?: string;
  items: SupplierInvoiceItem[];
  sub_total: number;
  tax: number; // amount
  total: number;
  paid: number;
  status: SupplierInvoiceStatus;
  payment_method?: PaymentMethod;
  attachment_name?: string; // file name reference
  note?: string;
  created_at: string;
  user_id: string;
  supplier: Supplier;
  store: Store;
  user: User
}


