type VarianteBadge =
  | "default"
  | "positivo"
  | "negativo"
  | "neutral"
  | "warning"
  | "error";

type BadgeProps = {
  children: React.ReactNode;
  variante?: VarianteBadge;
  className?: string;
};

const ESTILOS: Record<VarianteBadge, string> = {
  default: "bg-bg-muted text-text-secondary",
  positivo: "bg-success/10 text-success",
  negativo: "bg-error/10 text-error",
  neutral: "bg-bg-muted text-text-muted",
  warning: "bg-warning/20 text-text-primary",
  error: "bg-error/10 text-error",
};

export function Badge({
  children,
  variante = "default",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTILOS[variante]} ${className}`}
    >
      {children}
    </span>
  );
}
