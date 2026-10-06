import Image, { type ImageProps } from "next/image";
import logoOscuro from "@/assets/unicornio-logo-dark.webp";
import logoClaro from "@/assets/unicornio-logo-light.webp";
import { cn } from "@/lib/utils";

type LogoUnicornioProps = Omit<ImageProps, "src" | "alt"> & {
  alt?: string;
};

export function LogoUnicornio({
  className,
  alt = "Unicornio",
  ...props
}: LogoUnicornioProps) {
  return (
    <>
      <Image
        src={logoOscuro}
        alt={alt}
        className={cn(className, "dark:hidden")}
        {...props}
      />
      <Image
        src={logoClaro}
        alt=""
        aria-hidden
        className={cn(className, "hidden dark:block")}
        {...props}
      />
    </>
  );
}
