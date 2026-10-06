// Panorama → Infografía: resumen visual para compartir, armado por completo a
// partir de funciones reales que ya usan /proyectos y /menciones — sin
// endpoints nuevos en sentiment-api ni datos inventados.
import {
  calcularFuentesConCambio,
  calcularRegionesPresencia,
  calcularSentimientoPorcentual,
  calcularTopEmisores,
  cambioPorcentual,
  estimarAlcance,
  VOLUMEN_MINIMO_CAMBIO,
} from "@/lib/menciones-backend";
import type { MenciónEditorial, ResumenInfografia } from "@/types";

const MS_DÍA = 86_400_000;

function inicioDeDía(fecha: Date): number {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()).getTime();
}

const MÁXIMO_POPULARES = 8;

export function construirResumenInfografia(
  menciones: MenciónEditorial[],
  diasPeriodo: number,
  proyectoId: string | null,
  nombreProyecto: string,
  regiónPorProyecto: Map<string, string>,
): ResumenInfografia {
  const hoy = inicioDeDía(new Date());
  const inicioActual = hoy - (diasPeriodo - 1) * MS_DÍA;
  const inicioAnterior = inicioActual - diasPeriodo * MS_DÍA;

  const actuales: MenciónEditorial[] = [];
  const anteriores: MenciónEditorial[] = [];
  for (const m of menciones) {
    const t = inicioDeDía(new Date(m.publicadaEn));
    if (t >= inicioActual && t <= hoy) actuales.push(m);
    else if (t >= inicioAnterior && t < inicioActual) anteriores.push(m);
  }

  const alcanceActual = actuales.reduce((s, m) => s + estimarAlcance(m), 0);
  const alcanceAnterior = anteriores.reduce((s, m) => s + estimarAlcance(m), 0);

  return {
    proyectoId,
    nombreProyecto,
    período: {
      inicio: new Date(inicioActual).toISOString().slice(0, 10),
      fin: new Date(hoy).toISOString().slice(0, 10),
    },
    mencionesTotales: actuales.length,
    // Mismo guardado que el resto de la app (2026-09-30, caso real
    // "+847,366.7%") — antes esta llamada faltaba aquí, así que Infografía
    // (pantalla Y PDF exportado) era la única superficie sin protección
    // contra un % absurdo por base de comparación casi nula. Nunca se
    // manifestó en vivo (verificado contra datos reales de proy. 40/41,
    // 2026-10-02) pero es el mismo riesgo estructural ya documentado.
    cambioMenciones: anteriores.length >= VOLUMEN_MINIMO_CAMBIO
      ? cambioPorcentual(actuales.length, anteriores.length)
      : null,
    cambioMencionesAbsoluto: actuales.length - anteriores.length,
    alcanceTotal: alcanceActual,
    cambioAlcance: anteriores.length >= VOLUMEN_MINIMO_CAMBIO
      ? cambioPorcentual(alcanceActual, alcanceAnterior)
      : null,
    cambioAlcanceAbsoluto: alcanceActual - alcanceAnterior,
    sentimiento: calcularSentimientoPorcentual(actuales),
    fuentesActivas: calcularFuentesConCambio(actuales, anteriores, actuales.length),
    topEmisores: calcularTopEmisores(actuales),
    mencionesPopulares: [...actuales].sort((a, b) => b.alcance - a.alcance).slice(0, MÁXIMO_POPULARES),
    // calcularRegionesPresencia agrupa por el campo `region` real del
    // proyecto tal cual (puede ser una sola región o una cobertura nacional
    // de varias juntas) — ver su comentario para por qué NO se parte en
    // regiones individuales con conteo propio (no hay dato real a ese
    // nivel). Se usa siempre (con o sin proyecto único) para que ambos
    // casos se comporten igual.
    regiones: calcularRegionesPresencia(actuales, regiónPorProyecto),
  };
}
