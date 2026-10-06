import { z } from "zod";

const REGEX_EMAIL =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export const esquemaEmail = z
  .string()
  .trim()
  .min(1, "El correo es requerido")
  .regex(REGEX_EMAIL, "El correo no tiene un formato válido");

export type RequisitoPassword = {
  id: "longitud" | "mayuscula" | "numero" | "especial";
  etiqueta: string;
  cumple: boolean;
};

export type NivelSeguridadPassword = "vacía" | "débil" | "media" | "fuerte";

export function evaluarPassword(password: string): {
  requisitos: RequisitoPassword[];
  válidos: number;
  esVálida: boolean;
  nivel: NivelSeguridadPassword;
  etiquetaNivel: string;
} {
  const requisitos: RequisitoPassword[] = [
    {
      id: "longitud",
      etiqueta: "Mínimo 8 caracteres",
      cumple: password.length >= 8,
    },
    {
      id: "mayuscula",
      etiqueta: "Al menos una mayúscula",
      cumple: /[A-ZÁÉÍÓÚÑ]/.test(password),
    },
    {
      id: "numero",
      etiqueta: "Al menos un número",
      cumple: /\d/.test(password),
    },
    {
      id: "especial",
      etiqueta: "Al menos un carácter especial",
      cumple: /[^A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s]/.test(password),
    },
  ];

  const válidos = requisitos.filter((r) => r.cumple).length;
  const esVálida = válidos === requisitos.length;

  let nivel: NivelSeguridadPassword = "vacía";
  let etiquetaNivel = "";

  if (password.length === 0) {
    nivel = "vacía";
    etiquetaNivel = "";
  } else if (válidos <= 1) {
    nivel = "débil";
    etiquetaNivel = "Débil";
  } else if (válidos <= 3) {
    nivel = "media";
    etiquetaNivel = "Media";
  } else {
    nivel = "fuerte";
    etiquetaNivel = "Fuerte";
  }

  return { requisitos, válidos, esVálida, nivel, etiquetaNivel };
}

export function mensajeErrorPassword(password: string): string | null {
  const { esVálida, requisitos } = evaluarPassword(password);
  if (esVálida) return null;
  const faltantes = requisitos
    .filter((r) => !r.cumple)
    .map((r) => r.etiqueta.toLowerCase());
  return `La contraseña debe cumplir: ${faltantes.join(", ")}.`;
}

export function validarFormatoEmail(email: string): string | null {
  const resultado = esquemaEmail.safeParse(email);
  if (resultado.success) return null;
  return resultado.error.issues[0]?.message ?? "El correo no es válido";
}
