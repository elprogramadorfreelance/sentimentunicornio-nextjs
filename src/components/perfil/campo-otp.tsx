"use client";

import { useTranslations } from "next-intl";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  Label,
} from "@/components/ui";

type CampoOtpProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
};

export function CampoOtp({ value, onChange, disabled, id }: CampoOtpProps) {
  const t = useTranslations("perfil");

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{t("otpLabel")}</Label>
      <InputOTP
        id={id}
        maxLength={6}
        value={value}
        onChange={onChange}
        disabled={disabled}
        containerClassName="justify-center sm:justify-start"
      >
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup>
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
      <p className="text-xs text-text-muted">
        {t.rich("otpHint", {
          code: (chunks) => (
            <span className="font-mono font-semibold text-text-primary">
              {chunks}
            </span>
          ),
        })}
      </p>
    </div>
  );
}
