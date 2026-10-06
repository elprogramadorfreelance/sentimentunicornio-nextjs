import { redirect } from "next/navigation";

type PropsPagina = {
  params: Promise<{ id: string }>;
};

/**
 * El detalle de un proyecto vive en /proyectos/[id] (dashboard real de ese
 * proyecto, ver vista-detalle-proyecto.tsx) — esta ruta solo existe por
 * compatibilidad con links viejos guardados. Ver "Mapeo de rutas" en
 * README.md: /dashboard sigue siendo el panel general, /proyectos el
 * listado; solo /proyectos/[id] cambió de ser un redirect a tener contenido real.
 */
export default async function ProyectoDetallePage({ params }: PropsPagina) {
  const { id } = await params;
  redirect(`/proyectos/${encodeURIComponent(id)}`);
}
