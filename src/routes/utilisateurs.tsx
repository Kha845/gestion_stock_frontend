import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader, EmptyState } from "@/components/ui-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Role, User } from "@/lib/types";
import { createUser, deleteUser, getUsers, updateUser } from "@/lib/api/apiUser";
import { getRoles } from "@/lib/api/apiRole";
import { useAuth } from "@/components/AuthProvider";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/utilisateurs")({ component: Page });

function Page() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const { stores } = useAuth();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<User | null>(null);
  const [form, setForm] = useState<Partial<User>>({
    phone: "",
    password: "",
    full_name: "",
    store_id: null,
    active: true,
    roles: [],
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersRes, rolesRes] =
        await Promise.all([
          getUsers(),
          getRoles(),
        ]);

      setUsers(usersRes.data);
      setRoles(rolesRes.data);
    } catch (error) {
      console.error(error);
      toast.error("Impossible de charger les magasins");
    }
  };

  const openNew = () => {
    setEdit(null);
    setForm({
      phone: "",
      password: "",
      full_name: "",
      store_id: "",
      active: true,
      roles: [],
    });

    setOpen(true);
  };

  const openEdit = (user: User) => {
    setEdit(user);

    setForm({
      ...user,
      password: "",
    });

    setOpen(true);
  };

  const save = async () => {
    if (!form.phone?.trim()) {
      return toast.error("Téléphone requis");
    }

    if (!form.full_name?.trim()) {
      return toast.error("Nom requis");
    }

    if (!edit && !form.password) {
      return toast.error("Mot de passe requis");
    }

    try {
      const payload = {
        phone: form.phone,
        password: form.password,
        full_name: form.full_name,
        active: form.active,
        store_id: form.store_id || null,
        roles:
          form.roles?.map(role => role.id) ?? [],
      };

      if (edit) {
        await updateUser(edit.id, payload);

        toast.success(
          "Utilisateur modifié"
        );
      } else {
        await createUser(payload);

        toast.success(
          "Utilisateur créé"
        );
      }

      await loadData();

      setOpen(false);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ??
        "Erreur lors de l'enregistrement"
      );
    }
  };

  const toggleRole = (role: Role) => {
    const selected =
      form.roles?.some(
        r => r.id === role.id
      ) ?? false;

    if (selected) {
      setForm({
        ...form,
        roles:
          form.roles?.filter(
            r => r.id !== role.id
          ) ?? [],
      });
    } else {
      setForm({
        ...form,
        roles: [
          ...(form.roles ?? []),
          role,
        ],
      });
    }
  };
  const toggleActive = async (user: User) => {
    try {
      await updateUser(user.id, {
        phone: user.phone,
        full_name: user.full_name,
        active: !user.active,
        store_id: user.store_id,
        roles: user.roles.map(r => r.id),
      });

      await loadData();
    } catch {
      toast.error(
        "Impossible de modifier le statut"
      );
    }
  };

  const confirmDelete = async () => {
    if (!selectedUser) {
      return;
    }

    try {
      setIsDeleting(true);

      await deleteUser(selectedUser.id);

      await loadData();

      toast.success("Utilisateur supprimé");

      setDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error(error);

      toast.error(
        "Erreur lors de la suppression"
      );
    } finally {
      setIsDeleting(false);
    }
  };
  return (
    <AppShell title="Utilisateurs" module="users">
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);

          if (!open) {
            setSelectedUser(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirmer la suppression
            </AlertDialogTitle>

            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer
              l'utilisateur{" "}
              <strong>
                {selectedUser?.full_name}
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
        title="Gestion des utilisateurs"
        actions={<Button onClick={openNew}><Plus className="h-4 w-4 mr-1" />Nouvel utilisateur</Button>}
      />
      <Card><CardContent className="p-0 overflow-x-auto">
        {users.length === 0 ? <EmptyState title="Aucun utilisateur" /> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Téléphone</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Magasins</TableHead>
              <TableHead>Statut</TableHead><TableHead className="text-right w-32">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-mono">{u.phone}</TableCell>
                  <TableCell className="font-medium">{u.full_name}</TableCell>
                  <TableCell><Badge variant="secondary" className="capitalize"> {u.roles.length > 0 ? u.roles.map((role) => role.name).join(", ") : "Aucun rôle"}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {stores.find((store) => String(store.id) === String(u.store_id))?.name ?? "Aucun magasin"}
                  </TableCell>
                  <TableCell><Switch checked={u.active} onCheckedChange={() => toggleActive(u)} /></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(u)}><Pencil className="h-4 w-4" /></Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedUser(u);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit ? "Modifier" : "Nouvel"} utilisateur</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Téléphone</Label><Input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="space-y-2"><Label>Nom complet</Label><Input value={form.full_name ?? ""} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Mot de passe {edit && "(laisser vide = inchangé)"}</Label>
              <Input type="text" value={form.password ?? ""} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            <div className="col-span-2 space-y-2">
              <Label>Rôles</Label>
              <div className="flex flex-wrap gap-2">
                {roles.map((role) => {
                  const selected =
                    form.roles?.some((r) => r.id === role.id) ?? false;

                  return (
                    <Button
                      key={role.id}
                      type="button"
                      variant={selected ? "default" : "outline"}
                      onClick={() => toggleRole(role)}
                    >
                      {role.name}
                    </Button>
                  );
                })}
              </div>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Magasin</Label>
              <Select
                value={String(form.store_id) ?? ""}
                onValueChange={(value) =>
                  setForm({
                    ...form,
                    store_id: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un magasin" />
                </SelectTrigger>

                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem
                      key={store.id}
                      value={String(store.id)}
                    >
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button onClick={save}>Enregistrer</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
