import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader, EmptyState } from "@/components/ui-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Trash2} from "lucide-react";
import { toast } from "sonner";
import type { Store } from "@/lib/types";
import { createStore, deleteStore, updateStore } from "@/lib/api/apiStore";
import { useAuth } from "@/components/AuthProvider";
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,AlertDialogFooter,AlertDialogHeader,AlertDialogTitle,} from "@/components/ui/alert-dialog";
export const Route = createFileRoute("/magasins")({ component: Page });

function Page() {

  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Store | null>(null);
  const [form, setForm] = useState<Partial<Store>>({});
  const [loading, setLoading] = useState(false);
  const {refreshStores, stores} = useAuth();
  const [storeToDelete, setStoreToDelete] = useState<string | number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  /**
 * Création / Modification
 */
  const save = async () => {
    if (!form.name?.trim()) {
      return toast.error("Nom requis");
    }
    const payload = new FormData();

    payload.append("name", form.name ?? "");
    payload.append("address", form.address ?? "");
    payload.append("phone", form.phone ?? "");
    payload.append("ninea", form.ninea ?? "");
    payload.append(
      "registre_commerce",
      form.registre_commerce ?? ""
    );

    if (form.logo instanceof File) {
      payload.append("logo", form.logo);
    }
    setLoading(true);

    try {
      if (edit) {
    
        await updateStore(edit.id, payload);

        toast.success("Magasin modifié avec succès");
      } else {
        console.log("les données du formulaire", form)
        await createStore(payload);

        toast.success("Magasin créé avec succès");
      }

      await refreshStores();

      closeForm();
    } catch (error: any) {
      console.error(error);

      toast.error(
        error?.response?.data?.message ??
          "Erreur lors de l'enregistrement"
      );
    } finally {
      setLoading(false);
    }
  };


  const confirmDelete = async () => {
  if (!storeToDelete) return;

  setIsDeleting(true);

  try {
    await deleteStore(storeToDelete);

    await refreshStores();

    toast.success("Magasin supprimé");

    setStoreToDelete(null);
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
/**
 * Suppression
 */
const remove = async (id: string | number) => {
 setStoreToDelete(id);
};

/**
 * Réinitialiser le formulaire
 */
const closeForm = () => {
  setOpen(false);
  setEdit(null);
  setForm({});
};

  return (
    <AppShell title="Magasins" module="stores">
      <PageHeader
        title="Magasins"
        actions={
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEdit(null); setForm({}); } }}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Nouveau</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{edit ? "Modifier" : "Nouveau"} magasin</DialogTitle></DialogHeader>
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-2"><Label>Nom</Label><Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="space-y-2"><Label>Adresse</Label><Input value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
                <div className="space-y-2"><Label>Téléphone</Label><Input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div className="space-y-2">
                  <Label>NINEA</Label>
                  <Input  value={form.ninea ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        ninea: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Registre de commerce</Label>
                  <Input
                    value={form.registre_commerce ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        registre_commerce: e.target.value,
                      })
                    }
                  />
                </div>

              <div className="space-y-2">
                <Label>Logo</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setForm({
                      ...form,
                      logo: e.target.files?.[0] ?? null,
                    })
                  }
                />
              </div>
              {edit?.logo && typeof edit.logo === "string" && (
                  <div className="mt-2">
                    <img
                      src={`${import.meta.env.VITE_API_URL_STORAGE}/storage/${edit.logo}`}
                      alt="Logo"
                      className="h-16 w-16 rounded object-cover border"
                    />
                  </div>
                )}
              </div>
              <DialogFooter><Button onClick={save}>Enregistrer</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <Card><CardContent className="p-0 overflow-x-auto">
        {stores.length === 0 ? <EmptyState title="Aucun magasin" /> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Adresse</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Ninea</TableHead>
              <TableHead>Registre de commerce</TableHead>
              <TableHead>logo</TableHead>
              <TableHead className="text-right w-24">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {stores.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-muted-foreground">{s.address ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{s.phone ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{s.ninea ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{s.registre_commerce ?? "—"}</TableCell>
                    <TableCell>
                      {s.logo ? (
                        <img
                          src={`${import.meta.env.VITE_API_URL_STORAGE}/storage/${s.logo}`}
                          alt={s.name}
                          className="h-10 w-10 rounded object-cover border"
                        />
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { setEdit(s); setForm(s); setOpen(true); }}><Pencil className="h-4 w-4 text-blue-600" /></Button>
                    <Button variant="ghost" size="icon"  onClick={() => remove(s.id)}><Trash2 className="h-4 w-4 text-red-500" ></Trash2></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <AlertDialog
          open={storeToDelete !== null}
          onOpenChange={(open) => {
            if (!open) {
              setStoreToDelete(null);
            }
          }}
        >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Supprimer le magasin ?
            </AlertDialogTitle>

            <AlertDialogDescription>
              Cette action est irréversible. Le magasin sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Annuler
            </AlertDialogCancel>

            <AlertDialogAction
              className="bg-red-500"
              disabled={isDeleting}
              onClick={confirmDelete}
            >
              {isDeleting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </CardContent></Card>
    </AppShell>
  );
}
