"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ImageIcon,
  InfoIcon,
  PlusIcon,
  XIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, type DefaultValues, useForm } from "react-hook-form";
import {
  siFacebook,
  siGoogleanalytics,
  siInstagram,
  siTiktok,
  siX,
} from "simple-icons";
import { z } from "zod";
import { BrandIcon } from "@/components/icons/brand-icon";
import {
  Badge,
  Button,
  Input,
  Label,
  MultiSelect,
  SlideArrowButton,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiActualizarProyecto, apiCrearProyecto } from "@/lib/api";
import { ESTADOS_MEXICO } from "@/lib/estados-mexico";
import {
  gradienteDesdeNombre,
  inicialesDesdeNombre,
} from "@/lib/mock/proyectos";
import { cn } from "@/lib/utils";
import type {
  PalabraClaveProyecto,
  Proyecto,
  RedSocialProyecto,
  TipoPalabraClave,
  TipoProyecto,
} from "@/types";
import { TOPES_PALABRAS_CLAVE } from "@/types";

const TIPOS: TipoProyecto[] = [
  "influencer",
  "agencia",
  "politico",
  "marca",
  "figura_publica",
  "otro",
];

const PAISES = [
  { value: "MX", clave: "countryMX" },
  { value: "US", clave: "countryUS" },
  { value: "ES", clave: "countryES" },
  { value: "AR", clave: "countryAR" },
  { value: "CO", clave: "countryCO" },
  { value: "CL", clave: "countryCL" },
  { value: "PE", clave: "countryPE" },
  { value: "BR", clave: "countryBR" },
] as const;

const REDES: {
  id: RedSocialProyecto;
  etiqueta: string;
  icon: typeof siX;
  color: string;
}[] = [
  { id: "x", etiqueta: "X", icon: siX, color: `#${siX.hex}` },
  {
    id: "facebook",
    etiqueta: "Facebook",
    icon: siFacebook,
    color: `#${siFacebook.hex}`,
  },
  {
    id: "instagram",
    etiqueta: "Instagram",
    icon: siInstagram,
    color: `#${siInstagram.hex}`,
  },
  {
    id: "tiktok",
    etiqueta: "TikTok",
    icon: siTiktok,
    color: `#${siTiktok.hex}`,
  },
  {
    id: "google_analytics",
    etiqueta: "Google Analytics",
    icon: siGoogleanalytics,
    color: `#${siGoogleanalytics.hex}`,
  },
];

const PASOS_CLAVES = [
  { id: 1, clave: "stepBasic" },
  { id: 2, clave: "stepMonitoring" },
  { id: 3, clave: "stepSources" },
] as const;

const DESCRIPCION_CLAVES = ["stepDesc1", "stepDesc2", "stepDesc3"] as const;

const MIME_IMAGEN_PERMITIDOS = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const EXT_IMAGEN_PERMITIDAS = /\.(jpe?g|png|webp|gif)$/i;

function esArchivoImagen(file: File): boolean {
  if (MIME_IMAGEN_PERMITIDOS.has(file.type)) return true;
  // Algunos SO no informan MIME; validar extensión como respaldo
  if (!file.type && EXT_IMAGEN_PERMITIDAS.test(file.name)) return true;
  return false;
}

type CampoPalabraClave = "nombresFuncionario" | "usuariosRedes" | "busquedasAsociadas";

const TIPO_POR_CAMPO: Record<CampoPalabraClave, TipoPalabraClave> = {
  nombresFuncionario: "nombre",
  usuariosRedes: "red_social",
  busquedasAsociadas: "busqueda",
};

// Tope mínimo solo para "búsquedas asociadas" (2026-10-02) — nombres y
// usernames reales legítimamente pueden ser cortos ("Naty", "@x"), pero esta
// categoría es la que alimenta directo las consultas de texto libre
// (YouTube/noticias/redes) y es la misma clase de término que causó el
// incidente real de SEMARNAT ("GPO", 3 letras, colisionó con Roblox). 4 es el
// mismo largo que el propio ejemplo que ya muestra el formulario ("SEPH").
const LARGO_MÍNIMO_BUSQUEDA = 4;

type TraductorProyectos = ReturnType<typeof useTranslations<"projects">>;

