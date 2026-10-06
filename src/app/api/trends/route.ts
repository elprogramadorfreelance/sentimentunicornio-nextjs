import { type NextRequest, NextResponse } from "next/server";
import { TENDENCIAS_MOCK } from "@/lib/mock/data";

export function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const días = Number(searchParams.get("días") ?? 7);

  // Devolver solo los últimos N días solicitados
  const datos = TENDENCIAS_MOCK.slice(-días);
  return NextResponse.json(datos);
}
