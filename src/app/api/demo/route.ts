import { NextResponse } from "next/server";
import { BackendError, backendPost } from "@/lib/backend";
import type { RespuestaDemo, SolicitudDemo } from "@/types";

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<SolicitudDemo>;

  if (!body.nombre?.trim() || !body.email?.trim()) {
    return NextResponse.json(
      { código: "400", mensaje: "Nombre y correo son obligatorios" },
      { status: 400 },
    );
  }

  try {
    await backendPost("/api/demo-requests", {
      nombre: body.nombre,
      apellidos: body.apellidos ?? "",
      telefono: body.telefono ?? "",
      email: body.email,
      comentario: body.comentario ?? "",
    });
    const respuesta: RespuestaDemo = {
      mensaje: "Gracias. Te contactaremos pronto para agendar la demo.",
    };
    return NextResponse.json(respuesta);
  } catch (error) {
    const status = error instanceof BackendError ? error.status : 502;
    const mensaje =
      error instanceof BackendError
        ? error.message
        : "No se pudo registrar la solicitud. Intenta de nuevo.";
    return NextResponse.json({ código: String(status), mensaje }, { status });
  }
}
