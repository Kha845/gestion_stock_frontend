import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, FileText, Download } from "lucide-react";
import { toast } from "sonner";
import { printSaleInvoice } from "@/lib/pdf";
import { formatMoney } from "@/lib/store";
import type { Customer, PaymentMethod, Product, Sale, SaleItem } from "@/lib/types";
import { createSale, getSale, getSales } from "@/lib/api/apiVente";
import { getProducts } from "@/lib/api/apiProduct";
import { getCustomers } from "@/lib/api/apiCustomer";

export const Route = createFileRoute("/ventes")({ component: Page });

const PAY: PaymentMethod[] = ["espèces", "carte", "mobile", "virement", "crédit"];

function Page() {
  const { user, storeId } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [discount, setDiscount] = useState(0);
  const [paid, setPaid] = useState(0);
  const [pm, setPm] = useState<PaymentMethod>("espèces");
  const [credit, setCredit] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [storeId]);

  const loadData = async () => {
    try {
      const [
        salesRes,
        productsRes,
        customersRes,
      ] = await Promise.all([
        getSales(),
        getProducts(storeId),
        getCustomers(),
      ]);

      setSales(salesRes.data);
      setProducts(productsRes.data);
      setCustomers(customersRes.data);

    } catch (error) {
      console.error(error);
      toast.error(
        "Impossible de charger les données"
      );
    }
  };

  const subtotal = useMemo(() => {
    return items.reduce(
      (sum, item) =>
        sum +
        item.unit_price *
        item.quantity -
        item.discount,
      0
    );
  }, [items]);

  const total = Math.max(
    0,
    subtotal - discount
  );

  const addLine = () => {
    const product = products[0];

    if (!product) {
      toast.error("Aucun produit");
      return;
    }

    setItems([
      ...items,
      {
        product_id: String(product.id),
        name: product.name,
        quantity: 1,
        unit_price: product.price,
        discount: 0,
      },
    ]);
  };

  const setLine = (
    index: number,
    patch: Partial<SaleItem>
  ) => {

    const updated = [...items];

    updated[index] = {
      ...updated[index],
      ...patch,
    };

    if (patch.product_id) {

      const product = products.find(
        p =>
          String(p.id) ===
          String(patch.product_id)
      );

      if (product) {

        updated[index].name =
          product.name;

        updated[index].unit_price =
          product.price;
      }
    }

    setItems(updated);
  };

  const submit = async () => {

    if (!user) {
      toast.error("Utilisateur introuvable");
      return;
    }

    if (items.length === 0) {
      toast.error(
        "Ajoutez au moins un article"
      );
      return;
    }

    if (credit && !customerId) {
      toast.error(
        "Client requis pour une vente à crédit"
      );
      return;
    }

    try {

      const payload = {
        store_id: storeId,

        customer_id:
          customerId || null,

        payment_method:
          credit
            ? "crédit"
            : pm,

        paid:
          credit
            ? paid
            : total,

        user_id: user.id,

        date: new Date()
          .toISOString(),

        items: items.map(item => ({
          product_id:
            item.product_id,

          quantity:
            item.quantity,

          discount:
            item.discount,
        })),
      };

      await createSale(payload);

      toast.success(
        "Vente enregistrée"
      );

      await loadData();

      setOpen(false);

      setItems([]);

      setCustomerId("");

      setDiscount(0);

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

  const isAdmin =
    user?.roles?.some(
      role =>
        role.name ===
        "Administrateur"
    ) ?? false;

  const isAccountant =
    user?.roles?.some(
      role =>
        role.name ===
        "Comptable"
    ) ?? false;

  const scoped = sales.filter(
    sale =>
      isAdmin ||
      isAccountant ||
      String(sale.store_id) ===
      storeId
  );
const showDetails = async (
  saleId: number | string
) => {
  try {
    const response = await getSale(saleId);

    setSelectedSale(response.data);

    setDetailsOpen(true);
  } catch (error) {
    toast.error(
      "Impossible de charger la vente"
    );
  }
};





  return (
    <AppShell title="Ventes" module="sales">
      <PageHeader
        title="Ventes"
        subtitle="Enregistrer une vente, imprimer la facture"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Nouvelle vente</Button></DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Nouvelle vente</DialogTitle></DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Client</Label>
                  <Select value={customerId} onValueChange={setCustomerId}>
                    <SelectTrigger><SelectValue placeholder="Comptant" /></SelectTrigger>
                    <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select></div>
                <div className="flex items-end gap-2">
                  <div className="flex items-center gap-2">
                    <Switch checked={credit} onCheckedChange={setCredit} id="credit" />
                    <Label htmlFor="credit">Vente à crédit</Label>
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
                        <SelectTrigger className="col-span-5"><SelectValue /></SelectTrigger>
                       <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} ({Number(p.stock ?? 0)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                      </Select>
                      <Input type="number" min={1} className="col-span-2" value={it.quantity}
                        onChange={(e) => setLine(idx, { quantity: Number(e.target.value) })} />
                      <Input type="number" className="col-span-2" value={it.unit_price}
                        onChange={(e) => setLine(idx, { unit_price: Number(e.target.value) })} />
                      <Input type="number" className="col-span-2" placeholder="Remise" value={it.discount}
                        onChange={(e) => setLine(idx, { discount: Number(e.target.value) })} />
                      <Button size="icon" variant="ghost" className="col-span-1" onClick={() => setItems(items.filter((_, i) => i !== idx))}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="space-y-2"><Label>Remise globale</Label>
                  <Input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} /></div>
                {!credit && (
                  <div className="space-y-2"><Label>Paiement</Label>
                    <Select value={pm} onValueChange={(v) => setPm(v as PaymentMethod)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{PAY.filter((p) => p !== "crédit").map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select></div>
                )}
                {credit && (
                  <div className="space-y-2"><Label>Acompte</Label>
                    <Input type="number" value={paid} onChange={(e) => setPaid(Number(e.target.value))} /></div>
                )}
                <div className="space-y-2"><Label>Total</Label>
                  <div className="h-9 px-3 flex items-center font-semibold text-lg tabular-nums rounded-md bg-muted">{formatMoney(total)}</div></div>
              </div>
              <DialogFooter><Button onClick={submit}>Valider la vente</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <Card><CardContent className="p-0 overflow-x-auto">
        {scoped.length === 0 ? <EmptyState title="Aucune vente" /> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>N°</TableHead><TableHead>Date</TableHead>
              <TableHead>Client</TableHead><TableHead>Paiement</TableHead>
              <TableHead className="text-right">Total</TableHead><TableHead className="text-right">Payé</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {scoped.slice().reverse().map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.number}</TableCell>
                  <TableCell className="text-xs">{new Date(s.date).toLocaleString("fr-FR")}</TableCell>
                  <TableCell>{customers.find((c) => c.id === s.customer_id)?.name ?? "Comptant"}</TableCell>
                  <TableCell><Badge variant={s.is_credit ? "destructive" : "secondary"}>{s.payment_method}</Badge></TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">{formatMoney(s.total)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatMoney(s.paid)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => showDetails(s.id)} title="Détails"><FileText className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => printSaleInvoice(s.id, true)} title="Télécharger"><Download className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <Dialog
      open={detailsOpen}
      onOpenChange={setDetailsOpen}
    >
  <DialogContent className="max-w-4xl">
    <DialogHeader>
      <DialogTitle>
        Détails de la vente
      </DialogTitle>
    </DialogHeader>

    {selectedSale && (
      <div className="space-y-4">

        {/* Informations générales */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>N° :</strong>{" "}
            {selectedSale.number}
          </div>

          <div>
            <strong>Date :</strong>{" "}
            {new Date(
              selectedSale.date
            ).toLocaleString("fr-FR")}
          </div>

          <div>
            <strong>Client :</strong>{" "}
            {selectedSale.customer?.name ??
              "Client comptant"}
          </div>

          <div>
            <strong>Vendeur :</strong>{" "}
            {selectedSale.user?.full_name}
          </div>

          <div>
            <strong>Magasin :</strong>{" "}
            {selectedSale.store?.name}
          </div>

          <div>
            <strong>Paiement :</strong>{" "}
            {selectedSale.payment_method}
          </div>
        </div>

        {/* Articles */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                Produit
              </TableHead>
              <TableHead>
                Qté
              </TableHead>
              <TableHead>
                PU
              </TableHead>
              <TableHead>
                Remise
              </TableHead>
              <TableHead>
                Total
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {selectedSale.items?.map(
              (item: any) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.name}
                  </TableCell>

                  <TableCell>
                    {item.quantity}
                  </TableCell>

                  <TableCell>
                    {formatMoney(
                      item.unit_price
                    )}
                  </TableCell>

                  <TableCell>
                    {formatMoney(
                      item.discount
                    )}
                  </TableCell>

                  <TableCell>
                    {formatMoney(
                      item.quantity *
                        item.unit_price -
                        item.discount
                    )}
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>

        {/* Totaux */}
        <div className="border-t pt-4 space-y-2 text-right">
          <div>
            Sous-total :
            {" "}
            <strong>
              {formatMoney(
                selectedSale.subtotal
              )}
            </strong>
          </div>

          <div>
            Remise :
            {" "}
            <strong>
              {formatMoney(
                selectedSale.discount
              )}
            </strong>
          </div>

          <div className="text-lg">
            Total :
            {" "}
            <strong>
              {formatMoney(
                selectedSale.total
              )}
            </strong>
          </div>

          <div>
            Payé :
            {" "}
            <strong>
              {formatMoney(
                selectedSale.paid
              )}
            </strong>
          </div>

          {selectedSale.total >
            selectedSale.paid && (
            <div className="text-destructive">
              Reste dû :
              {" "}
              <strong>
                {formatMoney(
                  selectedSale.total -
                    selectedSale.paid
                )}
              </strong>
            </div>
          )}
        </div>
      </div>
    )}
  </DialogContent>
</Dialog>
      </CardContent></Card>
    </AppShell>
  );
}
