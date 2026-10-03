// src/components/ui/button.tsx
"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm border border-transparent hover:opacity-95 hover:shadow-md [box-shadow:0_4px_14px_rgba(79,70,229,0.22),inset_0_1px_1px_rgba(255,255,255,0.35)]",
        primary:
          "bg-primary text-primary-foreground shadow-sm border border-transparent hover:opacity-95 hover:shadow-md [box-shadow:0_4px_14px_rgba(79,70,229,0.22),inset_0_1px_1px_rgba(255,255,255,0.35)]",
        destructive:
          "bg-rose-50 text-rose-700 border border-rose-200/80 hover:bg-rose-100 hover:border-rose-300 shadow-2xs",
        outline:
          "border border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs [box-shadow:0_2px_8px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(255,255,255,0.9)]",
        secondary:
          "bg-slate-100/90 text-slate-700 hover:bg-slate-200/80 border border-slate-200/60 shadow-2xs",
        ghost:
          "hover:bg-black/5 hover:text-slate-900 text-slate-600",
        link:
          "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 text-xs",
        lg: "h-11 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  suppressHydrationWarning?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, suppressHydrationWarning, type, ...props }, ref) => {
    const Comp: any = asChild ? Slot : "button";
    const resolvedType = !asChild ? (type ?? "button") : undefined;

    return (
      <Comp
        {...(suppressHydrationWarning ? { suppressHydrationWarning: true } : {})}
        ref={ref}
        type={resolvedType}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
