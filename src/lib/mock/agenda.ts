import { agregarDías, aIsoFecha } from "@/lib/calendar";
import type { EventoAgenda, TipoEventoAgenda } from "@/types";

/** Etiquetas y clases de color fijas por tipo de evento. */
export const META_TIPO_EVENTO: Record<
  TipoEventoAgenda,
  { etiqueta: string; punto: string; texto: string }
> = {
  campaña: {
    etiqueta: "Campaña",
    punto: "bg-primary",
    texto: "text-primary",
  },
  cita: {
    etiqueta: "Cita",
    punto: "bg-sky",
    texto: "text-sky",
  },
  evento: {
    etiqueta: "Evento",
    punto: "bg-accent",
    texto: "text-accent",
  },
};

function evento(
  id: string,
  título: string,
  tipo: TipoEventoAgenda,
  fecha: Date,
): EventoAgenda {
  return { id, título, tipo, fecha: aIsoFecha(fecha) };
}

/** Mock anclado a “hoy” para que siempre haya puntos visibles en el mes actual. */
export function obtenerEventosAgendaMock(
  hoy: Date = new Date(),
): EventoAgenda[] {
  return [
    evento("ev-1", "Briefing de campaña Q3", "campaña", agregarDías(hoy, 2)),
    evento("ev-2", "Revisión creativos", "campaña", agregarDías(hoy, 5)),
    evento("ev-3", "Call con stakeholders", "cita", agregarDías(hoy, 1)),
    evento("ev-4", "Entrevista media", "cita", agregarDías(hoy, -3)),
    evento("ev-5", "Lanzamiento producto", "evento", agregarDías(hoy, 4)),
    evento("ev-6", "Webinar sentimiento", "evento", agregarDías(hoy, 9)),
    evento("ev-7", "Activación outdoor", "campaña", agregarDías(hoy, -8)),
  ];
}
