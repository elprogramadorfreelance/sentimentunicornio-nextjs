// Cliente para el backend real (sentiment-api). Usado solo desde Route
// Handlers (servidor) — nunca desde el navegador, por eso no es NEXT_PUBLIC_*.
export const BACKEND_URL = process.env.SENTIMENT_BACKEND_URL ?? "http://localhost:3001";

export class BackendError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type RespuestaEnvuelta<T> = { ok?: boolean; message?: string; data?: T };

/** Llama al backend y regresa el body completo, tal cual (para casos con campos extra como max_projects). */
export async function backendGetRaw<T>(path: string): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, { cache: "no-store" });
  if (!res.ok) {
    throw new BackendError(res.status, `El backend respondió ${res.status} en ${path}`);
  }
  return res.json() as Promise<T>;
}

/** Llama al backend y extrae body.data (la envoltura {ok, data} que usa sentiment-api). */
export async function backendGet<T>(path: string): Promise<T> {
  const body = await backendGetRaw<RespuestaEnvuelta<T>>(path);
  if (body.ok === false) {
    throw new BackendError(500, body.message ?? "Error del backend");
  }
  return (body.data ?? (body as unknown as T)) as T;
}

async function backendSend<T>(
  método: "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  cuerpo?: unknown,
): Promise<RespuestaEnvuelta<T>> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    method: método,
    headers: cuerpo !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    cache: "no-store",
  });
  const body = (await res.json().catch(() => ({}))) as RespuestaEnvuelta<T> & {
    message?: string;
  };
  if (!res.ok || body.ok === false) {
    throw new BackendError(res.status, body.message ?? `El backend respondió ${res.status} en ${path}`);
  }
  return body;
}

export const backendPost = <T>(path: string, cuerpo?: unknown) => backendSend<T>("POST", path, cuerpo);
export const backendPut = <T>(path: string, cuerpo?: unknown) => backendSend<T>("PUT", path, cuerpo);
export const backendPatch = <T>(path: string, cuerpo?: unknown) => backendSend<T>("PATCH", path, cuerpo);
export const backendDelete = <T>(path: string, cuerpo?: unknown) => backendSend<T>("DELETE", path, cuerpo);
