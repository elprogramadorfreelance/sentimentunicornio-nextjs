"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  FECHA_ACTUALIZACION_AVISO,
  SECCIONES_AVISO_PRIVACIDAD,
} from "./aviso-privacidad-secciones";

function NavSecciones({
  activa,
  orientacion = "vertical",
  onSeleccionar,
}: {
  activa: string;
  orientacion?: "vertical" | "horizontal";
  onSeleccionar?: (id: string) => void;
}) {
  const esHorizontal = orientacion === "horizontal";

  return (
    <nav aria-label="Secciones del aviso">
      <p
        className={cn(
          "text-xs font-semibold tracking-wide text-text-muted uppercase",
          esHorizontal ? "sr-only" : "mb-3 px-3",
        )}
      >
        Contenido
      </p>
      <ul
        className={cn(
          esHorizontal
            ? "flex gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            : "space-y-0.5",
        )}
      >
        {SECCIONES_AVISO_PRIVACIDAD.map((seccion) => {
          const esActiva = activa === seccion.id;
          return (
            <li
              key={seccion.id}
              className={esHorizontal ? "shrink-0" : undefined}
            >
              <a
                href={`#${seccion.id}`}
                aria-current={esActiva ? "true" : undefined}
                onClick={() => onSeleccionar?.(seccion.id)}
                className={cn(
                  "block text-sm transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  esHorizontal
                    ? cn(
                        "rounded-lg px-3 py-2 whitespace-nowrap",
                        esActiva
                          ? "bg-primary/10 font-semibold text-primary"
                          : "text-text-muted hover:bg-bg-muted hover:text-text-primary",
                      )
                    : cn(
                        "rounded-r-lg border-l-2 px-3 py-2",
                        esActiva
                          ? "border-primary bg-primary/10 font-semibold text-primary"
                          : "border-transparent text-text-muted hover:border-border-default hover:bg-bg-muted/80 hover:text-text-primary",
                      ),
                )}
              >
                {esHorizontal ? seccion.nav : seccion.titulo}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function resolverSeccionActiva(nodos: HTMLElement[]): string {
  if (nodos.length === 0) return SECCIONES_AVISO_PRIVACIDAD[0].id;

  // Última sección cuyo encabezado ya pasó la línea de lectura
  const linea = Math.min(160, window.innerHeight * 0.28);
  let candidata = nodos[0].id;

  for (const nodo of nodos) {
    if (nodo.getBoundingClientRect().top <= linea) {
      candidata = nodo.id;
    } else {
      break;
    }
  }

  return candidata;
}

export function AvisoPrivacidadContenido() {
  const [activa, setActiva] = useState(SECCIONES_AVISO_PRIVACIDAD[0].id);

  useEffect(() => {
    const nodos = () =>
      SECCIONES_AVISO_PRIVACIDAD.map((s) =>
        document.getElementById(s.id),
      ).filter((el): el is HTMLElement => el !== null);

    function actualizar() {
      setActiva(resolverSeccionActiva(nodos()));
    }

    actualizar();
    window.addEventListener("scroll", actualizar, { passive: true });
    window.addEventListener("resize", actualizar);
    window.addEventListener("hashchange", actualizar);

    return () => {
      window.removeEventListener("scroll", actualizar);
      window.removeEventListener("resize", actualizar);
      window.removeEventListener("hashchange", actualizar);
    };
  }, []);

  return (
    <div className="lg:grid lg:grid-cols-[minmax(220px,260px)_minmax(0,1fr)] lg:gap-12 xl:gap-16">
      {/* Sidemenu desktop */}
      <aside className="hidden lg:block">
        <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pr-2">
          <NavSecciones activa={activa} onSeleccionar={setActiva} />
        </div>
      </aside>

      <div className="min-w-0">
        {/* Nav móvil: chips horizontales */}
        <div className="sticky top-16 z-10 -mx-4 mb-8 border-b border-border-default/40 bg-bg-base/95 px-4 py-3 backdrop-blur-sm lg:hidden">
          <NavSecciones
            activa={activa}
            orientacion="horizontal"
            onSeleccionar={setActiva}
          />
        </div>

        <article>
          <header className="max-w-3xl">
            <p className="text-xs font-medium tracking-wide text-text-muted uppercase">
              Unicornio · Protección de datos
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-text-primary">
              Aviso de privacidad
            </h1>
            <p className="mt-3 text-sm text-text-muted">
              Última actualización: {FECHA_ACTUALIZACION_AVISO}
            </p>
            <p className="mt-6 text-base leading-relaxed text-text-secondary">
              En Unicornio tratamos datos personales para operar el monitoreo de
              sentimiento sobre marcas, figuras públicas, actores políticos y
              entidades relacionadas. Este documento describe qué datos podemos
              tratar, para qué, con quién y cómo puedes ejercer tus derechos.
            </p>
          </header>

          {/* pb extra: permite que secciones finales cortas suban al área del scroll-spy */}
          <div className="mt-12 max-w-3xl space-y-12 pb-[45vh] sm:mt-14 sm:space-y-14">
            {SECCIONES_AVISO_PRIVACIDAD.map((seccion) => (
              <section
                key={seccion.id}
                id={seccion.id}
                className="scroll-mt-36 lg:scroll-mt-28"
              >
                <h2 className="text-xl font-semibold tracking-tight text-text-primary">
                  {seccion.titulo}
                </h2>
                <div className="mt-4 space-y-4 text-base leading-relaxed text-text-secondary">
                  {seccion.cuerpo.map((parrafo, i) => (
                    <p key={`${seccion.id}-${i}`}>{parrafo}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}
