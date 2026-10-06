import { NextResponse } from "next/server";
import { cerrarSesión } from "@/lib/session";

export async function POST() {
  await cerrarSesión();
  return NextResponse.json({ mensaje: "Sesión cerrada" });
}
