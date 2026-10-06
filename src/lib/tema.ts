export const TEMAS = ["light", "dark", "system"] as const;

export type Tema = (typeof TEMAS)[number];

export type TemaResuelto = "light" | "dark";

export const defaultTema: Tema = "light";

export const COOKIE_TEMA = "theme";

export const COOKIE_TEMA_MAX_AGE = 60 * 60 * 24 * 365;

export function esTema(valor: unknown): valor is Tema {
  return valor === "light" || valor === "dark" || valor === "system";
}

export function resolverTema(
  preferencia: Tema,
  sistemaOscuro: boolean,
): TemaResuelto {
  if (preferencia === "system") {
    return sistemaOscuro ? "dark" : "light";
  }
  return preferencia;
}

export function aplicarTemaResuelto(resuelto: TemaResuelto): void {
  const raiz = document.documentElement;
  raiz.classList.toggle("dark", resuelto === "dark");
  raiz.style.colorScheme = resuelto;
}

export function escribirCookieTema(tema: Tema): void {
  // biome-ignore lint/suspicious/noDocumentCookie: el script de FOUC debe leerla en el cliente
  document.cookie = `${COOKIE_TEMA}=${tema}; path=/; max-age=${COOKIE_TEMA_MAX_AGE}; SameSite=Lax`;
}

export const SCRIPT_TEMA = `(function(){try{var m=document.cookie.match(/(?:^|; )${COOKIE_TEMA}=([^;]*)/);var t=m?decodeURIComponent(m[1]):"${defaultTema}";if(t!=="light"&&t!=="dark"&&t!=="system")t="${defaultTema}";var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light";}catch(e){}})();`;
