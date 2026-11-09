// Turns what the server stores (balls) into the screen state, and the other way round.
// The server keeps ONLY the balls. The score on screen is rebuilt by replaying them
// through the same scoringReducer the scorer uses, so a page refresh can never
// show a different score than the one the scorer saw.

import type { ApiBall, ApiInnings, ScoreboardResponse } from "../API/ScoringAPI";
import { createEmptyBatsman, createEmptyBowler } from "../components/data/MatchScoringTypes";
import type {
  BallEvent,
  ExtraType,
  InningsState,
  MatchScoreState,
  WicketType,
} from "../components/data/MatchScoringTypes";
import { scoringReducer } from "../components/data/scoringReducer";

const EXTRA_TO_API: Record<Exclude<ExtraType, "None">, string> = {
  Wide: "Wide",
  "No Ball": "NoBall",
  Bye: "Bye",
  "Leg Bye": "LegBye",
};
const EXTRA_FROM_API: Record<string, ExtraType> = {
  Wide: "Wide",
  NoBall: "No Ball",
  Bye: "Bye",
  LegBye: "Leg Bye",
};
const WICKET_TO_API: Record<WicketType, string> = {
  Bowled: "BOWLED",
  Caught: "CAUGHT",
  LBW: "LBW",
  "Run Out": "RUNOUT",
  Stumped: "STUMPED",
  "Hit Wicket": "HITWICKET",
  "Retired Hurt": "RETIRED_HURT",
};
const WICKET_FROM_API: Record<string, WicketType> = {
  BOWLED: "Bowled",
  CAUGHT: "Caught",
  CAUGHT_BOWLED: "Caught",
  LBW: "LBW",
  RUNOUT: "Run Out",
  STUMPED: "Stumped",
  HITWICKET: "Hit Wicket",
  RETIRED_HURT: "Retired Hurt",
};

/** One ball made by the scorer -> the JSON the server stores. */
export function toApiBall(inningsNo: 1 | 2, b: BallEvent, newBatsmanId?: string): ApiBall {
  return {
    inningsNo,
    overNo: b.overNumber,
    ballNo: b.ballInOver,
    strikerId: b.strikerId,
    nonStrikerId: b.nonStrikerId,
    bowlerId: b.bowlerId,
    runsBatsman: b.runs,
    runsExtra: b.extraRuns,
    extraType: b.extraType === "None" ? null : EXTRA_TO_API[b.extraType],
    wicket: b.isWicket
      ? {
          playerOutId: b.outPlayerId ?? null,
          outType: WICKET_TO_API[b.wicketType ?? "Bowled"],
          bowlerId: b.wicketType === "Run Out" ? null : b.bowlerId,
          isBowlerCredit: b.wicketType !== "Run Out" && b.wicketType !== "Retired Hurt",
        }
      : null,
    newBatsmanId: newBatsmanId ?? null,
  };
}

function buildInnings(
  sb: ScoreboardResponse,
  api: ApiInnings,
  balls: ApiBall[],
  target?: number
): InningsState {
  const name = (id: string) => sb.playerNames[id] ?? "Player";
  const teamName = (id: string) => (id === sb.teamAId ? sb.teamAName : sb.teamBName);
  const s = api.currentStrikerId;
  const n = api.currentNonStrikerId;
  const bw = api.currentBowlerId;

  const start: InningsState = {
    battingTeam: teamName(api.battingTeamId),
    bowlingTeam: teamName(api.bowlingTeamId),
    totalRuns: 0,
    totalWickets: 0,
    totalOvers: 0,
    ballsInCurrentOver: 0,
    currentOverNumber: 1,
    target,
    batsmen: {
      [s]: { ...createEmptyBatsman(s, name(s)), isOnStrike: true },
      [n]: createEmptyBatsman(n, name(n)),
    },
    bowlers: { [bw]: createEmptyBowler(bw, name(bw)) },
    battingOrder: [s, n],
    strikerId: s,
    nonStrikerId: n,
    currentBowlerId: bw,
    balls: [],
    isComplete: false,
  };

  let st: MatchScoreState = {
    matchId: sb.matchId,
    teamAName: sb.teamAName,
    teamBName: sb.teamBName,
    innings: [start],
    currentInningsIndex: 0,
    maxOvers: sb.oversPerInnings ?? 20,
    status: sb.matchStatus,
  };

  for (const b of balls) {
    if (b.bowlerId !== st.innings[0].currentBowlerId) {
      st = scoringReducer(st, {
        type: "SET_BOWLER",
        payload: { bowlerId: b.bowlerId, bowlerName: name(b.bowlerId) },
      });
    }
    st = scoringReducer(st, {
      type: "RECORD_BALL",
      payload: {
        runs: b.runsBatsman ?? 0,
        extraType: b.extraType ? EXTRA_FROM_API[b.extraType] ?? "None" : "None",
        extraRuns: b.runsExtra ?? 0,
        isWicket: !!b.wicket,
        wicketType: b.wicket ? WICKET_FROM_API[b.wicket.outType] ?? "Bowled" : undefined,
        outPlayerId: b.wicket?.playerOutId ?? undefined,
        newBatsmanId: b.newBatsmanId ?? undefined,
        newBatsmanName: b.newBatsmanId ? name(b.newBatsmanId) : undefined,
      },
    });
  }
  return st.innings[0];
}

/** Everything the server knows -> the state the Scorer and Scoreboard pages draw. */
export function buildScoreState(sb: ScoreboardResponse): MatchScoreState {
  const innings: InningsState[] = [];
  if (sb.innings1) innings.push(buildInnings(sb, sb.innings1, sb.balls1 ?? []));
  if (sb.innings2) {
    innings.push(buildInnings(sb, sb.innings2, sb.balls2 ?? [], (sb.innings1?.totalRuns ?? 0) + 1));
  }
  return {
    matchId: sb.matchId,
    teamAName: sb.teamAName,
    teamBName: sb.teamBName,
    innings,
    currentInningsIndex: Math.max(innings.length - 1, 0),
    maxOvers: sb.oversPerInnings ?? 20,
    status: sb.matchStatus,
  };
}
