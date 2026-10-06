"use client";

import { useCallback, useRef, useState } from "react";
import { apiBusqueda } from "@/lib/api";
import type { MenciónEditorial } from "@/types";

export type EstadoBusqueda = "vacío" | "buscando" | "listo" | "error";

const MÁXIMO_HISTORIAL = 5;
const TAMAÑO_PÁGINA = 8;

type RespuestaBusquedaHook = Awaited<ReturnType<typeof apiBusqueda>>;

type ContextoBusqueda = {
  consulta: string;
  proyectoIds: string[];
};

export function useBusqueda() {
  const [estado, setEstado] = useState<EstadoBusqueda>("vacío");
  const [progreso, setProgreso] = useState(0);
  const [datos, setDatos] = useState<RespuestaBusquedaHook | null>(null);
  const [resultados, setResultados] = useState<MenciónEditorial[]>([]);
  const [página, setPágina] = useState(1);
  const [total, setTotal] = useState(0);
  const [hayMás, setHayMás] = useState(false);
  const [cargandoMás, setCargandoMás] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historial, setHistorial] = useState<string[]>([]);
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Identifica la búsqueda vigente para descartar respuestas tardías
  const solicitudRef = useRef(0);
  const contextoRef = useRef<ContextoBusqueda | null>(null);

  const detenerProgreso = useCallback(() => {
    if (intervaloRef.current) clearInterval(intervaloRef.current);
    intervaloRef.current = null;
  }, []);

  const buscar = useCallback(
    async (consultaCruda: string, proyectoIds: string[] = []) => {
      const consulta = consultaCruda.trim();
      if (!consulta) return null;

      solicitudRef.current += 1;
      const solicitud = solicitudRef.current;
      contextoRef.current = { consulta, proyectoIds };

      setEstado("buscando");
      setError(null);
      setProgreso(8);
      setResultados([]);
      setDatos(null);
      setHayMás(false);
      setCargandoMás(false);

      detenerProgreso();
      intervaloRef.current = setInterval(() => {
        setProgreso((actual) => (actual >= 90 ? actual : actual + Math.random() * 18));
      }, 220);

      try {
        const respuesta = await apiBusqueda({ consulta, proyectoIds, página: 1, tamaño: TAMAÑO_PÁGINA });
        if (solicitudRef.current !== solicitud) return null;
        detenerProgreso();
        setProgreso(100);
        setDatos(respuesta);
        setResultados(respuesta.resultados);
        setPágina(1);
        setTotal(respuesta.total);
        setHayMás(respuesta.hayMás);
        setHistorial((previo) => [consulta, ...previo.filter((item) => item !== consulta)].slice(0, MÁXIMO_HISTORIAL));
        window.setTimeout(() => {
          if (solicitudRef.current === solicitud) setEstado("listo");
        }, 200);
        return respuesta;
      } catch (errorDesconocido) {
        if (solicitudRef.current !== solicitud) return null;
        detenerProgreso();
        setError(errorDesconocido instanceof Error ? errorDesconocido.message : "No se pudo buscar.");
        setEstado("error");
        return null;
      }
    },
    [detenerProgreso],
  );

  const cargarMás = useCallback(async () => {
    const contexto = contextoRef.current;
    if (!contexto || !hayMás || estado !== "listo" || cargandoMás) return;

    const solicitud = solicitudRef.current;
    const siguientePágina = página + 1;
    setCargandoMás(true);

    try {
      const respuesta = await apiBusqueda({
        consulta: contexto.consulta,
        proyectoIds: contexto.proyectoIds,
        página: siguientePágina,
        tamaño: TAMAÑO_PÁGINA,
      });
      if (solicitudRef.current !== solicitud) return;
      setResultados((actuales) => [...actuales, ...respuesta.resultados]);
      setPágina(siguientePágina);
      setTotal(respuesta.total);
      setHayMás(respuesta.hayMás);
    } catch {
      if (solicitudRef.current !== solicitud) return;
    } finally {
      if (solicitudRef.current === solicitud) setCargandoMás(false);
    }
  }, [cargandoMás, estado, hayMás, página]);

  const limpiar = useCallback(() => {
    solicitudRef.current += 1;
    contextoRef.current = null;
    detenerProgreso();
    setEstado("vacío");
    setProgreso(0);
    setDatos(null);
    setResultados([]);
    setPágina(1);
    setTotal(0);
    setHayMás(false);
    setCargandoMás(false);
    setError(null);
  }, [detenerProgreso]);

  const reintentar = useCallback(() => {
    const contexto = contextoRef.current;
    if (contexto) void buscar(contexto.consulta, contexto.proyectoIds);
  }, [buscar]);

  return {
    estado,
    progreso: Math.min(progreso, 100),
    datos,
    resultados,
    total,
    hayMás,
    cargandoMás,
    error,
    historial,
    buscar,
    cargarMás,
    limpiar,
    reintentar,
  };
}
