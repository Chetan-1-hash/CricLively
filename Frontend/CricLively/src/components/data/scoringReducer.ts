// scoringReducer.ts
// Pure reducer for ball-by-ball scoring logic.
// Keeping this separate from the UI means you can unit test it
// and swap in real API calls without touching the rules.

import type {
  BallEvent,
  ExtraType,
  InningsState,
  MatchScoreState,
  WicketType,
} from "./MatchScoringTypes";

export type ScoringAction =
  | {
      type: "RECORD_BALL";
      payload: {
        runs: number;
        extraType: ExtraType;
        extraRuns: number;
        isWicket: boolean;
        wicketType?: WicketType;
        outPlayerId?: string;
        newBatsmanId?: string; // required if isWicket and innings continues
        newBatsmanName?: string;
      };
    }
  | { type: "SWAP_STRIKE" }
  | { type: "SET_BOWLER"; payload: { bowlerId: string; bowlerName: string } }
  | { type: "UNDO_LAST_BALL" }
  | { type: "START_NEXT_INNINGS"; payload: { battingTeam: string; bowlingTeam: string } };

function cloneInnings(innings: InningsState): InningsState {
  return JSON.parse(JSON.stringify(innings));
}

function isLegalDelivery(extraType: ExtraType): boolean {
  return extraType !== "Wide" && extraType !== "No Ball";
}

function applyBallToInnings(
  innings: InningsState,
  ball: Omit<BallEvent, "id" | "overNumber" | "ballInOver" | "timestamp">
): InningsState {
  const next = cloneInnings(innings);
  const legal = ball.isLegalDelivery;

  const striker = next.batsmen[ball.strikerId];
  const bowler = next.bowlers[ball.bowlerId];

  // Runs: bat runs always credited to striker & team.
  // Extra runs (wide/bye/leg-bye/no-ball) credited to team only, not striker,
  // except no-ball runs off the bat still count for the batsman.
  const totalBallRuns = ball.runs + ball.extraRuns;
  next.totalRuns += totalBallRuns;

  if (striker) {
    if (ball.extraType === "None" || ball.extraType === "No Ball") {
      striker.runs += ball.runs;
      if (ball.runs === 4) striker.fours += 1;
      if (ball.runs === 6) striker.sixes += 1;
    }
    // Wide/Bye/LegBye: no bat-runs and ball doesn't count against batsman's strike rate ball count below for wides
  }

  // Ball-faced count: every legal delivery counts as a ball faced,
  // EXCEPT wides (batsman doesn't face a wide). No-balls DO count as faced.
  if (striker && legal) {
    striker.balls += 1;
  } else if (striker && ball.extraType === "No Ball") {
    striker.balls += 1;
  }

  // Bowler figures
  if (bowler) {
    bowler.runsConceded += totalBallRuns;
    if (legal) {
      bowler.ballsThisOver += 1;
      if (bowler.ballsThisOver === 6) {
        bowler.overs = Math.floor(bowler.overs) + 1;
        bowler.ballsThisOver = 0;
      } else {
        bowler.overs = Math.floor(bowler.overs) + bowler.ballsThisOver / 10;
      }
    }
    if (ball.isWicket && ball.wicketType !== "Run Out") {
      bowler.wickets += 1;
    }
  }

  // Wicket handling
  if (ball.isWicket && ball.outPlayerId) {
    next.totalWickets += 1;
    const outBatsman = next.batsmen[ball.outPlayerId];
    if (outBatsman) {
      outBatsman.isOut = true;
      outBatsman.isOnStrike = false;
      outBatsman.dismissal =
        ball.wicketType === "Caught"
          ? `c & b ${bowler?.name ?? ""}`.trim()
          : ball.wicketType === "Bowled"
          ? `b ${bowler?.name ?? ""}`
          : ball.wicketType === "Run Out"
          ? "run out"
          : ball.wicketType ?? "out";
    }
  }

  // Legal delivery progresses the over
  if (legal) {
    next.ballsInCurrentOver += 1;
    if (next.ballsInCurrentOver === 6) {
      next.totalOvers += 1;
      next.ballsInCurrentOver = 0;
      // Strike rotates automatically at end of over (if both batsmen still in)
      const tempStriker = next.strikerId;
      next.strikerId = next.nonStrikerId;
      next.nonStrikerId = tempStriker;
    }
  }

  // Odd runs (1 or 3) rotate strike mid-over — applies to bat runs and byes/leg-byes
  const runsThatRotateStrike =
    ball.extraType === "Bye" || ball.extraType === "Leg Bye" || ball.extraType === "None" || ball.extraType === "No Ball"
      ? ball.runs + (ball.extraType === "Bye" || ball.extraType === "Leg Bye" ? ball.extraRuns : 0)
      : 0;

  if (!ball.isWicket && runsThatRotateStrike % 2 === 1) {
    const tempStriker = next.strikerId;
    next.strikerId = next.nonStrikerId;
    next.nonStrikerId = tempStriker;
  }

  // Reflect on-strike flags
  Object.values(next.batsmen).forEach((b) => (b.isOnStrike = b.playerId === next.strikerId));

  return next;
}