function crearEsquemaProyecto(t: TraductorProyectos) {
  return z
    .object({
      nombre: z.string().trim().min(2, t("nameInvalid")),
      descripcion: z.string().trim().min(1, t("descriptionRequired")),
      tipo: z.enum(
        [
          "influencer",
          "agencia",
          "politico",
          "marca",
          "figura_publica",
          "otro",
        ],
        { error: t("typeRequired") },
      ),
      imagenUrl: z.string().nullable(),
      // Tres categorías reales (2026-09-29) en vez de una lista plana sin
      // límite — el pedido explícito del dueño tras el caso real de
      // SEMARNAT (37 palabras clave sueltas trayendo contenido ajeno, ver
      // project_youtube_query_fix). Cada tope viene de TOPES_PALABRAS_CLAVE,
      // la misma fuente que usa el backend para reforzarlo del otro lado.
      nombresFuncionario: z
        .array(z.string().trim().min(1))
        .min(1, t("keywordsNameMin"))
        .max(TOPES_PALABRAS_CLAVE.nombre),
      usuariosRedes: z.array(z.string().trim().min(1)).max(TOPES_PALABRAS_CLAVE.red_social),
      // min(4), no min(1): esta categoría alimenta directo las consultas de
      // texto libre (YouTube/noticias/redes) — ver LARGO_MÍNIMO_BUSQUEDA.
      busquedasAsociadas: z
        .array(z.string().trim().min(4))
        .max(TOPES_PALABRAS_CLAVE.busqueda),
      paises: z.array(z.string()).min(1, t("countryMin")),
      estadosMexico: z.array(z.string()),
      idiomas: z.array(z.string()).min(1),
      redesConectadas: z.array(
        z.enum(["x", "facebook", "instagram", "tiktok", "google_analytics"]),
      ),
      fuentesNoticias: z.array(
        z.object({
          url: z.string().url(t("invalidUrl")),
          nombre: z.string().optional(),
        }),
      ),
    })
    .superRefine((datos, ctx) => {
      if (datos.paises.includes("MX") && datos.estadosMexico.length < 1) {
        ctx.addIssue({
          code: "custom",
          path: ["estadosMexico"],
          message: t("stateMin"),
        });
      }
    });
}

type FormularioProyecto = z.infer<ReturnType<typeof crearEsquemaProyecto>>;

const VALORES_INICIALES: DefaultValues<FormularioProyecto> = {
  nombre: "",
  descripcion: "",
  tipo: undefined,
  imagenUrl: null,
  nombresFuncionario: [],
  usuariosRedes: [],
  busquedasAsociadas: [],
  paises: ["MX"],
  estadosMexico: [],
  idiomas: ["es"],
  redesConectadas: [],
  fuentesNoticias: [],
};

type FormularioNuevoProyectoProps = {
  abierto: boolean;
  onAbiertoChange: (abierto: boolean) => void;
  /** Si se pasa, el modal opera en modo edición con datos precargados. */
  proyectoEdicion?: Proyecto | null;
  onCreado: (proyecto: Proyecto) => void;
  onActualizado?: (proyecto: Proyecto) => void;
};

function porTipo(
  palabrasClaveTipadas: PalabraClaveProyecto[] | undefined,
  tipo: TipoPalabraClave,
): string[] {
  return (palabrasClaveTipadas ?? []).filter((k) => k.tipo === tipo).map((k) => k.palabra);
}

function valoresDesdeProyecto(proyecto: Proyecto): FormularioProyecto {
  // palabrasClaveTipadas solo la trae obtenerProyectoRealCompleto (precarga
  // real de edición) — si por lo que sea no llegó, todo se cae a "nombre"
  // desde la lista plana vieja en vez de perder las palabras clave ya
  // guardadas.
  const tipadas = proyecto.palabrasClaveTipadas;
  return {
    nombre: proyecto.nombre,
    descripcion: proyecto.descripcion,
    tipo: proyecto.tipo,
    imagenUrl: proyecto.imagenUrl ?? null,
    nombresFuncionario: tipadas ? porTipo(tipadas, "nombre") : [...proyecto.palabrasClave],
    usuariosRedes: tipadas ? porTipo(tipadas, "red_social") : [],
    busquedasAsociadas: tipadas ? porTipo(tipadas, "busqueda") : [],
    paises: [...proyecto.paises],
    estadosMexico: [...proyecto.estadosMexico],
    idiomas: proyecto.idiomas.length > 0 ? [...proyecto.idiomas] : ["es"],
    redesConectadas: [...proyecto.redesConectadas],
    fuentesNoticias: proyecto.fuentesNoticias.map(({ url, nombre }) => ({
      url,
      ...(nombre ? { nombre } : {}),
    })),
  };
}

