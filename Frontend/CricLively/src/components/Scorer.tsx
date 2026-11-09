import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "../hooks/use-toast";
import {
  finishMatch,
  getScoreboard,
  postBall,
  undoLastBall,
  type ScoreboardResponse,
} from "../API/ScoringAPI";
import { buildScoreState, toApiBall } from "../lib/scoreAdapter";
import type { ExtraType, WicketType } from "./data/MatchScoringTypes";
import { scoringReducer } from "./data/scoringReducer";
import Navbar from "./Navbar";
import { InningsSetupPanel, TossPanel } from "./ScorerSetup";

const WICKET_TYPES: WicketType[] = ["Bowled", "Caught", "LBW", "Run Out", "Stumped", "Hit Wicket", "Retired Hurt"];
const EXTRA_TYPES: ExtraType[] = ["None", "Wide", "No Ball", "Bye", "Leg Bye"];
const RUN_OPTIONS = [0, 1, 2, 3, 4, 5, 6];

// Page frame used by the set-up screens (toss, innings, finish)
function Shell({ title, subtitle, onExit, children }: {
  title: string;
  subtitle?: string;
  onExit: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <section className="min-h-[100vh] py-12 bg-background/80">
        <div className="container my-8 mx-auto px-6 max-w-3xl">
          <div className="flex justify-between items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-foreground">{title}</h1>
              {subtitle && <p className="text-sm text-foreground/70 mt-1">{subtitle}</p>}
            </div>
            <button
              onClick={onExit}
              className="px-4 py-2 rounded-full bg-card/80 text-foreground/80 text-sm font-semibold hover:bg-card transition-colors"
            >
              Exit
            </button>
          </div>
          {children}
        </div>
      </section>
    </>
  );
}