export function scoringReducer(state: MatchScoreState, action: ScoringAction): MatchScoreState {
  const inningsIdx = state.currentInningsIndex;
  const currentInnings = state.innings[inningsIdx];

  switch (action.type) {
    case "RECORD_BALL": {
      const { runs, extraType, extraRuns, isWicket, wicketType, outPlayerId, newBatsmanId, newBatsmanName } =
        action.payload;
      const legal = isLegalDelivery(extraType);

      const updatedInnings = applyBallToInnings(currentInnings, {
        runs,
        extraType,
        extraRuns,
        isWicket,
        wicketType,
        outPlayerId,
        strikerId: currentInnings.strikerId,
        nonStrikerId: currentInnings.nonStrikerId,
        bowlerId: currentInnings.currentBowlerId,
        isLegalDelivery: legal,
      });

      // Log the ball event
      const ballEvent: BallEvent = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        overNumber: updatedInnings.ballsInCurrentOver === 0 && legal ? updatedInnings.totalOvers : updatedInnings.totalOvers + 1,
        ballInOver: legal ? (updatedInnings.ballsInCurrentOver === 0 ? 6 : updatedInnings.ballsInCurrentOver) : updatedInnings.ballsInCurrentOver + 1,
        runs,
        extraType,
        extraRuns,
        isWicket,
        wicketType,
        outPlayerId,
        strikerId: currentInnings.strikerId,
        nonStrikerId: currentInnings.nonStrikerId,
        bowlerId: currentInnings.currentBowlerId,
        isLegalDelivery: legal,
        timestamp: Date.now(),
      };
      updatedInnings.balls = [...currentInnings.balls, ballEvent];

      // New batsman comes in after a wicket (if provided)
      if (isWicket && outPlayerId && newBatsmanId && newBatsmanName) {
        updatedInnings.batsmen[newBatsmanId] = {
          playerId: newBatsmanId,
          name: newBatsmanName,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          isOut: false,
          isOnStrike: outPlayerId === updatedInnings.strikerId,
        };
        updatedInnings.battingOrder.push(newBatsmanId);
        if (outPlayerId === currentInnings.strikerId) {
          updatedInnings.strikerId = newBatsmanId;
        } else {
          updatedInnings.nonStrikerId = newBatsmanId;
        }
        Object.values(updatedInnings.batsmen).forEach(
          (b) => (b.isOnStrike = b.playerId === updatedInnings.strikerId)
        );
      }

      // Auto-complete innings if overs are up or all out
      const allOut = updatedInnings.totalWickets >= 10;
      const oversUp = updatedInnings.totalOvers >= state.maxOvers;
      updatedInnings.isComplete = allOut || oversUp;

      const newInningsArr = [...state.innings];
      newInningsArr[inningsIdx] = updatedInnings;

      return { ...state, innings: newInningsArr };
    }

    case "SWAP_STRIKE": {
      const updated = cloneInnings(currentInnings);
      const temp = updated.strikerId;
      updated.strikerId = updated.nonStrikerId;
      updated.nonStrikerId = temp;
      Object.values(updated.batsmen).forEach((b) => (b.isOnStrike = b.playerId === updated.strikerId));
      const arr = [...state.innings];
      arr[inningsIdx] = updated;
      return { ...state, innings: arr };
    }

    case "SET_BOWLER": {
      const updated = cloneInnings(currentInnings);
      const { bowlerId, bowlerName } = action.payload;
      if (!updated.bowlers[bowlerId]) {
        updated.bowlers[bowlerId] = {
          playerId: bowlerId,
          name: bowlerName,
          overs: 0,
          ballsThisOver: 0,
          maidens: 0,
          runsConceded: 0,
          wickets: 0,
        };
      }
      updated.currentBowlerId = bowlerId;
      const arr = [...state.innings];
      arr[inningsIdx] = updated;
      return { ...state, innings: arr };
    }

    case "UNDO_LAST_BALL": {
      // Simplified undo: drop the last ball event and recompute innings from scratch.
      const updated = cloneInnings(currentInnings);
      if (updated.balls.length === 0) return state;
      updated.balls = updated.balls.slice(0, -1);
      // NOTE: full recompute-from-balls is left as a TODO for when this is wired
      // to real persistence; for now this just trims the log so the UI can warn the scorer.
      const arr = [...state.innings];
      arr[inningsIdx] = updated;
      return { ...state, innings: arr };
    }

    case "START_NEXT_INNINGS": {
      const { battingTeam, bowlingTeam } = action.payload;
      const newInnings: InningsState = {
        battingTeam,
        bowlingTeam,
        totalRuns: 0,
        totalWickets: 0,
        totalOvers: 0,
        ballsInCurrentOver: 0,
        currentOverNumber: 1,
        target: state.innings[0]?.totalRuns ? state.innings[0].totalRuns + 1 : undefined,
        batsmen: {},
        bowlers: {},
        battingOrder: [],
        strikerId: "",
        nonStrikerId: "",
        currentBowlerId: "",
        balls: [],
        isComplete: false,
      };
      return {
        ...state,
        innings: [...state.innings, newInnings],
        currentInningsIndex: state.innings.length,
      };
    }

    default:
      return state;
  }
}