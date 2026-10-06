import logoUnicornio from "@/assets/unicornio-logo-light.webp";

let logoPngCache: Promise<string> | null = null;

/** Relación de aspecto del logo (ancho/alto), tomada de los metadatos de Next.js en build-time. */
export const RELACION_ASPECTO_LOGO = logoUnicornio.width / logoUnicornio.height;

/**
 * jsPDF y PptxGenJS no soportan WEBP de forma confiable entre versiones, así que el logo se
 * rasteriza una sola vez a PNG (vía canvas) y se cachea en memoria: los 5 flujos de exportación
 * pueden dispararse varias veces en una misma sesión y no vale la pena repetir la conversión.
 */
export function cargarLogoPng(): Promise<string> {
  if (!logoPngCache) {
    logoPngCache = new Promise<string>((resolve, reject) => {
      const imagen = new window.Image();
      imagen.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = imagen.naturalWidth;
        canvas.height = imagen.naturalHeight;
        const contexto = canvas.getContext("2d");
        if (!contexto) {
          reject(new Error("No se pudo obtener el contexto 2D del canvas"));
          return;
        }
        contexto.drawImage(imagen, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      imagen.onerror = () =>
        reject(new Error("No se pudo cargar el logo de Unicornio"));
      imagen.src = logoUnicornio.src;
    });
  }
  return logoPngCache;
}
