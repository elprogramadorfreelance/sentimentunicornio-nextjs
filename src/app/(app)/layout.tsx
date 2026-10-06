import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppSidebar, Topbar } from "@/components/layout";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProyectosActivosProvider } from "@/lib/hooks/use-proyectos-activos";
import { obtenerSesión } from "@/lib/session";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const sesión = await obtenerSesión();
  if (!sesión) redirect("/login");

  return (
    <TooltipProvider delayDuration={0}>
      <ProyectosActivosProvider>
        <SidebarProvider>
          <AppSidebar rol={sesión.role} />
          <SidebarInset className="h-svh overflow-hidden bg-bg-subtle">
            <Topbar usuario={sesión} />
            <main className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto scroll-smooth p-2 motion-reduce:scroll-auto sm:p-3 lg:p-3">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      </ProyectosActivosProvider>
    </TooltipProvider>
  );
}
