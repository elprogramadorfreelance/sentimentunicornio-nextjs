// Benchmarking real entre proyectos — la referencia de Bruno usa números
// inventados con semilla hash por proyecto (ver mock/benchmarking.ts en su
// carpeta), sin backend propio. Aquí se calcula todo desde las menciones
// reales de cada proyecto (mismo dato que ya alimenta Menciones/Sentimiento),
// reutilizando `estimarAlcance`/`CANALES_SOCIALES` para quedar consistente
// con el resto de la app.
import { CANALES_SOCIALES, estimarAlcance, obtenerMencionesReales } from "@/lib/menciones-backend";
import type {
  CategoríasPorProyecto,
  MenciónEditorial,
  MétricasProyectoBenchmarking,
  PuntoTendenciaBenchmarking,
  ResumenBenchmarking,
  RespuestaBenchmarking,
  TipoFuenteMención,
  TonalidadPorProyecto,
} from "@/types";

const PALETA_PROYECTOS = [
  "var(--color-primary)",
  "var(--color-sky)",
  "var(--color-navy)",
  "var(--color-accent)",
  "var(--color-blue)",
  "var(--color-success)",
  "var(--color-warning)",
  "var(--color-error)",
] as const;

// Canales de publicación directa de usuarios — base real de "contenido
// generado por el usuario". Se excluyen Noticias/YouTube/Blogs por ser
// canales de contenido más producido que espontáneo.
const CANALES_UGC = new Set<TipoFuenteMención>(["x", "facebook", "instagram", "tiktok"]);

const DÍAS_TENDENCIA = 15;
const MS_DÍA = 86_400_000;

function inicioDeDía(fecha: Date): number {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()).getTime();
}

function métricasProyecto(
  proyectoId: string,
  nombre: string,
  color: string,
  menciones: MenciónEditorial[],
): MétricasProyectoBenchmarking {
  const sociales = menciones.filter((m) => CANALES_SOCIALES.has(m.tipoFuente));
  const fueraDeRedes = menciones.filter((m) => !CANALES_SOCIALES.has(m.tipoFuente));
  const positivas = menciones.filter((m) => m.sentimiento === "positivo");
  const negativas = menciones.filter((m) => m.sentimiento === "negativo");
  const total = menciones.length;

  return {
    proyectoId,
    nombre,
    color,
    mencionesTotales: total,
    mencionesRedesSociales: sociales.length,
    mencionesFueraRedes: fueraDeRedes.length,
    mencionesPositivas: positivas.length,
    mencionesPositivasPorcentaje: total ? Math.round((positivas.length / total) * 1000) / 10 : 0,
    mencionesNegativas: negativas.length,
    mencionesNegativasPorcentaje: total ? Math.round((negativas.length / total) * 1000) / 10 : 0,
    alcanceRedesSociales: sociales.reduce((suma, m) => suma + estimarAlcance(m), 0),
    alcanceFueraRedes: fueraDeRedes.reduce((suma, m) => suma + estimarAlcance(m), 0),
    contenidoGeneradoUsuarios: menciones.filter((m) => CANALES_UGC.has(m.tipoFuente)).length,
  };
}

function tonalidadProyecto(
  proyectoId: string,
  nombre: string,
  menciones: MenciónEditorial[],
): TonalidadPorProyecto {
  let positivo = 0;
  let negativo = 0;
  let neutral = 0;
  let sinCalificar = 0;
  for (const m of menciones) {
    if (m.sentimientoClasificado === false) {
      sinCalificar++;
    } else if (m.sentimiento === "positivo") {
      positivo++;
    } else if (m.sentimiento === "negativo") {
      negativo++;
    } else {
      neutral++;
    }
  }
  return { proyectoId, nombre, positivo, negativo, neutral, sinCalificar };
}

function categoríasProyecto(
  proyectoId: string,
  nombre: string,
  menciones: MenciónEditorial[],
): CategoríasPorProyecto {
  const conteo: Record<TipoFuenteMención, number> = {
    x: 0,
    facebook: 0,
    instagram: 0,
    tiktok: 0,
    noticias: 0,
    youtube: 0,
    blogs: 0,
  };
  for (const m of menciones) conteo[m.tipoFuente] = (conteo[m.tipoFuente] ?? 0) + 1;
  return { proyectoId, nombre, ...conteo };
}

type FilaDía = { total: number; alcance: number; positivas: number; negativas: number };

function agruparPorDía(menciones: MenciónEditorial[], días: number): Map<number, FilaDía> {
  const hoy = inicioDeDía(new Date());
  const inicio = hoy - (días - 1) * MS_DÍA;
  const mapa = new Map<number, FilaDía>();
  for (let i = 0; i < días; i++) {
    mapa.set(inicio + i * MS_DÍA, { total: 0, alcance: 0, positivas: 0, negativas: 0 });
  }
  for (const m of menciones) {
    const t = inicioDeDía(new Date(m.publicadaEn));
    const fila = mapa.get(t);
    if (!fila) continue;
    fila.total += 1;
    fila.alcance += estimarAlcance(m);
    if (m.sentimiento === "positivo") fila.positivas += 1;
    if (m.sentimiento === "negativo") fila.negativas += 1;
  }
  return mapa;
}

