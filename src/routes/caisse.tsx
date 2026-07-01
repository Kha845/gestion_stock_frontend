import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader, StatCard } from "@/components/ui-helpers";
import { useDB } from "@/lib/useDB";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/store";
import { Plus, ArrowDown, ArrowUp, Wallet, CalendarIcon, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { CashCategory, CashEntry, CashType } from "@/lib/types";

import {getCashEntries, createCashEntry} from "@/lib/api/apiCashEntry";

export const Route = createFileRoute("/caisse")({ component: Page });

const CATS: CashCategory[] = ["vente", "paiement_client", "achat", "paiement_fournisseur", "dépense", "autre"];

function Page() {
  const { user, storeId, stores } = useAuth();

  const [cash, setCash] = useState<CashEntry[]>([]);

useEffect(() => {
  loadData();
}, []);

const loadData = async () => {
  try {
    const cashRes =  await getCashEntries();
    setCash(cashRes.data ?? []);
  } catch (error) {
    console.error(error);
    toast.error("Erreur de chargement");
  }
};

const isGlobal =
  user?.roles?.some(role =>
    ["Administrateur", "Comptable"].includes(role.name)
  ) ?? false;

const target = isGlobal ? null : storeId;

const [from, setFrom] = useState<Date | undefined>();
const [to, setTo] = useState<Date | undefined>();

  const filtered = cash.filter((c) => {
  if (
    target &&
    String(c.store_id) !== String(target)
  ) {
    return false;
  }

  const d = new Date(c.date);

  if (
    from &&
    d <
      new Date(
        new Date(from).setHours(
          0,
          0,
          0,
          0
        )
      )
  ) {
    return false;
  }

  if (
    to &&
    d >
      new Date(
        new Date(to).setHours(
          23,
          59,
          59,
          999
        )
      )
  ) {
    return false;
  }

  return true;
});


  const balance = useMemo(() => {

  const entries = target
    ? cash.filter(
        (c) =>
          String(c.store_id) === String(target)
      )
    : cash;

  const totalIn = entries
    .filter((c) => c.type === "entrée")
    .reduce(
      (sum, c) => sum + Number(c.amount),
      0
    );

  const totalOut = entries
    .filter((c) => c.type === "sortie")
    .reduce(
      (sum, c) => sum + Number(c.amount),
      0
    );

  return totalIn - totalOut;
}, [cash, target]);

  const today = new Date().toDateString();

  const dayEntries = cash.filter((c) =>(!target || String(c.store_id) === String(target)) &&
      new Date(c.date).toDateString() ===
      today);

  const dayIn = dayEntries.filter((c) => c.type === "entrée").reduce((s, c) => s + c.amount, 0);
  const dayOut = dayEntries.filter((c) => c.type === "sortie").reduce((s, c) => s + c.amount, 0);

  const [open, setOpen] = useState(false);
  const [type, setType] = useState<CashType>("sortie");
  const [cat, setCat] = useState<CashCategory>("dépense");
  const [amount, setAmount] = useState(0);
  const [desc, setDesc] = useState("");

 const submit = async () => {
  if (!user || !storeId) {
    toast.error("Magasin requis");
    return;
  }

  if (amount <= 0) {
    toast.error("Montant invalide");
    return;
  }

  try {
    await createCashEntry({
      store_id: storeId,
      user_id: user.id,
      type,
      category: cat,
      amount,
      description: desc,
      date: new Date().toISOString(),
    });

    toast.success(
      "Mouvement enregistré"
    );

    await loadData();

    setOpen(false);
    setAmount(0);
    setDesc("");
  } catch (error) {
    console.error(error);

    toast.error(
      "Erreur lors de l'enregistrement"
    );
  }
};

  const sorted = useMemo(() => [...filtered].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 200), [filtered]);
  const periodTotal = useMemo(() => {
    const i = filtered.filter((c) => c.type === "entrée").reduce((s, c) => s + c.amount, 0);
    const o = filtered.filter((c) => c.type === "sortie").reduce((s, c) => s + c.amount, 0);
    return { i, o, net: i - o };
  }, [filtered]);

  return (
    <AppShell title="Caisse" module="cash">
      <PageHeader
        title="Caisse"
        subtitle={isGlobal ? "Toutes caisses" : "Caisse magasin"}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Mouvement</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Mouvement de caisse</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Type</Label>
                  <Select value={type} onValueChange={(v) => setType(v as CashType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="entrée">Entrée</SelectItem><SelectItem value="sortie">Sortie</SelectItem></SelectContent>
                  </Select></div>
                <div className="space-y-2"><Label>Catégorie</Label>
                  <Select value={cat} onValueChange={(v) => setCat(v as CashCategory)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATS.map((c) => <SelectItem key={c} value={c}>{c.replace("_", " ")}</SelectItem>)}</SelectContent>
                  </Select></div>
                <div className="space-y-2 col-span-2"><Label>Montant</Label>
                  <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></div>
                <div className="space-y-2 col-span-2"><Label>Description</Label>
                  <Input value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
              </div>
              <DialogFooter><Button onClick={submit}>Valider</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <StatCard label="Solde" value={formatMoney(balance)} icon={<Wallet className="h-5 w-5" />} accent="primary" />
        <StatCard label="Entrées du jour" value={formatMoney(dayIn)} icon={<ArrowDown className="h-5 w-5" />} accent="success" />
        <StatCard label="Sorties du jour" value={formatMoney(dayOut)} icon={<ArrowUp className="h-5 w-5" />} accent="destructive" />
      </div>
      <Card className="mb-4"><CardContent className="p-3 flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Du</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[180px] justify-start text-left font-normal", !from && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {from ? format(from, "PPP", { locale: fr }) : <span>Date début</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={from} onSelect={setFrom} initialFocus className={cn("p-3 pointer-events-auto")} locale={fr} />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Au</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[180px] justify-start text-left font-normal", !to && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {to ? format(to, "PPP", { locale: fr }) : <span>Date fin</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={to} onSelect={setTo} initialFocus className={cn("p-3 pointer-events-auto")} locale={fr} />
            </PopoverContent>
          </Popover>
        </div>
        {(from || to) && (
          <Button variant="ghost" size="sm" onClick={() => { setFrom(undefined); setTo(undefined); }}>
            <X className="h-4 w-4 mr-1" />Réinitialiser
          </Button>
        )}
        <div className="ml-auto flex flex-wrap gap-4 text-sm">
          <span className="text-muted-foreground">Entrées: <span className="font-medium text-success">{formatMoney(periodTotal.i)}</span></span>
          <span className="text-muted-foreground">Sorties: <span className="font-medium text-destructive">{formatMoney(periodTotal.o)}</span></span>
          <span className="text-muted-foreground">Net: <span className="font-medium">{formatMoney(periodTotal.net)}</span></span>
        </div>
      </CardContent></Card>
      <Card><CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Date</TableHead><TableHead>Magasin</TableHead><TableHead>Type</TableHead>
            <TableHead>Catégorie</TableHead><TableHead>Description</TableHead>
            <TableHead className="text-right">Montant</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {sorted.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="text-xs">{new Date(c.date).toLocaleString("fr-FR")}</TableCell>
                <TableCell>{stores.find((s) => s.id === c.store_id)?.name}</TableCell>
                <TableCell><Badge className={c.type === "entrée" ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-100"
                                                : "bg-red-100 text-red-800 border-red-300 hover:bg-red-100"}>
                    {c.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground capitalize">{c.category.replace("_", " ")}</TableCell>
                <TableCell className="text-muted-foreground">{c.description ?? "—"}</TableCell>
                <TableCell className={`text-right tabular-nums font-medium ${c.type === "entrée" ? "text-success" : "text-destructive"}`}>
                  {c.type === "entrée" ? "+" : "-"}{formatMoney(c.amount)}
                </TableCell>
              </TableRow>
            ))}
            {sorted.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Aucun mouvement</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent></Card>
    </AppShell>
  );
}
