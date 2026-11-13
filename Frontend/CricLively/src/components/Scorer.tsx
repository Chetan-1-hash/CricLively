import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "../hooks/use-toast";
import {
  finishMatch,
  getScoreboard,
  postBall,
  undoLastBall,
  getAccess,
  type MatchAccess,
  type ScoreboardResponse,
} from "../API/ScoringAPI";
import { buildScoreState, toApiBall } from "../lib/scoreAdapter";
import type { ExtraType, WicketType } from "./data/MatchScoringTypes";
import { scoringReducer } from "./data/scoringReducer";
import Navbar from "./Navbar";
import { PageSpinner } from "./Spinner";
import { InningsSetupPanel, TossPanel } from "./ScorerSetup";
import LineupPanel from "./LineupPanel";
import { useLiveUpdates } from "../lib/useLiveUpdates";
import { describeResult } from "../lib/matchResult";
import ScorerAccessDialog from "./ScorerAccessDialog";

const WICKET_TYPES: WicketType[] = ["Bowled", "Caught", "LBW", "Run Out", "Stumped", "Hit Wicket", "Retired Hurt"];
const EXTRA_TYPES: ExtraType[] = ["None", "Wide", "No Ball", "Bye", "Leg Bye"];
const RUN_OPTIONS = [0, 1, 2, 3, 4, 5, 6];

