import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

type EstadoSinProyectosProps = {
  titulo: string;
  descripcion: string;
  className?: string;
};

export function EstadoSinProyectos({
  titulo,
  descripcion,
  className,
}: EstadoSinProyectosProps) {
  return (
    <Card
      className={cn(
        "border-dashed bg-bg-base px-6 py-12 text-center shadow-widget",
        className,
      )}
    >
      <p className="text-sm font-medium text-text-primary">{titulo}</p>
      <p className="mt-1 text-sm text-text-muted">{descripcion}</p>
    </Card>
  );
}