function Stepper({
  paso,
  pasos,
  onIrAPaso,
  irAPasoAria,
  deshabilitado,
}: {
  paso: number;
  pasos: { id: number; etiqueta: string }[];
  onIrAPaso: (destino: number) => void;
  irAPasoAria: (step: string) => string;
  deshabilitado?: boolean;
}) {
  return (
    <ol className="mx-auto flex w-full max-w-md items-start justify-between">
      {pasos.map((item, index) => {
        const activo = paso === item.id;
        const completado = paso > item.id;
        const esUltimo = index === pasos.length - 1;

        return (
          <li
            key={item.id}
            className={cn(
              "relative flex flex-1 flex-col items-center",
              !esUltimo &&
                "after:absolute after:top-4 after:left-[calc(50%+1.25rem)] after:h-px after:w-[calc(100%-2.5rem)] after:bg-border-default",
              completado && "after:bg-primary/40",
            )}
          >
            <button
              type="button"
              disabled={deshabilitado || activo}
              onClick={() => onIrAPaso(item.id)}
              aria-current={activo ? "step" : undefined}
              aria-label={irAPasoAria(item.etiqueta)}
              className={cn(
                "relative z-[1] flex flex-col items-center rounded-lg transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base",
                !activo && !deshabilitado && "cursor-pointer",
                deshabilitado && "pointer-events-none opacity-60",
              )}
            >
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-lg text-sm font-semibold transition-colors",
                  activo &&
                    "bg-primary text-primary-fg ring-2 ring-border-default ring-offset-2 ring-offset-bg-base",
                  completado && !activo && "bg-primary/15 text-primary",
                  !activo && !completado && "bg-bg-muted text-text-muted",
                  !activo &&
                    !deshabilitado &&
                    "group-hover:bg-primary/25 hover:bg-primary/20",
                )}
              >
                {item.id}
              </span>
              <span
                className={cn(
                  "mt-2 max-w-[6.5rem] text-center text-xs font-medium leading-tight transition-colors",
                  activo ? "text-text-primary" : "text-text-muted",
                  !activo && !deshabilitado && "hover:text-text-secondary",
                )}
              >
                {item.etiqueta}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Una sección de palabras clave con su propio tope real (nombre/red
 * social/búsqueda) — antes había un solo campo sin límite donde cabía
 * cualquier cantidad de términos sueltos (caso real: SEMARNAT con 37, ver
 * project_youtube_query_fix). El contador "x/tope" y el input deshabilitado
 * al llegar al máximo son la primera línea de defensa; el backend lo
 * refuerza del otro lado por si alguien pega el body a mano.
 */
function SeccionPalabrasClave({
  id,
  label,
  help,
  placeholder,
  addLabel,
  valores,
  input,
  onInputChange,
  onAgregar,
  onEliminar,
  tope,
  error,
  removeAria,
  tooltip,
  tooltipAria,
}: {
  id: string;
  label: string;
  help?: string;
  placeholder: string;
  addLabel: string;
  valores: string[];
  input: string;
  onInputChange: (valor: string) => void;
  onAgregar: () => void;
  onEliminar: (palabra: string) => void;
  tope: number;
  error?: string;
  removeAria: (palabra: string) => string;
  tooltip?: string;
  tooltipAria?: string;
}) {
  const alTope = valores.length >= tope;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Label htmlFor={id}>{label}</Label>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex size-5 cursor-help items-center justify-center rounded-full text-text-muted transition-colors hover:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-label={tooltipAria}
              >
                <InfoIcon className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              {tooltip}
            </TooltipContent>
          </Tooltip>
        )}
        <span className="ml-auto shrink-0 text-[11px] text-text-muted tabular-nums">
          {valores.length}/{tope}
        </span>
      </div>
      {help && <p className="text-xs text-text-muted">{help}</p>}
      <div className="flex gap-2">
        <Input
          id={id}
          placeholder={placeholder}
          value={input}
          disabled={alTope}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAgregar();
            }
          }}
        />
        <Button
          type="button"
          variant="secondary"
          onClick={onAgregar}
          disabled={alTope}
        >
          <PlusIcon className="size-4" />
          {addLabel}
        </Button>
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
      {valores.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2">
          {valores.map((palabra) => (
            <li key={palabra}>
              <span className="group inline-flex items-center gap-1 rounded-full bg-bg-muted px-2.5 py-1 text-xs font-medium text-text-secondary transition-colors hover:bg-primary/10 hover:text-primary">
                {palabra}
                <button
                  type="button"
                  aria-label={removeAria(palabra)}
                  className="cursor-pointer rounded-full p-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  onClick={() => onEliminar(palabra)}
                >
                  <XIcon className="size-3.5" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function FormularioNuevoProyecto({
  abierto,
  onAbiertoChange,
  proyectoEdicion = null,
  onCreado,
  onActualizado,
}: FormularioNuevoProyectoProps) {
  const t = useTranslations("projects");
  const tCommon = useTranslations("common");
  const esEdicion = !!proyectoEdicion;
  const esquema = useMemo(() => crearEsquemaProyecto(t), [t]);
  const pasos = PASOS_CLAVES.map((item) => ({
    id: item.id,
    etiqueta: t(item.clave),
  }));
  const [paso, setPaso] = useState(1);
  const [inputNombre, setInputNombre] = useState("");
  const [inputRedSocial, setInputRedSocial] = useState("");
  const [inputBusqueda, setInputBusqueda] = useState("");
  const [fuenteUrl, setFuenteUrl] = useState("");
  const [fuenteNombre, setFuenteNombre] = useState("");
  const [errorFuente, setErrorFuente] = useState<string | null>(null);
  const [errorImagen, setErrorImagen] = useState<string | null>(null);
  const [transicionando, setTransicionando] = useState(false);
  const inputImagenRef = useRef<HTMLInputElement>(null);
  const timeoutTransicionRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    setError,
    clearErrors,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormularioProyecto>({
    resolver: zodResolver(esquema),
    defaultValues: VALORES_INICIALES,
    mode: "onSubmit",
  });

  const nombre = watch("nombre");
  const imagenUrl = watch("imagenUrl");
  const nombresFuncionario = watch("nombresFuncionario");
  const usuariosRedes = watch("usuariosRedes");
  const busquedasAsociadas = watch("busquedasAsociadas");
  const paises = watch("paises");
  const redesConectadas = watch("redesConectadas");
  const fuentesNoticias = watch("fuentesNoticias");
  const incluyeMexico = paises.includes("MX");

  const preview = useMemo(() => {
    const gradiente = gradienteDesdeNombre(nombre || "Proyecto");
    return {
      iniciales: inicialesDesdeNombre(nombre || "P"),
      ...gradiente,
    };
  }, [nombre]);

  useEffect(() => {
    if (!abierto) {
      setPaso(1);
      setInputNombre("");
      setInputRedSocial("");
      setInputBusqueda("");
      setFuenteUrl("");
      setFuenteNombre("");
      setErrorFuente(null);
      setErrorImagen(null);
      if (inputImagenRef.current) inputImagenRef.current.value = "";
      reset(VALORES_INICIALES);
      if (timeoutTransicionRef.current) {
        clearTimeout(timeoutTransicionRef.current);
        timeoutTransicionRef.current = null;
      }
      setTransicionando(false);
      return;
    }

    setPaso(1);
    setInputNombre("");
    setInputRedSocial("");
    setInputBusqueda("");
    setFuenteUrl("");
    setFuenteNombre("");
    setErrorFuente(null);
    setErrorImagen(null);
    if (inputImagenRef.current) inputImagenRef.current.value = "";
    reset(
      proyectoEdicion
        ? valoresDesdeProyecto(proyectoEdicion)
        : VALORES_INICIALES,
    );
  }, [abierto, proyectoEdicion, reset]);

  useEffect(() => {
    return () => {
      if (timeoutTransicionRef.current)
        clearTimeout(timeoutTransicionRef.current);
    };
  }, []);

  function agregarPalabraClave(
    campo: CampoPalabraClave,
    valorCrudo: string,
    limpiarInput: () => void,
  ) {
    const valor = valorCrudo.trim();
    if (!valor) return;
    if (campo === "busquedasAsociadas" && valor.length < LARGO_MÍNIMO_BUSQUEDA) {
      setError(campo, { message: t("keywordsSearchTooShort", { min: LARGO_MÍNIMO_BUSQUEDA }) });
      return;
    }
    const actuales = getValues(campo);
    if (actuales.some((k) => k.toLowerCase() === valor.toLowerCase())) {
      limpiarInput();
      return;
    }
    if (actuales.length >= TOPES_PALABRAS_CLAVE[TIPO_POR_CAMPO[campo]]) return;
    setValue(campo, [...actuales, valor], { shouldValidate: true });
    clearErrors(campo);
    limpiarInput();
  }

  function eliminarPalabraClave(campo: CampoPalabraClave, palabra: string) {
    setValue(
      campo,
      getValues(campo).filter((k) => k !== palabra),
      { shouldValidate: true },
    );
  }

  function alternarRed(red: RedSocialProyecto) {
    const actuales = getValues("redesConectadas") ?? [];
    setValue(
      "redesConectadas",
      actuales.includes(red)
        ? actuales.filter((r) => r !== red)
        : [...actuales, red],
    );
  }

  function agregarFuente() {
    const url = fuenteUrl.trim();
    try {
      const parsed = new URL(url);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new Error("protocolo");
      }
    } catch {
      setErrorFuente(t("invalidUrl"));
      return;
    }

    const actuales = getValues("fuentesNoticias") ?? [];
    if (actuales.some((f) => f.url === url)) {
      setErrorFuente(t("duplicateSource"));
      return;
    }

    setValue("fuentesNoticias", [
      ...actuales,
      { url, nombre: fuenteNombre.trim() || undefined },
    ]);
    setFuenteUrl("");
    setFuenteNombre("");
    setErrorFuente(null);
  }

  function eliminarFuente(url: string) {
    setValue(
      "fuentesNoticias",
      (getValues("fuentesNoticias") ?? []).filter((f) => f.url !== url),
    );
  }

  function quitarImagen() {
    setValue("imagenUrl", null);
    setErrorImagen(null);
    if (inputImagenRef.current) inputImagenRef.current.value = "";
  }

  function alSeleccionarImagen(file: File | undefined) {
    if (!file) {
      quitarImagen();
      return;
    }

    if (!esArchivoImagen(file)) {
      setErrorImagen(t("imageTypeError"));
      if (inputImagenRef.current) inputImagenRef.current.value = "";
      return;
    }

    setErrorImagen(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setValue("imagenUrl", reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  function validarPaso(pasoObjetivo: number): boolean {
    const valores = getValues();
    if (pasoObjetivo === 1) {
      let ok = true;
      if (valores.nombre.trim().length < 2) {
        setError("nombre", { message: t("nameInvalid") });
        ok = false;
      } else {
        clearErrors("nombre");
      }
      if (!valores.descripcion.trim()) {
        setError("descripcion", { message: t("descriptionRequired") });
        ok = false;
      } else {
        clearErrors("descripcion");
      }
      if (!valores.tipo) {
        setError("tipo", { message: t("typeRequired") });
        ok = false;
      } else {
        clearErrors("tipo");
      }
      return ok;
    }
    if (pasoObjetivo === 2) {
      let ok = true;
      if (valores.nombresFuncionario.length < 1) {
        setError("nombresFuncionario", {
          message: t("keywordsNameMin"),
        });
        ok = false;
      } else {
        clearErrors("nombresFuncionario");
      }
      if (valores.paises.length < 1) {
        setError("paises", { message: t("countryMin") });
        ok = false;
      } else {
        clearErrors("paises");
      }
      if (valores.paises.includes("MX") && valores.estadosMexico.length < 1) {
        setError("estadosMexico", {
          message: t("stateMin"),
        });
        ok = false;
      } else {
        clearErrors("estadosMexico");
      }
      return ok;
    }
    return true;
  }

  function animarTransicion(destino: number) {
    setPaso(destino);
    setTransicionando(true);
    timeoutTransicionRef.current = setTimeout(() => {
      setTransicionando(false);
    }, 400);
  }

  function irAPaso(destino: number) {
    if (transicionando || destino === paso) return;

    // Retroceder siempre es seguro; avanzar exige validar pasos intermedios
    if (destino < paso) {
      animarTransicion(destino);
      return;
    }

    for (let p = paso; p < destino; p++) {
      if (!validarPaso(p)) {
        // Si falló un paso distinto al actual, llevar al usuario ahí
        if (p !== paso) animarTransicion(p);
        return;
      }
    }

    animarTransicion(destino);
  }

  function siguiente() {
    if (transicionando) return;
    irAPaso(Math.min(3, paso + 1));
  }

  function anterior() {
    if (transicionando) return;
    irAPaso(Math.max(1, paso - 1));
  }

  const onSubmit = handleSubmit(async (datos) => {
    // El formulario mantiene las 3 listas separadas para la UX (tope propio
    // por sección) — la API real solo conoce un arreglo con el tipo real de
    // cada una, mismo formato que ya guarda project_keywords.
    const { nombresFuncionario, usuariosRedes, busquedasAsociadas, ...resto } = datos;
    const solicitud = {
      ...resto,
      palabrasClave: [
        ...nombresFuncionario.map((palabra) => ({ palabra, tipo: "nombre" as const })),
        ...usuariosRedes.map((palabra) => ({ palabra, tipo: "red_social" as const })),
        ...busquedasAsociadas.map((palabra) => ({ palabra, tipo: "busqueda" as const })),
      ],
    };
    try {
      if (proyectoEdicion) {
        const respuesta = await apiActualizarProyecto(
          proyectoEdicion.id,
          solicitud,
        );
        onActualizado?.(respuesta.proyecto);
      } else {
        const respuesta = await apiCrearProyecto(solicitud);
        onCreado(respuesta.proyecto);
      }
      onAbiertoChange(false);
    } catch (error) {
      setError("nombre", {
        message:
          error instanceof Error
            ? error.message
            : esEdicion
              ? t("updateFailed")
              : t("createFailed"),
      });
      setPaso(1);
    }
  });

  return (
    <Dialog open={abierto} onOpenChange={onAbiertoChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {esEdicion ? t("editProject") : t("newProject")}
          </DialogTitle>
          <DialogDescription key={paso}>
            {t(DESCRIPCION_CLAVES[paso - 1])}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6">
          <Stepper
            paso={paso}
            pasos={pasos}
            onIrAPaso={irAPaso}
            irAPasoAria={(step) => t("stepGoTo", { step })}
            deshabilitado={transicionando}
          />
        </div>

        <form className="mt-2" onSubmit={onSubmit} noValidate>
          {paso === 1 && (
            <div className="space-y-1">
              <div className="flex flex-col items-center gap-3 text-center">
                <button
                  type="button"
                  onClick={() => inputImagenRef.current?.click()}
                  className={cn(
                    "relative flex size-20 cursor-pointer items-center justify-center overflow-hidden rounded-full text-lg font-bold text-white ring-2 ring-border-default/40 transition-opacity hover:opacity-90",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
                  )}
                  style={
                    imagenUrl
                      ? undefined
                      : {
                          background: `linear-gradient(135deg, ${preview.inicio} 0%, ${preview.fin} 100%)`,
                        }
                  }
                  aria-label={t("selectImageAria")}
                >
                  {imagenUrl ? (
                    // biome-ignore lint/performance/noImgElement: preview local data URL
                    <img
                      src={imagenUrl}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    preview.iniciales
                  )}
                </button>
                <input
                  ref={inputImagenRef}
                  id="imagen-proyecto"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
                  className="sr-only"
                  onChange={(e) => {
                    alSeleccionarImagen(e.target.files?.[0]);
                  }}
                />
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => inputImagenRef.current?.click()}
                  >
                    <ImageIcon className="size-4" />
                    {imagenUrl ? t("changeImage") : t("uploadImage")}
                  </Button>
                  {imagenUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={quitarImagen}
                    >
                      {tCommon("remove")}
                    </Button>
                  )}
                </div>
                {errorImagen && (
                  <p className="text-xs text-error">{errorImagen}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nombre-proyecto">{t("projectNameLabel")}</Label>
                <Input
                  id="nombre-proyecto"
                  placeholder={t("namePlaceholder")}
                  aria-invalid={!!errors.nombre}
                  {...register("nombre", {
                    onChange: () => clearErrors("nombre"),
                  })}
                />
                {errors.nombre && (
                  <p className="text-xs text-error">{errors.nombre.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="descripcion-proyecto">
                  {tCommon("description")}
                </Label>
                <Textarea
                  id="descripcion-proyecto"
                  placeholder={t("descriptionPlaceholder")}
                  aria-invalid={!!errors.descripcion}
                  {...register("descripcion", {
                    onChange: () => clearErrors("descripcion"),
                  })}
                />
                {errors.descripcion && (
                  <p className="text-xs text-error">
                    {errors.descripcion.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>{t("projectType")}</Label>
                <Controller
                  name="tipo"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || undefined}
                      onValueChange={(valor) => {
                        field.onChange(valor);
                        clearErrors("tipo");
                      }}
                    >
                      <SelectTrigger
                        className="h-11 rounded-lg"
                        aria-invalid={!!errors.tipo}
                      >
                        <SelectValue placeholder={t("selectType")} />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS.map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>
                            {t(
                              tipo === "influencer"
                                ? "typeInfluencer"
                                : tipo === "agencia"
                                  ? "typeAgency"
                                  : tipo === "politico"
                                    ? "typePolitician"
                                    : tipo === "marca"
                                      ? "typeBrand"
                                      : tipo === "figura_publica"
                                        ? "typePublicFigure"
                                        : "typeOther",
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.tipo && (
                  <p className="text-xs text-error">{errors.tipo.message}</p>
                )}
              </div>
            </div>
          )}

          {paso === 2 && (
            <div className="space-y-5">
              <SeccionPalabrasClave
                id="palabra-clave-nombre"
                label={t("keywordsNameLabel")}
                help={t("keywordsNameHelp")}
                placeholder={t("keywordsNamePlaceholder")}
                addLabel={tCommon("add")}
                valores={nombresFuncionario}
                input={inputNombre}
                onInputChange={setInputNombre}
                onAgregar={() =>
                  agregarPalabraClave("nombresFuncionario", inputNombre, () =>
                    setInputNombre(""),
                  )
                }
                onEliminar={(palabra) =>
                  eliminarPalabraClave("nombresFuncionario", palabra)
                }
                tope={TOPES_PALABRAS_CLAVE.nombre}
                error={errors.nombresFuncionario?.message}
                removeAria={(palabra) => t("removeKeywordAria", { keyword: palabra })}
              />

              <SeccionPalabrasClave
                id="palabra-clave-red-social"
                label={t("keywordsSocialLabel")}
                help={t("keywordsSocialHelp")}
                placeholder={t("keywordsSocialPlaceholder")}
                addLabel={tCommon("add")}
                valores={usuariosRedes}
                input={inputRedSocial}
                onInputChange={setInputRedSocial}
                onAgregar={() =>
                  agregarPalabraClave("usuariosRedes", inputRedSocial, () =>
                    setInputRedSocial(""),
                  )
                }
                onEliminar={(palabra) => eliminarPalabraClave("usuariosRedes", palabra)}
                tope={TOPES_PALABRAS_CLAVE.red_social}
                error={errors.usuariosRedes?.message}
                removeAria={(palabra) => t("removeKeywordAria", { keyword: palabra })}
              />

              <SeccionPalabrasClave
                id="palabra-clave-busqueda"
                label={t("keywordsSearchLabel")}
                help={t("keywordsSearchHelp")}
                placeholder={t("keywordsSearchPlaceholder")}
                addLabel={tCommon("add")}
                valores={busquedasAsociadas}
                input={inputBusqueda}
                onInputChange={setInputBusqueda}
                onAgregar={() =>
                  agregarPalabraClave("busquedasAsociadas", inputBusqueda, () =>
                    setInputBusqueda(""),
                  )
                }
                onEliminar={(palabra) =>
                  eliminarPalabraClave("busquedasAsociadas", palabra)
                }
                tope={TOPES_PALABRAS_CLAVE.busqueda}
                error={errors.busquedasAsociadas?.message}
                removeAria={(palabra) => t("removeKeywordAria", { keyword: palabra })}
                tooltip={t("keywordsSearchTooltip")}
                tooltipAria={t("keywordsSearchInfoAria")}
              />

              <div className="space-y-1.5">
                <Label>{t("geoScope")}</Label>
                {/* Un solo país por proyecto: el esquema real (projects.country_code)
                 * solo guarda uno — con el multi-select de antes, elegir 2+ países
                 * validaba bien en el formulario pero el backend se quedaba callado
                 * con solo el primero, perdiendo los demás sin avisar. */}
                <Controller
                  name="paises"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value[0] ?? ""}
                      onValueChange={(siguiente) => {
                        field.onChange([siguiente]);
                        clearErrors("paises");
                        if (siguiente !== "MX") {
                          setValue("estadosMexico", [], {
                            shouldValidate: false,
                          });
                          clearErrors("estadosMexico");
                        }
                      }}
                    >
                      <SelectTrigger aria-invalid={!!errors.paises}>
                        <SelectValue placeholder={t("selectCountries")} />
                      </SelectTrigger>
                      <SelectContent>
                        {PAISES.map((pais) => (
                          <SelectItem key={pais.value} value={pais.value}>
                            {t(pais.clave)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.paises && (
                  <p className="text-xs text-error">{errors.paises.message}</p>
                )}
              </div>

              {incluyeMexico && (
                <div className="space-y-1.5">
                  <Label>{t("mexicoStates")}</Label>
                  <Controller
                    name="estadosMexico"
                    control={control}
                    render={({ field }) => (
                      <MultiSelect
                        opciones={[...ESTADOS_MEXICO]}
                        value={field.value}
                        onChange={(siguiente) => {
                          field.onChange(siguiente);
                          clearErrors("estadosMexico");
                        }}
                        placeholder={t("selectStates")}
                        mostrarSeleccionarTodos
                        aria-invalid={!!errors.estadosMexico}
                      />
                    )}
                  />
                  {errors.estadosMexico && (
                    <p className="text-xs text-error">
                      {errors.estadosMexico.message}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {paso === 3 && (
            <div className="space-y-8">
              <section className="space-y-3" aria-labelledby="fuentes-redes">
                <div className="space-y-1">
                  <Label id="fuentes-redes">{t("connectSocial")}</Label>
                  <p className="text-xs text-text-muted">
                    {t("connectSocialHelp")}
                  </p>
                </div>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {REDES.map((red) => {
                    const conectada = (redesConectadas ?? []).includes(red.id);
                    return (
                      <li key={red.id}>
                        <button
                          type="button"
                          onClick={() => alternarRed(red.id)}
                          aria-pressed={conectada}
                          className={cn(
                            "flex w-full cursor-pointer items-center gap-3 rounded-lg border px-3 py-3 text-left text-sm transition-colors",
                            conectada
                              ? "border-primary/40 bg-primary/5 text-text-primary"
                              : "border-border-default text-text-secondary hover:bg-bg-muted",
                          )}
                        >
                          <span
                            className="flex size-9 items-center justify-center rounded-lg bg-bg-muted"
                            style={{ color: red.color }}
                          >
                            <BrandIcon icon={red.icon} title={red.etiqueta} />
                          </span>
                          <span className="flex-1 font-medium">
                            {red.etiqueta}
                          </span>
                          <Badge
                            variante={conectada ? "positivo" : "neutral"}
                            className="rounded-lg"
                          >
                            {conectada ? t("connected") : t("connect")}
                          </Badge>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <section className="space-y-3" aria-labelledby="fuentes-noticias">
                <div className="space-y-1">
                  <Label id="fuentes-noticias">{t("customNewsSources")}</Label>
                  <p className="text-xs text-text-muted">
                    {t("customNewsHelp")}
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <Input
                    placeholder="https://medio.example/rss"
                    value={fuenteUrl}
                    onChange={(e) => {
                      setFuenteUrl(e.target.value);
                      setErrorFuente(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        agregarFuente();
                      }
                    }}
                  />
                  <Input
                    placeholder={t("sourceNameOptional")}
                    value={fuenteNombre}
                    onChange={(e) => setFuenteNombre(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        agregarFuente();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={agregarFuente}
                  >
                    <PlusIcon className="size-4" />
                    {tCommon("add")}
                  </Button>
                </div>
                {errorFuente && (
                  <p className="text-xs text-error">{errorFuente}</p>
                )}
                {(fuentesNoticias ?? []).length > 0 && (
                  <ul className="space-y-1.5">
                    {(fuentesNoticias ?? []).map((fuente) => (
                      <li
                        key={fuente.url}
                        className="flex items-center justify-between gap-2 rounded-lg border border-border-default/60 px-3 py-2 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-text-primary">
                            {fuente.nombre || fuente.url}
                          </p>
                          {fuente.nombre && (
                            <p className="truncate text-xs text-text-muted">
                              {fuente.url}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          aria-label={t("removeSourceAria")}
                          className="cursor-pointer rounded-lg p-1 text-text-muted transition-colors hover:bg-bg-muted hover:text-error"
                          onClick={() => eliminarFuente(fuente.url)}
                        >
                          <XIcon className="size-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}

          <DialogFooter className="border-t border-border-default/40 pt-4">
            {paso > 1 ? (
              <Button
                type="button"
                variant="ghost"
                onClick={anterior}
                disabled={transicionando}
                className="sm:mr-auto"
              >
                <ArrowLeftIcon className="size-4" />
                {tCommon("back")}
              </Button>
            ) : (
              <span className="sm:mr-auto" />
            )}

            {paso < 3 ? (
              <Button
                type="button"
                onClick={siguiente}
                disabled={transicionando}
              >
                {tCommon("next")}
                <ArrowRightIcon className="size-4" />
              </Button>
            ) : isSubmitting ? (
              <Button type="submit" disabled>
                {esEdicion ? tCommon("saving") : t("creating")}
              </Button>
            ) : (
              <SlideArrowButton type="submit" disabled={transicionando}>
                {esEdicion ? tCommon("saveChanges") : t("createProject")}
              </SlideArrowButton>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
