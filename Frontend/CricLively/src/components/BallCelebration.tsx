import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export type CelebrationKind = "FOUR" | "SIX" | "WICKET";
export interface Celebration {
  id: number; // new id = play again
  kind: CelebrationKind;
  who: string; // batter, or the batter who is out
  detail?: string; // e.g. "Bowled"
}

const LOOK: Record<CelebrationKind, { text: string; glow: string; tint: string; icon: string; colors: string[] }> = {
  FOUR: { text: "FOUR!", glow: "#38bdf8", tint: "rgba(14,165,233,0.30)", icon: "🏏", colors: ["#38bdf8", "#22d3ee", "#ffffff"] },
  SIX: { text: "SIX!", glow: "#facc15", tint: "rgba(234,179,8,0.35)", icon: "🚀", colors: ["#facc15", "#f97316", "#ffffff"] },
  WICKET: { text: "WICKET!", glow: "#ef4444", tint: "rgba(220,38,38,0.40)", icon: "💥", colors: ["#ef4444", "#fca5a5", "#ffffff"] },
};

const PARTICLES = Array.from({ length: 22 }, (_, i) => {
  const angle = (i / 22) * Math.PI * 2;
  const far = 180 + ((i * 53) % 140); // spread without Math.random
  return { x: Math.cos(angle) * far, y: Math.sin(angle) * far, size: 8 + ((i * 7) % 10), delay: (i % 5) * 0.03 };
});

/**
 * Full-screen burst when a boundary or a wicket happens. It does not block clicks,
 * and it goes away by itself after about 2.4 seconds.
 */
export default function BallCelebration({ event, onDone }: { event: Celebration | null; onDone: () => void }) {
  const calm = useReducedMotion();

  useEffect(() => {
    if (!event) return;
    const timer = setTimeout(onDone, 2400);
    return () => clearTimeout(timer);
  }, [event, onDone]);

  const look = event ? LOOK[event.kind] : null;

  return (
    <AnimatePresence>
      {event && look && (
        <motion.div
          key={event.id}
          className="fixed inset-0 z-[90] flex items-center justify-center pointer-events-none overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{ background: `radial-gradient(circle at center, ${look.tint}, transparent 70%)` }}
          aria-live="polite"
        >
          {!calm &&
            PARTICLES.map((p, i) => (
              <motion.span
                key={i}
                className="absolute rounded-full"
                style={{ width: p.size, height: p.size, background: look.colors[i % look.colors.length] }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 0.4 }}
                animate={{ x: p.x, y: p.y, opacity: 0, scale: 1.2 }}
                transition={{ duration: 1.3, delay: p.delay, ease: "easeOut" }}
              />
            ))}

          {!calm && event.kind !== "WICKET" && (
            <motion.span
              className="absolute text-5xl"
              initial={{ x: "-45vw", y: "25vh", rotate: 0, opacity: 1 }}
              animate={{ x: "45vw", y: event.kind === "SIX" ? "-35vh" : "28vh", rotate: 720, opacity: 0.9 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            >
              {look.icon}
            </motion.span>
          )}

          <motion.div
            className="text-center"
            initial={{ scale: 0.2, rotate: -8, opacity: 0 }}
            animate={
              calm
                ? { scale: 1, opacity: 1 }
                : event.kind === "WICKET"
                ? { scale: [0.2, 1.25, 1], rotate: [-8, 4, -3, 2, 0], opacity: 1, x: [0, -14, 14, -8, 8, 0] }
                : { scale: [0.2, 1.3, 1], rotate: [-8, 3, 0], opacity: 1 }
            }
            exit={{ scale: 1.4, opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            {event.kind === "WICKET" && !calm && (
              <motion.div className="text-6xl mb-1" animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: 2, duration: 0.5 }}>
                {look.icon}
              </motion.div>
            )}
            <p
              className="font-extrabold text-white leading-none"
              style={{
                fontSize: "clamp(3.5rem, 14vw, 9rem)",
                textShadow: `0 0 24px ${look.glow}, 0 0 60px ${look.glow}, 0 6px 0 rgba(0,0,0,0.25)`,
              }}
            >
              {look.text}
            </p>
            <p className="mt-3 text-xl md:text-3xl font-bold text-white" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}>
              {event.who}
              {event.detail ? ` · ${event.detail}` : ""}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
