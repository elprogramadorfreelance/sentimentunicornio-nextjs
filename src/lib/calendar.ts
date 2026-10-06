/** Utilidades de fecha para el calendario (zona local, sin UTC drift). */

export function aIsoFecha(fecha: Date): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function desdeIsoFecha(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function esMismaFecha(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function agregarDías(fecha: Date, días: number): Date {
  const copia = new Date(
    fecha.getFullYear(),
    fecha.getMonth(),
    fecha.getDate(),
  );
  copia.setDate(copia.getDate() + días);
  return copia;
}

export function inicioDelDía(fecha: Date): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

export function compararFechas(a: Date, b: Date): number {
  return inicioDelDía(a).getTime() - inicioDelDía(b).getTime();
}

export function estáEnRango(fecha: Date, inicio: Date, fin: Date): boolean {
  const t = inicioDelDía(fecha).getTime();
  const i = inicioDelDía(inicio).getTime();
  const f = inicioDelDía(fin).getTime();
  return t >= Math.min(i, f) && t <= Math.max(i, f);
}

export function normalizarRango(a: Date, b: Date): { inicio: Date; fin: Date } {
  return compararFechas(a, b) <= 0
    ? { inicio: inicioDelDía(a), fin: inicioDelDía(b) }
    : { inicio: inicioDelDía(b), fin: inicioDelDía(a) };
}

export const MESES_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;

export const DIAS_SEMANA = [
  "LUN",
  "MAR",
  "MIE",
  "JUE",
  "VIE",
  "SÁB",
  "DOM",
] as const;

/** Lunes = 0 … Domingo = 6 */
export function díaSemanaLunes(fecha: Date): number {
  return (fecha.getDay() + 6) % 7;
}

export type CeldaCalendario = {
  fecha: Date;
  iso: string;
  numero: number;
  esDelMes: boolean;
  esHoy: boolean;
  esFuturo: boolean;
  /** true si `fecha` cae antes de `fechaMínima` (pedido del cliente,
   * 2026-10-01: cuentas Demo solo ven los últimos N días — el calendario
   * debe bloquear visualmente los días más viejos, no solo recortar la
   * selección después de hecha). `fechaMínima` es opcional y por default
   * nadie queda "muy antiguo". */
  esMuyAntiguo: boolean;
};

function esAntes(fecha: Date, fechaMínima: Date | undefined): boolean {
  return fechaMínima != null && fecha.getTime() < inicioDelDía(fechaMínima).getTime();
}

/** Genera celdas consecutivas de un rango inclusivo (p. ej. 7 días en mobile). */
export function generarCeldasRango(
  inicio: Date,
  fin: Date,
  hoy: Date = new Date(),
  fechaMínima?: Date,
): CeldaCalendario[] {
  const { inicio: i, fin: f } = normalizarRango(inicio, fin);
  const celdas: CeldaCalendario[] = [];
  let cursor = inicioDelDía(i);
  const límite = inicioDelDía(f);

  const hoyInicio = inicioDelDía(hoy).getTime();
  while (cursor.getTime() <= límite.getTime()) {
    celdas.push({
      fecha: cursor,
      iso: aIsoFecha(cursor),
      numero: cursor.getDate(),
      esDelMes: true,
      esHoy: esMismaFecha(cursor, hoy),
      esFuturo: cursor.getTime() > hoyInicio,
      esMuyAntiguo: esAntes(cursor, fechaMínima),
    });
    cursor = agregarDías(cursor, 1);
  }

  return celdas;
}

export function generarCeldasMes(
  año: number,
  mes: number,
  hoy: Date = new Date(),
  fechaMínima?: Date,
): CeldaCalendario[] {
  const primerDía = new Date(año, mes, 1);
  const totalDías = new Date(año, mes + 1, 0).getDate();
  const totalMesAnterior = new Date(año, mes, 0).getDate();
  const offset = díaSemanaLunes(primerDía);

  const celdas: CeldaCalendario[] = [];
  const hoyInicio = inicioDelDía(hoy).getTime();

  for (let i = offset - 1; i >= 0; i--) {
    const fecha = new Date(año, mes - 1, totalMesAnterior - i);
    celdas.push({
      fecha,
      iso: aIsoFecha(fecha),
      numero: totalMesAnterior - i,
      esDelMes: false,
      esHoy: esMismaFecha(fecha, hoy),
      esFuturo: fecha.getTime() > hoyInicio,
      esMuyAntiguo: esAntes(fecha, fechaMínima),
    });
  }

  for (let d = 1; d <= totalDías; d++) {
    const fecha = new Date(año, mes, d);
    celdas.push({
      fecha,
      iso: aIsoFecha(fecha),
      numero: d,
      esDelMes: true,
      esHoy: esMismaFecha(fecha, hoy),
      esFuturo: fecha.getTime() > hoyInicio,
      esMuyAntiguo: esAntes(fecha, fechaMínima),
    });
  }

  // Solo se rellena hasta completar la última semana empezada (múltiplo de 7)
  // — nunca se fuerza un mínimo de 35: eso agregaba una sexta fila completa
  // de puro relleno en meses que ya cerraban en 4-5 filas reales.
  let siguiente = 1;
  while (celdas.length % 7 !== 0) {
    const fecha = new Date(año, mes + 1, siguiente);
    celdas.push({
      fecha,
      iso: aIsoFecha(fecha),
      numero: siguiente++,
      esDelMes: false,
      esHoy: esMismaFecha(fecha, hoy),
      esFuturo: fecha.getTime() > hoyInicio,
      esMuyAntiguo: esAntes(fecha, fechaMínima),
    });
    if (celdas.length >= 42) break;
  }

  return celdas;
}

export const PRESETS_PERIODO = [
  "hoy",
  "ayer",
  "ultimos_7",
  "ultimos_14",
  "ultimos_30",
  "hace_3_meses",
  "ano_pasado",
] as const;

export type PresetPeriodo = (typeof PRESETS_PERIODO)[number];

export type RangoLocal = {
  inicio: Date;
  fin: Date;
};

export function aRangoIso(rango: RangoLocal): {
  inicio: string;
  fin: string;
} {
  return { inicio: aIsoFecha(rango.inicio), fin: aIsoFecha(rango.fin) };
}

export function desdeRangoIso(inicio: string, fin: string): RangoLocal {
  return { inicio: desdeIsoFecha(inicio), fin: desdeIsoFecha(fin) };
}

export function diasEnRango(inicio: Date, fin: Date): number {
  return (
    Math.round(
      (inicioDelDía(fin).getTime() - inicioDelDía(inicio).getTime()) /
        (24 * 60 * 60 * 1000),
    ) + 1
  );
}

export function rangoDesdePreset(
  preset: PresetPeriodo,
  hoy = inicioDelDía(new Date()),
): RangoLocal {
  switch (preset) {
    case "hoy":
      return { inicio: hoy, fin: hoy };
    case "ayer": {
      const ayer = agregarDías(hoy, -1);
      return { inicio: ayer, fin: ayer };
    }
    case "ultimos_7":
      return { inicio: agregarDías(hoy, -6), fin: hoy };
    case "ultimos_14":
      return { inicio: agregarDías(hoy, -13), fin: hoy };
    case "ultimos_30":
      return { inicio: agregarDías(hoy, -29), fin: hoy };
    case "hace_3_meses":
      return {
        inicio: inicioDelDía(
          new Date(hoy.getFullYear(), hoy.getMonth() - 3, hoy.getDate()),
        ),
        fin: hoy,
      };
    case "ano_pasado": {
      const año = hoy.getFullYear() - 1;
      return {
        inicio: new Date(año, 0, 1),
        fin: new Date(año, 11, 31),
      };
    }
  }
}

export function presetDesdeRango(
  rango: RangoLocal,
  hoy = inicioDelDía(new Date()),
): PresetPeriodo | null {
  for (const preset of PRESETS_PERIODO) {
    const candidato = rangoDesdePreset(preset, hoy);
    if (
      esMismaFecha(rango.inicio, candidato.inicio) &&
      esMismaFecha(rango.fin, candidato.fin)
    ) {
      return preset;
    }
  }
  return null;
}

export function rangoPeriodoPorDefecto(): RangoLocal {
  return rangoDesdePreset("ultimos_7");
}
