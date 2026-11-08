"use client";

import React, { useRef, useState } from "react";
import {
  motion,
  useScroll,
  useMotionValueEvent,
  type HTMLMotionProps,
} from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface NavbarProps {
  children: React.ReactNode;
  className?: string;
  scrollThreshold?: number;
}

export interface NavBodyProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

export interface MobileNavProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

export interface MobileNavHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export interface NavbarLogoProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children?: React.ReactNode;
  className?: string;
  href?: string;
}

export const Navbar = ({
  children,
  className,
  scrollThreshold = 60,
}: NavbarProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState<boolean>(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > scrollThreshold) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  });

  return (
    <motion.div
      ref={ref}
      className={cn("fixed inset-x-0 top-[calc(var(--chth-banner-h,0px)+0.75rem)] z-50 w-full px-4 sm:px-6 pointer-events-none transition-[top] duration-200", className)}
    >
      <div className="w-full pointer-events-auto">
        {React.Children.map(children, (child) =>
          React.isValidElement(child)
            ? React.cloneElement(
                child as React.ReactElement<{ visible?: boolean }>,
                { visible },
              )
            : child,
        )}
      </div>
    </motion.div>
  );
};

export const NavBody = ({ children, className, visible, ...props }: NavBodyProps) => {
  return (
    <motion.div
      {...props}
      animate={{
        backdropFilter: visible ? "blur(14px)" : "blur(8px)",
        boxShadow: visible
          ? "0 10px 30px -10px rgba(0, 0, 0, 0.18), 0 0 0 1px hsl(var(--border) / 0.8), 0 1px 0 rgba(255, 255, 255, 0.08) inset"
          : "0 2px 8px -2px rgba(0, 0, 0, 0.08), 0 0 0 1px hsl(var(--border) / 0.6)",
        width: visible ? "64%" : "100%",
        y: visible ? 4 : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 30,
        mass: 0.8,
      }}
      style={{
        minWidth: "min(100%, 720px)",
      }}
      className={cn(
        "relative z-[60] mx-auto hidden w-full max-w-5xl flex-row items-center justify-between rounded-full bg-card/85 px-4 py-2 transition-colors duration-200 md:flex",
        visible && "bg-card/90",
        className,
      )}
    >
      {children}
    </motion.div>
  );
};

export const MobileNav = ({ children, className, visible, ...props }: MobileNavProps) => {
  return (
    <motion.div
      {...props}
      animate={{
        backdropFilter: visible ? "blur(14px)" : "blur(8px)",
        boxShadow: visible
          ? "0 10px 30px -10px rgba(0, 0, 0, 0.2), 0 0 0 1px hsl(var(--border) / 0.8)"
          : "0 2px 8px -2px rgba(0, 0, 0, 0.08), 0 0 0 1px hsl(var(--border) / 0.6)",
        width: visible ? "94%" : "100%",
        y: visible ? 2 : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 30,
        mass: 0.8,
      }}
      className={cn(
        "relative z-50 mx-auto flex w-full flex-row items-center justify-between rounded-full bg-card/90 px-4 py-2 transition-colors duration-200 md:hidden",
        className,
      )}
    >
      {children}
    </motion.div>
  );
};

export const MobileNavHeader = ({
  children,
  className,
}: MobileNavHeaderProps) => {
  return (
    <div
      className={cn(
        "relative flex w-full flex-row items-center justify-between",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const NavbarLogo = ({
  children,
  className,
  href = "/",
  ...props
}: NavbarLogoProps) => {
  return (
    <Link
      href={href}
      className={cn(
        "group relative z-20 flex h-8 items-center gap-2 rounded-full px-2.5 sm:px-3 text-sm font-semibold tracking-tight text-foreground transition-all duration-300 hover:scale-105 hover:bg-muted active:scale-95 focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring select-none",
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
};
