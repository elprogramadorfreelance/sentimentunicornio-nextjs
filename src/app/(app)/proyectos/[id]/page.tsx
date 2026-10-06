"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { DashboardGeneralSkeleton } from "@/components/dashboard-general";
import { useProyectosActivos } from "@/lib/hooks/use-proyectos-activos";

/**
 * "Ver proyecto" en la tarjeta de /dashboard llegaba aquí y renderizaba
 * VistaDetalleProyecto (DashboardVista) — un panel más viejo y con menos
 * widgets que /proyectos (DashboardGeneralVista), la vista real que se
 * obtiene navegando desde la barra lateral. Dos dashboards distintos para
 * "ver un proyecto" es exactamente lo que rompía la paridad — en vez de
 * mantener ambos sincronizados, esta ruta ahora solo selecciona el proyecto
 * en el contexto compartido (lo mismo que hace el selector de la barra
 * lateral) y manda al panel real único. /dashboard/[id] (ruta vieja) ya
 * redirigía aquí, así que ese camino también queda arreglado.
 */
export default function ProyectoDetalleRedireccion() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { setSeleccion, hidratado } = useProyectosActivos();
  const yaRedirigido = useRef(false);

  useEffect(() => {
    if (!hidratado || yaRedirigido.current) return;
    yaRedirigido.current = true;
    setSeleccion([id], false);
    router.replace("/proyectos");
  }, [hidratado, id, router, setSeleccion]);

  return <DashboardGeneralSkeleton />;
}
