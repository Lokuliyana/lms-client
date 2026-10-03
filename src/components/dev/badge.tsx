// components/dev/badge.tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full font-semibold leading-none select-none transition-all",
  {
    variants: {
      variant: {
        // keep your original variants for compatibility
        default:
          "border-transparent bg-primary text-primary-foreground hover:brightness-105",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:brightness-105",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:brightness-105",
        outline: "border text-foreground",
      },
      /** NEW: vivid, high-contrast presets for difficulty labels */
      difficulty: {
        easy:
          "border-0 text-white bg-gradient-to-r from-emerald-500 to-green-600 ring-1 ring-emerald-300/60 shadow-sm",
        medium:
          "border-0 text-white bg-gradient-to-r from-amber-500 to-orange-600 ring-1 ring-amber-300/60 shadow-sm",
        hard:
          "border-0 text-white bg-gradient-to-r from-rose-600 to-red-600 ring-1 ring-rose-300/60 shadow-sm",
      },
      size: {
        xs: "px-2 py-0.5 text-[10px]",
        sm: "px-2.5 py-0.5 text-xs",
        md: "px-3 py-1 text-xs",
      },
      /** optional: make the chip a bit more “poppy” */
      elevated: {
        true: "shadow-md",
        false: "",
      },
    },
    compoundVariants: [
      // nicer hover for difficulty chips
      {
        difficulty: ["easy", "medium", "hard"],
        class: "hover:brightness-105",
      },
      // outline baseline styling
      {
        variant: "outline",
        class:
          "bg-white/70 backdrop-blur border-slate-200 text-slate-700 hover:bg-white",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "sm",
      elevated: false,
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, difficulty, size, elevated, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, difficulty, size, elevated }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
