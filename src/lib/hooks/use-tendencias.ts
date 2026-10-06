"use client";

// TODO: migrar a TanStack Query una vez que sea instalado
import { useEffect, useState } from "react";
import { apiTendencias } from "@/lib/api";
import type { TendenciaSentimiento } from "@/types";

export function useTendencias(días = 7) {
  const [datos, setDatos] = useState<TendenciaSentimiento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);

    apiTendencias(días)
      .then((res) => {
        if (!cancelado) {
          setDatos(res);
          setCargando(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelado) {
          setError(err instanceof Error ? err.message : "Error desconocido");
          setCargando(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, [días]);

  return { datos, cargando, error };
}
