import { type NextRequest, NextResponse } from "next/server";
import { crearReglaAlerta, obtenerReglasAlerta } from "@/lib/alert-rules-backend";
import { BackendError } from "@/lib/backend";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const proyectoId = searchParams.get("proyecto");
  if (!proyectoId) return NextResponse.json({ código: "400", mensaje: "Falta el proyecto." }, { status: 400 });

  try {
    const reglas = await obtenerReglasAlerta(proyectoId);
    return NextResponse.json({ reglas });
  } catch (error) {
    const status = error instanceof BackendError ? error.status : 502;
    const mensaje = error instanceof BackendError ? error.message : "No se pudo conectar con el backend.";
    return NextResponse.json({ código: String(status), mensaje }, { status });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { proyectoId, tipo, valor, fechaInicio, fechaFin } = body;
  if (!proyectoId || !tipo || !valor?.trim() || !fechaInicio || !fechaFin) {
    return NextResponse.json({ código: "400", mensaje: "Completa todos los campos." }, { status: 400 });
  }

  try {
    const regla = await crearReglaAlerta(proyectoId, { tipo, valor: valor.trim(), fechaInicio, fechaFin });
    return NextResponse.json({ regla }, { status: 201 });
  } catch (error) {
    const status = error instanceof BackendError ? error.status : 502;
    const mensaje = error instanceof Error ? error.message : "No se pudo crear la regla.";
    return NextResponse.json({ código: String(status), mensaje }, { status });
  }
}
