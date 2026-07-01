import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader, EmptyState } from "@/components/ui-helpers";
import { formatMoney } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import type { Category, Product, Unit } from "@/lib/types";
import { createProduct, deleteProduct, getProducts, updateProduct } from "@/lib/api/apiProduct";
import { getCategories } from "@/lib/api/apiCategory";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/produits")({ component: Page });

const UNITS: Unit[] = ["pièce", "kg", "litre", "boîte", "paquet", "mètre", "sac"];

function Page() {

  const [products, setProducts] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Product | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<Partial<Product>>({ unit: "pièce", price: 0, cost: 0, min_stock: 0 });

  const openNew = () => {
    setEdit(null);
    setImageFile(null);

    setForm({
      unit: "pièce",
      price: 0,
      cost: 0,
      min_stock: 0,
    });

    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setEdit(p);
    setForm(p);
    setImageFile(null);
    setOpen(true);
  };

  const [openDelete, setOpenDelete] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {

    loadData();

  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [productsRes, categoriesRes] =
        await Promise.all([
          getProducts(),
          getCategories(),
        ]);

      setProducts(productsRes.data);
      setCats(categoriesRes.data);
    } catch (error) {
      console.error(error);

      toast.error(
        "Impossible de charger les données"
      );
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!form.name?.trim()) {
      return toast.error("Nom requis");
    }

    try {
      const formData = new FormData();

      formData.append(
        "reference",
        form.reference ?? ""
      );

      formData.append(
        "name",
        form.name
      );

      formData.append(
        "unit",
        form.unit ?? "pièce"
      );

      formData.append(
        "price",
        String(form.price ?? 0)
      );

      formData.append(
        "cost",
        String(form.cost ?? 0)
      );

      formData.append(
        "min_stock",
        String(form.min_stock ?? 0)
      );

      if (form.category_id) {
        formData.append(
          "category_id",
          String(form.category_id)
        );
      }

      if (imageFile) {
        formData.append(
          "image",
          imageFile
        );
      }

      if (edit) {
        await updateProduct(
          edit.id,
          formData
        );

        toast.success(
          "Produit modifié avec succès"
        );
      } else {
        await createProduct(
          formData
        );

        toast.success(
          "Produit créé avec succès"
        );
      }

      await loadData();

      setOpen(false);
      setEdit(null);
      setImageFile(null);
    } catch (error: any) {
      console.error(error);

      toast.error(
        error?.response?.data?.message ??
        "Erreur lors de l'enregistrement"
      );
    }
  };
  const remove = async () => {
    if (!selectedProduct) {
      return;
    }

    try {
      setIsDeleting(true);

      await deleteProduct(
        selectedProduct.id
      );

      await loadData();

      toast.success(
        "Produit supprimé avec succès"
      );

      setOpenDelete(false);
      setSelectedProduct(null);
    } catch (error: any) {
      console.error(error);

      toast.error(
        error?.response?.data?.message ??
        "Erreur lors de la suppression"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = products.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.reference.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AppShell title="Produits" module="products">
      <AlertDialog
        open={openDelete}
        onOpenChange={setOpenDelete}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Supprimer le produit
            </AlertDialogTitle>

            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer
              le produit{" "}
              <strong>
                {selectedProduct?.name}
              </strong>
              ?
              <br />
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
            >
              Annuler
            </AlertDialogCancel>

            <AlertDialogAction
              className="bg-red-500"
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                remove();
              }}
            >
              {isDeleting
                ? "Suppression..."
                : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <PageHeader
        title="Produits"
        subtitle="Gérez votre catalogue"
        actions={<Button onClick={openNew}><Plus className="h-4 w-4 mr-1" />Nouveau produit</Button>}
      />
      <div className="mb-3 relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
      </div>
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {filtered.length === 0 ? <EmptyState title="Aucun produit" /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Réf</TableHead><TableHead>Nom</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Catégorie</TableHead><TableHead>Unité</TableHead>
                  <TableHead className="text-right">Prix</TableHead>
                  <TableHead className="text-right">Coût</TableHead>
                  <TableHead className="text-right">Seuil</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.reference}</TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>
                      {p.image ? (
                        <img
                          src={`${import.meta.env.VITE_API_URL_STORAGE}/storage/${p.image}`}
                          alt={p.name}
                          className="h-10 w-10 rounded object-cover border"
                        />
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{cats.find((c) => c.id === p.category_id)?.name ?? "—"}</TableCell>
                    <TableCell>{p.unit}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(p.price)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{formatMoney(p.cost)}</TableCell>
                    <TableCell className="text-right">{p.min_stock}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => { setSelectedProduct(p); setOpenDelete(true); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{edit ? "Modifier" : "Nouveau"} produit</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Référence</Label>
              <Input value={form.reference ?? ""} onChange={(e) => setForm({ ...form, reference: e.target.value })} /></div>
            <div className="space-y-2"><Label>Nom</Label>
              <Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Catégorie</Label>
              <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>{cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select></div>
            <div className="space-y-2"><Label>Unité</Label>
              <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v as Unit })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select></div>
            <div className="space-y-2"><Label>Prix de vente</Label>
              <Input type="number" value={form.price ?? 0} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div>
            <div className="space-y-2"><Label>Prix d'achat</Label>
              <Input type="number" value={form.cost ?? 0} onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} /></div>
            <div className="space-y-2 col-span-2"><Label>Seuil d'alerte</Label>
              <Input type="number" value={form.min_stock ?? 0} onChange={(e) => setForm({ ...form, min_stock: Number(e.target.value) })} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Image du produit</Label>

              <Input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setImageFile(
                    e.target.files?.[0] ?? null
                  )
                }
              />

              {edit?.image && (
                <img
                  src={`${import.meta.env.VITE_API_URL_STORAGE}/storage/${edit.image}`}
                  alt={edit.name}
                  className="mt-2 h-24 w-24 rounded border object-cover"
                />
              )}
            </div>

          </div>

          <DialogFooter><Button onClick={save}>Enregistrer</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
