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
import {
  aplicarTemaResuelto,
  escribirCookieTema,
  resolverTema,
  type Tema,
  type TemaResuelto,
} from "@/lib/tema";

type ContextoTema = {
  preferencia: Tema;
  resuelto: TemaResuelto;
  elegir: (siguiente: Tema) => void;
};

const TemaContext = createContext<ContextoTema | null>(null);

export function ProveedorTema({
  children,
  preferenciaInicial,
}: {
  children: ReactNode;
  preferenciaInicial: Tema;
}) {
  const [preferencia, setPreferencia] = useState<Tema>(preferenciaInicial);
  const [sistemaOscuro, setSistemaOscuro] = useState(false);
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSistemaOscuro(mq.matches);
    setMontado(true);

    const alCambiar = (evento: MediaQueryListEvent) => {
      setSistemaOscuro(evento.matches);
    };
    mq.addEventListener("change", alCambiar);
    return () => mq.removeEventListener("change", alCambiar);
  }, []);

  const resuelto = useMemo(
    () => resolverTema(preferencia, sistemaOscuro),
    [preferencia, sistemaOscuro],
  );

  useEffect(() => {
    if (!montado) return;
    aplicarTemaResuelto(resuelto);
  }, [montado, resuelto]);

  const elegir = useCallback((siguiente: Tema) => {
    setPreferencia(siguiente);
    escribirCookieTema(siguiente);
    aplicarTemaResuelto(
      resolverTema(
        siguiente,
        window.matchMedia("(prefers-color-scheme: dark)").matches,
      ),
    );
  }, []);

  const valor = useMemo(
    () => ({ preferencia, resuelto, elegir }),
    [preferencia, resuelto, elegir],
  );

  return <TemaContext.Provider value={valor}>{children}</TemaContext.Provider>;
}

export function useTema(): ContextoTema {
  const contexto = useContext(TemaContext);
  if (!contexto) {
    throw new Error("useTema debe usarse dentro de ProveedorTema");
  }
  return contexto;
}
