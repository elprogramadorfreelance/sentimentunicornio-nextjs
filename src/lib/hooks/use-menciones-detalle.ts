"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiMencionesDetalle } from "@/lib/api";
import type {
  CategoríaSentimiento,
  MenciónDetalle,
  TipoFuenteMención,
} from "@/types";

const TAMAÑO_PÁGINA = 24;

type UseMencionesDetalleParams = {
  proyectoId: string | null;
  búsqueda: string;
  fuentes: TipoFuenteMención[];
  sentimiento: CategoríaSentimiento | null;
};

type EstadoColumna = {
  menciones: MenciónDetalle[];
  página: number;
  hayMás: boolean;
  cargandoMás: boolean;
};

const COLUMNA_VACÍA: EstadoColumna = {
  menciones: [],
  página: 1,
  hayMás: false,
  cargandoMás: false,
};

/**
 * Cada fuente se pagina por separado (una llamada por fuente, en paralelo) —
 * antes era una sola página mezclando todas las fuentes seleccionadas, y una
 * fuente con pocas menciones reales (ej. Facebook con 7 contra 534 de X)
 * quedaba enterrada sin cargarse nunca, aunque el badge del encabezado sí
 * mostrara el número real. Así cada columna tiene su propio cursor real,
 * nunca depende de qué tan grandes sean las demás.
 */
export function useMencionesDetalle({
  proyectoId,
  búsqueda,
  fuentes,
  sentimiento,
}: UseMencionesDetalleParams) {
  const [columnas, setColumnas] = useState<Partial<Record<TipoFuenteMención, EstadoColumna>>>({});
  const [total, setTotal] = useState(0);
  const [totalPorFuente, setTotalPorFuente] = useState<
    Partial<Record<TipoFuenteMención, number>>
  >({});
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const claveFuentes = fuentes.join(",");
  const clave = `${proyectoId ?? "todos"}|${búsqueda}|${claveFuentes}|${sentimiento ?? "todos"}`;
  const claveActual = useRef(clave);
  claveActual.current = clave;

  useEffect(() => {
    let cancelado = false;
    setCargandoInicial(true);
    setError(null);
    setColumnas({});

    Promise.all(
      fuentes.map((fuente) =>
        apiMencionesDetalle({
          proyectoId,
          búsqueda,
          fuentes,
          fuente,
          sentimiento,
          página: 1,
          tamaño: TAMAÑO_PÁGINA,
        }).then((respuesta) => [fuente, respuesta] as const),
      ),
    )
      .then((resultados) => {
        if (cancelado) return;
        const nuevasColumnas: Partial<Record<TipoFuenteMención, EstadoColumna>> = {};
        for (const [fuente, respuesta] of resultados) {
          nuevasColumnas[fuente] = {
            menciones: respuesta.menciones,
            página: 1,
            hayMás: respuesta.hayMás,
            cargandoMás: false,
          };
        }
        setColumnas(nuevasColumnas);
        setTotal(resultados[0]?.[1]?.total ?? 0);
        setTotalPorFuente(resultados[0]?.[1]?.totalPorFuente ?? {});
      })
      .catch((errorDesconocido: unknown) => {
        if (cancelado) return;
        setError(
          errorDesconocido instanceof Error
            ? errorDesconocido.message
            : "No se pudieron cargar las menciones.",
        );
      })
      .finally(() => {
        if (!cancelado) setCargandoInicial(false);
      });

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proyectoId, búsqueda, claveFuentes, sentimiento]);

  const cargarMás = useCallback(
    (fuente: TipoFuenteMención) => {
      const columna = columnas[fuente];
      if (!columna || !columna.hayMás || columna.cargandoMás) return;
      const claveAlIniciar = clave;
      const siguientePágina = columna.página + 1;

      setColumnas((actuales) => ({
        ...actuales,
        [fuente]: { ...(actuales[fuente] ?? COLUMNA_VACÍA), cargandoMás: true },
      }));

      apiMencionesDetalle({
        proyectoId,
        búsqueda,
        fuentes,
        fuente,
        sentimiento,
        página: siguientePágina,
        tamaño: TAMAÑO_PÁGINA,
      })
        .then((respuesta) => {
          if (claveActual.current !== claveAlIniciar) return;
          setColumnas((actuales) => {
            const previa = actuales[fuente] ?? COLUMNA_VACÍA;
            return {
              ...actuales,
              [fuente]: {
                menciones: [...previa.menciones, ...respuesta.menciones],
                página: siguientePágina,
                hayMás: respuesta.hayMás,
                cargandoMás: false,
              },
            };
          });
          setTotal(respuesta.total);
          setTotalPorFuente(respuesta.totalPorFuente);
        })
        .catch((errorDesconocido: unknown) => {
          if (claveActual.current !== claveAlIniciar) return;
          setError(
            errorDesconocido instanceof Error
              ? errorDesconocido.message
              : "No se pudieron cargar más menciones.",
          );
          setColumnas((actuales) => ({
            ...actuales,
            [fuente]: { ...(actuales[fuente] ?? COLUMNA_VACÍA), cargandoMás: false },
          }));
        });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [columnas, clave, proyectoId, búsqueda, claveFuentes, sentimiento],
  );

  // Suma de lo cargado hasta ahorita en todas las columnas — solo para el
  // contador "24 de 1403" del encabezado.
  const cargadas = useMemo(
    () => Object.values(columnas).reduce((suma, c) => suma + (c?.menciones.length ?? 0), 0),
    [columnas],
  );

  return {
    columnas,
    cargadas,
    total,
    totalPorFuente,
    cargandoInicial,
    error,
    cargarMás,
  };
}
