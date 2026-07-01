import { useEffect, useState } from "react";
import { AppShell } from "./AppShell";
import { PageHeader, EmptyState } from "./ui-helpers";
import {formatMoney } from "@/lib/store";
import { totalDebt } from "@/lib/operations";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Card, CardContent } from "./ui/card";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Customer, Supplier } from "@/lib/types";
import { createCustomer, deleteCustomer, getCustomers, updateCustomer } from "@/lib/api/apiCustomer";
import { createSupplier, deleteSupplier, getSuppliers, updateSupplier } from "@/lib/api/apiSupplier";
import { getTotalDebt } from "@/lib/api/apiDebt";

export function PartyPage({ kind }: { kind: "client" | "fournisseur" }) {

 const [list, setList] = useState<Customer[] | Supplier[]>([]);
 const [edit, setEdit] = useState<Customer | Supplier | null>(null);
 const [form, setForm] = useState<Partial<Customer & Supplier>>({});
 const [open, setOpen] = useState(false);
 const [search, setSearch] = useState("");

 const [debts, setDebts] = useState<Record<number, number>>({});

 const openNew = () => {
  setEdit(null);

  setForm({
    name: "",
    phone: "",
    address: "",
  });

  setOpen(true);
};

 useEffect(() => {
  loadData();
}, [kind]);


useEffect(() => {
  const loadDebts = async () => {
    const totals: Record<number, number> = {};

    for (const p of list) {
      totals[Number(p.id)] = await getTotalDebt(
        kind,
        Number(p.id)
      );
    }

    setDebts(totals);
  };

  loadDebts();
}, [kind, list]);

const loadData = async () => {
  try {
    if (kind === "client") {
      const response = await getCustomers();
      setList(response.data);
    } else {
      const response = await getSuppliers();
      setList(response.data);
    }
  } catch (error) {
    console.error(error);

    toast.error(
      `Impossible de charger les ${
        kind === "client"
          ? "clients"
          : "fournisseurs"
      }`
    );
  }
};

const filteredList = list.filter((item: any) => {
  const keyword = search.toLowerCase();

  return (
    item.name?.toLowerCase().includes(keyword) ||
    item.phone?.toLowerCase().includes(keyword)
  );
});

 const save = async () => {
  if (!form.name?.trim()) {
    toast.error("Nom requis");
    return;
  }

  try {
    const payload = {
      name: form.name,
      phone: form.phone ?? undefined,
      address: form.address ?? undefined,
    };

    if (kind === "client") {
      if (edit) {
        await updateCustomer(
          edit.id,
          payload
        );

        toast.success(
          "Client modifié avec succès"
        );
      } else {
        await createCustomer(
          payload
        );

        toast.success(
          "Client créé avec succès"
        );
      }
    } else {
      if (edit) {
        await updateSupplier(
          edit.id,
          payload
        );

        toast.success(
          "Fournisseur modifié avec succès"
        );
      } else {
        await createSupplier(
          payload
        );

        toast.success(
          "Fournisseur créé avec succès"
        );
      }
    }

    await loadData();

    setOpen(false);
    setEdit(null);
    setForm({});
  } catch (error: any) {
    console.error(error);

    toast.error(
      error?.response?.data?.message ??
      "Erreur lors de l'enregistrement"
    );
  }
};
const remove = async (
  id: string | number
) => {
  try {
    if (kind === "client") {
      await deleteCustomer(id);
    } else {
      await deleteSupplier(id);
    }

    await loadData();

    toast.success(
      `${
        kind === "client"
          ? "Client"
          : "Fournisseur"
      } supprimé avec succès`
    );
  } catch (error: any) {
    console.error(error);

    toast.error(
      error?.response?.data?.message ??
      "Erreur lors de la suppression"
    );
  }
};

  const title = kind === "client" ? "Clients" : "Fournisseurs";
  const moduleKey = kind === "client" ? "customers" : "suppliers";

  return (
    <AppShell title={title} module={moduleKey as any}>
      <PageHeader
        title={title}
        actions={
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEdit(null); setForm({}); } }}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Nouveau</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{edit ? "Modifier" : "Nouveau"} {kind}</DialogTitle></DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2 col-span-2"><Label>Nom</Label><Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="space-y-2 col-span-2"><Label>Téléphone</Label><Input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div className="space-y-2 col-span-2"><Label>Adresse</Label><Input value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={save}>Enregistrer</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="mb-4 max-w-md">
        <Input
          placeholder={`Rechercher un ${kind} par nom ou téléphone...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <Card><CardContent className="p-0 overflow-x-auto">
        {filteredList.length === 0 ? <EmptyState title={search ? "Aucun résultat trouvé" : `Aucun ${kind}`}/> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead className="text-right">Dette en cours</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filteredList.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground">{p.phone ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">  {formatMoney(debts[p.id] ?? 0)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { setEdit(p); setForm(p); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>
    </AppShell>
  );
}
