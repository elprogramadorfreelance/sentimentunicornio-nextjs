"use client";

import { Menu, X } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "motion/react";
import {
  Children,
  type ComponentPropsWithoutRef,
  cloneElement,
  type ElementType,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useState,
} from "react";
import { cn } from "@/lib/utils";

const SOMBRA_GLASS =
  "0 0 24px rgba(34, 42, 53, 0.06), 0 1px 1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(34, 42, 53, 0.04), 0 0 4px rgba(34, 42, 53, 0.08), 0 16px 68px rgba(47, 48, 55, 0.05), 0 1px 0 rgba(255, 255, 255, 0.1) inset";

const CLASE_GLASS =
  "border border-white/15 bg-bg-base/50 backdrop-blur-xl dark:border-white/10 dark:bg-bg-base/40";

type NavbarProps = {
  children: ReactNode;
  className?: string;
};

type NavBodyProps = {
  children: ReactNode;
  className?: string;
  visible?: boolean;
};

type NavItemsProps = {
  items: {
    name: string;
    link: string;
  }[];
  className?: string;
  onItemClick?: () => void;
};

type MobileNavProps = {
  children: ReactNode;
  className?: string;
  visible?: boolean;
};

type MobileNavHeaderProps = {
  children: ReactNode;
  className?: string;
};

type MobileNavMenuProps = {
  children: ReactNode;
  className?: string;
  isOpen: boolean;
  onClose: () => void;
};

export function Navbar({ children, className }: NavbarProps) {
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setVisible(latest > 100);
  });

  return (
    <motion.div className={cn("sticky inset-x-0 top-0 z-50 w-full", className)}>
      {Children.map(children, (child) =>
        isValidElement(child)
          ? cloneElement(child as ReactElement<{ visible?: boolean }>, {
              visible,
            })
          : child,
      )}
    </motion.div>
  );
}

export function NavBody({ children, className, visible }: NavBodyProps) {
  return (
    <motion.div
      animate={{
        backdropFilter: visible ? "blur(20px)" : "none",
        boxShadow: visible ? SOMBRA_GLASS : "none",
        width: visible ? "min(72rem, 92%)" : "100%",
        y: visible ? 20 : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 50,
      }}
      className={cn(
        "relative z-[60] mx-auto hidden w-full max-w-7xl flex-row items-center justify-between self-start rounded-full bg-transparent px-4 py-2 lg:flex",
        visible && CLASE_GLASS,
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

export function NavItems({ items, className, onItemClick }: NavItemsProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <motion.div
      onMouseLeave={() => setHovered(null)}
      className={cn(
        "pointer-events-none absolute inset-0 hidden flex-1 flex-row items-center justify-center space-x-2 text-sm font-medium lg:flex",
        className,
      )}
    >
      {items.map((item, idx) => (
        <a
          key={item.link}
          href={item.link}
          onMouseEnter={() => setHovered(idx)}
          onClick={onItemClick}
          className="relative pointer-events-auto px-4 py-2 text-text-primary transition-colors hover:text-indigo-500 dark:hover:text-sky"
        >
          {hovered === idx && (
            <motion.div
              layoutId="hovered"
              className="absolute inset-0 h-full w-full rounded-full bg-indigo-100 dark:bg-sky/15"
            />
          )}
          <span className="relative z-20">{item.name}</span>
        </a>
      ))}
    </motion.div>
  );
}

export function MobileNav({ children, className, visible }: MobileNavProps) {
  return (
    <motion.div
      animate={{
        backdropFilter: visible ? "blur(20px)" : "none",
        boxShadow: visible ? SOMBRA_GLASS : "none",
        width: visible ? "90%" : "100%",
        paddingRight: visible ? "12px" : "0px",
        paddingLeft: visible ? "12px" : "0px",
        borderRadius: visible ? "1rem" : "2rem",
        y: visible ? 20 : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 50,
      }}
      className={cn(
        "relative z-50 mx-auto flex w-full max-w-[calc(100vw-2rem)] flex-col items-center justify-between bg-transparent px-0 py-2 lg:hidden",
        visible && CLASE_GLASS,
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

export function MobileNavHeader({ children, className }: MobileNavHeaderProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-row items-center justify-between",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function MobileNavMenu({
  children,
  className,
  isOpen,
  onClose: _onClose,
}: MobileNavMenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            "absolute inset-x-0 top-16 z-50 flex w-full flex-col items-start justify-start gap-4 rounded-2xl border border-border-default bg-card px-4 py-8 shadow-lg",
            className,
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function MobileNavToggle({
  isOpen,
  onClick,
  openLabel,
  closeLabel,
}: {
  isOpen: boolean;
  onClick: () => void;
  openLabel: string;
  closeLabel: string;
}) {
  return (
    <button
      type="button"
      aria-expanded={isOpen}
      aria-label={isOpen ? closeLabel : openLabel}
      onClick={onClick}
      className="relative z-20 flex size-10 items-center justify-center text-text-primary"
    >
      {isOpen ? (
        <X className="size-5" aria-hidden />
      ) : (
        <Menu className="size-5" aria-hidden />
      )}
    </button>
  );
}

export function NavbarButton({
  href,
  as: Tag = "a",
  children,
  className,
  variant = "primary",
  ...props
}: {
  href?: string;
  as?: ElementType;
  children: ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "dark" | "gradient";
} & (ComponentPropsWithoutRef<"a"> | ComponentPropsWithoutRef<"button">)) {
  const baseStyles =
    "relative z-20 inline-block cursor-pointer rounded-full px-4 py-2 text-center text-sm font-semibold transition duration-200 hover:-translate-y-0.5";

  const variantStyles = {
    primary: "bg-indigo-500 text-white dark:bg-sky",
    secondary: "bg-transparent text-text-primary shadow-none",
    dark: "bg-text-primary text-bg-base",
    gradient:
      "bg-linear-to-b from-indigo-500 to-indigo-700 text-white dark:from-sky dark:to-navy",
  };

  return (
    <Tag
      href={href || undefined}
      className={cn(baseStyles, variantStyles[variant], className)}
      {...props}
    >
      {children}
    </Tag>
  );
}
