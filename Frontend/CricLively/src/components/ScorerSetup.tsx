import { useState } from "react";
import { motion } from "framer-motion";
import { startInnings, startToss, type ScoreboardResponse } from "../API/ScoringAPI";
import { toast } from "../hooks/use-toast";

const selectCls =
  "w-full px-3.5 py-2.5 rounded-xl bg-background/70 border border-border text-sm text-foreground";
const cardCls = "bg-card/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl";

const fail = (title: string, e: unknown) =>
  toast({ title, variant: "destructive", description: (e as Error).message || "Something went wrong" });

/** Step 1 of a match: who won the toss and what did they choose. */
export function TossPanel({ sb, onDone }: { sb: ScoreboardResponse; onDone: () => void }) {
  const [winnerId, setWinnerId] = useState("");
  const [decision, setDecision] = useState<"BATTING" | "BOWLING" | "">("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!winnerId || !decision) {
      toast({ title: "Pick the toss winner and the decision", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await startToss(sb.matchId, { winnerId, decision });
      onDone();
    } catch (e) {
      fail("Could not save the toss", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div className={cardCls} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className="text-xl font-bold text-foreground mb-1">Toss</h2>
      <p className="text-sm text-foreground/60 mb-5">
        {sb.teamAName} vs {sb.teamBName} · {sb.oversPerInnings ?? 20} overs
      </p>

      <label className="block text-xs font-medium text-foreground mb-1.5">Who won the toss?</label>
      <select className={selectCls} value={winnerId} onChange={(e) => setWinnerId(e.target.value)}>
        <option value="">Select team</option>
        <option value={sb.teamAId}>{sb.teamAName}</option>
        <option value={sb.teamBId}>{sb.teamBName}</option>
      </select>

      <label className="block text-xs font-medium text-foreground mt-4 mb-1.5">They chose to</label>
      <select
        className={selectCls}
        value={decision}
        onChange={(e) => setDecision(e.target.value as "BATTING" | "BOWLING")}
      >
        <option value="">Select</option>
        <option value="BATTING">Bat first</option>
        <option value="BOWLING">Bowl first</option>
      </select>

      <button
        onClick={submit}
        disabled={saving}
        className="w-full mt-6 py-3 bg-red-600 text-white rounded-full font-bold disabled:opacity-60"
      >
        {saving ? "Saving..." : "Start match"}
      </button>
    </motion.div>
  );
}

/** Start of an innings: pick the two openers and the opening bowler. */
export function InningsSetupPanel({
  sb,
  inningsNo,
  onDone,
}: {
  sb: ScoreboardResponse;
  inningsNo: 1 | 2;
  onDone: () => void;
}) {
  const [striker, setStriker] = useState("");
  const [nonStriker, setNonStriker] = useState("");
  const [bowler, setBowler] = useState("");
  const [saving, setSaving] = useState(false);

  // Who bats?  Innings 1: from the toss.  Innings 2: the other team.
  const other = (id: string) => (id === sb.teamAId ? sb.teamBId : sb.teamAId);
  const battingTeamId =
    inningsNo === 1
      ? sb.toss
        ? sb.toss.decision === "BATTING"
          ? sb.toss.winnerId
          : other(sb.toss.winnerId)
        : sb.teamAId
      : other(sb.innings1?.battingTeamId ?? sb.teamAId);
  const bowlingTeamId = other(battingTeamId);

  const nameOf = (id: string) => (id === sb.teamAId ? sb.teamAName : sb.teamBName);
  // only players picked for today's match
  const squad = (teamId: string) => (teamId === sb.teamAId ? sb.playingA : sb.playingB) ?? [];
  const label = (playerId: string) => sb.playerNames[playerId] ?? "Player";

  const batters = squad(battingTeamId);
  const bowlers = squad(bowlingTeamId);

  const submit = async () => {
    if (!striker || !nonStriker || !bowler) {
      toast({ title: "Pick two openers and a bowler", variant: "destructive" });
      return;
    }
    if (striker === nonStriker) {
      toast({ title: "The two openers must be different", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await startInnings(sb.matchId, inningsNo, {
        battingTeamId,
        bowlingTeamId,
        currentStrikerId: striker,
        currentNonStrikerId: nonStriker,
        currentBowlerId: bowler,
      });
      onDone();
    } catch (e) {
      fail("Could not start the innings", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div className={cardCls} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className="text-xl font-bold text-foreground mb-1">
        {inningsNo === 1 ? "First" : "Second"} innings
      </h2>
      <p className="text-sm text-foreground/60 mb-5">
        {nameOf(battingTeamId)} batting · {nameOf(bowlingTeamId)} bowling
        {inningsNo === 2 && sb.innings1 ? ` · Target ${sb.innings1.totalRuns + 1}` : ""}
      </p>

      {batters.length < 2 || bowlers.length < 1 ? (
        <p className="text-sm text-red-600">
          Each playing team needs at least 2 players. Go back and pick the playing teams again.
        </p>
      ) : (
        <>
          <label className="block text-xs font-medium text-foreground mb-1.5">Opener on strike</label>
          <select className={selectCls} value={striker} onChange={(e) => setStriker(e.target.value)}>
            <option value="">Select batter</option>
            {batters.map((id) => (
              <option key={id} value={id}>{label(id)}</option>
            ))}
          </select>

          <label className="block text-xs font-medium text-foreground mt-4 mb-1.5">Opener at the other end</label>
          <select className={selectCls} value={nonStriker} onChange={(e) => setNonStriker(e.target.value)}>
            <option value="">Select batter</option>
            {batters.map((id) => (
              <option key={id} value={id} disabled={id === striker}>{label(id)}</option>
            ))}
          </select>

          <label className="block text-xs font-medium text-foreground mt-4 mb-1.5">Opening bowler</label>
          <select className={selectCls} value={bowler} onChange={(e) => setBowler(e.target.value)}>
            <option value="">Select bowler</option>
            {bowlers.map((id) => (
              <option key={id} value={id}>{label(id)}</option>
            ))}
          </select>

          <button
            onClick={submit}
            disabled={saving}
            className="w-full mt-6 py-3 bg-red-600 text-white rounded-full font-bold disabled:opacity-60"
          >
            {saving ? "Saving..." : "Start innings"}
          </button>
        </>
      )}
    </motion.div>
  );
}
