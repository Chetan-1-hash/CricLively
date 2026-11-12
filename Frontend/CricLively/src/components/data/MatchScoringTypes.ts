// MatchScoringTypes.ts
// Shared types for Scorer + ScoreboardViewer.
// Wire these up to your actual MatchEntity/DTOs from the backend later.

export type WicketType =
  | "Bowled"
  | "Caught"
  | "LBW"
  | "Run Out"
  | "Stumped"
  | "Hit Wicket"
  | "Retired Hurt";

export type ExtraType = "Wide" | "No Ball" | "Bye" | "Leg Bye" | "None";

export interface Player {
  id: string;
  name: string;
}

export interface BallEvent {
  id: string;
  overNumber: number; // 1-indexed display over, e.g. 1, 2, 3
  ballInOver: number; // 1-6 (legal deliveries only; extras don't increment this)
  runs: number; // runs off the bat (0 if extra-only ball)
  extraType: ExtraType;
  extraRuns: number;
  isWicket: boolean;
  wicketType?: WicketType;
  outPlayerId?: string;
  fielderId?: string; // caught by / wicketkeeper (stumped) / run out by
  fielderName?: string;
  assistIds?: string[]; // run-out: everybody who helped
  assistNames?: string[];
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  isLegalDelivery: boolean; // false for wide/no-ball
  timestamp: number;
}

export interface BatsmanStats {
  playerId: string;
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  isOnStrike: boolean;
  dismissal?: string; // e.g. "b Smith", "c Khan b Patel", "run out"
}

export interface BowlerStats {
  playerId: string;
  name: string;
  overs: number; // completed overs as float, e.g. 3.4
  ballsThisOver: number;
  maidens: number;
  runsConceded: number;
  wickets: number;
}

export interface InningsState {
  battingTeam: string;
  bowlingTeam: string;
  totalRuns: number;
  totalWickets: number;
  maxWickets?: number; // batters in the playing team minus one (all out); default 10
  totalOvers: number; // completed overs
  ballsInCurrentOver: number; // 0-5
  currentOverNumber: number;
  target?: number; // set when this is the 2nd innings
  batsmen: Record<string, BatsmanStats>;
  bowlers: Record<string, BowlerStats>;
  battingOrder: string[]; // playerIds in order they came in
  strikerId: string;
  nonStrikerId: string;
  currentBowlerId: string;
  balls: BallEvent[];
  isComplete: boolean;
}

export interface MatchScoreState {
  matchId: string;
  teamAName: string;
  teamBName: string;
  innings: InningsState[]; // index 0 = 1st innings, index 1 = 2nd innings
  currentInningsIndex: number;
  maxOvers: number;
  status: "LIVE" | "FINISHED" | "UPCOMING" | "ABANDONED";
}

export const createEmptyBatsman = (playerId: string, name: string): BatsmanStats => ({
  playerId,
  name,
  runs: 0,
  balls: 0,
  fours: 0,
  sixes: 0,
  isOut: false,
  isOnStrike: false,
});

export const createEmptyBowler = (playerId: string, name: string): BowlerStats => ({
  playerId,
  name,
  overs: 0,
  ballsThisOver: 0,
  maidens: 0,
  runsConceded: 0,
  wickets: 0,
});