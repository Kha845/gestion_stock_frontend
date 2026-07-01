import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard, Package, Tags, Warehouse, ArrowLeftRight, ShoppingCart,
  Truck, Users, Building2, CreditCard, Wallet, ClipboardList, BarChart3,
  UserCog, Store as StoreIcon, LogOut, ChevronRight,
  Boxes, Briefcase, Landmark, Shield, FileText, Settings,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub,
  SidebarMenuSubButton, SidebarMenuSubItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "./AuthProvider";
import { cn } from "@/lib/utils";
import { hasPermission } from "@/lib/api/apiAuth";

type Item = { key: string; label: string; to: string; icon: any };
type Group = { key: string; label: string; icon: any; items: Item[] };

const GROUPS: Group[] = [
  {
    key: "general", label: "Général", icon: LayoutDashboard, items: [
      { key: "dashboard", label: "Tableau de bord", to: "/", icon: LayoutDashboard },
    ],
  },
  {
    key: "catalogue", label: "Catalogue", icon: Boxes, items: [
      { key: "categories", label: "Catégories", to: "/categories", icon: Tags },
      { key: "products", label: "Produits", to: "/produits", icon: Package },
    ],
  },
  {
    key: "stock", label: "Stock", icon: Warehouse, items: [
      { key: "stock", label: "Stock", to: "/stock", icon: Warehouse },
      { key: "transfers", label: "Transferts", to: "/transferts", icon: ArrowLeftRight },
      { key: "inventory", label: "Inventaire", to: "/inventaire", icon: ClipboardList },
    ],
  },
  {
    key: "commerce", label: "Commerce", icon: Briefcase, items: [
      { key: "customers", label: "Clients", to: "/clients", icon: Users },
      { key: "suppliers", label: "Fournisseurs", to: "/fournisseurs", icon: Building2 },
      { key: "sales", label: "Ventes", to: "/ventes", icon: ShoppingCart },
      { key: "purchases", label: "Achats", to: "/achats", icon: Truck },
      { key: "supplier_invoices", label: "Factures fourn.", to: "/factures-fournisseurs", icon: FileText },
    ],
  },
  {
    key: "finance", label: "Finance", icon: Landmark, items: [
      { key: "debts", label: "Dettes", to: "/dettes", icon: CreditCard },
      { key: "cash", label: "Caisse", to: "/caisse", icon: Wallet },
      { key: "reports", label: "Rapports", to: "/rapports", icon: BarChart3 },
    ],
  },
  {
    key: "admin", label: "Administration", icon: Shield, items: [
      { key: "users", label: "Utilisateurs", to: "/utilisateurs", icon: UserCog },
      { key: "stores", label: "Magasins", to: "/magasins", icon: StoreIcon },
      { key: "settings", label: "Paramétrage", to: "/parametres", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

 const allowedGroups = user
  ? GROUPS.map((g) => ({
      ...g,
      items: g.items.filter((it) =>
        hasPermission(user, it.key, "read")
      ),
    })).filter((g) => g.items.length > 0)
  : [];

  const initialOpen: Record<string, boolean> = {};
  allowedGroups.forEach((g) => {
    initialOpen[g.key] = g.items.some((it) => location.pathname === it.to);
  });
  const [open, setOpen] = useState<Record<string, boolean>>(initialOpen);

  if (!user) return null;

 const roleNames = user.roles.length
  ? user.roles.map((role) => role.name).join(", ")
  : "Aucun rôle";
  
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground font-bold">
            E
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">ERP Multi-Magasin</span>
              <span className="text-xs text-sidebar-foreground/60">Gestion commerciale</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {allowedGroups.map((g) => {
                // If single item group, render as flat link
                if (g.items.length === 1) {
                  const it = g.items[0];
                  const active = location.pathname === it.to;
                  return (
                    <SidebarMenuItem key={g.key}>
                      <SidebarMenuButton asChild isActive={active} tooltip={it.label}>
                        <Link to={it.to} className={cn(active && "font-medium")}>
                          <it.icon className="h-4 w-4" />
                          <span>{it.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                const isOpen = !!open[g.key];
                const hasActive = g.items.some((it) => location.pathname === it.to);
                return (
                  <Collapsible
                    key={g.key}
                    open={isOpen}
                    onOpenChange={(v) => setOpen((o) => ({ ...o, [g.key]: v }))}
                    asChild
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={g.label} isActive={hasActive && !isOpen}>
                          <g.icon className="h-4 w-4" />
                          <span>{g.label}</span>
                          <ChevronRight className={cn("ml-auto h-4 w-4 transition-transform", isOpen && "rotate-90")} />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {g.items.map((it) => {
                            const active = location.pathname === it.to;
                            return (
                              <SidebarMenuSubItem key={it.key}>
                                <SidebarMenuSubButton asChild isActive={active}>
                                  <Link to={it.to} className={cn(active && "font-medium")}>
                                    <it.icon className="h-4 w-4" />
                                    <span>{it.label}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <div className={cn("flex items-center gap-2 px-2 py-2", collapsed && "justify-center")}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground text-xs font-semibold">
            {user.full_name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-sm text-sidebar-foreground truncate">{user.full_name}</div>
             <div className="text-xs text-sidebar-foreground/60 capitalize">
              {roleNames}
            </div>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={() => { logout(); navigate({ to: "/login" }); }}
              className="rounded-md p-1.5 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              title="Déconnexion"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
