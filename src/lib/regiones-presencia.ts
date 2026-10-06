// Función pura, sin imports de servidor — se separó de menciones-backend.ts
// (que sí tiene imports server-only) para que componentes cliente puedan
// importarla directo sin arrastrar todo ese módulo al bundle del navegador
// (mismo problema real que tuvo rutaDestinoAlerta, 2026-10-01). Una sola
// implementación real, reexportada desde menciones-backend.ts para no
// duplicarla — evita que una copia se quede desactualizada como pasó antes
// con estimarAlcance en resumen-narrativas-cliente.ts.
import type { MenciónEditorial } from "@/types";

/**
 * Regiones con mayor presencia — real, usando la región del proyecto de cada
 * mención. El campo `region` de un proyecto puede venir como varias regiones
 * separadas por coma ("Quintana Roo, Sonora, Sinaloa..." para un proyecto de
 * cobertura nacional) — NO hay región por mención (ninguna fuente real la
 * trae), solo cobertura declarada a nivel proyecto, así que no existe forma
 * honesta de saber cuántas de las menciones de ese proyecto corresponden a
 * CADA estado individual. Dos intentos anteriores lo forzaron igual: sumar
 * el conteo completo a cada región listada (inflaba la suma N veces) y
 * repartir 1/N entre ellas (ya no inflaba, pero las N regiones de un mismo
 * proyecto seguían saliendo con el mismo número — bug real reportado 2 veces
 * por el cliente, 2026-10-01, con capturas mostrando "Quintana Roo",
 * "Sonora", "Sinaloa"… todas idénticas). La solución honesta es no fingir
 * ese desglose: cada entrada es la cobertura declarada TAL CUAL vino del
 * proyecto (una o varias regiones juntas) con su total real de menciones,
 * sin partir el string. El widget que consume esto (PaisesCoberturaWidget)
 * es quien decide cómo pintar el mapa con esta misma agrupación.
 */
export function calcularRegionesPresencia(
  menciones: MenciónEditorial[],
  regiónPorProyecto: Map<string, string>,
): { region: string; menciones: number }[] {
  const conteo = new Map<string, number>();
  for (const m of menciones) {
    const región = regiónPorProyecto.get(m.proyectoId) || "Sin región";
    conteo.set(región, (conteo.get(región) ?? 0) + 1);
  }
  return Array.from(conteo.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([region, total]) => ({ region, menciones: total }));
}
