import { NextResponse } from "next/server";
import { BackendError } from "@/lib/backend";
import {
  actualizarProyectoReal,
  archivarProyectoReal,
  cambiarEstadoProyectoReal,
  obtenerProyectoRealCompleto,
} from "@/lib/proyectos-backend";
import type {
  RespuestaActualizarProyecto,
  RespuestaCambiarEstadoProyecto,
  RespuestaEliminarProyecto,
  SolicitudActualizarProyecto,
  SolicitudCambiarEstadoProyecto,
} from "@/types";

type ParamsRuta = { params: Promise<{ id: string }> };

function respuestaError(error: unknown) {
  const status = error instanceof BackendError ? error.status : 502;
  const mensaje =
    error instanceof BackendError
      ? error.message
      : "No se pudo conectar con el backend.";
  return NextResponse.json({ código: String(status), mensaje }, { status });
}

export async function GET(_request: Request, { params }: ParamsRuta) {
  const { id } = await params;
  const proyecto = await obtenerProyectoRealCompleto(id);
  if (!proyecto) {
    return NextResponse.json(
      { código: "404", mensaje: "Proyecto no encontrado" },
      { status: 404 },
    );
  }
  return NextResponse.json({ proyecto });
}

export async function PUT(request: Request, { params }: ParamsRuta) {
  const { id } = await params;
  const body = (await request.json()) as Partial<SolicitudActualizarProyecto>;

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
    const proyecto = await actualizarProyectoReal(id, {
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
    });

    const respuesta: RespuestaActualizarProyecto = {
      mensaje: "Proyecto actualizado correctamente",
      proyecto,
    };
    return NextResponse.json(respuesta);
  } catch (error) {
    return respuestaError(error);
  }
}

export async function PATCH(request: Request, { params }: ParamsRuta) {
  const { id } = await params;
  const body = (await request.json()) as Partial<SolicitudCambiarEstadoProyecto>;

  if (body.estado !== "activo" && body.estado !== "inactivo") {
    return NextResponse.json(
      { código: "400", mensaje: "El estado debe ser activo o inactivo" },
      { status: 400 },
    );
  }

  try {
    const proyecto = await cambiarEstadoProyectoReal(id, body.estado);
    const respuesta: RespuestaCambiarEstadoProyecto = {
      mensaje:
        body.estado === "inactivo"
          ? "Proyecto desactivado correctamente"
          : "Proyecto activado correctamente",
      proyecto,
    };
    return NextResponse.json(respuesta);
  } catch (error) {
    return respuestaError(error);
  }
}

export async function DELETE(_request: Request, { params }: ParamsRuta) {
  const { id } = await params;
  try {
    // El backend real archiva en vez de borrar físicamente el registro.
    await archivarProyectoReal(id);
    const respuesta: RespuestaEliminarProyecto = {
      mensaje: "Proyecto eliminado correctamente",
      id,
    };
    return NextResponse.json(respuesta);
  } catch (error) {
    return respuestaError(error);
  }
}
