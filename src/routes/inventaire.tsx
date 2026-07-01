import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader, EmptyState } from "@/components/ui-helpers";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Check } from "lucide-react";
import { toast } from "sonner";
import { InventorySession, Product } from "@/lib/types";
import { createInventory, getInventories, updateInventory, validateInventory } from "@/lib/api/apiInventor";
import { getProducts } from "@/lib/api/apiProduct";
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog";

export const Route = createFileRoute("/inventaire")({ component: Page });

function Page() {
  const { storeId, stores } = useAuth();
  const [inventories, setInventories] = useState<InventorySession[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [viewOpen, setViewOpen] = useState(false)
  const [selectedInventory, setSelectedInventory] = useState<any>(null);

  const handleViewInventory = (inventory: InventorySession) => {
    setSelectedInventory(inventory);
    setViewOpen(true);
  };

  useEffect(() => {
  if (storeId) {
    loadData();
  }
}, [storeId]);

  const loadData = async () => {
    try {
      const [
        inventoriesRes,
        productsRes,
      ] = await Promise.all([
        getInventories(),
        getProducts(storeId),
      ]);

      setInventories(
        inventoriesRes.data
      );

      setProducts(
        productsRes.data
      );
    } catch (error) {
      console.error(error);

      toast.error(
        "Erreur lors du chargement"
      );
    }
  };

  const startNew = async () => {

    if (!storeId) {
      toast.error(
        "Sélectionnez un magasin"
      );
      return;
    }

    try {
      const inventory = {
        store_id: Number(storeId),
        date: new Date()
          .toISOString()
          .slice(0, 10),

        lines: products.map(
          (product) => ({
            product_id: product.id,
            physical:
              product.stock ?? 0,
          })
        ),
      };

      products.forEach((p) => {
        console.log(
          p.name,
          p.stock
        );
      });

      const response =
        await createInventory(
          inventory
        );

      setEditing(
        response.data
      );

      toast.success(
        "Inventaire créé"
      );

      await loadData();
    } catch (error) {
      console.error(error);

      toast.error(
        "Erreur lors de la création"
      );
    }
  };

  const updateLine = (
    idx: number,
    value: number
  ) => {
    setEditing((prev: any) => {
      const copy = {
        ...prev,
      };

      copy.lines = [
        ...copy.lines,
      ];

      copy.lines[idx] = {
        ...copy.lines[idx],
        physical: value,
      };

      return copy;
    });
  };

  const handleValidate =
  async () => {

    if (!editing) return;

    try {

      setLoading(true);

      // Sauvegarde des nouvelles valeurs physiques

      await updateInventory(
        editing.id,
        {
          lines: editing.lines.map(
            (line: any) => ({
              id: line.id,
              physical:
                Number(
                  line.physical
                ),
            })
          ),
        }
      );

      // Validation

      await validateInventory(
        editing.id
      );

      toast.success(
        "Inventaire validé"
      );

      setEditing(null);

      await loadData();

    } catch (error) {

      console.error(error);

      toast.error(
        "Erreur lors de la validation"
      );

    } finally {

      setLoading(false);

    }
  };

  return (
    <AppShell title="Inventaire" module="inventory">
      <PageHeader
        title="Inventaire physique"
        subtitle="Comparer stock réel vs théorique"
        actions={!editing && <Button onClick={startNew}><Plus className="h-4 w-4 mr-1" />Nouvel inventaire</Button>}
      />
      {editing ? (
        <Card><CardContent className="p-0 overflow-x-auto">
          <div className="p-3 flex justify-between items-center border-b">
            <div className="text-sm">Magasin: <strong>{stores.find((s) => s.id === editing.store_id)?.name}</strong></div>
            <Button onClick={handleValidate} className="bg-success text-success-foreground hover:bg-success/90"><Check className="h-4 w-4 mr-1" />Valider</Button>
          </div>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Produit</TableHead>
              <TableHead className="text-right">Théorique</TableHead>
              <TableHead className="text-right">Physique</TableHead>
              <TableHead className="text-right">Écart</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {editing.lines.map((l: any, idx: any) => {
                const p = products.find((x) => x.id === l.product_id);
                const ecart = l.physical - l.theoretical;
                return (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{p?.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{Number(l.theoretical)}</TableCell>
                    <TableCell className="text-right">
                      <Input type="number" className="w-24 ml-auto" value={Number(l.physical)} onChange={(e) => updateLine(idx, Number(e.target.value))} />
                    </TableCell>
                    <TableCell className={`text-right tabular-nums font-medium ${ecart < 0 ? "text-destructive" : ecart > 0 ? "text-success" : ""}`}>
                      {ecart > 0 ? "+" : ""}{ecart}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent></Card>
      ) : (
        <Card><CardContent className="p-0 overflow-x-auto">
          {inventories.length === 0 ? <EmptyState title="Aucun inventaire" /> : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Date</TableHead><TableHead>Magasin</TableHead>
                <TableHead>Lignes</TableHead><TableHead>État</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {inventories.slice().reverse().map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="text-xs">{new Date(i.date).toLocaleDateString("fr-FR")}</TableCell>
                    <TableCell>{stores.find((s) => s.id === i.store_id)?.name}</TableCell>
                    <TableCell>{i.lines.length}</TableCell>
                   <TableCell>
                      <Badge
                        className={
                          i.status === "validé"
                            ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-100"
                            : "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100"
                        }
                      >
                        {i.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleViewInventory(i)
                          }
                        >
                          Voir
                        </Button>

                        {i.status === "brouillon" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setEditing(i)
                            }
                          >
                            Reprendre
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <Dialog
            open={viewOpen}
            onOpenChange={setViewOpen}
          >
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>
                  Détails inventaire
                </DialogTitle>
              </DialogHeader>

              {selectedInventory && (
                <>
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <strong>Date :</strong>{" "}
                      {new Date(
                        selectedInventory.date
                      ).toLocaleDateString("fr-FR")}
                    </div>

                    <div>
                      <strong>Magasin :</strong>{" "}
                      {
                        stores.find(
                          (s) =>
                            s.id ===
                            selectedInventory.store_id
                        )?.name
                      }
                    </div>

                    <div>
                      <strong>Statut :</strong>{" "}
                      {selectedInventory.status}
                    </div>

                    <div>
                      <strong>Produits :</strong>{" "}
                      {
                        selectedInventory.lines
                          ?.length
                      }
                    </div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          Produit
                        </TableHead>

                        <TableHead className="text-right">
                          Théorique
                        </TableHead>

                        <TableHead className="text-right">
                          Physique
                        </TableHead>

                        <TableHead className="text-right">
                          Écart
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {selectedInventory.lines?.map(
                        (line: any) => {
                          const ecart =
                            Number(
                              line.physical
                            ) -
                            Number(
                              line.theoretical
                            );

                          return (
                            <TableRow
                              key={line.id}
                            >
                              <TableCell>
                                {line.product
                                  ?.name ??
                                  "Produit"}
                              </TableCell>

                              <TableCell className="text-right">
                                {
                                 Number(line.theoretical) 
                                }
                              </TableCell>

                              <TableCell className="text-right">
                                { Number(line.physical) }
                              </TableCell>

                              <TableCell
                                className={`text-right font-medium ${ecart < 0
                                    ? "text-destructive"
                                    : ecart > 0
                                      ? "text-green-600"
                                      : ""
                                  }`}
                              >
                                {ecart > 0
                                  ? "+"
                                  : ""}
                                {ecart}
                              </TableCell>
                            </TableRow>
                          );
                        }
                      )}
                    </TableBody>
                  </Table>
                </>
              )}
            </DialogContent>
          </Dialog>
        </CardContent></Card>
      )}
    </AppShell>
  );
}
