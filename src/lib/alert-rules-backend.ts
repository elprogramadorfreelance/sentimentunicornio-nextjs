// Reglas de alerta configuradas por el propio usuario ("avísame si aparece
// esta palabra o narrativa") — reales, guardadas en la tabla `alert_rules` de
// sentiment-api (misma tabla que las 6 reglas automáticas del sistema, pero
// distinguidas por rule_type). El motor de reglas real las evalúa en cada
// "Analizar ahora" y manda un correo real cuando disparan.
import { backendDelete, backendGet, backendPost, backendPut } from "@/lib/backend";

export type TipoReglaAlerta = "keyword" | "narrativa";

type ReglaAlertaBackend = {
  id: number;
  project_id: number;
  name: string;
  rule_type: "user_keyword" | "user_narrative";
  condition_json: { valor?: string; canal?: string; fecha_inicio?: string | null; fecha_fin?: string | null };
  is_active: boolean;
};

export type ReglaAlerta = {
  id: string;
  proyectoId: string;
  tipo: TipoReglaAlerta;
  valor: string;
  fechaInicio: string | null;
  fechaFin: string | null;
  activa: boolean;
};

function mapearRegla(r: ReglaAlertaBackend): ReglaAlerta {
  return {
    id: String(r.id),
    proyectoId: String(r.project_id),
    tipo: r.rule_type === "user_narrative" ? "narrativa" : "keyword",
    valor: r.condition_json?.valor ?? "",
    fechaInicio: r.condition_json?.fecha_inicio ?? null,
    fechaFin: r.condition_json?.fecha_fin ?? null,
    activa: r.is_active,
  };
}

export async function obtenerReglasAlerta(proyectoId: string): Promise<ReglaAlerta[]> {
  const crudo = await backendGet<ReglaAlertaBackend[]>(`/api/projects/${proyectoId}/alert-rules/custom`);
  return crudo.map(mapearRegla);
}

export async function crearReglaAlerta(
  proyectoId: string,
  datos: { tipo: TipoReglaAlerta; valor: string; fechaInicio: string; fechaFin: string },
): Promise<ReglaAlerta> {
  const respuesta = await backendPost<ReglaAlertaBackend>(`/api/projects/${proyectoId}/alert-rules/custom`, {
    tipo: datos.tipo,
    valor: datos.valor,
    canal: "correo",
    fecha_inicio: datos.fechaInicio,
    fecha_fin: datos.fechaFin,
  });
  if (!respuesta.data) throw new Error(respuesta.message ?? "No se pudo crear la regla.");
  return mapearRegla(respuesta.data);
}

export async function actualizarReglaAlerta(
  proyectoId: string,
  reglaId: string,
  datos: { valor?: string; fechaInicio?: string; fechaFin?: string; activa?: boolean },
): Promise<ReglaAlerta> {
  const respuesta = await backendPut<ReglaAlertaBackend>(`/api/projects/${proyectoId}/alert-rules/custom/${reglaId}`, {
    valor: datos.valor,
    fecha_inicio: datos.fechaInicio,
    fecha_fin: datos.fechaFin,
    is_active: datos.activa,
  });
  if (!respuesta.data) throw new Error(respuesta.message ?? "No se pudo actualizar la regla.");
  return mapearRegla(respuesta.data);
}

export async function eliminarReglaAlerta(proyectoId: string, reglaId: string): Promise<void> {
  await backendDelete(`/api/projects/${proyectoId}/alert-rules/custom/${reglaId}`);
}
