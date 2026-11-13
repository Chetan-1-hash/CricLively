import { useState } from "react";
import { motion } from "framer-motion";
import { setLineup, type ScoreboardResponse } from "../API/ScoringAPI";
import { toast } from "../hooks/use-toast";
import VerificationBadge from "./VerificationBadge";

const MIN = 2;
const MAX = 11;

function TeamPicker({
  title,
  squad,
  names,
  verifiedMap,
  playedMap,
  picked,
  onChange,
}: {
  title: string;
  squad: string[];
  names: Record<string, string>;
  verifiedMap?: Record<string, boolean>;
  playedMap?: Record<string, number>;
  picked: string[];
  onChange: (ids: string[]) => void;
}) {
  const isVerified = (id: string) => verifiedMap?.[id] ?? false;
  const played = (id: string) => playedMap?.[id] ?? 0;
  const isBlocked = (id: string) => !isVerified(id) && played(id) >= 1;
  const eligibleIds = squad.filter((id) => !isBlocked(id));

  const toggle = (id: string) => {
    if (isBlocked(id)) return;
    onChange(picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id]);
  };

  return (
    <div className="rounded-2xl bg-background/60 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-foreground">{title}</h3>
        <span className={`text-xs font-semibold ${picked.length >= MIN && picked.length <= MAX ? "text-foreground/60" : "text-red-600"}`}>
          {picked.length} selected ({MIN}-{MAX})
        </span>
      </div>
      {squad.length === 0 ? (
        <p className="text-sm text-red-600">This team has no squad players. Add players to the team first.</p>
      ) : (
        <>
          <div className="flex gap-3 mb-2 text-xs">
            <button onClick={() => onChange(eligibleIds.slice(0, MAX))} className="text-accent font-semibold">Select all eligible</button>
            <button onClick={() => onChange([])} className="text-foreground/60 font-semibold">Clear</button>
          </div>
          <div className="space-y-1.5">
            {squad.map((id) => {
              const blocked = isBlocked(id);
              return (
                <label
                  key={id}
                  className={`flex items-center justify-between gap-2 text-sm py-1 px-2 rounded-lg ${
                    blocked ? "opacity-60 cursor-not-allowed bg-red-500/5" : "text-foreground cursor-pointer hover:bg-background/50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      disabled={blocked}
                      checked={!blocked && picked.includes(id)}
                      onChange={() => toggle(id)}
                    />
                    <span>{names[id] ?? "Player"}</span>
                  </span>
                  <VerificationBadge verified={isVerified(id)} matchesPlayed={played(id)} />
                </label>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/** Step 2 of a match: who plays today (picked from each team's squad). */
export default function LineupPanel({ sb, onDone }: { sb: ScoreboardResponse; onDone: () => void }) {
  const isEligible = (id: string) =>
    (sb.playerVerified?.[id] ?? false) || (sb.playerMatchesPlayed?.[id] ?? 0) < 1;

  // start with eligible squad players ticked (up to 11), the scorer un-ticks whoever is not playing
  const [a, setA] = useState<string[]>(() =>
    (sb.playingA?.length ? sb.playingA : sb.squadA).filter(isEligible).slice(0, MAX)
  );
  const [b, setB] = useState<string[]>(() =>
    (sb.playingB?.length ? sb.playingB : sb.squadB).filter(isEligible).slice(0, MAX)
  );
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (a.length < MIN || a.length > MAX || b.length < MIN || b.length > MAX) {
      toast({
        title: "Check the playing teams",
        description: `Pick between ${MIN} and ${MAX} players for each team.`,
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      await setLineup(sb.matchId, a, b);
      onDone();
    } catch (e) {
      toast({ title: "Could not save the playing teams", variant: "destructive", description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const winnerName = sb.toss ? (sb.toss.winnerId === sb.teamAId ? sb.teamAName : sb.teamBName) : "";

  return (
    <motion.div
      className="bg-card/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div>
        <h2 className="text-xl font-bold text-foreground">Playing teams</h2>
        {sb.toss && (
          <p className="text-sm text-foreground/60">
            {winnerName} won the toss and chose to {sb.toss.decision === "BATTING" ? "bat" : "bowl"} first.
          </p>
        )}
      </div>

      <TeamPicker
        title={sb.teamAName}
        squad={sb.squadA}
        names={sb.playerNames}
        verifiedMap={sb.playerVerified}
        playedMap={sb.playerMatchesPlayed}
        picked={a}
        onChange={setA}
      />
      <TeamPicker
        title={sb.teamBName}
        squad={sb.squadB}
        names={sb.playerNames}
        verifiedMap={sb.playerVerified}
        playedMap={sb.playerMatchesPlayed}
        picked={b}
        onChange={setB}
      />

      <button
        onClick={submit}
        disabled={saving}
        className="w-full py-3 bg-red-600 text-white rounded-full font-bold disabled:opacity-60"
      >
        {saving ? "Saving..." : "Confirm playing teams"}
      </button>
    </motion.div>
  );
}
