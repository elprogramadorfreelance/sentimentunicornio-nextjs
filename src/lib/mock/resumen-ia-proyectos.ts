import { repartirPorcentajesEnteros } from "@/lib/porcentajes";
import type { AlertaPanel } from "@/lib/mock/metricas-panel";
import type { MetricasProyectoPanel, Proyecto, ResumenProyectos } from "@/types";

/** Métricas en cero — fallback mientras carga el panel o si un proyecto no tiene menciones aún. */
export function metricasProyectoVacías(): MetricasProyectoPanel {
  return {
    positivo: 0,
    negativo: 0,
    neutro: 0,
    favorabilidad: 50,
    mencionesSemana: [0, 0, 0, 0, 0, 0, 0],
    alcance: 0,
    alertas: 0,
    menciones: 0,
    clasificadas: 0,
    alertaCrisis: "ninguna",
    fuentesPrincipales: [],
    temasPrincipales: [],
  };
}

export type PanoramaProyectos = {
  sentimiento: { positivo: number; negativo: number; neutro: number };
  mencionesSemana: [number, number, number, number, number, number, number];
  alcanceTotal: number;
  alertas: number;
  mayorAlcance?: { proyecto: Proyecto; metricas: MetricasProyectoPanel };
  mayorRiesgo?: { proyecto: Proyecto; metricas: MetricasProyectoPanel };
  /** Temas principales reales: los que se repiten entre proyectos, o los del único proyecto si solo hay uno. */
  temasRecurrentes?: string[];
  /** Fuentes que más publican (reales): del único proyecto, o las que se repiten entre proyectos. */
  fuentesPrincipales?: string[];
};

/** Agrega las métricas reales (por proyecto) del panel en un solo panorama — misma cuenta que alimenta las gráficas, reutilizada aquí para que el texto pueda justificarse con los mismos números que se ven al lado. */
export function calcularPanoramaProyectos(
  proyectos: Proyecto[],
  metricasPorProyecto: Record<string, MetricasProyectoPanel>,
): PanoramaProyectos {
  const detalles = proyectos.map((proyecto) => ({
    proyecto,
    metricas: metricasPorProyecto[proyecto.id] ?? metricasProyectoVacías(),
  }));
  const divisor = Math.max(detalles.length, 1);
  // Promedio exacto (sin redondear) antes de repartir el 100% — redondear cada
  // tonalidad por separado puede pasarse de 100 y dejar la tercera en negativo.
  const positivoExacto =
    detalles.reduce((suma, item) => suma + item.metricas.positivo, 0) / divisor;
  const neutroExacto =
    detalles.reduce((suma, item) => suma + item.metricas.neutro, 0) / divisor;
  const negativoExacto =
    detalles.reduce((suma, item) => suma + item.metricas.negativo, 0) / divisor;
  const [positivo, negativo, neutro] = repartirPorcentajesEnteros(
    [positivoExacto, negativoExacto, neutroExacto],
    100,
  );

  const mencionesSemana = [0, 1, 2, 3, 4, 5, 6].map((indice) =>
    detalles.reduce((suma, item) => suma + item.metricas.mencionesSemana[indice], 0),
  ) as [number, number, number, number, number, number, number];

  const mayorAlcance = [...detalles].sort(
    (a, b) => b.metricas.alcance - a.metricas.alcance,
  )[0];
  const mayorRiesgo = [...detalles].sort(
    (a, b) => b.metricas.alertas - a.metricas.alertas,
  )[0];

  const apariciones = new Map<string, number>();
  for (const item of detalles) {
    for (const tema of item.metricas.temasPrincipales) {
      apariciones.set(tema, (apariciones.get(tema) ?? 0) + 1);
    }
  }
  const unicoProyecto = detalles.length === 1 ? detalles[0].metricas : null;
  const temasRecurrentes = unicoProyecto
    ? unicoProyecto.temasPrincipales.slice(0, 2)
    : Array.from(apariciones.entries())
        .filter(([, veces]) => veces >= 2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([tema]) => tema);

  const apariciónFuentes = new Map<string, number>();
  for (const item of detalles) {
    for (const fuente of item.metricas.fuentesPrincipales) {
      apariciónFuentes.set(fuente, (apariciónFuentes.get(fuente) ?? 0) + 1);
    }
  }
  const fuentesPrincipales = unicoProyecto
    ? unicoProyecto.fuentesPrincipales.slice(0, 2)
    : Array.from(apariciónFuentes.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([fuente]) => fuente);

  return {
    sentimiento: { positivo, negativo, neutro },
    mencionesSemana,
    alcanceTotal: detalles.reduce((suma, item) => suma + item.metricas.alcance, 0),
    alertas: detalles.reduce((suma, item) => suma + item.metricas.alertas, 0),
    mayorAlcance,
    mayorRiesgo,
    temasRecurrentes,
    fuentesPrincipales,
  };
}

