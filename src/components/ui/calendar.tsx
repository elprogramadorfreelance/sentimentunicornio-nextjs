"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useLocale } from "next-intl";
import type * as React from "react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";
import { enUS, es } from "react-day-picker/locale";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaults = getDefaultClassNames();
  const locale = useLocale();

  return (
    <DayPicker
      locale={locale === "en" ? enUS : es}
      weekStartsOn={1}
      showOutsideDays={showOutsideDays}
      className={cn("relative p-3 [--cell-size:2.25rem]", className)}
      classNames={{
        root: cn("w-fit", defaults.root),
        months: cn("relative flex flex-col", defaults.months),
        month: cn("flex flex-col gap-3", defaults.month),
        month_caption: cn(
          "flex h-9 items-center justify-center px-8",
          defaults.month_caption,
        ),
        caption_label: cn(
          "text-sm font-semibold text-text-primary capitalize",
          defaults.caption_label,
        ),
        nav: cn(
          "absolute inset-x-0 top-0 flex items-center justify-between",
          defaults.nav,
        ),
        button_previous: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "size-8 p-0 text-text-secondary",
          defaults.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "size-8 p-0 text-text-secondary",
          defaults.button_next,
        ),
        month_grid: cn("w-full border-collapse", defaults.month_grid),
        weekdays: cn("flex", defaults.weekdays),
        weekday: cn(
          "w-(--cell-size) text-center text-[0.7rem] font-medium text-text-muted uppercase",
          defaults.weekday,
        ),
        week: cn("mt-1 flex w-full", defaults.week),
        day: cn("p-0 text-center", defaults.day),
        day_button: cn(
          "size-(--cell-size) rounded-lg text-sm text-text-primary transition-colors hover:bg-bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          defaults.day_button,
        ),
        selected: cn(
          "bg-primary text-primary-fg hover:bg-primary hover:text-primary-fg",
          defaults.selected,
        ),
        today: cn("font-semibold text-primary", defaults.today),
        outside: cn("text-text-muted opacity-50", defaults.outside),
        disabled: cn(
          "text-text-muted opacity-40 hover:bg-transparent",
          defaults.disabled,
        ),
        range_start: cn(
          "rounded-l-lg bg-primary text-primary-fg",
          defaults.range_start,
        ),
        range_middle: cn(
          "rounded-none bg-primary/10 text-text-primary",
          defaults.range_middle,
        ),
        range_end: cn(
          "rounded-r-lg bg-primary text-primary-fg",
          defaults.range_end,
        ),
        hidden: cn("invisible", defaults.hidden),
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: claseChevron }) => {
          const Icon =
            orientation === "left" ? ChevronLeftIcon : ChevronRightIcon;
          return <Icon className={cn("size-4", claseChevron)} />;
        },
      }}
      {...props}
    />
  );
}
