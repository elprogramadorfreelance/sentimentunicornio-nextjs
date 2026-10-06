import { WrenchIcon } from "lucide-react";
import { useTranslations } from "next-intl";

type PaginaEnConstruccionProps = {
  titulo: string;
  descripcion: string;
};

/**
 * Placeholder honesto de página completa para secciones del menú que ya
 * tienen ruta real pero cuya funcionalidad todavía no se construye — mejor
 * esto que un 404 en blanco o un link muerto al sitio anterior.
 */
export function PaginaEnConstruccion({ titulo, descripcion }: PaginaEnConstruccionProps) {
  const t = useTranslations("dashboard");
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-bg-subtle">
        <WrenchIcon className="size-7 text-text-muted" aria-hidden />
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
        {t("comingSoon")}
      </span>
      <h1 className="text-xl font-bold text-text-primary">{titulo}</h1>
      <p className="max-w-md text-sm text-text-muted">{descripcion}</p>
    </div>
  );
}
