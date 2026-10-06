"use client";

import type { SimpleIcon } from "simple-icons";
import { cn } from "@/lib/utils";

type BrandIconProps = {
  icon: SimpleIcon;
  className?: string;
  title?: string;
};

/** Renderiza un ícono de simple-icons como SVG inline. */
export function BrandIcon({ icon, className, title }: BrandIconProps) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-5 shrink-0", className)}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      <path d={icon.path} fill="currentColor" />
    </svg>
  );
}
