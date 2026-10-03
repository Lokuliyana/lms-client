import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          // Base styling
          "w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900",
          "px-4 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500",
          
          // Shadow and focus ring
          "shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-primary/50",
          
          // Smooth transitions
          "transition duration-200 ease-in-out",
          
          // Disabled styling
          "disabled:opacity-50 disabled:cursor-not-allowed",

          // Custom class overrides
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
export { Input };