function tendenciaMulti(
  porProyecto: Map<string, Map<number, FilaDía>>,
  días: number,
  extraer: (fila: FilaDía) => number,
): PuntoTendenciaBenchmarking[] {
  const hoy = inicioDeDía(new Date());
  const inicio = hoy - (días - 1) * MS_DÍA;
  const vacía: FilaDía = { total: 0, alcance: 0, positivas: 0, negativas: 0 };

  return Array.from({ length: días }, (_, índice) => {
    const t = inicio + índice * MS_DÍA;
    return {
      fecha: new Date(t).toISOString().slice(0, 10),
      valoresPorProyecto: Object.fromEntries(
        Array.from(porProyecto.entries()).map(([id, porDía]) => [id, extraer(porDía.get(t) ?? vacía)]),
      ),
    };
  });
}

function construirResumenBenchmarking(proyectos: MétricasProyectoBenchmarking[]): ResumenBenchmarking {
  const porMenciones = [...proyectos].sort((a, b) => b.mencionesTotales - a.mencionesTotales);
  const porAlcance = [...proyectos].sort(
    (a, b) =>
      b.alcanceRedesSociales + b.alcanceFueraRedes - (a.alcanceRedesSociales + a.alcanceFueraRedes),
  );
  const porSentimiento = [...proyectos].sort(
    (a, b) => b.mencionesPositivasPorcentaje - a.mencionesPositivasPorcentaje,
  );

  const líderMenciones = porMenciones[0];
  const líderAlcance = porAlcance[0];
  const líderSentimiento = porSentimiento[0];
  const segundoAlcance = porAlcance[1];

  const lectura = [
    `**${líderMenciones.nombre}** concentra la mayor conversación con **${líderMenciones.mencionesTotales.toLocaleString("es-MX")}** menciones.`,
    segundoAlcance
      ? `**${líderAlcance.nombre}** genera **${(
          (líderAlcance.alcanceRedesSociales + líderAlcance.alcanceFueraRedes) /
          Math.max(1, segundoAlcance.alcanceRedesSociales + segundoAlcance.alcanceFueraRedes)
        ).toFixed(1)}x** más alcance que **${segundoAlcance.nombre}**.`
      : `**${líderAlcance.nombre}** lidera el alcance total con **${(líderAlcance.alcanceRedesSociales + líderAlcance.alcanceFueraRedes).toLocaleString("es-MX")}**.`,
    `**${líderSentimiento.nombre}** tiene la mejor proporción de sentimiento positivo (**${líderSentimiento.mencionesPositivasPorcentaje}%**).`,
  ];

  const titular =
    líderMenciones.nombre === líderAlcance.nombre && líderAlcance.nombre === líderSentimiento.nombre
      ? `**${líderMenciones.nombre}** domina en menciones, alcance y sentimiento.`
      : `**${líderMenciones.nombre}** lidera en volumen, **${líderAlcance.nombre}** en alcance, **${líderSentimiento.nombre}** en sentimiento.`;

  return {
    titular,
    liderMenciones: líderMenciones.nombre,
    liderAlcance: líderAlcance.nombre,
    liderSentimiento: líderSentimiento.nombre,
    lectura,
  };
}

export async function obtenerBenchmarkingReal(
  proyectosSeleccionados: { id: string; nombre: string }[],
): Promise<RespuestaBenchmarking> {
  const mencionesPorProyecto = await Promise.all(
    proyectosSeleccionados.map((p) => obtenerMencionesReales(p.id)),
  );

  const proyectos = proyectosSeleccionados.map((p, índice) =>
    métricasProyecto(
      p.id,
      p.nombre,
      PALETA_PROYECTOS[índice % PALETA_PROYECTOS.length],
      mencionesPorProyecto[índice],
    ),
  );

  const díasPorProyecto = new Map(
    proyectosSeleccionados.map((p, índice) => [p.id, agruparPorDía(mencionesPorProyecto[índice], DÍAS_TENDENCIA)]),
  );

  const tonalidad = proyectosSeleccionados.map((p, índice) =>
    tonalidadProyecto(p.id, p.nombre, mencionesPorProyecto[índice]),
  );
  const categorías = proyectosSeleccionados.map((p, índice) =>
    categoríasProyecto(p.id, p.nombre, mencionesPorProyecto[índice]),
  );

  const hoy = inicioDeDía(new Date());
  const inicio = hoy - (DÍAS_TENDENCIA - 1) * MS_DÍA;

  return {
    período: {
      inicio: new Date(inicio).toISOString().slice(0, 10),
      fin: new Date(hoy).toISOString().slice(0, 10),
    },
    proyectos,
    tendenciaMenciones: tendenciaMulti(díasPorProyecto, DÍAS_TENDENCIA, (f) => f.total),
    tendenciaAlcance: tendenciaMulti(díasPorProyecto, DÍAS_TENDENCIA, (f) => f.alcance),
    tendenciaSentimientoPositivo: tendenciaMulti(díasPorProyecto, DÍAS_TENDENCIA, (f) =>
      f.total ? Math.round((f.positivas / f.total) * 1000) / 10 : 0,
    ),
    tendenciaSentimientoNegativo: tendenciaMulti(díasPorProyecto, DÍAS_TENDENCIA, (f) =>
      f.total ? Math.round((f.negativas / f.total) * 1000) / 10 : 0,
    ),
    tonalidad,
    categorías,
    resumen: construirResumenBenchmarking(proyectos),
  };
}
