"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import globalLogo from "@/assets/global-logo.webp";
import loginImage from "@/assets/login.webp";
import unicornioLogoClaro from "@/assets/unicornio-logo-dark.webp";
import unicornioLogoOscuro from "@/assets/unicornio-logo-light.webp";
import { GoogleIcon } from "@/components/icons/google-icon";
import { Button, Checkbox, Input, Label } from "@/components/ui";
import { apiLogin } from "@/lib/api";

type FormularioLogin = {
  email: string;
  password: string;
  recordar: boolean;
};

/** Aparte y en Suspense porque useSearchParams exige un boundary — el resto del login sigue prerenderizado normal. */
function AvisoErrorGoogle() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get("error");
    if (!error) return;
    toast.error(t("googleLoginFailed"), { description: error });
    router.replace("/login");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return null;
}

export default function LoginPage() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const esquemaLogin = useMemo(
    () =>
      z.object({
        email: z.string().min(1, t("emailRequired")).email(t("emailInvalid")),
        password: z
          .string()
          .min(1, t("passwordRequired"))
          .min(8, t("passwordWrong")),
        recordar: z.boolean(),
      }),
    [t],
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormularioLogin>({
    resolver: zodResolver(esquemaLogin),
    defaultValues: {
      email: "",
      password: "",
      recordar: false,
    },
  });

  /**
   * apiLogin valida contra el backend real. IMPORTANTE: todavía no hay
   * sesión real (cookie httpOnly / middleware) — /dashboard sigue sin
   * protección de acceso. Pendiente antes de depender de esto como control
   * de acceso real, ver nota en /api/auth/login/route.ts.
   */
  const onSubmit = async (datos: FormularioLogin) => {
    try {
      await apiLogin(datos);
      router.push("/dashboard");
    } catch (error) {
      toast.error(t("loginFailed"), {
        description: error instanceof Error ? error.message : t("loginVerify"),
      });
    }
  };

  return (
    <div className="min-h-screen flex">
      <Suspense fallback={null}>
        <AvisoErrorGoogle />
      </Suspense>
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
          <div className="space-y-2 mb-6">
            <h1 className="text-4xl font-bold text-text-primary text-center">
              {t("loginTitle")}
            </h1>
            <p className="text-sm text-text-secondary text-center">
              {t("loginSubtitle")}
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-sm font-medium text-text-primary"
              >
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

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-sm font-medium text-text-primary"
              >
                {tCommon("password")}
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="pr-10"
                  aria-invalid={!!errors.password}
                  aria-describedby={
                    errors.password ? "password-error" : undefined
                  }
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                  aria-label={
                    showPassword ? t("hidePassword") : t("showPassword")
                  }
                >
                  {showPassword ? (
                    <EyeOffIcon aria-hidden="true" className="size-5" />
                  ) : (
                    <EyeIcon aria-hidden="true" className="size-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p
                  id="password-error"
                  className="text-sm text-error"
                  role="alert"
                >
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Controller
                  name="recordar"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="remember"
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                  )}
                />
                <Label
                  htmlFor="remember"
                  className="font-normal text-text-secondary cursor-pointer"
                >
                  {t("remember")}
                </Label>
              </div>
              <Link
                href="/recuperar-password"
                className="text-primary hover:text-primary-hover font-semibold transition-colors duration-300"
              >
                {t("forgot")}
              </Link>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? t("submitting") : t("submit")}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border-default" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-bg-base px-3 text-text-muted">
                  {tCommon("or")}
                </span>
              </div>
            </div>

            <Button type="button" variant="secondary" size="lg" className="w-full mt-5" asChild>
              <a href="/api/auth/google">
                <GoogleIcon />
                {t("google")}
              </a>
            </Button>
          </div>

          <p className="mt-8 text-center text-sm text-text-secondary">
            {t("noAccount")}{" "}
            <a
              href="/demo"
              className="text-primary hover:text-primary-hover font-semibold transition-colors duration-300"
            >
              {t("bookDemo")}
            </a>
          </p>
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
              {t("asideTitle")}
            </h2>
            <p className="mt-3 max-w-md leading-relaxed text-white/80 lg:text-sm xl:mt-4 xl:text-base 2xl:text-lg">
              {t("asideBody")}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
