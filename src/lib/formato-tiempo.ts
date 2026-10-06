/** Tiempo relativo corto para listas (notificaciones, feeds). */
export function formatoTiempoRelativo(
  iso: string,
  textos: {
    now: string;
    minutes: (count: number) => string;
    hours: (count: number) => string;
    yesterday: string;
    days: (count: number) => string;
  },
  localeBcp47: string,
  ahora: Date = new Date(),
): string {
  const fecha = new Date(iso);
  const diffMs = Math.max(0, ahora.getTime() - fecha.getTime());
  const minutos = Math.floor(diffMs / 60_000);
  if (minutos < 1) return textos.now;
  if (minutos < 60) return textos.minutes(minutos);
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return textos.hours(horas);
  const días = Math.floor(horas / 24);
  if (días === 1) return textos.yesterday;
  if (días < 7) return textos.days(días);
  return fecha.toLocaleDateString(localeBcp47, {
    day: "numeric",
    month: "short",
  });
}
