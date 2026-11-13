import * as React from "react";

import { cn } from "../../lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-white/20 px-3 py-2 text-base text-white placeholder:text-white/40 focus-visible:outline-none focus-visible:border-white/45 focus-visible:ring-2 focus-visible:ring-white/10 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-200",
          "[background:rgba(255,255,255,0.1)] backdrop-blur-sm",
          "focus-visible:[background:rgba(255,255,255,0.18)]",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
