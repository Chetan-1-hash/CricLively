export type TournamentStatus = "UPCOMING" | "LIVE" | "COMPLETED" | "FINISHED" | "ABANDONED";

export class TournamentEntity {
  id!: string;
  name!: string;
  coverImage!: string;
  format!: string;
  startDate!: string;
  endDate!: string;
  oversPerInnings!: number;
  tournamentStatus!: TournamentStatus;
  teamIds: string[] = [];
  pointsTableEntry: PointsTableEntry[] = [];
}

export interface PointsTableEntry {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  lost: number;
  tied: number;
  noResult: number;
  points: number;
  netRunRate: number;
  recentPlayedStats: string[];
}

export class TournamentResponse {
  id!: string;
  name!: string;
  coverImage!: string;
  startDate!: string;
  endDate!: string;
  venue!: string;
  tournamentStatus!: TournamentStatus;
  teamIds: string[] = [];
  originalEndDate?: string;
  finished?: boolean; // today is after endDate
  canExtend?: boolean; // may I extend it?
  extensions?: TournamentExtensionInfo[];
}

export interface TournamentExtensionInfo {
  previousEndDate: string;
  newEndDate: string;
  reason: string;
  extendedByName?: string;
  extendedAt?: string;
}
