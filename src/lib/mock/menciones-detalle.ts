import type {
  FiltrosMencionesDetalle,
  FuenteMenciónDetalle,
  MenciónDetalle,
  Proyecto,
  RespuestaMencionesDetalle,
  TipoFuenteMención,
} from "@/types";

export const FUENTES_MENCIÓN_DETALLE: FuenteMenciónDetalle[] = [
  { id: "x", nombre: "X", categoría: "red_social" },
  { id: "facebook", nombre: "Facebook", categoría: "red_social" },
  { id: "instagram", nombre: "Instagram", categoría: "red_social" },
  { id: "youtube", nombre: "YouTube", categoría: "red_social" },
  { id: "tiktok", nombre: "TikTok", categoría: "red_social" },
  { id: "noticias", nombre: "Noticias digitales", categoría: "medio" },
  { id: "blogs", nombre: "Blogs y opinión", categoría: "medio" },
];

const AUTORES = [
  "María Hernández",
  "Carlos Mendoza",
  "Sofía Valenzuela",
  "Luis Robles",
  "Fernanda Cortés",
  "Diego Santamaría",
  "Ana Torres",
  "Roberto Salas",
];

const CONTENIDOS = [
  "La conversación se concentra en los resultados recientes y en las expectativas para las próximas semanas.",
  "Usuarios destacan avances, aunque solicitan mayor claridad sobre los tiempos y alcances de la estrategia.",
  "El anuncio generó reacciones inmediatas entre medios, especialistas y comunidades digitales.",
  "La cobertura retoma declaraciones recientes y compara la percepción ciudadana en distintas regiones.",
  "Crece el interés por las acciones en territorio y su impacto en la agenda pública local.",
  "El tema vuelve a posicionarse por nuevas publicaciones, comentarios y análisis de especialistas.",
  "La conversación sobre la próxima elección reúne opiniones, propuestas y dudas sobre su implementación.",
  "Medios regionales amplían la cobertura con datos, testimonios y contexto sobre el anuncio.",
  "La publicación registra una conversación principalmente informativa con preguntas de la audiencia.",
  "Nuevas menciones relacionan el proyecto con seguridad, movilidad y desarrollo económico.",
  "La audiencia comparte fragmentos del mensaje y añade experiencias personales a la conversación.",
  "Analistas señalan oportunidades para mejorar la comunicación y responder a inquietudes frecuentes.",
];

const USUARIOS_POR_FUENTE: Record<TipoFuenteMención, string[]> = {
  x: ["@AgendaPublica", "@PulsoMX", "@ContextoAhora"],
  facebook: ["Comunidad Informada", "Noticias al Día", "Voces Locales"],
  instagram: ["@enfoque.mx", "@actualidadvisual", "@noticiaslocales"],
  youtube: ["Análisis Público", "Noticias 360", "Punto de Encuentro"],
  tiktok: ["@agenda.mx", "@pulsopublico", "@contextoahora"],
  noticias: ["El Universal", "Milenio", "Expansión Política"],
  blogs: ["Observatorio Público", "Perspectiva Nacional", "Agenda Abierta"],
};

const SENTIMIENTOS = ["positivo", "neutral", "negativo"] as const;

function normalizarTexto(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es-MX");
}

function generarMenciones(proyectos: Proyecto[]): MenciónDetalle[] {
  const inicio = new Date("2026-08-08T12:00:00-06:00");

  return Array.from({ length: 180 }, (_, índice) => {
    const fuente =
      FUENTES_MENCIÓN_DETALLE[índice % FUENTES_MENCIÓN_DETALLE.length];
    const proyecto = proyectos[índice % proyectos.length];
    const usuarios = USUARIOS_POR_FUENTE[fuente.id];
    const autor = AUTORES[índice % AUTORES.length];
    const publicadaEn = new Date(
      inicio.getTime() - índice * 47 * 60 * 1000,
    ).toISOString();

    return {
      id: `detalle-${índice + 1}`,
      proyectoId: proyecto.id,
      tipoFuente: fuente.id,
      fuente: fuente.nombre,
      autor,
      usuario: usuarios[índice % usuarios.length],
      contenido: `${CONTENIDOS[índice % CONTENIDOS.length]} ${proyecto.nombre} forma parte central de esta mención.`,
      url: `https://example.com/menciones/detalle/${índice + 1}`,
      publicadaEn,
      sentimiento:
        SENTIMIENTOS[
          (Math.floor(índice / FUENTES_MENCIÓN_DETALLE.length) + índice + 1) %
            SENTIMIENTOS.length
        ],
      alcance: 8_400 + ((índice * 7_913) % 280_000),
      interacciones: 120 + ((índice * 347) % 18_000),
      compartidos: 18 + ((índice * 89) % 4_200),
    };
  });
}

export function obtenerMencionesDetalleMock(
  proyectos: Proyecto[],
  filtros: FiltrosMencionesDetalle,
): RespuestaMencionesDetalle {
  const página = Math.max(1, filtros.página ?? 1);
  const tamaño = Math.min(48, Math.max(6, filtros.tamaño ?? 24));
  const búsqueda = normalizarTexto(filtros.búsqueda?.trim() ?? "");
  const fuentes = filtros.fuentes ?? [];

  const filtradas = generarMenciones(proyectos).filter((mención) => {
    if (filtros.proyectoId && mención.proyectoId !== filtros.proyectoId) {
      return false;
    }
    if (fuentes.length > 0 && !fuentes.includes(mención.tipoFuente)) {
      return false;
    }
    if (filtros.sentimiento && mención.sentimiento !== filtros.sentimiento) {
      return false;
    }
    if (
      búsqueda &&
      !normalizarTexto(
        `${mención.contenido} ${mención.autor} ${mención.usuario} ${mención.fuente}`,
      ).includes(búsqueda)
    ) {
      return false;
    }
    return true;
  });

  const inicio = (página - 1) * tamaño;
  const menciones = filtradas.slice(inicio, inicio + tamaño);
  const totalPorFuente: Partial<Record<TipoFuenteMención, number>> = {};
  for (const m of filtradas) {
    totalPorFuente[m.tipoFuente] = (totalPorFuente[m.tipoFuente] ?? 0) + 1;
  }

  return {
    menciones,
    página,
    tamaño,
    total: filtradas.length,
    hayMás: inicio + menciones.length < filtradas.length,
    totalPorFuente,
  };
}
