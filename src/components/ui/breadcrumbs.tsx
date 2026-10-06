import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type Crumb = {
  etiqueta: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: Crumb[];
  className?: string;
};

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn("min-w-0", className)}>
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        {items.map((item, index) => {
          const esÚltimo = index === items.length - 1;
          return (
            <li
              key={`${item.etiqueta}-${index}`}
              className="flex min-w-0 items-center gap-1"
            >
              {index > 0 && (
                <ChevronRightIcon
                  className="size-3.5 shrink-0 text-text-muted"
                  aria-hidden
                />
              )}
              {item.href && !esÚltimo ? (
                <Link
                  href={item.href}
                  className="truncate text-text-muted transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
                >
                  {item.etiqueta}
                </Link>
              ) : (
                <span
                  className="truncate font-medium text-text-primary"
                  aria-current={esÚltimo ? "page" : undefined}
                >
                  {item.etiqueta}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