// Page frame used by the set-up screens (toss, innings, finish)
function Shell({ title, subtitle, onExit, matchId, canManage, children }: {
  title: string;
  subtitle?: string;
  onExit: () => void;
  matchId?: string;
  canManage?: boolean;
  children: React.ReactNode;
}) {
  const [showAccess, setShowAccess] = useState(false);
  return (
    <>
      <Navbar />
      <section className="min-h-[100vh] py-12 bg-background/80">
        <div className="container my-8 mx-auto px-4 sm:px-6 max-w-3xl">
          <div className="flex justify-between items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-foreground">{title}</h1>
              {subtitle && <p className="text-sm text-foreground/70 mt-1">{subtitle}</p>}
            </div>
            <div className="flex gap-2">
              {canManage && matchId && (
                <button
                  onClick={() => setShowAccess(true)}
                  className="px-4 py-2 rounded-full bg-red-600 text-white text-sm font-semibold"
                >
                  Scoring access
                </button>
              )}
              <button
                onClick={onExit}
                className="px-4 py-2 rounded-full bg-card/80 text-foreground/80 text-sm font-semibold hover:bg-card transition-colors"
              >
                Exit
              </button>
            </div>
          </div>
          {children}
        </div>
      </section>
      {showAccess && matchId && <ScorerAccessDialog matchId={matchId} onClose={() => setShowAccess(false)} />}
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
  const [access, setAccess] = useState<MatchAccess | null>(null); // may I score? may I give access?
  const [showAccess, setShowAccess] = useState(false);
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
  const [startedSecond, setStartedSecond] = useState(false); // the scorer agreed to start the 2nd innings
  const [fielderId, setFielderId] = useState(""); // caught by / stumped by / run out by
  const [assistIds, setAssistIds] = useState<string[]>([]); // run-out helpers (several allowed)

  const load = useCallback(async () => {
    if (!matchId) return;
    try {
      setSb(await getScoreboard(matchId));
      getAccess(matchId).then(setAccess).catch(() => undefined);
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

  // another scorer / the main organizer changed something: show it without a refresh
  useLiveUpdates(matchId ?? "", load);

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
    setFielderId("");
    setAssistIds([]);
  };

  // When an over is finished (and the match goes on), open the "Select bowler" window by itself.
  // It opens once per over: closing it, or choosing a bowler, does not bring it back until the next over.
  const askedAtBall = useRef<string>("");
  useEffect(() => {
    if (!base || sb?.matchStatus !== "LIVE" || base.innings.length === 0) return;
    const inn = base.innings[base.currentInningsIndex];
    if (inn.isComplete || inn.balls.length === 0 || inn.ballsInCurrentOver !== 0) return;
    const key = `${base.currentInningsIndex}:${inn.balls.length}`;
    if (askedAtBall.current === key) return;
    askedAtBall.current = key;
    setShowBowlerPicker(true);
  }, [base, sb?.matchStatus]);

  const exit = () => navigate(-1);

  if (loading || !sb) {
    return (
      <PageSpinner label="Loading scorer…" />
    );
  }

  // ---------- no scoring access ----------
  if (access && !access.canScore) {
    return (
      <Shell matchId={sb.matchId} canManage={access?.canManage} title="Scorer" subtitle={`${sb.teamAName} vs ${sb.teamBName}`} onExit={exit}>
        <div className="bg-card/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl text-center space-y-3">
          <p className="text-foreground font-semibold">You do not have scoring access for this match.</p>
          <p className="text-sm text-foreground/70">
            {access.ownerName
              ? `Ask ${access.ownerName}, the main organizer, to give you access.`
              : "Ask the organizer of this match to give you access."}
          </p>
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

  // ---------- set-up screens ----------
  if (sb.matchStatus === "UPCOMING") {
    return (
      <Shell matchId={sb.matchId} canManage={access?.canManage} title="Scorer" subtitle={`${sb.teamAName} vs ${sb.teamBName}`} onExit={exit}>
        <TossPanel sb={sb} onDone={load} />
      </Shell>
    );
  }

  if (sb.matchStatus === "FINISHED" || sb.matchStatus === "ABANDONED") {
    return (
      <Shell matchId={sb.matchId} canManage={access?.canManage} title="Scorer" subtitle={`${sb.teamAName} vs ${sb.teamBName}`} onExit={exit}>
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

  // step 2: who plays today
  if ((sb.playingA ?? []).length === 0 || (sb.playingB ?? []).length === 0) {
    return (
      <Shell matchId={sb.matchId} canManage={access?.canManage} title="Scorer" subtitle={`${sb.teamAName} vs ${sb.teamBName}`} onExit={exit}>
        <LineupPanel sb={sb} onDone={load} />
      </Shell>
    );
  }

  if (!state || state.innings.length === 0) {
    return (
      <Shell matchId={sb.matchId} canManage={access?.canManage} title="Scorer" subtitle={`${sb.teamAName} vs ${sb.teamBName}`} onExit={exit}>
        <InningsSetupPanel sb={sb} inningsNo={1} onDone={load} />
      </Shell>
    );
  }

  const innings = state.innings[state.currentInningsIndex];

  if (innings.isComplete) {
    if (state.currentInningsIndex === 0 && !sb.innings2) {
      return (
        <Shell matchId={sb.matchId} canManage={access?.canManage} title="Scorer" subtitle="1st innings completed" onExit={exit}>
          {startedSecond ? (
            <InningsSetupPanel sb={sb} inningsNo={2} onDone={load} />
          ) : (
            <div className="bg-card/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl text-center space-y-4">
              <p className="text-xs font-bold tracking-wide text-foreground/60">INNINGS 1 COMPLETED</p>
              <p className="text-3xl font-extrabold text-foreground">
                {innings.battingTeam} {innings.totalRuns}/{innings.totalWickets}
              </p>
              <p className="text-foreground/70">
                in {innings.totalOvers}.{innings.ballsInCurrentOver} overs
              </p>
              <p className="rounded-xl bg-accent/20 px-4 py-3 text-sm font-semibold text-foreground">
                {innings.bowlingTeam} need {innings.totalRuns + 1} runs from {state.maxOvers * 6} balls to win
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <button
                  onClick={() => setStartedSecond(true)}
                  className="px-6 py-2.5 bg-red-600 text-white rounded-full font-semibold"
                >
                  Start 2nd innings
                </button>
                <button
                  onClick={async () => {
                    if (!matchId) return;
                    try {
                      await undoLastBall(matchId, 1);
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
          )}
        </Shell>
      );
    }
    return (
      <Shell matchId={sb.matchId} canManage={access?.canManage} title="Scorer" subtitle="Innings complete" onExit={exit}>
        <div className="bg-card/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl text-center space-y-4">
          <p className="text-foreground">
            {innings.battingTeam}: {innings.totalRuns}/{innings.totalWickets} in {innings.totalOvers}.
            {innings.ballsInCurrentOver} overs
          </p>
          {describeResult(state) && <p className="text-lg font-bold text-foreground">{describeResult(state)}</p>}
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
  // only players picked for today's match
  const battingSquad = inningsApi?.battingTeamId === sb.teamAId ? sb.playingA : sb.playingB;
  const bowlingSquad = inningsApi?.bowlingTeamId === sb.teamAId ? sb.playingA : sb.playingB;
  const nameOf = (id: string) => sb.playerNames[id] ?? "Player";
  const availableBatsmen = battingSquad
    .filter((id) => !innings.battingOrder.includes(id))
    .map((id) => ({ id, name: nameOf(id) }));
  const availableBowlers = bowlingSquad.map((id) => ({ id, name: nameOf(id) }));
  // who can take a catch / stumping / run-out: the fielding team's playing XI
  const fielders = bowlingSquad.map((id) => ({ id, name: nameOf(id) }));
  const needsFielder = isWicket && (wicketType === "Caught" || wicketType === "Stumped" || wicketType === "Run Out");
  const fielderLabel =
    wicketType === "Caught" ? "Caught by" : wicketType === "Stumped" ? "Stumped by (wicketkeeper)" : "Run out by";

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
        fielderId: needsFielder ? fielderId : undefined,
        fielderName: needsFielder && fielderId ? nameOf(fielderId) : undefined,
        assistIds: needsFielder && wicketType === "Run Out" ? assistIds : undefined,
        assistNames: needsFielder && wicketType === "Run Out" ? assistIds.map(nameOf) : undefined,
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
      toast({ title: "Select who's out", variant: "destructive", description: "Choose the dismissed batter first." });
      return;
    }
    if (needsFielder && !fielderId) {
      toast({ title: `Select who: ${fielderLabel}`, variant: "destructive", description: "The fielder is needed for the MVP points." });
      return;
    }
    // a wicket needs the next batsman first, and the ball is saved ONCE when he is picked
    // (even when only ONE batter is left to come in; no picker only when this wicket ends the innings)
    if (isWicket && innings.totalWickets + 1 < (innings.maxWickets ?? 10) && availableBatsmen.length > 0) {
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
      <div className="container my-8 mx-auto px-4 sm:px-6 relative max-w-3xl">
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
          <div className="flex gap-2">
            {access?.canManage && (
              <button
                onClick={() => setShowAccess(true)}
                className="px-4 py-2 rounded-full bg-red-600 text-white text-sm font-semibold"
              >
                Scoring access
              </button>
            )}
            <button
              onClick={exit}
              className="px-4 py-2 rounded-full bg-card/80 text-foreground/80 text-sm font-semibold hover:bg-card transition-colors"
            >
              Exit
            </button>
          </div>
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
              Over complete — choose the bowler for the next over (use Change).
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
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-5">
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
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2 mb-5">
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
                      onClick={() => {
                        setWicketType(wt);
                        setFielderId("");
                        setAssistIds([]);
                      }}
                      className={`py-2 rounded-xl text-xs font-semibold transition-colors ${
                        wicketType === wt ? "bg-accent text-accent-foreground" : "bg-background/60 text-foreground/80"
                      }`}
                    >
                      {wt}
                    </button>
                  ))}
                </div>

                {needsFielder && (
                  <div className="mt-4">
                    <p className="text-sm text-foreground/70 mb-2">{fielderLabel}</p>
                    <div className="flex flex-wrap gap-2">
                      {fielders.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setFielderId(p.id);
                            setAssistIds((list) => list.filter((x) => x !== p.id));
                          }}
                          className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                            fielderId === p.id ? "bg-red-600 text-white" : "bg-background/60 text-foreground/80"
                          }`}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>

                    {wicketType === "Run Out" && (
                      <>
                        <p className="text-sm text-foreground/70 mt-4 mb-2">Also helped in the run-out (pick all who did)</p>
                        <div className="flex flex-wrap gap-2">
                          {fielders
                            .filter((p) => p.id !== fielderId)
                            .map((p) => (
                              <button
                                key={p.id}
                                onClick={() =>
                                  setAssistIds((list) =>
                                    list.includes(p.id) ? list.filter((x) => x !== p.id) : [...list, p.id]
                                  )
                                }
                                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                                  assistIds.includes(p.id) ? "bg-accent text-accent-foreground" : "bg-background/60 text-foreground/80"
                                }`}
                              >
                                {p.name}
                              </button>
                            ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
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
              className="bg-card rounded-3xl p-6 max-w-sm w-full max-h-[85vh] overflow-y-auto shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-foreground">Next batter in</h3>
                <button onClick={() => setShowNewBatsmanPicker(false)} className="text-foreground/50 hover:text-foreground">
                  ✕
                </button>
              </div>
              <div className="space-y-2">
                {availableBatsmen.length === 0 && (
                  <p className="text-sm text-foreground/60">No more batters available — innings should end.</p>
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
              className="bg-card rounded-3xl p-6 max-w-sm w-full max-h-[85vh] overflow-y-auto shadow-2xl"
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
    {showAccess && <ScorerAccessDialog matchId={sb.matchId} onClose={() => setShowAccess(false)} />}
    </>
  );
}