/** Narrativa estilo IA construida a partir de métricas reales del proyecto (menciones/alertas reales). */
export function narrativaIaProyecto(
  proyecto: Proyecto,
  metricas: MetricasProyectoPanel,
): string {
  const menciones = [...metricas.mencionesSemana];
  const primeraMitad = (menciones[0] + menciones[1] + menciones[2]) / 3;
  const segundaMitad =
    (menciones[3] + menciones[4] + menciones[5] + menciones[6]) / 4;
  const tendencia =
    segundaMitad > primeraMitad * 1.12
      ? "al alza"
      : segundaMitad < primeraMitad * 0.9
        ? "a la baja"
        : "estable";

  const tonoSentimiento =
    metricas.positivo >= 55
      ? `tiene una aprobación sólida entre quienes conversan sobre el tema: el sentimiento positivo ronda el ${metricas.positivo}%`
      : metricas.negativo >= 35
        ? `enfrenta tensión reputacional: el tono negativo llega al ${metricas.negativo}% y conviene vigilar narrativas críticas`
        : `muestra una percepción mixta, con ${metricas.positivo}% positivo y ${metricas.neutro}% neutro`;

  const bloqueAlertas =
    metricas.alertas === 0
      ? "No se detectan alertas críticas en la ventana reciente."
      : metricas.alertas === 1
        ? "Hay 1 alerta activa que amerita revisión puntual."
        : `Hay ${metricas.alertas} alertas activas que conviene priorizar en el monitoreo.`;

  const bloqueEstado =
    proyecto.estado === "inactivo"
      ? " El proyecto está inactivo: estas lecturas corresponden a la última ventana con data recolectada."
      : "";

  const bloqueTendencia =
    tendencia === "al alza"
      ? `Las menciones de los últimos días van ${tendencia}, con un alcance estimado de ${metricas.alcance.toLocaleString("es-MX")} personas.`
      : tendencia === "a la baja"
        ? `El volumen de menciones va ${tendencia}; aun así el alcance potencial se estima en ${metricas.alcance.toLocaleString("es-MX")}.`
        : `El volumen de menciones se mantiene ${tendencia}, con un alcance estimado de ${metricas.alcance.toLocaleString("es-MX")}.`;

  // Antes decía "conversación concentrada en torno a «{primera palabra clave}»,
  // principalmente en {redes conectadas}" — ni la palabra era un dato medido
  // (era la primera de la lista de configuración) ni las redes conectadas
  // dicen dónde se publicó. Ahora sale de las menciones reales del proyecto.
  const temas = metricas.temasPrincipales.slice(0, 2);
  const fuentes = metricas.fuentesPrincipales.slice(0, 2);
  const bloqueFuentesTemas =
    temas.length > 0 && fuentes.length > 0
      ? `Los temas que más se repiten son ${formatearListaConY(temas)}, y la mayor parte de la conversación llega desde ${formatearListaConY(fuentes)}.`
      : "Todavía no hay suficientes menciones para identificar temas recurrentes.";

  return `El proyecto ${proyecto.nombre} ${tonoSentimiento}. ${bloqueFuentesTemas} ${bloqueTendencia} ${bloqueAlertas}${bloqueEstado}`.replace(
    /\s+/g,
    " ",
  );
}


export type ResumenIaEstructurado = {
  /** Titular corto en negritas — la lectura de una línea, estilo editorial
   * ("Conversación en alza, sentimiento mixto, 2 alertas por revisar"). */
  titular: string;
  /** Párrafo con los números reales del período, en **negritas** (markdown
   * simple — ver TextoConNegritas). */
  párrafo: string;
  /** Desglose real: por proyecto si hay 2+, por categoría de métrica si hay
   * 1 solo (mismo criterio que el ejemplo de referencia del cliente:
   * titular + párrafo + bullets con cifras en negrita por canal/entidad). */
  bullets: string[];
};

function titularPanorama(
  sentimiento: { positivo: number; negativo: number; neutro: number },
  tendenciaMenciones: "al alza" | "a la baja" | "estable",
  alertas: number,
): string {
  const partes: string[] = [];
  partes.push(
    tendenciaMenciones === "al alza"
      ? "Conversación en aumento"
      : tendenciaMenciones === "a la baja"
        ? "Conversación en descenso"
        : "Conversación estable",
  );
  partes.push(
    sentimiento.positivo >= 55
      ? "sentimiento favorable"
      : sentimiento.negativo >= 35
        ? "sentimiento bajo presión"
        : "sentimiento mixto",
  );
  if (alertas > 0) {
    partes.push(`${alertas} alerta${alertas === 1 ? "" : "s"} por revisar`);
  }
  return `${partes.join(", ")}.`;
}

