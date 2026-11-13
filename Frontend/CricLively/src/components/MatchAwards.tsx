import { motion } from "framer-motion";
import type { MatchScoreState } from "./data/MatchScoringTypes";

// Same points as the tournament leaderboard (Backend LeaderboardService), so the two always agree.
const P = { RUN: 1, FOUR: 1, SIX: 2, FIFTY: 10, HUNDRED: 25, DUCK: -5, WICKET: 25, DOT: 1, THREE_W: 10, FIVE_W: 25, CATCH: 10, STUMP: 10, RUNOUT: 10, ASSIST: 5 };

interface Row {
  id: string;
  name: string;
  team: string;
  runs: number;
  balls: number;
  out: boolean;
  wickets: number;
  conceded: number;
  points: number;
}

/** Adds up every player of the match from the two innings. */
function buildRows(state: MatchScoreState): Row[] {
  const rows = new Map<string, Row>();
  const get = (id: string, name: string, team: string) => {
    let r = rows.get(id);
    if (!r) {
      r = { id, name, team, runs: 0, balls: 0, out: false, wickets: 0, conceded: 0, points: 0 };
      rows.set(id, r);
    }
    return r;
  };

  for (const inn of state.innings) {
    for (const b of Object.values(inn.batsmen)) {
      const r = get(b.playerId, b.name, inn.battingTeam);
      r.runs += b.runs;
      r.balls += b.balls;
      r.out = r.out || b.isOut;
      r.points += b.runs * P.RUN + b.fours * P.FOUR + b.sixes * P.SIX;
      if (b.runs >= 100) r.points += P.HUNDRED;
      else if (b.runs >= 50) r.points += P.FIFTY;
      if (b.isOut && b.runs === 0 && b.balls >= 1) r.points += P.DUCK;
    }
    for (const bw of Object.values(inn.bowlers)) {
      const r = get(bw.playerId, bw.name, inn.bowlingTeam);
      r.wickets += bw.wickets;
      r.conceded += bw.runsConceded;
      r.points += bw.wickets * P.WICKET;
      if (bw.wickets >= 5) r.points += P.FIVE_W;
      else if (bw.wickets >= 3) r.points += P.THREE_W;
    }
    for (const ball of inn.balls) {
      if (ball.isLegalDelivery && ball.runs === 0 && ball.extraRuns === 0) {
        const r = rows.get(ball.bowlerId);
        if (r) r.points += P.DOT;
      }
      if (!ball.isWicket) continue;
      const credit = (id: string | undefined, name: string | undefined, pts: number) => {
        if (!id) return;
        get(id, name ?? "Player", inn.bowlingTeam).points += pts;
      };
      if (ball.wicketType === "Caught") credit(ball.fielderId ?? ball.bowlerId, ball.fielderName, P.CATCH);
      else if (ball.wicketType === "Stumped") credit(ball.fielderId, ball.fielderName, P.STUMP);
      else if (ball.wicketType === "Run Out") {
        credit(ball.fielderId, ball.fielderName, P.RUNOUT);
        (ball.assistIds ?? []).forEach((id, i) => credit(id, ball.assistNames?.[i], P.ASSIST));
      }
    }
  }
  return [...rows.values()];
}

function Tile({ icon, label, name, team, detail, big }: { icon: string; label: string; name: string; team: string; detail: string; big?: boolean }) {
  return (
    <div className={`rounded-2xl px-4 py-3 ${big ? "bg-yellow-500/20 ring-1 ring-yellow-500/40" : "bg-background/60"}`}>
      <p className="text-xs font-semibold text-foreground/60 mb-1">
        {icon} {label}
      </p>
      <p className="text-base sm:text-lg font-extrabold text-foreground break-words">{name}</p>
      <p className="text-xs text-foreground/60">{team}</p>
      <p className="text-sm font-semibold text-foreground mt-1">{detail}</p>
    </div>
  );
}

/** Player of the Match, top run scorer and top wicket taker. Shown only when the match is finished. */
export default function MatchAwards({ state }: { state: MatchScoreState }) {
  if (state.status !== "FINISHED") return null;
  const rows = buildRows(state);
  if (rows.length === 0) return null;

  const pom = [...rows].sort((a, b) => b.points - a.points || b.runs - a.runs || b.wickets - a.wickets)[0];
  const scorer = [...rows].filter((r) => r.runs > 0).sort((a, b) => b.runs - a.runs || a.balls - b.balls)[0];
  const taker = [...rows].filter((r) => r.wickets > 0).sort((a, b) => b.wickets - a.wickets || a.conceded - b.conceded)[0];

  return (
    <motion.div
      className="bg-card/80 backdrop-blur-xl rounded-3xl p-5 sm:p-6 shadow-2xl mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <h2 className="text-lg font-bold text-foreground mb-3">Match highlights</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <Tile
          big
          icon="🏆"
          label="Player of the Match"
          name={pom.name}
          team={pom.team}
          detail={[
            pom.balls > 0 ? `${pom.runs} (${pom.balls})` : "",
            pom.wickets > 0 ? `${pom.wickets}/${pom.conceded}` : "",
            `${pom.points} pts`,
          ].filter(Boolean).join(" · ")}
        />
        {scorer && <Tile icon="🏏" label="Highest run scorer" name={scorer.name} team={scorer.team} detail={`${scorer.runs} (${scorer.balls})`} />}
        {taker && <Tile icon="🎯" label="Highest wicket taker" name={taker.name} team={taker.team} detail={`${taker.wickets}/${taker.conceded}`} />}
      </div>
    </motion.div>
  );
}
