"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { UploadIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components/ui";
import { apiCrearTicket } from "@/lib/api";
import { cn } from "@/lib/utils";

function crearEsquemaReporte(t: ReturnType<typeof useTranslations<"support">>) {
  return z.object({
    tipoError: z.string().min(1, t("typeRequired")),
    seccion: z.string().min(1, t("sectionRequired")),
    prioridad: z.enum(["normal", "urgente", "critico"]),
    descripcion: z
      .string()
      .min(1, t("descRequired"))
      .min(20, t("descMin")),
  });
}

type FormularioReporte = z.infer<ReturnType<typeof crearEsquemaReporte>>;

const VALORES_INICIALES: FormularioReporte = {
  tipoError: "",
  seccion: "",
  prioridad: "normal",
  descripcion: "",
};

type FormularioReporteProps = {
  userId: string;
  onTicketCreado?: () => void;
};

export function FormularioReporte({ userId, onTicketCreado }: FormularioReporteProps) {
  const t = useTranslations("support");
  const tCommon = useTranslations("common");
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [arrastrando, setArrastrando] = useState(false);

  const TIPOS_ERROR = useMemo(
    () =>
      [
        { value: "visualizacion", label: t("typeVisual") },
        { value: "datos", label: t("typeData") },
        { value: "acceso", label: t("typeAccess") },
        { value: "rendimiento", label: t("typePerformance") },
        { value: "otro", label: t("typeOther") },
      ] as const,
    [t],
  );

  const SECCIONES = useMemo(
    () =>
      [
        { value: "dashboard", label: t("sectionDashboard") },
        { value: "proyectos", label: t("sectionProjects") },
        { value: "sentimiento", label: t("sectionSentiment") },
        { value: "monitoreo", label: t("sectionMonitoring") },
        { value: "origenes", label: t("sectionOrigins") },
        { value: "configuracion", label: t("sectionSettings") },
        { value: "otro", label: t("typeOther") },
      ] as const,
    [t],
  );

  const PRIORIDADES = useMemo(
    () =>
      [
        { value: "normal", label: t("priorityNormal") },
        { value: "urgente", label: t("priorityUrgent") },
        { value: "critico", label: t("priorityCritical") },
      ] as const,
    [t],
  );

  const esquemaReporte = useMemo(() => crearEsquemaReporte(t), [t]);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormularioReporte>({
    resolver: zodResolver(esquemaReporte),
    defaultValues: VALORES_INICIALES,
  });

  function limpiar() {
    reset(VALORES_INICIALES);
    setArchivo(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function asignarArchivo(file: File | null) {
    if (!file) {
      setArchivo(null);
      return;
    }
    const maxMb = 10;
    if (file.size > maxMb * 1024 * 1024) {
      toast.error(t("fileTooLarge"), {
        description: t("fileLimit", { n: maxMb }),
      });
      return;
    }
    setArchivo(file);
  }

  async function onSubmit(datos: FormularioReporte) {
    // El adjunto no viaja todavía — el backend no tiene subida de archivos
    // para tickets. El reporte real (tipo, sección, prioridad, descripción)
    // sí se guarda y dispara el correo real de "ticket recibido".
    void archivo;
    try {
      const tipoLabel =
        TIPOS_ERROR.find((opcion) => opcion.value === datos.tipoError)?.label ?? datos.tipoError;
      const seccionLabel =
        SECCIONES.find((opcion) => opcion.value === datos.seccion)?.label ?? datos.seccion;
      const ticket = await apiCrearTicket({
        userId,
        tipoError: tipoLabel,
        seccion: seccionLabel,
        prioridad: datos.prioridad,
        descripcion: datos.descripcion,
      });
      toast.success(t("reportSentToast", { id: ticket.ticket_id }), {
        description: t("toastSuccessDesc"),
      });
      limpiar();
      onTicketCreado?.();
    } catch (err) {
      toast.error(t("reportSendFailed"), {
        description: err instanceof Error ? err.message : tCommon("tryAgainLater"),
      });
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-2xl border border-border-default/40 bg-bg-base p-5 shadow-[0_8px_30px_rgba(22,23,18,0.06)] sm:p-8"
      noValidate
    >
      <header className="mb-6 border-b border-border-default/50 pb-4">
        <h2 className="text-xs font-bold tracking-[0.12em] text-text-muted uppercase">
          {t("formHeading")}
        </h2>
      </header>

      <div className="flex flex-col gap-5 sm:gap-6">
        {/* Tipo + Sección: stack en mobile */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-4">
          <div className="space-y-2">
            <Label htmlFor="tipo-error" className="text-text-secondary">
              {t("errorType")} <span className="text-error">*</span>
            </Label>
            <Controller
              name="tipoError"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || undefined}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id="tipo-error"
                    aria-invalid={!!errors.tipoError}
                    className="h-11 bg-bg-subtle"
                  >
                    <SelectValue placeholder={t("selectPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_ERROR.map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.tipoError && (
              <p className="text-xs text-error">{errors.tipoError.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="seccion" className="text-text-secondary">
              {t("section")} <span className="text-error">*</span>
            </Label>
            <Controller
              name="seccion"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || undefined}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id="seccion"
                    aria-invalid={!!errors.seccion}
                    className="h-11 bg-bg-subtle"
                  >
                    <SelectValue placeholder={t("wherePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {SECCIONES.map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.seccion && (
              <p className="text-xs text-error">{errors.seccion.message}</p>
            )}
          </div>
        </div>

        {/* Prioridad */}
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-text-secondary">
            {t("priority")}
          </legend>
          <Controller
            name="prioridad"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {PRIORIDADES.map((op) => {
                  const activo = field.value === op.value;
                  return (
                    <button
                      key={op.value}
                      type="button"
                      aria-pressed={activo}
                      onClick={() => field.onChange(op.value)}
                      className={cn(
                        "h-10 cursor-pointer rounded-lg border text-sm font-semibold transition-colors duration-200",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                        activo
                          ? "border-navy bg-navy text-white"
                          : "border-border-default bg-bg-base text-text-muted hover:border-border-strong hover:text-text-secondary",
                      )}
                    >
                      {op.label}
                    </button>
                  );
                })}
              </div>
            )}
          />
        </fieldset>

        {/* Descripción */}
        <div className="space-y-2">
          <Label htmlFor="descripcion" className="text-text-secondary">
            {tCommon("description")} <span className="text-error">*</span>
          </Label>
          <Textarea
            id="descripcion"
            rows={5}
            placeholder={t("descriptionPlaceholder")}
            aria-invalid={!!errors.descripcion}
            className="min-h-32"
            {...register("descripcion")}
          />
          {errors.descripcion && (
            <p className="text-xs text-error">{errors.descripcion.message}</p>
          )}
        </div>

        {/* Adjunto opcional */}
        <div>
          <input
            ref={fileInputRef}
            id={fileInputId}
            type="file"
            accept="image/*,.pdf,.png,.jpg,.jpeg,.webp"
            className="sr-only"
            onChange={(e) => {
              asignarArchivo(e.target.files?.[0] ?? null);
            }}
          />
          {archivo ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border-default bg-bg-subtle px-4 py-3">
              <p className="min-w-0 truncate text-sm text-text-secondary">
                {archivo.name}
              </p>
              <button
                type="button"
                aria-label={t("removeFile")}
                onClick={() => {
                  asignarArchivo(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-muted hover:text-text-primary"
              >
                <XIcon className="size-4" />
              </button>
            </div>
          ) : (
            <label
              htmlFor={fileInputId}
              onDragOver={(e) => {
                e.preventDefault();
                setArrastrando(true);
              }}
              onDragLeave={() => setArrastrando(false)}
              onDrop={(e) => {
                e.preventDefault();
                setArrastrando(false);
                asignarArchivo(e.dataTransfer.files?.[0] ?? null);
              }}
              className={cn(
                "flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-5 text-center transition-colors",
                arrastrando
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border-strong/70 bg-bg-subtle text-text-muted hover:border-navy/40 hover:text-text-secondary",
              )}
            >
              <UploadIcon className="size-4 shrink-0" aria-hidden />
              <span className="text-sm">
                {t("attach")}{" "}
                <span className="hidden sm:inline">
                  ({tCommon("optional")})
                </span>
              </span>
            </label>
          )}
        </div>
      </div>

      <footer className="mt-8 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end sm:gap-4">
        <Button
          type="button"
          variant="ghost"
          onClick={limpiar}
          disabled={isSubmitting}
          className="text-text-muted"
        >
          {tCommon("clear")}
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-navy hover:bg-navy/90 sm:min-w-40"
        >
          {isSubmitting ? tCommon("sending") : t("submit")}
        </Button>
      </footer>
    </form>
  );
}