export default function Scorer() {
  const navigate = useNavigate();
  const { matchId } = useParams();

  // The server is the source of truth. `sb` is what it told us last.
  const [sb, setSb] = useState<ScoreboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  // a bowler chosen on screen; it is saved together with the next ball
  const [bowlerOverride, setBowlerOverride] = useState<{ id: string; name: string } | null>(null);

  // Pending ball builder
  const [selectedRuns, setSelectedRuns] = useState(0);
  const [extraType, setExtraType] = useState<ExtraType>("None");
  const [extraRuns, setExtraRuns] = useState(0);
  const [isWicket, setIsWicket] = useState(false);
  const [wicketType, setWicketType] = useState<WicketType>("Bowled");
  const [showNewBatsmanPicker, setShowNewBatsmanPicker] = useState(false);
  const [pendingOutPlayerId, setPendingOutPlayerId] = useState<string | null>(null);
  const [showBowlerPicker, setShowBowlerPicker] = useState(false);

  const load = useCallback(async () => {
    if (!matchId) return;
    try {
      setSb(await getScoreboard(matchId));
    } catch (e) {
      toast({
        title: "Scorer Error!",
        variant: "destructive",
        description: (e as Error).message || "Could not load match data.",
      });
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    load();
  }, [load]);

  // Rebuild the score by replaying the saved balls
  const base = useMemo(() => (sb ? buildScoreState(sb) : null), [sb]);
  const state = useMemo(() => {
    if (!base || base.innings.length === 0 || !bowlerOverride) return base;
    return scoringReducer(base, {
      type: "SET_BOWLER",
      payload: { bowlerId: bowlerOverride.id, bowlerName: bowlerOverride.name },
    });
  }, [base, bowlerOverride]);

  const resetBallBuilder = () => {
    setSelectedRuns(0);
    setExtraType("None");
    setExtraRuns(0);
    setIsWicket(false);
    setWicketType("Bowled");
    setPendingOutPlayerId(null);
  };

  const exit = () => navigate(-1);

  if (loading || !sb) {
    return (
      <section className="min-h-[100vh] flex items-center justify-center bg-background/80">
        <p className="text-foreground/70 text-lg">Loading scorer…</p>
      </section>
    );
  }

  // ---------- set-up screens ----------
  if (sb.matchStatus === "UPCOMING") {
    return (
      <Shell title="Scorer" subtitle={`${sb.teamAName} vs ${sb.teamBName}`} onExit={exit}>
        <TossPanel sb={sb} onDone={load} />
      </Shell>
    );
  }

  if (sb.matchStatus === "FINISHED" || sb.matchStatus === "ABANDONED") {
    return (
      <Shell title="Scorer" subtitle={`${sb.teamAName} vs ${sb.teamBName}`} onExit={exit}>
        <div className="bg-card/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl text-center">
          <p className="text-foreground mb-4">This match is {sb.matchStatus.toLowerCase()}. Scoring is closed.</p>
          <button
            onClick={() => navigate(`/viewer/${sb.matchId}`)}
            className="px-6 py-2.5 bg-red-600 text-white rounded-full font-semibold"
          >
            Open scoreboard
          </button>
        </div>
      </Shell>
    );
  }

  if (!state || state.innings.length === 0) {
    return (
      <Shell title="Scorer" subtitle={`${sb.teamAName} vs ${sb.teamBName}`} onExit={exit}>
        <InningsSetupPanel sb={sb} inningsNo={1} onDone={load} />
      </Shell>
    );
  }

  const innings = state.innings[state.currentInningsIndex];

  if (innings.isComplete) {
    if (state.currentInningsIndex === 0 && !sb.innings2) {
      return (
        <Shell title="Scorer" subtitle={`1st innings over: ${innings.totalRuns}/${innings.totalWickets}`} onExit={exit}>
          <InningsSetupPanel sb={sb} inningsNo={2} onDone={load} />
        </Shell>
      );
    }
    return (
      <Shell title="Scorer" subtitle="Innings complete" onExit={exit}>
        <div className="bg-card/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl text-center space-y-4">
          <p className="text-foreground">
            {innings.battingTeam}: {innings.totalRuns}/{innings.totalWickets} in {innings.totalOvers}.
            {innings.ballsInCurrentOver} overs
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={async () => {
                try {
                  await finishMatch(sb.matchId);
                  toast({ title: "Match finished" });
                  navigate(`/viewer/${sb.matchId}`);
                } catch (e) {
                  toast({ title: "Could not finish the match", variant: "destructive", description: (e as Error).message });
                }
              }}
              className="px-6 py-2.5 bg-red-600 text-white rounded-full font-semibold"
            >
              Finish match
            </button>
            <button
              onClick={async () => {
                if (!matchId) return;
                try {
                  await undoLastBall(matchId, state.currentInningsIndex + 1);
                  await load();
                } catch (e) {
                  toast({ title: "Could not undo", variant: "destructive", description: (e as Error).message });
                }
              }}
              className="px-6 py-2.5 bg-background/60 text-foreground rounded-full font-semibold"
            >
              Undo last ball
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  // ---------- scoring screen ----------
  const inningsApi = state.currentInningsIndex === 0 ? sb.innings1 : sb.innings2;
  const battingSquad = inningsApi?.battingTeamId === sb.teamAId ? sb.squadA : sb.squadB;
  const bowlingSquad = inningsApi?.bowlingTeamId === sb.teamAId ? sb.squadA : sb.squadB;
  const nameOf = (id: string) => sb.playerNames[id] ?? "Player";
  const availableBatsmen = battingSquad
    .filter((id) => !innings.battingOrder.includes(id))
    .map((id) => ({ id, name: nameOf(id) }));
  const availableBowlers = bowlingSquad.map((id) => ({ id, name: nameOf(id) }));

  // Save one ball on the server, then reload (the reload replays all balls)
  const submitBall = async (newBatsman?: { id: string; name: string }) => {
    if (busy || !matchId) return;
    const next = scoringReducer(state, {
      type: "RECORD_BALL",
      payload: {
        runs: selectedRuns,
        extraType,
        extraRuns: extraType === "None" ? 0 : extraRuns,
        isWicket,
        wicketType: isWicket ? wicketType : undefined,
        outPlayerId: isWicket ? pendingOutPlayerId ?? undefined : undefined,
        newBatsmanId: newBatsman?.id,
        newBatsmanName: newBatsman?.name,
      },
    });
    const balls = next.innings[next.currentInningsIndex].balls;
    const ball = balls[balls.length - 1];
    if (!ball) return;

    setBusy(true);
    try {
      await postBall(matchId, toApiBall((state.currentInningsIndex + 1) as 1 | 2, ball, newBatsman?.id));
      setBowlerOverride(null);
      setShowNewBatsmanPicker(false);
      resetBallBuilder();
      await load();
    } catch (e) {
      toast({ title: "Could not save the ball", variant: "destructive", description: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const handleConfirm = () => {
    if (isWicket && !pendingOutPlayerId) {
      toast({ title: "Select who's out", variant: "destructive", description: "Choose the dismissed batsman first." });
      return;
    }
    // a wicket needs the next batsman first, and the ball is saved ONCE when he is picked
    if (isWicket && innings.totalWickets < 9 && availableBatsmen.length > 0) {
      setShowNewBatsmanPicker(true);
      return;
    }
    submitBall();
  };

  const handleNewBatsmanSelected = (id: string, name: string) => {
    submitBall({ id, name });
  };

  const handleBowlerSelected = (id: string, name: string) => {
    setBowlerOverride({ id, name });
    setShowBowlerPicker(false);
  };

  const handleUndo = async () => {
    if (busy || !matchId) return;
    if (innings.balls.length === 0) {
      toast({ title: "Nothing to undo", description: "No balls bowled in this innings yet." });
      return;
    }
    setBusy(true);
    try {
      await undoLastBall(matchId, state.currentInningsIndex + 1);
      setBowlerOverride(null);
      await load();
      toast({ title: "Last ball removed", description: "The score was recalculated." });
    } catch (e) {
      toast({ title: "Could not undo", variant: "destructive", description: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const striker = innings.batsmen[innings.strikerId];
  const nonStriker = innings.batsmen[innings.nonStrikerId];
  const bowler = innings.bowlers[innings.currentBowlerId];
  const overDisplay = `${innings.totalOvers}.${innings.ballsInCurrentOver}`;

  // Check if over just completed and bowler needs to change
  const overJustCompleted = innings.ballsInCurrentOver === 0 && innings.balls.length > 0;

  return (
    <>
      <Navbar />
      <section className="min-h-[100vh] relative py-12 bg-background/80">
      <div className="container my-8 mx-auto px-6 relative max-w-3xl">
        {/* Header */}
        <motion.div
          className="flex justify-between items-center mb-8 gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground">Scorer</h1>
            <p className="text-sm text-foreground/70 mt-1">
              {innings.battingTeam} vs {innings.bowlingTeam} · Over {overDisplay} / {state.maxOvers}
            </p>
          </div>
          <button
            onClick={exit}
            className="px-4 py-2 rounded-full bg-card/80 text-foreground/80 text-sm font-semibold hover:bg-card transition-colors"
          >
            Exit
          </button>
        </motion.div>

        {/* Live score summary card */}
        <motion.div
          className="bg-card/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-baseline justify-between mb-4">
            <span className="text-4xl font-extrabold text-foreground">
              {innings.totalRuns}/{innings.totalWickets}
            </span>
            <span className="text-foreground/70 text-sm font-semibold">
              {overDisplay} overs{innings.target ? ` · Target ${innings.target}` : ""}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-background/60 px-4 py-3">
              <p className="text-xs text-foreground/60 mb-1">Striker</p>
              <p className="font-semibold text-foreground">
                {striker?.name} <span className="text-accent">*</span>
              </p>
              <p className="text-sm text-foreground/70">
                {striker?.runs} ({striker?.balls})
              </p>
            </div>
            <div className="rounded-xl bg-background/60 px-4 py-3">
              <p className="text-xs text-foreground/60 mb-1">Non-Striker</p>
              <p className="font-semibold text-foreground">{nonStriker?.name}</p>
              <p className="text-sm text-foreground/70">
                {nonStriker?.runs} ({nonStriker?.balls})
              </p>
            </div>
          </div>

          <div className="mt-3 rounded-xl bg-background/60 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-foreground/60 mb-1">Bowler</p>
              <p className="font-semibold text-foreground">{bowler?.name ?? "Not set"}</p>
              <p className="text-sm text-foreground/70">
                {bowler ? `${Math.floor(bowler.overs)}.${bowler.ballsThisOver}-${bowler.runsConceded}-${bowler.wickets}` : "—"}
              </p>
            </div>
            <button
              onClick={() => setShowBowlerPicker(true)}
              className="px-3 py-1.5 rounded-full bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors"
            >
              Change
            </button>
          </div>

          {overJustCompleted && (
            <p className="mt-3 text-xs font-semibold text-red-600">
              Over complete — confirm or change the bowler before continuing.
            </p>
          )}
        </motion.div>

        {/* Ball builder */}
        <motion.div
          className="bg-card/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-lg font-bold text-foreground mb-3">Runs off the bat</h2>
          <div className="grid grid-cols-7 gap-2 mb-5">
            {RUN_OPTIONS.map((r) => (
              <motion.button
                key={r}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setSelectedRuns(r)}
                className={`h-12 rounded-xl font-bold text-lg transition-colors ${
                  selectedRuns === r
                    ? "bg-red-600 text-white shadow-lg"
                    : "bg-background/60 text-foreground/80 hover:bg-background"
                }`}
              >
                {r}
              </motion.button>
            ))}
          </div>

          <h2 className="text-lg font-bold text-foreground mb-3">Extras</h2>
          <div className="grid grid-cols-5 gap-2 mb-5">
            {EXTRA_TYPES.map((ex) => (
              <motion.button
                key={ex}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setExtraType(ex);
                  if (ex === "None") setExtraRuns(0);
                  else setExtraRuns(1);
                }}
                className={`py-2 rounded-xl text-xs font-semibold transition-colors ${
                  extraType === ex
                    ? "bg-accent text-accent-foreground shadow-md"
                    : "bg-background/60 text-foreground/80 hover:bg-background"
                }`}
              >
                {ex}
              </motion.button>
            ))}
          </div>

          {extraType !== "None" && (
            <div className="mb-5">
              <p className="text-sm text-foreground/70 mb-2">Extra runs</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button
                    key={r}
                    onClick={() => setExtraRuns(r)}
                    className={`w-10 h-10 rounded-lg font-semibold transition-colors ${
                      extraRuns === r ? "bg-red-600 text-white" : "bg-background/60 text-foreground/80"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Wicket toggle */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-foreground">Wicket</h2>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setIsWicket(!isWicket);
                if (!isWicket) setPendingOutPlayerId(innings.strikerId);
              }}
              className={`w-14 h-7 rounded-full border border-white/100 transition-colors relative ${isWicket ? "bg-red-600" : "bg-background/60"}`}
            >
              <motion.span
                className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow"
                animate={{ x: isWicket ? 24 : 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              />
            </motion.button>
          </div>

          <AnimatePresence>
            {isWicket && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 overflow-hidden"
              >
                <p className="text-sm text-foreground/70 mb-2">Who's out?</p>
                <div className="flex gap-2 mb-4">
                  {[striker, nonStriker].filter(Boolean).map((b) => (
                    <button
                      key={b!.playerId}
                      onClick={() => setPendingOutPlayerId(b!.playerId)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                        pendingOutPlayerId === b!.playerId
                          ? "bg-red-600 text-white"
                          : "bg-background/60 text-foreground/80"
                      }`}
                    >
                      {b!.name}
                    </button>
                  ))}
                </div>

                <p className="text-sm text-foreground/70 mb-2">Dismissal type</p>
                <div className="grid grid-cols-2 gap-2">
                  {WICKET_TYPES.map((wt) => (
                    <button
                      key={wt}
                      onClick={() => setWicketType(wt)}
                      className={`py-2 rounded-xl text-xs font-semibold transition-colors ${
                        wicketType === wt ? "bg-accent text-accent-foreground" : "bg-background/60 text-foreground/80"
                      }`}
                    >
                      {wt}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-3 mt-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleConfirm}
              disabled={busy}
              className="flex-1 py-3.5 bg-red-600 text-white rounded-full font-bold text-base shadow-lg hover:bg-red-700 transition-colors disabled:opacity-60"
            >
              Confirm Ball
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleUndo}
              disabled={busy}
              className="px-6 py-3.5 bg-background/60 text-foreground/80 rounded-full font-semibold text-base hover:bg-background transition-colors"
            >
              Undo
            </motion.button>
          </div>
        </motion.div>

        {/* Ball-by-ball log */}
        <motion.div
          className="mt-6 bg-card/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="text-lg font-bold text-foreground mb-3">This over</h2>
          <div className="flex gap-2 flex-wrap">
            {innings.balls
              .filter((b) => b.overNumber === innings.totalOvers + 1 || (innings.ballsInCurrentOver === 0 && b.overNumber === innings.totalOvers))
              .slice(-6)
              .map((b) => (
                <span
                  key={b.id}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                    b.isWicket
                      ? "bg-red-600 text-white"
                      : b.extraType !== "None"
                      ? "bg-accent text-accent-foreground"
                      : b.runs >= 4
                      ? "bg-green-700 text-white"
                      : "bg-background/60 text-foreground/80"
                  }`}
                >
                  {b.isWicket ? "W" : b.extraType !== "None" ? `${b.extraType[0]}${b.extraRuns || ""}` : b.runs}
                </span>
              ))}
            {innings.balls.length === 0 && <p className="text-sm text-foreground/50">No balls bowled yet.</p>}
          </div>
        </motion.div>
      </div>

      {/* New batsman picker modal */}
      <AnimatePresence>
        {showNewBatsmanPicker && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-card rounded-3xl p-6 max-w-sm w-full shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-foreground">Next batsman in</h3>
                <button onClick={() => setShowNewBatsmanPicker(false)} className="text-foreground/50 hover:text-foreground">
                  ✕
                </button>
              </div>
              <div className="space-y-2">
                {availableBatsmen.length === 0 && (
                  <p className="text-sm text-foreground/60">No more batsmen available — innings should end.</p>
                )}
                {availableBatsmen.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleNewBatsmanSelected(p.id, p.name)}
                    className="w-full text-left px-4 py-3 rounded-xl bg-background/60 hover:bg-red-600 hover:text-white transition-colors font-semibold"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bowler picker modal */}
      <AnimatePresence>
        {showBowlerPicker && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-card rounded-3xl p-6 max-w-sm w-full shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-foreground">Select bowler</h3>
                <button onClick={() => setShowBowlerPicker(false)} className="text-foreground/50 hover:text-foreground">
                  ✕
                </button>
              </div>
              <div className="space-y-2">
                {availableBowlers.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleBowlerSelected(p.id, p.name)}
                    className="w-full text-left px-4 py-3 rounded-xl bg-background/60 hover:bg-red-600 hover:text-white transition-colors font-semibold"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
    </>
  );
}