import { InfoIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

type Bleed = "sm" | "md" | "lg";
type Tono = "brand" | "danger";

const CLASES_BLEED: Record<Bleed, string> = {
  sm: "-mx-2.5 -mt-2.5 px-2.5 py-2 sm:-mx-3 sm:-mt-3 sm:px-3",
  md: "-mx-4 -mt-4 px-4 py-2.5",
  lg: "-mx-5 -mt-5 px-5 py-3",
};

const CLASES_FONDO: Record<Tono, string> = {
  brand: "bg-[linear-gradient(135deg,#2c0d5a_0%,#0056a4_62%,#1bb8e1_100%)]",
  danger: "bg-[linear-gradient(135deg,#4a0d20_0%,#dc2626_55%,#f87171_100%)]",
};

type CardTitleBarProps = {
  children: ReactNode;
  bleed?: Bleed;
  /** "danger" para secciones destructivas (ej. zona de riesgo, cancelar plan). */
  tono?: Tono;
  ayuda?: ReactNode;
  id?: string;
  className?: string;
};

/**
 * Header a ras de la card con degradado de marca. El frost va solo en el
 * chip del título: el body de la card no se pinta.
 */
export function CardTitleBar({
  children,
  bleed = "lg",
  tono = "brand",
  ayuda,
  id,
  className,
}: CardTitleBarProps) {
  return (
    <div
      id={id}
      className={cn(
        "mb-3 flex min-w-0 items-center rounded-t-lg",
        CLASES_FONDO[tono],
        CLASES_BLEED[bleed],
        className,
      )}
    >
      <div className="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full px-3 py-1 text-white">
        <h2 className="min-w-0 truncate text-sm font-semibold">{children}</h2>
        {ayuda ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="flex size-7 shrink-0 items-center justify-center rounded-full text-white/80 transition-colors duration-150 hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:scale-[0.97]"
                aria-label={typeof ayuda === "string" ? ayuda : undefined}
              >
                <InfoIcon className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              {ayuda}
            </TooltipContent>
          </Tooltip>
        ) : null}
      </div>
    </div>
  );
}
