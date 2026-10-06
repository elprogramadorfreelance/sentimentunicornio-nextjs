"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      theme="light"
      position="top-right"
      richColors
      closeButton
      expand
      duration={5000}
      gap={12}
      visibleToasts={4}
      toastOptions={{
        className: "font-sans",
        classNames: {
          toast: "rounded-lg border shadow-lg",
          title: "font-semibold text-sm",
          description: "text-sm opacity-90",
          closeButton:
            "border-border-default bg-bg-base text-text-muted hover:text-text-primary",
          actionButton:
            "bg-primary text-primary-fg font-semibold hover:bg-primary-hover",
          cancelButton: "bg-bg-muted text-text-secondary",
        },
      }}
    />
  );
}
