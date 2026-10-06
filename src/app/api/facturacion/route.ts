import { NextResponse } from "next/server";
import { BackendError } from "@/lib/backend";
import { obtenerFacturaciónReal } from "@/lib/facturacion-backend";
import { obtenerSesión } from "@/lib/session";

export async function GET() {
  const sesión = await obtenerSesión();
  if (!sesión) return NextResponse.json({ código: "401", mensaje: "No autenticado." }, { status: 401 });

  try {
    const data = await obtenerFacturaciónReal(sesión.id);
    return NextResponse.json(data);
  } catch (error) {
    const status = error instanceof BackendError ? error.status : 502;
    const mensaje = error instanceof BackendError ? error.message : "No se pudo cargar la facturación.";
    return NextResponse.json({ código: String(status), mensaje }, { status });
  }
}
