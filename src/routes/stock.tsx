import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/ui-helpers";
import { useDB } from "@/lib/useDB";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search } from "lucide-react";
import { Product, StockMovement, Store } from "@/lib/types";
import { getProducts } from "@/lib/api/apiProduct";
import { getStocks } from "@/lib/api/apiStock";
import { getStockMovements } from "@/lib/api/apiStockMouvement";

export const Route = createFileRoute("/stock")({ component: Page });

function Page() {
  const { user, stores, storeId} = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [stocks, setStocks] = useState<StockMovement[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [search, setSearch] = useState("");

useEffect(() => {
  loadData();
}, []);

const loadData = async () => {
  try {
    const [
      productsRes,
      stocksRes,
      movementsRes,
    ] = await Promise.all([
      getProducts(),
      getStocks(),
      getStockMovements(),
    ]);

    setProducts(productsRes.data);
    setStocks(stocksRes.data);
    setMovements(movementsRes.data);
  } catch (error) {
    console.error(error);
  }
};

   const allowedRoles = ["administrateur", "comptable","admin"];

const isGlobal =
  user?.roles?.some(({ name }) =>
    allowedRoles.includes(name?.toLowerCase())
  ) ?? false;

 
 const byStore = useMemo(() => {
  const targetStore = isGlobal
    ? null
    : storeId;

  return products
    .filter(
      (product) =>
        !search ||
        product.name
          .toLowerCase()
          .includes(
            search.toLowerCase()
          )
    )
    .map((product) => {

      const lines = stores
        .map((store) => {
          
          const stockLine =
            stocks.find(
              (s) =>
                String(
                  s.product_id
                ) ===
                  String(product.id) &&
                String(
                  s.store_id
                ) ===
                  String(store.id)
            );

          return {
            store,
            qty:
              Number(
                stockLine?.quantity
              ) || 0,
          };
        })
        .filter(
          (line) =>
            !targetStore ||
            String(
              line.store.id
            ) ===
              String(
                targetStore
              )
        );

      const total =
        lines.reduce(
          (sum, line) =>
            sum + line.qty,
          0
        );

      return {
        product,
        lines,
        total,
      };
    });
}, [
  products,
  stocks,
  stores,
  search,
  storeId,
  isGlobal,
]);
  return (
    <AppShell title="Stock" module="stock">
      <PageHeader title="État du stock" subtitle={isGlobal ? "Vue globale tous magasins" : "Vue magasin"} />
      <div className="mb-3 relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher un produit..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
      </div>

      <Tabs defaultValue="state">
        <TabsList>
          <TabsTrigger value="state">État du stock</TabsTrigger>
          <TabsTrigger value="movements">Mouvements</TabsTrigger>
        </TabsList>
        <TabsContent value="state">
          <Card><CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  {isGlobal && stores.map((s) => <TableHead key={s.id} className="text-right">{s.name}</TableHead>)}
                  {!isGlobal && <TableHead className="text-right">Quantité</TableHead>}
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Seuil</TableHead>
                  <TableHead>État</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byStore.map(({ product, lines, total }) => {
                  const status = total === 0 ? "rupture" : total <= product.min_stock ? "faible" : "ok";
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}<div className="text-xs text-muted-foreground font-mono">{product.reference}</div></TableCell>
                      {isGlobal ? lines.map((l) => (
                        <TableCell key={l.store.id} className="text-right tabular-nums">{l.qty}</TableCell>
                      )) : <TableCell className="text-right tabular-nums">{lines[0]?.qty ?? 0}</TableCell>}
                      <TableCell className="text-right font-semibold tabular-nums">{total}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{product.min_stock}</TableCell>
                      <TableCell>
                        {status === "rupture" && <Badge variant="destructive">Rupture</Badge>}
                        {status === "faible" && <Badge className="bg-warning text-warning-foreground hover:bg-warning/80">Faible</Badge>}
                        {status === "ok" && <Badge variant="secondary">OK</Badge>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="movements">
          <Movements isGlobal={isGlobal} storeId={user?.store_id} movements={movements} products={products} stores={stores} />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function Movements({ isGlobal, storeId, movements, products, stores }: { isGlobal: boolean; storeId: string | null | undefined, movements: StockMovement[], products: Product[], stores: Store[]}) {
 
  const filtered = movements
    .filter((m) => isGlobal || m.store_id === storeId)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 100);
  return (
    <Card><CardContent className="p-0 overflow-x-auto">
      <Table>
        <TableHeader><TableRow>
          <TableHead>Date</TableHead><TableHead>Produit</TableHead>
          <TableHead>Magasin</TableHead><TableHead>Type</TableHead>
          <TableHead className="text-right">Qté</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {filtered.map((m) => (
            <TableRow key={m.id}>
              <TableCell className="text-xs">{new Date(m.date).toLocaleString("fr-FR")}</TableCell>
              <TableCell>{products.find((p) => p.id === m.product_id)?.name ?? "—"}</TableCell>
              <TableCell>{stores.find((s) => s.id === m.store_id)?.name ?? "—"}</TableCell>
              <TableCell><Badge variant="outline" className="capitalize">{m.type.replace("_", " ")}</Badge></TableCell>
              <TableCell className={`text-right tabular-nums font-medium ${m.quantity < 0 ? "text-destructive" : "text-success"}`}>
                {m.quantity > 0 ? "+" : ""}{m.quantity}
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Aucun mouvement</TableCell></TableRow>}
        </TableBody>
      </Table>
    </CardContent></Card>
  );
}
