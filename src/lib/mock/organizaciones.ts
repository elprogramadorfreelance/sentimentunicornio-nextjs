import type { Organizacion } from "@/types";

/** Orgs del usuario autenticado — mock multitenant hasta conectar backend. */
export const ORGANIZACIONES_MOCK: readonly Organizacion[] = [
  {
    id: "org_mundo_ejecutivo",
    nombre: "Mundo Ejecutivo",
    slug: "mundo-ejecutivo",
  },
  {
    id: "org_global_media",
    nombre: "Global Media",
    slug: "global-media",
  },
  {
    id: "org_pulso_publico",
    nombre: "Pulso Público",
    slug: "pulso-publico",
  },
  {
    id: "org_norte_digital",
    nombre: "Norte Digital",
    slug: "norte-digital",
  },
] as const;

export const ORG_STORAGE_KEY = "unicornio:organizacion-id";

export function obtenerOrganizacionesMock(): Organizacion[] {
  return [...ORGANIZACIONES_MOCK];
}

export function obtenerOrganizacionPorId(id: string): Organizacion | undefined {
  return ORGANIZACIONES_MOCK.find((org) => org.id === id);
}
