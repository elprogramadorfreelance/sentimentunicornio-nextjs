"use client";

import { EyeIcon, EyeOffIcon } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import globalLogo from "@/assets/global-logo.webp";
import loginImage from "@/assets/login.webp";
import unicornioLogoClaro from "@/assets/unicornio-logo-dark.webp";
import unicornioLogoOscuro from "@/assets/unicornio-logo-light.webp";
import { Button, Input } from "@/components/ui";
import { apiRecuperarPassword, apiRestablecerPassword } from "@/lib/api";

type FormularioRecuperarPassword = {
  email: string;
};

type FormularioNuevaPassword = {
  password: string;
  confirmarPassword: string;
};

function FormularioSolicitarEnlace() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");

  const esquemaRecuperarPassword = useMemo(
    () =>
      z.object({
        email: z.string().min(1, t("emailRequired")).email(t("recoverEmailInvalid")),
      }),
    [t],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormularioRecuperarPassword>({
    resolver: zodResolver(esquemaRecuperarPassword),
    defaultValues: { email: "" },
  });

  const onSubmit = async (datos: FormularioRecuperarPassword) => {
    try {
      const respuesta = await apiRecuperarPassword(datos);
      toast.success(t("recoverToastSuccess"), { description: respuesta.mensaje });
      reset();
    } catch (error) {
      toast.error(t("recoverToastError"), {
        description: error instanceof Error ? error.message : tCommon("tryAgainLater"),
      });
    }
  };

  return (
    <>
      <div className="space-y-2 mb-8">
        <h1 className="text-4xl font-bold text-text-primary text-center">
          {t("recoverTitle")}
        </h1>
        <p className="text-sm text-text-secondary text-center">
          {t("recoverSubtitle")}
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-text-primary">
            {tCommon("email")}
          </label>
          <Input
            id="email"
            type="email"
            placeholder={t("emailPlaceholder")}
            autoComplete="email"
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

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? tCommon("sending") : t("recoverSubmit")}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-text-secondary">
        {t("recoverRemembered")}{" "}
        <Link
          href="/login"
          className="text-primary hover:text-primary-hover font-semibold transition-colors duration-300"
        >
          {t("recoverBack")}
        </Link>
      </p>
    </>
  );
}

function FormularioEstablecerNuevaPassword({ token }: { token: string }) {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const esquemaNuevaPassword = useMemo(
    () =>
      z
        .object({
          password: z.string().min(8, t("resetPasswordMin")),
          confirmarPassword: z.string().min(1, t("resetConfirmLabel")),
        })
        .refine((datos) => datos.password === datos.confirmarPassword, {
          message: t("resetPasswordMismatch"),
          path: ["confirmarPassword"],
        }),
    [t],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormularioNuevaPassword>({
    resolver: zodResolver(esquemaNuevaPassword),
    defaultValues: { password: "", confirmarPassword: "" },
  });

  const onSubmit = async (datos: FormularioNuevaPassword) => {
    try {
      const respuesta = await apiRestablecerPassword({
        token,
        new_password: datos.password,
      });
      toast.success(t("resetToastSuccess"), { description: respuesta.mensaje });
      router.push("/login");
    } catch (error) {
      toast.error(t("resetToastError"), {
        description: error instanceof Error ? error.message : t("resetLinkExpired"),
      });
    }
  };

  return (
    <>
      <div className="space-y-2 mb-8">
        <h1 className="text-4xl font-bold text-text-primary text-center">
          {t("resetTitle")}
        </h1>
        <p className="text-sm text-text-secondary text-center">
          {t("resetSubtitle")}
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium text-text-primary">
            {t("resetNewPasswordLabel")}
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="new-password"
              className="pr-10"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
              aria-label={showPassword ? t("hidePassword") : t("showPassword")}
            >
              {showPassword ? (
                <EyeOffIcon aria-hidden="true" className="size-5" />
              ) : (
                <EyeIcon aria-hidden="true" className="size-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" className="text-sm text-error" role="alert">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="confirmarPassword"
            className="text-sm font-medium text-text-primary"
          >
            {t("resetConfirmLabel")}
          </label>
          <Input
            id="confirmarPassword"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmarPassword}
            aria-describedby={
              errors.confirmarPassword ? "confirmarPassword-error" : undefined
            }
            {...register("confirmarPassword")}
          />
          {errors.confirmarPassword && (
            <p id="confirmarPassword-error" className="text-sm text-error" role="alert">
              {errors.confirmarPassword.message}
            </p>
          )}
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? tCommon("saving") : t("resetSubmit")}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-text-secondary">
        <Link
          href="/login"
          className="text-primary hover:text-primary-hover font-semibold transition-colors duration-300"
        >
          {t("recoverBack")}
        </Link>
      </p>
    </>
  );
}

/** Aparte y en Suspense porque useSearchParams exige un boundary. */
function ContenidoRecuperarPassword() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  return token ? (
    <FormularioEstablecerNuevaPassword token={token} />
  ) : (
    <FormularioSolicitarEnlace />
  );
}

export default function RecuperarPasswordPage() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");

  return (
    <div className="min-h-screen flex">
      <section className="w-full lg:w-1/2 flex flex-col justify-between px-6 py-8 sm:px-12 lg:px-20 xl:px-28 bg-bg-subtle">
        <div className="pt-4">
          <Image
            src={unicornioLogoClaro}
            alt="Unicornio"
            className="absolute left-12 top-10 z-10 h-auto w-40 xl:left-20 dark:hidden"
          />
          <Image
            src={unicornioLogoOscuro}
            alt="Unicornio"
            className="absolute left-12 top-10 z-10 hidden h-auto w-40 xl:left-20 dark:block"
          />
        </div>

        <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center py-12">
          <Suspense fallback={null}>
            <ContenidoRecuperarPassword />
          </Suspense>
        </div>

        <div className="flex items-center justify-between text-xs text-text-muted">
          <span className="flex items-center gap-1.5">
            {tCommon("poweredBy")}
            <span className="inline-flex items-center font-semibold text-text-primary">
              <Image
                src={globalLogo}
                alt=""
                aria-hidden="true"
                className="mr-1 size-12 object-contain"
              />
            </span>
          </span>
          <Link
            href="/privacy"
            className="font-medium transition-colors hover:text-text-primary"
          >
            {tCommon("privacyNotice")}
          </Link>
        </div>
      </section>

      <section className="hidden bg-bg-subtle lg:flex lg:w-1/2 lg:px-3 lg:py-6 xl:px-4 xl:py-8">
        <div className="relative flex-1 overflow-hidden rounded-lg">
          <Image
            src={loginImage}
            alt={t("imageAlt")}
            fill
            priority
            sizes="100vw"
            className="object-contain"
          />
          <div className="absolute z-10 text-white lg:inset-x-10 lg:top-10 xl:inset-x-16 xl:top-12 2xl:inset-x-44 2xl:top-14">
            <h2 className="max-w-md font-bold leading-tight lg:text-3xl xl:text-4xl 2xl:text-5xl">
              {t("recoverAsideTitle")}
            </h2>
            <p className="mt-3 max-w-md leading-relaxed text-white/80 lg:text-sm xl:mt-4 xl:text-base 2xl:text-lg">
              {t("recoverAsideBodyExtended")}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
