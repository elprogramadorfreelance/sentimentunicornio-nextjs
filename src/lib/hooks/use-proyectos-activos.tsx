"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiListarProyectos } from "@/lib/api";
import type { Proyecto } from "@/types";

const STORAGE_KEY = "unicornio.proyectos-activos";

type Persistido = {
  todos: boolean;
  ids: string[];
};

type ProyectosActivosValor = {
  proyectos: Proyecto[];
  hidratado: boolean;
  esTodos: boolean;
  idsSeleccionados: string[];
  idsEfectivos: string[];
  primerId: string | null;
  idUnicoOAgregado: string | null;
  setSeleccion: (ids: string[], todos?: boolean) => void;
  alternarId: (id: string) => void;
  seleccionarTodos: () => void;
  limpiarSeleccion: () => void;
  sinSeleccion: boolean;
  refrescar: () => Promise<void>;
};

const ContextoProyectosActivos = createContext<ProyectosActivosValor | null>(
  null,
);

function leerPersistido(): Persistido | null {
  try {
    const crudo = window.localStorage.getItem(STORAGE_KEY);
    if (!crudo) return null;
    const parsed: unknown = JSON.parse(crudo);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("todos" in parsed) ||
      !("ids" in parsed)
    ) {
      return null;
    }
    const candidato = parsed as Persistido;
    if (
      typeof candidato.todos !== "boolean" ||
      !Array.isArray(candidato.ids) ||
      candidato.ids.some((id) => typeof id !== "string")
    ) {
      return null;
    }
    return candidato;
  } catch {
    return null;
  }
}

function guardarPersistido(valor: Persistido) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(valor));
}

export function ProyectosActivosProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [esTodos, setEsTodos] = useState(true);
  const [idsSeleccionados, setIdsSeleccionados] = useState<string[]>([]);
  const [hidratado, setHidratado] = useState(false);

  const refrescar = useCallback(async () => {
    const data = await apiListarProyectos();
    setProyectos(data.proyectos);
  }, []);

  useEffect(() => {
    let cancelado = false;
    void (async () => {
      try {
        const data = await apiListarProyectos();
        if (cancelado) return;
        const lista = data.proyectos;
        setProyectos(lista);
        const idsVálidos = new Set(lista.map((p) => p.id));
        const guardado = leerPersistido();
        if (guardado) {
          const ids = guardado.ids.filter((id) => idsVálidos.has(id));
          const todos =
            guardado.todos || (ids.length > 0 && ids.length === lista.length);
          setEsTodos(todos);
          setIdsSeleccionados(todos ? lista.map((p) => p.id) : ids);
        } else {
          setEsTodos(true);
          setIdsSeleccionados(lista.map((p) => p.id));
        }
      } catch {
        if (!cancelado) {
          setProyectos([]);
          setEsTodos(true);
          setIdsSeleccionados([]);
        }
      } finally {
        if (!cancelado) setHidratado(true);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  const setSeleccion = useCallback(
    (ids: string[], todos?: boolean) => {
      const idsVálidos = new Set(proyectos.map((p) => p.id));
      const filtrados = ids.filter((id) => idsVálidos.has(id));
      const marcarTodos =
        todos === true ||
        (filtrados.length === proyectos.length && proyectos.length > 0);
      setEsTodos(marcarTodos);
      setIdsSeleccionados(marcarTodos ? proyectos.map((p) => p.id) : filtrados);
      guardarPersistido({
        todos: marcarTodos,
        ids: marcarTodos ? [] : filtrados,
      });
    },
    [proyectos],
  );

  const seleccionarTodos = useCallback(() => {
    setSeleccion(
      proyectos.map((p) => p.id),
      true,
    );
  }, [proyectos, setSeleccion]);

  const limpiarSeleccion = useCallback(() => {
    setSeleccion([], false);
  }, [setSeleccion]);

  const alternarId = useCallback(
    (id: string) => {
      const actuales = esTodos ? proyectos.map((p) => p.id) : idsSeleccionados;
      const existe = actuales.includes(id);
      const siguientes = existe
        ? actuales.filter((item) => item !== id)
        : [...actuales, id];
      setSeleccion(siguientes, false);
    },
    [esTodos, idsSeleccionados, proyectos, setSeleccion],
  );

  const idsEfectivos = useMemo(() => {
    if (esTodos) return proyectos.map((p) => p.id);
    return idsSeleccionados;
  }, [esTodos, idsSeleccionados, proyectos]);

  const sinSeleccion = !esTodos && idsEfectivos.length === 0;
  const primerId = idsEfectivos[0] ?? null;
  const idUnicoOAgregado =
    !esTodos && idsEfectivos.length === 1 ? idsEfectivos[0] : null;

  const valor = useMemo<ProyectosActivosValor>(
    () => ({
      proyectos,
      hidratado,
      esTodos,
      idsSeleccionados: idsEfectivos,
      idsEfectivos,
      primerId,
      idUnicoOAgregado,
      setSeleccion,
      alternarId,
      seleccionarTodos,
      limpiarSeleccion,
      sinSeleccion,
      refrescar,
    }),
    [
      proyectos,
      hidratado,
      esTodos,
      idsEfectivos,
      primerId,
      idUnicoOAgregado,
      setSeleccion,
      alternarId,
      seleccionarTodos,
      limpiarSeleccion,
      sinSeleccion,
      refrescar,
    ],
  );

  return (
    <ContextoProyectosActivos.Provider value={valor}>
      {children}
    </ContextoProyectosActivos.Provider>
  );
}

export function useProyectosActivos() {
  const ctx = useContext(ContextoProyectosActivos);
  if (!ctx) {
    throw new Error(
      "useProyectosActivos debe usarse dentro de ProyectosActivosProvider",
    );
  }
  return ctx;
}
