import { NextResponse } from "next/server";
import { BackendError, backendPost } from "@/lib/backend";
import { obtenerSesión } from "@/lib/session";

export type ResumenIaPanelLlm = { titular: string; parrafo: string; bullets: string[] };

export async function POST(request: Request) {
  const sesión = await obtenerSesión();
  if (!sesión) {
    return NextResponse.json({ código: "401", mensaje: "No autenticado." }, { status: 401 });
  }
  const datos = await request.json().catch(() => null);
  if (!datos || typeof datos !== "object") {
    return NextResponse.json({ código: "400", mensaje: "Solicitud inválida." }, { status: 400 });
  }
  try {
    const respuesta = await backendPost<ResumenIaPanelLlm>("/api/ai/resumen-proyectos", datos);
    if (!respuesta.data) {
      return NextResponse.json({ código: "502", mensaje: "Respuesta vacía de la IA." }, { status: 502 });
    }
    return NextResponse.json(respuesta.data);
  } catch (error) {
    const status = error instanceof BackendError ? error.status : 502;
    return NextResponse.json(
      { código: String(status), mensaje: "No se pudo generar el resumen." },
      { status },
    );
  }
}
