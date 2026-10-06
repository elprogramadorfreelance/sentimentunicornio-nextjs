// En desarrollo apunta a /api (Route Handlers mock de este repo).
// En producción apunta al backend real vía NEXT_PUBLIC_API_URL.
// El backend conecta cambiando solo esta variable — sin tocar componentes.
export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";
