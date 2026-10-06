"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ORG_STORAGE_KEY,
  obtenerOrganizacionesMock,
  obtenerOrganizacionPorId,
} from "@/lib/mock/organizaciones";
import type { Organizacion } from "@/types";

/**
 * Org activa del tenant. Hoy: mock + localStorage.
 * Backend: reemplazar lectura/escritura por API de membresías del usuario.
 */
export function useOrganizacionActiva() {
  const organizaciones = obtenerOrganizacionesMock();
  const [orgId, setOrgIdState] = useState(organizaciones[0]?.id ?? "");
  const [hidratado, setHidratado] = useState(false);

  useEffect(() => {
    const guardada = window.localStorage.getItem(ORG_STORAGE_KEY);
    if (guardada && obtenerOrganizacionPorId(guardada)) {
      setOrgIdState(guardada);
    }
    setHidratado(true);
  }, []);

  const setOrganizacionId = useCallback((id: string) => {
    if (!obtenerOrganizacionPorId(id)) return;
    setOrgIdState(id);
    window.localStorage.setItem(ORG_STORAGE_KEY, id);
  }, []);

  const organizacion: Organizacion | undefined =
    obtenerOrganizacionPorId(orgId) ?? organizaciones[0];

  return {
    organizaciones,
    organizacion,
    organizacionId: organizacion?.id ?? "",
    setOrganizacionId,
    hidratado,
  };
}
