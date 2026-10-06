import type { AlcanceMapaNarrativas } from "@/types";

export type { AlcanceMapaNarrativas };

export const GEO_MAPA_NARRATIVAS: Record<AlcanceMapaNarrativas, string> = {
  mexico: "/data/mexico-estados.json",
  espana: "/data/espana-comunidades.json",
  mundo: "/data/world-countries.json",
};

/** Territorios polares que distorsionan Mercator y no aportan lectura. */
export const IDS_OMITIR_MAPA_MUNDO = ["ATA", "ATF", "GRL"];

/**
 * Unión de países (ISO 3166-1 alpha-2) de los proyectos visibles.
 * Un solo país con mapa propio (MX, ES) usa ese recorte; cualquier
 * mixto, otro país o alcance global cae al mapamundi.
 */
export function resolverAlcanceMapa(paises: string[]): AlcanceMapaNarrativas {
  const únicos = [
    ...new Set(
      paises.map((código) => código.trim().toUpperCase()).filter(Boolean),
    ),
  ];
  if (únicos.length === 1 && únicos[0] === "MX") return "mexico";
  if (únicos.length === 1 && únicos[0] === "ES") return "espana";
  return "mundo";
}
