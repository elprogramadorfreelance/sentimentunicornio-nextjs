import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AdminVista } from "@/components/admin";
import { backendGet } from "@/lib/backend";
import { obtenerSesión, paramsSesión } from "@/lib/session";
import type { ConsumoUsuario, OrganizaciónAdmin, UsuarioAdmin } from "@/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin");
  return { title: t("title") };
}
export const dynamic = "force-dynamic";

/** Panel de Super Usuario: crear usuarios, ver consumo real de IA, organizaciones. */
export default async function AdminPage() {
  const sesión = await obtenerSesión();
  // El layout ya exige sesión; aquí se exige además el rol — cualquier otro
  // rol no debe ni ver que esta ruta existe.
  if (!sesión || sesión.role !== "superadmin") redirect("/dashboard");

  const sufijo = paramsSesión(sesión);
  const query = sufijo ? `?${sufijo}` : "";
  const [usuarios, consumo, organizaciones] = await Promise.all([
    backendGet<UsuarioAdmin[]>(`/api/users${query}`).catch(() => []),
    backendGet<ConsumoUsuario[]>(`/api/usage${query}`).catch(() => []),
    backendGet<OrganizaciónAdmin[]>("/api/organizations").catch(() => []),
  ]);

  return (
    <AdminVista
      usuariosIniciales={usuarios}
      consumoInicial={consumo}
      organizacionesIniciales={organizaciones}
    />
  );
}
