export type MatchStatus = 'LIVE' | 'FINISHED' | 'ABANDONED'| 'UPCOMING';

export interface MatchCardProps {
  team1: string;
  team2: string;
  team1Score?: string;
  team2Score?: string;
  status: 'LIVE' | 'FINISHED' | 'ABANDONED'| 'UPCOMING';
  time?: string;
  venue: string;
  index: number;
  onViewScoreboard?: () => void; // shown to everyone logged in
  onScore?: () => void;          // only passed in for organizers/admins
  scoreLabel?: string;
  onManageAccess?: () => void;   // only for the main organizer / admin
}

export interface Scoreboard {
  team1Runs: number;
  team1Wickets: number;
  team1Overs: number;
  team2Runs: number;
  team2Wickets: number;
  team2Overs: number;
}

/* 🔹 Individual batting performance */
export interface BattingScore {
  playerName: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  dismissal: string; // bowled, caught, not out etc.
}

/* 🔹 Individual bowling performance */
export interface BowlingScore {
  playerName: string;
  overs: number;
  runs: number;
  wickets: number;
  economy: number;
}

/* 🔹 One innings scorecard */
export interface InningsScorecard {
  teamName: string;
  totalRuns: number;
  wickets: number;
  overs: number;
  batting: BattingScore[];
  bowling: BowlingScore[];
}

/* 🔹 Full match scorecard (only for completed matches) */
export interface MatchScorecard {
  innings: InningsScorecard[];
  manOfTheMatch?: string;
  matchResult: string;
}

export interface Match {
  id: number;
  tournamentId: number;
  team1: string;
  team2: string;
  status: MatchStatus;
  time?: string;
  venue: string;

  scoreboard?: Scoreboard;       // live / summary view
  scorecard?: MatchScorecard;    // ONLY when status === "completed"
}

export interface Tournament {
  id: number;
  name: string;
  season: string;
  location: string;
}

export interface Team {
  id: number;
  name: string;
  shortName: string;
}
