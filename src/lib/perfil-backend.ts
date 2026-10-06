// Perfil real — todo aquí exige un `SesiónUsuario` resuelto por
// obtenerSesión() (nunca un user_id que venga del cuerpo del request del
// navegador) para que nadie pueda editar/eliminar/traspasar una cuenta que
// no es la suya con solo cambiar un número en el body.
import { backendDelete, backendPost, backendPut } from "@/lib/backend";
import type {
  PerfilUsuario,
  PropósitoOtp,
  RespuestaEnviarOtp,
  RespuestaVerificarOtp,
  SesiónUsuario,
} from "@/types";

const ETIQUETA_ROL: Record<SesiónUsuario["role"], string> = {
  superadmin: "Superadmin",
  admin: "Administrador",
  editor: "Editor",
  viewer: "Lector",
};

function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? "") + (partes[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function perfilDesdeSesión(sesión: SesiónUsuario): PerfilUsuario {
  return {
    id: String(sesión.id),
    nombre: sesión.name,
    rol: sesión.role,
    email: sesión.email,
    iniciales: iniciales(sesión.name),
  };
}

export const ETIQUETA_ROL_PERFIL = ETIQUETA_ROL;

export async function actualizarNombreReal(userId: number, nombre: string): Promise<void> {
  await backendPut(`/api/auth/profile`, { user_id: userId, name: nombre });
}

export async function cambiarPasswordReal(userId: number, tokenCambio: string, nuevaPassword: string): Promise<void> {
  await backendPost(`/api/perfil/password`, {
    user_id: userId,
    token_cambio: tokenCambio,
    nueva_password: nuevaPassword,
  });
}

export async function enviarOtpReal(userId: number, propósito: PropósitoOtp): Promise<RespuestaEnviarOtp> {
  const motivo: Record<PropósitoOtp, string> = {
    cambiar_correo: "cambiar tu correo",
    cambiar_password: "cambiar tu contraseña",
    eliminar_cuenta: "eliminar tu cuenta",
    traspasar_cuenta: "traspasar tu cuenta",
  };
  const respuesta = await backendPost<{ enviado: boolean; message: string }>("/api/perfil/otp/enviar", {
    user_id: userId,
    motivo: motivo[propósito],
  });
  return { mensaje: respuesta.data?.message ?? "", enviado: respuesta.data?.enviado ?? false };
}

export async function verificarOtpReal(userId: number, código: string): Promise<RespuestaVerificarOtp> {
  try {
    const respuesta = await backendPost<{ tokenCambio: string }>("/api/perfil/otp/verificar", {
      user_id: userId,
      codigo: código,
    });
    const tokenCambio = (respuesta.data as { tokenCambio: string } | undefined)?.tokenCambio;
    if (!tokenCambio) return { válido: false, mensaje: "Código incorrecto o expirado. Solicita uno nuevo." };
    return { válido: true, tokenCambio, mensaje: "Código verificado." };
  } catch {
    return { válido: false, mensaje: "Código incorrecto o expirado. Solicita uno nuevo." };
  }
}

// Cambio de correo y traspaso ya NO se aplican aquí — solo piden al backend
// que mande el correo real con el link mágico de confirmación (24h). El
// cambio de verdad ocurre cuando el usuario da clic, en
// GET /api/perfil/confirmar (ver esa ruta).
export async function solicitarCambioCorreoReal(userId: number, nuevoEmail: string): Promise<string> {
  const body = await backendPost<{ message: string }>("/api/perfil/correo/solicitar", {
    user_id: userId,
    nuevo_correo: nuevoEmail,
  });
  return body.message ?? "Revisa tu correo nuevo para confirmar el cambio.";
}

export async function eliminarCuentaReal(userId: number, tokenCambio: string, sesionToken: string): Promise<void> {
  await backendDelete(`/api/perfil`, { user_id: userId, token_cambio: tokenCambio, token: sesionToken });
}

export async function solicitarTraspasoReal(userId: number, emailDestino: string): Promise<string> {
  const body = await backendPost<{ message: string }>("/api/perfil/traspasar/solicitar", {
    user_id: userId,
    correo_destino: emailDestino,
  });
  return body.message ?? "Revisa tu correo para confirmar el traspaso.";
}