function tendenciaDeMenciones(
  mencionesSemana: readonly number[],
): "al alza" | "a la baja" | "estable" {
  const mitad = Math.ceil(mencionesSemana.length / 2);
  const primeraMitad =
    mencionesSemana.slice(0, mitad).reduce((a, b) => a + b, 0) / mitad || 0;
  const segundaMitad =
    mencionesSemana.slice(mitad).reduce((a, b) => a + b, 0) /
      Math.max(mencionesSemana.length - mitad, 1) || 0;
  if (segundaMitad > primeraMitad * 1.12) return "al alza";
  if (segundaMitad < primeraMitad * 0.9) return "a la baja";
  return "estable";
}

/**
 * Nombres reales de narrativa citados en los títulos de alerta (ej. "Nuevas
 * narrativas de riesgo Crítico: "Problemas medioambientales graves". (+ 11
 * más)" → "Problemas medioambientales graves"). Estos títulos ya vienen
 * garantizados con evidencia real detrás (el backend filtra las que no
 * tienen — ver filtrarAlertasConEvidenciaReal en db.js), así que citarlos
 * aquí no es inventar nada, es reusar lo que la propia IA ya detectó.
 */
function nombresNarrativaDeAlertas(alertas: AlertaPanel[], máximo: number): string[] {
  const críticas = alertas.filter((a) => a.nivel === "critica" && a.enlace?.destino === "narrativas");
  const nombres: string[] = [];
  for (const a of críticas) {
    const match = a.mensaje.match(/"([^"]+)"/);
    if (match && !nombres.includes(match[1])) nombres.push(match[1]);
    if (nombres.length >= máximo) break;
  }
  return nombres;
}

function formatearListaConY(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return `«${items[0]}»`;
  return `${items.slice(0, -1).map((n) => `«${n}»`).join(", ")} y «${items[items.length - 1]}»`;
}

