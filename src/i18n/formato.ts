import { localeBcp47 } from "./config";

export function formatearNumero(
  valor: number,
  locale: string,
  opciones?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(localeBcp47(locale), opciones).format(valor);
}

export function formatearFechaCorta(fecha: Date, locale: string): string {
  return fecha.toLocaleDateString(localeBcp47(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatearMesLargo(fecha: Date, locale: string): string {
  const nombre = fecha.toLocaleDateString(localeBcp47(locale), {
    month: "long",
  });
  return nombre.charAt(0).toUpperCase() + nombre.slice(1);
}
