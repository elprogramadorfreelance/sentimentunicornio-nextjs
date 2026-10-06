import type * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-28 w-full rounded-lg border border-border-default bg-white px-4 py-3 text-sm text-text-primary transition-colors",
        "placeholder:text-text-muted",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        "aria-invalid:border-error aria-invalid:focus-visible:ring-error",
        "disabled:pointer-events-none disabled:opacity-50",
        "resize-y",
        className,
      )}
      {...props}
    />
  );
}
