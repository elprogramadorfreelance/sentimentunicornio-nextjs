"use client";

import { Loader2Icon, DownloadIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ListaMencionesEditoriales } from "@/components/menciones";
import { PaisesCoberturaWidget } from "@/components/dashboard-general";
import { DisclaimerDataHistorica, EstadoSinProyectos } from "@/components/layout";
import { Card, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";
import { descargarInfografiaPdf, TopeDescargasError } from "@/lib/exportar-resumen-infografia";
import { useInfografia } from "@/lib/hooks/use-infografia";
import { useProyectosActivos } from "@/lib/hooks/use-proyectos-activos";
import { FuentesActivasInfografia } from "./fuentes-activas-infografia";
import { HeroInfografia } from "./hero-infografia";
import { InfografiaSkeleton } from "./infografia-skeleton";
import { SentimientoWaffleInfografia } from "./sentimiento-waffle-infografia";
import { TopEmisoresInfografia } from "./top-emisores-infografia";

const DIAS_PERIODO = [7, 14, 30, 90] as const;

const CLAVE_DIAS_PERIODO: Record<(typeof DIAS_PERIODO)[number], "last7Days" | "last14Days" | "last30Days" | "last90Days"> = {
  7: "last7Days",
  14: "last14Days",
  30: "last30Days",
  90: "last90Days",
};

type InfografiaVistaProps = {
  /** Cuentas plan "basic" (Demo): solo "Últimos 7 días" seleccionable. */
  soloSieteDías?: boolean;
};

export function InfografiaVista({ soloSieteDías = false }: InfografiaVistaProps) {
  const t = useTranslations("infografia");
  const tCommon = useTranslations("common");
  // Selector multi-proyecto del sidebar: "un solo proyecto elegido" filtra;
  // "todos" o "2+" muestra el agregado (mismo criterio que Menciones/Sentimiento).
  const { idUnicoOAgregado, sinSeleccion } = useProyectosActivos();
  const [diasPeriodo, setDiasPeriodo] = useState<number>(soloSieteDías ? 7 : 14);
  const [exportando, setExportando] = useState(false);
  const [errorExportar, setErrorExportar] = useState<string | null>(null);

  const { datos: respuesta, cargando, error } = useInfografia(idUnicoOAgregado, diasPeriodo);
  const datos = respuesta?.datos ?? null;

  async function manejarExportar() {
    if (!datos) return;
    setExportando(true);
    setErrorExportar(null);
    try {
      await descargarInfografiaPdf(datos, diasPeriodo);
    } catch (err) {
      setErrorExportar(
        err instanceof TopeDescargasError
          ? t("downloadLimitReached", { limit: err.tope })
          : t("downloadError"),
      );
    } finally {
      setExportando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <DisclaimerDataHistorica />
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t("title")}</h1>
          <p className="mt-1 text-sm text-text-muted">{t("subtitleOurs")}</p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end lg:w-auto">
          <div className="w-full sm:w-56">
            <label
              htmlFor="selector-dias-infografia"
              className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-text-muted"
            >
              {t("period")}
            </label>
            <Select value={String(diasPeriodo)} onValueChange={(v) => setDiasPeriodo(Number(v))}>
              <SelectTrigger id="selector-dias-infografia" className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIAS_PERIODO.map((dias) => (
                  <SelectItem
                    key={dias}
                    value={String(dias)}
                    disabled={soloSieteDías && dias !== 7}
                  >
                    {t(CLAVE_DIAS_PERIODO[dias])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <button
            type="button"
            onClick={manejarExportar}
            disabled={!datos || exportando}
            className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-fg transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exportando ? (
              <Loader2Icon className="size-4 animate-spin" aria-hidden />
            ) : (
              <DownloadIcon className="size-4" aria-hidden />
            )}
            {exportando ? t("exporting") : t("exportPdf")}
          </button>
        </div>
      </header>

      {errorExportar && (
        <Card className="border-error/30 bg-error/5 text-sm text-error">
          {errorExportar}
        </Card>
      )}

      {sinSeleccion ? (
        <EstadoSinProyectos
          titulo={tCommon("selectAtLeastOneProject")}
          descripcion={tCommon("selectAtLeastOneHint")}
        />
      ) : cargando && !datos ? (
        <InfografiaSkeleton />
      ) : error || !datos ? (
        <Card className="border-error/30 bg-error/5 text-sm text-error">
          {error ?? t("loadError")}
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <HeroInfografia
            className="col-span-1 lg:col-span-12"
            nombreProyecto={datos.nombreProyecto}
            mencionesTotales={datos.mencionesTotales}
            cambioMenciones={datos.cambioMenciones}
            alcanceTotal={datos.alcanceTotal}
            diasPeriodo={diasPeriodo}
          />

          <FuentesActivasInfografia className="col-span-1 h-64 lg:col-span-4" fuentes={datos.fuentesActivas} />
          <SentimientoWaffleInfografia
            className="col-span-1 h-64 lg:col-span-4"
            positivo={datos.sentimiento.positivo}
            negativo={datos.sentimiento.negativo}
            neutro={datos.sentimiento.neutro}
            clasificadas={datos.sentimiento.clasificadas}
          />
          <PaisesCoberturaWidget className="col-span-1 h-64 lg:col-span-4" regiones={datos.regiones} />

          <TopEmisoresInfografia className="col-span-1 h-80 lg:col-span-4" emisores={datos.topEmisores} />
          <ListaMencionesEditoriales
            className="col-span-1 h-80 lg:col-span-8"
            menciones={datos.mencionesPopulares}
            hrefVerMas={idUnicoOAgregado ? `/menciones?proyecto=${idUnicoOAgregado}` : "/menciones"}
          />
        </div>
      )}
    </div>
  );
}
