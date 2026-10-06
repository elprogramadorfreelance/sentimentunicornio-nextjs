import type {
  PuntoSerieSentimiento,
  RespuestaSentimiento,
  SegmentoTonalidad,
  TonalidadPorFuente,
} from "@/types";

export type TendenciaTono = "alza" | "baja" | "estable";

export type FuenteDestacadaSentimiento = {
  fuente: string;
  porcentaje: number;
};

export type PanoramaSentimientoIa = {
  positivo: number;
  negativo: number;
  neutro: number;
  sinCalificar: number;
  mencionesPositivas: number;
  mencionesNegativas: number;
  mencionesNeutras: number;
  tendenciaPositivo: TendenciaTono;
  tendenciaNegativo: TendenciaTono;
  fuenteMasPositiva: FuenteDestacadaSentimiento | null;
  fuenteMasNegativa: FuenteDestacadaSentimiento | null;
  tonoDominante: "positivo" | "negativo" | "neutral";
};

function porcentajeDe(
  desglose: SegmentoTonalidad[],
  categoría: SegmentoTonalidad["categoría"],
): number {
  return desglose.find((item) => item.categoría === categoría)?.porcentaje ?? 0;
}

function valorDe(
  desglose: SegmentoTonalidad[],
  categoría: SegmentoTonalidad["categoría"],
): number {
  return desglose.find((item) => item.categoría === categoría)?.valor ?? 0;
}

function tendenciaSerie(puntos: PuntoSerieSentimiento[]): TendenciaTono {
  if (puntos.length < 4) return "estable";
  const tercio = Math.max(1, Math.floor(puntos.length / 3));
  const promedio = (tramo: PuntoSerieSentimiento[]) =>
    tramo.reduce((suma, punto) => suma + punto.actualPorcentaje, 0) /
    tramo.length;
  const inicio = promedio(puntos.slice(0, tercio));
  const fin = promedio(puntos.slice(-tercio));
  if (fin > inicio * 1.08) return "alza";
  if (fin < inicio * 0.92) return "baja";
  return "estable";
}

function ratioFuente(
  fuente: TonalidadPorFuente,
  clave: "positivo" | "negativo",
): number {
  const total =
    fuente.positivo + fuente.negativo + fuente.neutro + fuente.sinCalificar;
  if (total === 0) return 0;
  return (fuente[clave] / total) * 100;
}

function fuenteDestacada(
  fuentes: TonalidadPorFuente[],
  clave: "positivo" | "negativo",
): FuenteDestacadaSentimiento | null {
  if (fuentes.length === 0) return null;
  const destacada = [...fuentes].sort(
    (a, b) => ratioFuente(b, clave) - ratioFuente(a, clave),
  )[0];
  return {
    fuente: destacada.fuente,
    porcentaje: ratioFuente(destacada, clave),
  };
}

export function panoramaSentimientoIa(
  datos: RespuestaSentimiento,
): PanoramaSentimientoIa {
  const positivo = porcentajeDe(datos.desglose, "positivo");
  const negativo = porcentajeDe(datos.desglose, "negativo");
  const neutro = porcentajeDe(datos.desglose, "neutral");
  const sinCalificar = porcentajeDe(datos.desglose, "sin_calificar");

  let tonoDominante: PanoramaSentimientoIa["tonoDominante"] = "neutral";
  if (positivo >= negativo && positivo >= neutro) tonoDominante = "positivo";
  else if (negativo >= positivo && negativo >= neutro)
    tonoDominante = "negativo";

  return {
    positivo,
    negativo,
    neutro,
    sinCalificar,
    mencionesPositivas: valorDe(datos.desglose, "positivo"),
    mencionesNegativas: valorDe(datos.desglose, "negativo"),
    mencionesNeutras: valorDe(datos.desglose, "neutral"),
    tendenciaPositivo: tendenciaSerie(datos.seriePositivo),
    tendenciaNegativo: tendenciaSerie(datos.serieNegativo),
    fuenteMasPositiva: fuenteDestacada(datos.tonalidadPorFuente, "positivo"),
    fuenteMasNegativa: fuenteDestacada(datos.tonalidadPorFuente, "negativo"),
    tonoDominante,
  };
}

function formatearRango(inicio: string, fin: string): string {
  const opciones: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
  };
  const inicioFmt = new Date(`${inicio}T00:00:00`).toLocaleDateString(
    "es-MX",
    opciones,
  );
  const finFmt = new Date(`${fin}T00:00:00`).toLocaleDateString("es-MX", {
    ...opciones,
    year: "numeric",
  });
  return `${inicioFmt} – ${finFmt}`;
}

function formatearPorcentaje(valor: number): string {
  return `${valor.toLocaleString("es-MX", {
    maximumFractionDigits: valor < 1 ? 2 : 1,
  })}%`;
}

function etiquetaTendencia(tendencia: TendenciaTono): string {
  if (tendencia === "alza") return "va al alza";
  if (tendencia === "baja") return "va a la baja";
  return "se mantiene estable";
}

