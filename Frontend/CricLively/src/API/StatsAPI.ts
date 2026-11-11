import { api } from "./client";

export interface StatLine {
  matches: number;
  battingInnings: number;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  highestScore: number;
  notOuts: number;
  fifties: number;
  hundreds: number;
  average: number;
  strikeRate: number;
  bowlingInnings: number;
  ballsBowled: number;
  overs: string;
  runsConceded: number;
  wickets: number;
  bestFigures: string;
  economy: number;
}

export interface TournamentStats {
  tournamentId: string | null;
  tournamentName: string;
  stats: StatLine;
}

export interface PersonalStats {
  playerName: string | null;
  overall: StatLine;
  tournaments: TournamentStats[];
}

export const getMyStats = () => api<PersonalStats>("/stats/me");
