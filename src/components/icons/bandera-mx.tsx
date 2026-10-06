import type { ComponentProps } from "react";

export function BanderaMx(props: ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 24 16"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      focusable="false"
      {...props}
    >
      <title>México</title>
      <rect width="8" height="16" fill="#006847" />
      <rect x="8" width="8" height="16" fill="#fff" />
      <rect x="16" width="8" height="16" fill="#ce1126" />
      <circle cx="12" cy="8" r="1.6" fill="#c4a35a" />
    </svg>
  );
}
