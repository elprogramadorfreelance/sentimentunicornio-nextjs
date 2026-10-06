"use client";

import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import {
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import { apiCrearOrganizacion } from "@/lib/api";
import type { OrganizaciónAdmin } from "@/types";

type TablaOrganizacionesProps = {
  organizaciones: OrganizaciónAdmin[];
  onOrganizacionCreada: (organizacion: OrganizaciónAdmin) => void;
};

export function TablaOrganizaciones({ organizaciones, onOrganizacionCreada }: TablaOrganizacionesProps) {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [nombre, setNombre] = useState("");
  const [creando, setCreando] = useState(false);

  async function crear() {
    if (!nombre.trim()) return;
    setCreando(true);
    try {
      const org = await apiCrearOrganizacion({ name: nombre.trim() });
      onOrganizacionCreada(org);
      toast.success(t("orgCreated"), { description: org.name });
      setModalAbierto(false);
      setNombre("");
    } catch (error) {
      toast.error(t("orgCreateFailed"), {
        description: error instanceof Error ? error.message : tCommon("tryAgain"),
      });
    } finally {
      setCreando(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setModalAbierto(true)}>
          <PlusIcon className="size-4" />
          {t("newOrg")}
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tCommon("name")}</TableHead>
              <TableHead>{t("plan")}</TableHead>
              <TableHead className="text-right">{t("usersHeader")}</TableHead>
              <TableHead className="text-right">{tCommon("projects")}</TableHead>
              <TableHead className="text-right">{t("projectLimit")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizaciones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-text-muted">
                  {t("noOrgs")}
                </TableCell>
              </TableRow>
            ) : (
              organizaciones.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium text-text-primary">{o.name}</TableCell>
                  <TableCell className="text-text-secondary capitalize">{o.plan}</TableCell>
                  <TableCell className="text-right tabular-nums text-text-primary">{o.user_count}</TableCell>
                  <TableCell className="text-right tabular-nums text-text-primary">{o.project_count}</TableCell>
                  <TableCell className="text-right tabular-nums text-text-muted">{o.max_projects}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("newOrg")}</DialogTitle>
          </DialogHeader>
          <div>
            <Label htmlFor="nueva-org-nombre">{tCommon("name")}</Label>
            <Input
              id="nueva-org-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder={t("orgNamePlaceholder")}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAbierto(false)}>
              {tCommon("cancel")}
            </Button>
            <Button onClick={crear} disabled={creando || !nombre.trim()}>
              {creando ? t("creating") : t("create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
