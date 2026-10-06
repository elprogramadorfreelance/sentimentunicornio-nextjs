import type { RangoFechas } from "@/types";

// Mismo espíritu que proyecto-seleccionado.ts: recuerda el último rango de
// fechas elegido en el calendario (Dashboard o Menciones) para que la otra
// página lo herede al navegar, en vez de resetear siempre al rango por
// defecto de cada una. Solo cambia si el usuario vuelve a elegir un rango.
const CLAVE_RANGO_SELECCIONADO = "unicornio:rango-calendario-seleccionado";

export function leerRangoRecordado(): RangoFechas | null {
  if (typeof window === "undefined") return null;
  try {
    const crudo = window.localStorage.getItem(CLAVE_RANGO_SELECCIONADO);
    if (!crudo) return null;
    const datos = JSON.parse(crudo);
    if (typeof datos?.inicio === "string" && typeof datos?.fin === "string") {
      return { inicio: datos.inicio, fin: datos.fin };
    }
    return null;
  } catch {
    return null;
  }
}

export function guardarRangoRecordado(rango: RangoFechas | null): void {
  if (typeof window === "undefined") return;
  try {
    if (rango) {
      window.localStorage.setItem(CLAVE_RANGO_SELECCIONADO, JSON.stringify(rango));
    } else {
      window.localStorage.removeItem(CLAVE_RANGO_SELECCIONADO);
    }
  } catch {
    // No es crítico — el calendario simplemente no recuerda la próxima vez.
  }
}
