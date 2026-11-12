import { Loader2 } from "lucide-react";

/** A small spinning circle, with an optional text next to it. */
export function Spinner({ label, size = 20, className = "" }: { label?: string; size?: number; className?: string }) {
  return (
    <span role="status" aria-live="polite" className={`inline-flex items-center gap-2 text-foreground/80 ${className}`}>
      <Loader2 size={size} className="animate-spin" />
      {label && <span className="text-sm font-medium">{label}</span>}
    </span>
  );
}

/** Centered spinner for a section that is still loading. */
export function SectionSpinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="w-full flex justify-center py-10">
      <Spinner label={label} size={26} />
    </div>
  );
}

/** Spinner for a whole page (before anything can be shown). */
export function PageSpinner({ label = "Loading…" }: { label?: string }) {
  return (
    <section className="min-h-[100vh] flex items-center justify-center bg-background/80">
      <Spinner label={label} size={34} className="text-lg" />
    </section>
  );
}