function etiquetaTonoDominante(
  tono: PanoramaSentimientoIa["tonoDominante"],
): string {
  if (tono === "positivo") return "predominantemente positiva";
  if (tono === "negativo") return "predominantemente negativa";
  return "predominantemente neutral";
}

/** Titular corto en negritas, estilo editorial — mismo criterio que el resto de los resúmenes IA. */
export function titularResumenIaSentimiento(
  panorama: PanoramaSentimientoIa,
): string {
  const tono =
    panorama.tonoDominante === "positivo"
      ? "Percepción favorable"
      : panorama.tonoDominante === "negativo"
        ? "Percepción bajo presión"
        : "Percepción mixta";
  const tendencia =
    panorama.tendenciaNegativo === "alza"
      ? "tono negativo en aumento"
      : panorama.tendenciaPositivo === "alza"
        ? "tono positivo ganando terreno"
        : "tono relativamente estable";
  return `${tono}, ${tendencia}.`;
}

export function construirTextoResumenIaSentimiento(
  datos: RespuestaSentimiento,
  nombreProyecto: string | null,
): string {
  const panorama = panoramaSentimientoIa(datos);
  const sujeto = nombreProyecto
    ? `de ${nombreProyecto}`
    : "de los proyectos monitoreados";
  const rango = formatearRango(datos.período.inicio, datos.período.fin);

  const fuentes: string[] = [];
  if (panorama.fuenteMasPositiva) {
    fuentes.push(
      `**${panorama.fuenteMasPositiva.fuente}** es el canal con mejor percepción (**${formatearPorcentaje(panorama.fuenteMasPositiva.porcentaje)}** positivo)`,
    );
  }
  if (
    panorama.fuenteMasNegativa &&
    panorama.fuenteMasNegativa.fuente !== panorama.fuenteMasPositiva?.fuente
  ) {
    fuentes.push(
      `**${panorama.fuenteMasNegativa.fuente}** concentra más críticas (**${formatearPorcentaje(panorama.fuenteMasNegativa.porcentaje)}** negativo)`,
    );
  }

  const texto = `En el período ${rango}, la conversación ${sujeto} es ${etiquetaTonoDominante(panorama.tonoDominante)}. El tono positivo concentra **${formatearPorcentaje(panorama.positivo)}** de las menciones y el negativo **${formatearPorcentaje(panorama.negativo)}**; el resto es neutral (**${formatearPorcentaje(panorama.neutro)}**). El sentimiento positivo ${etiquetaTendencia(panorama.tendenciaPositivo)} frente al período anterior; el negativo ${etiquetaTendencia(panorama.tendenciaNegativo)}.${fuentes.length > 0 ? ` ${fuentes.join(". ")}.` : ""}`;

  return texto.replace(/\s+/g, " ").trim();
}

export function chipsResumenIaSentimiento(
  datos: RespuestaSentimiento,
): { etiqueta: string; valor: string }[] {
  const panorama = panoramaSentimientoIa(datos);
  return [
    {
      etiqueta: "Positivo",
      valor: formatearPorcentaje(panorama.positivo),
    },
    {
      etiqueta: "Negativo",
      valor: formatearPorcentaje(panorama.negativo),
    },
    {
      etiqueta: "Neutral",
      valor: formatearPorcentaje(panorama.neutro),
    },
  ];
}

export function narrativaDestacadaSentimiento(
  datos: RespuestaSentimiento,
): string[] {
  const panorama = panoramaSentimientoIa(datos);
  const puntos: string[] = [];

  puntos.push(
    panorama.tonoDominante === "positivo"
      ? `La percepción general es favorable: el **${formatearPorcentaje(panorama.positivo)}** de las menciones tiene tono positivo.`
      : panorama.tonoDominante === "negativo"
        ? `Conviene vigilar el tono crítico: el **${formatearPorcentaje(panorama.negativo)}** de las menciones es negativo.`
        : `El volumen se concentra en un tono neutral (**${formatearPorcentaje(panorama.neutro)}**), con espacio para mover la conversación hacia lo positivo.`,
  );

  if (panorama.fuenteMasPositiva) {
    puntos.push(
      `**${panorama.fuenteMasPositiva.fuente}** lidera la conversación favorable con **${formatearPorcentaje(panorama.fuenteMasPositiva.porcentaje)}** de menciones positivas.`,
    );
  }

  if (panorama.fuenteMasNegativa) {
    puntos.push(
      `**${panorama.fuenteMasNegativa.fuente}** concentra el mayor riesgo reputacional (**${formatearPorcentaje(panorama.fuenteMasNegativa.porcentaje)}** negativo).`,
    );
  }

  const tendencia =
    panorama.tendenciaNegativo === "alza"
      ? "El tono negativo está creciendo respecto al período anterior; prioriza las narrativas críticas."
      : panorama.tendenciaPositivo === "alza"
        ? "El tono positivo gana terreno frente al período anterior."
        : "El mix de sentimiento se mantiene relativamente estable entre períodos.";
  puntos.push(tendencia);

  return puntos;
}
