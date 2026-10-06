// Agregación real de menciones por país — usa el country_code real de cada
// proyecto (ver multipaís, 2026-08-31), nunca inventado. Bruno ya trae el
// GeoJSON del mundo real en public/data/world-countries.json (ids ISO
// alpha-3); nuestros proyectos guardan alpha-2, de ahí el mapeo de abajo.
import type { MenciónEditorial } from "@/types";
import type { PaisMapa } from "@/components/charts/grafica-mapa-paises";

const ALPHA2_A_ALPHA3: Record<string, string> = {
  MX: "MEX",
  US: "USA",
  ES: "ESP",
  AR: "ARG",
  CO: "COL",
  CL: "CHL",
  PE: "PER",
  BR: "BRA",
};

const NOMBRES_PAIS: Record<string, string> = {
  MX: "México",
  US: "Estados Unidos",
  ES: "España",
  AR: "Argentina",
  CO: "Colombia",
  CL: "Chile",
  PE: "Perú",
  BR: "Brasil",
};

export function calcularPaisesConMenciones(
  menciones: MenciónEditorial[],
  proyectos: { id: string; countryCode: string }[],
): PaisMapa[] {
  const paísPorProyecto = new Map(proyectos.map((p) => [p.id, p.countryCode.toUpperCase()]));
  const conteo = new Map<string, number>();
  for (const m of menciones) {
    const país = paísPorProyecto.get(m.proyectoId);
    if (!país) continue;
    conteo.set(país, (conteo.get(país) ?? 0) + 1);
  }
  return Array.from(conteo.entries())
    .map(([código, total]) => ({
      codigoIso3: ALPHA2_A_ALPHA3[código] ?? código,
      pais: NOMBRES_PAIS[código] ?? código,
      menciones: total,
    }))
    .filter((p) => p.codigoIso3.length === 3)
    .sort((a, b) => b.menciones - a.menciones);
}
