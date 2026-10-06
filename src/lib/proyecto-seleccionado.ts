// Recuerda el último proyecto elegido en el combo (o "Todos los proyectos")
// para que Menciones, Sentimiento, Narrativas, etc. lo hereden al navegar
// entre páginas en vez de resetear siempre a "Todos" — solo cambia si el
// usuario vuelve a tocar el combo o entra a un proyecto específico desde
// Proyectos (URL con ?proyecto= explícito, que siempre gana sobre lo
// recordado). Es sólo una conveniencia de UI en este navegador — nunca se
// manda al backend ni afecta permisos, así que un fallo de localStorage
// (modo privado, cuota) simplemente no recuerda nada, no rompe la página.
const CLAVE_PROYECTO_SELECCIONADO = "unicornio:proyecto-seleccionado";

export function leerProyectoRecordado(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(CLAVE_PROYECTO_SELECCIONADO);
  } catch {
    return null;
  }
}

export function guardarProyectoRecordado(id: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (id) {
      window.localStorage.setItem(CLAVE_PROYECTO_SELECCIONADO, id);
    } else {
      window.localStorage.removeItem(CLAVE_PROYECTO_SELECCIONADO);
    }
  } catch {
    // No es crítico — el combo simplemente no recuerda la próxima vez.
  }
}
