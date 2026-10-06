// Sesión real — solo servidor (Route Handlers, Server Components, middleware).
// El token vive en una cookie httpOnly (`sesion_token`); nunca se expone al
// JS del navegador. Cada resolución revalida contra /api/auth/session en el
// backend real, así una sesión revocada (logout, cuenta archivada) deja de
// funcionar de inmediato sin esperar a que expire la cookie.
import { cookies } from "next/headers";
import { backendGetRaw, backendPost } from "@/lib/backend";
import type { SesiónUsuario } from "@/types";

export const COOKIE_SESION = "sesion_token";

type RespuestaSesion = { ok: boolean; data?: SesiónUsuario; message?: string };

export async function obtenerSesión(): Promise<SesiónUsuario | null> {
  const token = (await cookies()).get(COOKIE_SESION)?.value;
  if (!token) return null;
  try {
    const body = await backendGetRaw<RespuestaSesion>(
      `/api/auth/session?token=${encodeURIComponent(token)}`,
    );
    return body.ok ? (body.data ?? null) : null;
  } catch {
    return null;
  }
}

/** Params reales para pasarle a endpoints del backend que ya soportan `?user_id=&role=` (ver `resolveUser` en server.js). Cae a nada (demo) si no hay sesión — mismo comportamiento que hoy. */
export function paramsSesión(sesión: SesiónUsuario | null): string {
  if (!sesión) return "";
  return `user_id=${sesión.id}&role=${sesión.role}`;
}

/** Resuelve la sesión actual y arma el sufijo `?user_id=&role=` listo para pegar a una URL — "" si no hay sesión. */
export async function sufijoSesión(): Promise<string> {
  const query = paramsSesión(await obtenerSesión());
  return query ? `?${query}` : "";
}

// Límite de historial para cuentas plan "basic" (pedido del dueño,
// 2026-09-30): solo pueden ver los últimos 7 días; para ver más atrás,
// tienen que subir a plan Pro. Se aplica aquí (centralizado) y se usa desde
// cada Route Handler que acepta un rango de calendario — así ningún
// endpoint se queda sin el límite por accidente, y no se puede saltar
// pidiendo la URL directa con `?inicio=...` (el límite es del backend, no
// solo de que el calendario no deje elegir).
export const LÍMITE_DÍAS_PLAN_BASIC = 7;

export type LímiteHistórico = { activo: boolean; días: number };

export function aplicarLímiteHistóricoPlan(
  rango: { inicio: string; fin: string } | null,
  plan: string | null | undefined,
): { rango: { inicio: string; fin: string } | null; límite: LímiteHistórico } {
  if (plan !== "basic") {
    return { rango, límite: { activo: false, días: LÍMITE_DÍAS_PLAN_BASIC } };
  }
  const hoy = new Date();
  const inicioMínimo = new Date(hoy);
  inicioMínimo.setDate(inicioMínimo.getDate() - (LÍMITE_DÍAS_PLAN_BASIC - 1));
  const inicioMínimoIso = inicioMínimo.toISOString().slice(0, 10);
  const hoyIso = hoy.toISOString().slice(0, 10);

  if (!rango) {
    // Sin rango elegido en el calendario: el default normal (30 días) se
    // acota a 7 para plan basic — mismo mecanismo cubre "sin elegir nada" y
    // "eligió algo muy viejo" con una sola regla.
    return { rango: { inicio: inicioMínimoIso, fin: hoyIso }, límite: { activo: true, días: LÍMITE_DÍAS_PLAN_BASIC } };
  }
  if (rango.inicio < inicioMínimoIso) {
    return {
      rango: { inicio: inicioMínimoIso, fin: rango.fin },
      límite: { activo: true, días: LÍMITE_DÍAS_PLAN_BASIC },
    };
  }
  return { rango, límite: { activo: false, días: LÍMITE_DÍAS_PLAN_BASIC } };
}

export async function cerrarSesión(): Promise<void> {
  const token = (await cookies()).get(COOKIE_SESION)?.value;
  if (token) {
    await backendPost("/api/auth/logout", { token }).catch(() => {});
  }
  (await cookies()).delete(COOKIE_SESION);
}
