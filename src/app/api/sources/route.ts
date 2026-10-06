import { NextResponse } from "next/server";
import { FUENTES_MOCK } from "@/lib/mock/data";

export function GET() {
  return NextResponse.json(FUENTES_MOCK);
}
