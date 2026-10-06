import type { RespuestaDescargaReporte } from "@/app/api/reportes/descarga/route";

/** Tope de descargas agotado — el llamador lo distingue de un error real de red/backend. */
export class TopeDescargasError extends Error {
  tope: number;
  constructor(tope: number) {
    super("Se alcanzó el límite de descargas de reportes de este plan.");
    this.tope = tope;
  }
}

/**
 * Registra el intento contra el tope real del backend (plan Demo = 3
 * descargas, compartido entre Narrativas/Sentimiento/Proyectos/Benchmarking/
 * Análisis; ilimitado en planes pagados) ANTES de generar el PDF — mismo
 * patrón ya probado en exportar-resumen-infografia.ts. Si el backend no
 * responde, se deja generar (nunca bloquear al usuario por una falla de red
 * ajena a su plan).
 */
export async function registrarIntentoDescargaReporte(): Promise<RespuestaDescargaReporte> {
  try {
    const res = await fetch("/api/reportes/descarga", { method: "POST" });
    if (!res.ok) return { permitido: true, restantes: null, tope: null };
    return (await res.json()) as RespuestaDescargaReporte;
  } catch {
    return { permitido: true, restantes: null, tope: null };
  }
}
