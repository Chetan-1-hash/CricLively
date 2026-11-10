import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "../hooks/use-toast";
import { getScoreboard } from "../API/ScoringAPI";
import { buildScoreState } from "../lib/scoreAdapter";
import type { MatchScoreState } from "./data/MatchScoringTypes";
import Navbar from "./Navbar";

export default function ViewerPage() {
  const navigate = useNavigate();
  const { matchId } = useParams();
  // const location = useLocation();

  const [state, setState] = useState<MatchScoreState | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"scorecard" | "timeline">("scorecard");

  useEffect(() => {
    loadScore();
    // keep the score fresh while someone is watching
    const timer = setInterval(() => loadScore(true), 10000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  const loadScore = async (silent = false) => {
    if (!matchId) return;
    try {
      const data = await getScoreboard(matchId);
      setState(buildScoreState(data));
    } catch (error) {
      if (!silent) {
        toast({
          title: "Scoreboard Error!",
          variant: "destructive",
          description: (error as Error).message || "Could not load live score.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading || !state) {
    return (
      <section className="min-h-[100vh] flex items-center justify-center bg-background/80">
        <p className="text-foreground/70 text-lg">Loading scoreboard…</p>
      </section>
    );
  }

  // nothing to show before the toss / first ball
  if (state.innings.length === 0) {
    return (
      <>
        <Navbar />
        <section className="min-h-[100vh] flex flex-col items-center justify-center gap-4 bg-background/80 px-6 text-center">
          <h1 className="text-3xl font-extrabold text-foreground">
            {state.teamAName} <span className="text-foreground/50">vs</span> {state.teamBName}
          </h1>
          <p className="text-foreground/70">The match has not started yet. The scoreboard fills in once scoring begins.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2 rounded-full bg-card/80 text-foreground/80 text-sm font-semibold"
          >
            Back
          </button>
        </section>
      </>
    );
  }

  const innings = state.innings[state.currentInningsIndex];
  const firstInnings = state.innings[0];
  const secondInnings = state.innings[1];
  let resultText: string | null = null;
  if (state.status === "FINISHED" && secondInnings) {
    if (secondInnings.totalRuns > firstInnings.totalRuns) {
      resultText = `${secondInnings.battingTeam} won by ${Math.max(10 - secondInnings.totalWickets, 0)} wickets`;
    } else if (secondInnings.totalRuns < firstInnings.totalRuns) {
      resultText = `${firstInnings.battingTeam} won by ${firstInnings.totalRuns - secondInnings.totalRuns} runs`;
    } else {
      resultText = "Match tied";
    }
  }
  const overDisplay = `${innings.totalOvers}.${innings.ballsInCurrentOver}`;
  const striker = innings.batsmen[innings.strikerId];
  const nonStriker = innings.batsmen[innings.nonStrikerId];
  const bowler = innings.bowlers[innings.currentBowlerId];

  const recentBalls = innings.balls.slice(-12).reverse();

  const runRate = innings.totalOvers > 0 || innings.ballsInCurrentOver > 0
    ? (innings.totalRuns / (innings.totalOvers + innings.ballsInCurrentOver / 6)).toFixed(2)
    : "0.00";

  let requiredRunRate: string | null = null;
  if (innings.target) {
    const oversLeft = state.maxOvers - innings.totalOvers - innings.ballsInCurrentOver / 6;
    const runsNeeded = innings.target - innings.totalRuns;
    requiredRunRate = oversLeft > 0 ? (runsNeeded / oversLeft).toFixed(2) : "—";
  }

  return (
    <>
    <Navbar />
      <section className="min-h-[100vh] relative py-12 bg-background/80">
      <div className="container my-8 mx-auto px-6 relative max-w-4xl">
        {/* Header */}
        <motion.div
          className="flex justify-between items-center mb-6 gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div>
            <span className="inline-flex items-center gap-2 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-2">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              {state.status}
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground">
              {state.teamAName} <span className="text-foreground/50">vs</span> {state.teamBName}
            </h1>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-full bg-card/80 text-foreground/80 text-sm font-semibold hover:bg-card transition-colors"
          >
            Back
          </button>
        </motion.div>

        {/* Score hero card */}
        <motion.div
          className="bg-card/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-sm font-semibold text-foreground/60 mb-1">{innings.battingTeam} batting</p>
              <p className="text-5xl md:text-6xl font-extrabold text-foreground">
                {innings.totalRuns}
                <span className="text-foreground/50">/{innings.totalWickets}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground/60 mb-1">Overs</p>
              <p className="text-3xl font-bold text-foreground">
                {overDisplay} <span className="text-base text-foreground/50">/ {state.maxOvers}</span>
              </p>
            </div>
          </div>

          {resultText && (
            <div className="rounded-xl bg-green-600/20 px-4 py-3 mb-4">
              <p className="text-sm font-bold text-foreground">{resultText}</p>
            </div>
          )}

          {innings.target && (
            <div className="rounded-xl bg-accent/20 px-4 py-3 mb-4">
              <p className="text-sm font-semibold text-foreground">
                Target: {innings.target} · Need {Math.max(innings.target - innings.totalRuns, 0)} runs
                {state.maxOvers - innings.totalOvers > 0
                  ? ` from ${Math.max((state.maxOvers - innings.totalOvers) * 6 - innings.ballsInCurrentOver, 0)} balls`
                  : ""}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatTile label="Run Rate" value={runRate} />
            {requiredRunRate && <StatTile label="Req. Run Rate" value={requiredRunRate} />}
            <StatTile label="Striker" value={`${striker?.name ?? "—"}`} sub={striker ? `${striker.runs} (${striker.balls})` : ""} />
            <StatTile label="Bowler" value={`${bowler?.name ?? "—"}`} sub={bowler ? `${bowler.wickets}/${bowler.runsConceded}` : ""} />
          </div>
        </motion.div>

        {/* Batting pair */}
        <motion.div
          className="grid sm:grid-cols-2 gap-4 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <BatsmanCard name={striker?.name} runs={striker?.runs} balls={striker?.balls} fours={striker?.fours} sixes={striker?.sixes} onStrike />
          <BatsmanCard name={nonStriker?.name} runs={nonStriker?.runs} balls={nonStriker?.balls} fours={nonStriker?.fours} sixes={nonStriker?.sixes} />
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {(["scorecard", "timeline"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full text-sm font-semibold capitalize transition-colors ${
                activeTab === tab ? "bg-card text-foreground shadow-md" : "bg-card/50 text-foreground/60 hover:bg-card/70"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "scorecard" ? (
            <motion.div
              key="scorecard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-card/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl"
            >
              <h2 className="text-lg font-bold text-foreground mb-4">Batting — {innings.battingTeam}</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-foreground/50 text-left border-b border-foreground/10">
                      <th className="py-2 pr-4 font-semibold">Batter</th>
                      <th className="py-2 px-2 font-semibold text-right">R</th>
                      <th className="py-2 px-2 font-semibold text-right">B</th>
                      <th className="py-2 px-2 font-semibold text-right">4s</th>
                      <th className="py-2 px-2 font-semibold text-right">6s</th>
                      <th className="py-2 pl-2 font-semibold text-right">SR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {innings.battingOrder.map((pid) => {
                      const b = innings.batsmen[pid];
                      if (!b) return null;
                      const sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : "0.0";
                      return (
                        <tr key={pid} className="border-b border-foreground/5 last:border-0">
                          <td className="py-2.5 pr-4 font-medium text-foreground">
                            {b.name}
                            {b.isOnStrike && <span className="text-accent ml-1">*</span>}
                            {b.isOut && <p className="text-xs text-foreground/50">{b.dismissal}</p>}
                            {!b.isOut && !b.isOnStrike && pid !== innings.strikerId && pid !== innings.nonStrikerId && (
                              <p className="text-xs text-foreground/50">not out</p>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-right font-semibold text-foreground">{b.runs}</td>
                          <td className="py-2.5 px-2 text-right text-foreground/70">{b.balls}</td>
                          <td className="py-2.5 px-2 text-right text-foreground/70">{b.fours}</td>
                          <td className="py-2.5 px-2 text-right text-foreground/70">{b.sixes}</td>
                          <td className="py-2.5 pl-2 text-right text-foreground/70">{sr}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <h2 className="text-lg font-bold text-foreground mt-6 mb-4">Bowling — {innings.bowlingTeam}</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-foreground/50 text-left border-b border-foreground/10">
                      <th className="py-2 pr-4 font-semibold">Bowler</th>
                      <th className="py-2 px-2 font-semibold text-right">O</th>
                      <th className="py-2 px-2 font-semibold text-right">R</th>
                      <th className="py-2 px-2 font-semibold text-right">W</th>
                      <th className="py-2 pl-2 font-semibold text-right">Econ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(innings.bowlers).map((b) => {
                      const totalOversFloat = Math.floor(b.overs) + b.ballsThisOver / 6;
                      const econ = totalOversFloat > 0 ? (b.runsConceded / totalOversFloat).toFixed(2) : "0.00";
                      return (
                        <tr key={b.playerId} className="border-b border-foreground/5 last:border-0">
                          <td className="py-2.5 pr-4 font-medium text-foreground">{b.name}</td>
                          <td className="py-2.5 px-2 text-right text-foreground/70">
                            {Math.floor(b.overs)}.{b.ballsThisOver}
                          </td>
                          <td className="py-2.5 px-2 text-right text-foreground/70">{b.runsConceded}</td>
                          <td className="py-2.5 px-2 text-right font-semibold text-foreground">{b.wickets}</td>
                          <td className="py-2.5 pl-2 text-right text-foreground/70">{econ}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-card/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl"
            >
              <h2 className="text-lg font-bold text-foreground mb-4">Ball by ball</h2>
              {recentBalls.length === 0 ? (
                <p className="text-sm text-foreground/50">No deliveries yet.</p>
              ) : (
                <div className="space-y-2">
                  {recentBalls.map((b) => (
                    <motion.div
                      key={b.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 rounded-xl bg-background/60 px-4 py-2.5"
                    >
                      <span
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          b.isWicket
                            ? "bg-red-600 text-white"
                            : b.extraType !== "None"
                            ? "bg-accent text-accent-foreground"
                            : b.runs >= 4
                            ? "bg-green-700 text-white"
                            : "bg-card text-foreground/80"
                        }`}
                      >
                        {b.isWicket ? "W" : b.extraType !== "None" ? b.extraType[0] : b.runs}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          Over {b.overNumber}.{b.ballInOver}
                          {b.isWicket && <span className="text-red-600 font-semibold"> · WICKET ({b.wicketType})</span>}
                          {b.extraType !== "None" && <span className="text-accent font-semibold"> · {b.extraType}</span>}
                        </p>
                        <p className="text-xs text-foreground/50">
                          {b.runs > 0 ? `${b.runs} run${b.runs > 1 ? "s" : ""} off the bat` : "no run off the bat"}
                          {b.extraRuns > 0 ? ` · ${b.extraRuns} extra` : ""}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {firstInnings && state.currentInningsIndex === 1 && (
          <motion.div
            className="mt-6 bg-card/60 backdrop-blur-xl rounded-2xl p-4 text-sm text-foreground/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            1st Innings: {firstInnings.battingTeam} scored {firstInnings.totalRuns}/{firstInnings.totalWickets} in{" "}
            {firstInnings.totalOvers}.{firstInnings.ballsInCurrentOver} overs
          </motion.div>
        )}
      </div>
    </section>
    </>
  );
}

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-background/60 px-4 py-3">
      <p className="text-xs text-foreground/60 mb-1">{label}</p>
      <p className="font-bold text-foreground truncate">{value}</p>
      {sub && <p className="text-xs text-foreground/60">{sub}</p>}
    </div>
  );
}

function BatsmanCard({
  name,
  runs,
  balls,
  fours,
  sixes,
  onStrike,
}: {
  name?: string;
  runs?: number;
  balls?: number;
  fours?: number;
  sixes?: number;
  onStrike?: boolean;
}) {
  const sr = balls && balls > 0 ? (((runs ?? 0) / balls) * 100).toFixed(1) : "0.0";
  return (
    <div className="bg-card/80 backdrop-blur-xl rounded-2xl p-5 shadow-xl">
      <p className="font-bold text-foreground mb-1">
        {name ?? "—"} {onStrike && <span className="text-accent">*</span>}
      </p>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-extrabold text-foreground">{runs ?? 0}</span>
        <span className="text-sm text-foreground/60">({balls ?? 0})</span>
      </div>
      <p className="text-xs text-foreground/60 mt-1">
        {fours ?? 0} fours · {sixes ?? 0} sixes · SR {sr}
      </p>
    </div>
  );
}