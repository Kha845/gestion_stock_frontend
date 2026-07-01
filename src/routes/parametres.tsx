import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader, EmptyState } from "@/components/ui-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Shield } from "lucide-react";
import { toast } from "sonner";
import type { Role, Permission, User } from "@/lib/types";
import { ALL_MODULES, ALL_PERMISSIONS } from "@/lib/api/apiAuth";
import { createRole, deleteRole, getRoles, updateRole } from "@/lib/api/apiRole";
import {getUsers } from "@/lib/api/apiUser";
import {AlertDialog,AlertDialogAction,AlertDialogCancel,AlertDialogContent,AlertDialogDescription,AlertDialogFooter,AlertDialogHeader,AlertDialogTitle} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/parametres")({ component: Page });

type FormState = {
  name: string;
  description: string;
  permissions: Record<string, Permission[]>;
};

const emptyForm = (): FormState => ({ name: "", description: "", permissions: {} });

function Page() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Role | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

const loadData = async () => {
  try {
    const [rolesRes, usersRes] = await Promise.all([
      getRoles(),
      getUsers(),
    ]);

    setRoles(rolesRes.data);
    setUsers(usersRes.data);
  } catch (error) {
    console.error(error);
    toast.error("Impossible de charger les données");
  }
};


  const openNew = () => {
    setEdit(null);
    setForm(emptyForm());
    setOpen(true);
  };

  const openEdit = (r: Role) => {
    setEdit(r);
    setForm({ name: r.name, description: r.description ?? "", permissions: { ...r.permissions } });
    setOpen(true);
  };

  const togglePerm = (mod: string, p: Permission) => {
    setForm((f) => {
      const cur = f.permissions[mod] ?? [];
      const next = cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p];
      const perms = { ...f.permissions };
      if (next.length === 0) delete perms[mod];
      else perms[mod] = next;
      return { ...f, permissions: perms };
    });
  };

  const setAllForModule = (mod: string, all: boolean) => {
    setForm((f) => {
      const perms = { ...f.permissions };
      if (all) perms[mod] = [...ALL_PERMISSIONS];
      else delete perms[mod];
      return { ...f, permissions: perms };
    });
  };

 const save = async () => {
  if (!form.name.trim()) {
    return toast.error("Nom du rôle requis");
  }

  try {
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      permissions: form.permissions,
    };

    if (edit) {
      await updateRole(edit.id, payload);

      toast.success("Rôle modifié");
    } else {
      await createRole(payload);

      toast.success("Rôle créé");
    }

    await loadData();

    setOpen(false);
    setEdit(null);
    setForm(emptyForm());
  } catch (error: unknown) {
    console.error(error);

    toast.error(
      "Erreur lors de l'enregistrement"
    );
  }
};

const confirmDelete = async () => {
  if (!selectedRole) {
    return;
  }

  try {
    setIsDeleting(true);

    await deleteRole(selectedRole.id);

    await loadData();

    toast.success("Rôle supprimé");

    setDeleteDialogOpen(false);
    setSelectedRole(null);
  } catch (error) {
    console.error(error);

    toast.error("Erreur lors de la suppression");
  } finally {
    setIsDeleting(false);
  }
};

const countUsers = (roleId: string): number => {
  return users.filter((user) => {
    return user.roles.some(
      (role) => String(role.id) === String(roleId)
    );
  }).length;
};

  return (
    <AppShell title="Paramétrage" module="settings">
      <PageHeader
        title="Rôles & permissions"
        subtitle="Créez des rôles et attribuez des permissions précises (lecture, écriture, modification, suppression) par module."
        actions={
          <Button onClick={openNew}>
            <Plus className="h-4 w-4 mr-1" />Nouveau rôle
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />Rôles 
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {roles.length === 0 ? (
            <EmptyState
              title="Aucun rôle "
              description="Créez un rôle pour définir précisément ce que peuvent faire vos utilisateurs."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Modules</TableHead>
                  <TableHead className="text-center">Utilisateurs</TableHead>
                  <TableHead className="text-right w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                      {r.description ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {Object.keys(r.permissions).length === 0 ? (
                          <span className="text-xs text-muted-foreground">Aucun</span>
                        ) : (
                          Object.entries(r.permissions).map(([mod, perms]) => (
                            <Badge key={mod} variant="secondary" className="text-[10px]">
                              {ALL_MODULES.find((m) => m.key === mod)?.label ?? mod}: {perms.join(",")}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center tabular-nums">{countUsers(r.id)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(r)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedRole(r);
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
        </CardContent>
      </Card>
      <AlertDialog
      open={deleteDialogOpen}
      onOpenChange={(open) => {
        setDeleteDialogOpen(open);

        if (!open) {
          setSelectedRole(null);
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Confirmer la suppression
          </AlertDialogTitle>

          <AlertDialogDescription>
            Êtes-vous sûr de vouloir supprimer le rôle{" "}
            <strong>{selectedRole?.name}</strong> ?
            <br />
            Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
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
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[100vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{edit ? "Modifier" : "Nouveau"} rôle</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Nom du rôle</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Superviseur ventes"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optionnel"
              />
            </div>
          </div>

          <div className="space-y-2 mt-2">
            <Label>Permissions par module</Label>
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Module</TableHead>
                    {ALL_PERMISSIONS.map((p) => (
                      <TableHead key={p} className="text-center capitalize w-20">{p}</TableHead>
                    ))}
                    <TableHead className="text-center w-20">Tout</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ALL_MODULES.map((m) => {
                    const perms = form.permissions[m.key] ?? [];
                    const all = ALL_PERMISSIONS.every((p) => perms.includes(p));
                    return (
                      <TableRow key={m.key}>
                        <TableCell className="font-medium">{m.label}</TableCell>
                        {ALL_PERMISSIONS.map((p) => (
                          <TableCell key={p} className="text-center">
                            <Checkbox
                              checked={perms.includes(p)}
                              onCheckedChange={() => togglePerm(m.key, p)}
                            />
                          </TableCell>
                        ))}
                        <TableCell className="text-center">
                          <Checkbox
                            checked={all}
                            onCheckedChange={(v) => setAllForModule(m.key, !!v)}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={save}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
