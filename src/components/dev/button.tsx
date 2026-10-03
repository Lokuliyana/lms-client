// components/dev/button.tsx
"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm border border-transparent hover:opacity-90 hover:shadow-md",
        primary:
          "bg-primary text-primary-foreground shadow-sm border border-transparent hover:opacity-90 hover:shadow-md",
        destructive:
          "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 hover:border-rose-300",
        outline:
          "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm",
        secondary:
          "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-transparent",
        ghost: "hover:bg-slate-100 hover:text-slate-900 text-slate-600",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  suppressHydrationWarning?: boolean; // opt-in
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, suppressHydrationWarning, type, ...props }, ref) => {
    const Comp: any = asChild ? Slot : "button";
    // If we render a real <button>, make type deterministic on SSR
    const resolvedType = !asChild ? (type ?? "button") : undefined;

    return (
      <Comp
        // only add the prop if asked; keeps default clean
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

export { buttonVariants };
