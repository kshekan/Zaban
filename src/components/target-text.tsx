"use client";

import { cn } from "@/lib/utils";

interface TargetTextProps {
  children: React.ReactNode;
  className?: string;
  direction?: "rtl" | "ltr";
  as?: "span" | "p" | "div";
}

export function TargetText({
  children,
  className,
  direction = "rtl",
  as: Tag = "span",
}: TargetTextProps) {
  return (
    <Tag
      dir={direction}
      className={cn(
        "font-target text-[1.15em] leading-[2.1]",
        direction === "rtl" && "text-right",
        className
      )}
    >
      {children}
    </Tag>
  );
}
