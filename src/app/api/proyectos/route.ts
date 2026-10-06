import { NextResponse } from "next/server";
import { BackendError } from "@/lib/backend";
import { crearProyectoReal, obtenerProyectosReales } from "@/lib/proyectos-backend";
import { obtenerSesión } from "@/lib/session";
import type { SolicitudCrearProyecto } from "@/types";

export async function GET() {
  // true: este endpoint alimenta la lista de tarjetas de VistaProyectos
  // (carga inicial y refrescos tras crear/activar/eliminar) — ahí sí debe
  // traer la imagen real, a diferencia del selector del panel general.
  const { proyectos, resumen } = await obtenerProyectosReales(true);
  return NextResponse.json({ proyectos, resumen });
}

export async function POST(request: Request) {
  const sesión = await obtenerSesión();
  if (!sesión) {
    return NextResponse.json({ código: "401", mensaje: "No autenticado." }, { status: 401 });
  }

  const body = (await request.json()) as Partial<SolicitudCrearProyecto>;

  if (!body.nombre?.trim()) {
    return NextResponse.json(
      { código: "400", mensaje: "El nombre del proyecto es obligatorio" },
      { status: 400 },
    );
  }

  if (!body.tipo) {
    return NextResponse.json(
      { código: "400", mensaje: "El tipo de proyecto es obligatorio" },
      { status: 400 },
    );
  }

  if (!body.palabrasClave?.some((k) => k.tipo === "nombre")) {
    return NextResponse.json(
      { código: "400", mensaje: "Agrega al menos un nombre completo o alias del funcionario" },
      { status: 400 },
    );
  }

  if (!body.paises?.length) {
    return NextResponse.json(
      { código: "400", mensaje: "Selecciona al menos un país" },
      { status: 400 },
    );
  }

  if (body.paises.includes("MX") && !body.estadosMexico?.length) {
    return NextResponse.json(
      {
        código: "400",
        mensaje: "Selecciona al menos un estado de México",
      },
      { status: 400 },
    );
  }

  try {
    const proyecto = await crearProyectoReal(
      {
        nombre: body.nombre,
        descripcion: body.descripcion ?? "",
        tipo: body.tipo,
        imagenUrl: body.imagenUrl ?? null,
        palabrasClave: body.palabrasClave,
        paises: body.paises,
        estadosMexico: body.estadosMexico ?? [],
        idiomas: body.idiomas?.length ? body.idiomas : ["es"],
        redesConectadas: body.redesConectadas ?? [],
        fuentesNoticias: body.fuentesNoticias ?? [],
      },
      sesión.id,
    );

    // El backend real (sentiment-api) dispara el análisis automático él
    // mismo, dentro de su propio proceso, justo después de crear el
    // proyecto — ver runProjectAnalysisPipeline en server.js. Antes se
    // disparaba desde aquí con un fetch sin esperar la respuesta, pero ese
    // patrón es frágil en un Route Handler de Next.js: si el contexto de
    // esta request se cierra antes de que el fetch termine, la llamada se
    // pierde sin ningún error visible (así se quedó "Julio Menchaca Salazar"
    // con 0 menciones varios días). El backend, al vivir en un proceso que
    // corre indefinidamente, no tiene ese riesgo.

    return NextResponse.json(
      { mensaje: "Proyecto creado correctamente", proyecto },
      { status: 201 },
    );
  } catch (error) {
    const status = error instanceof BackendError ? error.status : 502;
    const mensaje =
      error instanceof BackendError
        ? error.message
        : "No se pudo conectar con el backend para crear el proyecto.";
    return NextResponse.json({ código: String(status), mensaje }, { status });
  }
}
