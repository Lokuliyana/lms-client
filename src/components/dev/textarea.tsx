import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        // Base styles
        "w-full min-h-[96px] rounded-md border border-neutral-300 dark:border-neutral-700",
        "bg-white dark:bg-neutral-900 px-4 py-2 text-sm text-neutral-900 dark:text-neutral-100",
        "placeholder:text-neutral-400 dark:placeholder:text-neutral-500",

        // Focus ring and transitions
        "shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-0",
        "transition duration-200 ease-in-out",

        // Disabled state
        "disabled:cursor-not-allowed disabled:opacity-50",

        // Allow overrides
        className
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
