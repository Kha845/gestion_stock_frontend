import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader, EmptyState } from "@/components/ui-helpers";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatMoney } from "@/lib/store";
import type { PaymentMethod, Product, Purchase, PurchaseItem, Supplier } from "@/lib/types";
import { createPurchase, getPurchases } from "@/lib/api/apiPurchase";
import { getProducts } from "@/lib/api/apiProduct";
import { getSuppliers } from "@/lib/api/apiSupplier";
import { Eye } from "lucide-react";
import { getPurchase } from "@/lib/api/apiPurchase";

export const Route = createFileRoute("/achats")({ component: Page });

const PAY: PaymentMethod[] = ["espèces", "carte", "mobile", "virement"];

function Page() {
  const { user, storeId} = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [paid, setPaid] = useState(0);
  const [pm, setPm] = useState<PaymentMethod>("espèces");
  const [credit, setCredit] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);


  useEffect(() => {
  loadData();
}, []);

const loadData = async () => {
  try {
    const [
      purchasesRes,
      productsRes,
      suppliersRes,
    ] = await Promise.all([
      getPurchases(),
      getProducts(),
      getSuppliers(),
    ]);

    setPurchases(purchasesRes.data);
    setProducts(productsRes.data);
    setSuppliers(suppliersRes.data);
  } catch (error) {
    console.error(error);

    toast.error(
      "Impossible de charger les données"
    );
  }
};

  const total = useMemo(() => items.reduce((s, i) => s + i.unit_cost * i.quantity, 0), [items]);

  const addLine = () => {
    const p = products[0];
    if (!p) return toast.error("Aucun produit");
    setItems([...items, { product_id: p.id, name: p.name, quantity: 1, unit_cost: p.cost }]);
  };

  const setLine = (i: number, patch: Partial<PurchaseItem>) => {
    const c = [...items]; c[i] = { ...c[i], ...patch };
    if (patch.product_id) {
      const p = products.find((x) => x.id === patch.product_id);
      if (p) { c[i].name = p.name; c[i].unit_cost = p.cost; }
    }
    setItems(c);
  };

 const submit = async () => {
  if (!user) {
    toast.error("Utilisateur introuvable");
    return;
  }

  if (!storeId) {
    toast.error("Aucun magasin sélectionné");
    return;
  }

  if (!supplierId) {
    toast.error("Fournisseur requis");
    return;
  }

  if (items.length === 0) {
    toast.error("Aucun article");
    return;
  }

  try {
    const payload = {
      store_id: storeId,
      supplier_id: supplierId,
      paid: credit ? paid : total,
      payment_method: credit
        ? "crédit"
        : pm,
      user_id: user.id,
      date: new Date().toISOString(),

      items: items.map((item) => ({
        product_id: item.product_id,
        name: item.name,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
      })),
    };

    await createPurchase(payload);

    await loadData();

    toast.success(
      "Achat enregistré avec succès"
    );

    setOpen(false);

    setItems([]);
    setSupplierId("");
    setPaid(0);
    setCredit(false);
  } catch (error: any) {
    console.error(error);

    toast.error(
      error?.response?.data?.message ??
        "Erreur lors de l'enregistrement"
    );
  }
};

 const allowedRoles = ["administrateur", "comptable","admin"];

const isAdmin =
  user?.roles?.some(({ name }) =>
    allowedRoles.includes(name?.toLowerCase())
  ) ?? false;

