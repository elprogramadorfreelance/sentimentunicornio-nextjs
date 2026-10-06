"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  Button,
  dígitosNacionalesTeléfono,
  Input,
  PhoneInput,
  Textarea,
} from "@/components/ui";
import { apiSolicitarDemo } from "@/lib/api";

type FormularioDemoValues = {
  nombre: string;
  apellidos?: string;
  telefono?: string;
  email: string;
  comentario?: string;
};

const VALORES_INICIALES: FormularioDemoValues = {
  nombre: "",
  apellidos: "",
  telefono: "",
  email: "",
  comentario: "",
};

export function FormularioDemo() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");

  const esquemaDemo = useMemo(
    () =>
      z.object({
        nombre: z.string().trim().min(1, t("demoNameRequired")),
        apellidos: z.string().optional(),
        telefono: z
          .string()
          .optional()
          .refine((valor) => {
            if (!valor) return true;
            const dígitos = dígitosNacionalesTeléfono(valor);
            return /^\d*$/.test(dígitos);
          }, t("demoPhoneDigits"))
          .refine((valor) => {
            if (!valor) return true;
            return dígitosNacionalesTeléfono(valor).length <= 10;
          }, t("demoPhoneMax")),
        email: z
          .string()
          .trim()
          .min(1, t("emailRequired"))
          .email(t("emailInvalid")),
        comentario: z.string().optional(),
      }),
    [t],
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormularioDemoValues>({
    resolver: zodResolver(esquemaDemo),
    defaultValues: VALORES_INICIALES,
  });

  async function onSubmit(datos: FormularioDemoValues) {
    try {
      const respuesta = await apiSolicitarDemo({
        nombre: datos.nombre,
        apellidos: datos.apellidos?.trim() || undefined,
        telefono: datos.telefono?.trim() || undefined,
        email: datos.email,
        comentario: datos.comentario?.trim() || undefined,
      });

      toast.success(t("demoToastSuccess"), {
        description: respuesta.mensaje,
      });
      reset(VALORES_INICIALES);
    } catch (error) {
      toast.error(t("demoToastError"), {
        description:
          error instanceof Error ? error.message : tCommon("tryAgainLater"),
      });
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-4">
        <div className="space-y-1.5">
          <label
            htmlFor="nombre"
            className="text-sm font-medium text-text-primary"
          >
            {tCommon("name")} <span className="text-error">*</span>
          </label>
          <Input
            id="nombre"
            autoComplete="given-name"
            placeholder={t("demoNamePlaceholder")}
            aria-invalid={!!errors.nombre}
            aria-describedby={errors.nombre ? "nombre-error" : undefined}
            {...register("nombre")}
          />
          {errors.nombre && (
            <p id="nombre-error" className="text-sm text-error" role="alert">
              {errors.nombre.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="apellidos"
            className="text-sm font-medium text-text-primary"
          >
            {t("demoLastName")}
          </label>
          <Input
            id="apellidos"
            autoComplete="family-name"
            placeholder={tCommon("optional")}
            {...register("apellidos")}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="text-sm font-medium text-text-primary"
        >
          {tCommon("email")} <span className="text-error">*</span>
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-error" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="telefono"
          className="text-sm font-medium text-text-primary"
        >
          {tCommon("phone")}
        </label>
        <Controller
          name="telefono"
          control={control}
          render={({ field }) => (
            <PhoneInput
              id="telefono"
              defaultCountry="MX"
              placeholder={t("demoPhonePlaceholder")}
              value={field.value || undefined}
              onChange={(valor) => field.onChange(valor ?? "")}
              onBlur={field.onBlur}
              aria-invalid={!!errors.telefono}
              aria-describedby={errors.telefono ? "telefono-error" : undefined}
            />
          )}
        />
        {errors.telefono && (
          <p id="telefono-error" className="text-sm text-error" role="alert">
            {errors.telefono.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="comentario"
          className="text-sm font-medium text-text-primary"
        >
          {t("demoCommentLabel")}
        </label>
        <Textarea
          id="comentario"
          rows={4}
          placeholder={t("demoCommentPlaceholderSimple")}
          className="min-h-24 bg-bg-base"
          {...register("comentario")}
        />
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? tCommon("sending") : t("demoSubmit")}
      </Button>

      <p className="text-center text-sm text-text-secondary">
        {t("demoHasAccount")}{" "}
        <Link
          href="/login"
          className="font-semibold text-primary transition-colors duration-300 hover:text-primary-hover"
        >
          {t("demoSignIn")}
        </Link>
      </p>
    </form>
  );
}
