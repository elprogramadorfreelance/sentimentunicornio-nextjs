import { jsPDF } from "jspdf";
import {
  dibujarMarcaDeAgua,
  dibujarPortadaPdf,
  dibujarTarjetasKpiPdf,
  insertarGraficaPdf,
  MARGEN_PDF,
} from "@/lib/reportes/estilo-pdf";
import {
  generarBarraComparativa,
  generarBarraSentimiento,
} from "@/lib/reportes/graficas-pdf";
import { cargarLogoPng } from "@/lib/reportes/logo";
import type { RespuestaDescargaInfografia } from "@/app/api/panorama/infografia/descarga/route";
import type { ResumenInfografia } from "@/types";

function fechaArchivo(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Tope de descargas agotado — el llamador lo distingue de un error real de red/backend. */
export class TopeDescargasError extends Error {
  tope: number;
  constructor(tope: number) {
    super("Se alcanzó el límite de descargas de Infografía de este plan.");
    this.tope = tope;
  }
}

/**
 * Registra la descarga contra el tope real del backend (plan Demo = 3,
 * ilimitado en planes pagados) ANTES de generar el PDF — así el conteo
 * refleja intentos reales de descarga, no solo clics en el botón. Si el
 * backend no responde, se deja generar (nunca bloquear al usuario por una
 * falla de red ajena a su plan).
 */
async function registrarIntentoDescarga(): Promise<RespuestaDescargaInfografia> {
  try {
    const res = await fetch("/api/panorama/infografia/descarga", { method: "POST" });
    if (!res.ok) return { permitido: true, restantes: null, tope: null };
    return (await res.json()) as RespuestaDescargaInfografia;
  } catch {
    return { permitido: true, restantes: null, tope: null };
  }
}

export async function descargarInfografiaPdf(
  datos: ResumenInfografia,
  diasPeriodo: number,
): Promise<RespuestaDescargaInfografia> {
  const registro = await registrarIntentoDescarga();
  if (!registro.permitido) throw new TopeDescargasError(registro.tope ?? 3);

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margen = MARGEN_PDF;
  const ancho = doc.internal.pageSize.getWidth() - margen * 2;
  let y = margen;

  const escribir = (
    texto: string,
    size = 11,
    estilo: "normal" | "bold" = "normal",
  ) => {
    doc.setFont("helvetica", estilo);
    doc.setFontSize(size);
    const lineas = doc.splitTextToSize(texto, ancho) as string[];
    for (const linea of lineas) {
      if (y > doc.internal.pageSize.getHeight() - margen) {
        doc.addPage();
        y = margen;
      }
      doc.text(linea, margen, y);
      y += size + 4;
    }
  };

  const logoPng = await cargarLogoPng();
  y = dibujarPortadaPdf(doc, {
    logoPng,
    titulo: "Infografía",
    subtitulo: datos.nombreProyecto,
    fecha: new Date().toLocaleString("es-MX"),
  });
  y += 8;

  escribir(`Panorama · últimos ${diasPeriodo} días`, 14, "bold");
  y += 4;

  y = dibujarTarjetasKpiPdf(doc, y, [
    { etiqueta: "Menciones totales", valor: datos.mencionesTotales.toLocaleString("es-MX") },
    { etiqueta: "Alcance total", valor: datos.alcanceTotal.toLocaleString("es-MX") },
    {
      etiqueta: "Cambio de menciones",
      // Nunca "N/D" (pedido explícito del cliente, 2026-10-02) — cuando el %
      // no es confiable (base del período anterior muy chica), se muestra el
      // delta absoluto real, que siempre es calculable.
      valor: datos.cambioMenciones == null
        ? `${datos.cambioMencionesAbsoluto > 0 ? "+" : ""}${datos.cambioMencionesAbsoluto}`
        : `${datos.cambioMenciones > 0 ? "+" : ""}${datos.cambioMenciones}%`,
    },
  ]);

  y = insertarGraficaPdf(
    doc,
    generarBarraSentimiento({
      positivo: datos.sentimiento.positivo,
      neutro: datos.sentimiento.neutro,
      negativo: datos.sentimiento.negativo,
    }),
    y,
  );

  if (datos.fuentesActivas.length > 0) {
    escribir("Fuentes activas", 13, "bold");
    y = insertarGraficaPdf(
      doc,
      generarBarraComparativa(
        datos.fuentesActivas.map((f) => f.nombre),
        datos.fuentesActivas.map((f) => f.total),
      ),
      y,
    );
  }

  if (datos.regiones.length > 0) {
    escribir("Regiones con mayor presencia", 13, "bold");
    y = insertarGraficaPdf(
      doc,
      generarBarraComparativa(
        datos.regiones.map((r) => r.region),
        datos.regiones.map((r) => r.menciones),
      ),
      y,
    );
  }

  if (datos.topEmisores.length > 0) {
    escribir("Top emisores", 13, "bold");
    y += 2;
    for (const emisor of datos.topEmisores.slice(0, 10)) {
      escribir(`${emisor.emisor} — ${emisor.menciones.toLocaleString("es-MX")} menciones`, 10);
    }
    y += 6;
  }

  if (datos.mencionesPopulares.length > 0) {
    escribir("Menciones destacadas", 13, "bold");
    y += 2;
    for (const mención of datos.mencionesPopulares.slice(0, 8)) {
      escribir(mención.título || mención.extracto, 10, "bold");
      escribir(`${mención.fuente} · ${mención.autor}`, 9);
      y += 4;
    }
  }

  // `tope` solo viene no-nulo para cuentas plan "basic" (ver
  // registrarDescargaInfografia en el backend) — se reutiliza esa misma
  // señal real para decidir la marca de agua, en vez de pasar el plan por
  // separado y arriesgar que se desincronicen.
  if (registro.tope != null) dibujarMarcaDeAgua(doc);
  doc.save(`infografia-${fechaArchivo()}.pdf`);
  return registro;
}
