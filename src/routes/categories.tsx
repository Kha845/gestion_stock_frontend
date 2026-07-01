import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader, EmptyState } from "@/components/ui-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Category } from "@/lib/types";
import { createCategory, deleteCategory, getCategories, updateCategory } from "@/lib/api/apiCategory";

import {AlertDialog,AlertDialogAction,AlertDialogCancel,AlertDialogContent,AlertDialogDescription,AlertDialogFooter,AlertDialogHeader,AlertDialogTitle,AlertDialogTrigger,} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/categories")({ component: Page });

function Page() {

  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);



  useEffect(() => {
      loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await getCategories();
      setCats(response.data);
    } catch (error) {
      console.error(error);
      toast.error("Impossible de charger les catégories");
    } finally {
      setLoading(false);
    }
  };

 const save = async () => {
  if (!name.trim()) {
    toast.error("Nom requis");
    return;
  }

  try {
    const payload: Partial<Category> = {
      name,
    };

    if (edit) {
      await updateCategory(edit.id, payload);

      toast.success(
        "Catégorie modifiée avec succès"
      );
    } else {
      await createCategory(payload);

      toast.success(
        "Catégorie créée avec succès"
      );
    }

    await loadCategories();

    setOpen(false);
    setName("");
    setEdit(null);
  } catch (error: any) {
    console.error(error);

    toast.error(
      error?.response?.data?.message ??
      "Erreur lors de l'enregistrement"
    );
  }
};

const confirmDelete = async () => {
  if (!selectedId) {
    return;
  }

  try {
    setIsDeleting(true);

    await deleteCategory(selectedId);

    await loadCategories();

    toast.success(
      "Catégorie supprimée avec succès"
    );

    setOpenDelete(false);
    setSelectedId(null);
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

  return (
    <AppShell title="Catégories" module="categories">
      <AlertDialog
      open={openDelete}
      onOpenChange={setOpenDelete}
    >
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>
        Confirmer la suppression
      </AlertDialogTitle>

      <AlertDialogDescription>
        Cette action est irréversible.
        Voulez-vous vraiment supprimer cette catégorie ?
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
          confirmDelete();
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
        title="Catégories"
        subtitle="Organisez vos produits"
        actions={
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEdit(null); setName(""); } }}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Nouvelle</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{edit ? "Modifier" : "Nouvelle"} catégorie</DialogTitle></DialogHeader>
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
              </div>
              <DialogFooter><Button onClick={save}>Enregistrer</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <Card>
        <CardContent className="p-0">
          {cats.length === 0 ? <EmptyState title="Aucune catégorie" /> : (
            <Table>
              <TableHeader><TableRow><TableHead>Nom</TableHead><TableHead className="w-32 text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {cats.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => { setEdit(c); setName(c.name); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => {setSelectedId(c.id); setOpenDelete(true);}}>
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
    </AppShell>
  );
}
