"use client";

import { BotonTema } from "@/components/tema";
import {
  type ClaveTonalidad,
  cssDegradado,
  PALETAS_GRAFICAS,
  type PaletaGraficas,
} from "@/lib/paletas-graficas";
import {
  MuestraDona,
  MuestraEscalaCaras,
  MuestraMapa,
  MuestraMencionesFuente,
  MuestraReporte,
  MuestraSerie,
  MuestraTonalidadFuente,
} from "./muestras-paleta";

const TONOS: { clave: ClaveTonalidad; etiqueta: string }[] = [
  { clave: "positivo", etiqueta: "Positivo" },
  { clave: "neutro", etiqueta: "Neutro" },
  { clave: "negativo", etiqueta: "Negativo" },
];

function Tonos({ paleta }: { paleta: PaletaGraficas }) {
  return (
    <ul className="grid grid-cols-3 gap-2">
      {TONOS.map(({ clave, etiqueta }) => (
        <li key={clave} className="min-w-0">
          <div
            className="h-12 rounded-md"
            style={{ backgroundImage: cssDegradado(paleta[clave], "135deg") }}
          />
          <p className="mt-1.5 text-xs font-medium text-text-primary">
            {etiqueta}
          </p>
          <p className="font-mono text-[10px] text-text-muted uppercase">
            {paleta[clave].desde} → {paleta[clave].hasta}
          </p>
        </li>
      ))}
    </ul>
  );
}

function ColumnaPaleta({ paleta }: { paleta: PaletaGraficas }) {
  return (
    <section
      aria-labelledby={`titulo-${paleta.id}`}
      className="flex min-w-0 flex-col gap-4"
    >
      <header className="flex flex-col gap-3 rounded-lg border border-border-default bg-bg-subtle p-4">
        <h2
          id={`titulo-${paleta.id}`}
          className="text-lg font-semibold text-text-primary text-balance"
        >
          {paleta.nombre}
        </h2>
        <p className="text-sm text-text-secondary text-pretty">
          {paleta.descripcion}
        </p>
        <Tonos paleta={paleta} />
      </header>
      <MuestraEscalaCaras paleta={paleta} />
      <MuestraDona paleta={paleta} />
      <MuestraSerie paleta={paleta} />
      <MuestraTonalidadFuente paleta={paleta} />
      <MuestraMencionesFuente paleta={paleta} />
      <MuestraMapa paleta={paleta} />
      <MuestraReporte paleta={paleta} />
    </section>
  );
}

export function ComparadorPaletas() {
  return (
    <main className="min-h-dvh bg-bg-base text-text-primary">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12">
        <header className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold tracking-wide text-accent uppercase">
              Sentiment Unicornio · Propuesta de color
            </p>
            <h1 className="text-2xl font-bold text-balance sm:text-3xl">
              Colores de gráficas
            </h1>
            <p className="max-w-2xl text-sm text-text-secondary text-pretty">
              Las mismas gráficas y los mismos datos con dos paletas. Ninguna
              usa gris: el tono neutro pasa a lavanda en la propuesta A y a
              ámbar en la B. Cambia el tema para revisar ambas en modo claro y
              oscuro.
            </p>
          </div>
          <BotonTema className="mt-1" />
        </header>
        <div className="grid gap-6 md:grid-cols-2">
          {PALETAS_GRAFICAS.map((paleta) => (
            <ColumnaPaleta key={paleta.id} paleta={paleta} />
          ))}
        </div>
      </div>
    </main>
  );
}
