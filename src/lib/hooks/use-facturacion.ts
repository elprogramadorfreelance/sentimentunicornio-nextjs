"use client";

import { useCallback, useEffect, useState } from "react";
import { apiObtenerFacturación } from "@/lib/api";
import type { RespuestaFacturación } from "@/types";

export function useFacturación() {
  const [datos, setDatos] = useState<RespuestaFacturación | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setDatos(await apiObtenerFacturación());
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar la facturación.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  return { datos, cargando, error, recargar };
}
