"use client";

import { useEffect, useState } from "react";
import { apiInfografia } from "@/lib/api";
import type { RespuestaInfografia } from "@/types";

export function useInfografia(proyectoId: string | null, diasPeriodo: number) {
  const [datos, setDatos] = useState<RespuestaInfografia | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setError(null);

    apiInfografia(proyectoId, diasPeriodo)
      .then((respuesta) => {
        if (!cancelado) setDatos(respuesta);
      })
      .catch((errorDesconocido: unknown) => {
        if (!cancelado) {
          setError(
            errorDesconocido instanceof Error
              ? errorDesconocido.message
              : "No se pudo cargar la infografía.",
          );
        }
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [proyectoId, diasPeriodo]);

  return { datos, cargando, error };
}
