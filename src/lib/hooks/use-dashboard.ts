"use client";

// TODO: migrar a TanStack Query una vez que sea instalado (`pnpm add @tanstack/react-query`)
import { useEffect, useState } from "react";
import { apiResumenDashboard } from "@/lib/api";
import type { ResumenDashboard } from "@/types";

type Estado<T> = {
  datos: T | null;
  cargando: boolean;
  error: string | null;
};

export function useDashboard() {
  const [estado, setEstado] = useState<Estado<ResumenDashboard>>({
    datos: null,
    cargando: true,
    error: null,
  });

  useEffect(() => {
    let cancelado = false;

    apiResumenDashboard()
      .then((datos) => {
        if (!cancelado) setEstado({ datos, cargando: false, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelado)
          setEstado({
            datos: null,
            cargando: false,
            error: err instanceof Error ? err.message : "Error desconocido",
          });
      });

    return () => {
      cancelado = true;
    };
  }, []);

  return estado;
}
