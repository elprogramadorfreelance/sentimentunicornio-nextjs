// Facturación real — plan/límite reales de la organización del usuario en
// sesión; sin pasarela de pago conectada, así que "cambiar plan"/"cancelar"
// generan una solicitud real por correo en vez de simular un cobro.
import { backendGet, backendPost } from "@/lib/backend";
import type { RespuestaFacturación, RespuestaSolicitudFacturación, TipoSolicitudFacturación } from "@/types";

type FacturaciónBackend = {
  organizacion: string;
  plan: string;
  max_proyectos: number;
  proyectos_activos: number;
};

export async function obtenerFacturaciónReal(userId: number): Promise<RespuestaFacturación> {
  const data = await backendGet<FacturaciónBackend>(`/api/facturacion?user_id=${userId}`);
  return {
    organización: data.organizacion,
    plan: data.plan,
    maxProyectos: data.max_proyectos,
    proyectosActivos: data.proyectos_activos,
  };
}

export async function solicitarFacturaciónReal(
  userId: number,
  tipo: TipoSolicitudFacturación,
  planDeseado?: string,
  comentario?: string,
): Promise<RespuestaSolicitudFacturación> {
  const respuesta = await backendPost<{ enviado: boolean }>("/api/facturacion/solicitud", {
    user_id: userId,
    tipo,
    plan_deseado: planDeseado,
    comentario,
  });
  return {
    mensaje: respuesta.message ?? "Recibimos tu solicitud.",
    enviado: respuesta.data?.enviado ?? false,
  };
}
