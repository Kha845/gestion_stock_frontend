import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader, EmptyState } from "@/components/ui-helpers";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";

import { Product, StockMovement, Store, Transfer } from "@/lib/types";
import { createTransfer, getTransfers } from "@/lib/api/apiTransfert";
import { getProducts } from "@/lib/api/apiProduct";
import { getStores } from "@/lib/api/apiStore";
import { getStocks } from "@/lib/api/apiStock";

export const Route = createFileRoute("/transferts")({ component: Page });

function Page() {
  const { user } = useAuth();
   const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [stocks, setStocks] = useState<StockMovement[]>([]);
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState<string>(stores[0]?.id ?? "");
  const [to, setTo] = useState<string>(stores[1]?.id ?? "");
  const [items, setItems] = useState<{ product_id: string; quantity: number }[]>([]);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [
        transferRes,
        productRes,
        storeRes,
        stockRes,
      ] = await Promise.all([
        getTransfers(),
        getProducts(),
        getStores(),
        getStocks(),
      ]);

      setTransfers(transferRes.data);
      setProducts(productRes.data);
      setStores(storeRes.data);
      setStocks(stockRes.data);

      if (storeRes.data.length > 0) {
        setFrom(
          storeRes.data[0].id.toString()
        );

        if (
          storeRes.data.length > 1
        ) {
          setTo(
            storeRes.data[1].id.toString()
          );
        }
      }
    } catch (error) {
      console.error(error);

      toast.error(
        "Erreur lors du chargement"
      );
    }
  };

  const getStock = (
    productId: string,
    storeId: string
  ) => {
    const stock = stocks.find(
      (s) =>
        String(s.product_id) ===
          String(productId) &&
        String(s.store_id) ===
          String(storeId)
    );

    return stock?.quantity ?? 0;
  };

  const addLine = () => {
    setItems([
      ...items,
      {
        product_id:
          products[0]?.id?.toString() ??
          "",
        quantity: 1,
      },
    ]);
  };

  const submit = async () => {
    try {
      if (!user) return;

      if (from === to) {
        return toast.error(
          "Les magasins doivent être différents"
        );
      }

      if (items.length === 0) {
        return toast.error(
          "Ajoutez au moins un article"
        );
      }

      for (const item of items) {
        const available =
          getStock(
            item.product_id,
            from
          );

        if (
          available <
          item.quantity
        ) {
          const product =
            products.find(
              (p) =>
                String(p.id) ===
                item.product_id
            );

          return toast.error(
            `Stock insuffisant pour ${product?.name}`
          );
        }
      }

      await createTransfer({
        from_store_id:
          Number(from),

        to_store_id:
          Number(to),

        note,

        items,
        user_id: user.id,
        date
      });

      toast.success(
        "Transfert enregistré"
      );

      setOpen(false);
      setItems([]);
      setNote("");

      await loadData();
    } catch (error: any) {
      console.error(error);

      toast.error(
        error?.response?.data
          ?.message ??
          "Erreur lors du transfert"
      );
    }
  };


  return (
    <AppShell title="Transferts" module="transfers">
      <PageHeader
        title="Transferts entre magasins"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Nouveau transfert</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Nouveau transfert</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>De</Label>
                  <Select value={from} onValueChange={setFrom}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{stores.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select></div>
                <div className="space-y-2"><Label>Vers</Label>
                  <Select value={to} onValueChange={setTo}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{stores.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select></div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Articles</Label>
                  <Button size="sm" variant="outline" onClick={addLine}><Plus className="h-3 w-3 mr-1" />Ligne</Button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {items.map((it, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <Select value={it.product_id} onValueChange={(v) => { const c = [...items]; c[idx].product_id = v; setItems(c); }}>
                        <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                        <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} (dispo: {Number(getStock(p.id, from))})</SelectItem>)}</SelectContent>
                      </Select>
                      <Input type="number" min={1} className="w-24" value={it.quantity}
                        onChange={(e) => { const c = [...items]; c[idx].quantity = Number(e.target.value); setItems(c); }} />
                      <Button size="icon" variant="ghost" onClick={() => setItems(items.filter((_, i) => i !== idx))}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
               <div className="space-y-2">
                    <Label>Date Transfert</Label>
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
              <div className="space-y-2"><Label>Note</Label>
                <Input value={note} onChange={(e) => setNote(e.target.value)} />
                </div>
              <DialogFooter><Button onClick={submit}>Valider</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <Card><CardContent className="p-0 overflow-x-auto">
        {transfers.length === 0 ? <EmptyState title="Aucun transfert" /> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>N°</TableHead><TableHead>Date</TableHead>
              <TableHead>De</TableHead><TableHead></TableHead><TableHead>Vers</TableHead>
              <TableHead className="text-right">Articles</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {transfers.slice().reverse().map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.number}</TableCell>
                  <TableCell className="text-xs">{new Date(t.date).toLocaleDateString("fr-FR")}</TableCell>
                  <TableCell>{stores.find((s) => s.id === t.from_store_id)?.name}</TableCell>
                  <TableCell><ArrowLeftRight className="h-4 w-4 text-muted-foreground" /></TableCell>
                  <TableCell>{stores.find((s) => s.id === t.to_store_id)?.name}</TableCell>
                  <TableCell className="text-right">{Number(t.items.reduce((a, b) => a + b.quantity, 0))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>
    </AppShell>
  );
}
