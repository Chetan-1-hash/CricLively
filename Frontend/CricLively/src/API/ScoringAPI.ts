import { api } from "./client";

// Real calls to the Spring Boot scoring endpoints (see ScoringController.java).
// READ  (any logged-in person): getScoreboard
// WRITE (organizer / admin only, the server checks): everything else

export interface ApiWicket {
  playerOutId: string | null;
  outType: string; // BOWLED, CAUGHT, LBW, RUNOUT, STUMPED, HITWICKET, RETIRED_HURT
  bowlerId: string | null;
  fielderId?: string | null; // caught by / stumped by / run out by
  assistFielderIds?: string[]; // run-out helpers
  isBowlerCredit: boolean;
}

export interface ApiBall {
  id?: string;
  seq?: number;
  inningsNo: number;
  overNo: number;
  ballNo: number;
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  runsBatsman: number;
  runsExtra: number;
  extraType: string | null; // Wide, NoBall, Bye, LegBye or null
  wicket: ApiWicket | null;
  newBatsmanId?: string | null;
}

export interface ApiInnings {
  inningsNumber: number;
  battingTeamId: string;
  bowlingTeamId: string;
  totalRuns: number;
  wicketsLost: number;
  oversCompleted: number;
  totalExtras: number;
  currentStrikerId: string; // the two openers (never changes during the innings)
  currentNonStrikerId: string;
  currentBowlerId: string; // the opening bowler
  isCompleted: boolean;
}

export interface ApiToss {
  winnerId: string;
  decision: "BATTING" | "BOWLING";
}

export interface ScoreboardResponse {
  matchId: string;
  tournamentId: string | null;
  venue: string | null;
  date: string | null;
  time: string | null;
  oversPerInnings: number | null;
  matchStatus: "UPCOMING" | "LIVE" | "FINISHED" | "ABANDONED";
  matchType: string | null;
  teamAId: string;
  teamAName: string;
  teamBId: string;
  teamBName: string;
  squadA: string[];
  squadB: string[];
  playingA: string[]; // who plays today
  playingB: string[];
  playerNames: Record<string, string>;
  playerVerified?: Record<string, boolean>;
  playerMatchesPlayed?: Record<string, number>;
  toss: ApiToss | null;
  innings1: ApiInnings | null;
  innings2: ApiInnings | null;
  balls1: ApiBall[];
  balls2: ApiBall[];
}

export const getScoreboard = (matchId: string) =>
  api<ScoreboardResponse>(`/matches/${matchId}/scoreboard`);

export const startToss = (matchId: string, toss: ApiToss) =>
  api(`/matches/${matchId}/toss`, { method: "POST", body: toss });

export const startInnings = (
  matchId: string,
  inningsNo: 1 | 2,
  innings: Pick<ApiInnings, "battingTeamId" | "bowlingTeamId" | "currentStrikerId" | "currentNonStrikerId" | "currentBowlerId">
) => api(`/matches/${matchId}/innings${inningsNo}`, { method: "POST", body: innings });

export const postBall = (matchId: string, ball: ApiBall) =>
  api<ApiBall>(`/matches/${matchId}/balls`, { method: "POST", body: ball });

export const undoLastBall = (matchId: string, inningsNo: number) =>
  api(`/matches/${matchId}/balls/last?inningsNo=${inningsNo}`, { method: "DELETE" });

export const finishMatch = (matchId: string) =>
  api(`/matches/${matchId}/finish`, { method: "POST" });

export const abandonMatch = (matchId: string) =>
  api(`/matches/${matchId}/abandon`, { method: "POST" });

export const setLineup = (matchId: string, teamA: string[], teamB: string[]) =>
  api(`/matches/${matchId}/lineup`, { method: "POST", body: { teamA, teamB } });

export interface AccessPerson {
  profileId: string;
  name: string;
  email: string;
}

export interface MatchAccess {
  canScore: boolean;
  canManage: boolean;
  ownerId: string | null;
  ownerName: string | null;
  scorers: AccessPerson[];
  tournamentOrganizers: AccessPerson[];
}

export const getAccess = (matchId: string) => api<MatchAccess>(`/matches/${matchId}/access`);

export const setScorers = (matchId: string, profileIds: string[]) =>
  api<MatchAccess>(`/matches/${matchId}/scorers`, { method: "PUT", body: { profileIds } });
