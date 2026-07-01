import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { AppShell } from "@/components/AppShell";
import { StatCard, PageHeader } from "@/components/ui-helpers";
import { formatMoney } from "@/lib/store";
import {
  ShoppingCart, Wallet, AlertTriangle, Package, TrendingUp, CreditCard,
  ArrowDownCircle, ArrowUpCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CashEntry, Customer, Debt, Product, Sale } from "@/lib/types";
import { getSales } from "@/lib/api/apiVente";
import { getCashEntries } from "@/lib/api/apiCashEntry";
import { getDebts } from "@/lib/api/apiDebt";
import { getProducts } from "@/lib/api/apiProduct";
import { toast } from "sonner";
import { getCustomers } from "@/lib/api/apiCustomer";

export const Route = createFileRoute("/")({ component: Dashboard });

function Dashboard() {

  const { user, stores, storeId} = useAuth();
  const navigate = useNavigate();
  const [sales, setSales] = useState<Sale[]>([]);
  const [cashEntries, setCashEntries] = useState<CashEntry[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
   const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => { if (!user) navigate({ to: "/login" }); }, [user, navigate]);

  useEffect(() => {
  loadDashboard();
}, [storeId]);

const loadDashboard = async () => {
  try {
    const [salesRes,cashRes,debtsRes,productsRes,customerRes] = await Promise.all([getSales(),getCashEntries(),
      getDebts(),
      getProducts(storeId),
      getCustomers()
    ]);

    setSales(salesRes.data ?? []);
    setCashEntries(cashRes.data ?? []);
    setDebts(debtsRes.data ?? []);
    setProducts(productsRes.data ?? []);
    setCustomers(customerRes.data  ?? [])
  } catch (error) {
    console.error(error);
    toast.error("Erreur chargement dashboard");
  }
};

 const isGlobal = user?.roles.some(
  (role) => role.name === "Administrateur" 
);
  const scopeStore = isGlobal ? null : user?.store_id;

  const todayStr = new Date().toDateString();
  const salesScope = sales.filter(
    (s) =>
      !scopeStore ||
      String(s.store_id) ===
        String(scopeStore)
  );
  const todaySales = salesScope.filter((s) => new Date(s.date).toDateString() === todayStr);
  const todayCA = todaySales.reduce((s, x) => s + x.total, 0);
  const monthCA = salesScope
    .filter((s) => new Date(s.date).getMonth() === new Date().getMonth())
    .reduce((s, x) => s + x.total, 0);

const cash = useMemo(() => {
  const entries = cashEntries.filter(
    (c) =>
      !scopeStore ||
      String(c.store_id) ===
        String(scopeStore)
  );

  const inTotal = entries
    .filter((c) => c.type === "entrée")
    .reduce(
      (sum, c) =>
        sum + Number(c.amount),
      0
    );

  const outTotal = entries
    .filter((c) => c.type === "sortie")
    .reduce(
      (sum, c) =>
        sum + Number(c.amount),
      0
    );

  return inTotal - outTotal;
}, [cashEntries, scopeStore]);
const debtsClient = useMemo(() => {
  return debts
    .filter(
      (d) => d.type === "client"
    )
    .reduce(
      (sum, d) =>
        sum +
        (Number(d.total) -
          Number(d.paid)),
      0
    );
}, [debts]);

const debtsSupplier =
  useMemo(() => {
    return debts
      .filter(
        (d) =>
          d.type ===
          "fournisseur"
      )
      .reduce(
        (sum, d) =>
          sum +
          (Number(d.total) -
            Number(d.paid)),
        0
      );
  }, [debts]);

  const cashScope = cashEntries.filter((c) => !scopeStore || String(c.store_id) === String(scopeStore));
  const cashIn = cashScope.filter((c) => c.type === "entrée").reduce((a, b) => a + b.amount, 0);
  const cashOut = cashScope.filter((c) => c.type === "sortie").reduce((a, b) => a + b.amount, 0);

  const lowStock = useMemo(() => {
    return products.filter(
      (p) =>
        Number(p.stock ?? 0) <=
        Number(p.min_stock ?? 0)
    );
  }, [products]);

  const last7 = useMemo(() => {
    const days: { date: string; ca: number; cashIn: number; cashOut: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toDateString();
      const ca = salesScope.filter((s) => new Date(s.date).toDateString() === key).reduce((a, b) => a + b.total, 0);
      const dayCash = cashScope.filter((c) => new Date(c.date).toDateString() === key);
      const cashIn = dayCash.filter((c) => c.type === "entrée").reduce((a, b) => a + b.amount, 0);
      const cashOut = dayCash.filter((c) => c.type === "sortie").reduce((a, b) => a + b.amount, 0);
      days.push({ date: d.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit" }), ca, cashIn, cashOut });
    }
    return days;
  }, [salesScope, cashScope]);

 const byStore = useMemo(() => {
  return stores.map((store) => {

    const storeSales =
      sales.filter(
        (s) =>
          String(s.store_id) ===
          String(store.id)
      );

    const storeCash =
      cashEntries.filter(
        (c) =>
          String(c.store_id) ===
          String(store.id)
      );

    const ventes =
      storeSales.reduce(
        (sum, s) =>
          sum + Number(s.total),
        0
      );

    const entrees =
      storeCash
        .filter(
          (c) =>
            c.type === "entrée"
        )
        .reduce(
          (sum, c) =>
            sum +
            Number(c.amount),
          0
        );

    const sorties =
      storeCash
        .filter(
          (c) =>
            c.type === "sortie"
        )
        .reduce(
          (sum, c) =>
            sum +
            Number(c.amount),
          0
        );

    return {
      name: store.name,
      ventes,
      caisse:
        entrees - sorties,
    };
  });
}, [
  stores,
  sales,
  cashEntries,
]);

  const recentSales = [...salesScope].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  

  if (!user) return null;

  return (
    <AppShell title="Tableau de bord" module="dashboard">
      <PageHeader
        title={`Bonjour, ${user.full_name.split(" ")[0]} 👋`}
        subtitle={isGlobal ? "Vue globale tous magasins" : `Magasin: ${stores.find((s) => s.id === user.store_id)?.name ?? "—"}`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard label="CA du jour" value={formatMoney(todayCA)} icon={<TrendingUp className="h-5 w-5" />} accent="success" trend={`${todaySales.length} vente(s)`} />
        <StatCard label="CA du mois" value={formatMoney(monthCA)} icon={<ShoppingCart className="h-5 w-5" />} accent="primary" />
        <StatCard label="Solde caisse" value={formatMoney(cash)} icon={<Wallet className="h-5 w-5" />} accent="info" />
        <StatCard label="Stock alerte" value={lowStock.length} icon={<AlertTriangle className="h-5 w-5" />} accent="warning" trend="produits sous le seuil" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        <StatCard label="Entrées caisse" value={formatMoney(cashIn)} icon={<ArrowDownCircle className="h-5 w-5" />} accent="success" trend="ventes encaissées + paiements reçus" />
        <StatCard label="Sorties caisse" value={formatMoney(cashOut)} icon={<ArrowUpCircle className="h-5 w-5" />} accent="destructive" trend="achats + paiements fournisseurs" />
        <StatCard label="Solde net" value={formatMoney(cashIn - cashOut)} icon={<Wallet className="h-5 w-5" />} accent="info" trend="entrées − sorties" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <StatCard label="Dettes clients" value={formatMoney(debtsClient)} icon={<CreditCard className="h-5 w-5" />} accent="warning" />
        <StatCard label="Dettes fournisseurs" value={formatMoney(debtsSupplier)} icon={<CreditCard className="h-5 w-5" />} accent="destructive" />
      </div>

      <Card className="mb-4">
        <CardHeader><CardTitle className="text-base">Chiffre d'affaires — 7 derniers jours</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            {last7.map((d, i) => {
              const max = Math.max(...last7.map((x) => x.ca), 1);
              const isToday = i === last7.length - 1;
              return (
                <div
                  key={i}
                  className={cn(
                    "rounded-lg border p-3 flex flex-col gap-1.5 transition-colors",
                    isToday ? "border-primary/40 bg-primary/5" : "bg-card",
                    d.ca > 0 && d.ca === max && "ring-1 ring-primary/30",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground capitalize">{d.date}</span>
                    {isToday && <span className="text-[10px] uppercase tracking-wide text-primary font-medium">Auj.</span>}
                  </div>
                  <span className="text-sm font-semibold tabular-nums">{formatMoney(d.ca)}</span>
                  <div className="flex flex-col gap-0.5 pt-1 border-t border-border/50">
                    <div className="flex items-center justify-between gap-1 text-[11px]">
                      <span className="flex items-center gap-1 text-success">
                        <ArrowDownCircle className="h-3 w-3" />Entrées
                      </span>
                      <span className="tabular-nums font-medium">{formatMoney(d.cashIn)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-1 text-[11px]">
                      <span className="flex items-center gap-1 text-destructive">
                        <ArrowUpCircle className="h-3 w-3" />Sorties
                      </span>
                      <span className="tabular-nums font-medium">{formatMoney(d.cashOut)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {isGlobal && (
        <Card className="mb-4">
          <CardHeader><CardTitle className="text-base">Chiffre d'affaires par magasin</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {byStore.length === 0 && (
                <div className="text-sm text-muted-foreground">Aucun magasin</div>
              )}
              {byStore.map((s, i) => (
                <div key={i} className="rounded-lg border p-3 flex flex-col gap-1 bg-card">
                  <span className="text-xs text-muted-foreground">{s.name}</span>
                  <span className="text-lg font-semibold tabular-nums">{formatMoney(s.ventes)}</span>
                  <span className="text-xs text-muted-foreground">Caisse: <span className="tabular-nums">{formatMoney(s.caisse)}</span></span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Ventes récentes</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N°</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSales.length === 0 && (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">Aucune vente</TableCell></TableRow>
                )}
                {recentSales.map((s) => {
                  const c = customers.find((x) => String(x.id) === String(s.customer_id));
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.number}</TableCell>
                      <TableCell>{c?.name ?? "Comptant"}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatMoney(s.total)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Package className="h-4 w-4" />Alertes stock</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Magasin</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStock.length === 0 && (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">Aucune alerte 🎉</TableCell></TableRow>
                )}
               {lowStock.slice(0, 8).map((x, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">
                      {x.name}
                    </TableCell>

                    <TableCell>
                      {
                      stores.find(
                        (s) =>
                          String(s.id) ===
                          String(x.stocks?.[0]?.store_id)
                      )?.name ?? "-"
                    }
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          x.stock === 0
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {Number(x.stock)} / {x.min_stock}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
