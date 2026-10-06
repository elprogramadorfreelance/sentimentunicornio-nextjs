import { NextResponse } from "next/server";
import { RESUMEN_DASHBOARD_MOCK } from "@/lib/mock/data";

export function GET() {
  return NextResponse.json(RESUMEN_DASHBOARD_MOCK);
}
