import { useEffect, useState } from "react";
import { subscribeLoading } from "../lib/loadingTracker";
import { Spinner } from "./Spinner";

// A small spinner in the corner while any request is running.
// It waits 400 ms first, so quick live refreshes do not make it flicker.
export default function GlobalSpinner() {
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const off = subscribeLoading((n) => {
      if (n > 0) {
        if (!timer) timer = setTimeout(() => setBusy(true), 400);
      } else {
        if (timer) clearTimeout(timer);
        timer = undefined;
        setBusy(false);
      }
    });
    return () => {
      off();
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!busy) return null;
  return (
    <div className="fixed top-24 right-4 z-[80] pointer-events-none rounded-full bg-card/90 shadow-xl px-4 py-2 backdrop-blur-xl">
      <Spinner label="Loading…" />
    </div>
  );
}
