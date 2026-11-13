import { AlertTriangle, ShieldAlert, ShieldCheck } from "lucide-react";

interface VerificationBadgeProps {
  verified?: boolean;
  matchesPlayed?: number;
  compact?: boolean;
}

/**
 * Shows whether a player's email is verified, or how their 1-match unverified limit stands.
 */
export default function VerificationBadge({
  verified,
  matchesPlayed = 0,
  compact = false,
}: VerificationBadgeProps) {
  if (verified) {
    return (
      <span
        title="Email verified — eligible for unlimited matches and tournaments"
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold whitespace-nowrap"
      >
        <ShieldCheck size={12} />
        Verified
      </span>
    );
  }

  if (matchesPlayed >= 1) {
    return (
      <span
        title="Already played 1 match without email verification. Must verify email to play any more matches or tournaments."
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 text-[11px] font-semibold whitespace-nowrap"
      >
        <ShieldAlert size={12} />
        {compact ? "Verify Required" : "Verify Email Required (1/1 used)"}
      </span>
    );
  }

  return (
    <span
      title="Email not verified yet — allowed 1 match before verification is required"
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[11px] font-semibold whitespace-nowrap"
    >
      <AlertTriangle size={12} />
      {compact ? "Unverified" : "Unverified (1 match left)"}
    </span>
  );
}

