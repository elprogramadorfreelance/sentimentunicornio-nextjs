import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendGet, backendPost, BackendError } from "@/lib/backend";
import type { OrganizaciónAdmin } from "@/types";

export async function GET() {
  try {
    const data = await backendGet<OrganizaciónAdmin[]>("/api/organizations");
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    if (error instanceof BackendError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    }
    return NextResponse.json({ ok: false, message: "No se pudo conectar con el backend." }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  const { name, plan, max_projects } = await request.json();
  if (!name) return NextResponse.json({ ok: false, message: "Nombre requerido." }, { status: 400 });
  try {
    const respuesta = await backendPost<OrganizaciónAdmin>("/api/organizations", { name, plan, max_projects });
    return NextResponse.json({ ok: true, data: respuesta.data });
  } catch (error) {
    if (error instanceof BackendError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    }
    return NextResponse.json({ ok: false, message: "No se pudo crear la organización." }, { status: 502 });
  }
}
