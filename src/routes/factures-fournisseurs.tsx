import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader, EmptyState } from "@/components/ui-helpers";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter} from "@/components/ui/dialog";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Receipt, Paperclip, CreditCard, Eye } from "lucide-react";
import { toast } from "sonner";
import {getSupplierInvoices, createSupplierInvoice, paySupplierInvoice,} from "@/lib/api/apiSupplierInvoice";

import { getSuppliers } from "@/lib/api/apiSupplier";

import { getStores } from "@/lib/api/apiStore";

import { formatMoney, formatDate, hasRole } from "@/lib/store";
import type { PaymentMethod, Store, Supplier, SupplierInvoice, SupplierInvoiceItem } from "@/lib/types";


export const Route = createFileRoute("/factures-fournisseurs")({ component: Page });

const PAY: PaymentMethod[] = ["espèces", "carte", "mobile", "virement"];

function Page() {
  const { user,storeId} = useAuth();
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [tax, setTax] = useState(0);
  const [paid, setPaid] = useState(0);
  const [pm, setPm] = useState<PaymentMethod>("espèces");
  const [attachmentName, setAttachmentName] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [items, setItems] = useState<SupplierInvoiceItem[]>([
    { description: "", quantity: 1, unit_cost: 0 },
  ]);
  // payment dialog
  const [payOpen, setPayOpen] = useState(false);
  const [payInvoiceId, setPayInvoiceId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>("espèces");
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [selectedInvoice, setSelectedInvoice] = useState< SupplierInvoice | null>(null);

  const subtotal = useMemo(
    () => items.reduce((s, i) => s + (Number(i.unit_cost) || 0) * (Number(i.quantity) || 0), 0),
    [items],
  );
  const total = subtotal + (Number(tax) || 0);


const loadData = async () => {
  try {

    const [
      invoicesResponse,
      suppliersResponse,
      storesResponse,
    ] = await Promise.all([
      getSupplierInvoices(),
      getSuppliers(),
      getStores(),
    ]);

    setInvoices(
      invoicesResponse.data
    );

    setSuppliers(
      suppliersResponse.data
    );

    setStores(
      storesResponse.data
    );

  } catch (error) {

    toast.error(
      "Erreur lors du chargement"
    );

  } finally {

    setLoading(false);

  }
};

useEffect(() => {
  loadData();
}, []);

  const reset = () => {
    setSupplierId(""); setInvoiceNumber("");
    setIssueDate(new Date().toISOString().slice(0, 10));
    setDueDate(""); setTax(0); setPaid(0); setPm("espèces");
    setAttachmentName(null); setNote("");
    setItems([{ description: "", quantity: 1, unit_cost: 0 }]);
  };

  const setLine = (i: number, patch: Partial<SupplierInvoiceItem>) => {
    const c = [...items]; c[i] = { ...c[i], ...patch }; setItems(c);
  };

const submit = async () => {
  try {

    if (!user || !storeId) {
      return toast.error(
        "Aucun magasin actif"
      );
    }

    const formData = new FormData();

    formData.append(
      "invoice_number",
      invoiceNumber
    );

    formData.append(
      "supplier_id",
      supplierId
    );

    formData.append(
      "store_id",
      storeId
    );

    formData.append(
      "user_id",
      user.id
    );

    formData.append(
      "issue_date",
      issueDate
    );

    if (dueDate) {
      formData.append(
        "due_date",
        dueDate
      );
    }

    formData.append(
      "tax",
      String(tax)
    );

    formData.append(
      "paid",
      String(paid)
    );

    formData.append(
      "payment_method",
      pm
    );

    formData.append(
      "note",
      note
    );

    items.forEach(
      (item, index) => {

        formData.append(
          `items[${index}][description]`,
          item.description
        );

        formData.append(
          `items[${index}][quantity]`,
          String(item.quantity)
        );

        formData.append(
          `items[${index}][unit_cost]`,
          String(item.unit_cost)
        );

      }
    );

    if (attachmentName) {

      formData.append(
        "attachment_name",
        attachmentName
      );

    }

    await createSupplierInvoice(
      formData
    );

    toast.success(
      "Facture enregistrée"
    );

    loadData();

    reset();

    setOpen(false);

  } catch (error: any) {

    toast.error(
      error.response?.data?.message ??
      "Erreur lors de l'enregistrement"
    );

  }
};


const handleViewDetails = (
  invoice: SupplierInvoice
) => {
  setSelectedInvoice(invoice);
  setDetailsOpen(true);
};


  const openPay = (invId: string, remaining: number) => {
    setPayInvoiceId(invId); setPayAmount(remaining); setPayMethod("espèces"); setPayOpen(true);
  };

  const submitPay = async () => {
  try {

    if (!payInvoiceId) return;

    await paySupplierInvoice(
      payInvoiceId,
      {
        amount: payAmount,
        payment_method: payMethod,
        user_id: user?.id,
      }
    );

    toast.success(
      "Paiement enregistré"
    );

    setPayOpen(false);

    loadData();

  } catch {

    toast.error(
      "Erreur lors du paiement"
    );

  }
};

 const isGlobalUser =
  hasRole(user, "Administrateur") ||
  hasRole(user, "Comptable");

const scoped = invoices.filter(
  (invoice) =>
    isGlobalUser ||
    invoice.store_id === storeId
);
  return (
    <AppShell title="Factures fournisseurs" module="supplier_invoices">
      <PageHeader
        title="Factures fournisseurs"
        actions={
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-1" />Nouvelle facture</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Receipt className="h-4 w-4" />Enregistrer une facture fournisseur
                </DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Fournisseur</Label>
                  <Select value={supplierId} onValueChange={setSupplierId}>
                    <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>N° facture fournisseur</Label>
                  <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="Ex: INV-2025-001" />
                </div>
                <div className="space-y-2">
                  <Label>Date d'émission</Label>
                  <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Date d'échéance</Label>
                  <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Lignes de facture</Label>
                  <Button size="sm" variant="outline"
                    onClick={() => setItems([...items, { description: "", quantity: 1, unit_cost: 0 }])}>
                    <Plus className="h-3 w-3 mr-1" />Ligne
                  </Button>
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {items.map((it, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <Input className="col-span-6" placeholder="Description"
                        value={it.description} onChange={(e) => setLine(idx, { description: e.target.value })} />
                      <Input type="number" min={1} className="col-span-2" value={it.quantity}
                        onChange={(e) => setLine(idx, { quantity: Number(e.target.value) })} />
                      <Input type="number" className="col-span-3" placeholder="Coût unitaire"
                        value={it.unit_cost} onChange={(e) => setLine(idx, { unit_cost: Number(e.target.value) })} />
                      <Button size="icon" variant="ghost" className="col-span-1"
                        onClick={() => setItems(items.filter((_, i) => i !== idx))}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-2">
                  <Label>Total HT</Label>
                  <div className="h-9 px-3 flex items-center tabular-nums rounded-md bg-muted">{formatMoney(subtotal)}</div>
                </div>
                <div className="space-y-2">
                  <Label>TVA / taxe</Label>
                  <Input type="number" value={tax} onChange={(e) => setTax(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Total TTC</Label>
                  <div className="h-9 px-3 flex items-center font-semibold tabular-nums rounded-md bg-muted">{formatMoney(total)}</div>
                </div>
                <div className="space-y-2">
                  <Label>Acompte payé</Label>
                  <Input type="number" value={paid} onChange={(e) => setPaid(Number(e.target.value))} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {paid > 0 && (
                  <div className="space-y-2">
                    <Label>Mode de paiement</Label>
                    <Select value={pm} onValueChange={(v) => setPm(v as PaymentMethod)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{PAY.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Paperclip className="h-3 w-3" />Pièce jointe (nom)</Label>
                 <Input type="file" accept="image/*" onChange={(e) => setAttachmentName( e.target.files?.[0] ?? null)}/>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Note</Label>
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
              </div>

              <DialogFooter>
                <Button onClick={submit}>Enregistrer la facture</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <Card><CardContent className="p-0 overflow-x-auto">
        {scoped.length === 0 ? (
          <EmptyState title="Aucune facture fournisseur" description="Enregistrez vos factures pour suivre les paiements et les dettes." />
        ) : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>N°</TableHead>
              <TableHead>N° fournisseur</TableHead>
              <TableHead>Fournisseur</TableHead>
              <TableHead>Magasin</TableHead>
              <TableHead>Émission</TableHead>
              <TableHead>Échéance</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Payé</TableHead>
              <TableHead className="text-right">Reste</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right w-28">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {scoped.slice().reverse().map((inv) => {
                const remaining = inv.total - inv.paid;
                return (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.number}</TableCell>
                    <TableCell className="font-mono text-xs">{inv.invoice_number}</TableCell>
                    <TableCell>{suppliers.find((s) => s.id === inv.supplier_id)?.name ?? "—"}</TableCell>
                    <TableCell className="text-xs">{stores.find((s) => s.id === inv.store_id)?.name ?? "—"}</TableCell>
                    <TableCell className="text-xs">{formatDate(inv.issue_date)}</TableCell>
                    <TableCell className="text-xs">{inv.due_date ? formatDate(inv.due_date) : "—"}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">{formatMoney(inv.total)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(inv.paid)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(remaining)}</TableCell>
                    <TableCell>
                      <Badge variant={inv.status === "payée" ? "secondary" : inv.status === "partielle" ? "outline" : "destructive"}>
                        {inv.status}
                      </Badge>
                    </TableCell>
                   <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-2">
                        {remaining > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              openPay(inv.id, remaining)
                            }
                          >
                            <CreditCard className="h-4 w-4 mr-1" />
                          
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleViewDetails(inv)
                          }
                        >
                          <Eye className="h-4 w-4 mr-1" />
                         
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>

    {/* Dialog: Payer la facture */}
<Dialog open={payOpen} onOpenChange={setPayOpen}>
  <DialogContent className="max-w-sm">
    <DialogHeader>
      <DialogTitle>Payer la facture</DialogTitle>
    </DialogHeader>
    <div className="flex gap-3 items-end">
      <div className="flex-1 space-y-1.5">
        <Label className="text-xs text-muted-foreground">Montant</Label>
        <Input
          type="number"
          value={payAmount}
          onChange={(e) => setPayAmount(Number(e.target.value))}
        />
      </div>
      <div className="flex-1 space-y-1.5">
        <Label className="text-xs text-muted-foreground">Mode de paiement</Label>
        <Select value={payMethod} onValueChange={(v) => setPayMethod(v as PaymentMethod)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {PAY.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
    <DialogFooter className="mt-2">
      <Button className="w-full" onClick={submitPay}>Valider le paiement</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

{/* Dialog: Détails facture */}
<Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
    <DialogHeader className="border-b pb-3">
      <DialogTitle className="text-base font-semibold">Détails — Facture fournisseur</DialogTitle>
    </DialogHeader>

    {selectedInvoice && (
      <div className="space-y-5 pt-1">

        {/* Méta-infos en grille compacte */}
        <div className="grid grid-cols-3 gap-x-6 gap-y-3 text-sm">
          {[
            ["Numéro", selectedInvoice.number],
            ["N° facture fournisseur", selectedInvoice.invoice_number],
            ["Statut", selectedInvoice.status],
            ["Fournisseur", selectedInvoice.supplier?.name],
            ["Magasin", selectedInvoice.store?.name],
            ["Utilisateur", selectedInvoice.user?.full_name],
            ["Date", new Date(selectedInvoice.issue_date).toLocaleDateString("fr-FR")],
            ["Total", formatMoney(selectedInvoice.total)],
            ["Payé", formatMoney(selectedInvoice.paid)],
          ].map(([label, value]) => (
            <div key={label} className="space-y-0.5">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
              <p className="font-medium text-foreground">{value ?? "—"}</p>
            </div>
          ))}
        </div>

        {/* Tableau des lignes */}
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs font-semibold">Description</TableHead>
                <TableHead className="text-xs font-semibold text-right w-20">Qté</TableHead>
                <TableHead className="text-xs font-semibold text-right w-32">Coût unitaire</TableHead>
                <TableHead className="text-xs font-semibold text-right w-32">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedInvoice.items?.map((item: any) => (
                <TableRow key={item.id} className="text-sm">
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-right tabular-nums">{item.quantity}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatMoney(item.unit_cost)}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{formatMoney(item.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Note */}
        {selectedInvoice.note && (
          <div className="rounded-md bg-muted/40 px-4 py-3 text-sm">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Note</p>
            <p className="text-foreground">{selectedInvoice.note}</p>
          </div>
        )}

        {/* Pièce jointe */}
        {selectedInvoice.attachment_name && (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2">Pièce jointe</p>
            <img
              src={`${import.meta.env.VITE_API_URL_STORAGE}/storage/${selectedInvoice.attachment_name}`}
              alt="Facture"
              className="max-h-64 rounded-md border object-contain"
            />
          </div>
        )}

      </div>
    )}
  </DialogContent>
</Dialog>
    </AppShell>
  );
}
