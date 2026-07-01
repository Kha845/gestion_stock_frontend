import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader, StatCard } from "@/components/ui-helpers";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMoney } from "@/lib/store";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, ShoppingCart, Wallet, CreditCard, Store, Tags } from "lucide-react";
import { getStores } from "@/lib/api/apiStore";
import { getCashEntries } from "@/lib/api/apiCashEntry";
import { getSales } from "@/lib/api/apiVente";
import { getProducts } from "@/lib/api/apiProduct";
import { toast } from "sonner";
import { CashEntry, Debt, Store as Magasin, Product, Sale} from './../lib/types';
import { getDebts } from "@/lib/api/apiDebt";

export const Route = createFileRoute("/rapports")({ component: Page });

function Page() {

  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Magasin[]>([]);
  const [cashEntries, setCashEntries] = useState<CashEntry[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);

  useEffect(() => {
    loadData();
  }, []);

const loadData = async () => {
  try {
    const [
      salesRes,
      productsRes,
      storesRes,
      cashRes,
      debtsRes
    ] = await Promise.all([
      getSales(),
      getProducts(),
      getStores(),
      getCashEntries(),
      getDebts(),
    ]);

    setSales(salesRes.data ?? []);
    setProducts(productsRes.data ?? []);
    setStores(storesRes.data ?? []);
    setCashEntries(cashRes.data ?? []);
    setDebts(debtsRes.data ?? []);
  } catch (error) {
    console.error(error);
    toast.error("Erreur de chargement");
  }
};

  const totalCA = useMemo(
  () =>
    sales.reduce(
      (sum, sale) =>
        sum + Number(sale.total),
      0
    ),
  [sales]
);

  const totalCount = sales.length;

const topProducts = useMemo(() => {
  const map = new Map();

  sales.forEach((sale) => {
    sale.items?.forEach((item) => {
      const current =
        map.get(item.product_id) || {
          name: item.name,
          qty: 0,
          revenue: 0,
        };

      current.qty += Number(item.quantity);

      current.revenue +=
        Number(item.unit_price) *
          Number(item.quantity) -
        Number(item.discount);

      map.set(
        item.product_id,
        current
      );
    });
  });

  return Array.from(map.values())
    .sort(
      (a, b) =>
        b.revenue - a.revenue
    )
    .slice(0, 10);
}, [sales]);

const byCat = useMemo(() => {
  const map = new Map<string, number>();

  cashEntries
    .filter(
      (entry) => entry.type === "entrée"
    )
    .forEach((entry) => {
      map.set(
        entry.category,
        (map.get(entry.category) ?? 0) +
          Number(entry.amount)
      );
    });

  return Array.from(map.entries()).map(
    ([name, value]) => ({
      name,
      value,
    })
  );
}, [cashEntries]);

 const byStore = useMemo(() => {
  return stores.map((store) => {
    const storeCash =
      cashEntries.filter(
        (entry) =>
          Number(
            entry.store_id
          ) === Number(store.id)
      );

    const entrees =
      storeCash
        .filter(
          (entry) =>
            entry.type ===
            "entrée"
        )
        .reduce(
          (sum, entry) =>
            sum +
            Number(entry.amount),
          0
        );

    const sorties =
      storeCash
        .filter(
          (entry) =>
            entry.type ===
            "sortie"
        )
        .reduce(
          (sum, entry) =>
            sum +
            Number(entry.amount),
          0
        );

    const ca = sales
      .filter(
        (sale) =>
          Number(
            sale.store_id
          ) === Number(store.id)
      )
      .reduce(
        (sum, sale) =>
          sum +
          Number(sale.total),
        0
      );

    return {
      name: store.name,
      ca,
      caisse:
        entrees - sorties,
      entrees,
      sorties,
    };
  });
}, [
  stores,
  sales,
  cashEntries,
]);

const cashBalance = useMemo(() => {
  const entrees = cashEntries
    .filter((c) => c.type === "entrée")
    .reduce(
      (sum, c) => sum + Number(c.amount),
      0
    );

  const sorties = cashEntries
    .filter((c) => c.type === "sortie")
    .reduce(
      (sum, c) => sum + Number(c.amount),
      0
    );

  return entrees - sorties;
}, [cashEntries]);


const clientDebt = useMemo(() => {
  return debts
    .filter((d) => d.type === "client")
    .reduce(
      (sum, d) =>
        sum + (Number(d.total) - Number(d.paid)),
      0
    );
}, [debts]);

const supplierDebt = useMemo(() => {
  return debts
    .filter(
      (d) => d.type === "fournisseur"
    )
    .reduce(
      (sum, d) =>
        sum + (Number(d.total) - Number(d.paid)),
      0
    );
}, [debts]);

const netDebt = clientDebt - supplierDebt;

console.log("NETTE DEBIT", netDebt)

  return (
    <AppShell title="Rapports" module="reports">
      <PageHeader title="Rapports & analyses" subtitle="Vue d'ensemble des performances" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard label="CA total" value={formatMoney(totalCA)} icon={<TrendingUp className="h-5 w-5" />} accent="success" />
        <StatCard label="Ventes" value={totalCount} icon={<ShoppingCart className="h-5 w-5" />} accent="primary" />
        <StatCard label="Caisse globale" value={formatMoney(cashBalance)} icon={<Wallet className="h-5 w-5" />} accent="info" />
        <StatCard label="Dettes nettes" value={formatMoney(netDebt)} icon={<CreditCard className="h-5 w-5" />} accent="warning" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Store className="h-4 w-4" />CA par magasin</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {byStore.length === 0 && <p className="text-muted-foreground text-sm">Aucun magasin</p>}
            {(() => { const max = Math.max(...byStore.map((s) => s.ca), 1); return byStore.map((s) => (
              <div key={s.name} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{s.name}</span>
                  <span className="tabular-nums">{formatMoney(s.ca)}</span>
                </div>
                <Progress value={(s.ca / max) * 100} className="h-2" />
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>Caisse : <span className="font-medium text-foreground tabular-nums">{formatMoney(s.caisse)}</span></span>
                  <span className="flex items-center gap-1"><ArrowDownCircle className="h-3 w-3 text-success" />Entrées : <span className="font-medium text-success tabular-nums">{formatMoney(s.entrees)}</span></span>
                  <span className="flex items-center gap-1"><ArrowUpCircle className="h-3 w-3 text-destructive" />Sorties : <span className="font-medium text-destructive tabular-nums">{formatMoney(s.sorties)}</span></span>
                </div>
              </div>
            )); })()}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Tags className="h-4 w-4" />CA par catégorie</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {byCat.length === 0 && <p className="text-muted-foreground text-sm">Aucune donnée</p>}
            {(() => { const max = Math.max(...byCat.map((c) => c.value), 1); const total = byCat.reduce((s, c) => s + c.value, 0); return byCat.sort((a, b) => b.value - a.value).map((c) => (
              <div key={c.name} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="font-medium capitalize">{c.name}</span>
                  <span className="tabular-nums">{formatMoney(c.value)} <span className="text-muted-foreground text-xs">({total > 0 ? ((c.value / total) * 100).toFixed(0) : 0}%)</span></span>
                </div>
                <Progress value={(c.value / max) * 100} className="h-2" />
              </div>
            )); })()}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Top 10 produits</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Produit</TableHead>
              <TableHead className="text-right">Quantité vendue</TableHead>
              <TableHead className="text-right">Chiffre d'affaires</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {topProducts.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">Aucune vente</TableCell></TableRow>
              ) : topProducts.map((p, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{p.qty}</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">{formatMoney(p.revenue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
