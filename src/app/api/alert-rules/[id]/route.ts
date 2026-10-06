import { type NextRequest, NextResponse } from "next/server";
import { actualizarReglaAlerta, eliminarReglaAlerta } from "@/lib/alert-rules-backend";
import { BackendError } from "@/lib/backend";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { proyectoId, valor, fechaInicio, fechaFin, activa } = body;
  if (!proyectoId) return NextResponse.json({ código: "400", mensaje: "Falta el proyecto." }, { status: 400 });

  try {
    const regla = await actualizarReglaAlerta(proyectoId, id, { valor, fechaInicio, fechaFin, activa });
    return NextResponse.json({ regla });
  } catch (error) {
    const status = error instanceof BackendError ? error.status : 502;
    const mensaje = error instanceof Error ? error.message : "No se pudo actualizar la regla.";
    return NextResponse.json({ código: String(status), mensaje }, { status });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const proyectoId = searchParams.get("proyecto");
  if (!proyectoId) return NextResponse.json({ código: "400", mensaje: "Falta el proyecto." }, { status: 400 });

  try {
    await eliminarReglaAlerta(proyectoId, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = error instanceof BackendError ? error.status : 502;
    const mensaje = error instanceof Error ? error.message : "No se pudo eliminar la regla.";
    return NextResponse.json({ código: String(status), mensaje }, { status });
  }
}