export function construirResumenIaEstructurado(
  proyectos: Proyecto[],
  resumen: ResumenProyectos,
  panorama?: PanoramaProyectos,
  alertasReales: AlertaPanel[] = [],
): ResumenIaEstructurado {
  const activos = proyectos.filter((p) => p.estado === "activo");
  const inactivos = proyectos.length - activos.length;
  const analisis = proyectos.reduce((acc, p) => acc + p.analisis, 0);
  const redes = new Set(activos.flatMap((p) => p.redesConectadas));
  const keywords = activos.reduce((acc, p) => acc + p.palabrasClave.length, 0);

  if (proyectos.length === 0) {
    return {
      titular: "Todavía sin proyectos.",
      párrafo:
        "Crea tu primer proyecto para empezar a monitorear sentimiento, menciones y alertas en un solo lugar.",
      bullets: [],
    };
  }
  if (activos.length === 0) {
    return {
      titular: "Todos tus proyectos están inactivos.",
      párrafo: `Tienes **${proyectos.length}** proyecto${proyectos.length === 1 ? "" : "s"} inactivo${proyectos.length === 1 ? "" : "s"}. Reactívalos para reanudar la recolección de datos y volver a verlos en las métricas.`,
      bullets: [],
    };
  }

  const tendencia = panorama ? tendenciaDeMenciones(panorama.mencionesSemana) : "estable";
  const sentimiento = panorama?.sentimiento ?? { positivo: 0, negativo: 0, neutro: 0 };
  const alertas = panorama?.alertas ?? 0;
  const alcanceTotal = panorama?.alcanceTotal ?? 0;

  const titular = titularPanorama(sentimiento, tendencia, alertas);

  // El "con"/"sin" va DENTRO de cada rama — antes vivía fijo en la plantilla
  // de abajo ("... con ${redesTxt} ...") y la rama de 0 redes ya traía su
  // propio "sin" adentro, así que el resultado armaba "con sin redes
  // conectadas aún" (bug real reportado por el cliente, 2026-10-01: "con
  // sin redes" no significa nada en español).
  const redesTxt =
    redes.size > 0
      ? `con **${redes.size}** red${redes.size === 1 ? "" : "es"} conectada${redes.size === 1 ? "" : "s"}`
      : "sin redes conectadas aún";
  const cobertura =
    analisis === 0
      ? " Estas lecturas vienen de la ingesta inicial de menciones — todavía no corre un análisis completo, así que pueden ajustarse conforme se acumule más data."
      : "";

  // El "por qué" real detrás del número: antes el párrafo se quedaba en la
  // cifra agregada ("27% negativo") sin decir A QUÉ responde — pedido
  // explícito del cliente (2026-10-02): "menciona por qué está así, da más
  // detalles, solo das datos". Se citan los nombres reales de las
  // narrativas críticas detrás de las alertas (ya garantizadas con
  // evidencia real por el backend) en vez de quedarse en el conteo.
  // Si no hay ninguna narrativa crítica citable, NO se agrega nada — una
  // frase explicando la limitación técnica del matching interno ("todavía
  // no están ligadas a evidencia citada") no debe vivir en un texto de cara
  // al cliente (bug real reportado 2026-10-02: hacía ver mal al usuario
  // frente a su propio cliente).
  const nombresCríticos = nombresNarrativaDeAlertas(alertasReales, 2);
  const bloqueNarrativas =
    nombresCríticos.length > 0
      ? ` El tono negativo responde sobre todo a ${formatearListaConY(nombresCríticos)}, las narrativas de mayor riesgo detectadas en el período.`
      : "";
  const temasRecurrentes = panorama?.temasRecurrentes ?? [];
  const fuentesPrincipales = panorama?.fuentesPrincipales ?? [];
  const esUnoSolo = activos.length === 1;
  const bloqueTemas =
    temasRecurrentes.length > 0 && fuentesPrincipales.length > 0
      ? ` ${esUnoSolo ? "Los temas que más se repiten" : "Los temas que se repiten entre tus proyectos"} son ${formatearListaConY(temasRecurrentes)}, y la mayor parte de la conversación llega desde ${formatearListaConY(fuentesPrincipales)}.`
      : "";

  const párrafo =
    `Monitoreas **${activos.length}** proyecto${activos.length === 1 ? "" : "s"} activo${activos.length === 1 ? "" : "s"} ${redesTxt} y **${keywords}** palabra${keywords === 1 ? "" : "s"} clave. ` +
    `El tono agregado es **${sentimiento.positivo}% positivo**, **${sentimiento.neutro}% neutro** y **${sentimiento.negativo}% negativo**, con un alcance potencial estimado de **${alcanceTotal.toLocaleString("es-MX")}** personas.` +
    bloqueTemas +
    bloqueNarrativas +
    (inactivos > 0
      ? ` **${inactivos}** proyecto${inactivos === 1 ? "" : "s"} inactivo${inactivos === 1 ? "" : "s"} no está recolectando datos.`
      : "") +
    cobertura;

  const bullets: string[] = [];
  if (activos.length >= 2 && panorama) {
    // 2+ proyectos: un bullet real por proyecto (el mismo criterio que el
    // ejemplo de referencia desglosa por canal/red social).
    const porAlcance = [...activos]
      .map((p) => ({ proyecto: p, alcance: p.id === panorama.mayorAlcance?.proyecto.id ? panorama.mayorAlcance.metricas.alcance : 0 }))
      .sort((a, b) => b.alcance - a.alcance)
      .slice(0, 3);
    for (const { proyecto, alcance } of porAlcance) {
      bullets.push(
        `**${proyecto.nombre}**: alcance estimado de **${alcance.toLocaleString("es-MX")}** personas, **${proyecto.analisis}** análisis realizados.`,
      );
    }
  } else {
    // 1 solo proyecto: se desglosa por categoría de métrica en vez de por
    // proyecto — no hay nada más que comparar entre sí.
    bullets.push(
      `Cupo de análisis usado: **${resumen.usados}/${resumen.limite}**.`,
    );
    bullets.push(
      alertas === 0
        ? "**0** alertas críticas en la ventana reciente."
        : `**${alertas}** alerta${alertas === 1 ? "" : "s"} activa${alertas === 1 ? "" : "s"} que conviene revisar.`,
    );
    if (alcanceTotal > 0) {
      bullets.push(`Alcance potencial estimado: **${alcanceTotal.toLocaleString("es-MX")}** personas.`);
    }
  }

  return { titular, párrafo: párrafo.replace(/\s+/g, " ").trim(), bullets };
}

/** @deprecated usar construirResumenIaEstructurado — se mantiene por si algún
 * caller viejo todavía pide el string plano (export/PDF, por ejemplo). */
export function construirTextoResumenIa(
  proyectos: Proyecto[],
  resumen: ResumenProyectos,
  panorama?: PanoramaProyectos,
): string {
  const { párrafo } = construirResumenIaEstructurado(proyectos, resumen, panorama);
  return párrafo.replace(/\*\*/g, "");
}

export function chipsResumenIa(
  proyectos: Proyecto[],
): { etiqueta: string; valor: string }[] {
  const activos = proyectos.filter((p) => p.estado === "activo");
  const analisis = proyectos.reduce((acc, p) => acc + p.analisis, 0);
  const redes = new Set(activos.flatMap((p) => p.redesConectadas));
  return [
    { etiqueta: "Activos", valor: String(activos.length) },
    { etiqueta: "Análisis", valor: String(analisis) },
    { etiqueta: "Redes", valor: String(redes.size) },
  ];
}
