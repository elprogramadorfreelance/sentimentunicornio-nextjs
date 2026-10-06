## ⚠️ Mapeo de rutas: Dashboard vs Proyectos

Este punto se ha volteado 7 veces en el historial del proyecto (11-ago, 19-ago, 31-ago, 01-sep, 08-sep, 14-sep intento fallido, 14-sep decisión final). **Esta sección es la fuente de verdad — verifícala antes de tocar `dashboard/page.tsx` o `proyectos/page.tsx`.**

**Decisión del 14-sep-2026 (vigente, definitiva salvo instrucción explícita en contra):** el dueño del producto pidió alinear esto EXACTAMENTE con la referencia de Bruno — revocó explícitamente la decisión de divergencia del 08-sep-2026 ("olvida la decisión del 8 de septiembre, hazlo igual que lo que tiene Bruno"). Ya NO hay divergencia intencional en este punto.

- `app/(app)/dashboard/page.tsx` → renderiza `VistaProyectos` (tarjetas para crear/administrar proyectos, con saludo animado `ShinyText` y disclaimer de data histórica) — pantalla de inicio.
- `app/(app)/proyectos/page.tsx` → renderiza `DashboardGeneralVista` (panel de métricas/widgets agregados, filtrable por el selector multi-proyecto del sidebar — ver más abajo).
- `app/(app)/proyectos/[id]/page.tsx` → **contenido real** desde el 14-sep-2026 (`VistaDetalleProyecto`/`DashboardVista`: dashboard de ESE proyecto específico, layout `.dashboard-bento`, no el panel agregado filtrado). Se enlaza desde el botón "Ver proyecto" de cada tarjeta en `tarjeta-proyecto.tsx`. Esta ruta NO cambió de sentido con el swap de arriba — sigue siendo el detalle de un proyecto específico, no el listado.
- `app/(app)/dashboard/[id]/page.tsx` → redirige a `/proyectos/[id]` (no se enlaza desde la app; solo por compatibilidad con links viejos guardados a la ruta anterior).

**Historial breve:** 01-sep a 08-sep era `/dashboard`=lista / `/proyectos`=panel (igual que ahora). El 08-sep se volteó a propósito para divergir de Bruno (`/dashboard`=panel / `/proyectos`=lista). El 14-sep, un drop de referencia (`sentiment-unicornio-main-14-09-2026`) trajo el mapeo de Bruno otra vez con `/dashboard`=lista — se empezó a aplicar el swap, se revirtió al pensar que la decisión del 08-sep seguía vigente, y minutos después el dueño del producto confirmó explícitamente que ya no: quiere paridad total con Bruno en este punto. Si aparece un 8vo intento de voltear esto, no asumir — confirmar con el dueño del producto cuál decisión manda.

El drop `sentiment-unicornio-main-14-09-2026` también trajo dos cosas más que el dueño del producto sí pidió, por separado:
- **Selector multi-proyecto** (`lib/hooks/use-proyectos-activos.tsx` + `components/layout/selector-proyectos-sidebar.tsx`, montado en `app/(app)/layout.tsx` vía `ProyectosActivosProvider`): reemplaza el dropdown de un solo proyecto que vivía en `ResumenGeneralWidget` — ahora la selección de proyecto(s) para `DashboardGeneralVista` se hace desde el sidebar, con multi-selección real. El backend (`sentiment-api`) no tiene un endpoint para "menciones de N proyectos específicos" — `app/api/proyectos/panel/route.ts` lo resuelve trayendo todas las menciones/alertas (`/api/all-mentions`, `/api/all-alerts`) y filtrando en el propio route handler cuando hay 2+ proyectos seleccionados (no todos). El NSS-por-tema real no soporta esto todavía — se deja vacío en ese caso en vez de mostrar el de todos los proyectos. **Ojo:** esto solo se conectó en el panel agregado (`dashboard-general-vista.tsx`) — Menciones, Alertas, Narrativas, Sentimiento, Benchmarking, Búsqueda e Infografía siguen con el mecanismo viejo de un solo proyecto recordado (`lib/proyecto-seleccionado.ts`), no se tocaron.
- **Página de detalle de proyecto** (`components/dashboard/dashboard-vista.tsx` + widgets `sentimiento-widget.tsx`/`alcance-potencial-widget.tsx`/`proyecto-actual-widget.tsx`): ver arriba, ahora vive en `/proyectos/[id]`.

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
