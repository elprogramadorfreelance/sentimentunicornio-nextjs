"use client";

import { useEffect, useState } from "react";
import { apiSentimiento } from "@/lib/api";
import type { RespuestaSentimiento } from "@/types";

export function useSentimiento(
  proyectoId: string | null,
  rango: { inicio: string; fin: string } | null = null,
) {
  const [datos, setDatos] = useState<RespuestaSentimiento | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setError(null);

    apiSentimiento(proyectoId, rango)
      .then((respuesta) => {
        if (!cancelado) setDatos(respuesta);
      })
      .catch((errorDesconocido: unknown) => {
        if (!cancelado) {
          setError(
            errorDesconocido instanceof Error
              ? errorDesconocido.message
              : "No se pudo cargar el sentimiento.",
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
  }, [proyectoId, rango]);

  return { datos, cargando, error };
}
