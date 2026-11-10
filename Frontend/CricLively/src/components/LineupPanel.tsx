import { useState } from "react";
import { motion } from "framer-motion";
import { setLineup, type ScoreboardResponse } from "../API/ScoringAPI";
import { toast } from "../hooks/use-toast";

const MIN = 2;
const MAX = 11;

function TeamPicker({
  title,
  squad,
  names,
  picked,
  onChange,
}: {
  title: string;
  squad: string[];
  names: Record<string, string>;
  picked: string[];
  onChange: (ids: string[]) => void;
}) {
  const toggle = (id: string) =>
    onChange(picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id]);

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
            <button onClick={() => onChange(squad.slice(0, MAX))} className="text-accent font-semibold">Select all</button>
            <button onClick={() => onChange([])} className="text-foreground/60 font-semibold">Clear</button>
          </div>
          <div className="space-y-1.5">
            {squad.map((id) => (
              <label key={id} className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={picked.includes(id)} onChange={() => toggle(id)} />
                {names[id] ?? "Player"}
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** Step 2 of a match: who plays today (picked from each team's squad). */
export default function LineupPanel({ sb, onDone }: { sb: ScoreboardResponse; onDone: () => void }) {
  // start with the whole squad ticked (up to 11), the scorer un-ticks whoever is not playing
  const [a, setA] = useState<string[]>(() => (sb.playingA?.length ? sb.playingA : sb.squadA.slice(0, MAX)));
  const [b, setB] = useState<string[]>(() => (sb.playingB?.length ? sb.playingB : sb.squadB.slice(0, MAX)));
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

      <TeamPicker title={sb.teamAName} squad={sb.squadA} names={sb.playerNames} picked={a} onChange={setA} />
      <TeamPicker title={sb.teamBName} squad={sb.squadB} names={sb.playerNames} picked={b} onChange={setB} />

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
