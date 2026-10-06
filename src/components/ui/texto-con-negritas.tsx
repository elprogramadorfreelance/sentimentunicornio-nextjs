/**
 * Parsea markdown mínimo (`**negrita**`) dentro de un texto generado con
 * datos reales — para los resúmenes IA que ahora marcan sus cifras en
 * negrita (ver lib/mock/resumen-ia-proyectos.ts y similares). No es un
 * parser de markdown completo a propósito: solo cubre el único patrón que
 * estos textos generan.
 */
export function TextoConNegritas({ texto }: { texto: string }) {
  const partes = texto.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <>
      {partes.map((parte, índice) =>
        parte.startsWith("**") && parte.endsWith("**") ? (
          <strong key={índice} className="font-semibold text-text-primary">
            {parte.slice(2, -2)}
          </strong>
        ) : (
          <span key={índice}>{parte}</span>
        ),
      )}
    </>
  );
}
