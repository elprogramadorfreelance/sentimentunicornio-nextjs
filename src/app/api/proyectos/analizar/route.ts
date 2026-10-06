import { NextResponse } from "next/server";
import { BackendError, backendPost } from "@/lib/backend";
import { crearProyectoReal, type ProyectoBackend } from "@/lib/proyectos-backend";
import { obtenerSesión } from "@/lib/session";
import type { RespuestaAnalizarConversacion, SolicitudAnalizarConversacion } from "@/types";

// Crea un proyecto a partir de un tema libre (buscador del Dashboard) y
// dispara sobre él el análisis real de sentiment-api: ingesta RSS + búsquedas
// en vivo (Google News, YouTube, GDELT, Web Search, medios de Hidalgo,
// X/Twitter, Perplexity) + síntesis con IA — el mismo pipeline que "Analizar
// ahora" en el detalle de proyecto. Tarda hasta ~30s y consume créditos
// reales de OpenAI/Perplexity/etc. en cada llamada.
export async function POST(request: Request) {
  const sesión = await obtenerSesión();
  if (!sesión) {
    return NextResponse.json({ código: "401", mensaje: "No autenticado." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | Partial<SolicitudAnalizarConversacion>
    | null;
  const tema = body?.tema?.trim();

  // Mínimo 4, no 3 — mismo umbral que LARGO_MÍNIMO_BUSQUEDA (server.js), el
  // guardado agregado 2026-10-02 tras el incidente real de SEMARNAT ("GPO",
  // 3 letras, colisionó con Roblox). Se valida AQUÍ, antes de crear nada: si
  // solo se confiara en el guardado del backend (que corre después de crear
  // el proyecto, al guardar las palabras clave), un término corto dejaría un
  // proyecto fantasma creado sin palabras clave cuando ese guardado lo
  // rechazara — peor que no crear nada.
  if (!tema || tema.length < 4) {
    return NextResponse.json(
      { código: "400", mensaje: "Escribe un tema de al menos 4 caracteres — los términos muy cortos chocan con temas ajenos." },
      { status: 400 },
    );
  }

  try {
    const proyecto = await crearProyectoReal(
      {
        nombre: tema.slice(0, 80),
        descripcion: "",
        tipo: "otro",
        imagenUrl: null,
        // tipo "busqueda", no "nombre" (2026-10-02): este cuadro es texto
        // libre de lo que sea que el usuario quiera monitorear, no
        // necesariamente el nombre de un funcionario — semánticamente es la
        // misma categoría de riesgo que "Búsquedas asociadas" en el
        // formulario completo, y así también queda protegido por el mismo
        // guardado de largo mínimo del lado del backend (defensa en
        // profundidad, además del check de arriba).
        palabrasClave: [{ palabra: tema, tipo: "busqueda" }],
        paises: ["MX"],
        estadosMexico: [],
        idiomas: ["es"],
        redesConectadas: [],
        fuentesNoticias: [],
      },
      sesión.id,
    );

    try {
      await backendPost<ProyectoBackend>(`/api/projects/${proyecto.id}/analyze`, {});
    } catch (errorAnálisis) {
      // El proyecto ya quedó creado aunque el análisis falle — se puede
      // reintentar después desde su detalle ("Analizar ahora").
      const mensaje =
        errorAnálisis instanceof BackendError
          ? errorAnálisis.message
          : "No se pudo completar el análisis en vivo.";
      return NextResponse.json(
        { código: "502", mensaje: `Proyecto "${tema}" creado, pero el análisis falló: ${mensaje}` },
        { status: 502 },
      );
    }

    const respuesta: RespuestaAnalizarConversacion = {
      mensaje: `Análisis completado para "${tema}".`,
      proyecto,
    };
    return NextResponse.json(respuesta, { status: 201 });
  } catch (error) {
    const status = error instanceof BackendError ? error.status : 502;
    const mensaje =
      error instanceof BackendError
        ? error.message
        : "No se pudo conectar con el backend para analizar.";
    return NextResponse.json({ código: String(status), mensaje }, { status });
  }
}
