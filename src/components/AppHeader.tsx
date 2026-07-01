import { useNavigate } from "@tanstack/react-router";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "./AuthProvider";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useEffect, useMemo } from "react";

export function AppHeader({ title }: { title: string }) {

  const { user, logout , stores, storeId, setStoreId, refreshStores} = useAuth();
  
  const navigate = useNavigate();

  useEffect(()=>{

    refreshStores();

  },[])

  if (!user) return null;

  const isAdmin = user.roles?.some((role) => role.name === "Administrateur") ?? false

  const visibleStores = useMemo(() => {
    if (isAdmin) {
      return stores;
    }

    if (storeId) {
      return stores.filter(
        (s) => String(s.id) === storeId
      );
    }

    return [];
  }, [isAdmin, stores, storeId]);

  return (
    <header className="h-14 flex items-center gap-3 border-b bg-card px-3 sm:px-4 sticky top-0 z-10">
      <SidebarTrigger />
      <h1 className="text-base sm:text-lg font-semibold truncate flex-1">{title}</h1>
      <div className="hidden sm:block">
      {visibleStores.length > 0 && (
        <div className="hidden sm:block">
          <Select
            value={storeId ?? undefined}
            onValueChange={(value) => setStoreId(value)}
          >
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Magasin" />
            </SelectTrigger>

            <SelectContent>
              {visibleStores.map((store) => (
                <SelectItem key={store.id} value={store.id.toString()}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      </div>
      <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => { logout(); navigate({ to: "/login" }); }}>
        <LogOut className="h-4 w-4" />
      </Button>
    </header>
  );
}
