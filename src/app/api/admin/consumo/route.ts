import { NextResponse } from "next/server";
import { backendGet, BackendError } from "@/lib/backend";
import { obtenerSesión, paramsSesión } from "@/lib/session";
import type { ConsumoUsuario } from "@/types";

/** Consumo real de IA por usuario (usage_logs) — panel de Super Usuario. */
export async function GET() {
  try {
    const sufijo = paramsSesión(await obtenerSesión());
    const data = await backendGet<ConsumoUsuario[]>(`/api/usage${sufijo ? `?${sufijo}` : ""}`);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    if (error instanceof BackendError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    }
    return NextResponse.json({ ok: false, message: "No se pudo conectar con el backend." }, { status: 502 });
  }
}
