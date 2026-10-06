"use client";

import { useEffect, useState } from "react";
import { apiMenciones } from "@/lib/api";
import type { RespuestaMenciones } from "@/types";

export function useMenciones(
  proyectoId: string | string[] | null,
  rango: { inicio: string; fin: string } | null = null,
) {
  const [datos, setDatos] = useState<RespuestaMenciones | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Si proyectoId es un array, cambia de referencia en cada render del padre
  // aunque su contenido sea el mismo — se serializa para que el efecto solo
  // dispare cuando la selección realmente cambia, no en cada render.
  const claveProyecto = Array.isArray(proyectoId) ? proyectoId.join(",") : proyectoId;

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setError(null);

    apiMenciones(proyectoId, true, rango)
      .then((respuesta) => {
        if (!cancelado) setDatos(respuesta);
      })
      .catch((errorDesconocido: unknown) => {
        if (!cancelado) {
          setError(
            errorDesconocido instanceof Error
              ? errorDesconocido.message
              : "No se pudieron cargar las menciones.",
          );
        }
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claveProyecto, rango]);

  return { datos, cargando, error };
}
