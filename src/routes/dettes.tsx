import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader, EmptyState } from "@/components/ui-helpers";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatMoney, formatDate } from "@/lib/store";
import { toast } from "sonner";
import { Customer, Debt, DebtPayment, Supplier } from "@/lib/types";
import { getDebtPayments, getDebts, payDebt } from "@/lib/api/apiDebt";
import { getCustomers } from "@/lib/api/apiCustomer";
import { getSuppliers } from './../lib/api/apiSupplier';

export const Route = createFileRoute("/dettes")({ component: Page });

function Page() {
   const { user } = useAuth();

  const [debts, setDebts] = useState<Debt[]>([]);
  const [payments, setPayments] = useState<DebtPayment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<number | null>(null);
  const [amount, setAmount] = useState(0);

  // =========================
  // LOAD DATA
  // =========================
  useEffect(() => {
    loadDebts();
    loadPayments();
    loadParties();
  }, []);

  const loadDebts = async () => {
    const res = await getDebts();

    const data = Array.isArray(res)
      ? res
      : res.data;
    
    setDebts(data ?? []);
  };

  const loadPayments = async () => {
    try {
      const res = await getDebtPayments(); // à adapter ssi besoins
      setPayments(res);
    } catch (err) {
      toast.error("Erreur chargement paiements");
    }
  };

  const loadParties = async () => {
    try {
      const [c, s] = await Promise.all([
        getCustomers(),
        getSuppliers()
      ]);
      setCustomers(c.data);
      setSuppliers(s.data);
    } catch (err) {
      toast.error("Erreur chargement clients/fournisseurs");
    }
  };

  // =========================
  // PAY DEBT
  // =========================
  const openPay = (id: number) => {
    setTarget(id);
    setAmount(0);
    setOpen(true);
  };

  const submit = async () => {
    if (!user || !target || amount <= 0) return;

    try {

      await payDebt(Number(target), Number(amount));

      toast.success("Paiement enregistré");

      setOpen(false);
      setTarget(null);

      // refresh
      await loadDebts();
      await loadPayments();
    } catch (err) {
      toast.error("Erreur paiement");
    }
  };

  // =========================
  // TABLE RENDER
  // =========================
  const renderTable = (type: "client" | "fournisseur") => {
    const filtered = debts.filter((d) => d.type === type);

    if (filtered.length === 0) {
      return <EmptyState title="Aucune dette" />;
    }
    return (
      <Table>
        <TableHeader><TableRow>
          <TableHead>{type === "client" ? "Client" : "Fournisseur"}</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead className="text-right">Payé</TableHead>
          <TableHead className="text-right">Reste</TableHead>
          <TableHead>État</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow></TableHeader>
        <TableBody>

          {filtered.map((d) => {
            const reste = d.total - d.paid;
            const party = type === "client" ? customers.find((c) => c.id === d.party_id) : suppliers.find((s) => s.id === d.party_id);
            return (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{party?.name ?? "—"}</TableCell>
                <TableCell className="text-xs">{formatDate(d.created_at)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatMoney(d.total)}</TableCell>
                <TableCell className="text-right tabular-nums text-success">{formatMoney(d.paid)}</TableCell>
                <TableCell className="text-right tabular-nums font-semibold">{formatMoney(reste)}</TableCell>
                <TableCell>{reste === 0 ? <Badge variant="secondary">Soldée</Badge> : reste < d.total ? <Badge className="bg-warning text-warning-foreground">Partielle</Badge> : <Badge variant="destructive">À payer</Badge>}</TableCell>
                <TableCell className="text-right">
                  {reste > 0 && <Button size="sm" variant="outline" onClick={() => openPay(Number(d.id))}>Payer</Button>}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  return (
    <AppShell title="Dettes" module="debts">
      <PageHeader title="Dettes" subtitle="Suivi des créances et engagements" />
      <Tabs defaultValue="client">
        <TabsList>
          <TabsTrigger value="client">Clients</TabsTrigger>
          <TabsTrigger value="fournisseur">Fournisseurs</TabsTrigger>
          <TabsTrigger value="payments">Historique</TabsTrigger>
        </TabsList>
        <TabsContent value="client"><Card><CardContent className="p-0 overflow-x-auto">{renderTable("client")}</CardContent></Card></TabsContent>
        <TabsContent value="fournisseur"><Card><CardContent className="p-0 overflow-x-auto">{renderTable("fournisseur")}</CardContent></Card></TabsContent>
       <TabsContent value="payments">
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Tiers</TableHead>
                <TableHead className="text-right">
                  Montant
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {payments.slice().reverse().map((p) => {

                const debt = debts.find(
                  (d) =>
                    Number(d.id) ===
                    Number(p.debt_id)
                );
             
                const party = debt
                  ? debt.type === "client"
                    ? customers.find(
                        (c) =>
                          Number(c.id) ===
                          Number(debt.party_id)
                      )
                    : suppliers.find(
                        (s) =>
                          Number(s.id) ===
                          Number(debt.party_id)
                      )
                  : null;

                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      {new Date(p.date).toLocaleDateString(
                        "fr-FR"
                      )}
                    </TableCell>

                    <TableCell>
                      {party?.name ?? "INCONNU"} (
                      {debt?.type ?? "?"})
                    </TableCell>

                    <TableCell className="text-right">
                      {formatMoney(p.amount)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TabsContent>
      </Tabs>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Enregistrer un paiement</DialogTitle></DialogHeader>
          <div className="space-y-2"><Label>Montant</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} autoFocus /></div>
          <DialogFooter><Button onClick={submit}>Valider</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
