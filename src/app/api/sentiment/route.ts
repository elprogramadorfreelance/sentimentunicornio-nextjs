import { NextResponse } from "next/server";
import type { PuntuaciónSentimiento } from "@/types";

export function GET() {
  const sentimiento: PuntuaciónSentimiento = {
    categoría: "positivo",
    puntuación: 73,
    confianza: 0.87,
  };
  return NextResponse.json(sentimiento);
}
