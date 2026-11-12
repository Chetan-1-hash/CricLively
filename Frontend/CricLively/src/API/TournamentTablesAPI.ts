import { api } from "./client";

export interface PointsRow {
  position: number;
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  lost: number;
  tied: number;
  noResult: number;
  points: number;
  nrr: number;
  form: string[]; // W, L, T, N
}

export interface LeaderPlayer {
  playerId: string;
  name: string;
  team: string | null;
  matches: number;
  battingInnings: number;
  runs: number;
  balls: number;
  highestScore: number;
  average: number;
  strikeRate: number;
  fours: number;
  sixes: number;
  fifties: number;
  hundreds: number;
  bowlingInnings: number;
  overs: string;
  runsConceded: number;
  wickets: number;
  bestFigures: string;
  economy: number;
  dotBalls: number;
  catches: number;
  stumpings: number;
  runOuts: number;
  runOutAssists: number;
  battingPoints: number;
  bowlingPoints: number;
  fieldingPoints: number;
  mvpPoints: number;
}

export interface LeaderboardData {
  players: LeaderPlayer[];
  mvpRules: string[];
}

export const getPointsTable = (tournamentId: string) => api<PointsRow[]>(`/tournaments/${tournamentId}/points-table`);
export const getLeaderboard = (tournamentId: string) => api<LeaderboardData>(`/tournaments/${tournamentId}/leaderboard`);