const scoped = isAdmin
  ? purchases
  : purchases.filter(
      ({ store_id }) =>
        String(store_id) === storeId
    );
  const showDetails = async (
  purchaseId: string | number
) => {
  try {
    const response =
      await getPurchase(purchaseId);

    setSelectedPurchase(
      response.data
    );

    setDetailsOpen(true);
  } catch (error) {
    console.error(error);

    toast.error(
      "Impossible de charger l'achat"
    );
  }
};
  return (
    <AppShell title="Achats" module="purchases">
      <PageHeader
        title="Achats fournisseurs"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Nouvel achat</Button></DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Nouvel achat</DialogTitle></DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Fournisseur</Label>
                  <Select value={supplierId} onValueChange={setSupplierId}>
                    <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                    <SelectContent>{suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select></div>
                <div className="flex items-end">
                  <div className="flex items-center gap-2">
                    <Switch checked={credit} onCheckedChange={setCredit} id="ccr" />
                    <Label htmlFor="ccr">Achat à crédit</Label>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between"><Label>Articles</Label>
                  <Button size="sm" variant="outline" onClick={addLine}><Plus className="h-3 w-3 mr-1" />Ligne</Button></div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {items.map((it, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <Select value={it.product_id} onValueChange={(v) => setLine(idx, { product_id: v })}>
                        <SelectTrigger className="col-span-6"><SelectValue /></SelectTrigger>
                        <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                      </Select>
                      <Input type="number" min={1} className="col-span-2" value={it.quantity}
                        onChange={(e) => setLine(idx, { quantity: Number(e.target.value) })} />
                      <Input type="number" className="col-span-3" value={it.unit_cost}
                        onChange={(e) => setLine(idx, { unit_cost: Number(e.target.value) })} />
                      <Button size="icon" variant="ghost" className="col-span-1" onClick={() => setItems(items.filter((_, i) => i !== idx))}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {!credit && (
                  <div className="space-y-2"><Label>Paiement</Label>
                    <Select value={pm} onValueChange={(v) => setPm(v as PaymentMethod)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{PAY.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select></div>
                )}
                {credit && (
                  <div className="space-y-2"><Label>Acompte</Label>
                    <Input type="number" value={paid} onChange={(e) => setPaid(Number(e.target.value))} /></div>
                )}
                <div className="space-y-2 col-span-2"><Label>Total</Label>
                  <div className="h-9 px-3 flex items-center font-semibold text-lg tabular-nums rounded-md bg-muted">{formatMoney(total)}</div></div>
              </div>
              <DialogFooter><Button onClick={submit}>Valider l'achat</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <Card><CardContent className="p-0 overflow-x-auto">
        {scoped.length === 0 ? <EmptyState title="Aucun achat" /> : (
          <Table>
            <TableHeader>
              <TableRow>
              <TableHead>N°</TableHead><TableHead>Date</TableHead>
              <TableHead>Fournisseur</TableHead><TableHead>Paiement</TableHead>
              <TableHead className="text-right">Total</TableHead><TableHead className="text-right">Payé</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
              {scoped.slice().reverse().map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.number}</TableCell>
                  <TableCell className="text-xs">{new Date(p.date).toLocaleString("fr-FR")}</TableCell>
                  <TableCell>{suppliers.find((s) => String(s.id) === String(p.supplier_id))?.name}</TableCell>
                  <TableCell><Badge variant={p.is_credit ? "destructive" : "secondary"}>{p.payment_method}</Badge></TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">{formatMoney(p.total)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatMoney(p.paid)}</TableCell>
                  <TableCell className="text-center"><Button variant="ghost" size="icon" onClick={() => showDetails(p.id)}><Eye className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
  <DialogContent className="max-w-4xl">
    <DialogHeader>
      <DialogTitle>
        Détails de l'achat
      </DialogTitle>
    </DialogHeader>

    {selectedPurchase && (
      <div className="space-y-4">

        <div className="grid grid-cols-2 gap-4">

          <div>
            <strong>N° :</strong>{" "}
            {selectedPurchase.number}
          </div>

          <div>
            <strong>Date :</strong>{" "}
            {new Date(
              selectedPurchase.date
            ).toLocaleString("fr-FR")}
          </div>

          <div>
            <strong>Fournisseur :</strong>{" "}
            {
              selectedPurchase.supplier
                ?.name
            }
          </div>

          <div>
            <strong>Paiement :</strong>{" "}
            {
              selectedPurchase.payment_method
            }
          </div>

          <div>
            <strong>Total :</strong>{" "}
            {formatMoney(
              selectedPurchase.total
            )}
          </div>

          <div>
            <strong>Payé :</strong>{" "}
            {formatMoney(
              selectedPurchase.paid
            )}
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                Produit
              </TableHead>

              <TableHead>
                Quantité
              </TableHead>

              <TableHead>
                Coût unitaire
              </TableHead>

              <TableHead>
                Total
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {selectedPurchase.items?.map(
              (item) => (
                <TableRow
                  key={item.id}
                >
                  <TableCell>
                    {item.name}
                  </TableCell>

                  <TableCell>
                    {item.quantity}
                  </TableCell>

                  <TableCell>
                    {formatMoney(
                      item.unit_cost
                    )}
                  </TableCell>

                  <TableCell>
                    {formatMoney(
                      item.unit_cost *
                        item.quantity
                    )}
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>

        <div className="border-t pt-4 text-right">

          <div className="text-lg font-bold">
            Total :
            {" "}
            {formatMoney(
              selectedPurchase.total
            )}
          </div>

          <div>
            Payé :
            {" "}
            {formatMoney(
              selectedPurchase.paid
            )}
          </div>

          {selectedPurchase.total >
            selectedPurchase.paid && (
            <div className="text-destructive font-semibold">
              Reste :
              {" "}
              {formatMoney(
                selectedPurchase.total -
                  selectedPurchase.paid
              )}
            </div>
          )}
        </div>
      </div>
    )}

    <DialogFooter>
      <Button
        variant="outline"
        onClick={() =>
          setDetailsOpen(false)
        }
      >
        Fermer
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog></Card>
    </AppShell>
  );
}
