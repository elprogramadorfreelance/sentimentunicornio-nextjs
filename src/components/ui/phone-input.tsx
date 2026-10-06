"use client";

import { GlobeIcon } from "lucide-react";
import {
  type ComponentProps,
  type ComponentRef,
  forwardRef,
  useMemo,
} from "react";
import * as RPNInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type PhoneInputValue = RPNInput.Value;

type PhoneInputProps = Omit<
  ComponentProps<"input">,
  "onChange" | "value" | "ref"
> &
  Omit<RPNInput.Props<typeof RPNInput.default>, "onChange"> & {
    onChange?: (value: PhoneInputValue | "") => void;
  };

/**
 * Phone input al estilo ReUI (react-phone-number-input + selector de país).
 * México (+52) por defecto; el número nacional se limita a 10 dígitos.
 */
const PhoneInput = forwardRef<
  ComponentRef<typeof RPNInput.default>,
  PhoneInputProps
>(({ className, onChange, value, defaultCountry = "MX", ...props }, ref) => {
  return (
    <RPNInput.default
      ref={ref}
      className={cn("flex w-full", className)}
      flagComponent={FlagComponent}
      countrySelectComponent={CountrySelect}
      inputComponent={InputComponent}
      smartCaret={false}
      international={false}
      countryCallingCodeEditable={false}
      defaultCountry={defaultCountry}
      value={value || undefined}
      onChange={(siguiente) => {
        if (!siguiente) {
          onChange?.("");
          return;
        }
        // Límite de 10 dígitos del número nacional (sin lada)
        const nacional =
          RPNInput.parsePhoneNumber(siguiente)?.nationalNumber ?? "";
        if (nacional.length > 10) return;
        onChange?.(siguiente);
      }}
      {...props}
    />
  );
});
PhoneInput.displayName = "PhoneInput";

const InputComponent = forwardRef<HTMLInputElement, ComponentProps<"input">>(
  ({ className, onKeyDown, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        className={cn(
          "h-11 rounded-s-none rounded-e-lg border-l-0 focus-visible:z-[1]",
          className,
        )}
        onKeyDown={(e) => {
          const permitido =
            e.ctrlKey ||
            e.metaKey ||
            e.altKey ||
            e.key.length !== 1 ||
            /^\d$/.test(e.key);
          if (!permitido) e.preventDefault();
          onKeyDown?.(e);
        }}
        {...props}
      />
    );
  },
);
InputComponent.displayName = "PhoneInputInput";

type CountryEntry = { label: string; value: RPNInput.Country | undefined };

type CountrySelectProps = {
  disabled?: boolean;
  value: RPNInput.Country;
  options: CountryEntry[];
  onChange: (country: RPNInput.Country) => void;
};

function CountrySelect({
  disabled,
  value: selectedCountry,
  options,
  onChange,
}: CountrySelectProps) {
  const países = useMemo(
    () =>
      options.filter(
        (o): o is { label: string; value: RPNInput.Country } => !!o.value,
      ),
    [options],
  );

  return (
    <Select
      value={selectedCountry}
      onValueChange={(país) => onChange(país as RPNInput.Country)}
      disabled={disabled}
    >
      <SelectTrigger
        aria-label="País"
        className={cn(
          "h-11 w-14 shrink-0 justify-center gap-1 rounded-s-lg rounded-e-none border-r-0 px-2",
          "focus-visible:z-[1] [&>svg]:size-3.5 [&>svg]:shrink-0",
          "[&>span]:flex [&>span]:items-center [&>span]:justify-center",
        )}
      >
        <FlagComponent
          country={selectedCountry}
          countryName={selectedCountry}
        />
      </SelectTrigger>
      <SelectContent className="max-h-72 min-w-[16rem]">
        {países.map((país) => (
          <SelectItem key={país.value} value={país.value}>
            <span className="flex items-center gap-2">
              <FlagComponent country={país.value} countryName={país.label} />
              <span className="min-w-0 flex-1 truncate">{país.label}</span>
              <span className="text-text-muted tabular-nums">
                +{RPNInput.getCountryCallingCode(país.value)}
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function FlagComponent({ country, countryName }: RPNInput.FlagProps) {
  const Flag = flags[country];

  return (
    <span className="flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-[2px] bg-bg-muted [&_svg]:h-full [&_svg]:w-auto">
      {Flag ? (
        <Flag title={countryName} />
      ) : (
        <GlobeIcon className="size-3.5 text-text-muted" aria-hidden />
      )}
    </span>
  );
}

/** Dígitos del número nacional (sin lada), para validar el límite de 10. */
export function dígitosNacionalesTeléfono(valor: string | undefined): string {
  if (!valor) return "";
  return (
    RPNInput.parsePhoneNumber(valor)?.nationalNumber ?? valor.replace(/\D/g, "")
  );
}

export { PhoneInput };
