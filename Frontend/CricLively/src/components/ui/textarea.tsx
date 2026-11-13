import * as React from "react";

import { cn } from "../../lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-xl border border-white/20 px-3 py-2 text-sm text-white placeholder:text-white/40 focus-visible:outline-none focus-visible:border-white/45 focus-visible:ring-2 focus-visible:ring-white/10 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 resize-none",
        "[background:rgba(255,255,255,0.1)] backdrop-blur-sm",
        "focus-visible:[background:rgba(255,255,255,0.18)]",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
