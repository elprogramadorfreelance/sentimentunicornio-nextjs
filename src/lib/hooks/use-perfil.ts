"use client";

import { useCallback, useEffect, useState } from "react";
import { apiObtenerPerfil } from "@/lib/api";
import type { PerfilUsuario } from "@/types";

type EstadoPerfil = {
  perfil: PerfilUsuario | null;
  cargando: boolean;
  error: string | null;
};

export function usePerfil() {
  const [estado, setEstado] = useState<EstadoPerfil>({
    perfil: null,
    cargando: true,
    error: null,
  });

  const recargar = useCallback(async () => {
    setEstado((prev) => ({ ...prev, cargando: true, error: null }));
    try {
      const { perfil } = await apiObtenerPerfil();
      setEstado({ perfil, cargando: false, error: null });
    } catch (err: unknown) {
      setEstado({
        perfil: null,
        cargando: false,
        error:
          err instanceof Error ? err.message : "No se pudo cargar el perfil",
      });
    }
  }, []);

  useEffect(() => {
    let cancelado = false;

    apiObtenerPerfil()
      .then(({ perfil }) => {
        if (!cancelado) setEstado({ perfil, cargando: false, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelado) {
          setEstado({
            perfil: null,
            cargando: false,
            error:
              err instanceof Error
                ? err.message
                : "No se pudo cargar el perfil",
          });
        }
      });

    return () => {
      cancelado = true;
    };
  }, []);

  function actualizarPerfilLocal(perfil: PerfilUsuario) {
    setEstado({ perfil, cargando: false, error: null });
  }

  return { ...estado, recargar, actualizarPerfilLocal };
}
