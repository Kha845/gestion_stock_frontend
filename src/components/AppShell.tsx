import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "./AuthProvider";


import {
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";

import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { ALL_MODULES, hasPermission } from "@/lib/api/apiAuth";

type ModuleKey = (typeof ALL_MODULES)[number]["key"];

export function AppShell({
  children,
  title,
  module,
}: {
  children: ReactNode;
  title: string;
  module?: ModuleKey;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate({ to: "/login" });
      return;
    }

    if (
      module &&
      !hasPermission(user, module, "read")
    ) {
      navigate({ to: "/" });
    }
  }, [user, module, navigate]);

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />

        <SidebarInset className="flex flex-col min-w-0">
          <AppHeader title={title} />

          <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-x-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}